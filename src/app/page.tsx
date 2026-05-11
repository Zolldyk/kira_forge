"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { getSession, incrementPrompt, decrementPaidPrompt } from "@/lib/session";
import { StreamingMessage } from "@/components/StreamingMessage";
import { PromptCounter } from "@/components/PromptCounter";
import { type Message, type PaymentState } from "@/types";
import { PaywallBanner } from "@/components/PaywallBanner";

const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_PROMPTS ?? '3')

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

  const messagesRef = useRef<Message[]>([]);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const sessionIdRef = useRef<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = getSession();
    sessionIdRef.current = session.sessionId;
    setPromptCount(session.promptCount);
    setIsUnlocked(session.isUnlocked);
    setPromptsRemaining(session.promptsRemaining);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { readerRef.current?.cancel(); }, []);

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
            <div className="flex items-center justify-center px-4 py-8">
              <p className="text-sm text-[var(--kf-muted)] text-center leading-relaxed">
                No payments yet — your first payment will appear here
              </p>
            </div>
          </ScrollArea>
        </aside>
      </main>
    </div>
  );
}
