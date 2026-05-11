export type PaymentState =
  | "idle"
  | "checkout"
  | "routing"
  | "polling"
  | "confirmed"
  | "error";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface PaymentStatus {
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
  explorerUrl?: string;
  chain?: string;
}

export interface SessionState {
  sessionId: string;
  promptCount: number;
  isUnlocked: boolean;
  unlockedUntil: number;
  promptsRemaining: number;
}
