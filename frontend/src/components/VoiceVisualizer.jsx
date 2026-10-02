export default function VoiceVisualizer({ isActive, mode = 'interviewer', barCount = 16 }) {
  const bars = Array.from({ length: barCount }, (_, i) => i)

  const isInterviewer = mode === 'interviewer'
  const baseColor = isInterviewer ? 'bg-indigo-500' : 'bg-emerald-500'
  const glowColor = isInterviewer ? 'shadow-indigo-500/50' : 'shadow-emerald-500/50'

  return (
    <div className="flex items-center justify-center gap-1.5 h-12 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
      {bars.map((index) => {
        // Vary heights deterministically for realistic waveform look
        const delay = (index % 4) * 0.15
        const heightMultiplier = Math.sin((index / barCount) * Math.PI) * 0.8 + 0.2

        return (
          <div
            key={index}
            className={`w-1.5 rounded-full transition-all duration-200 ${baseColor} ${isActive ? `shadow-sm ${glowColor}` : 'opacity-30'}`}
            style={{
              height: isActive ? `${Math.max(12, 36 * heightMultiplier)}px` : '6px',
              animation: isActive ? `soundwave 0.8s ease-in-out ${delay}s infinite alternate` : 'none',
            }}
          />
        )
      })}
      <style>{`
        @keyframes soundwave {
          0% { transform: scaleY(0.3); }
          50% { transform: scaleY(1.0); }
          100% { transform: scaleY(0.4); }
        }
      `}</style>
    </div>
  )
}
