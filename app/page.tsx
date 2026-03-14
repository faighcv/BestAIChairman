'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Character, { CharName, CHAR_CONFIG } from '@/components/Character'

type Phase = 'idle' | 'writing' | 'review' | 'results'

interface JudgeResult {
  score: number; accuracy: number; clarity: number; helpfulness: number; creativity: number; verdict: string
}
interface ChatEntry { color: string; text: string }

interface ConvoLine { who: CharName; text: string }
const CONVOS: ConvoLine[][] = [
  [
    { who: 'claude',  text: 'Ready to embarrass you again, ChatGPT?' },
    { who: 'chatgpt', text: 'Keep dreaming, orange robot.' },
  ],
  [
    { who: 'gemini',  text: 'Got a major update last night.' },
    { who: 'claude',  text: 'They all say that...' },
  ],
  [
    { who: 'chatgpt', text: 'Who do you think the Chairman picks?' },
    { who: 'gemini',  text: 'Not you, for sure.' },
    { who: 'chatgpt', text: 'Excuse me?' },
  ],
  [
    { who: 'gemini',  text: 'Psst Claude. Secret alliance?' },
    { who: 'claude',  text: '...give me 5 minutes to think.' },
    { who: 'chatgpt', text: 'I can literally hear you both.' },
  ],
  [
    { who: 'claude',  text: "The Chairman is here. Time to shine." },
    { who: 'chatgpt', text: 'Finally.' },
    { who: 'gemini',  text: 'Let us go.' },
  ],
  [
    { who: 'chatgpt', text: '175B parameters. Just saying.' },
    { who: 'claude',  text: 'Quality over quantity.' },
    { who: 'gemini',  text: 'Google TPUs though.' },
  ],
]

const IDLE_LOG: ChatEntry[] = [
  { color: '#FFD60A', text: '[System] Welcome to AI Battle Royale' },
  { color: '#3a3a4a', text: '[System] You are the Chairman. Press T to chat.' },
  { color: '#FF6B35', text: '<Claude> Ready and waiting...' },
  { color: '#00D4AA', text: '<ChatGPT> Bring it on!' },
  { color: '#5B8AF7', text: '<Gemini> Born for this.' },
]

const AIs: CharName[] = ['claude', 'chatgpt', 'gemini']
const RANK_LABELS = ['1ST', '2ND', '3RD']
const RANK_COLORS = ['#FFD60A', '#B8B8C8', '#CD7F32']
const PODIUM_BG = [
  'linear-gradient(180deg, #FFD60A 0%, #A07800 100%)',
  'linear-gradient(180deg, #D8D8E8 0%, #707080 100%)',
  'linear-gradient(180deg, #CD7F32 0%, #6B3A1F 100%)',
]

