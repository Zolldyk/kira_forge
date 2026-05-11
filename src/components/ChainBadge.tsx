"use client"

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  base: 'Base',
  polygon: 'Polygon',
  solana: 'Solana',
  arbitrum: 'Arbitrum',
}

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 18, md: 28, lg: 32 }

export interface ChainBadgeProps {
  chain: string
  size?: 'sm' | 'md' | 'lg'
  label?: boolean
}

export function ChainBadge({ chain, size = 'md', label = false }: ChainBadgeProps) {
  const px = SIZE_PX[size]
  const chainLabel = CHAIN_LABELS[chain] ?? chain
  return (
    <span className="inline-flex items-center gap-1.5">
      <img
        src={`/chain-icons/${chain}.svg`}
        alt=""
        aria-label={chainLabel}
        width={px}
        height={px}
        className="shrink-0"
      />
      {label && <span className="text-sm text-[var(--kf-body)]">{chainLabel}</span>}
    </span>
  )
}
