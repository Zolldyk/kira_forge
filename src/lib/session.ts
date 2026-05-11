import { type SessionState } from '@/types'

const KEYS = {
  sessionId:        'kf-sessionId',
  promptCount:      'kf-promptCount',
  isUnlocked:       'kf-isUnlocked',
  unlockedUntil:    'kf-unlockedUntil',
  promptsRemaining: 'kf-promptsRemaining',
} as const

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getSession(): SessionState {
  if (!isBrowser()) {
    return { sessionId: '', promptCount: 0, isUnlocked: false, unlockedUntil: 0, promptsRemaining: 0 }
  }
  let sessionId = localStorage.getItem(KEYS.sessionId)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(KEYS.sessionId, sessionId)
  }
  const unlockedUntil = Number(localStorage.getItem(KEYS.unlockedUntil) ?? 0)
  const rawIsUnlocked = localStorage.getItem(KEYS.isUnlocked) === 'true'
  const isUnlocked = rawIsUnlocked && unlockedUntil > Date.now()
  // Clear stale flag so future reads don't re-evaluate
  if (rawIsUnlocked && !isUnlocked) {
    localStorage.setItem(KEYS.isUnlocked, 'false')
  }
  return {
    sessionId,
    promptCount:      Number(localStorage.getItem(KEYS.promptCount)      ?? 0),
    isUnlocked,
    unlockedUntil,
    promptsRemaining: Number(localStorage.getItem(KEYS.promptsRemaining) ?? 0),
  }
}

export function incrementPrompt(): number {
  const current = Number(localStorage.getItem(KEYS.promptCount) ?? 0)
  const next = current + 1
  localStorage.setItem(KEYS.promptCount, String(next))
  return next
}

export function setUnlocked(until: number): void {
  localStorage.setItem(KEYS.isUnlocked,       'true')
  localStorage.setItem(KEYS.unlockedUntil,    String(until))
  localStorage.setItem(KEYS.promptsRemaining, '20')
}

export function decrementPaidPrompt(): number {
  const current = Number(localStorage.getItem(KEYS.promptsRemaining) ?? 0)
  const next = Math.max(0, current - 1)
  localStorage.setItem(KEYS.promptsRemaining, String(next))
  return next
}
