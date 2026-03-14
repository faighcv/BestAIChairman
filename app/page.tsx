'use client'
import { useState, useRef, useEffect } from 'react'
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

const IDLE_LOG: ChatEntry[] = [
  { color: '#C9A84C', text: '[Chairman] Welcome to AI BATTLE ROYALE! 👑' },
  { color: '#888', text: '[System] Type a prompt to begin.' },
  { color: '#D97559', text: '<Claude> Ready and waiting... ◈' },
  { color: '#10A37F', text: '<ChatGPT> Bring it on! ⬡' },
  { color: '#4285F4', text: '<Gemini> I was born for this. ✦' },
]

const CRITERIA = [
  { key: 'accuracy' as const, label: 'ACCURACY' },
  { key: 'clarity' as const, label: 'CLARITY' },
  { key: 'helpfulness' as const, label: 'HELP' },
  { key: 'creativity' as const, label: 'STYLE' },
]

export default function GamePage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [prompt, setPrompt] = useState('')
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [chatLog, setChatLog] = useState<ChatEntry[]>(IDLE_LOG)
  const [writingDots, setWritingDots] = useState('')
  const [selectedAI, setSelectedAI] = useState<CharName>('claude')
  const inputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog])

  useEffect(() => {
    if (phase === 'writing' || phase === 'judging') {
      const interval = setInterval(() => {
        setWritingDots((d) => (d.length >= 3 ? '' : d + '.'))
      }, 400)
      return () => clearInterval(interval)
    }
    setWritingDots('')
  }, [phase])

  function addLog(color: string, text: string) {
    setChatLog((prev) => [...prev, { color, text }])
  }

  async function startBattle() {
    if (!prompt.trim() || phase !== 'idle') return
    const userPrompt = prompt.trim()
    setPrompt('')

    setChatLog([
      ...IDLE_LOG,
      { color: '#ffffff', text: `<You> ${userPrompt}` },
      { color: '#ffff00', text: '⚡ BATTLE STARTING!' },
    ])

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

    addLog('#D97559', '<Claude> Answer submitted! ◈')
    addLog('#10A37F', '<ChatGPT> Done! ⬡')
    addLog('#4285F4', '<Gemini> Finished! ✦')

    setPhase('judging')
    addLog('#C9A84C', '[Chairman] *examines papers carefully* 🧐')

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
      claude: judgment.claude as JudgeResult,
      chatgpt: judgment.chatgpt as JudgeResult,
      gemini: judgment.gemini as JudgeResult,
    }
    const speech = (judgment.chairman_speech as string) || 'And the results are in!'

    setBattle({ answers, scores, ranking, chairmanSpeech: speech })
    setSelectedAI(ranking[0])

    addLog('#C9A84C', `[Chairman] ${speech}`)
    addLog('#FFD700', `🏆 WINNER: ${ranking[0].toUpperCase()}!`)
    addLog('#888', `Rankings: ${ranking.map((r, i) => `${i + 1}. ${r}`).join(' > ')}`)

    setPhase('results')
  }

  function resetGame() {
    setPhase('idle')
    setBattle(null)
    setSelectedAI('claude')
    setChatLog(IDLE_LOG)
    setPrompt('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const phaseLabel =
    phase === 'idle'
      ? '> AWAITING PROMPT'
      : phase === 'writing'
      ? `> AIs WRITING${writingDots}`
      : phase === 'judging'
      ? `> CHAIRMAN JUDGING${writingDots}`
      : '> RESULTS IN!'

  return (
    <div
      className="h-screen w-screen overflow-hidden stars-bg relative"
      style={{ background: '#080818' }}
    >
      {/* ── HEADER ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: '#C9A84C30', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', height: 40 }}
      >
        <motion.h1
          className="text-[9px] font-game neon-text"
          style={{ color: '#C9A84C' }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          👑 AI CHAIRMAN BATTLE ROYALE
        </motion.h1>
        <div className="flex items-center gap-4">
          <div
            className="text-[8px] font-game"
            style={{ color: phase === 'writing' || phase === 'judging' ? '#ffff00' : '#888' }}
          >
            {phaseLabel}
          </div>
          {phase === 'results' && (
            <motion.button
              className="btn-game text-[7px]"
              style={{ color: '#C9A84C', borderColor: '#C9A84C', background: 'rgba(201,168,76,0.1)' }}
              onClick={resetGame}
              whileTap={{ scale: 0.95 }}
            >
              ↺ NEW BATTLE
            </motion.button>
          )}
        </div>
      </div>

      {/* ── MAIN GAME AREA ── */}
      <div className="absolute inset-0 pt-10 pb-12">
        <AnimatePresence mode="wait">

          {/* TABLE SCENE — idle / writing / judging */}
          {phase !== 'results' && (
            <motion.div
              key="table"
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative flex flex-col items-center">
                {/* Top row */}
                <div className="flex gap-20 mb-[-28px] relative z-10">
                  <Character name="claude" phase={phase} />
                  <Character name="chatgpt" phase={phase} />
                </div>

                {/* Round table */}
                <div
                  className="table-surface rounded-full flex items-center justify-center relative"
                  style={{ width: 300, height: 150 }}
                >
                  {phase === 'idle' && (
                    <motion.div
                      className="text-[7px] font-game text-amber-600 text-center"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ⚡ TYPE TO BEGIN ⚡
                    </motion.div>
                  )}
                  {phase === 'writing' && (
                    <motion.div
                      className="text-[7px] font-game text-yellow-400 text-center"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ✏️ WRITING{writingDots}
                    </motion.div>
                  )}
                  {phase === 'judging' && (
                    <motion.div
                      className="text-[7px] font-game text-amber-400 text-center"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      📋 JUDGING{writingDots}
                    </motion.div>
                  )}

                  {/* Floating papers during judging */}
                  {phase === 'judging' &&
                    ['📄', '📄', '📄'].map((p, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-xl"
                        initial={{ x: [-90, 0, 90][i], y: -20, opacity: 0 }}
                        animate={{ x: 0, y: -70, opacity: [0, 1, 0] }}
                        transition={{ duration: 1.1, delay: i * 0.35, repeat: Infinity, repeatDelay: 0.8 }}
                      >
                        {p}
                      </motion.div>
                    ))}
                </div>

                {/* Bottom row */}
                <div className="flex gap-20 mt-[-28px] relative z-10">
                  <Character name="gemini" phase={phase} />
                  <Character name="chairman" phase={phase} />
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS SCENE */}
          {phase === 'results' && battle && (
            <motion.div
              key="results"
              className="w-full h-full flex flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Top: Podium */}
              <div
                className="flex-shrink-0 flex items-center justify-center py-3 border-b"
                style={{ borderColor: '#ffffff10' }}
              >
                <Podium
                  ranking={battle.ranking}
                  scores={battle.scores}
                  chairmanSpeech={battle.chairmanSpeech}
                  selectedAI={selectedAI}
                  onSelect={setSelectedAI}
                />
              </div>

              {/* Bottom: Response viewer */}
              <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
                {/* AI selector tabs */}
                <div className="flex gap-2 flex-shrink-0">
                  {battle.ranking.map((ai, i) => {
                    const info = CHAR_CONFIG[ai]
                    return (
                      <button
                        key={ai}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all text-[8px] font-game"
                        style={{
                          borderColor: selectedAI === ai ? info.color : info.color + '40',
                          background: selectedAI === ai ? info.headBg : 'transparent',
                          color: selectedAI === ai ? info.color : info.color + '80',
                          boxShadow: selectedAI === ai ? `0 0 8px ${info.color}60` : 'none',
                        }}
                        onClick={() => setSelectedAI(ai)}
                      >
                        {['🥇', '🥈', '🥉'][i]} {info.label}
                      </button>
                    )
                  })}
                </div>

                {/* Response content */}
                <AnimatePresence mode="wait">
                  {battle.ranking.map((ai) =>
                    selectedAI === ai ? (
                      <motion.div
                        key={ai}
                        className="flex-1 overflow-hidden flex gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Score panel */}
                        <div
                          className="flex-shrink-0 w-44 rounded-lg border p-3 flex flex-col gap-2"
                          style={{ borderColor: CHAR_CONFIG[ai].color + '50', background: CHAR_CONFIG[ai].headBg + 'cc' }}
                        >
                          <div
                            className="text-center text-[18px] font-game font-bold"
                            style={{ color: CHAR_CONFIG[ai].color }}
                          >
                            {battle.scores[ai]?.score ?? '?'}/10
                          </div>
                          <div
                            className="text-[7px] text-center leading-relaxed"
                            style={{ fontFamily: 'sans-serif', color: '#ccc' }}
                          >
                            &ldquo;{battle.scores[ai]?.verdict}&rdquo;
                          </div>
                          <div className="flex flex-col gap-1.5 mt-1">
                            {CRITERIA.map((c) => (
                              <div key={c.key} className="flex flex-col gap-0.5">
                                <div className="flex justify-between">
                                  <span className="text-[6px] font-game text-gray-500">{c.label}</span>
                                  <span className="text-[7px] font-game" style={{ color: CHAR_CONFIG[ai].color }}>
                                    {battle.scores[ai]?.[c.key]}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: CHAR_CONFIG[ai].color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((battle.scores[ai]?.[c.key] ?? 0) / 10) * 100}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Full response */}
                        <div
                          className="flex-1 rounded-lg border overflow-hidden flex flex-col"
                          style={{ borderColor: CHAR_CONFIG[ai].color + '50', background: 'rgba(0,0,0,0.4)' }}
                        >
                          <div
                            className="flex-shrink-0 px-4 py-2 border-b flex items-center gap-2"
                            style={{ borderColor: CHAR_CONFIG[ai].color + '30' }}
                          >
                            <span className="text-lg">{CHAR_CONFIG[ai].logoChar}</span>
                            <span className="text-[8px] font-game" style={{ color: CHAR_CONFIG[ai].color }}>
                              {CHAR_CONFIG[ai].label} RESPONSE
                            </span>
                            {battle.ranking[0] === ai && (
                              <span className="text-[7px] font-game ml-auto" style={{ color: '#FFD700' }}>
                                🏆 WINNER
                              </span>
                            )}
                          </div>
                          <div
                            className="flex-1 overflow-y-auto px-4 py-3 text-[11px] leading-relaxed text-gray-200"
                            style={{ fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }}
                          >
                            {battle.answers[ai]}
                          </div>
                        </div>
                      </motion.div>
                    ) : null
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MINECRAFT CHAT OVERLAY ── */}
      <div className="mc-chat-box">
        {chatLog.slice(-10).map((entry, i) => (
          <div key={i} className="mc-msg" style={{ color: entry.color }}>
            {entry.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── MINECRAFT INPUT BAR ── */}
      <div className="mc-input-wrap">
        <span className="text-[9px] font-game text-gray-500 flex-shrink-0">▶</span>
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && startBattle()}
          disabled={phase !== 'idle'}
          placeholder={
            phase === 'idle'
              ? 'Enter your prompt and press Enter...'
              : phase === 'writing'
              ? 'AIs are writing their answers...'
              : phase === 'judging'
              ? 'Chairman is judging...'
              : 'Battle complete! Click ↺ NEW BATTLE'
          }
          className="flex-1 bg-transparent outline-none text-[11px] text-white placeholder-gray-600"
          style={{ fontFamily: 'monospace' }}
          autoFocus
        />
        <button
          className="btn-game text-[8px] flex-shrink-0"
          style={{
            color: phase === 'idle' ? '#00ff00' : '#444',
            borderColor: phase === 'idle' ? '#00ff00' : '#333',
            background: phase === 'idle' ? 'rgba(0,255,0,0.08)' : 'transparent',
            cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
          }}
          onClick={startBattle}
          disabled={phase !== 'idle'}
        >
          ↵ SEND
        </button>

        {/* Phase dots */}
        <div className="flex gap-1 flex-shrink-0">
          {(['idle', 'writing', 'judging', 'results'] as Phase[]).map((p) => (
            <div
              key={p}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: phase === p ? '20px' : '7px',
                background: phase === p ? '#C9A84C' : '#333',
                boxShadow: phase === p ? '0 0 6px #C9A84C' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
