'use client'
import { motion } from 'framer-motion'

export type CharName = 'claude' | 'chatgpt' | 'gemini' | 'chairman'
type Phase = 'idle' | 'writing' | 'judging' | 'results'

interface CharacterProps {
  name: CharName
  phase: Phase
  size?: number
  speech?: string          // text to show in speech bubble
  speechSide?: 'left' | 'right'
}

export const CHAR_CONFIG: Record<CharName, {
  color: string
  headBg: string
  shirtColor: string
  shirtLight: string
  label: string
}> = {
  claude:   { color: '#D97559', headBg: '#180b05', shirtColor: '#4a1e0e', shirtLight: '#6b2e18', label: 'CLAUDE' },
  chatgpt:  { color: '#10A37F', headBg: '#041510', shirtColor: '#043828', shirtLight: '#075c42', label: 'CHATGPT' },
  gemini:   { color: '#4285F4', headBg: '#040e24', shirtColor: '#0c2668', shirtLight: '#1840a8', label: 'GEMINI' },
  chairman: { color: '#C9A84C', headBg: '#08080f', shirtColor: '#0e0e1e', shirtLight: '#1c1c34', label: 'CHAIRMAN' },
}

// ── AI Logos (all coords in 200×100 space, centered at 100,50) ──────────────

function ClaudeLogo() {
  return (
    <>
      <path d="M100 12 L136 50 L100 88 L64 50 Z" fill="none" stroke="#D97559" strokeWidth="5.5" strokeLinejoin="round" />
      <path d="M100 30 L118 50 L100 70 L82 50 Z" fill="#D97559" />
    </>
  )
}

function ChatGPTLogo() {
  const angles = [0, 30, 60, 90, 120, 150]
  return (
    <>
      {angles.map(deg => (
        <rect key={deg} x="92" y="18" width="16" height="40" rx="8"
          fill="#10A37F" opacity="0.8" transform={`rotate(${deg} 100 50)`} />
      ))}
      <circle cx="100" cy="50" r="10" fill="#041510" />
      <circle cx="100" cy="50" r="6"  fill="#10A37F" />
    </>
  )
}

function GeminiLogo() {
  return (
    <>
      <path d="M100 10 C100 30 116 40 100 50 C84 40 100 30 100 10Z"  fill="#4285F4" />
      <path d="M100 90 C100 70 84 60 100 50 C116 60 100 70 100 90Z"  fill="#4285F4" />
      <path d="M60 50  C80 50 90 36 100 50 C90 64 80 50 60 50Z"      fill="#4285F4" />
      <path d="M140 50 C120 50 110 64 100 50 C110 36 120 50 140 50Z" fill="#4285F4" />
    </>
  )
}

function ChairmanLogo() {
  return (
    <>
      <path d="M62 82 L62 46 L80 64 L100 28 L120 64 L138 46 L138 82 Z"
        fill="#C9A84C" stroke="#E8C060" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="58" y="80" width="84" height="13" rx="5"
        fill="#C9A84C" stroke="#E8C060" strokeWidth="1.5" />
      <circle cx="100" cy="42" r="6" fill="#fff9d6" />
      <circle cx="76"  cy="66" r="5" fill="#fff9d6" />
      <circle cx="124" cy="66" r="5" fill="#fff9d6" />
    </>
  )
}

