# KiraForge

A cross-chain monetized AI agent built on Next.js. Users get a configurable number of free prompts, then pay via KIRAPAY to unlock continued access. Fork, configure five environment variables, and have your own live AI agent running in under an hour.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZolldyk%2Fkira_forge&project-name=kiraforge&repository-name=kira_forge)

---

## Setup

### 1. Fork & Clone

1. Click **Deploy to Vercel** above — or fork this repository manually on GitHub.
2. Clone your fork:

   ```bash
   git clone https://github.com/Zolldyk/kira_forge.git
   cd kiraforge
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all five variables (see [Environment Variables](#environment-variables) below).

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and verify:

- Chat responds to messages
- After the free-prompt limit, the paywall modal appears
- KIRAPAY payment flow initiates correctly

### 4. Deploy to Vercel

Push to `main` — Vercel auto-deploys on every push.

In your Vercel project settings under **Environment Variables**, add the same five variables from your `.env.local`.

---

## Environment Variables

| Variable | Secret | Default | Description | What breaks without it |
|---|---|---|---|---|
| `KIRAPAY_API_KEY` | Yes (server-only) | — | Server-side key for KIRAPAY REST API (checkout link generation + status polling) | `POST /api/payment/link` returns 422 — payment flow is fully broken |
| `KIRAPAY_WEBHOOK_SECRET` | Yes (server-only) | — | Shared secret used to verify HMAC-SHA256 webhook signatures | `POST /api/webhooks/kirapay` rejects all events with 401 — session never unlocks |
| `GEMINI_API_KEY` | Yes (server-only) | — | Server-side key for Google Gemini API (AI inference) | `POST /api/chat` returns 500 — chat is fully broken |
| `NEXT_PUBLIC_FREE_PROMPTS` | No | `3` | Number of free prompts before the paywall triggers (client-accessible) | Free prompt limit is undefined — paywall never triggers or always triggers |
| `NEXT_PUBLIC_UNLOCK_PRICE` | No | `5` | Dollar amount shown in the paywall and modal ("Unlock for $X") | Paywall copy shows undefined — confusing UX for users |

---

## KIRAPAY Integration

### Get Your API Key

Obtain your API key from the KIRAPAY developer dashboard. Set it as `KIRAPAY_API_KEY` in your environment.

### Register Your Webhook URL

After deploying to Vercel, register this webhook endpoint in the KIRAPAY dashboard under **Webhook Settings**:

```
https://<your-vercel-domain>/api/webhooks/kirapay
```

Replace `<your-vercel-domain>` with your actual Vercel deployment URL (e.g. `kiraforge.vercel.app`).

### Local Development Webhooks

To test the payment flow locally, expose your dev server with [ngrok](https://ngrok.com):

```bash
ngrok http 3000
```

Register the ngrok URL (e.g. `https://abc123.ngrok.io/api/webhooks/kirapay`) in the KIRAPAY dashboard for local testing. Re-register whenever the ngrok URL changes.

---

## Customize the AI

The agent's behavior is controlled by a single file: `src/lib/system-prompt.ts`.

```ts
// src/lib/system-prompt.ts
export const SYSTEM_PROMPT = `You are KiraForge AI, an expert assistant...`
```

Replace the template string to deploy a completely different domain expert — no other changes needed. Examples:

**Trading bot:**

```ts
export const SYSTEM_PROMPT = `You are a Solana DeFi trading assistant. You help users understand liquidity pools, yield strategies, and on-chain data. You provide concise, actionable advice on Solana-based DeFi protocols.`
```

**Code reviewer:**

```ts
export const SYSTEM_PROMPT = `You are a Solana smart contract auditor. You review Anchor programs for security vulnerabilities, logic errors, and deviation from best practices. Always cite the specific account constraint or instruction that introduces risk.`
```

After editing, push to `main` — Vercel redeploys automatically.

---

## Built with KiraForge

Using KiraForge as your base? Add this badge to your README:

```markdown
[![Built with KiraForge](https://img.shields.io/badge/Built%20with-KiraForge-6366f1)](https://github.com/Zolldyk/kira_forge)
```

[![Built with KiraForge](https://img.shields.io/badge/Built%20with-KiraForge-6366f1)](https://github.com/Zolldyk/kira_forge)
