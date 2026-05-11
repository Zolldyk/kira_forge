"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { getSession, incrementPrompt, decrementPaidPrompt, setUnlocked } from "@/lib/session";
import { StreamingMessage } from "@/components/StreamingMessage";
import { PromptCounter } from "@/components/PromptCounter";
import { type Message, type PaymentState, type PaymentStatus, type SidebarEntry } from "@/types";
import { PaymentSidebarEntry } from "@/components/PaymentSidebarEntry";
import { PaywallBanner } from "@/components/PaywallBanner";
import { KiraPayModal } from "@/components/KiraPayModal";

const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_PROMPTS ?? '3')
const UNLOCK_PRICE = Number(process.env.NEXT_PUBLIC_UNLOCK_PRICE ?? '5')

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [promptCount, setPromptCount] = useState<number>(0);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [promptsRemaining, setPromptsRemaining] = useState<number>(0);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [linkId, setLinkId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [originChain, setOriginChain] = useState<string>('ethereum');
  const [routingStep, setRoutingStep] = useState<1 | 2>(1);
  const [confirmedData, setConfirmedData] = useState<{ txHash: string; explorerUrl: string } | null>(null);
  const [errorTxHash, setErrorTxHash] = useState<string>('');
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>([]);
  const [isLoadingSidebar, setIsLoadingSidebar] = useState<boolean>(true);

  const messagesRef = useRef<Message[]>([]);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const sessionIdRef = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = getSession();
    sessionIdRef.current = session.sessionId;
    setPromptCount(session.promptCount);
    setIsUnlocked(session.isUnlocked);
    setPromptsRemaining(session.promptsRemaining);

    const seed: SidebarEntry[] = [
      { id: 'seed-1', chain: 'polygon', amount: 7, status: 'confirmed', createdAt: Date.now() - 3600000 },
      { id: 'seed-2', chain: 'base', amount: 5, status: 'confirmed', createdAt: Date.now() - 7200000 },
      { id: 'seed-3', chain: 'ethereum', amount: 5, status: 'confirmed', createdAt: Date.now() - 10800000 },
    ]
    const timer = setTimeout(() => {
      setSidebarEntries(seed)
      setIsLoadingSidebar(false)
    }, 400)
    return () => clearTimeout(timer)
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { readerRef.current?.cancel(); }, []);

  useEffect(() => {
    if (paymentState !== 'checkout') return
    setCheckoutUrl(null)
    setLinkId(null)
    setLinkError(null)

    fetch('/api/payment/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: UNLOCK_PRICE, sessionId: sessionIdRef.current }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
        setLinkId(json.data.linkId)
        setCheckoutUrl(json.data.checkoutUrl)
      })
      .catch((e: unknown) => {
        setLinkError(e instanceof Error ? e.message : 'Failed to generate payment link')
      })
  }, [paymentState])

  useEffect(() => {
    if ((paymentState !== 'routing' && paymentState !== 'polling') || !linkId) return

    if (pollingStartTimeRef.current === null) {
      pollingStartTimeRef.current = Date.now()
    }
    const startTime = pollingStartTimeRef.current
    const elapsed = Date.now() - startTime

    let fallbackTimer: NodeJS.Timeout | undefined
    if (paymentState === 'routing') {
      fallbackTimer = setTimeout(() => {
        setPaymentState('polling')
      }, Math.max(0, 5000 - elapsed))
    }

    const hardTimeoutTimer = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      pollingStartTimeRef.current = null
      setPaymentState('error')
    }, Math.max(0, 120000 - elapsed))

    async function pollStatus() {
      try {
        const res = await fetch(`/api/payment/status/${linkId}`)
        const json = await res.json()
        if (!res.ok) return
        const data: PaymentStatus = json.data
        if (data.status === 'confirmed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          pollingStartTimeRef.current = null
          setUnlocked(Date.now() + 86400000)
          setIsUnlocked(true)
          setPromptsRemaining(20)
          const txHash = data.txHash ?? ''
          setConfirmedData({
            txHash,
            explorerUrl: `https://explorer.solana.com/tx/${txHash}`,
          })
          const newEntry: SidebarEntry = {
            id: crypto.randomUUID(),
            chain: originChain,
            amount: UNLOCK_PRICE,
            status: 'confirmed',
            createdAt: Date.now(),
          }
          setSidebarEntries(prev => [newEntry, ...prev])
          setPaymentState('confirmed')
        } else if (data.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          pollingStartTimeRef.current = null
          setPaymentState('error')
        } else {
          if (data.txHash) setErrorTxHash(data.txHash)
          if (paymentState === 'routing') setRoutingStep(2)
        }
      } catch {
        // network error — keep polling silently
      }
    }

    intervalRef.current = setInterval(pollStatus, 3000)

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer)
      clearTimeout(hardTimeoutTimer)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [paymentState, linkId])

  const isAtLimit = (promptCount >= FREE_LIMIT && !isUnlocked) || (isUnlocked && promptsRemaining <= 0);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;
    if (isAtLimit) return;

    readerRef.current?.cancel();
    readerRef.current = null;
    setIsError(false);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      createdAt: Date.now(),
    };

    const requestMessages = [...messagesRef.current, userMessage];
    const aiMessageId = crypto.randomUUID();

    setMessages(requestMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setMessages((prev) => [
      ...prev,
      { id: aiMessageId, role: "assistant", content: "", createdAt: Date.now() },
    ]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages, sessionId: sessionIdRef.current }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMessageId ? { ...m, content: m.content + chunk } : m))
        );
      }

      const newCount = incrementPrompt();
      setPromptCount(newCount);
      if (isUnlocked) {
        const remaining = decrementPaidPrompt();
        setPromptsRemaining(remaining);
      }
      setIsStreaming(false);
    } catch (error: unknown) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      if (!isAbort) {
        setIsError(true);
      }
      setIsStreaming(false);
    } finally {
      readerRef.current = null;
    }
  }, [isStreaming, isAtLimit, isUnlocked]);

  const handleRetry = useCallback(() => {
    const msgs = messagesRef.current;
    const withoutLastAI = msgs.slice(0, -1);
    const lastUserMsg = withoutLastAI.at(-1);
    if (!lastUserMsg || lastUserMsg.role !== "user") return;

    messagesRef.current = withoutLastAI;
    setMessages(withoutLastAI);
    setIsError(false);
    sendMessage(lastUserMsg.content);
  }, [sendMessage]);

  const handleNewConversation = useCallback(() => {
    readerRef.current?.cancel()
    readerRef.current = null
    setMessages([])
    setIsStreaming(false)
    setIsError(false)
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.focus()
    }
  }, [])

  const handleModalCancel = useCallback(() => {
    setPaymentState('idle')
    setCheckoutUrl(null)
    setLinkId(null)
    setLinkError(null)
    pollingStartTimeRef.current = null
    setErrorTxHash('')
  }, [])

  const handleModalConfirm = useCallback((chain: string) => {
    setOriginChain(chain)
    setRoutingStep(1)
    setPaymentState('routing')
  }, [])

  const handleRetryLink = useCallback(() => {
    setPaymentState('idle')
    setTimeout(() => setPaymentState('checkout'), 50)
  }, [])

  const handleContinue = useCallback(() => {
    const pending = input.trim()
    setPaymentState('idle')
    setConfirmedData(null)
    if (pending) sendMessage(pending)
  }, [input, sendMessage])

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  };

  return (
    <div className="h-full flex flex-col bg-[var(--kf-background)] text-[var(--kf-body)]">
      <header className="flex items-center justify-between px-6 h-14 border-b border-[var(--kf-border)] shrink-0 bg-[var(--kf-background)]">
        <span className="text-sm font-semibold text-[var(--kf-heading)] font-mono">
          KiraForge
        </span>
        <div className="flex items-center gap-3">
          <PromptCounter count={promptCount} isUnlocked={isUnlocked} />
          <button
            className="hidden md:flex lg:hidden items-center justify-center rounded-md text-[var(--kf-muted)] hover:text-[var(--kf-body)] hover:bg-[var(--kf-surface)] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px] min-w-[44px]"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle payments sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="2" y1="4" x2="16" y2="4" />
              <line x1="2" y1="9" x2="16" y2="9" />
              <line x1="2" y1="14" x2="16" y2="14" />
            </svg>
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNewConversation}
            className="hidden md:flex focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
          >
            New conversation
          </Button>
        </div>
      </header>

      <main className="relative flex flex-1 overflow-hidden">
        <section className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 min-h-[400px]">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-[var(--kf-heading)] mb-2">
                    KiraForge AI
                  </h2>
                  <p className="text-sm text-[var(--kf-muted)] max-w-xs">
                    Your Solana &amp; KIRAPAY expert. Ask about programs, SPL
                    tokens, wallets, or cross-chain payments.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  <button className="text-left px-4 py-3 rounded-lg border border-[var(--kf-border)] bg-[var(--kf-surface)] text-sm text-[var(--kf-body)] hover:border-indigo-500/50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]">
                    How do I create an SPL token on Solana?
                  </button>
                  <button className="text-left px-4 py-3 rounded-lg border border-[var(--kf-border)] bg-[var(--kf-surface)] text-sm text-[var(--kf-body)] hover:border-indigo-500/50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]">
                    Explain cross-chain routing with KIRAPAY
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col py-4">
                {messages.map((msg, idx) => {
                  const isLastAssistant =
                    msg.role === "assistant" && idx === messages.length - 1;
                  if (msg.role === "assistant") {
                    return (
                      <StreamingMessage
                        key={msg.id}
                        content={msg.content}
                        isStreaming={isLastAssistant && isStreaming}
                        isError={isLastAssistant && isError}
                        onRetry={isLastAssistant ? handleRetry : undefined}
                      />
                    );
                  }
                  return (
                    <div key={msg.id} className="flex justify-end px-6 py-3">
                      <div className="max-w-[75%] rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5">
                        <p className="text-sm text-[var(--kf-body)] leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {isAtLimit && <PaywallBanner onPayClick={() => setPaymentState('checkout')} />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="md:hidden flex items-center justify-center px-4 py-3 bg-[var(--kf-surface)] border-t border-[var(--kf-border)]">
            <p className="text-sm text-[var(--kf-muted)] text-center">
              Full experience requires desktop + MetaMask
            </p>
          </div>

          <div className="hidden md:flex items-end gap-3 px-6 py-4 border-t border-[var(--kf-border)]">
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none bg-[var(--kf-surface)] border border-[var(--kf-border)] rounded-lg px-4 py-3 text-sm text-[var(--kf-body)] placeholder:text-[var(--kf-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] max-h-[112px]"
              placeholder="Ask about Solana, SPL tokens, or KIRAPAY..."
              rows={1}
              value={input}
              disabled={isStreaming || isAtLimit}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              onInput={handleTextareaInput}
            />
            <button
              className="flex items-center justify-center w-11 h-11 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 shrink-0"
              disabled={isStreaming || isAtLimit || !input.trim()}
              aria-label="Send message"
              onClick={() => sendMessage(input)}
            >
              ↑
            </button>
          </div>
        </section>

        <div className="hidden lg:block w-px shrink-0 bg-[var(--kf-border)]" />

        <aside
          className={`hidden md:flex md:absolute md:inset-y-0 md:right-0 md:z-20 md:w-72 md:bg-[var(--kf-background)] md:border-l md:border-[var(--kf-border)] lg:static lg:z-auto lg:border-l-0 lg:w-72 lg:shrink-0 lg:flex-col ${
            sidebarOpen ? "md:flex" : "md:hidden lg:flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-[var(--kf-border)] shrink-0">
            <span className="text-sm font-medium text-[var(--kf-heading)]">
              Recent Payments
            </span>
          </div>
          <ScrollArea className="flex-1">
            {isLoadingSidebar ? (
              <div className="flex flex-col gap-0">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[var(--kf-border)]"
                  >
                    <div className="w-[18px] h-[18px] rounded-full bg-[var(--kf-surface)] animate-pulse shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="h-3 rounded bg-[var(--kf-surface)] animate-pulse w-20" />
                      <div className="h-2.5 rounded bg-[var(--kf-surface)] animate-pulse w-10" />
                    </div>
                    <div className="h-5 w-16 rounded bg-[var(--kf-surface)] animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
            ) : sidebarEntries.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-8">
                <p className="text-sm text-[var(--kf-muted)] text-center leading-relaxed">
                  No payments yet — your first payment will appear here
                </p>
              </div>
            ) : (
              <ul role="list" aria-live="polite" className="flex flex-col gap-0">
                {sidebarEntries.map((entry) => (
                  <PaymentSidebarEntry key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </ScrollArea>
        </aside>

        <KiraPayModal
          open={paymentState === 'checkout' || paymentState === 'routing' || paymentState === 'confirmed' || paymentState === 'polling' || paymentState === 'error'}
          paymentState={paymentState}
          routingStep={routingStep}
          originChain={originChain}
          confirmedData={confirmedData}
          errorTxHash={errorTxHash}
          checkoutUrl={checkoutUrl}
          linkError={linkError}
          onCancel={handleModalCancel}
          onConfirm={handleModalConfirm}
          onRetryLink={handleRetryLink}
          onContinue={handleContinue}
        />
      </main>
    </div>
  );
}
