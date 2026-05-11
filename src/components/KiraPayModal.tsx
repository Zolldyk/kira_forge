"use client"

import { useState, useEffect } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { RadioGroup } from '@base-ui/react/radio-group'
import { ChainBadge } from '@/components/ChainBadge'
import { ChainOption } from '@/components/ChainOption'
import { RoutingIndicator } from '@/components/RoutingIndicator'
import { type PaymentState } from '@/types'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

const CHAIN_ID_MAP: Record<string, string> = {
  '0x1':    'ethereum',
  '0x2105': 'base',
  '0x89':   'polygon',
  '0xa4b1': 'arbitrum',
}

const UNLOCK_PRICE = Number(process.env.NEXT_PUBLIC_UNLOCK_PRICE ?? '5')

const CHAINS = [
  { chain: 'ethereum', tokenSymbol: 'ETH' },
  { chain: 'base',     tokenSymbol: 'USDC' },
  { chain: 'polygon',  tokenSymbol: 'MATIC' },
  { chain: 'arbitrum', tokenSymbol: 'ETH' },
  { chain: 'solana',   tokenSymbol: 'SOL' },
]

export interface KiraPayModalProps {
  open: boolean
  paymentState: PaymentState
  routingStep: 1 | 2
  originChain: string
  checkoutUrl: string | null
  linkError: string | null
  onCancel: () => void
  onConfirm: (chain: string) => void
  onRetryLink: () => void
}

export function KiraPayModal({ open, paymentState, routingStep, originChain, checkoutUrl, linkError, onCancel, onConfirm, onRetryLink }: KiraPayModalProps) {
  const [detectedChain, setDetectedChain] = useState<string>('ethereum')
  const [detectedBalance, setDetectedBalance] = useState<string | undefined>(undefined)
  const [selectedChain, setSelectedChain] = useState<string>('ethereum')

  useEffect(() => {
    if (!open) return

    async function detectWallet() {
      if (typeof window === 'undefined' || !window.ethereum) return
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        const chain = CHAIN_ID_MAP[chainId] ?? 'ethereum'

        if (accounts[0]) {
          const balanceHex = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest'],
          }) as string
          const balanceEth = (parseInt(balanceHex, 16) / 1e18).toFixed(4)
          setDetectedChain(chain)
          setDetectedBalance(`${balanceEth} ETH`)
          setSelectedChain(chain)
        }
      } catch {
        // wallet not connected — use static fallback
      }
    }

    detectWallet()
  }, [open])

  const selectedTokenSymbol = CHAINS.find((c) => c.chain === selectedChain)?.tokenSymbol ?? 'ETH'

  const handleConfirm = () => {
    if (!checkoutUrl) return
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
    onConfirm(selectedChain)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o && paymentState === 'checkout') onCancel()
        // routing: do nothing — payment is in-flight
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-sm w-full bg-[var(--kf-surface)] rounded-xl border border-[var(--kf-border)] p-6">
          {paymentState === 'routing' ? (
            <>
              <Dialog.Title className="text-base font-semibold text-[var(--kf-heading)] mb-4">
                Processing Payment
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Cross-chain routing in progress
              </Dialog.Description>
              <RoutingIndicator step={routingStep} originChain={originChain} />
            </>
          ) : (
            <>
              <Dialog.Title className="text-base font-semibold text-[var(--kf-heading)] mb-1">
                Pay with Any Token
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Cross-chain payment modal
              </Dialog.Description>

              {/* Amount display */}
              <p className="text-sm text-[var(--kf-muted)] mb-4">
                ${UNLOCK_PRICE}.00 · 20 prompts · 24h access
              </p>

              {/* Detected chain */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[var(--kf-muted)]">Your wallet chain:</span>
                <ChainBadge chain={detectedChain} size="md" label />
              </div>

              {/* Chain selector */}
              <RadioGroup
                value={selectedChain}
                onValueChange={(v) => setSelectedChain(v as string)}
                aria-label="Select payment chain and token"
                className="flex flex-col gap-2 mb-4"
              >
                {CHAINS.map(({ chain, tokenSymbol }) => {
                  const isDetected = chain === detectedChain
                  const balance = isDetected ? detectedBalance : undefined
                  const disabled = !isDetected
                  return (
                    <ChainOption
                      key={chain}
                      chain={chain}
                      tokenSymbol={tokenSymbol}
                      balance={balance}
                      disabled={disabled}
                    />
                  )
                })}
              </RadioGroup>

              {/* Error state */}
              {linkError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-400 flex-1">{linkError}</p>
                  <button
                    onClick={onRetryLink}
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={checkoutUrl === null}
                className="w-full py-2.5 rounded-lg bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 mb-3"
              >
                {checkoutUrl === null && !linkError
                  ? 'Generating checkout...'
                  : `Pay $${UNLOCK_PRICE} in ${selectedTokenSymbol}`}
              </button>

              {/* Cancel */}
              <div className="flex justify-center">
                <Dialog.Close
                  className="text-sm text-[var(--kf-muted)] hover:text-[var(--kf-body)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  Cancel
                </Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
