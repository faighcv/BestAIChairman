'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Character, { CharName, CHAR_CONFIG } from '@/components/Character'
import Podium from '@/components/Podium'

type Phase = 'idle' | 'writing' | 'judging' | 'results'

interface JudgeResult {
  score: number
  accuracy: number
  clarity: number
  helpfulness: number
  creativity: number
  verdict: string
}

interface BattleState {
  answers: Record<CharName, string>
  scores: Record<CharName, JudgeResult>
  ranking: CharName[]
  chairmanSpeech: string
}

interface ChatEntry {
  color: string
  text: string
}

// ── Idle chatter messages ─────────────────────────────────────────────────────
const CHATTER: Record<CharName, string[]> = {
  claude:   ['Interesting question...', 'Ready when you are!', 'Hmm, let me think...', 'Challenge accepted!'],
  chatgpt:  ['Bring it on! ⬡', 'I was made for this.', '...calculating...', 'Let\'s go!'],
  gemini:   ['✦ All set!', 'Knowledge ready.', 'Ooh, I love prompts.', 'Try me!'],
  chairman: ['*taps gavel*', 'I will judge fairly.', 'Who will win today?', 'Begin!'],
}

const IDLE_LOG: ChatEntry[] = [
  { color: '#C9A84C', text: '[Chairman] Welcome to AI BATTLE ROYALE! 👑' },
  { color: '#888',    text: '[System] Press T to open chat and enter your prompt.' },
  { color: '#D97559', text: '<Claude> Ready and waiting... ◈' },
  { color: '#10A37F', text: '<ChatGPT> Bring it on! ⬡' },
  { color: '#4285F4', text: '<Gemini> I was born for this. ✦' },
]

const AI_COLORS: Record<CharName, string> = {
  claude: '#D97559', chatgpt: '#10A37F', gemini: '#4285F4', chairman: '#C9A84C',
}

const CRITERIA = [
  { key: 'accuracy'    as const, label: 'ACCURACY' },
  { key: 'clarity'     as const, label: 'CLARITY' },
  { key: 'helpfulness' as const, label: 'HELP' },
  { key: 'creativity'  as const, label: 'STYLE' },
]

// ── Speech bubble (idle talking) ─────────────────────────────────────────────
interface Bubble { id: number; name: CharName; text: string }

