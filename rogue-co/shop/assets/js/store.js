// Persistence for the cart, wishlist, orders and newsletter sign-ups.
// Everything lives in localStorage, so it survives reloads but stays on this device.
// Every read and write is wrapped in try/catch because storage can be blocked (private mode, etc.).

const KEYS = { cart: "rc.cart", wish: "rc.wish", orders: "rc.orders", promo: "rc.promo", news: "rc.news" };
const MAX_QTY = 10;
const bus = new EventTarget();

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}
function emit(what) {
  bus.dispatchEvent(new CustomEvent("change", { detail: what }));
}

let cart = load(KEYS.cart, []);
let wish = load(KEYS.wish, []);
let orders = load(KEYS.orders, []);
let promo = load(KEYS.promo, null);

export const onChange = (fn) => bus.addEventListener("change", (e) => fn(e.detail));

/* ---------- Cart ---------- */
export const getCart = () => cart;
export const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);

export function addToCart({ id, color, size, qty = 1 }) {
  const key = `${id}|${color}|${size}`;
  const line = cart.find((l) => l.key === key);
  if (line) line.qty = Math.min(line.qty + qty, MAX_QTY);
  else cart.push({ key, id, color, size, qty: Math.min(qty, MAX_QTY) });
  save(KEYS.cart, cart);
  emit("cart");
}
export function setQty(key, qty) {
  if (qty <= 0) return removeLine(key);
  const line = cart.find((l) => l.key === key);
  if (!line) return;
  line.qty = Math.min(qty, MAX_QTY);
  save(KEYS.cart, cart);
  emit("cart");
}
export function removeLine(key) {
  cart = cart.filter((l) => l.key !== key);
  save(KEYS.cart, cart);
  emit("cart");
}
export function clearCart() {
  cart = [];
  save(KEYS.cart, cart);
  emit("cart");
}

/* ---------- Promo code ---------- */
export const getPromo = () => promo;
export function setPromo(code) {
  promo = code;
  save(KEYS.promo, promo);
  emit("cart");
}

/* ---------- Wishlist ---------- */
export const getWish = () => wish;
export const isWished = (id) => wish.includes(id);
export function toggleWish(id) {
  wish = isWished(id) ? wish.filter((w) => w !== id) : [...wish, id];
  save(KEYS.wish, wish);
  emit("wish");
  return isWished(id);
}

/* ---------- Orders ---------- */
export const getOrders = () => orders;
export const getOrder = (num) => orders.find((o) => o.num === num);
export function addOrder(order) {
  orders = [order, ...orders];
  save(KEYS.orders, orders);
  emit("orders");
}

/* ---------- Newsletter ---------- */
export function subscribe(email) {
  const list = load(KEYS.news, []);
  if (!list.includes(email)) save(KEYS.news, [...list, email]);
}
