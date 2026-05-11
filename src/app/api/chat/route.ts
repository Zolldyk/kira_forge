import { streamChat } from '@/lib/gemini-client'
import { type Message } from '@/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = body?.messages as Message[] | undefined
    const sessionId = body?.sessionId as string | undefined // accepted, unused until rate-limiting (NFR-S7)

    void sessionId

    if (!messages?.length) {
      return Response.json({ error: 'messages required', retryable: false }, { status: 400 })
    }

    const stream = await streamChat(messages)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return Response.json({ error: message, retryable: true }, { status: 500 })
  }
}