export default function GamePage() {
  const [phase, setPhase]         = useState<Phase>('idle')
  const [prompt, setPrompt]       = useState('')
  const [battle, setBattle]       = useState<BattleState | null>(null)
  const [chatLog, setChatLog]     = useState<ChatEntry[]>(IDLE_LOG)
  const [chatOpen, setChatOpen]   = useState(false)
  const [writingDots, setDots]    = useState('')
  const [selectedAI, setSelected] = useState<CharName>('claude')
  const [bubbles, setBubbles]     = useState<Bubble[]>([])
  const bubbleId = useRef(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatLog])

  // writing dots
  useEffect(() => {
    if (phase === 'writing' || phase === 'judging') {
      const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
      return () => clearInterval(t)
    }
    setDots('')
  }, [phase])

  // idle speech bubbles
  useEffect(() => {
    if (phase !== 'idle') return
    const names: CharName[] = ['claude', 'chatgpt', 'gemini', 'chairman']
    const t = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)]
      const msgs = CHATTER[name]
      const text = msgs[Math.floor(Math.random() * msgs.length)]
      const id = ++bubbleId.current
      setBubbles(b => [...b.slice(-5), { id, name, text }])
      setTimeout(() => setBubbles(b => b.filter(x => x.id !== id)), 2600)
    }, 2200)
    return () => clearInterval(t)
  }, [phase])

  // T key to open chat, Escape to close
  const openChat = useCallback(() => {
    setChatOpen(true)
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
    setChatLog(prev => [...prev, { color, text }])
  }

  async function startBattle() {
    if (!prompt.trim() || phase !== 'idle') return
    const userPrompt = prompt.trim()
    setPrompt('')

    setChatLog([
      ...IDLE_LOG,
      { color: '#fff',    text: `<You> ${userPrompt}` },
      { color: '#ffff00', text: '⚡ BATTLE STARTING!' },
    ])
    setBubbles([])

    setPhase('writing')
    addLog('#888', '[System] AIs are writing their answers...')

    let answers: Record<CharName, string>
    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      })
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
    addLog('#C9A84C', '[Chairman] *examines papers* 🧐')

    let judgment: Record<string, unknown>
    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, ...answers }),
      })
      judgment = await res.json()
    } catch {
      addLog('#ff4444', '[Error] Judge API failed.')
      setPhase('idle')
      return
    }

    const ranking = (judgment.ranking as CharName[]) || (['claude', 'chatgpt', 'gemini'] as CharName[])
    const scores = {
      claude:  judgment.claude  as JudgeResult,
      chatgpt: judgment.chatgpt as JudgeResult,
      gemini:  judgment.gemini  as JudgeResult,
    }
    const speech = (judgment.chairman_speech as string) || 'The results are in!'

    setBattle({ answers, scores, ranking, chairmanSpeech: speech })
    setSelected(ranking[0])
    setChatOpen(false)

    addLog('#C9A84C', `[Chairman] ${speech}`)
    addLog('#FFD700', `🏆 WINNER: ${ranking[0].toUpperCase()}!`)
    addLog('#888', `${ranking.map((r, i) => `${i + 1}. ${r}`).join(' > ')}`)
    setPhase('results')
  }

  function resetGame() {
    setPhase('idle')
    setBattle(null)
    setSelected('claude')
    setChatLog(IDLE_LOG)
    setPrompt('')
    setChatOpen(false)
  }

  // lean angles: characters "turn toward each other" when idle
  const LEAN: Record<CharName, number> = { claude: 8, chatgpt: -8, gemini: 6, chairman: -6 }

  return (
    <div className="h-screen w-screen overflow-hidden stars-bg relative" style={{ background: '#080818' }}>

      {/* ── HEADER ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-2 border-b"
        style={{ borderColor: '#C9A84C25', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', height: 44 }}
      >
        <motion.h1
          className="text-[10px] font-game neon-text"
          style={{ color: '#C9A84C' }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          👑 AI CHAIRMAN BATTLE ROYALE
        </motion.h1>
        <div className="flex items-center gap-4">
          <div
            className="text-[8px] font-game"
            style={{ color: phase === 'writing' || phase === 'judging' ? '#ffff00' : '#666' }}
          >
            {phase === 'idle'    ? '> AWAITING PROMPT'          : ''}
            {phase === 'writing' ? `> AIs WRITING${writingDots}` : ''}
            {phase === 'judging' ? `> JUDGING${writingDots}`     : ''}
            {phase === 'results' ? '> RESULTS IN!'               : ''}
          </div>
          {phase === 'results' && (
            <button
              className="btn-game text-[7px]"
              style={{ color: '#C9A84C', borderColor: '#C9A84C', background: 'rgba(201,168,76,0.12)' }}
              onClick={resetGame}
            >
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
            <motion.div
              key="table"
              className="w-full h-full flex flex-col items-center justify-center relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Speech bubbles */}
              <AnimatePresence>
                {bubbles.map(b => (
                  <SpeechBubble key={b.id} name={b.name} text={b.text} />
                ))}
              </AnimatePresence>

              {/* Top row */}
              <div className="flex items-end gap-24 mb-[-36px] relative z-10">
                <motion.div animate={{ rotate: chatOpen ? 0 : LEAN.claude }} transition={{ duration: 0.5 }}>
                  <Character name="claude" phase={phase} size={155} />
                </motion.div>
                <motion.div animate={{ rotate: chatOpen ? 0 : LEAN.chatgpt }} transition={{ duration: 0.5 }}>
                  <Character name="chatgpt" phase={phase} size={155} />
                </motion.div>
              </div>

              {/* Conference table */}
              <div
                className="table-surface rounded-full flex items-center justify-center relative"
                style={{ width: 420, height: 200, zIndex: 5 }}
              >
                <AnimatePresence>
                  {phase === 'idle' && !chatOpen && (
                    <motion.div
                      key="idle-hint"
                      className="text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="text-[8px] font-game text-amber-600"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        PRESS T TO CHAT
                      </motion.div>
                      <div className="text-[7px] text-gray-600 mt-1" style={{ fontFamily: 'sans-serif' }}>
                        ⬡ &nbsp; ◈ &nbsp; ✦
                      </div>
                    </motion.div>
                  )}
                  {phase === 'idle' && chatOpen && (
                    <motion.div
                      key="chat-open"
                      className="text-[8px] font-game text-green-400 text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      👀 THEY&apos;RE WATCHING...
                    </motion.div>
                  )}
                  {phase === 'writing' && (
                    <motion.div
                      key="writing"
                      className="text-[8px] font-game text-yellow-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ✏️ WRITING{writingDots}
                    </motion.div>
                  )}
                  {phase === 'judging' && (
                    <>
                      <motion.div
                        key="judging"
                        className="text-[8px] font-game text-amber-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        📋 JUDGING{writingDots}
                      </motion.div>
                      {['📄', '📄', '📄'].map((p, i) => (
                        <motion.div
                          key={i}
                          className="absolute text-2xl"
                          initial={{ x: [-110, 0, 110][i], y: -10, opacity: 0 }}
                          animate={{ x: 0, y: -90, opacity: [0, 1, 0] }}
                          transition={{ duration: 1.2, delay: i * 0.4, repeat: Infinity, repeatDelay: 0.6 }}
                        >
                          {p}
                        </motion.div>
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom row */}
              <div className="flex items-start gap-24 mt-[-36px] relative z-10">
                <motion.div animate={{ rotate: chatOpen ? 0 : LEAN.gemini }} transition={{ duration: 0.5 }}>
                  <Character name="gemini" phase={phase} size={155} />
                </motion.div>
                <motion.div animate={{ rotate: chatOpen ? 0 : LEAN.chairman }} transition={{ duration: 0.5 }}>
                  <Character name="chairman" phase={phase} size={155} />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && battle && (
            <motion.div
              key="results"
              className="w-full h-full flex flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Podium */}
              <div
                className="flex-shrink-0 flex items-center justify-center py-3 border-b"
                style={{ borderColor: '#ffffff10' }}
              >
                <Podium
                  ranking={battle.ranking}
                  scores={battle.scores}
                  chairmanSpeech={battle.chairmanSpeech}
                  selectedAI={selectedAI}
                  onSelect={setSelected}
                />
              </div>

              {/* Response viewer */}
              <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
                {/* Tabs */}
                <div className="flex gap-2 flex-shrink-0">
                  {battle.ranking.map((ai, i) => {
                    const info = CHAR_CONFIG[ai]
                    return (
                      <button
                        key={ai}
                        className="flex items-center gap-2 px-3 py-1.5 rounded border transition-all"
                        style={{
                          borderColor: selectedAI === ai ? info.color : info.color + '35',
                          background: selectedAI === ai ? info.headBg : 'transparent',
                          color: selectedAI === ai ? info.color : info.color + '70',
                          boxShadow: selectedAI === ai ? `0 0 10px ${info.color}50` : 'none',
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: 8,
                        }}
                        onClick={() => setSelected(ai)}
                      >
                        {['🥇', '🥈', '🥉'][i]} {info.label}
                      </button>
                    )
                  })}
                </div>

                {/* Selected AI response */}
                <AnimatePresence mode="wait">
                  {battle.ranking.map(ai =>
                    selectedAI !== ai ? null : (
                      <motion.div
                        key={ai}
                        className="flex-1 overflow-hidden flex gap-3"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Score panel */}
                        <div
                          className="flex-shrink-0 w-44 rounded-lg border p-3 flex flex-col gap-2"
                          style={{
                            borderColor: CHAR_CONFIG[ai].color + '45',
                            background: CHAR_CONFIG[ai].headBg + 'dd',
                          }}
                        >
                          <div
                            className="text-center font-game font-bold"
                            style={{ color: CHAR_CONFIG[ai].color, fontSize: 22 }}
                          >
                            {battle.scores[ai]?.score ?? '?'}/10
                          </div>
                          <div
                            className="text-center text-gray-400 leading-relaxed"
                            style={{ fontFamily: 'sans-serif', fontSize: 10 }}
                          >
                            &ldquo;{battle.scores[ai]?.verdict}&rdquo;
                          </div>
                          <div className="flex flex-col gap-2 mt-1">
                            {CRITERIA.map(c => (
                              <div key={c.key}>
                                <div className="flex justify-between mb-0.5">
                                  <span className="font-game text-gray-500" style={{ fontSize: 6 }}>{c.label}</span>
                                  <span className="font-game" style={{ color: CHAR_CONFIG[ai].color, fontSize: 7 }}>
                                    {battle.scores[ai]?.[c.key]}
                                  </span>
                                </div>
                                <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: '#1e1e2e' }}>
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: CHAR_CONFIG[ai].color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((battle.scores[ai]?.[c.key] ?? 0) / 10) * 100}%` }}
                                    transition={{ duration: 0.9, delay: 0.2 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Full response */}
                        <div
                          className="flex-1 rounded-lg border overflow-hidden flex flex-col"
                          style={{ borderColor: CHAR_CONFIG[ai].color + '45', background: 'rgba(0,0,0,0.45)' }}
                        >
                          <div
                            className="flex-shrink-0 px-4 py-2 border-b flex items-center gap-2"
                            style={{ borderColor: CHAR_CONFIG[ai].color + '25' }}
                          >
                            <span className="font-game" style={{ color: CHAR_CONFIG[ai].color, fontSize: 9 }}>
                              {CHAR_CONFIG[ai].label} — FULL RESPONSE
                            </span>
                            {battle.ranking[0] === ai && (
                              <span className="ml-auto font-game" style={{ color: '#FFD700', fontSize: 8 }}>
                                🏆 WINNER
                              </span>
                            )}
                          </div>
                          <div
                            className="flex-1 overflow-y-auto px-4 py-3 text-gray-200 leading-relaxed"
                            style={{ fontFamily: 'sans-serif', fontSize: 12, whiteSpace: 'pre-wrap' }}
                          >
                            {battle.answers[ai]}
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MINECRAFT CHAT LOG ── */}
      <div className="mc-chat-box">
        {chatLog.slice(-10).map((entry, i) => (
          <div key={i} className="mc-msg" style={{ color: entry.color }}>
            {entry.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div className="mc-input-wrap">
        {/* T hint when closed in idle */}
        {!chatOpen && phase === 'idle' && (
          <motion.div
            className="font-game text-gray-600 mr-2 flex-shrink-0"
            style={{ fontSize: 8 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            PRESS T TO CHAT
          </motion.div>
        )}

        {chatOpen || phase !== 'idle' ? (
          <>
            <span className="text-gray-500 flex-shrink-0" style={{ fontFamily: 'monospace', fontSize: 12 }}>▶</span>
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') startBattle()
                if (e.key === 'Escape') { setChatOpen(false); inputRef.current?.blur() }
              }}
              disabled={phase !== 'idle'}
              placeholder={
                phase === 'idle'    ? 'Type your prompt... (Enter to send, Esc to close)' :
                phase === 'writing' ? 'AIs are writing their answers...' :
                phase === 'judging' ? 'Chairman is judging...' :
                'Battle complete! Click ↺ NEW BATTLE'
              }
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
              style={{ fontFamily: 'monospace', fontSize: 13 }}
              autoFocus={chatOpen}
            />
            <button
              className="btn-game flex-shrink-0"
              style={{
                color: phase === 'idle' ? '#00ff00' : '#444',
                borderColor: phase === 'idle' ? '#00ff00' : '#333',
                background: phase === 'idle' ? 'rgba(0,255,0,0.08)' : 'transparent',
                cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
                fontSize: 8,
              }}
              onClick={startBattle}
              disabled={phase !== 'idle'}
            >
              ↵ SEND
            </button>
          </>
        ) : null}

        {/* Phase dots */}
        <div className="flex gap-1 ml-auto flex-shrink-0">
          {(['idle', 'writing', 'judging', 'results'] as Phase[]).map(p => (
            <div
              key={p}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: phase === p ? '20px' : '7px',
                background: phase === p ? '#C9A84C' : '#2a2a3a',
                boxShadow: phase === p ? '0 0 6px #C9A84C' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Speech bubble component ───────────────────────────────────────────────────
const BUBBLE_POSITIONS: Record<CharName, { top: string; left: string }> = {
  claude:   { top: '10%', left: '18%' },
  chatgpt:  { top: '10%', left: '56%' },
  gemini:   { top: '62%', left: '18%' },
  chairman: { top: '62%', left: '56%' },
}

function SpeechBubble({ name, text }: { name: CharName; text: string }) {
  const pos = BUBBLE_POSITIONS[name]
  const color = AI_COLORS[name]

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{ top: pos.top, left: pos.left }}
      initial={{ opacity: 0, scale: 0.7, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: -12 }}
      exit={{ opacity: 0, scale: 0.8, y: -24 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="px-3 py-1.5 rounded-xl relative"
        style={{
          background: 'rgba(10,10,24,0.92)',
          border: `1.5px solid ${color}70`,
          color,
          fontFamily: 'sans-serif',
          fontSize: 11,
          maxWidth: 160,
          boxShadow: `0 0 12px ${color}30`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
        {/* Bubble tail */}
        <div
          style={{
            position: 'absolute',
            bottom: -7,
            left: 14,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `7px solid ${color}70`,
          }}
        />
      </div>
    </motion.div>
  )
}
