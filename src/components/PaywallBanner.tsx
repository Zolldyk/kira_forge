"use client"

import { useRef, useEffect } from 'react'

const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_PROMPTS ?? '3')
const UNLOCK_PRICE = Number(process.env.NEXT_PUBLIC_UNLOCK_PRICE ?? '5')

export interface PaywallBannerProps {
  onPayClick: () => void
}

export function PaywallBanner({ onPayClick }: PaywallBannerProps) {
  const ctaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ctaRef.current?.focus()
  }, [])

  return (
    <div
      role="alert"
      className="mx-6 my-3 flex items-center justify-between gap-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-4 py-3"
    >
      <p className="text-sm text-[var(--kf-body)] leading-relaxed">
        You&apos;ve used your {FREE_LIMIT} free prompts.{' '}
        Unlock 20 more for ${UNLOCK_PRICE} — pay in any token, any chain.
      </p>
      <button
        ref={ctaRef}
        onClick={onPayClick}
        className="shrink-0 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
      >
        Pay with Any Token
      </button>
    </div>
  )
}
