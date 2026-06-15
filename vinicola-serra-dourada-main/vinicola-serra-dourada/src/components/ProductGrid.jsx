import React, { useEffect, useMemo, useState } from "react"
import { Container } from "./Container"
import { Button } from "./Button"
import { ProductCard } from "./ProductCard"
import { SkeletonCard } from "./SkeletonCard"
import { products as allProducts, PRODUCT_TYPES } from "../data/products"

const sorters = [
  { key: "featured", label: "Relevância" },
  { key: "price_asc", label: "Menor preço" },
  { key: "price_desc", label: "Maior preço" },
]

export function ProductGrid() {
  const [type, setType] = useState("Todos")
  const [sortKey, setSortKey] = useState("featured")
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

  const list = useMemo(() => {
    let arr = [...allProducts]
    if (type !== "Todos") arr = arr.filter((p) => p.type === type)

    if (sortKey === "price_asc") arr.sort((a, b) => a.price - b.price)
    if (sortKey === "price_desc") arr.sort((a, b) => b.price - a.price)

    return arr
  }, [type, sortKey])

  return (
    <section id="vinhos" className="py-14 bg-zinc-950">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-white">Vinhos em destaque</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
              Selecione o tipo, compare preços e adicione ao carrinho. Tudo rodando 100% no front-end com dados mock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold text-zinc-200" htmlFor="sort">
              Ordenar:
            </label>
            <select
              id="sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-soft"
            >
              {sorters.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {PRODUCT_TYPES.map((t) => (
            <Button
              key={t}
              variant={type === t ? "primary" : "outline"}
              className="px-3 py-2"
              onClick={() => setType(t)}
            >
              {t}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </Container>
    </section>
  )
}
