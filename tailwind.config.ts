import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        game: ['"Press Start 2P"', 'cursive'],
      },
      colors: {
        claude: '#D97559',
        chatgpt: '#10A37F',
        gemini: '#4285F4',
        chairman: '#C9A84C',
      },
      keyframes: {
        bounce2: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shake: { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-3deg)' }, '75%': { transform: 'rotate(3deg)' } },
        write: { '0%': { transform: 'rotate(-10deg) translateX(-4px)' }, '100%': { transform: 'rotate(10deg) translateX(4px)' } },
        floatUp: { '0%': { opacity: '1', transform: 'translateY(0)' }, '100%': { opacity: '0', transform: 'translateY(-80px)' } },
        glow: { '0%,100%': { boxShadow: '0 0 8px 2px currentColor' }, '50%': { boxShadow: '0 0 24px 6px currentColor' } },
        slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-60px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(60px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(40px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        crownBounce: { '0%,100%': { transform: 'translateY(0) rotate(-5deg)' }, '50%': { transform: 'translateY(-12px) rotate(5deg)' } },
        cry: { '0%,100%': { transform: 'rotate(-2deg)' }, '50%': { transform: 'rotate(2deg)' } },
        starSpin: { '0%': { transform: 'rotate(0deg) scale(1)' }, '50%': { transform: 'rotate(180deg) scale(1.3)' }, '100%': { transform: 'rotate(360deg) scale(1)' } },
        typewriter: { from: { width: '0' }, to: { width: '100%' } },
        blink: { '0%,100%': { borderColor: 'transparent' }, '50%': { borderColor: 'white' } },
        pulse2: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        bounce2: 'bounce2 1.6s ease-in-out infinite',
        shake: 'shake 0.15s ease-in-out infinite',
        write: 'write 0.3s ease-in-out infinite alternate',
        floatUp: 'floatUp 2s ease-out forwards',
        glow: 'glow 2s ease-in-out infinite',
        slideInLeft: 'slideInLeft 0.5s ease-out forwards',
        slideInRight: 'slideInRight 0.5s ease-out forwards',
        slideUp: 'slideUp 0.6s ease-out forwards',
        crownBounce: 'crownBounce 1s ease-in-out infinite',
        cry: 'cry 0.4s ease-in-out infinite',
        starSpin: 'starSpin 3s linear infinite',
        pulse2: 'pulse2 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
