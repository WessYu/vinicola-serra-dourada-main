import { createServer } from "node:http"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, "data")
const port = Number(process.env.PORT || 4174)

const fileMap = {
  content: "content.json",
  products: "products.json",
  experiences: "experiences.json",
  testimonials: "testimonials.json",
  contacts: "contacts.json",
  newsletter: "newsletter.json",
  reservations: "reservations.json",
  orders: "orders.json",
}

const emptyCollections = {
  contacts: [],
  newsletter: [],
  reservations: [],
  orders: [],
}

await ensureDataFiles()

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`)

    if (request.method === "OPTIONS") {
      return sendJson(response, 204, {})
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, { ok: true, service: "vinicola-serra-dourada-api" })
    }

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      const [content, products, experiences, testimonials] = await Promise.all([
        readJson("content", {}),
        readJson("products", []),
        readJson("experiences", []),
        readJson("testimonials", []),
      ])

      return sendJson(response, 200, { content, products, experiences, testimonials })
    }

    if (request.method === "GET" && url.pathname === "/api/products") {
      return sendJson(response, 200, { products: await readJson("products", []) })
    }

    if (request.method === "GET" && url.pathname === "/api/reservations") {
      return sendJson(response, 200, { reservations: await readJson("reservations", []) })
    }

    if (request.method === "GET" && url.pathname === "/api/contacts") {
      return sendJson(response, 200, { contacts: await readJson("contacts", []) })
    }

    if (request.method === "GET" && url.pathname === "/api/newsletter") {
      return sendJson(response, 200, { newsletter: await readJson("newsletter", []) })
    }

    if (request.method === "GET" && url.pathname === "/api/orders") {
      return sendJson(response, 200, { orders: await readJson("orders", []) })
    }

    if (request.method === "POST" && url.pathname === "/api/reservations") {
      const body = await parseBody(request)
      assertText(body.name, "Informe o nome da reserva.")
      assertEmail(body.email)
      assertText(body.date, "Escolha uma data para a degustação.")

      const guests = Number(body.guests)
      if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
        throw httpError(400, "A reserva aceita entre 1 e 12 convidados.")
      }

      const record = {
        id: crypto.randomUUID(),
        code: `RSV-${Date.now().toString().slice(-6)}`,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        date: body.date,
        guests,
        notes: String(body.notes || "").trim(),
        createdAt: new Date().toISOString(),
      }

      await appendRecord("reservations", record)
      return sendJson(response, 201, { message: "Reserva criada com sucesso.", record })
    }

    if (request.method === "POST" && url.pathname === "/api/contacts") {
      const body = await parseBody(request)
      assertText(body.name, "Informe o nome para contato.")
      assertEmail(body.email)
      assertText(body.interest, "Selecione o assunto do contato.")
      assertText(body.message, "Descreva sua necessidade.")

      const record = {
        id: crypto.randomUUID(),
        code: `MSG-${Date.now().toString().slice(-6)}`,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        interest: body.interest.trim(),
        message: body.message.trim(),
        createdAt: new Date().toISOString(),
      }

      await appendRecord("contacts", record)
      return sendJson(response, 201, { message: "Mensagem recebida.", record })
    }

    if (request.method === "POST" && url.pathname === "/api/newsletter") {
      const body = await parseBody(request)
      assertEmail(body.email)
      assertText(body.preference, "Informe seu estilo favorito.")

      const record = {
        id: crypto.randomUUID(),
        email: body.email.trim().toLowerCase(),
        preference: body.preference.trim(),
        createdAt: new Date().toISOString(),
      }

      await appendRecord("newsletter", record)
      return sendJson(response, 201, { message: "Cadastro confirmado.", record })
    }

    if (request.method === "POST" && url.pathname === "/api/orders") {
      const body = await parseBody(request)
      const customer = body.customer || {}
      assertText(customer.name, "Informe o nome de quem vai receber.")
      assertEmail(customer.email)
      assertText(customer.phone, "Informe o telefone de contato.")
      assertText(customer.city, "Informe a cidade da entrega.")

      if (!Array.isArray(body.items) || body.items.length === 0) {
        throw httpError(400, "Seu pedido precisa ter ao menos um item.")
      }

      const products = await readJson("products", [])
      const catalog = new Map(products.map((product) => [product.id, product]))

      const normalizedItems = body.items.map((item) => {
        const product = catalog.get(item.productId)
        const quantity = Number(item.quantity)

        if (!product) {
          throw httpError(400, `Item inválido no pedido: ${item.productId}.`)
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 24) {
          throw httpError(400, `Quantidade inválida para ${product.name}.`)
        }

        return {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity,
          lineTotal: Number((product.price * quantity).toFixed(2)),
        }
      })

      const total = Number(
        normalizedItems.reduce((runningTotal, item) => runningTotal + item.lineTotal, 0).toFixed(2)
      )

      const record = {
        id: crypto.randomUUID(),
        code: `PED-${Date.now().toString().slice(-6)}`,
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim().toLowerCase(),
          phone: customer.phone.trim(),
          city: customer.city.trim(),
        },
        notes: String(body.notes || "").trim(),
        items: normalizedItems,
        total,
        createdAt: new Date().toISOString(),
      }

      await appendRecord("orders", record)
      return sendJson(response, 201, { message: "Pedido criado com sucesso.", record })
    }

    return sendJson(response, 404, { message: "Rota não encontrada." })
  } catch (error) {
    const status = error.statusCode || 500
    const message = error.statusCode ? error.message : "Erro interno do servidor."
    return sendJson(response, status, { message })
  }
})

server.listen(port, () => {
  console.log(`Vinicola Serra Dourada API rodando em http://localhost:${port}`)
})

async function ensureDataFiles() {
  await mkdir(dataDirectory, { recursive: true })

  for (const [key, filename] of Object.entries(fileMap)) {
    const filePath = path.join(dataDirectory, filename)
    try {
      await readFile(filePath, "utf8")
    } catch {
      const fallback = key in emptyCollections ? emptyCollections[key] : {}
      await writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8")
    }
  }
}

async function readJson(key, fallback) {
  try {
    const filePath = path.join(dataDirectory, fileMap[key])
    const raw = await readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(key, value) {
  const filePath = path.join(dataDirectory, fileMap[key])
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8")
}

async function appendRecord(key, record) {
  const collection = await readJson(key, [])
  collection.unshift(record)
  await writeJson(key, collection)
}

async function parseBody(request) {
  return await new Promise((resolve, reject) => {
    let rawBody = ""

    request.on("data", (chunk) => {
      rawBody += chunk
      if (rawBody.length > 1_000_000) {
        reject(httpError(413, "Payload muito grande."))
      }
    })

    request.on("end", () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {})
      } catch {
        reject(httpError(400, "JSON inválido."))
      }
    })

    request.on("error", () => {
      reject(httpError(500, "Falha ao ler a requisição."))
    })
  })
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  })
  response.end(JSON.stringify(payload))
}

function assertText(value, message) {
  if (!String(value || "").trim()) {
    throw httpError(400, message)
  }
}

function assertEmail(value) {
  const normalized = String(value || "").trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw httpError(400, "Informe um e-mail válido.")
  }
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
