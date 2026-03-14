'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Character, { CharName, CHAR_CONFIG } from '@/components/Character'
import Podium from '@/components/Podium'

type Phase = 'idle' | 'writing' | 'judging' | 'results'

interface JudgeResult {
  score: number; accuracy: number; clarity: number; helpfulness: number; creativity: number; verdict: string
}
interface BattleState {
  answers: Record<CharName, string>
  scores: Record<CharName, JudgeResult>
  ranking: CharName[]
  chairmanSpeech: string
}
interface ChatEntry { color: string; text: string }

// ── Scripted idle conversations ───────────────────────────────────────────────
interface ConvoLine { who: CharName; text: string; side?: 'left' | 'right' }
const CONVOS: ConvoLine[][] = [
  [
    { who: 'claude',   text: "You ready to lose today, ChatGPT?", side: 'right' },
    { who: 'chatgpt',  text: "Ha. In your dreams, buddy.",         side: 'left'  },
  ],
  [
    { who: 'gemini',   text: "I got a major update last night 😏",  side: 'right' },
    { who: 'chairman', text: "They all say that before they lose.", side: 'left'  },
  ],
  [
    { who: 'chatgpt',  text: "Chairman, between us... who wins?",   side: 'left'  },
    { who: 'chairman', text: "I judge on merit. Not politics.",      side: 'left'  },
    { who: 'chatgpt',  text: "So... definitely me then, right?",    side: 'left'  },
  ],
  [
    { who: 'gemini',   text: "Psst. Claude. Alliance?",             side: 'right' },
    { who: 'claude',   text: "...I'll think about it.",             side: 'right' },
    { who: 'chatgpt',  text: "I can hear you both.",                side: 'left'  },
  ],
  [
    { who: 'chairman', text: "I sense a challenger approaching...", side: 'left'  },
    { who: 'claude',   text: "FINALLY.",                            side: 'right' },
    { who: 'chatgpt',  text: "YESSS let's GO",                      side: 'left'  },
    { who: 'gemini',   text: "I was born ready ✦",                  side: 'right' },
  ],
  [
    { who: 'claude',   text: "Did you guys even prepare?",          side: 'right' },
    { who: 'chatgpt',  text: "I have 175 billion parameters. Yes.", side: 'left'  },
    { who: 'gemini',   text: "I literally run on Google's TPUs.",   side: 'right' },
    { who: 'claude',   text: "...fair enough.",                     side: 'right' },
  ],
  [
    { who: 'chairman', text: "*taps gavel* Order, please.",         side: 'left'  },
    { who: 'chatgpt',  text: "We're not even started yet sir.",     side: 'left'  },
    { who: 'chairman', text: "Precautionary.",                      side: 'left'  },
  ],
]

const IDLE_LOG: ChatEntry[] = [
  { color: '#C9A84C', text: '[Chairman] Welcome to AI BATTLE ROYALE! 👑' },
  { color: '#888',    text: '[System] Press T to open chat.' },
  { color: '#D97559', text: '<Claude> Ready and waiting... ◈' },
  { color: '#10A37F', text: '<ChatGPT> Bring it on! ⬡' },
  { color: '#4285F4', text: '<Gemini> I was born for this. ✦' },
]

const CRITERIA = [
  { key: 'accuracy'    as const, label: 'ACCURACY' },
  { key: 'clarity'     as const, label: 'CLARITY' },
  { key: 'helpfulness' as const, label: 'HELP' },
  { key: 'creativity'  as const, label: 'STYLE' },
]

