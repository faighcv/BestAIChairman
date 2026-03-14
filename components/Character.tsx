'use client'
import { motion } from 'framer-motion'

export type CharName = 'claude' | 'chatgpt' | 'gemini' | 'chairman'
type Phase = 'idle' | 'writing' | 'judging' | 'results'

interface CharacterProps {
  name: CharName
  phase: Phase
  size?: 'normal' | 'small'
}

export const CHAR_CONFIG: Record<CharName, {
  color: string
  headBg: string
  shirtColor: string
  label: string
  logoChar: string
}> = {
  claude: {
    color: '#D97559',
    headBg: '#1c0d08',
    shirtColor: '#7a2e14',
    label: 'CLAUDE',
    logoChar: '◈',
  },
  chatgpt: {
    color: '#10A37F',
    headBg: '#071a14',
    shirtColor: '#065040',
    label: 'CHATGPT',
    logoChar: '⬡',
  },
  gemini: {
    color: '#4285F4',
    headBg: '#080f28',
    shirtColor: '#1040a0',
    label: 'GEMINI',
    logoChar: '✦',
  },
  chairman: {
    color: '#C9A84C',
    headBg: '#0a0a18',
    shirtColor: '#15152a',
    label: 'CHAIRMAN',
    logoChar: '♛',
  },
}

function StickmanSVG({
  name,
  isWriting,
  isJudging,
  scale = 1,
}: {
  name: CharName
  isWriting: boolean
  isJudging: boolean
  scale?: number
}) {
  const c = CHAR_CONFIG[name]
  const skin = '#e0a87a'
  const w = 100 * scale
  const h = 148 * scale

  return (
    <svg width={w} height={h} viewBox="0 0 100 148" overflow="visible">
      {/* Chair back (wooden) */}
      <rect x="8" y="50" width="84" height="9" rx="4.5" fill="#3d2b18" stroke="#7a5535" strokeWidth="1.5" />
      <rect x="8" y="59" width="12" height="68" rx="5" fill="#3d2b18" stroke="#7a5535" strokeWidth="1" />
      <rect x="80" y="59" width="12" height="68" rx="5" fill="#3d2b18" stroke="#7a5535" strokeWidth="1" />

      {/* Crown above chairman */}
      {name === 'chairman' && (
        <text x="50" y="10" textAnchor="middle" fontSize="16" style={{ userSelect: 'none' }}>
          👑
        </text>
      )}

      {/* HEAD outer glow */}
      <circle cx="50" cy="30" r="28" fill="none" stroke={c.color} strokeWidth="10" opacity="0.1" />
      {/* HEAD circle */}
      <circle cx="50" cy="30" r="26" fill={c.headBg} stroke={c.color} strokeWidth="2.5" />
      {/* AI Logo */}
      <text
        x="50"
        y="39"
        textAnchor="middle"
        fontSize="26"
        fill={c.color}
        fontWeight="bold"
        style={{ userSelect: 'none' }}
      >
        {c.logoChar}
      </text>

      {/* NECK */}
      <rect x="43" y="56" width="14" height="10" rx="3" fill={skin} />

      {/* SHIRT / TORSO */}
      <rect
        x="22"
        y="65"
        width="56"
        height="36"
        rx="7"
        fill={c.shirtColor}
        stroke={c.color}
        strokeWidth="1.5"
        opacity="0.92"
      />
      {/* Collar V */}
      <path d={`M38 65 L50 77 L62 65`} fill={skin} stroke={c.shirtColor} strokeWidth="1" />

      {/* Tie for chairman */}
      {name === 'chairman' && (
        <polygon points="47,77 53,77 51,96 50,99 49,96" fill={c.color} opacity="0.85" />
      )}

      {/* LEFT ARM */}
      <motion.g
        animate={isWriting ? { rotate: [-4, 4, -4] } : {}}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '22px 76px' }}
      >
        <rect x="3" y="73" width="20" height="9" rx="4.5" fill={c.shirtColor} stroke={c.color} strokeWidth="1" opacity="0.9" />
        <rect x="2" y="73" width="12" height="9" rx="4.5" fill={skin} />
      </motion.g>

      {/* RIGHT ARM */}
      <motion.g
        animate={
          isWriting
            ? { rotate: [0, -14, 0], y: [0, -3, 0] }
            : isJudging
            ? { rotate: [-10, 10, -10] }
            : {}
        }
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: '78px 76px' }}
      >
        <rect x="77" y="73" width="20" height="9" rx="4.5" fill={c.shirtColor} stroke={c.color} strokeWidth="1" opacity="0.9" />
        <rect x="86" y="73" width="12" height="9" rx="4.5" fill={skin} />
      </motion.g>

      {/* PEN when writing */}
      {isWriting && (
        <motion.text
          x="96"
          y="68"
          fontSize="13"
          animate={{ y: [68, 74, 68] }}
          transition={{ duration: 0.35, repeat: Infinity }}
          style={{ userSelect: 'none' }}
        >
          ✏️
        </motion.text>
      )}

      {/* CLIPBOARD when judging */}
      {isJudging && (
        <motion.text
          x="78"
          y="52"
          fontSize="18"
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 0.55, repeat: Infinity }}
          style={{ transformOrigin: '84px 52px', userSelect: 'none' }}
        >
          📋
        </motion.text>
      )}
    </svg>
  )
}

export default function Character({ name, phase, size = 'normal' }: CharacterProps) {
  const c = CHAR_CONFIG[name]
  const isWriting = phase === 'writing' && name !== 'chairman'
  const isJudging = name === 'chairman' && phase === 'judging'
  const svgScale = size === 'small' ? 0.65 : 1

  return (
    <motion.div
      className="flex flex-col items-center gap-1 select-none"
      animate={
        isWriting
          ? { y: [0, -4, 0], rotate: [0, -1.5, 1.5, 0] }
          : isJudging
          ? { scale: [1, 1.08, 1], y: [0, -7, 0] }
          : { y: [0, -5, 0] }
      }
      transition={
        isWriting
          ? { duration: 0.4, repeat: Infinity }
          : isJudging
          ? { duration: 0.9, repeat: Infinity }
          : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <StickmanSVG name={name} isWriting={isWriting} isJudging={isJudging} scale={svgScale} />
      <div
        className="text-[7px] font-game px-2 py-0.5 rounded"
        style={{ color: c.color, background: c.headBg + 'cc', border: `1px solid ${c.color}50` }}
      >
        {c.label}
      </div>
    </motion.div>
  )
}
