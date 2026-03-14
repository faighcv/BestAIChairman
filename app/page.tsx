'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Character from '@/components/Character'
import ScoreCard from '@/components/ScoreCard'
import Podium from '@/components/Podium'

type Phase = 'idle' | 'writing' | 'judging' | 'results'
type AIName = 'claude' | 'chatgpt' | 'gemini'

interface JudgeResult {
  score: number
  accuracy: number
  clarity: number
  helpfulness: number
  creativity: number
  verdict: string
}

interface BattleState {
  answers: Record<AIName, string>
  scores: Record<AIName, JudgeResult>
  ranking: AIName[]
  chairmanSpeech: string
}

const PHASE_MESSAGES: Record<Phase, string> = {
  idle: '> AWAITING PROMPT...',
  writing: '> AIs ARE WRITING...',
  judging: '> CHAIRMAN IS JUDGING...',
  results: '> RESULTS ARE IN!',
}

const CHAT_LOG_IDLE = [
  { color: '#C9A84C', text: 'Chairman: Welcome to AI BATTLE ROYALE! 👑' },
  { color: '#888', text: 'System: Type a prompt to begin the battle.' },
  { color: '#D97559', text: 'Claude: Ready and waiting... ◈' },
  { color: '#10A37F', text: 'ChatGPT: Bring it on! ⬡' },
  { color: '#4285F4', text: 'Gemini: I was born for this. ✦' },
]

