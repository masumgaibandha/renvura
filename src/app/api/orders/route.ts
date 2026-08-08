import { NextResponse, type NextRequest } from 'next/server';
import { createOrder } from '@/lib/checkout/order-service';
import { ORDER_RATE_LIMIT, consumeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Order creation — the one write path full checkout and the express COD
 * modal both call (§11, §16, §30). All the business logic lives in
 * `createOrder()`; this route only adds what is specific to being an HTTP
 * endpoint — reading the client's IP and applying the rate limit before any
 * validation or database work runs.
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
    const rateLimit = await consumeRateLimit(ORDER_RATE_LIMIT, clientIdentifier(request));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, code: 'rateLimit', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { 'retry-after': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const result = await createOrder(payload);

    if (result.ok) {
      return NextResponse.json({ ok: true, orderNumber: result.order.orderNumber }, { status: 201 });
    }

    if (result.code === 'validation') {
      return NextResponse.json({ ok: false, code: 'validation', fieldErrors: result.fieldErrors }, { status: 400 });
    }

    if (result.code === 'itemsRejected') {
      return NextResponse.json({ ok: false, code: 'itemsRejected', rejections: result.rejections }, { status: 409 });
    }

    return NextResponse.json({ ok: false, code: 'server' }, { status: 503 });
  } catch (error) {
    console.error('[orders] request failed', error);
    return NextResponse.json({ ok: false, code: 'server' }, { status: 503 });
  }
}
