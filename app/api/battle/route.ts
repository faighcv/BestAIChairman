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
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    return (msg.content[0] as { text: string }).text
  } catch {
    return '⚠️ Claude is unavailable right now. (Check ANTHROPIC_API_KEY)'
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
  } catch {
    return '⚠️ Gemini is unavailable. (Check GEMINI_API_KEY)'
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
