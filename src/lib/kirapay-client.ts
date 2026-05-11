import { type PaymentStatus } from '@/types'

const KIRAPAY_BASE_URL = process.env.KIRAPAY_BASE_URL ?? 'https://api.kirapay.io'

export async function generateLink(
  amount: number,
  sessionId: string
): Promise<{ linkId: string; checkoutUrl: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000)

  try {
    const res = await fetch(`${KIRAPAY_BASE_URL}/v1/links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KIRAPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, sessionId }),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`KIRAPAY error: ${res.status}`)
    }

    const data = await res.json()
    return { linkId: data.linkId, checkoutUrl: data.checkoutUrl }
  } finally {
    clearTimeout(timeout)
  }
}

export async function getStatus(linkId: string): Promise<PaymentStatus> {
  const res = await fetch(`${KIRAPAY_BASE_URL}/v1/links/${linkId}/status`, {
    headers: {
      Authorization: `Bearer ${process.env.KIRAPAY_API_KEY}`,
    },
  })

  if (!res.ok) {
    throw new Error(`KIRAPAY status error: ${res.status}`)
  }

  const data = await res.json()
  return {
    status: data.status,
    txHash: data.txHash,
    explorerUrl: data.explorerUrl,
    chain: data.chain,
  }
}
