const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_PROMPTS ?? '3')

export interface PromptCounterProps {
  count: number
  isUnlocked: boolean
}

export function PromptCounter({ count, isUnlocked }: PromptCounterProps) {
  if (isUnlocked) return null

  const isAtLimit = count >= FREE_LIMIT

  return (
    <div
      className={`hidden md:flex items-center px-2.5 py-1 rounded-full border ${
        isAtLimit
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-[var(--kf-border)] bg-[var(--kf-surface)]'
      }`}
      aria-label={`${count} of ${FREE_LIMIT} free prompts used`}
    >
      <span className={`text-xs ${isAtLimit ? 'text-amber-500' : 'text-[var(--kf-muted)]'}`}>
        {count} / {FREE_LIMIT} prompts used
      </span>
    </div>
  )
}
