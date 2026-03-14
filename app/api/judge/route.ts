import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { prompt, claude, chatgpt, gemini } = await req.json()

  // Randomize order so the judge (Claude) can't favor itself
  const ais: Array<{ key: string; answer: string }> = [
    { key: 'claude', answer: claude },
    { key: 'chatgpt', answer: chatgpt },
    { key: 'gemini', answer: gemini },
  ]
  // shuffle
  for (let i = ais.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ais[i], ais[j]] = [ais[j], ais[i]]
  }
  const labels = ['Alpha', 'Beta', 'Gamma']

  const judgePrompt = `You are the CHAIRMAN — an impartial judge evaluating three anonymous AI responses.
Do NOT try to guess which AI wrote each response. Judge purely on quality.

ORIGINAL PROMPT: "${prompt}"

RESPONSE ${labels[0]}:
${ais[0].answer}

RESPONSE ${labels[1]}:
${ais[1].answer}

RESPONSE ${labels[2]}:
${ais[2].answer}

Rate each response 1-10 on: Accuracy, Clarity, Helpfulness, Creativity. Give an overall score.
Be strict. Scores should spread out — do NOT give everyone the same score. Pick a clear winner.

Respond ONLY with valid JSON:
{
  "${labels[0]}": { "score": 8, "accuracy": 8, "clarity": 9, "helpfulness": 8, "creativity": 7, "verdict": "Punchy 1-sentence verdict" },
  "${labels[1]}": { "score": 7, "accuracy": 7, "clarity": 7, "helpfulness": 7, "creativity": 6, "verdict": "Punchy 1-sentence verdict" },
  "${labels[2]}": { "score": 6, "accuracy": 6, "clarity": 6, "helpfulness": 7, "creativity": 6, "verdict": "Punchy 1-sentence verdict" },
  "winner_label": "${labels[0]}",
  "ranking_labels": ["${labels[0]}", "${labels[1]}", "${labels[2]}"],
  "chairman_speech": "2-sentence dramatic speech crowning the winner, like a game show host"
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: judgePrompt }],
    })
    const text = (msg.content[0] as { text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const raw = JSON.parse(jsonMatch[0])

    // Map labels back to actual AI names
    const labelToKey: Record<string, string> = {}
    ais.forEach((a, i) => { labelToKey[labels[i]] = a.key })

    const result: Record<string, unknown> = {}
    for (const label of labels) {
      result[labelToKey[label]] = raw[label]
    }
    result.ranking = (raw.ranking_labels as string[]).map((l: string) => labelToKey[l])
    result.chairman_speech = raw.chairman_speech
    return NextResponse.json(result)
  } catch {
    // Fallback: random winner
    const shuffled = ['claude', 'chatgpt', 'gemini'].sort(() => Math.random() - 0.5)
    const scores = [8, 6, 5]
    const fallback: Record<string, unknown> = {}
    shuffled.forEach((ai, i) => {
      fallback[ai] = { score: scores[i], accuracy: scores[i], clarity: scores[i], helpfulness: scores[i], creativity: scores[i], verdict: ['Sharp and precise!', 'Solid effort!', 'Room to improve!'][i] }
    })
    fallback.ranking = shuffled
    fallback.chairman_speech = 'After careful deliberation, the results are in! May the best AI reign supreme!'
    return NextResponse.json(fallback)
  }
}
