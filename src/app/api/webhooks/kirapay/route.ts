import { createHmac, timingSafeEqual } from 'node:crypto'

export async function POST(req: Request) {
  try {
    const sig = req.headers.get('x-kirapay-signature')
    const body = await req.text()

    if (!sig) {
      return new Response(null, { status: 401 })
    }

    const expected = createHmac('sha256', process.env.KIRAPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    // timingSafeEqual requires same-length Buffers — mismatched length on a bad sig would throw
    const sigBuf = Buffer.from(sig, 'hex')
    const expBuf = Buffer.from(expected, 'hex')

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return new Response(null, { status: 401 })
    }

    return Response.json({ data: { received: true } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return Response.json({ error: message, retryable: true }, { status: 500 })
  }
}
