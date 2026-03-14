'use client'
import { motion } from 'framer-motion'

export type CharName = 'claude' | 'chatgpt' | 'gemini' | 'chairman'
type Phase = 'idle' | 'writing' | 'judging' | 'results'

interface CharacterProps {
  name: CharName
  phase: Phase
  facingForward?: boolean
  size?: number // displayed width in px, default 150
}

export const CHAR_CONFIG: Record<CharName, {
  color: string
  headBg: string
  shirtColor: string
  label: string
}> = {
  claude:   { color: '#D97559', headBg: '#1c0d08', shirtColor: '#5a2010', label: 'CLAUDE' },
  chatgpt:  { color: '#10A37F', headBg: '#071a14', shirtColor: '#054535', label: 'CHATGPT' },
  gemini:   { color: '#4285F4', headBg: '#080f28', shirtColor: '#102060', label: 'GEMINI' },
  chairman: { color: '#C9A84C', headBg: '#0a0a18', shirtColor: '#12122a', label: 'CHAIRMAN' },
}

// ── Logo illustrations inside each head ──────────────────────────────────────
function ClaudeLogo() {
  // Diamond shape (◈ inspired)
  return (
    <>
      <path d="M70 18 L98 50 L70 82 L42 50 Z" fill="none" stroke="#D97559" strokeWidth="4" strokeLinejoin="round" />
      <path d="M70 32 L86 50 L70 68 L54 50 Z" fill="#D97559" />
    </>
  )
}

function ChatGPTLogo() {
  // Simplified OpenAI swirl
  const petals = [0, 30, 60, 90, 120, 150]
  return (
    <>
      {petals.map((deg) => (
        <rect
          key={deg}
          x="63" y="24"
          width="14" height="36"
          rx="7"
          fill="#10A37F"
          opacity="0.82"
          transform={`rotate(${deg} 70 50)`}
        />
      ))}
      <circle cx="70" cy="50" r="9" fill="#071a14" />
      <circle cx="70" cy="50" r="5" fill="#10A37F" />
    </>
  )
}

function GeminiLogo() {
  // 4-pointed star — Gemini style
  return (
    <>
      <path d="M70 14 C70 32 82 40 70 50 C58 40 70 32 70 14Z" fill="#4285F4" />
      <path d="M70 86 C70 68 58 60 70 50 C82 60 70 68 70 86Z" fill="#4285F4" />
      <path d="M34 50 C52 50 60 38 70 50 C60 62 52 50 34 50Z" fill="#4285F4" />
      <path d="M106 50 C88 50 80 62 70 50 C80 38 88 50 106 50Z" fill="#4285F4" />
    </>
  )
}

function ChairmanLogo() {
  return (
    <>
      {/* Crown */}
      <path
        d="M38 76 L38 46 L55 62 L70 28 L85 62 L102 46 L102 76 Z"
        fill="#C9A84C"
        stroke="#E8C060"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="35" y="74" width="70" height="12" rx="4" fill="#C9A84C" stroke="#E8C060" strokeWidth="1.5" />
      <circle cx="70" cy="40" r="5" fill="#fff" opacity="0.9" />
      <circle cx="52" cy="60" r="4" fill="#fff" opacity="0.9" />
      <circle cx="88" cy="60" r="4" fill="#fff" opacity="0.9" />
    </>
  )
}

function Logo({ name }: { name: CharName }) {
  // rendered inside a 140×100 viewBox centered on the head
  if (name === 'claude')   return <ClaudeLogo />
  if (name === 'chatgpt')  return <ChatGPTLogo />
  if (name === 'gemini')   return <GeminiLogo />
  return <ChairmanLogo />
}

