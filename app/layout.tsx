import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI CHAIRMAN ⚡ BATTLE ROYALE',
  description: 'The ultimate AI showdown — Claude vs ChatGPT vs Gemini',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
