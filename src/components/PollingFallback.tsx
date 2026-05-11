"use client"

import { useState, useEffect, useRef } from 'react'

export interface PollingFallbackProps {
  originChain: string
  txHash?: string
}

export function PollingFallback({ originChain }: PollingFallbackProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0) {
      const m = Math.floor(elapsedSeconds / 60)
      const s = elapsedSeconds % 60
      const label = m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`
      setAnnouncement(`Still waiting for Solana confirmation — ${label} elapsed`)
    }
  }, [elapsedSeconds])

  const chainName = originChain.charAt(0).toUpperCase() + originChain.slice(1)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const elapsedLabel = minutes > 0
    ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
    : `${elapsedSeconds}s`
  const progress = Math.min(100, (elapsedSeconds / 120) * 100)

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/15 shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-[var(--kf-heading)]">Taking a bit longer</h2>
          <p className="text-sm text-[var(--kf-muted)]">
            Taking a bit longer — your {chainName} transaction was detected. Waiting for Solana confirmation...
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
        <p className="text-xs text-green-400 font-medium">tx detected on {chainName}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="w-full h-1.5 rounded-full bg-[var(--kf-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Settlement confirmation progress"
          />
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-[var(--kf-muted)]">Elapsed: {elapsedLabel}</span>
          <span className="text-xs text-[var(--kf-muted)]">~2 min max</span>
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}
