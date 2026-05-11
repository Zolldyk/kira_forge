import { generateLink } from '@/lib/kirapay-client'

export async function POST(req: Request) {
  try {
    const { amount, sessionId } = await req.json()
    const result = await generateLink(amount, sessionId)
    return Response.json({ data: result })
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return Response.json({ error: 'Link generation timed out', retryable: true }, { status: 422 })
    }
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return Response.json({ error: message, retryable: true }, { status: 500 })
  }
}
