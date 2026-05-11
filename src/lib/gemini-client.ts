import { GoogleGenAI } from '@google/genai'
import { SYSTEM_PROMPT } from './system-prompt'
import { type Message } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function streamChat(messages: Message[]): Promise<ReadableStream> {
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]
  const chat = ai.chats.create({
    model: 'gemini-2.0-flash',
    config: { systemInstruction: SYSTEM_PROMPT },
    history,
  })

  const result = await chat.sendMessageStream({ message: lastMessage.content })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const timeout = setTimeout(() => {
        controller.error(new Error('Stream timeout'))
      }, 30_000)

      try {
        for await (const chunk of result) {
          const text = chunk.text
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
