"use client"

import { ChainBadge } from '@/components/ChainBadge'

export interface RoutingIndicatorProps {
  step: 1 | 2
  originChain: string
}

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  base: 'Base',
  polygon: 'Polygon',
  solana: 'Solana',
  arbitrum: 'Arbitrum',
}

type StepState = 'waiting' | 'active' | 'done'

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 shrink-0">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (state === 'active') {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-indigo-500 shrink-0 animate-spin border-t-transparent" />
    )
  }
  return (
    <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-zinc-600 shrink-0 opacity-40" />
  )
}

export function RoutingIndicator({ step, originChain }: RoutingIndicatorProps) {
  const step1State: StepState = step === 1 ? 'active' : 'done'
  const step2State: StepState = step === 1 ? 'waiting' : 'active'
  const connectorGreen = step === 2

  const chainLabel = CHAIN_LABELS[originChain] ?? originChain
  const announcement = step === 1
    ? `Step 1 active: Detected on ${chainLabel} — routing cross-chain`
    : `Step 2 active: Settling on Solana`

  return (
    <div
      role="progressbar"
      aria-live="polite"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={2}
      aria-label="Payment routing progress"
      className="py-4"
    >
      <p aria-live="polite" className="sr-only">{announcement}</p>

      {/* Step 1 */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <StepIcon state={step1State} />
          <div className={`w-px h-6 mx-auto mt-1 ${connectorGreen ? 'bg-green-500' : 'bg-zinc-700'}`} />
        </div>
        <div className="pb-4">
          <div className={`flex items-center gap-2 mb-0.5 ${step === 1 ? 'animate-pulse' : ''}`}>
            <ChainBadge chain={originChain} size="sm" />
            <span className="text-sm font-medium text-[var(--kf-heading)]">
              Detected on {chainLabel}
            </span>
          </div>
          <p className="text-xs text-[var(--kf-muted)]">routing cross-chain...</p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex items-start gap-3">
        <StepIcon state={step2State} />
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {step2State === 'waiting' ? (
              <span className="inline-block w-[18px] h-[18px] rounded-full border border-zinc-700 opacity-40" />
            ) : (
              <ChainBadge chain="solana" size="sm" />
            )}
            <span className={`text-sm font-medium ${step2State === 'waiting' ? 'text-[var(--kf-muted)] opacity-40' : 'text-[var(--kf-heading)]'}`}>
              Settling on Solana
            </span>
          </div>
          <p className={`text-xs text-[var(--kf-muted)] ${step2State === 'waiting' ? 'opacity-40' : ''}`}>
            awaiting USDC confirmation...
          </p>
        </div>
      </div>
    </div>
  )
}
