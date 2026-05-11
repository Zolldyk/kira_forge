"use client"

import { Radio } from '@base-ui/react/radio'
import { ChainBadge } from '@/components/ChainBadge'

export interface ChainOptionProps {
  chain: string
  tokenSymbol: string
  balance?: string
  disabled?: boolean
}

export function ChainOption({ chain, tokenSymbol, balance, disabled = false }: ChainOptionProps) {
  return (
    <Radio.Root
      value={chain}
      disabled={disabled}
      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--kf-border)] cursor-pointer transition-colors data-[checked]:border-indigo-500 data-[checked]:bg-indigo-500/10 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      <ChainBadge chain={chain} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--kf-heading)]">
          <span>{chain.charAt(0).toUpperCase() + chain.slice(1)}</span>
          <span className="text-[var(--kf-muted)]">·</span>
          <span className="text-[var(--kf-muted)]">{tokenSymbol}</span>
        </div>
        {disabled ? (
          <span className="text-xs text-zinc-500">Insufficient balance</span>
        ) : (
          balance && <span className="text-xs text-[var(--kf-muted)]">{balance}</span>
        )}
      </div>
      <Radio.Indicator className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-indigo-500 bg-indigo-500">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <circle cx="4" cy="4" r="3" fill="white" />
        </svg>
      </Radio.Indicator>
    </Radio.Root>
  )
}