// ── Main character SVG (140 × 230 viewBox) ──────────────────────────────────
function CharSVG({
  name,
  isWriting,
  isJudging,
}: {
  name: CharName
  isWriting: boolean
  isJudging: boolean
}) {
  const c = CHAR_CONFIG[name]
  const skin = '#e8b896'

  return (
    <svg
      viewBox="0 0 140 230"
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* ── Chair back ── */}
      <rect x="-8" y="108" width="156" height="16" rx="8" fill="#6b4226" stroke="#9b6a40" strokeWidth="1.5" />
      <rect x="-8" y="124" width="20" height="88" rx="8" fill="#6b4226" stroke="#9b6a40" strokeWidth="1" />
      <rect x="128" y="124" width="20" height="88" rx="8" fill="#6b4226" stroke="#9b6a40" strokeWidth="1" />

      {/* ── Suit jacket ── */}
      <path
        d="M8 122 C4 116 136 116 132 122 L122 215 L18 215 Z"
        fill={c.shirtColor}
      />
      {/* Jacket shading / lapels */}
      <path d="M54 116 L70 144 L86 116" fill={skin} />
      {/* White shirt visible in lapel */}
      <rect x="64" y="116" width="12" height="72" rx="4" fill="#f4f4f4" opacity="0.9" />
      {/* Tie for chairman */}
      {name === 'chairman' && (
        <polygon points="65,144 75,144 72,175 70,178 68,175" fill={c.color} opacity="0.9" />
      )}
      {/* Jacket highlight */}
      <path
        d="M8 122 L54 116 L70 144 L18 215"
        fill="rgba(255,255,255,0.04)"
      />

      {/* ── Left arm ── */}
      <motion.g
        animate={isWriting ? { rotate: [-3, 3, -3] } : {}}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '8px 134px' }}
      >
        <path
          d="M8 132 Q-6 150 0 164"
          stroke={c.shirtColor}
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="0" cy="167" rx="13" ry="10" fill={skin} />
      </motion.g>

      {/* ── Right arm ── */}
      <motion.g
        animate={
          isWriting
            ? { rotate: [0, -16, 0], y: [0, -4, 0] }
            : isJudging
            ? { rotate: [-10, 10, -10] }
            : {}
        }
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: '132px 134px' }}
      >
        <path
          d="M132 132 Q146 150 140 164"
          stroke={c.shirtColor}
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="140" cy="167" rx="13" ry="10" fill={skin} />
      </motion.g>

      {/* ── Pen when writing ── */}
      {isWriting && (
        <motion.text
          x="148"
          y="158"
          fontSize="18"
          animate={{ y: [158, 165, 158] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          style={{ userSelect: 'none' }}
        >
          ✏️
        </motion.text>
      )}

      {/* ── Clipboard when judging ── */}
      {isJudging && (
        <motion.text
          x="128"
          y="110"
          fontSize="24"
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 0.55, repeat: Infinity }}
          style={{ transformOrigin: '136px 112px', userSelect: 'none' }}
        >
          📋
        </motion.text>
      )}

      {/* ── Neck ── */}
      <rect x="59" y="100" width="22" height="18" rx="5" fill={skin} />

      {/* ── Head: outer glow ── */}
      <circle cx="70" cy="56" r="50" fill="none" stroke={c.color} strokeWidth="14" opacity="0.08" />
      {/* ── Head: circle ── */}
      <circle cx="70" cy="56" r="46" fill={c.headBg} stroke={c.color} strokeWidth="2.5" />

      {/* ── Logo (rendered in a 140×100 sub-space centered at head) ── */}
      {/* The logo functions draw in 0-140 x 0-100 coords centered at cx=70,cy=50 */}
      <g transform="translate(0, 6)">
        <Logo name={name} />
      </g>
    </svg>
  )
}

// ── Public component ──────────────────────────────────────────────────────────
export default function Character({
  name,
  phase,
  facingForward = false,
  size = 150,
}: CharacterProps) {
  const c = CHAR_CONFIG[name]
  const isWriting = phase === 'writing' && name !== 'chairman'
  const isJudging = name === 'chairman' && phase === 'judging'

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 select-none"
      animate={
        isWriting
          ? { y: [0, -5, 0], rotate: [0, -2, 2, 0] }
          : isJudging
          ? { scale: [1, 1.07, 1], y: [0, -8, 0] }
          : { y: [0, -6, 0] }
      }
      transition={
        isWriting
          ? { duration: 0.4, repeat: Infinity }
          : isJudging
          ? { duration: 0.9, repeat: Infinity }
          : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{ width: size }}
    >
      <div style={{ width: size, height: size * (230 / 140) }}>
        <CharSVG name={name} isWriting={isWriting} isJudging={isJudging} />
      </div>
      {/* Name badge */}
      <div
        style={{
          color: c.color,
          background: c.headBg,
          border: `1px solid ${c.color}60`,
          fontSize: 9,
          fontFamily: "'Press Start 2P', cursive",
          padding: '3px 8px',
          borderRadius: 4,
          letterSpacing: 1,
        }}
      >
        {c.label}
      </div>
    </motion.div>
  )
}
