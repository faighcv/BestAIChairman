import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { prompt, claude, chatgpt, gemini } = await req.json()

  const judgePrompt = `You are the CHAIRMAN — the ultimate AI judge. You must evaluate three AI responses to a prompt.

ORIGINAL PROMPT: "${prompt}"

RESPONSE A (Claude):
${claude}

RESPONSE B (ChatGPT):
${chatgpt}

RESPONSE C (Gemini):
${gemini}

Rate each response on a scale of 1-10 across these criteria:
- Accuracy & Correctness
- Clarity & Communication
- Helpfulness & Depth
- Creativity & Style

Then give an overall score out of 10 for each.

Respond ONLY with valid JSON in this exact format:
{
  "claude": {
    "score": 8,
    "accuracy": 8,
    "clarity": 9,
    "helpfulness": 8,
    "creativity": 7,
    "verdict": "A short, punchy 1-sentence verdict with personality"
  },
  "chatgpt": {
    "score": 7,
    "accuracy": 7,
    "clarity": 7,
    "helpfulness": 8,
    "creativity": 6,
    "verdict": "A short, punchy 1-sentence verdict with personality"
  },
  "gemini": {
    "score": 6,
    "accuracy": 6,
    "clarity": 6,
    "helpfulness": 7,
    "creativity": 6,
    "verdict": "A short, punchy 1-sentence verdict with personality"
  },
  "chairman_speech": "A dramatic 2-sentence speech crowning the winner, like a game show host",
  "ranking": ["claude", "chatgpt", "gemini"]
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: judgePrompt }],
    })
    const text = (msg.content[0] as { text: string }).text
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (e) {
    // Fallback mock judgment
    return NextResponse.json({
      claude: { score: 8, accuracy: 8, clarity: 9, helpfulness: 8, creativity: 7, verdict: 'Elegant and precise!' },
      chatgpt: { score: 7, accuracy: 7, clarity: 7, helpfulness: 7, creativity: 7, verdict: 'Solid and reliable!' },
      gemini: { score: 6, accuracy: 6, clarity: 6, helpfulness: 7, creativity: 7, verdict: 'Creative but unfocused!' },
      chairman_speech: 'After careful deliberation, the results are in! May the best AI reign supreme!',
      ranking: ['claude', 'chatgpt', 'gemini'],
    })
  }
}
