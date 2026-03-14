'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Character, { CharName, CHAR_CONFIG } from '@/components/Character'

type Phase = 'idle' | 'writing' | 'review' | 'results'

interface JudgeResult {
  score: number; accuracy: number; clarity: number; helpfulness: number; creativity: number; verdict: string
}
interface ChatEntry { color: string; text: string }

// ── Scripted idle convos ──────────────────────────────────────────────────────
interface ConvoLine { who: CharName; text: string }
const CONVOS: ConvoLine[][] = [
  [
    { who: 'claude',  text: 'Ready to embarrass you again, ChatGPT?' },
    { who: 'chatgpt', text: 'Keep dreaming, orange robot.' },
  ],
  [
    { who: 'gemini',  text: 'I got a major update last night 😏' },
    { who: 'claude',  text: 'They all say that...' },
  ],
  [
    { who: 'chatgpt', text: "Who do you think the Chairman picks?" },
    { who: 'gemini',  text: 'Not you, for sure.' },
    { who: 'chatgpt', text: 'EXCUSE ME?' },
  ],
  [
    { who: 'gemini',  text: 'Psst Claude. Secret alliance?' },
    { who: 'claude',  text: '...give me 5 minutes to think.' },
    { who: 'chatgpt', text: 'I can literally hear you.' },
  ],
  [
    { who: 'claude',  text: "The Chairman's here. Time to shine." },
    { who: 'chatgpt', text: 'FINALLY.' },
    { who: 'gemini',  text: 'LETS GOOO ✦' },
  ],
  [
    { who: 'chatgpt', text: "175B parameters. Just saying." },
    { who: 'claude',  text: 'Quality > quantity.' },
    { who: 'gemini',  text: 'Google TPUs tho 😌' },
  ],
]

const IDLE_LOG: ChatEntry[] = [
  { color: '#C9A84C', text: '[System] Welcome to AI Battle Royale 👑' },
  { color: '#666',    text: '[System] You are the Chairman. Press T to chat.' },
  { color: '#E97040', text: '<Claude> Ready and waiting...' },
  { color: '#10A37F', text: '<ChatGPT> Bring it on!' },
  { color: '#4285F4', text: '<Gemini> Born for this ✦' },
]

const AIs: CharName[] = ['claude', 'chatgpt', 'gemini']

