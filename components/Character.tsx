'use client'
import { motion } from 'framer-motion'

type Phase = 'idle' | 'writing' | 'judging' | 'results'

interface CharacterProps {
  name: 'claude' | 'chatgpt' | 'gemini' | 'chairman'
  phase: Phase
  isJudging?: boolean
}

const CHARS = {
  claude: {
    color: '#D97559',
    bg: 'rgba(217,117,89,0.15)',
    border: '#D97559',
    label: 'CLAUDE',
    emoji: '🤖',
    bodyColor: '#D97559',
    logoChar: '◈',
  },
  chatgpt: {
    color: '#10A37F',
    bg: 'rgba(16,163,127,0.15)',
    border: '#10A37F',
    label: 'CHATGPT',
    emoji: '🤖',
    bodyColor: '#10A37F',
    logoChar: '⬡',
  },
  gemini: {
    color: '#4285F4',
    bg: 'rgba(66,133,244,0.15)',
    border: '#4285F4',
    label: 'GEMINI',
    emoji: '🤖',
    bodyColor: '#4285F4',
    logoChar: '✦',
  },
  chairman: {
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.15)',
    border: '#C9A84C',
    label: 'CHAIRMAN',
    emoji: '👑',
    bodyColor: '#2a2a2a',
    logoChar: '♛',
  },
}

export default function Character({ name, phase, isJudging }: CharacterProps) {
  const char = CHARS[name]
  const isWriting = phase === 'writing' && name !== 'chairman'
  const isChairmanJudging = name === 'chairman' && phase === 'judging'

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Body */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={
          isWriting
            ? { y: [0, -3, 0], rotate: [0, -1, 1, 0] }
            : isChairmanJudging
            ? { scale: [1, 1.05, 1], y: [0, -5, 0] }
            : { y: [0, -4, 0] }
        }
        transition={
          isWriting
            ? { duration: 0.4, repeat: Infinity }
            : isChairmanJudging
            ? { duration: 0.8, repeat: Infinity }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Crown for chairman */}
        {name === 'chairman' && (
          <div className="text-lg mb-[-2px]" style={{ filter: `drop-shadow(0 0 6px ${char.color})` }}>
            👑
          </div>
        )}

        {/* Head with logo */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 relative"
          style={{
            background: char.bg,
            borderColor: char.border,
            boxShadow: `0 0 12px ${char.color}60`,
            color: char.color,
          }}
        >
          {/* Logo SVG */}
          {name === 'claude' && <ClaudeLogo />}
          {name === 'chatgpt' && <ChatGPTLogo />}
          {name === 'gemini' && <GeminiLogo />}
          {name === 'chairman' && <span style={{ fontSize: '1.4rem' }}>🧑‍💼</span>}

          {/* Writing indicator */}
          {isWriting && (
            <motion.div
              className="absolute -top-2 -right-2 text-xs"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              ✏️
            </motion.div>
          )}
        </div>

        {/* Torso */}
        <div
          className="w-10 h-8 rounded-b-lg mt-[-2px]"
          style={{ background: char.bodyColor, border: `2px solid ${char.border}`, borderTop: 'none' }}
        />

        {/* Paper when writing */}
        {isWriting && (
          <motion.div
            className="absolute -right-8 top-8 w-8 h-10 paper rounded-sm flex flex-col gap-1 p-1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: [-2, 2, -2] }}
            transition={{ rotate: { duration: 0.3, repeat: Infinity } }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="h-0.5 rounded bg-gray-400"
                initial={{ width: 0 }}
                animate={{ width: `${40 + i * 10}%` }}
                transition={{ delay: i * 0.3, duration: 0.5 }}
              />
            ))}
          </motion.div>
        )}

        {/* Judging papers for chairman */}
        {isChairmanJudging && (
          <motion.div
            className="absolute -left-10 top-4 text-2xl"
            animate={{ rotate: [-5, 5, -5], x: [-2, 2, -2] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            📋
          </motion.div>
        )}
      </motion.div>

      {/* Name tag */}
      <div
        className="text-[8px] font-game px-2 py-0.5 rounded border"
        style={{ color: char.color, borderColor: char.border, background: char.bg }}
      >
        {char.label}
      </div>
    </div>
  )
}

function ClaudeLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" fill="#D97559" opacity="0.2" />
      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#D97559">
        ◈
      </text>
    </svg>
  )
}

function ChatGPTLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" fill="#10A37F" opacity="0.2" />
      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#10A37F">
        ⬡
      </text>
    </svg>
  )
}

function GeminiLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" fill="#4285F4" opacity="0.2" />
      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#4285F4">
        ✦
      </text>
    </svg>
  )
}
