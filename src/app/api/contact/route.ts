import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { sendContactNotification } from '@/lib/email';
import { ContactSubmission } from '@/lib/models/ContactSubmission';
import { CONTACT_RATE_LIMIT, consumeRateLimit } from '@/lib/rate-limit';
import {
  HONEYPOT_FIELD,
  checkAntiSpam,
  contactFormSchema,
  fieldErrorsFrom,
} from '@/lib/validation/contact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, code: 'validation' }, { status: 400 });
  }

  // 1. Anti-spam first: it costs nothing and needs no database.
  const antiSpam = checkAntiSpam({
    honeypot: typeof payload[HONEYPOT_FIELD] === 'string' ? payload[HONEYPOT_FIELD] : undefined,
    startedAt: typeof payload.startedAt === 'number' ? payload.startedAt : undefined,
    now: Date.now(),
  });

  if (!antiSpam.ok) {
    // Deliberately vague: telling a bot which check it failed helps it.
    console.warn(`[contact] rejected submission (${antiSpam.reason})`);
    return NextResponse.json({ ok: false, code: 'rejected' }, { status: 400 });
  }

  try {
    // 2. Persistent, shared-state rate limit before any write.
    const rateLimit = await consumeRateLimit(CONTACT_RATE_LIMIT, clientIdentifier(request));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, code: 'rateLimit', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { 'retry-after': String(rateLimit.retryAfterSeconds) } },
      );
    }

    // 3. Validate.
    const parsed = contactFormSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: 'validation', fieldErrors: fieldErrorsFrom(parsed.error) },
        { status: 400 },
      );
    }

    // 4. Persist. The stored document is authoritative.
    await connectToDatabase();
    const submission = await ContactSubmission.create({
      ...parsed.data,
      status: 'new',
      userAgent: request.headers.get('user-agent')?.slice(0, 512),
    });

    // 5. Notify. Best-effort only — a delivery failure must not lose the enquiry.
    try {
      const result = await sendContactNotification({
        id: String(submission._id),
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        locale: parsed.data.locale,
        receivedAt: new Date(),
      });

      await ContactSubmission.updateOne(
        { _id: submission._id },
        result.delivered
          ? { $set: { notifiedAt: new Date() } }
          : { $set: { notificationError: result.error ?? `not delivered (${result.provider})` } },
      );
    } catch (error) {
      console.error('[contact] notification failed', error);
      await ContactSubmission.updateOne(
        { _id: submission._id },
        { $set: { notificationError: error instanceof Error ? error.message : 'unknown' } },
      ).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, id: String(submission._id) }, { status: 201 });
  } catch (error) {
    console.error('[contact] submission failed', error);
    return NextResponse.json({ ok: false, code: 'server' }, { status: 503 });
  }
}
