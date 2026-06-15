export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="w-2/3">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="mt-3 h-5 w-40 rounded bg-white/10" />
          <div className="mt-2 h-4 w-52 rounded bg-white/10" />
        </div>
        <div className="h-6 w-20 rounded-full bg-white/10" />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
        <div className="h-48 w-full rounded-2xl bg-white/10" />
        <div className="w-28">
          <div className="h-7 w-full rounded bg-white/10" />
          <div className="mt-2 h-4 w-20 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-10 flex-1 rounded-2xl bg-white/10" />
        <div className="h-10 w-20 rounded-2xl bg-white/10" />
      </div>
    </div>
  )
}
