'use client'
import { motion } from 'framer-motion'
import { CHAR_CONFIG, CharName } from './Character'

interface JudgeResult {
  score: number
  accuracy: number
  clarity: number
  helpfulness: number
  creativity: number
  verdict: string
}

interface MiniPodiumProps {
  ranking: CharName[]
  scores: Record<CharName, JudgeResult>
  chairmanSpeech: string
  selectedAI: CharName
  onSelect: (ai: CharName) => void
}

const RANK_MEDAL = ['🥇', '🥈', '🥉']
const PODIUM_HEIGHTS = ['h-20', 'h-14', 'h-10']
// display order: 2nd (left), 1st (center), 3rd (right)
const DISPLAY_ORDER = [1, 0, 2]

export default function Podium({ ranking, scores, chairmanSpeech, selectedAI, onSelect }: MiniPodiumProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Chairman speech */}
      <motion.div
        className="px-4 py-2 rounded-lg border text-center max-w-lg"
        style={{ borderColor: '#C9A84C60', background: 'rgba(201,168,76,0.08)' }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-[8px] font-game mr-1" style={{ color: '#C9A84C' }}>👑 CHAIRMAN:</span>
        <span className="text-[9px] text-gray-300" style={{ fontFamily: 'sans-serif' }}>
          {chairmanSpeech}
        </span>
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3">
        {DISPLAY_ORDER.map((rankIdx, podiumPos) => {
          const ai = ranking[rankIdx] as CharName
          if (!ai) return null
          const info = CHAR_CONFIG[ai]
          const rank = rankIdx + 1
          const isWinner = rank === 1
          const isLast = rank === 3
          const podiumHeight = DISPLAY_ORDER.indexOf(podiumPos) // not right, let me fix
          // center=1st tallest, left=2nd medium, right=3rd shortest
          const heights = ['h-14', 'h-20', 'h-10']
          const h = podiumPos === 1 ? 'h-20' : podiumPos === 0 ? 'h-14' : 'h-10'
          const isSelected = selectedAI === ai

          return (
            <motion.div
              key={ai}
              className="flex flex-col items-center gap-1 cursor-pointer"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + podiumPos * 0.15 }}
              onClick={() => onSelect(ai)}
            >
              {/* Medals / crown */}
              <div className="text-lg mb-0.5">
                {rank === 1 && (
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                    👑
                  </motion.span>
                )}
                {rank === 2 && '🥈'}
                {rank === 3 && (
                  <motion.span animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 0.4, repeat: Infinity }}>
                    😭
                  </motion.span>
                )}
              </div>

              {/* AI head on podium */}
              <motion.div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg border-2 font-bold"
                style={{
                  background: info.headBg,
                  borderColor: isSelected ? '#fff' : info.color,
                  color: info.color,
                  boxShadow: isSelected
                    ? `0 0 16px #fff8, 0 0 8px ${info.color}`
                    : `0 0 12px ${info.color}60`,
                }}
                animate={isWinner ? { scale: [1, 1.06, 1] } : isLast ? { rotate: [-2, 2, -2] } : {}}
                transition={{ duration: isLast ? 0.4 : 1.5, repeat: Infinity }}
              >
                {info.logoChar}
              </motion.div>

              {/* Crying tears */}
              {isLast && (
                <>
                  <motion.div
                    className="absolute text-xs"
                    style={{ marginTop: '28px', marginLeft: '-6px' }}
                    animate={{ y: [0, 8], opacity: [1, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  >
                    💧
                  </motion.div>
                  <motion.div
                    className="absolute text-xs"
                    style={{ marginTop: '28px', marginLeft: '6px' }}
                    animate={{ y: [0, 8], opacity: [1, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: 0.35 }}
                  >
                    💧
                  </motion.div>
                </>
              )}

              {/* Score */}
              <div className="text-[10px] font-game" style={{ color: info.color }}>
                {scores[ai]?.score ?? '?'}/10
              </div>

              {/* Podium block */}
              <div
                className={`w-16 ${h} rounded-t flex items-center justify-center font-game text-base font-bold relative overflow-hidden`}
                style={{
                  background:
                    rank === 1
                      ? 'linear-gradient(180deg,#FFD700,#B8860B)'
                      : rank === 2
                      ? 'linear-gradient(180deg,#C0C0C0,#808080)'
                      : 'linear-gradient(180deg,#CD7F32,#8B4513)',
                  boxShadow: isSelected ? `0 0 12px ${info.color}` : '0 4px 12px rgba(0,0,0,0.5)',
                  border: isSelected ? `2px solid ${info.color}` : '2px solid rgba(255,255,255,0.15)',
                }}
              >
                <span className="text-black">{rank}</span>
                {rank === 1 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-15 pointer-events-none" />
                )}
              </div>

              {/* Name */}
              <div className="text-[7px] font-game" style={{ color: isSelected ? '#fff' : info.color }}>
                {info.label}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Click hint */}
      <div className="text-[7px] font-game text-gray-600">
        ▶ CLICK CHARACTER TO VIEW RESPONSE
      </div>
    </div>
  )
}