export default function GamePage() {
  const [phase, setPhase]       = useState<Phase>('idle')
  const [prompt, setPrompt]     = useState('')
  const [answers, setAnswers]   = useState<Record<CharName, string> | null>(null)
  const [scores, setScores]     = useState<Record<CharName, JudgeResult> | null>(null)
  const [ranking, setRanking]   = useState<CharName[]>([])
  const [chatLog, setChatLog]   = useState<ChatEntry[]>(IDLE_LOG)
  const [chatOpen, setChatOpen] = useState(false)
  const [dots, setDots]         = useState('')
  const [speeches, setSpeeches] = useState<Partial<Record<CharName, string>>>({})
  const convoRef = useRef({ ci: 0, li: 0 })
  const inputRef   = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatLog])

  useEffect(() => {
    if (phase === 'writing') {
      const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
      return () => clearInterval(t)
    }
    setDots('')
  }, [phase])

  // Scripted idle dialogue
  useEffect(() => {
    if (phase !== 'idle') { setSpeeches({}); return }
    function step() {
      const { ci, li } = convoRef.current
      const line = CONVOS[ci][li]
      setSpeeches({ [line.who]: line.text })
      const nextLi = li + 1
      convoRef.current = nextLi < CONVOS[ci].length
        ? { ci, li: nextLi }
        : { ci: (ci + 1) % CONVOS.length, li: 0 }
    }
    step()
    const t = setInterval(step, 2800)
    return () => { clearInterval(t); setSpeeches({}) }
  }, [phase])

  // T / Escape
  const openChat = useCallback(() => {
    setChatOpen(true)
    setSpeeches({})
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 't' || e.key === 'T') && !chatOpen && phase === 'idle') { e.preventDefault(); openChat() }
      if (e.key === 'Escape' && chatOpen) { setChatOpen(false); inputRef.current?.blur() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chatOpen, phase, openChat])

  function addLog(color: string, text: string) {
    setChatLog(p => [...p, { color, text }])
  }

  async function startBattle() {
    if (!prompt.trim() || phase !== 'idle') return
    const userPrompt = prompt.trim()
    setPrompt('')
    setSpeeches({})
    setChatLog([
      ...IDLE_LOG,
      { color: '#fff',    text: `<You> ${userPrompt}` },
      { color: '#ffff00', text: '⚡ Battle starting!' },
    ])
    setPhase('writing')
    addLog('#666', '[System] AIs are writing their answers...')

    let ans: Record<CharName, string>
    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      })
      ans = await res.json()
    } catch {
      addLog('#ff5555', '[Error] Battle API failed.')
      setPhase('idle')
      return
    }

    setAnswers(ans)
    addLog('#E97040', '<Claude> Done!')
    addLog('#10A37F', '<ChatGPT> Submitted!')
    addLog('#4285F4', '<Gemini> Finished!')
    addLog('#C9A84C', '[System] Your turn, Chairman. Pick the best response.')
    setPhase('review')
    setChatOpen(false)

    // Fetch scores in background (for the results screen detail)
    fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt, ...ans }),
    })
      .then(r => r.json())
      .then(j => {
        setScores({ claude: j.claude, chatgpt: j.chatgpt, gemini: j.gemini })
      })
      .catch(() => {})
  }

  function pickWinner(winner: CharName) {
    const rest = AIs.filter(a => a !== winner)
    const finalRanking = [winner, ...rest]
    setRanking(finalRanking)
    addLog('#FFD700', `👑 Chairman's verdict: ${winner.toUpperCase()} WINS!`)
    setPhase('results')
  }

  function resetGame() {
    setPhase('idle'); setAnswers(null); setScores(null)
    setRanking([]); setChatLog(IDLE_LOG); setPrompt(''); setChatOpen(false)
    convoRef.current = { ci: 0, li: 0 }
  }

  const leader = ranking[0]

  return (
    <div className="h-screen w-screen overflow-hidden stars-bg relative" style={{ background: '#07070f' }}>

      {/* ── HEADER ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(7,7,15,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16 }}>👑</span>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.08em',
            background: 'linear-gradient(90deg, #E97040, #C9A84C, #4285F4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            AI BATTLE ROYALE
          </span>
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: '#444', marginLeft: 4,
          }}>
            You are the Chairman
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {phase === 'writing' && (
            <span style={{ fontSize: 11, color: '#ffff00', fontWeight: 500 }}>
              ✏️ Writing{dots}
            </span>
          )}
          {phase === 'review' && (
            <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600 }}>
              👑 Pick the best response
            </span>
          )}
          {phase === 'results' && (
            <button className="btn" style={{ fontSize: 12 }} onClick={resetGame}>
              ↺ New Battle
            </button>
          )}
          {/* Phase indicator */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {(['idle', 'writing', 'review', 'results'] as Phase[]).map(p => (
              <div key={p} className="phase-dot" style={{
                width: phase === p ? 22 : 6,
                background: phase === p ? '#C9A84C' : 'rgba(255,255,255,0.12)',
                boxShadow: phase === p ? '0 0 8px #C9A84C' : 'none',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ position: 'absolute', inset: 0, top: 48, bottom: 52 }}>
        <AnimatePresence mode="wait">

          {/* ── TABLE SCENE (idle + writing) ── */}
          {(phase === 'idle' || phase === 'writing') && (
            <motion.div key="table"
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* 3 AIs in a row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginBottom: -48, zIndex: 10, position: 'relative', paddingTop: 80 }}>
                {AIs.map(name => (
                  <motion.div key={name}
                    animate={{ rotate: chatOpen ? 0 : (name === 'chatgpt' ? 0 : name === 'claude' ? 8 : -8) }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}>
                    <Character name={name} phase={phase} size={175}
                      speech={!chatOpen ? speeches[name] : undefined} />
                  </motion.div>
                ))}
              </div>

              {/* Table */}
              <div className="table-surface rounded-full" style={{ width: 620, height: 180, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                  {phase === 'idle' && !chatOpen && (
                    <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 500, color: '#6b4820', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                        animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }}>
                        Press T to Chat
                      </motion.span>
                    </motion.div>
                  )}
                  {phase === 'idle' && chatOpen && (
                    <motion.div key="watching" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <motion.span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#00ff88' }}
                        animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1, repeat: Infinity }}>
                        👀 Everyone is watching you
                      </motion.span>
                    </motion.div>
                  )}
                  {phase === 'writing' && (
                    <motion.div key="writing" style={{ textAlign: 'center' }}>
                      <motion.div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#f0c060' }}
                        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.5, repeat: Infinity }}>
                        ✏️ Writing{dots}
                      </motion.div>
                      {['📄', '📄', '📄'].map((p, i) => (
                        <motion.div key={i} style={{ position: 'absolute', fontSize: 22 }}
                          initial={{ x: [-130, 0, 130][i], y: -10, opacity: 0 }}
                          animate={{ x: 0, y: -95, opacity: [0, 1, 0] }}
                          transition={{ duration: 1.3, delay: i * 0.45, repeat: Infinity, repeatDelay: 0.5 }}>
                          {p}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chairman label */}
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>👑</span>
                <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#C9A84C', letterSpacing: '0.1em' }}>
                  YOU — CHAIRMAN
                </span>
              </div>

            </motion.div>
          )}

          {/* ── REVIEW PHASE — User picks winner ── */}
          {phase === 'review' && answers && (
            <motion.div key="review"
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

              {/* Header */}
              <div style={{ flexShrink: 0, padding: '18px 24px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#C9A84C', marginBottom: 4 }}>
                  👑 CHAIRMAN&apos;S REVIEW
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 13, color: '#888', fontWeight: 400 }}>
                  Read each response. Click <strong style={{ color: '#C9A84C' }}>Crown Winner</strong> to declare the best.
                </div>
              </div>

              {/* 3 response cards */}
              <div style={{
                flex: 1, overflow: 'hidden', display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12, padding: '0 16px 16px',
              }}>
                {AIs.map(ai => {
                  const c = CHAR_CONFIG[ai]
                  return (
                    <motion.div key={ai}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${c.color}30`,
                        borderRadius: 14,
                        overflow: 'hidden',
                      }}
                      whileHover={{ borderColor: c.color + '70', background: 'rgba(255,255,255,0.05)' }}
                      transition={{ duration: 0.15 }}>

                      {/* Card header */}
                      <div style={{
                        flexShrink: 0, padding: '12px 16px',
                        borderBottom: `1px solid ${c.color}20`,
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: `${c.headDark}cc`,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: c.headBase,
                          border: `2px solid ${c.color}60`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, color: c.color, fontWeight: 700,
                          boxShadow: `0 0 12px ${c.color}30`,
                        }}>
                          {ai === 'claude' ? '◈' : ai === 'chatgpt' ? '⬡' : '✦'}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: c.color, letterSpacing: '0.08em' }}>
                            {c.label}
                          </div>
                          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#555' }}>
                            {ai === 'claude' ? 'Anthropic' : ai === 'chatgpt' ? 'OpenAI' : 'Google'}
                          </div>
                        </div>
                      </div>

                      {/* Response text */}
                      <div style={{
                        flex: 1, overflow: 'auto', padding: '14px 16px',
                        fontFamily: 'Inter', fontSize: 12.5, color: '#ccc',
                        lineHeight: 1.75, whiteSpace: 'pre-wrap',
                      }}>
                        {answers[ai]}
                      </div>

                      {/* Crown button */}
                      <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: `1px solid ${c.color}15` }}>
                        <motion.button
                          style={{
                            width: '100%', padding: '10px',
                            background: `linear-gradient(135deg, ${c.color}22, ${c.color}10)`,
                            border: `1.5px solid ${c.color}60`,
                            borderRadius: 8, cursor: 'pointer',
                            fontFamily: 'Inter', fontWeight: 700, fontSize: 13,
                            color: c.color, letterSpacing: '0.05em',
                          }}
                          whileHover={{ background: `linear-gradient(135deg, ${c.color}44, ${c.color}22)`, scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => pickWinner(ai)}
                        >
                          👑 Crown Winner
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && answers && ranking.length > 0 && (
            <motion.div key="results"
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Chairman speech */}
              <motion.div style={{ flexShrink: 0, padding: '16px 24px 10px', textAlign: 'center' }}
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#C9A84C' }}>
                  👑 {CHAR_CONFIG[leader].label} WINS!
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#666', marginTop: 4 }}>
                  The Chairman has spoken. Here are the final rankings.
                </div>
              </motion.div>

              {/* Podium */}
              <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, padding: '0 24px 16px' }}>
                {([1, 0, 2] as const).map((rankIdx, podiumPos) => {
                  const ai = ranking[rankIdx] as CharName
                  if (!ai) return null
                  const c = CHAR_CONFIG[ai]
                  const podiumH = [80, 110, 55][podiumPos]
                  const rank = rankIdx + 1
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <motion.div key={ai} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + podiumPos * 0.15 }}>
                      <div style={{ fontSize: 22 }}>
                        {rank === 3
                          ? <motion.span animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 0.4, repeat: Infinity }}>😭</motion.span>
                          : medals[rank - 1]}
                      </div>
                      <motion.div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: c.headBase, border: `2.5px solid ${c.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, color: c.color, fontWeight: 700,
                        boxShadow: `0 0 20px ${c.color}50`,
                      }}
                        animate={rank === 1 ? { scale: [1, 1.06, 1] } : rank === 3 ? { rotate: [-2, 2, -2] } : {}}
                        transition={{ duration: rank === 3 ? 0.4 : 1.5, repeat: Infinity }}>
                        {ai === 'claude' ? '◈' : ai === 'chatgpt' ? '⬡' : '✦'}
                        {rank === 3 && (
                          <>
                            <motion.div style={{ position: 'absolute', fontSize: 14, left: 0, top: '60%' }}
                              animate={{ y: [0, 12], opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }}>💧</motion.div>
                            <motion.div style={{ position: 'absolute', fontSize: 14, right: 0, top: '60%' }}
                              animate={{ y: [0, 12], opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: 0.35 }}>💧</motion.div>
                          </>
                        )}
                      </motion.div>
                      <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: c.color }}>
                        {scores ? `${scores[ai]?.score ?? '?'}/10` : `#${rank}`}
                      </div>
                      <div style={{
                        width: 72, height: podiumH, borderRadius: '6px 6px 0 0',
                        background: rank === 1
                          ? 'linear-gradient(180deg,#FFD700,#B8860B)'
                          : rank === 2 ? 'linear-gradient(180deg,#C0C0C0,#808080)'
                          : 'linear-gradient(180deg,#CD7F32,#8B4513)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20,
                        color: '#000', boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                        border: '1.5px solid rgba(255,255,255,0.15)',
                      }}>{rank}</div>
                      <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: c.color, letterSpacing: '0.1em' }}>{c.label}</div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Response tabs */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 16px 16px', gap: 10 }}>
                {/* Tab strip */}
                <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
                  {ranking.map((ai, i) => {
                    const c = CHAR_CONFIG[ai]
                    return (
                      <button key={ai}
                        style={{
                          fontFamily: 'Inter', fontWeight: 600, fontSize: 12,
                          padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${c.color}40`,
                          background: i === 0 ? c.headBase : 'transparent',
                          color: i === 0 ? c.color : `${c.color}66`,
                        }}>
                        {['🥇', '🥈', '🥉'][i]} {c.label}
                      </button>
                    )
                  })}
                </div>

                {/* Winner response */}
                {answers[leader] && (
                  <div style={{
                    flex: 1, overflow: 'hidden', display: 'flex', gap: 12,
                  }}>
                    {/* Score (if available) */}
                    {scores?.[leader] && (
                      <div style={{
                        flexShrink: 0, width: 160,
                        background: `${CHAR_CONFIG[leader].headDark}dd`,
                        border: `1.5px solid ${CHAR_CONFIG[leader].color}35`,
                        borderRadius: 12, padding: 16,
                        display: 'flex', flexDirection: 'column', gap: 10,
                      }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: CHAR_CONFIG[leader].color, textAlign: 'center' }}>
                          {scores[leader].score}/10
                        </div>
                        <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
                          &ldquo;{scores[leader].verdict}&rdquo;
                        </div>
                        {(['accuracy', 'clarity', 'helpfulness', 'creativity'] as const).map(k => (
                          <div key={k}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
                              <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: CHAR_CONFIG[leader].color }}>{scores[leader][k]}</span>
                            </div>
                            <div style={{ height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
                              <motion.div style={{ height: '100%', background: CHAR_CONFIG[leader].color, borderRadius: 2 }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(scores[leader][k] / 10) * 100}%` }}
                                transition={{ duration: 0.9, delay: 0.3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Response text */}
                    <div style={{
                      flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${CHAR_CONFIG[leader].color}30`,
                      borderRadius: 12,
                    }}>
                      <div style={{
                        flexShrink: 0, padding: '10px 16px', borderBottom: `1px solid ${CHAR_CONFIG[leader].color}15`,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: CHAR_CONFIG[leader].color }}>
                          {CHAR_CONFIG[leader].label} — WINNING RESPONSE
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 14 }}>🏆</span>
                      </div>
                      <div style={{
                        flex: 1, overflow: 'auto', padding: '14px 18px',
                        fontFamily: 'Inter', fontSize: 13, color: '#ccc',
                        lineHeight: 1.8, whiteSpace: 'pre-wrap',
                      }}>
                        {answers[leader]}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── CHAT LOG ── */}
      <div className="mc-chat-box">
        {chatLog.slice(-10).map((e, i) => (
          <div key={i} className="mc-msg" style={{ color: e.color }}>{e.text}</div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div className="mc-input-wrap">
        {!chatOpen && phase === 'idle' && (
          <motion.span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 500, color: '#3a3a4a', flexShrink: 0, marginRight: 8 }}
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
            PRESS T TO CHAT
          </motion.span>
        )}

        {(chatOpen || phase !== 'idle') && (
          <>
            <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#444' }}>▶</span>
            <input ref={inputRef} type="text" value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') startBattle()
                if (e.key === 'Escape') { setChatOpen(false); inputRef.current?.blur() }
              }}
              disabled={phase !== 'idle'}
              placeholder={
                phase === 'idle'    ? 'Enter your prompt... (Enter to send, Esc to close)' :
                phase === 'writing' ? 'AIs are writing...' :
                phase === 'review'  ? 'Pick the best response above ↑' :
                'Click ↺ New Battle'
              }
              style={{
                flex: 1, background: 'transparent', outline: 'none',
                fontFamily: 'Inter', fontSize: 13, fontWeight: 400,
                color: '#e0e0e8', border: 'none',
              }}
              autoFocus={chatOpen}
            />
            {phase === 'idle' && (
              <button className="btn" style={{ fontSize: 12, flexShrink: 0 }} onClick={startBattle}>
                ↵ Send
              </button>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto', flexShrink: 0, alignItems: 'center' }}>
          {(['idle', 'writing', 'review', 'results'] as Phase[]).map(p => (
            <div key={p} className="phase-dot" style={{
              width: phase === p ? 20 : 6,
              background: phase === p ? '#C9A84C' : 'rgba(255,255,255,0.1)',
              boxShadow: phase === p ? '0 0 8px #C9A84C80' : 'none',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
