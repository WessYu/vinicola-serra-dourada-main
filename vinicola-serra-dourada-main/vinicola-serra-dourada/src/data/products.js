import bottleTinto from "../assets/bottle-tinto.svg"
import bottleBranco from "../assets/bottle-branco.svg"
import bottleRose from "../assets/bottle-rose.svg"
import bottleEspumante from "../assets/bottle-espumante.svg"

export const PRODUCT_TYPES = ["Todos", "Tinto", "Branco", "Rosé", "Espumante"]

export const products = [
  {
    id: "tinto-reserva-2021",
    name: "Tinto Reserva",
    type: "Tinto",
    grape: "Cabernet Sauvignon",
    year: 2021,
    price: 129.9,
    badge: "Mais vendido",
    rating: 4.8,
    image: bottleTinto,
  },
  {
    id: "tinto-premium-2020",
    name: "Tinto Premium",
    type: "Tinto",
    grape: "Malbec",
    year: 2020,
    price: 159.9,
    badge: "Edição limitada",
    rating: 4.7,
    image: bottleTinto,
  },
  {
    id: "branco-seco-2023",
    name: "Branco Seco",
    type: "Branco",
    grape: "Chardonnay",
    year: 2023,
    price: 99.9,
    badge: "Novo",
    rating: 4.6,
    image: bottleBranco,
  },
  {
    id: "branco-aromatico-2022",
    name: "Branco Aromático",
    type: "Branco",
    grape: "Sauvignon Blanc",
    year: 2022,
    price: 109.9,
    badge: null,
    rating: 4.5,
    image: bottleBranco,
  },
  {
    id: "rose-2023",
    name: "Rosé",
    type: "Rosé",
    grape: "Grenache",
    year: 2023,
    price: 94.9,
    badge: "Leve & fresco",
    rating: 4.4,
    image: bottleRose,
  },
  {
    id: "espumante-brut-2022",
    name: "Espumante Brut",
    type: "Espumante",
    grape: "Chardonnay & Pinot Noir",
    year: 2022,
    price: 139.9,
    badge: "Para celebrar",
    rating: 4.7,
    image: bottleEspumante,
  },
]
