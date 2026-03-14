'use client'
import { motion } from 'framer-motion'

type AIName = 'claude' | 'chatgpt' | 'gemini'

interface JudgeResult {
  score: number
  accuracy: number
  clarity: number
  helpfulness: number
  creativity: number
  verdict: string
}

interface PodiumProps {
  ranking: AIName[]
  scores: Record<AIName, JudgeResult>
  chairmanSpeech: string
}

const AI_INFO: Record<AIName, { color: string; label: string; bg: string; border: string }> = {
  claude: { color: '#D97559', label: 'CLAUDE', bg: 'rgba(217,117,89,0.2)', border: '#D97559' },
  chatgpt: { color: '#10A37F', label: 'CHATGPT', bg: 'rgba(16,163,127,0.2)', border: '#10A37F' },
  gemini: { color: '#4285F4', label: 'GEMINI', bg: 'rgba(66,133,244,0.2)', border: '#4285F4' },
}

const PODIUM_HEIGHTS = { 0: 'h-32', 1: 'h-24', 2: 'h-16' }
const PODIUM_ORDER = [1, 0, 2] // display: 2nd, 1st, 3rd

export default function Podium({ ranking, scores, chairmanSpeech }: PodiumProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Chairman speech */}
      <motion.div
        className="text-center px-4 py-3 rounded-lg border"
        style={{ borderColor: '#C9A84C', background: 'rgba(201,168,76,0.1)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-[8px] font-game mb-1" style={{ color: '#C9A84C' }}>
          👑 CHAIRMAN VERDICT
        </div>
        <div className="text-[9px] text-gray-300 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
          {chairmanSpeech}
        </div>
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 w-full px-4">
        {PODIUM_ORDER.map((rankIndex, podiumPos) => {
          const ai = ranking[rankIndex] as AIName
          const info = AI_INFO[ai]
          const actualRank = rankIndex + 1 // 1st, 2nd, 3rd
          const podiumPos1Based = podiumPos === 1 ? 0 : podiumPos === 0 ? 1 : 2
          const heights = ['h-32', 'h-24', 'h-16']
          const podiumHeight = heights[podiumPos1Based]

          return (
            <motion.div
              key={ai}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + podiumPos * 0.2 }}
            >
              {/* Character on podium */}
              <div className="relative flex flex-col items-center mb-1">
                {/* Crown / medal */}
                {actualRank === 1 && (
                  <motion.div
                    className="text-2xl absolute -top-7"
                    animate={{ y: [0, -4, 0], rotate: [-5, 5, -5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    👑
                  </motion.div>
                )}
                {actualRank === 2 && <div className="text-xl absolute -top-7">🥈</div>}
                {actualRank === 3 && (
                  <motion.div
                    className="text-xl absolute -top-7"
                    animate={{ rotate: [-3, 3, -3] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    😭
                  </motion.div>
                )}

                {/* AI Head */}
                <motion.div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2"
                  style={{
                    background: info.bg,
                    borderColor: info.border,
                    boxShadow: `0 0 16px ${info.color}80`,
                    color: info.color,
                  }}
                  animate={
                    actualRank === 1
                      ? { y: [0, -4, 0], scale: [1, 1.05, 1] }
                      : actualRank === 3
                      ? { rotate: [-2, 2, -2] }
                      : { y: [0, -2, 0] }
                  }
                  transition={{ duration: actualRank === 3 ? 0.4 : 1.5, repeat: Infinity }}
                >
                  {ai === 'claude' && '◈'}
                  {ai === 'chatgpt' && '⬡'}
                  {ai === 'gemini' && '✦'}
                </motion.div>

                {/* Crying tears for 3rd */}
                {actualRank === 3 && (
                  <>
                    <motion.div
                      className="absolute top-8 left-1 text-xs"
                      animate={{ y: [0, 8], opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                    >
                      💧
                    </motion.div>
                    <motion.div
                      className="absolute top-8 right-1 text-xs"
                      animate={{ y: [0, 8], opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                    >
                      💧
                    </motion.div>
                  </>
                )}

                {/* Stars for 1st */}
                {actualRank === 1 &&
                  ['⭐', '✨', '⭐'].map((star, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-xs"
                      style={{ left: `${-12 + i * 20}px`, top: `${-4 - i * 4}px` }}
                      animate={{ rotate: 360, scale: [1, 1.3, 1] }}
                      transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
                    >
                      {star}
                    </motion.div>
                  ))}
              </div>

              {/* Score */}
              <div className="text-[10px] font-game" style={{ color: info.color }}>
                {scores[ai]?.score ?? '?'}/10
              </div>

              {/* Podium block */}
              <div
                className={`w-20 ${podiumHeight} rounded-t-lg flex items-center justify-center relative overflow-hidden`}
                style={{
                  background:
                    actualRank === 1
                      ? 'linear-gradient(180deg, #FFD700, #B8860B)'
                      : actualRank === 2
                      ? 'linear-gradient(180deg, #C0C0C0, #808080)'
                      : 'linear-gradient(180deg, #CD7F32, #8B4513)',
                  boxShadow: `0 4px 16px rgba(0,0,0,0.5)`,
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                <div className="text-black font-game text-lg font-bold">{actualRank}</div>
                {actualRank === 1 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-20" />
                )}
              </div>

              {/* Name */}
              <div className="text-[8px] font-game" style={{ color: info.color }}>
                {info.label}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