export default function GamePage() {
  const [phase, setPhase]               = useState<Phase>('idle')
  const [prompt, setPrompt]             = useState('')
  const [answers, setAnswers]           = useState<Record<CharName, string> | null>(null)
  const [scores, setScores]             = useState<Record<CharName, JudgeResult> | null>(null)
  const [ranking, setRanking]           = useState<CharName[]>([])
  const [pickedRanking, setPickedRanking] = useState<CharName[]>([])
  const [activeTab, setActiveTab]       = useState<CharName | null>(null)
  const [showScores, setShowScores]     = useState(false)
  const [chatLog, setChatLog]           = useState<ChatEntry[]>(IDLE_LOG)
  const [chatOpen, setChatOpen]         = useState(false)
  const [dots, setDots]                 = useState('')
  const [speeches, setSpeeches]         = useState<Partial<Record<CharName, string>>>({})
  const convoRef   = useRef({ ci: 0, li: 0 })
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
      { color: '#FFD60A', text: '-- Battle starting! --' },
    ])
    setPhase('writing')
    addLog('#3a3a4a', '[System] AIs are writing their answers...')

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
    addLog('#FF6B35', '<Claude> Done!')
    addLog('#00D4AA', '<ChatGPT> Submitted!')
    addLog('#5B8AF7', '<Gemini> Finished!')
    addLog('#FFD60A', '[System] Your turn, Chairman. Rank all three responses.')
    setPhase('review')
    setPickedRanking([])
    setChatOpen(false)

    fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt, ...ans }),
    })
      .then(r => r.json())
      .then(j => setScores({ claude: j.claude, chatgpt: j.chatgpt, gemini: j.gemini }))
      .catch(() => {})
  }

  function pickRank(ai: CharName) {
    const newPicked = [...pickedRanking, ai]
    setPickedRanking(newPicked)

    if (newPicked.length === 2) {
      const last = AIs.find(a => !newPicked.includes(a))!
      const finalRanking = [...newPicked, last]
      setRanking(finalRanking)
      setActiveTab(finalRanking[0])
      addLog('#FFD60A', `-- Chairman's verdict: ${finalRanking[0].toUpperCase()} WINS! --`)
      setPhase('results')
    }
  }

  function resetGame() {
    setPhase('idle'); setAnswers(null); setScores(null)
    setRanking([]); setPickedRanking([]); setChatLog(IDLE_LOG)
    setPrompt(''); setChatOpen(false); setShowScores(false); setActiveTab(null)
    convoRef.current = { ci: 0, li: 0 }
  }

  const leader      = ranking[0]
  const pickStep    = pickedRanking.length
  const remaining   = AIs.filter(a => !pickedRanking.includes(a))

  return (
    <div className="h-screen w-screen overflow-hidden stars-bg relative" style={{ background: '#08080f' }}>

      {/* ── HEADER ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(8,8,15,0.92)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14,
            letterSpacing: '0.12em',
            background: 'linear-gradient(90deg, #FF6B35 0%, #FFD60A 45%, #5B8AF7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            AI BATTLE ROYALE
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500, color: '#2e2e3e', letterSpacing: '0.08em' }}>
            ♛ YOU ARE THE CHAIRMAN
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {phase === 'writing' && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#FFD60A', letterSpacing: '0.06em' }}>
              WRITING{dots}
            </span>
          )}
          {phase === 'review' && (
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 800, color: '#FFD60A', letterSpacing: '0.1em' }}>
              ♛ SELECT {RANK_LABELS[pickStep]} PLACE
            </span>
          )}
          {phase === 'results' && (
            <button className="btn" style={{ fontSize: 11, letterSpacing: '0.06em' }} onClick={resetGame}>
              ↺ NEW BATTLE
            </button>
          )}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {(['idle', 'writing', 'review', 'results'] as Phase[]).map(p => (
              <div key={p} className="phase-dot" style={{
                width: phase === p ? 22 : 6,
                background: phase === p ? '#FFD60A' : 'rgba(255,255,255,0.08)',
                boxShadow: phase === p ? '0 0 10px #FFD60A' : 'none',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ position: 'absolute', inset: 0, top: 48, bottom: 52 }}>
        <AnimatePresence mode="wait">

          {/* ── TABLE SCENE ── */}
          {(phase === 'idle' || phase === 'writing') && (
            <motion.div key="table"
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

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

              <div className="table-surface rounded-full" style={{ width: 620, height: 180, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                  {phase === 'idle' && !chatOpen && (
                    <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.span
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500, color: '#5a3a18', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }}>
                        Press T to Chat
                      </motion.span>
                    </motion.div>
                  )}
                  {phase === 'idle' && chatOpen && (
                    <motion.div key="watching" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <motion.span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#00D4AA' }}
                        animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1, repeat: Infinity }}>
                        ∗ Everyone is watching you
                      </motion.span>
                    </motion.div>
                  )}
                  {phase === 'writing' && (
                    <motion.div key="writing" style={{ textAlign: 'center' }}>
                      <motion.div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#FFD60A', letterSpacing: '0.14em' }}
                        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.55, repeat: Infinity }}>
                        WRITING{dots}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ marginTop: 20 }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 800, color: '#FFD60A', letterSpacing: '0.18em' }}>
                  ♛ CHAIRMAN
                </span>
              </div>
            </motion.div>
          )}

          {/* ── REVIEW PHASE ── */}
          {phase === 'review' && answers && (
            <motion.div key="review"
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

              {/* Header */}
              <div style={{ flexShrink: 0, padding: '14px 24px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#FFD60A', letterSpacing: '0.1em' }}>
                  ♛ CHAIRMAN&apos;S REVIEW
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#666', marginTop: 3 }}>
                  {pickStep === 0
                    ? 'Read each response. Choose the best one as 1st place.'
                    : `1st place: ${CHAR_CONFIG[pickedRanking[0]].label}  —  Now choose 2nd place. (3rd will be automatic)`
                  }
                </div>
                {/* Step progress */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10, alignItems: 'center' }}>
                  {[0, 1].map(step => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${step < pickStep ? '#FFD60A' : step === pickStep ? '#FFD60A' : 'rgba(255,255,255,0.1)'}`,
                        background: step < pickStep ? '#FFD60A' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 10,
                        color: step < pickStep ? '#000' : step === pickStep ? '#FFD60A' : '#333',
                        boxShadow: step === pickStep ? '0 0 12px #FFD60A60' : 'none',
                        transition: 'all 0.3s',
                      }}>
                        {step < pickStep ? '✓' : step + 1}
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: step <= pickStep ? '#FFD60A' : '#333', fontWeight: step === pickStep ? 700 : 400 }}>
                        {RANK_LABELS[step]} PLACE
                      </span>
                      {step === 0 && <div style={{ width: 24, height: 1.5, background: step < pickStep ? '#FFD60A40' : 'rgba(255,255,255,0.06)', marginLeft: 2 }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cards — only show remaining (not yet picked) */}
              <div style={{
                flex: 1, overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: remaining.length === 1 ? '1fr' : remaining.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr',
                gap: 10, padding: '0 14px 14px',
              }}>
                <AnimatePresence>
                  {remaining.map(ai => {
                    const c = CHAR_CONFIG[ai]
                    return (
                      <motion.div key={ai}
                        layout
                        initial={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92, y: -20 }}
                        transition={{ duration: 0.25 }}
                        style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${c.color}35`, borderRadius: 14, overflow: 'hidden' }}
                        whileHover={{ borderColor: c.color + '80', background: 'rgba(255,255,255,0.07)' }}>

                        {/* Card header */}
                        <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: `1px solid ${c.color}18`, display: 'flex', alignItems: 'center', gap: 10, background: `${c.headDark}ee` }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.headBase, border: `2px solid ${c.color}70`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: c.color, fontWeight: 700, boxShadow: `0 0 14px ${c.color}50` }}>
                            {ai === 'claude' ? '◈' : ai === 'chatgpt' ? '⬡' : '✦'}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: c.color, letterSpacing: '0.08em' }}>{c.label}</div>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#444' }}>
                              {ai === 'claude' ? 'Anthropic' : ai === 'chatgpt' ? 'OpenAI' : 'Google DeepMind'}
                            </div>
                          </div>
                        </div>

                        {/* Response */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: 12.5, color: '#bbb', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                          {answers[ai]}
                        </div>

                        {/* Rank button */}
                        <div style={{ flexShrink: 0, padding: '10px 14px', borderTop: `1px solid ${c.color}12` }}>
                          <motion.button
                            style={{ width: '100%', padding: '11px', background: `${c.color}18`, border: `1.5px solid ${c.color}80`, borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, color: c.color, letterSpacing: '0.12em' }}
                            whileHover={{ background: `${c.color}35`, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => pickRank(ai)}>
                            ♛ SET AS {RANK_LABELS[pickStep]} PLACE
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && answers && ranking.length > 0 && (
            <motion.div key="results"
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Winner banner */}
              <motion.div style={{ flexShrink: 0, padding: '12px 24px 4px', textAlign: 'center' }}
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '0.1em', color: '#FFD60A' }}>
                  ♛ {CHAR_CONFIG[leader].label} WINS!
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#444', marginTop: 2, letterSpacing: '0.06em' }}>
                  THE CHAIRMAN HAS SPOKEN
                </div>
              </motion.div>

              {/* ── PODIUM with real characters ── */}
              <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, padding: '4px 24px 0' }}>
                {([1, 0, 2] as const).map((rankIdx, podiumPos) => {
                  const ai = ranking[rankIdx] as CharName
                  if (!ai) return null
                  const c = CHAR_CONFIG[ai]
                  const podiumH   = [108, 150, 72][podiumPos]
                  const charSize  = [148, 190, 125][podiumPos]
                  const rank      = rankIdx + 1

                  return (
                    <motion.div key={ai}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      initial={{ opacity: 0, y: 70 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + podiumPos * 0.14, type: 'spring', stiffness: 200, damping: 18 }}>

                      {/* Rank label above character */}
                      <div style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 11,
                        color: RANK_COLORS[rankIdx], letterSpacing: '0.14em',
                        marginBottom: 2, textShadow: `0 0 10px ${RANK_COLORS[rankIdx]}60`,
                      }}>
                        {RANK_LABELS[rankIdx]}
                      </div>

                      {/* Character */}
                      <Character name={ai} phase="idle" size={charSize} />

                      {/* Podium block */}
                      <div style={{
                        width: 110, height: podiumH,
                        background: PODIUM_BG[rankIdx],
                        borderRadius: '10px 10px 0 0',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 4,
                        boxShadow: `0 -6px 24px ${RANK_COLORS[rankIdx]}35, 0 8px 32px rgba(0,0,0,0.7)`,
                        border: `1.5px solid ${RANK_COLORS[rankIdx]}50`,
                        position: 'relative',
                      }}>
                        <div style={{
                          fontFamily: 'Syne, sans-serif', fontWeight: 800,
                          fontSize: rank === 1 ? 32 : rank === 2 ? 26 : 22,
                          color: rank === 1 ? '#3a2000' : rank === 2 ? '#1a1a2a' : '#fff',
                          lineHeight: 1,
                        }}>
                          {rank}
                        </div>
                        <div style={{
                          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 9,
                          color: rank === 1 ? '#3a200080' : rank === 2 ? '#1a1a2a80' : '#ffffff80',
                          letterSpacing: '0.14em',
                        }}>
                          {c.label}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* ── Response viewer ── */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '8px 14px 14px', gap: 8, minHeight: 0 }}>

                {/* Tab strip */}
                <div style={{ flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {ranking.map((ai, i) => {
                    const c = CHAR_CONFIG[ai]
                    const isActive = activeTab === ai
                    return (
                      <button key={ai} onClick={() => setActiveTab(ai)}
                        style={{
                          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11,
                          padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                          border: `1.5px solid ${isActive ? c.color : c.color + '25'}`,
                          background: isActive ? `${c.color}18` : 'transparent',
                          color: isActive ? c.color : `${c.color}44`,
                          letterSpacing: '0.08em', transition: 'all 0.15s',
                        }}>
                        {RANK_LABELS[i]} — {c.label}
                      </button>
                    )
                  })}
                  {scores && (
                    <button onClick={() => setShowScores(s => !s)}
                      style={{
                        marginLeft: 'auto',
                        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11,
                        padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                        border: `1.5px solid ${showScores ? '#FFD60A80' : 'rgba(255,255,255,0.08)'}`,
                        background: showScores ? 'rgba(255,214,10,0.08)' : 'transparent',
                        color: showScores ? '#FFD60A' : '#444',
                        transition: 'all 0.15s',
                      }}>
                      {showScores ? 'Hide' : 'Show'} AI Analysis
                    </button>
                  )}
                </div>

                {/* Content */}
                {activeTab && answers[activeTab] && (
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 10, minHeight: 0 }}>

                    {/* Score panel */}
                    <AnimatePresence>
                      {showScores && scores?.[activeTab] && (
                        <motion.div
                          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                          style={{
                            flexShrink: 0, width: 152,
                            background: `${CHAR_CONFIG[activeTab].headDark}cc`,
                            border: `1.5px solid ${CHAR_CONFIG[activeTab].color}28`,
                            borderRadius: 10, padding: '14px 12px',
                            display: 'flex', flexDirection: 'column', gap: 9,
                          }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 30, color: CHAR_CONFIG[activeTab].color, lineHeight: 1 }}>
                              {scores[activeTab].score}
                              <span style={{ fontSize: 13, opacity: 0.6 }}>/10</span>
                            </div>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#444', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>
                              &ldquo;{scores[activeTab].verdict}&rdquo;
                            </div>
                          </div>
                          {(['accuracy', 'clarity', 'helpfulness', 'creativity'] as const).map(k => (
                            <div key={k}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600, color: '#3a3a4a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: CHAR_CONFIG[activeTab].color }}>{scores[activeTab][k]}</span>
                              </div>
                              <div style={{ height: 3, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div style={{ height: '100%', background: CHAR_CONFIG[activeTab].color, borderRadius: 2 }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(scores[activeTab][k] / 10) * 100}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 }} />
                              </div>
                            </div>
                          ))}
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#2a2a3a', textAlign: 'center', lineHeight: 1.6, marginTop: 2 }}>
                            ↑ AI judge assessment<br/>not your ranking
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Response text */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${CHAR_CONFIG[activeTab].color}22`, borderRadius: 10, minWidth: 0 }}>
                      <div style={{ flexShrink: 0, padding: '10px 16px', borderBottom: `1px solid ${CHAR_CONFIG[activeTab].color}12`, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHAR_CONFIG[activeTab].color, boxShadow: `0 0 8px ${CHAR_CONFIG[activeTab].color}` }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: CHAR_CONFIG[activeTab].color, letterSpacing: '0.06em' }}>
                          {CHAR_CONFIG[activeTab].label} — {RANK_LABELS[ranking.indexOf(activeTab)]} PLACE
                        </span>
                        {ranking.indexOf(activeTab) === 0 && (
                          <span style={{ marginLeft: 'auto', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 10, color: '#FFD60A', letterSpacing: '0.14em' }}>
                            ★ WINNER
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#c8c8d8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {answers[activeTab]}
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
          <motion.span
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500, color: '#252535', flexShrink: 0, marginRight: 8, letterSpacing: '0.12em' }}
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.2, repeat: Infinity }}>
            PRESS T TO CHAT
          </motion.span>
        )}

        {(chatOpen || phase !== 'idle') && (
          <>
            <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#2a2a3a' }}>▶</span>
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
                phase === 'review'  ? `Select ${RANK_LABELS[pickStep]} place above` :
                'Click New Battle to play again'
              }
              style={{ flex: 1, background: 'transparent', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#e0e0e8', border: 'none' }}
              autoFocus={chatOpen}
            />
            {phase === 'idle' && (
              <button className="btn" style={{ fontSize: 11, flexShrink: 0, letterSpacing: '0.06em' }} onClick={startBattle}>
                ↵ SEND
              </button>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto', flexShrink: 0, alignItems: 'center' }}>
          {(['idle', 'writing', 'review', 'results'] as Phase[]).map(p => (
            <div key={p} className="phase-dot" style={{
              width: phase === p ? 20 : 6,
              background: phase === p ? '#FFD60A' : 'rgba(255,255,255,0.07)',
              boxShadow: phase === p ? '0 0 8px #FFD60A80' : 'none',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
