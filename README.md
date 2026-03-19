<div align="center">

# ♛ AI Battle Royale

**You are the Chairman. Three AIs enter. One wins. You decide.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-FF0055?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)

<br/>

> Claude, ChatGPT, and Gemini sit around a table, answer your prompt, and trash-talk each other while they wait.
> You read all three responses and rank them — 1st, 2nd, 3rd. No algorithm decides for you.

<br/>

</div>

---

## 🎮 &nbsp;What is this?

A game-style web app where you pit the three biggest AI models against each other on any prompt you choose. All three respond **simultaneously** — you read the results and crown a winner yourself.

The characters have personalities. They banter when idle. They face you when you open the chat. It feels like a game because it is one.

---

## ✨ &nbsp;Features

| | Feature | Description |
|---|---|---|
| ⌨️ | **Minecraft-style chat** | Press `T` to open, `Esc` to close. Characters turn to face you. |
| 💬 | **Live AI banter** | Characters trash-talk each other between battles — 6 rotating conversation packs. |
| ⚡ | **Parallel responses** | All three AIs answer at the same time via `Promise.all`. No sequential waiting. |
| ♛ | **You rank all three** | Pick 1st, then 2nd — 3rd is automatic. No hidden algorithm, no bias. |
| 🏆 | **Podium with real characters** | 3D illustrated characters physically stand on gold/silver/bronze blocks. |
| 🔍 | **Optional AI analysis** | A blind judge scores accuracy, clarity, helpfulness, creativity — hidden by default. |
| 🎨 | **3D illustrated characters** | SVG characters with radial-gradient sphere heads and brand logos. No pixel art. |

---

## 🤖 &nbsp;The Competitors

<table>
  <tr>
    <td align="center" width="200">
      <strong>◈ Claude</strong><br/>
      <sub>by Anthropic</sub><br/>
      <code>claude-haiku-4-5</code>
    </td>
    <td align="center" width="200">
      <strong>⬡ ChatGPT</strong><br/>
      <sub>by OpenAI</sub><br/>
      <code>gpt-4o-mini</code>
    </td>
    <td align="center" width="200">
      <strong>✦ Gemini</strong><br/>
      <sub>by Google DeepMind</sub><br/>
      <code>gemini-2.5-flash</code>
    </td>
  </tr>
</table>

---

## 🛠️ &nbsp;Tech Stack

| Layer | Technology |
|---|---|
| 🏗️ &nbsp;Framework | Next.js 14 — App Router |
| 🔷 &nbsp;Language | TypeScript 5 |
| 🎨 &nbsp;Styling | Tailwind CSS v4 + glassmorphism |
| 🎬 &nbsp;Animation | Framer Motion 12 |
| 🔤 &nbsp;Fonts | Inter + Syne (Google Fonts) |
| 🤖 &nbsp;Claude SDK | `@anthropic-ai/sdk` |
| 🤖 &nbsp;OpenAI SDK | `openai` |
| 🤖 &nbsp;Gemini SDK | `@google/generative-ai` |

---

## 🚀 &nbsp;Getting Started

### 1 &nbsp;·&nbsp; Clone & install

```bash
git clone https://github.com/faighcv/BestAIChairman.git
cd BestAIChairman
npm install
```

### 2 &nbsp;·&nbsp; Add API keys

Create a `.env.local` file in the root:

```env
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

<details>
<summary><strong>Where to get each key</strong></summary>

<br/>

| Key | Link | Note |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Separate from Claude.ai Pro — requires API credits |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | Free tier available |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | Requires billing enabled for `gemini-2.5-flash` |

</details>

### 3 &nbsp;·&nbsp; Run

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and become the Chairman.

---

## 🎯 &nbsp;How to Play

```
1.  Press T        →  Chat bar opens. AIs turn to face you.
2.  Type a prompt  →  Hit Enter. Any question, challenge, or topic.
3.  Watch them go  →  All three write simultaneously.
4.  Review phase   →  Three response cards appear. Read them all.
5.  Pick 1st       →  Click "Set as 1st Place" on the best response.
6.  Pick 2nd       →  Choose from the remaining two.
7.  Podium drops   →  Your ranking is final. 3rd place is automatic.
8.  Analyse        →  Optionally reveal the AI judge's blind scoring.
9.  New Battle     →  Go again with a new prompt.
```

---

## 📁 &nbsp;Project Structure

```
├── app/
│   ├── page.tsx              # Main game UI — all phases (idle, writing, review, results)
│   ├── layout.tsx            # Root layout with Google Fonts
│   ├── globals.css           # Design system — glassmorphism, chat overlay, colors
│   └── api/
│       ├── battle/route.ts   # Calls all three AIs in parallel via Promise.all
│       └── judge/route.ts    # Blind scoring — shuffles labels to eliminate AI bias
│
└── components/
    └── Character.tsx         # 3D SVG characters — sphere heads, logos, speech bubbles
```

---

## 🔒 &nbsp;Design Decisions

**No judge bias** — The judge API shuffles AI identities to `Alpha / Beta / Gamma` before scoring. Claude (who does the judging) has no idea which response is its own.

**Your ranking is sovereign** — AI analysis scores are supplementary and hidden by default. Your 1st/2nd/3rd picks are the result, full stop.

**True parallelism** — All three AI calls fire at once with `Promise.all`. Total wait time = slowest model, not the sum of all three.

---

<div align="center">

<br/>

*Built with [Claude Code](https://claude.ai/code)*

</div>