// ── Character SVG body (viewBox 200×310) ─────────────────────────────────────
function CharBody({
  name,
  isWriting,
  isJudging,
}: { name: CharName; isWriting: boolean; isJudging: boolean }) {
  const c = CHAR_CONFIG[name]
  const skin = '#e8b896'

  return (
    <svg viewBox="0 0 200 310" style={{ overflow: 'visible', display: 'block' }}>

      {/* ── Drop shadow ── */}
      <ellipse cx="100" cy="305" rx="72" ry="7" fill="rgba(0,0,0,0.35)" />

      {/* ── Chair back ── */}
      <rect x="-2"  y="126" width="204" height="20" rx="10" fill="#5a3d20" stroke="#8a6040" strokeWidth="2" />
      <rect x="-2"  y="146" width="24"  height="130" rx="10" fill="#5a3d20" stroke="#8a6040" strokeWidth="1.5" />
      <rect x="178" y="146" width="24"  height="130" rx="10" fill="#5a3d20" stroke="#8a6040" strokeWidth="1.5" />

      {/* ── Suit jacket body ── */}
      {/* Main fill */}
      <path d="M12 140 Q6 134 194 134 Q198 140 182 275 Q100 270 18 275 Z" fill={c.shirtColor} />
      {/* Lighter side highlight */}
      <path d="M12 140 L60 134 L100 158 L140 134 L188 140 L174 275 Q100 270 26 275 Z"
        fill={c.shirtLight} opacity="0.18" />

      {/* ── Left lapel ── */}
      <path d="M78 134 L100 162 L72 134" fill={skin} />
      {/* ── Right lapel ── */}
      <path d="M122 134 L100 162 L128 134" fill={skin} />
      {/* ── White shirt centre ── */}
      <path d="M78 134 L100 162 L122 134 L116 134 L100 156 L84 134 Z" fill="#f5f5ef" />

      {/* ── Tie (chairman) or shirt buttons ── */}
      {name === 'chairman' ? (
        <polygon points="95,162 105,162 102,196 100,200 98,196" fill={c.color} />
      ) : (
        <>
          <circle cx="100" cy="170" r="3.5" fill={c.shirtLight} opacity="0.7" />
          <circle cx="100" cy="184" r="3.5" fill={c.shirtLight} opacity="0.7" />
        </>
      )}

      {/* ── Left arm ── */}
      <motion.g
        animate={isWriting ? { rotate: [-4, 4, -4] } : {}}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '12px 148px' }}
      >
        <path d="M12 148 Q-12 172 -4 190" stroke={c.shirtColor} strokeWidth="30" strokeLinecap="round" fill="none" />
        <ellipse cx="-5" cy="194" rx="17" ry="13" fill={skin} />
      </motion.g>

      {/* ── Right arm (writing arm) ── */}
      <motion.g
        animate={
          isWriting  ? { rotate: [0, -18, 0], y: [0, -5, 0] } :
          isJudging  ? { rotate: [-12, 12, -12] } : {}
        }
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: '188px 148px' }}
      >
        <path d="M188 148 Q212 172 204 190" stroke={c.shirtColor} strokeWidth="30" strokeLinecap="round" fill="none" />
        <ellipse cx="205" cy="194" rx="17" ry="13" fill={skin} />
      </motion.g>

      {/* ── Pen ── */}
      {isWriting && (
        <motion.text x="210" y="182" fontSize="22"
          animate={{ y: [182, 190, 182] }}
          transition={{ duration: 0.38, repeat: Infinity }}
          style={{ userSelect: 'none' }}
        >✏️</motion.text>
      )}

      {/* ── Clipboard ── */}
      {isJudging && (
        <motion.text x="188" y="120" fontSize="30"
          animate={{ rotate: [-12, 12, -12] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ transformOrigin: '196px 122px', userSelect: 'none' }}
        >📋</motion.text>
      )}

      {/* ── Neck ── */}
      <rect x="83" y="116" width="34" height="20" rx="7" fill={skin} />

      {/* ── Head glow ── */}
      <circle cx="100" cy="66" r="66" fill="none" stroke={c.color} strokeWidth="20" opacity="0.07" />
      {/* ── Head circle ── */}
      <circle cx="100" cy="66" r="62" fill={c.headBg} stroke={c.color} strokeWidth="3" />
      {/* ── Logo ── */}
      <g transform="translate(0, 16)">
        {name === 'claude'   && <ClaudeLogo />}
        {name === 'chatgpt'  && <ChatGPTLogo />}
        {name === 'gemini'   && <GeminiLogo />}
        {name === 'chairman' && <ChairmanLogo />}
      </g>
    </svg>
  )
}

// ── Public component ──────────────────────────────────────────────────────────
export default function Character({
  name,
  phase,
  size = 170,
  speech,
  speechSide = 'right',
}: CharacterProps) {
  const c = CHAR_CONFIG[name]
  const isWriting = phase === 'writing' && name !== 'chairman'
  const isJudging = name === 'chairman' && phase === 'judging'

  return (
    <motion.div
      className="flex flex-col items-center select-none relative"
      animate={
        isWriting  ? { y: [0, -6, 0], rotate: [0, -2, 2, 0] } :
        isJudging  ? { scale: [1, 1.08, 1], y: [0, -9, 0] } :
                     { y: [0, -7, 0] }
      }
      transition={
        isWriting ? { duration: 0.4, repeat: Infinity } :
        isJudging ? { duration: 0.9, repeat: Infinity } :
                    { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{ width: size }}
    >
      {/* Speech bubble */}
      {speech && (
        <motion.div
          className="absolute z-20"
          style={{
            top: 0,
            [speechSide === 'right' ? 'left' : 'right']: size * 0.85,
            maxWidth: 180,
          }}
          initial={{ opacity: 0, scale: 0.8, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -6 }}
        >
          <div
            style={{
              background: 'rgba(8,8,20,0.95)',
              border: `1.5px solid ${c.color}80`,
              borderRadius: 10,
              color: '#e8e8e8',
              fontFamily: 'sans-serif',
              fontSize: 11,
              padding: '7px 11px',
              lineHeight: 1.5,
              boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 8px ${c.color}20`,
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            {speech}
            {/* Tail */}
            <div style={{
              position: 'absolute',
              bottom: -8,
              [speechSide === 'right' ? 'left' : 'right']: 14,
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: `8px solid ${c.color}80`,
            }} />
          </div>
        </motion.div>
      )}

      {/* Body SVG */}
      <div style={{ width: size, height: size * (310 / 200) }}>
        <CharBody name={name} isWriting={isWriting} isJudging={isJudging} />
      </div>

      {/* Name badge */}
      <div style={{
        color: c.color,
        background: c.headBg,
        border: `1px solid ${c.color}55`,
        fontSize: 8,
        fontFamily: "'Press Start 2P', cursive",
        padding: '3px 9px',
        borderRadius: 4,
        marginTop: 4,
        letterSpacing: 1,
      }}>
        {c.label}
      </div>
    </motion.div>
  )
}
