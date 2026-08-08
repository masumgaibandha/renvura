import { NextResponse, type NextRequest } from 'next/server';
import { trackOrder } from '@/lib/checkout/order-service';
import { TRACK_RATE_LIMIT, consumeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Order tracking lookup — §15, §22. POST, not GET: an order number and a
 * phone number are personal data and must not end up in server access logs
 * or browser history as a query string.
 */
function clientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'validation' }, { status: 400 });
  }

  try {
    const rateLimit = await consumeRateLimit(TRACK_RATE_LIMIT, clientIdentifier(request));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, code: 'rateLimit', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { 'retry-after': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const result = await trackOrder(payload);

    if (result.ok) {
      return NextResponse.json({ ok: true, order: result.order }, { status: 200 });
    }

    if (result.code === 'validation') {
      return NextResponse.json({ ok: false, code: 'validation', fieldErrors: result.fieldErrors }, { status: 400 });
    }

    if (result.code === 'notFound') {
      return NextResponse.json({ ok: false, code: 'notFound' }, { status: 404 });
    }

    return NextResponse.json({ ok: false, code: 'server' }, { status: 503 });
  } catch (error) {
    console.error('[track] request failed', error);
    return NextResponse.json({ ok: false, code: 'server' }, { status: 503 });
  }
}
