import React, { startTransition, useDeferredValue, useEffect, useState } from "react"
import { siteData } from "./siteData"

const initialStatus = { type: "idle", message: "" }
const isLocalApiEnvironment =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

function getLocalApiUrl(path) {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4174/api"
  return `${base}/${path}`
}

function readStoredCart() {
  try {
    const raw = window.localStorage.getItem("serra-dourada-cart")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function encodeNetlifyForm(payload) {
  return new URLSearchParams(payload).toString()
}

async function submitToNetlify(formName, payload) {
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodeNetlifyForm({
      "form-name": formName,
      ...payload,
    }),
  })

  if (!response.ok) {
    throw new Error("Não foi possível enviar o formulário para o Netlify.")
  }
}

function App() {
  const [bootstrap, setBootstrap] = useState(siteData)
  const [loading, setLoading] = useState(false)
  const [catalogType, setCatalogType] = useState("Todos")
  const [sortKey, setSortKey] = useState("featured")
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState(readStoredCart)
  const [reservationStatus, setReservationStatus] = useState(initialStatus)
  const [contactStatus, setContactStatus] = useState(initialStatus)
  const [newsletterStatus, setNewsletterStatus] = useState(initialStatus)
  const [orderStatus, setOrderStatus] = useState(initialStatus)

  const deferredSearch = useDeferredValue(searchTerm)

  useEffect(() => {
    if (!isLocalApiEnvironment) {
      return undefined
    }

    let active = true

    async function loadBootstrap() {
      try {
        const response = await fetch(getLocalApiUrl("bootstrap"))
        if (!response.ok) {
          throw new Error("Não foi possível carregar o catálogo completo.")
        }

        const payload = await response.json()
        if (active) {
          setBootstrap(payload)
        }
      } catch {
        // Em produção ou sem a API local, o site continua com os dados embutidos.
      }
    }

    loadBootstrap()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("serra-dourada-cart", JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
          }
        }
      },
      { threshold: 0.18 }
    )

    const nodes = document.querySelectorAll(".reveal")
    nodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [bootstrap])

  const content = bootstrap?.content ?? {}
  const hero = content.hero ?? {}
  const story = content.story ?? {}
  const club = content.club ?? {}
  const contact = content.contact ?? {}
  const stats = content.stats ?? []
  const highlights = content.highlights ?? []
  const products = bootstrap?.products ?? []
  const experiences = bootstrap?.experiences ?? []
  const testimonials = bootstrap?.testimonials ?? []
  const categories = ["Todos", ...new Set(products.map((product) => product.category))]

  const searchQuery = deferredSearch.trim().toLowerCase()
  const filteredProducts = products
    .filter((product) => (catalogType === "Todos" ? true : product.category === catalogType))
    .filter((product) => {
      if (!searchQuery) {
        return true
      }

      return [product.name, product.grape, product.description, product.pairing]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery)
    })
    .sort((left, right) => {
      if (sortKey === "price-asc") {
        return left.price - right.price
      }
      if (sortKey === "price-desc") {
        return right.price - left.price
      }
      if (sortKey === "rating") {
        return right.rating - left.rating
      }
      return right.featured - left.featured
    })

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id)
      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ]
    })
  }

  function updateCartQuantity(productId, nextQuantity) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(1, nextQuantity) } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(productId) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId))
  }

  async function handleReservationSubmit(event) {
    event.preventDefault()
    setReservationStatus({ type: "loading", message: "Enviando sua reserva..." })

    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      date: String(form.get("date") || ""),
      guests: Number(form.get("guests")),
      notes: String(form.get("notes") || ""),
    }

    try {
      if (isLocalApiEnvironment) {
        const response = await fetch(getLocalApiUrl("reservations"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || "Não foi possível concluir a reserva.")
        }

        setReservationStatus({
          type: "success",
          message: `Reserva confirmada para ${result.record.name}. Código ${result.record.code}.`,
        })
      } else {
        await submitToNetlify("reserva-vinicola", {
          name: payload.name,
          email: payload.email,
          date: payload.date,
          guests: String(payload.guests),
          notes: payload.notes,
        })
        setReservationStatus({
          type: "success",
          message: "Reserva enviada com sucesso. A equipe vai confirmar os detalhes por e-mail.",
        })
      }

      event.currentTarget.reset()
    } catch (submitError) {
      setReservationStatus({ type: "error", message: submitError.message })
    }
  }

  async function handleContactSubmit(event) {
    event.preventDefault()
    setContactStatus({ type: "loading", message: "Enviando mensagem..." })

    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      interest: String(form.get("interest") || ""),
      message: String(form.get("message") || ""),
    }

    try {
      if (isLocalApiEnvironment) {
        const response = await fetch(getLocalApiUrl("contacts"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || "Falha ao enviar sua mensagem.")
        }

        setContactStatus({
          type: "success",
          message: `Mensagem recebida. Protocolo ${result.record.code}.`,
        })
      } else {
        await submitToNetlify("contato-vinicola", payload)
        setContactStatus({
          type: "success",
          message: "Mensagem enviada. A equipe comercial vai retornar em breve.",
        })
      }

      event.currentTarget.reset()
    } catch (submitError) {
      setContactStatus({ type: "error", message: submitError.message })
    }
  }

  async function handleNewsletterSubmit(event) {
    event.preventDefault()
    setNewsletterStatus({ type: "loading", message: "Entrando para o clube..." })

    const form = new FormData(event.currentTarget)
    const payload = {
      email: String(form.get("email") || ""),
      preference: String(form.get("preference") || ""),
    }

    try {
      if (isLocalApiEnvironment) {
        const response = await fetch(getLocalApiUrl("newsletter"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || "Não foi possível registrar seu e-mail.")
        }

        setNewsletterStatus({
          type: "success",
          message: `Clube ativo para ${result.record.email}.`,
        })
      } else {
        await submitToNetlify("newsletter-vinicola", payload)
        setNewsletterStatus({
          type: "success",
          message: "Cadastro concluído. Você entrou para a lista da Serra Dourada.",
        })
      }

      event.currentTarget.reset()
    } catch (submitError) {
      setNewsletterStatus({ type: "error", message: submitError.message })
    }
  }

  async function handleOrderSubmit(event) {
    event.preventDefault()

    if (!cart.length) {
      setOrderStatus({ type: "error", message: "Adicione pelo menos um rótulo ao carrinho." })
      return
    }

    setOrderStatus({ type: "loading", message: "Fechando seu pedido..." })

    const form = new FormData(event.currentTarget)
    const payload = {
      customer: {
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        city: String(form.get("city") || ""),
      },
      notes: String(form.get("notes") || ""),
      items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
    }

    try {
      if (isLocalApiEnvironment) {
        const response = await fetch(getLocalApiUrl("orders"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || "O pedido não foi concluído.")
        }

        setOrderStatus({
          type: "success",
          message: `Pedido ${result.record.code} confirmado com total de ${formatCurrency(result.record.total)}.`,
        })
      } else {
        await submitToNetlify("pedido-vinicola", {
          name: payload.customer.name,
          email: payload.customer.email,
          phone: payload.customer.phone,
          city: payload.customer.city,
          notes: payload.notes,
          cart_items: payload.items
            .map((item) => {
              const product = products.find((currentProduct) => currentProduct.id === item.productId)
              return `${product?.name || item.productId} x${item.quantity}`
            })
            .join(" | "),
          total: formatCurrency(subtotal),
        })
        setOrderStatus({
          type: "success",
          message: "Pedido enviado. A equipe vai confirmar pagamento e entrega com você.",
        })
      }

      event.currentTarget.reset()
      setCart([])
    } catch (submitError) {
      setOrderStatus({ type: "error", message: submitError.message })
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-orb" />
        <p>Carregando a nova experiência da Serra Dourada...</p>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark">SD</span>
          <div>
            <p className="brand-name">Vinícola Serra Dourada</p>
            <p className="brand-subtitle">{content.brand?.location}</p>
          </div>
        </div>

        <nav className="top-nav">
          <a href="#catalogo">Rótulos</a>
          <a href="#experiencias">Experiências</a>
          <a href="#clube">Clube</a>
          <a href="#reserva">Reserva</a>
        </nav>

        <a className="cart-pill" href="#pedido">
          Carrinho <strong>{cartCount}</strong>
        </a>
      </header>

      <main>
        <section className="hero-section reveal">
          <div className="hero-backdrop">
            <img src={hero.backgroundImage} alt="Vinhedo da Serra Dourada ao pôr do sol" />
          </div>

          <div className="hero-content">
            <div className="hero-copy">
              <span className="eyebrow">{hero.eyebrow}</span>
              <h1>{hero.title}</h1>
              <p>{hero.description}</p>

              <div className="hero-actions">
                <a className="primary-button" href="#catalogo">
                  {hero.primaryCta}
                </a>
                <a className="secondary-button" href="#reserva">
                  {hero.secondaryCta}
                </a>
              </div>
            </div>

            <aside className="hero-panel floating-card">
              <p className="panel-label">Curadoria da casa</p>
              <h2>{hero.featuredWine?.name}</h2>
              <p>{hero.featuredWine?.description}</p>
              <div className="panel-meta">
                <span>{hero.featuredWine?.grape}</span>
                <span>{hero.featuredWine?.vintage}</span>
                <span>{formatCurrency(hero.featuredWine?.price ?? 0)}</span>
              </div>
            </aside>
          </div>

          <div className="stats-row">
            {stats.map((stat) => (
              <article className="stat-card floating-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="editorial-section reveal">
          <div className="section-heading">
            <span className="eyebrow">Marca, terroir e ritmo</span>
            <h2>Uma vinícola com presença digital à altura dos seus rótulos.</h2>
          </div>

          <div className="editorial-grid">
            {highlights.map((item) => (
              <article className="editorial-card" key={item.title}>
                <span>{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="catalog-section reveal" id="catalogo">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Fotos reais de vinhos</span>
              <h2>Catálogo vivo com busca, filtros e compra imediata.</h2>
            </div>
            <p>
              Uma seleção pensada para destacar rótulos, ocasiões de consumo e o desejo de visitar
              a Serra Dourada de perto.
            </p>
          </div>

          <div className="catalog-toolbar">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
              placeholder="Busque por uva, estilo ou ocasião"
            />

            <div className="chip-row">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === catalogType ? "chip active" : "chip"}
                  onClick={() => startTransition(() => setCatalogType(category))}
                >
                  {category}
                </button>
              ))}
            </div>

            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              className="sort-select"
            >
              <option value="featured">Mais desejados</option>
              <option value="rating">Melhor avaliados</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card floating-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="product-badge">{product.highlight}</span>
                </div>

                <div className="product-body">
                  <div className="product-topline">
                    <span>{product.category}</span>
                    <span>{product.grape}</span>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-notes">
                    <span>Safra {product.vintage}</span>
                    <span>Harmoniza com {product.pairing}</span>
                  </div>
                  <div className="product-footer">
                    <div>
                      <strong>{formatCurrency(product.price)}</strong>
                      <small>
                        {renderStars(product.rating)} · {product.rating.toFixed(1)}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="primary-button compact"
                      onClick={() => addToCart(product)}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="story-section reveal">
          <div className="story-media floating-card">
            <img src={story.image} alt="Tasting room da Serra Dourada" loading="lazy" />
          </div>

          <div className="story-copy">
            <span className="eyebrow">Experiência imersiva</span>
            <h2>{story.title}</h2>
            <p>{story.description}</p>
            <div className="story-points">
              {story.points?.map((point) => (
                <div className="story-point" key={point.title}>
                  <strong>{point.title}</strong>
                  <span>{point.description}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="experience-section reveal" id="experiencias">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Enoturismo</span>
              <h2>Visitas, degustações guiadas e sunsets privados.</h2>
            </div>
            <p>As experiências já chegam prontas para uma jornada comercial muito mais forte.</p>
          </div>

          <div className="experience-grid">
            {experiences.map((experience) => (
              <article className="experience-card floating-card" key={experience.id}>
                <img src={experience.image} alt={experience.title} loading="lazy" />
                <div className="experience-copy">
                  <div className="experience-meta">
                    <span>{experience.duration}</span>
                    <span>{experience.availability}</span>
                  </div>
                  <h3>{experience.title}</h3>
                  <p>{experience.description}</p>
                  <div className="experience-footer">
                    <strong>{formatCurrency(experience.price)}</strong>
                    <a className="secondary-button compact" href="#reserva">
                      Reservar
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="club-section reveal" id="clube">
          <div className="club-copy">
            <span className="eyebrow">Clube Serra Dourada</span>
            <h2>{club.title}</h2>
            <p>{club.description}</p>
            <ul className="club-list">
              {club.benefits?.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>

          <form className="newsletter-card floating-card" onSubmit={handleNewsletterSubmit}>
            <p className="panel-label">Entre para a lista</p>
            <label>
              Seu e-mail
              <input type="email" name="email" placeholder="voce@email.com" required />
            </label>
            <label>
              Seu estilo preferido
              <select name="preference" defaultValue="Tinto">
                <option value="Tinto">Tintos de guarda</option>
                <option value="Branco">Brancos minerais</option>
                <option value="Rosé">Rosés frescos</option>
                <option value="Espumante">Espumantes brut</option>
              </select>
            </label>
            <button type="submit" className="primary-button">
              Quero entrar
            </button>
            <StatusMessage status={newsletterStatus} />
          </form>
        </section>

        <section className="testimonial-section reveal">
          <div className="section-heading">
            <span className="eyebrow">Prova social</span>
            <h2>O novo site já comunica sofisticação, conversão e hospitalidade.</h2>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card floating-card" key={testimonial.name}>
                <p>“{testimonial.quote}”</p>
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="conversion-section reveal" id="reserva">
          <form className="form-card floating-card" onSubmit={handleReservationSubmit}>
            <div className="card-heading">
              <span className="eyebrow">Reserva</span>
              <h2>Agende sua degustação</h2>
            </div>

            <label>
              Nome completo
              <input type="text" name="name" placeholder="Seu nome" required />
            </label>
            <label>
              E-mail
              <input type="email" name="email" placeholder="contato@email.com" required />
            </label>
            <div className="dual-field">
              <label>
                Data
                <input type="date" name="date" required />
              </label>
              <label>
                Pessoas
                <input type="number" name="guests" min="1" max="12" defaultValue="2" required />
              </label>
            </div>
            <label>
              Observações
              <textarea name="notes" rows="4" placeholder="Aniversário, sunset, harmonização..." />
            </label>
            <button type="submit" className="primary-button">
              Confirmar reserva
            </button>
            <StatusMessage status={reservationStatus} />
          </form>

          <form className="form-card floating-card" onSubmit={handleContactSubmit}>
            <div className="card-heading">
              <span className="eyebrow">Relacionamento</span>
              <h2>Fale com a equipe</h2>
            </div>

            <label>
              Nome
              <input type="text" name="name" placeholder="Seu nome" required />
            </label>
            <label>
              E-mail
              <input type="email" name="email" placeholder="Seu melhor e-mail" required />
            </label>
            <label>
              Interesse
              <select name="interest" defaultValue="Eventos corporativos">
                <option value="Eventos corporativos">Eventos corporativos</option>
                <option value="Casamentos">Casamentos</option>
                <option value="Atacado">Atacado</option>
                <option value="Imprensa">Imprensa</option>
              </select>
            </label>
            <label>
              Mensagem
              <textarea name="message" rows="4" placeholder="Conte o que você precisa" required />
            </label>
            <button type="submit" className="secondary-button solid">
              Enviar mensagem
            </button>
            <StatusMessage status={contactStatus} />
          </form>
        </section>

        <section className="checkout-section reveal" id="pedido">
          <div className="checkout-summary floating-card">
            <div className="card-heading">
              <span className="eyebrow">Pedido</span>
              <h2>Feche sua seleção</h2>
            </div>

            <div className="cart-list">
              {cart.length ? (
                cart.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} loading="lazy" />
                    <div className="cart-item-copy">
                      <strong>{item.name}</strong>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                    <div className="cart-actions">
                      <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="ghost-link" onClick={() => removeFromCart(item.id)}>
                      Remover
                    </button>
                  </article>
                ))
              ) : (
                <p className="empty-cart">Seu carrinho está vazio. Escolha um rótulo no catálogo acima.</p>
              )}
            </div>

            <div className="order-total">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
          </div>

          <form className="checkout-form floating-card" onSubmit={handleOrderSubmit}>
            <div className="card-heading">
              <span className="eyebrow">Checkout</span>
              <h2>Pedido pronto para envio</h2>
            </div>

            <label>
              Nome
              <input type="text" name="name" placeholder="Quem vai receber" required />
            </label>
            <label>
              E-mail
              <input type="email" name="email" placeholder="Seu e-mail" required />
            </label>
            <div className="dual-field">
              <label>
                Telefone
                <input type="tel" name="phone" placeholder="(00) 00000-0000" required />
              </label>
              <label>
                Cidade
                <input type="text" name="city" placeholder="Sua cidade" required />
              </label>
            </div>
            <label>
              Observações do pedido
              <textarea name="notes" rows="4" placeholder="Entrega, presente, mensagem na caixa..." />
            </label>
            <button type="submit" className="primary-button">
              Finalizar pedido
            </button>
            <StatusMessage status={orderStatus} />
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>{content.brand?.name}</strong>
          <p>{contact.address}</p>
        </div>
        <div>
          <span>{contact.hours}</span>
          <span>{contact.phone}</span>
          <span>{contact.email}</span>
        </div>
      </footer>
    </div>
  )
}

function StatusMessage({ status }) {
  if (status.type === "idle") {
    return null
  }

  return <p className={`status-message ${status.type}`}>{status.message}</p>
}

function renderStars(value) {
  const rounded = Math.round(value)
  return "★".repeat(rounded).padEnd(5, "☆")
}

export default App
