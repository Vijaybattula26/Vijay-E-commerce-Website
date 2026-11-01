/**
 * Pure commerce rules (no storage, no React) so they can be unit-tested and
 * later reused on a server.
 */
import type { CategoryId, Product } from "./products";

export interface CartLine {
  productId: string;
  qty: number;
  size?: string | undefined;
  color?: string | undefined;
}

export type DeliveryOption = "standard" | "express";

export interface StoreSettings {
  freeDeliveryThreshold: number;
  standardFee: number;
  expressFee: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  freeDeliveryThreshold: 1999,
  standardFee: 99,
  expressFee: 199,
};

export const MAX_PER_LINE = 10;

export const lineKey = (l: Pick<CartLine, "productId" | "size" | "color">) =>
  `${l.productId}|${l.size ?? ""}|${l.color ?? ""}`;

/** Total quantity of a product already in the cart across all its variants. */
export function qtyInCart(cart: CartLine[], productId: string) {
  return cart.filter((l) => l.productId === productId).reduce((s, l) => s + l.qty, 0);
}

export type AddResult = { ok: true; cart: CartLine[] } | { ok: false; reason: string };

/** Adds a line, merging identical variants and enforcing stock. */
export function addToCart(
  cart: CartLine[],
  line: CartLine,
  product: Pick<Product, "stock" | "active">,
): AddResult {
  if (!product.active || product.stock <= 0)
    return { ok: false, reason: "This item is out of stock" };
  if (line.qty < 1) return { ok: false, reason: "Choose a quantity" };
  const already = qtyInCart(cart, line.productId);
  if (already + line.qty > product.stock)
    return {
      ok: false,
      reason: `Only ${product.stock} in stock${already ? ` (${already} already in cart)` : ""}`,
    };
  const key = lineKey(line);
  const existing = cart.find((l) => lineKey(l) === key);
  if (existing) {
    if (existing.qty + line.qty > MAX_PER_LINE)
      return { ok: false, reason: `Maximum ${MAX_PER_LINE} per item` };
    return {
      ok: true,
      cart: cart.map((l) => (lineKey(l) === key ? { ...l, qty: l.qty + line.qty } : l)),
    };
  }
  return { ok: true, cart: [...cart, line] };
}

/** Sets a line's quantity, clamped to stock and the per-line maximum. 0 removes it. */
export function setLineQty(cart: CartLine[], key: string, qty: number, stock: number): CartLine[] {
  if (qty <= 0) return cart.filter((l) => lineKey(l) !== key);
  const target = cart.find((l) => lineKey(l) === key);
  if (!target) return cart;
  const others = qtyInCart(cart, target.productId) - target.qty;
  const max = Math.max(0, Math.min(MAX_PER_LINE, stock - others));
  const n = Math.min(qty, max);
  if (n <= 0) return cart.filter((l) => lineKey(l) !== key);
  return cart.map((l) => (lineKey(l) === key ? { ...l, qty: n } : l));
}

export function deliveryFee(
  subtotal: number,
  option: DeliveryOption,
  s: StoreSettings = DEFAULT_SETTINGS,
) {
  if (subtotal <= 0) return 0;
  if (option === "express") return s.expressFee;
  return subtotal >= s.freeDeliveryThreshold ? 0 : s.standardFee;
}

export function totals(
  lines: { price: number; qty: number }[],
  option: DeliveryOption = "standard",
  s: StoreSettings = DEFAULT_SETTINGS,
) {
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const items = lines.reduce((a, l) => a + l.qty, 0);
  const delivery = deliveryFee(subtotal, option, s);
  return { subtotal, delivery, discount: 0, total: subtotal + delivery, items };
}

/* ---------------- validation ---------------- */

export const isIndianMobile = (v: string) =>
  /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""));
export const isIndianPin = (v: string) => /^[1-9]\d{5}$/.test(v.trim());
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export interface CheckoutForm {
  name: string;
  mobile: string;
  email: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pin: string;
}

export function validateCheckout(f: CheckoutForm) {
  const e: Partial<Record<keyof CheckoutForm, string>> = {};
  if (f.name.trim().length < 2) e.name = "Enter your full name";
  if (!isIndianMobile(f.mobile)) e.mobile = "Enter a valid 10-digit Indian mobile number";
  if (!isEmail(f.email)) e.email = "Enter a valid email address";
  if (!f.house.trim()) e.house = "Enter house / flat number";
  if (f.street.trim().length < 3) e.street = "Enter street address";
  if (f.city.trim().length < 2) e.city = "Enter city";
  if (!f.state.trim()) e.state = "Select state";
  if (!isIndianPin(f.pin)) e.pin = "Enter a valid 6-digit PIN code";
  return e;
}

/* ---------------- catalogue filtering ---------------- */

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "name";

export interface ProductFilter {
  q?: string | undefined;
  category?: CategoryId | undefined;
  min?: number | undefined;
  max?: number | undefined;
  inStock?: boolean | undefined;
  size?: string | undefined;
  color?: string | undefined;
  sort?: SortKey | undefined;
}

export function filterProducts(
  list: Product[],
  f: ProductFilter,
  categoryName: (id: CategoryId) => string = (id) => id,
) {
  const term = (f.q ?? "").trim().toLowerCase();
  const out = list.filter(
    (p) =>
      p.active &&
      (!f.category || p.category === f.category) &&
      (f.min == null || p.price >= f.min) &&
      (f.max == null || p.price <= f.max) &&
      (!f.inStock || p.stock > 0) &&
      (!f.size || p.sizes.includes(f.size)) &&
      (!f.color || p.colors.includes(f.color)) &&
      (!term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        categoryName(p.category).toLowerCase().includes(term)),
  );
  const s = f.sort ?? "featured";
  return [...out].sort((a, b) =>
    s === "price-asc"
      ? a.price - b.price
      : s === "price-desc"
        ? b.price - a.price
        : s === "newest"
          ? b.createdAt - a.createdAt
          : s === "name"
            ? a.name.localeCompare(b.name)
            : b.popularity - a.popularity,
  );
}

/* ---------------- orders ---------------- */

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending_collection", "collected", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  size?: string | undefined;
  color?: string | undefined;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: { name: string; mobile: string; email: string };
  address: {
    house: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    pin: string;
  };
  delivery: DeliveryOption;
  payment: "Cash on Delivery";
  paymentStatus: PaymentStatus;
  collectedAt?: string | undefined;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  notes?: string | undefined;
}

export function makeOrderId(now = new Date(), rand = Math.random) {
  const d = now.toISOString().slice(0, 10).replace(/-/g, "");
  const r = Math.floor(rand() * 36 ** 5)
    .toString(36)
    .toUpperCase()
    .padStart(5, "0");
  return `ORD-${d}-${r}`;
}

/** Stock change when an order moves into / out of Cancelled. */
export function stockDeltaForStatusChange(from: string, to: string) {
  if (from !== "Cancelled" && to === "Cancelled") return 1; // give stock back
  if (from === "Cancelled" && to !== "Cancelled") return -1; // take it again
  return 0;
}

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
