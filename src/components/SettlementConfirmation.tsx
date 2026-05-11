"use client"

import { ChainBadge } from '@/components/ChainBadge'

export interface SettlementConfirmationProps {
  txHash: string
  explorerUrl: string
  originChain: string
  onContinue: () => void
}

export function SettlementConfirmation({ txHash, explorerUrl, originChain, onContinue }: SettlementConfirmationProps) {
  const displayHash = txHash
    ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}`
    : '—'

  const explorerHref = explorerUrl || `https://explorer.solana.com/tx/${txHash}`

  return (
    <div className="flex flex-col items-center text-center py-2 gap-4">
      {/* Green checkmark */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l4.5 4.5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Headings */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[var(--kf-heading)]">Payment confirmed</h2>
        <p className="text-sm text-[var(--kf-muted)]">Settled in USDC on Solana</p>
      </div>

      {/* Chain route */}
      <div className="flex items-center gap-2">
        <ChainBadge chain={originChain} size="sm" />
        <span className="text-xs text-[var(--kf-muted)]">→</span>
        <ChainBadge chain="solana" size="sm" />
      </div>

      {/* TX block */}
      <div className="w-full rounded-lg border border-[var(--kf-border)] bg-[var(--kf-background)] px-4 py-3 flex flex-col gap-2 text-left">
        <p className="text-xs text-[var(--kf-muted)] font-mono">{displayHash}</p>
        <a
          href={explorerHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View transaction on Solana Explorer (opens in new tab)"
          className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
        >
          View on Solana Explorer ↗
        </a>
      </div>

      {/* Continue CTA — success green; only green primary button in the entire codebase */}
      <button
        onClick={onContinue}
        className="w-full py-2.5 rounded-lg bg-green-500 text-white font-semibold text-sm hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        Continue conversation →
      </button>
    </div>
  )
}
