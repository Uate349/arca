interface Props {
  points: number
  level: string
}

export default function PointsBadge({ points, level }: Props) {
  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
      <div>
        <div className="text-xs text-slate-400">Seus pontos ARCA</div>
        <div className="text-2xl font-bold text-emerald-400">{points}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-slate-400">Nível</div>
        <div className="text-sm font-semibold uppercase">{level}</div>
      </div>
    </div>
  )
}
