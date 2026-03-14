'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'

type AIName = 'claude' | 'chatgpt' | 'gemini'

interface JudgeResult {
  score: number
  accuracy: number
  clarity: number
  helpfulness: number
  creativity: number
  verdict: string
}

interface ScoreCardProps {
  name: AIName
  result: JudgeResult
  answer: string
  rank: number
  delay?: number
}

const AI_INFO: Record<AIName, { color: string; label: string; bg: string; border: string }> = {
  claude: { color: '#D97559', label: 'CLAUDE', bg: 'rgba(217,117,89,0.1)', border: '#D97559' },
  chatgpt: { color: '#10A37F', label: 'CHATGPT', bg: 'rgba(16,163,127,0.1)', border: '#10A37F' },
  gemini: { color: '#4285F4', label: 'GEMINI', bg: 'rgba(66,133,244,0.1)', border: '#4285F4' },
}

const RANK_EMOJI = ['🥇', '🥈', '🥉']

const CRITERIA = [
  { key: 'accuracy', label: 'ACCURACY' },
  { key: 'clarity', label: 'CLARITY' },
  { key: 'helpfulness', label: 'HELP' },
  { key: 'creativity', label: 'STYLE' },
] as const

export default function ScoreCard({ name, result, answer, rank, delay = 0 }: ScoreCardProps) {
  const info = AI_INFO[name]
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      className="rounded-lg border overflow-hidden cursor-pointer"
      style={{ borderColor: info.border, background: info.bg }}
      initial={{ opacity: 0, x: rank % 2 === 0 ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{RANK_EMOJI[rank - 1] || '🤖'}</span>
          <span className="text-[9px] font-game" style={{ color: info.color }}>
            {info.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-[10px] font-game px-2 py-1 rounded border"
            style={{ color: info.color, borderColor: info.border }}
          >
            {result.score}/10
          </div>
          <span className="text-[10px]" style={{ color: info.color }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Verdict */}
      <div className="px-3 pb-1">
        <p className="text-[8px] text-gray-400" style={{ fontFamily: 'sans-serif' }}>
          &ldquo;{result.verdict}&rdquo;
        </p>
      </div>

      {/* Score bars */}
      <div className="px-3 pb-2 flex flex-col gap-1">
        {CRITERIA.map((c) => (
          <div key={c.key} className="flex items-center gap-2">
            <span className="text-[7px] font-game w-14 text-gray-500">{c.label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: info.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(result[c.key] / 10) * 100}%` }}
                transition={{ delay: delay + 0.3, duration: 0.8 }}
              />
            </div>
            <span className="text-[8px] font-game w-4" style={{ color: info.color }}>
              {result[c.key]}
            </span>
          </div>
        ))}
      </div>

      {/* Answer (expandable) */}
      {expanded && (
        <motion.div
          className="border-t px-3 py-2"
          style={{ borderColor: info.border + '40' }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
        >
          <div className="text-[8px] font-game mb-1" style={{ color: info.color }}>
            ANSWER:
          </div>
          <div
            className="text-[9px] text-gray-300 leading-relaxed max-h-32 overflow-y-auto"
            style={{ fontFamily: 'sans-serif' }}
          >
            {answer}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
