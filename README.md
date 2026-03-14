# ♛ AI Battle Royale

> **You are the Chairman.** Three AIs walk into a room — Claude, ChatGPT, and Gemini. You give them a prompt. They answer. You decide who wins.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?style=flat-square&logo=framer&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)

---

## What is this?

A game-style web app where you pit the three biggest AI models against each other on any prompt you choose. The AIs write their responses simultaneously, then you — the Chairman — read all three and rank them yourself: 1st, 2nd, and 3rd place. No algorithm decides for you.

The characters sit around a conference table, trash-talk each other when idle, and react to the battle in real time. It feels like a game because it is one.

---

## Features

- **Minecraft-style chat** — Press `T` to open the input bar at the bottom, `Esc` to close. Characters turn to face you when you open it.
- **Live scripted dialogue** — The AIs banter with each other while they're waiting for a battle to start. 6 rotating conversation packs.
- **Parallel responses** — All three AIs answer at the same time. No waiting in sequence.
- **You rank all three** — A two-step selection flow: pick 1st place, then 2nd. 3rd is automatic. No auto-ranking, no hidden bias.
- **Podium with real characters** — The 3D illustrated characters physically stand on gold/silver/bronze podium blocks.
- **Optional AI analysis** — A background judge scores each response across accuracy, clarity, helpfulness, and creativity. Hidden by default — toggle "Show AI Analysis" if you're curious. Your ranking is always yours.
- **3D illustrated characters** — SVG characters with radial gradient sphere heads wearing the AI brand logos. No pixel art.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom CSS (glassmorphism) |
| Animation | Framer Motion |
| AI — Claude | `@anthropic-ai/sdk` → `claude-haiku-4-5` |
| AI — ChatGPT | `openai` → `gpt-4o-mini` |
| AI — Gemini | `@google/generative-ai` → `gemini-2.5-flash` |
| Fonts | Inter + Syne (Google Fonts) |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/faighcv/BestAIChairman.git
cd BestAIChairman
npm install
```

### 2. Set up API keys

Create a `.env.local` file in the root:

```env
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

Where to get them:

| Key | Where |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) — requires API credits (separate from Claude.ai Pro) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) — requires billing enabled for `gemini-2.5-flash` |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Play

1. **Press `T`** to open the chat bar. The AIs turn to face you.
2. **Type a prompt** and hit Enter. Any question, topic, challenge — your call.
3. **Watch them write.** All three respond in parallel.
4. **Review phase** — three response cards appear side by side. Read them all.
5. **Pick 1st place**, then **pick 2nd place**. 3rd is assigned automatically.
6. **Podium drops.** Your ranking is final. Optionally reveal the AI judge's analysis.
7. Hit **New Battle** to go again.

---

## Project Structure

```
app/
  page.tsx          — main game UI (all phases: idle, writing, review, results)
  layout.tsx        — root layout with font imports
  globals.css       — design system (glass, table surface, chat overlay, colors)
  api/
    battle/route.ts — calls Claude + ChatGPT + Gemini in parallel
    judge/route.ts  — blind scoring with shuffled labels to avoid AI bias
components/
  Character.tsx     — 3D SVG characters with animated arms, speech bubbles, logos
```

---

## Notes

- The judge API shuffles AI identities (Alpha/Beta/Gamma) before scoring so Claude can't favor itself.
- Scores from the judge are never shown by default — they're supplementary information, not the result.
- All three AI calls run with `Promise.all` so latency is determined by the slowest model, not their sum.

---

*Built with Claude Code.*
