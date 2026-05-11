"use client"

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
  isError?: boolean
  onRetry?: () => void
}

export function StreamingMessage({ content, isStreaming, isError, onRetry }: StreamingMessageProps) {
  return (
    <div
      className={`flex gap-3 px-6 py-3 ${isError ? 'ring-2 ring-red-500 rounded-lg mx-6' : ''}`}
      aria-busy={isStreaming}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
        <span className="text-xs text-indigo-400 font-mono">AI</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--kf-body)] leading-relaxed whitespace-pre-wrap break-words">
          {content}
          {isStreaming && (
            <span
              className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle"
              aria-hidden="true"
            />
          )}
        </p>
        {isError && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-red-400 underline hover:text-red-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
