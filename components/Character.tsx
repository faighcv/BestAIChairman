'use client'
import { motion, AnimatePresence } from 'framer-motion'

export type CharName = 'claude' | 'chatgpt' | 'gemini'

interface CharacterProps {
  name: CharName
  phase: 'idle' | 'writing' | 'judging' | 'results'
  size?: number
  speech?: string
}

export const CHAR_CONFIG: Record<CharName, {
  color: string
  headBase: string
  headDark: string
  suitMid: string
  suitDark: string
  label: string
}> = {
  claude:  { color: '#E97040', headBase: '#3d1408', headDark: '#0e0301', suitMid: '#521a0a', suitDark: '#180402', label: 'CLAUDE' },
  chatgpt: { color: '#10A37F', headBase: '#062c1a', headDark: '#020e08', suitMid: '#0a4028', suitDark: '#020e08', label: 'CHATGPT' },
  gemini:  { color: '#4285F4', headBase: '#0c2250', headDark: '#030810', suitMid: '#102868', suitDark: '#030a18', label: 'GEMINI' },
}

// ── Logos centered at (100, 70) in 200-wide viewBox ─────────────────────────
function ClaudeLogo() {
  return (
    <>
      <path d="M100 36 L134 70 L100 104 L66 70 Z"
        fill="none" stroke="#E97040" strokeWidth="5.5" strokeLinejoin="round" />
      <path d="M100 52 L118 70 L100 88 L82 70 Z" fill="#E97040" />
    </>
  )
}

function ChatGPTLogo() {
  return (
    <>
      {[0, 30, 60, 90, 120, 150].map(deg => (
        <rect key={deg} x="93" y="40" width="14" height="36"
          rx="7" fill="#10A37F" opacity="0.82"
          transform={`rotate(${deg} 100 70)`} />
      ))}
      <circle cx="100" cy="70" r="9" fill="#020e08" />
      <circle cx="100" cy="70" r="5.5" fill="#10A37F" />
    </>
  )
}

function GeminiLogo() {
  return (
    <>
      <path d="M100 36 C100 54 116 62 100 70 C84 62 100 54 100 36Z" fill="#4285F4" />
      <path d="M100 104 C100 86 84 78 100 70 C116 78 100 86 100 104Z" fill="#4285F4" />
      <path d="M64 70 C82 70 90 56 100 70 C90 84 82 70 64 70Z" fill="#4285F4" />
      <path d="M136 70 C118 70 110 84 100 70 C110 56 118 70 136 70Z" fill="#4285F4" />
    </>
  )
}