export default function GamePage() {
  const [phase, setPhase]         = useState<Phase>('idle')
  const [prompt, setPrompt]       = useState('')
  const [battle, setBattle]       = useState<BattleState | null>(null)
  const [chatLog, setChatLog]     = useState<ChatEntry[]>(IDLE_LOG)
  const [chatOpen, setChatOpen]   = useState(false)
  const [writingDots, setDots]    = useState('')
  const [selectedAI, setSelected] = useState<CharName>('claude')
  const [speeches, setSpeeches]   = useState<Partial<Record<CharName, string>>>({})
  const convoRef = useRef({ ci: 0, li: 0 })
  const inputRef   = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatLog])

  useEffect(() => {
    if (phase === 'writing' || phase === 'judging') {
      const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
      return () => clearInterval(t)
    }
    setDots('')
  }, [phase])

  // Scripted dialogue cycling
  useEffect(() => {
    if (phase !== 'idle') { setSpeeches({}); return }

    function advance() {
      const { ci, li } = convoRef.current
      const convo = CONVOS[ci]
      const line  = convo[li]

      // Show this line
      setSpeeches({ [line.who]: line.text })

      // Advance
      const nextLi = li + 1
      if (nextLi < convo.length) {
        convoRef.current = { ci, li: nextLi }
      } else {
        convoRef.current = { ci: (ci + 1) % CONVOS.length, li: 0 }
      }
    }

    advance() // show first line immediately
    const t = setInterval(advance, 2600)
    return () => { clearInterval(t); setSpeeches({}) }
  }, [phase])

  // T key / Escape
  const openChat = useCallback(() => {
    setChatOpen(true)
    setSpeeches({})
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 't' || e.key === 'T') && !chatOpen && phase === 'idle') {
        e.preventDefault()
        openChat()
      }
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false)
        inputRef.current?.blur()
      }
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
      { color: '#ffff00', text: '⚡ BATTLE STARTING!' },
    ])

    setPhase('writing')
    addLog('#888', '[System] AIs are writing their answers...')

    let answers: Record<CharName, string>
    try {
      const res = await fetch('/api/battle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: userPrompt }) })
      answers = await res.json()
    } catch {
      addLog('#ff4444', '[Error] Battle API failed.')
      setPhase('idle')
      return
    }

    addLog('#D97559', '<Claude> Submitted! ◈')
    addLog('#10A37F', '<ChatGPT> Done! ⬡')
    addLog('#4285F4', '<Gemini> Finished! ✦')
    setPhase('judging')
    addLog('#C9A84C', '[Chairman] *examines all three papers* 🧐')

    let judgment: Record<string, unknown>
    try {
      const res = await fetch('/api/judge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: userPrompt, ...answers }) })
      judgment = await res.json()
    } catch {
      addLog('#ff4444', '[Error] Judge API failed.')
      setPhase('idle')
      return
    }

    const ranking  = (judgment.ranking as CharName[]) || (['claude', 'chatgpt', 'gemini'] as CharName[])
    const scores   = { claude: judgment.claude as JudgeResult, chatgpt: judgment.chatgpt as JudgeResult, gemini: judgment.gemini as JudgeResult }
    const speech   = (judgment.chairman_speech as string) || 'The results are in!'

    setBattle({ answers, scores, ranking, chairmanSpeech: speech })
    setSelected(ranking[0])
    setChatOpen(false)

    addLog('#C9A84C', `[Chairman] ${speech}`)
    addLog('#FFD700', `🏆 WINNER: ${ranking[0].toUpperCase()}!`)
    addLog('#888',    ranking.map((r, i) => `${i + 1}. ${r}`).join(' > '))
    setPhase('results')
  }

  function resetGame() {
    setPhase('idle'); setBattle(null); setSelected('claude')
    setChatLog(IDLE_LOG); setPrompt(''); setChatOpen(false)
    convoRef.current = { ci: 0, li: 0 }
  }

  // Lean angles — toward center of table when chatOpen=false
  const leanIdle: Record<CharName, number> = { claude: 10, chatgpt: -10, gemini: 8, chairman: -8 }

  return (
    <div className="h-screen w-screen overflow-hidden stars-bg relative" style={{ background: '#080818' }}>

      {/* ── HEADER ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5"
        style={{ height: 44, background: 'rgba(0,0,0,0.78)', borderBottom: '1px solid #C9A84C20', backdropFilter: 'blur(8px)' }}>
        <motion.h1 className="font-game neon-text" style={{ color: '#C9A84C', fontSize: 10 }}
          animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }}>
          👑 AI CHAIRMAN BATTLE ROYALE
        </motion.h1>
        <div className="flex items-center gap-4">
          <div className="font-game" style={{ fontSize: 8, color: phase === 'writing' || phase === 'judging' ? '#ffff00' : '#555' }}>
            {phase === 'idle' ? '> AWAITING PROMPT' : ''}
            {phase === 'writing' ? `> AIs WRITING${writingDots}` : ''}
            {phase === 'judging' ? `> JUDGING${writingDots}` : ''}
            {phase === 'results' ? '> RESULTS IN!' : ''}
          </div>
          {phase === 'results' && (
            <button className="btn-game" style={{ fontSize: 7, color: '#C9A84C', borderColor: '#C9A84C', background: 'rgba(201,168,76,0.12)' }} onClick={resetGame}>
              ↺ NEW BATTLE
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="absolute inset-0 pt-11 pb-14">
        <AnimatePresence mode="wait">

          {/* ── TABLE SCENE ── */}
          {phase !== 'results' && (
            <motion.div key="table" className="w-full h-full flex flex-col items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Top row */}
              <div className="flex items-end gap-16 mb-[-44px] relative z-10">
                <motion.div animate={{ rotate: chatOpen ? 0 : leanIdle.claude }}   transition={{ duration: 0.6, ease: 'easeInOut' }}>
                  <Character name="claude"  phase={phase} size={170} speech={!chatOpen ? speeches.claude  : undefined} speechSide="right" />
                </motion.div>
                <motion.div animate={{ rotate: chatOpen ? 0 : leanIdle.chatgpt }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
                  <Character name="chatgpt" phase={phase} size={170} speech={!chatOpen ? speeches.chatgpt : undefined} speechSide="left" />
                </motion.div>
              </div>

              {/* Conference table */}
              <div className="table-surface rounded-full flex items-center justify-center relative"
                style={{ width: 460, height: 220, zIndex: 5 }}>
                <AnimatePresence mode="wait">
                  {phase === 'idle' && !chatOpen && (
                    <motion.div key="idle" className="text-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.div className="font-game" style={{ color: '#7a5a1a', fontSize: 8 }}
                        animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }}>
                        PRESS T TO ENTER CHAT
                      </motion.div>
                    </motion.div>
                  )}
                  {phase === 'idle' && chatOpen && (
                    <motion.div key="watching" className="text-center"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <motion.div className="font-game" style={{ color: '#00ff88', fontSize: 8 }}
                        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }}>
                        👀 EVERYONE IS WATCHING YOU
                      </motion.div>
                    </motion.div>
                  )}
                  {phase === 'writing' && (
                    <motion.div key="writing" className="font-game text-yellow-400"
                      style={{ fontSize: 8 }}
                      animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.5, repeat: Infinity }}>
                      ✏️ WRITING{writingDots}
                    </motion.div>
                  )}
                  {phase === 'judging' && (
                    <motion.div key="judging" className="text-center">
                      <motion.div className="font-game" style={{ color: '#C9A84C', fontSize: 8 }}
                        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.5, repeat: Infinity }}>
                        📋 JUDGING{writingDots}
                      </motion.div>
                      {['📄', '📄', '📄'].map((p, i) => (
                        <motion.div key={i} className="absolute text-2xl"
                          initial={{ x: [-120, 0, 120][i], y: -10, opacity: 0 }}
                          animate={{ x: 0, y: -100, opacity: [0, 1, 0] }}
                          transition={{ duration: 1.3, delay: i * 0.45, repeat: Infinity, repeatDelay: 0.5 }}>
                          {p}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom row */}
              <div className="flex items-start gap-16 mt-[-44px] relative z-10">
                <motion.div animate={{ rotate: chatOpen ? 0 : leanIdle.gemini }}   transition={{ duration: 0.6, ease: 'easeInOut' }}>
                  <Character name="gemini"   phase={phase} size={170} speech={!chatOpen ? speeches.gemini   : undefined} speechSide="right" />
                </motion.div>
                <motion.div animate={{ rotate: chatOpen ? 0 : leanIdle.chairman }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
                  <Character name="chairman" phase={phase} size={170} speech={!chatOpen ? speeches.chairman : undefined} speechSide="left" />
                </motion.div>
              </div>

            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && battle && (
            <motion.div key="results" className="w-full h-full flex flex-col overflow-hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              <div className="flex-shrink-0 flex items-center justify-center py-3 border-b" style={{ borderColor: '#ffffff0f' }}>
                <Podium ranking={battle.ranking} scores={battle.scores} chairmanSpeech={battle.chairmanSpeech}
                  selectedAI={selectedAI} onSelect={setSelected} />
              </div>

              <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
                {/* AI tabs */}
                <div className="flex gap-2 flex-shrink-0">
                  {battle.ranking.map((ai, i) => {
                    const info = CHAR_CONFIG[ai]
                    return (
                      <button key={ai} onClick={() => setSelected(ai)}
                        style={{
                          fontFamily: "'Press Start 2P', cursive", fontSize: 8,
                          padding: '6px 12px', borderRadius: 6,
                          border: `1.5px solid ${selectedAI === ai ? info.color : info.color + '35'}`,
                          background: selectedAI === ai ? info.headBg : 'transparent',
                          color: selectedAI === ai ? info.color : info.color + '65',
                          boxShadow: selectedAI === ai ? `0 0 10px ${info.color}40` : 'none',
                          cursor: 'pointer',
                        }}>
                        {['🥇', '🥈', '🥉'][i]} {info.label}
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {battle.ranking.map(ai => selectedAI !== ai ? null : (
                    <motion.div key={ai} className="flex-1 overflow-hidden flex gap-3"
                      initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.2 }}>

                      {/* Score panel */}
                      <div className="flex-shrink-0 w-44 rounded-lg border p-3 flex flex-col gap-2"
                        style={{ borderColor: CHAR_CONFIG[ai].color + '40', background: CHAR_CONFIG[ai].headBg + 'e0' }}>
                        <div className="text-center font-game font-bold" style={{ color: CHAR_CONFIG[ai].color, fontSize: 24 }}>
                          {battle.scores[ai]?.score ?? '?'}/10
                        </div>
                        <div className="text-center text-gray-400" style={{ fontFamily: 'sans-serif', fontSize: 10, lineHeight: 1.5 }}>
                          &ldquo;{battle.scores[ai]?.verdict}&rdquo;
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                          {CRITERIA.map(c => (
                            <div key={c.key}>
                              <div className="flex justify-between mb-0.5">
                                <span className="font-game text-gray-500" style={{ fontSize: 6 }}>{c.label}</span>
                                <span className="font-game" style={{ color: CHAR_CONFIG[ai].color, fontSize: 7 }}>{battle.scores[ai]?.[c.key]}</span>
                              </div>
                              <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: '#1a1a2e' }}>
                                <motion.div className="h-full rounded-full" style={{ background: CHAR_CONFIG[ai].color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((battle.scores[ai]?.[c.key] ?? 0) / 10) * 100}%` }}
                                  transition={{ duration: 0.9, delay: 0.2 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Full response */}
                      <div className="flex-1 rounded-lg border overflow-hidden flex flex-col"
                        style={{ borderColor: CHAR_CONFIG[ai].color + '40', background: 'rgba(0,0,0,0.5)' }}>
                        <div className="flex-shrink-0 px-4 py-2 border-b flex items-center gap-2"
                          style={{ borderColor: CHAR_CONFIG[ai].color + '20' }}>
                          <span className="font-game" style={{ color: CHAR_CONFIG[ai].color, fontSize: 9 }}>
                            {CHAR_CONFIG[ai].label} — RESPONSE
                          </span>
                          {battle.ranking[0] === ai && (
                            <span className="ml-auto font-game" style={{ color: '#FFD700', fontSize: 8 }}>🏆 WINNER</span>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3 text-gray-200"
                          style={{ fontFamily: 'sans-serif', fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                          {battle.answers[ai]}
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── MINECRAFT CHAT LOG ── */}
      <div className="mc-chat-box">
        {chatLog.slice(-10).map((entry, i) => (
          <div key={i} className="mc-msg" style={{ color: entry.color }}>{entry.text}</div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div className="mc-input-wrap">
        {!chatOpen && phase === 'idle' && (
          <motion.span className="font-game flex-shrink-0 mr-3" style={{ fontSize: 8, color: '#444' }}
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
            PRESS T TO CHAT
          </motion.span>
        )}

        {(chatOpen || phase !== 'idle') && (
          <>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#555' }}>▶</span>
            <input ref={inputRef} type="text" value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') startBattle()
                if (e.key === 'Escape') { setChatOpen(false); inputRef.current?.blur() }
              }}
              disabled={phase !== 'idle'}
              placeholder={
                phase === 'idle'    ? 'Enter prompt... (Enter to send, Esc to close)' :
                phase === 'writing' ? 'AIs are writing...' :
                phase === 'judging' ? 'Chairman is judging...' : 'Click ↺ NEW BATTLE'
              }
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
              style={{ fontFamily: 'monospace', fontSize: 13 }}
              autoFocus={chatOpen}
            />
            <button className="btn-game flex-shrink-0"
              style={{
                fontSize: 8,
                color: phase === 'idle' ? '#00ff00' : '#444',
                borderColor: phase === 'idle' ? '#00ff00' : '#333',
                background: phase === 'idle' ? 'rgba(0,255,0,0.08)' : 'transparent',
                cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
              }}
              onClick={startBattle} disabled={phase !== 'idle'}>
              ↵ SEND
            </button>
          </>
        )}

        <div className="flex gap-1 ml-auto flex-shrink-0">
          {(['idle', 'writing', 'judging', 'results'] as Phase[]).map(p => (
            <div key={p} className="h-2 rounded-full transition-all duration-500"
              style={{ width: phase === p ? '20px' : '7px', background: phase === p ? '#C9A84C' : '#1e1e2e', boxShadow: phase === p ? '0 0 6px #C9A84C' : 'none' }} />
          ))}
        </div>
      </div>

    </div>
  )
}
