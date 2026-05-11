import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_PROMPT } from './system-prompt'
import { type Message } from '@/types'

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function streamChat(messages: Message[]): Promise<ReadableStream> {
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]
  const chat = model.startChat({ history })
  const result = await chat.sendMessageStream(lastMessage.content)

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const timeout = setTimeout(() => {
        controller.error(new Error('Stream timeout'))
      }, 30_000)

      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      } finally {
        clearTimeout(timeout)
      }
    },
  })
}
