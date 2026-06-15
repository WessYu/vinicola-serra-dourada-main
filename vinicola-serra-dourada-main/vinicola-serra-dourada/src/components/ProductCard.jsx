import { Button } from "./Button"
import { Badge } from "./Badge"
import { Stars } from "./Stars"
import { formatBRL } from "../lib/money"
import { useCart } from "../context/CartContext"

export function ProductCard({ p }) {
  const { addItem } = useCart()

  return (
    <article id={`product-${p.id}`} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-wine-800">{p.type}</div>
          <h3 className="mt-1 text-lg font-extrabold text-white">{p.name}</h3>
          <div className="mt-1 text-sm text-zinc-400">{p.grape} • Safra {p.year}</div>
        </div>
        {p.badge ? <Badge>{p.badge}</Badge> : null}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
        <img
          src={p.image}
          alt={`Garrafa ${p.name}`}
          className="h-48 w-auto justify-self-center transition group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="text-right">
          <div className="text-2xl font-extrabold text-white">{formatBRL(p.price)}</div>
          <div className="mt-1 flex justify-end text-zinc-400">
            <Stars value={p.rating} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button className="flex-1" onClick={() => addItem(p)}>
          Adicionar
        </Button>
        <Button variant="outline" as="a" href="#clube" className="whitespace-nowrap">
          Clube
        </Button>
      </div>
    </article>
  )
}
