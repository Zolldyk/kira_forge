"use client"

import { SidebarEntry } from '@/types'
import { ChainBadge } from '@/components/ChainBadge'

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  base: 'Base',
  polygon: 'Polygon',
  solana: 'Solana',
  arbitrum: 'Arbitrum',
}

export interface PaymentSidebarEntryProps {
  entry: SidebarEntry
}

export function PaymentSidebarEntry({ entry }: PaymentSidebarEntryProps) {
  const chainName = CHAIN_LABELS[entry.chain] ?? entry.chain

  return (
    <li
      role="listitem"
      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--kf-border)] animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <ChainBadge chain={entry.chain} size="sm" />
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm text-[var(--kf-body)] leading-tight truncate">{chainName}</span>
        <span className="text-xs text-[var(--kf-muted)]">${entry.amount}</span>
      </div>
      {entry.status === 'confirmed' && (
        <span className="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded px-2 py-0.5 leading-none shrink-0">
          Confirmed
        </span>
      )}
      {entry.status === 'pending' && (
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-amber-400 font-medium">Pending</span>
        </span>
      )}
      {entry.status === 'failed' && (
        <span className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 leading-none shrink-0">
          Failed
        </span>
      )}
    </li>
  )
}