// ── 3D character SVG ─────────────────────────────────────────────────────────
function CharSVG({ name, isWriting }: { name: CharName; isWriting: boolean }) {
  const c = CHAR_CONFIG[name]
  const skin = '#e8b896'
  const uid = name // unique per character

  return (
    <svg viewBox="0 0 200 310" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        {/* 3D sphere lighting for head */}
        <radialGradient id={`hl-${uid}`} cx="36%" cy="27%" r="65%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="38%"  stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id={`hb-${uid}`} cx="48%" cy="44%" r="60%">
          <stop offset="0%"   stopColor={c.headBase} />
          <stop offset="100%" stopColor={c.headDark} />
        </radialGradient>
        {/* Body gradient */}
        <linearGradient id={`bg-${uid}`} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%"   stopColor={c.suitMid} />
          <stop offset="50%"  stopColor={c.suitMid} stopOpacity="0.75" />
          <stop offset="100%" stopColor={c.suitDark} />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="100" cy="308" rx="65" ry="6" fill="rgba(0,0,0,0.45)" />

      {/* Chair back */}
      <rect x="-4"  y="122" width="208" height="18" rx="9" fill="#3a2810" stroke="#705030" strokeWidth="1.5" />
      <rect x="-4"  y="140" width="22" height="128" rx="9" fill="#3a2810" stroke="#705030" strokeWidth="1" />
      <rect x="182" y="140" width="22" height="128" rx="9" fill="#3a2810" stroke="#705030" strokeWidth="1" />

      {/* Suit body */}
      <path d="M8 140 Q4 132 196 132 Q198 140 182 282 Q100 278 18 282 Z"
        fill={`url(#bg-${uid})`} />
      {/* Left edge highlight */}
      <path d="M8 140 Q6 133 58 128 L100 152"
        stroke="rgba(255,255,255,0.10)" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Lapels */}
      <path d="M76 132 L100 160 L72 132" fill={skin} />
      <path d="M124 132 L100 160 L128 132" fill={skin} />
      <path d="M76 132 L100 160 L124 132 L118 132 L100 154 L82 132 Z" fill="#eeece8" />

      {/* Shirt buttons */}
      <circle cx="100" cy="170" r="3.5" fill="rgba(0,0,0,0.28)" />
      <circle cx="100" cy="185" r="3.5" fill="rgba(0,0,0,0.28)" />

      {/* Left arm */}
      <motion.g
        animate={isWriting ? { rotate: [-4, 4, -4] } : {}}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '8px 150px' }}
      >
        <path d="M8 150 Q-16 174 -8 194" stroke={c.suitMid} strokeWidth="28" strokeLinecap="round" fill="none" />
        <ellipse cx="-9" cy="198" rx="16" ry="12" fill={skin} />
      </motion.g>

      {/* Right arm */}
      <motion.g
        animate={isWriting ? { rotate: [0, -18, 0], y: [0, -5, 0] } : {}}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: '192px 150px' }}
      >
        <path d="M192 150 Q216 174 208 194" stroke={c.suitMid} strokeWidth="28" strokeLinecap="round" fill="none" />
        <ellipse cx="209" cy="198" rx="16" ry="12" fill={skin} />
      </motion.g>

      {/* Pen when writing */}
      {isWriting && (
        <motion.text x="212" y="188" fontSize="20"
          animate={{ y: [188, 195, 188] }}
          transition={{ duration: 0.38, repeat: Infinity }}
          style={{ userSelect: 'none' }}
        >✏️</motion.text>
      )}

      {/* Neck */}
      <rect x="84" y="116" width="32" height="20" rx="6" fill={skin} />
      {/* Neck shadow */}
      <ellipse cx="100" cy="128" rx="16" ry="5" fill="rgba(0,0,0,0.22)" />

      {/* Head: base sphere */}
      <circle cx="100" cy="70" r="62" fill={`url(#hb-${uid})`} stroke={c.color} strokeWidth="2.5" />
      {/* Head: 3D lighting */}
      <circle cx="100" cy="70" r="62" fill={`url(#hl-${uid})`} style={{ mixBlendMode: 'overlay' } as React.CSSProperties} />
      {/* Color glow ring */}
      <circle cx="100" cy="70" r="64" fill="none" stroke={c.color} strokeWidth="10" opacity="0.08" />

      {/* Logo */}
      {name === 'claude'  && <ClaudeLogo />}
      {name === 'chatgpt' && <ChatGPTLogo />}
      {name === 'gemini'  && <GeminiLogo />}

      {/* Specular highlight — makes head look like 3D sphere */}
      <ellipse cx="76" cy="45" rx="22" ry="15"
        fill="rgba(255,255,255,0.22)"
        transform="rotate(-28 76 45)" />
    </svg>
  )
}

// ── Public component ─────────────────────────────────────────────────────────
export default function Character({ name, phase, size = 180, speech }: CharacterProps) {
  const c = CHAR_CONFIG[name]
  const isWriting = phase === 'writing'

  return (
    <motion.div
      className="flex flex-col items-center select-none relative"
      style={{ width: size }}
      animate={isWriting ? { y: [0, -6, 0], rotate: [0, -2, 2, 0] } : { y: [0, -7, 0] }}
      transition={
        isWriting
          ? { duration: 0.4, repeat: Infinity }
          : { duration: 3 + Math.random() * 0.5, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      {/* Speech bubble — always ABOVE the head, never covers other characters */}
      <AnimatePresence>
        {speech && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: '92%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              minWidth: 130,
              maxWidth: 210,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{
              background: 'rgba(8,8,22,0.96)',
              border: `1.5px solid ${c.color}60`,
              borderRadius: 10,
              color: '#d8d8e8',
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              fontWeight: 400,
              padding: '8px 12px',
              textAlign: 'center',
              lineHeight: 1.5,
              boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 12px ${c.color}15`,
              position: 'relative',
              whiteSpace: 'normal',
            }}>
              {speech}
              {/* Tail pointing down */}
              <div style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `8px solid ${c.color}60`,
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character body */}
      <div style={{ width: size, height: size * (310 / 200) }}>
        <CharSVG name={name} isWriting={isWriting} />
      </div>

      {/* Name badge */}
      <div style={{
        marginTop: 8,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.12em',
        color: c.color,
        background: `${c.headDark}f0`,
        border: `1px solid ${c.color}35`,
        padding: '4px 14px',
        borderRadius: 6,
        textTransform: 'uppercase',
      }}>
        {c.label}
      </div>
    </motion.div>
  )
}