export default function GamePage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [prompt, setPrompt] = useState('')
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [chatLog, setChatLog] = useState(CHAT_LOG_IDLE)
  const [writingDots, setWritingDots] = useState('')
  const [showPodium, setShowPodium] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog])

  // Animated dots
  useEffect(() => {
    if (phase === 'writing' || phase === 'judging') {
      const interval = setInterval(() => {
        setWritingDots((d) => (d.length >= 3 ? '' : d + '.'))
      }, 400)
      return () => clearInterval(interval)
    }
  }, [phase])

  function addLog(color: string, text: string) {
    setChatLog((prev) => [...prev, { color, text }])
  }

  async function startBattle() {
    if (!prompt.trim() || phase !== 'idle') return

    const userPrompt = prompt.trim()
    setPrompt('')
    setChatLog([
      ...CHAT_LOG_IDLE,
      { color: '#fff', text: `You: ${userPrompt}` },
      { color: '#ffff00', text: '⚡ BATTLE STARTING!' },
    ])

    // Writing phase
    setPhase('writing')
    addLog('#888', 'System: AIs are writing their answers...')

    let answers: Record<AIName, string>
    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      })
      answers = await res.json()
    } catch {
      addLog('#f00', 'Error: Battle API failed.')
      setPhase('idle')
      return
    }

    addLog('#D97559', 'Claude: Done! ◈')
    addLog('#10A37F', 'ChatGPT: Submitted! ⬡')
    addLog('#4285F4', 'Gemini: Finished! ✦')

    // Judging phase
    setPhase('judging')
    addLog('#C9A84C', 'Chairman: *examines papers carefully* 🧐')
    addLog('#888', 'System: Chairman is evaluating responses...')

    let judgment: { scores?: Record<AIName, JudgeResult>; ranking?: AIName[]; chairman_speech?: string } & Record<AIName, JudgeResult>
    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, ...answers }),
      })
      judgment = await res.json()
    } catch {
      addLog('#f00', 'Error: Judge API failed.')
      setPhase('idle')
      return
    }

    const ranking = (judgment.ranking || ['claude', 'chatgpt', 'gemini']) as AIName[]
    const scores: Record<AIName, JudgeResult> = {
      claude: judgment.claude,
      chatgpt: judgment.chatgpt,
      gemini: judgment.gemini,
    }
    const speech = judgment.chairman_speech || 'And the results are in!'

    setBattle({ answers, scores, ranking, chairmanSpeech: speech })

    addLog('#C9A84C', `Chairman: ${speech}`)
    addLog('#FFD700', `🏆 WINNER: ${ranking[0].toUpperCase()}!`)
    addLog('#888', `Rankings: ${ranking.map((r, i) => `${i + 1}. ${r}`).join(' | ')}`)

    setPhase('results')
    setTimeout(() => setShowPodium(true), 500)
  }

  function resetGame() {
    setPhase('idle')
    setBattle(null)
    setShowPodium(false)
    setChatLog(CHAT_LOG_IDLE)
    setPrompt('')
    inputRef.current?.focus()
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col stars-bg" style={{ background: '#080818' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: '#C9A84C40', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      >
        <motion.h1
          className="text-[10px] font-game neon-text"
          style={{ color: '#C9A84C' }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          👑 AI CHAIRMAN BATTLE ROYALE
        </motion.h1>
        <div className="flex items-center gap-3">
          <div className="text-[8px] font-game" style={{ color: '#888' }}>
            {PHASE_MESSAGES[phase]}
            {(phase === 'writing' || phase === 'judging') && (
              <span style={{ color: '#ffff00' }}>{writingDots}</span>
            )}
          </div>
          {phase === 'results' && (
            <button
              className="btn-game text-[8px]"
              style={{
                color: '#C9A84C',
                borderColor: '#C9A84C',
                background: 'rgba(201,168,76,0.1)',
              }}
              onClick={resetGame}
            >
              ↺ NEW BATTLE
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Game Arena */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Table Scene */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <AnimatePresence mode="wait">
              {(phase === 'idle' || phase === 'writing' || phase === 'judging') && (
                <motion.div
                  key="table"
                  className="relative flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {/* Top row: Claude & ChatGPT */}
                  <div className="flex gap-16 mb-[-20px] relative z-10">
                    <Character name="claude" phase={phase} />
                    <Character name="chatgpt" phase={phase} />
                  </div>

                  {/* Table */}
                  <div
                    className="table-surface rounded-full flex items-center justify-center relative"
                    style={{ width: 280, height: 140 }}
                  >
                    {/* Table text */}
                    <div className="text-center">
                      {phase === 'idle' && (
                        <motion.div
                          className="text-[7px] font-game text-amber-600"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ⚡ TYPE TO BEGIN ⚡
                        </motion.div>
                      )}
                      {phase === 'writing' && (
                        <motion.div
                          className="text-[7px] font-game text-yellow-400"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          ✏️ WRITING{writingDots}
                        </motion.div>
                      )}
                      {phase === 'judging' && (
                        <motion.div
                          className="text-[7px] font-game text-amber-400"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          📋 JUDGING{writingDots}
                        </motion.div>
                      )}
                    </div>

                    {/* Floating papers during judging */}
                    {phase === 'judging' &&
                      ['📄', '📄', '📄'].map((p, i) => (
                        <motion.div
                          key={i}
                          className="absolute text-lg"
                          initial={{ x: [-80, 0, 80][i], y: -30, opacity: 0 }}
                          animate={{ x: 0, y: -60, opacity: [0, 1, 0] }}
                          transition={{ duration: 1, delay: i * 0.3, repeat: Infinity, repeatDelay: 1 }}
                        >
                          {p}
                        </motion.div>
                      ))}
                  </div>

                  {/* Bottom row: Gemini & Chairman */}
                  <div className="flex gap-16 mt-[-20px] relative z-10">
                    <Character name="gemini" phase={phase} />
                    <Character name="chairman" phase={phase} isJudging={phase === 'judging'} />
                  </div>
                </motion.div>
              )}

              {phase === 'results' && battle && showPodium && (
                <motion.div
                  key="results"
                  className="w-full max-w-lg overflow-y-auto max-h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Podium
                    ranking={battle.ranking}
                    scores={battle.scores}
                    chairmanSpeech={battle.chairmanSpeech}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Score cards when results */}
          {phase === 'results' && battle && (
            <motion.div
              className="flex-shrink-0 border-t p-3 grid grid-cols-3 gap-2 overflow-y-auto max-h-48"
              style={{ borderColor: '#ffffff15', background: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {battle.ranking.map((ai, i) => (
                <ScoreCard
                  key={ai}
                  name={ai}
                  result={battle.scores[ai]}
                  answer={battle.answers[ai]}
                  rank={i + 1}
                  delay={i * 0.15}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Right: Chat sidebar */}
        <div
          className="w-72 flex-shrink-0 flex flex-col border-l"
          style={{ borderColor: '#ffffff15', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          {/* Chat header */}
          <div
            className="flex-shrink-0 px-3 py-2 border-b"
            style={{ borderColor: '#ffffff15' }}
          >
            <div className="text-[9px] font-game text-gray-400">💬 BATTLE CHAT</div>
          </div>

          {/* Chat log */}
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
            {chatLog.map((entry, i) => (
              <motion.div
                key={i}
                className="text-[8px] leading-relaxed break-words"
                style={{ color: entry.color, fontFamily: 'sans-serif' }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {entry.text}
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: '#ffffff20' }} />

          {/* Input area - Minecraft style */}
          <div className="flex-shrink-0 p-2">
            <div
              className="minecraft-chat rounded p-2 flex flex-col gap-2"
            >
              <div className="text-[7px] font-game text-gray-500">
                {phase === 'idle' ? '▶ ENTER YOUR PROMPT:' : `▶ ${PHASE_MESSAGES[phase]}`}
              </div>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startBattle()}
                  disabled={phase !== 'idle'}
                  placeholder={phase === 'idle' ? 'Type prompt...' : '...'}
                  className="flex-1 bg-transparent outline-none text-[9px] text-white placeholder-gray-600"
                  style={{ fontFamily: 'sans-serif' }}
                  autoFocus
                />
                <button
                  className="btn-game text-[8px] flex-shrink-0"
                  style={{
                    color: phase === 'idle' ? '#00ff00' : '#666',
                    borderColor: phase === 'idle' ? '#00ff00' : '#444',
                    background: phase === 'idle' ? 'rgba(0,255,0,0.1)' : 'transparent',
                    cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
                  }}
                  onClick={startBattle}
                  disabled={phase !== 'idle'}
                >
                  ↵
                </button>
              </div>
            </div>

            {/* Phase indicator */}
            <div className="mt-2 flex gap-1 justify-center">
              {(['idle', 'writing', 'judging', 'results'] as Phase[]).map((p) => (
                <div
                  key={p}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: phase === p ? '24px' : '8px',
                    background: phase === p ? '#C9A84C' : '#333',
                    boxShadow: phase === p ? '0 0 6px #C9A84C' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
