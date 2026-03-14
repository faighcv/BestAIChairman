import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function getClaude(prompt: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    return (msg.content[0] as { text: string }).text
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string }
    if (err.status === 401) return '⚠️ Claude: Invalid API key. Get one at console.anthropic.com (note: Claude.ai Pro ≠ API access)'
    if (err.status === 429) return '⚠️ Claude: Out of credits. Add credits at console.anthropic.com'
    return `⚠️ Claude error: ${err.message || 'unknown'}`
  }
}

async function getChatGPT(prompt: string): Promise<string> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
    })
    return res.choices[0].message.content || '(No response)'
  } catch {
    return '⚠️ ChatGPT is unavailable. (Check OPENAI_API_KEY)'
  }
}

async function getGemini(prompt: string): Promise<string> {
  try {
    const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (e: unknown) {
    const err = e as { message?: string }
    if (err.message?.includes('API_KEY_INVALID')) return '⚠️ Gemini: Invalid API key. Get a FREE key at aistudio.google.com (Gemini subscription ≠ API key)'
    return `⚠️ Gemini error: ${err.message || 'unknown'}`
  }
}

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'No prompt' }, { status: 400 })

  const [claude, chatgpt, gemini] = await Promise.all([
    getClaude(prompt),
    getChatGPT(prompt),
    getGemini(prompt),
  ])

  return NextResponse.json({ claude, chatgpt, gemini })
}
