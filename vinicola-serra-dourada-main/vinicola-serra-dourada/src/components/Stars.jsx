export function Stars({ value = 4.5 }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  const total = 5
  return (
    <div className="flex items-center gap-1" aria-label={`Avaliação ${value} de 5`}>
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1
        const filled = idx <= full
        const isHalf = !filled && half && idx === full + 1
        return (
          <span key={i} className="text-sm text-gold-300">
            {filled ? "★" : isHalf ? "⯪" : "☆"}
          </span>
        )
      })}
    </div>
  )
}
