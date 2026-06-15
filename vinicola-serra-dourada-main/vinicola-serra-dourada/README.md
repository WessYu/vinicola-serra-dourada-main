# Vinicola Serra Dourada

Site premium para uma vinicola com catalogo editorial, fotos reais, animacoes suaves e backend local para pedidos, reservas, contatos e clube.

## O que mudou

- Home completamente refeita com direcao visual premium
- Fotos reais de vinhos, adega e vinhedo
- Catalogo ligado ao backend local
- Carrinho persistente com checkout real
- Formularios de reserva, contato e newsletter com persistencia em JSON
- Estrutura pronta para crescer sem reescrever a interface

## Como rodar

Em um terminal:

```bash
npm install
npm run api
```

Em outro terminal:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:4174/api`

## Rotas principais

- `GET /api/bootstrap`
- `GET /api/products`
- `POST /api/orders`
- `POST /api/reservations`
- `POST /api/contacts`
- `POST /api/newsletter`

## Estrutura

- `src/App.jsx`: interface principal
- `src/styles.css`: identidade visual e animacoes
- `server/server.js`: backend local
- `server/data/*.json`: conteudo e persistencia
