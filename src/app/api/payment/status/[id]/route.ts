import { getStatus } from '@/lib/kirapay-client'
import { type PaymentStatus } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const status: PaymentStatus = await getStatus(id)
    return Response.json({ data: status })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return Response.json({ error: message, retryable: true }, { status: 500 })
  }
}
