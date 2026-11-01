/**
 * Local demo data layer. Each collection lives in its own localStorage key
 * behind a tiny repository API, so it can later be swapped for a real
 * database without touching the UI.
 */
import { useSyncExternalStore } from "react";
import {
  categories as seedCategories,
  products as seedProducts,
  type Category,
  type Product,
} from "./products";
import {
  DEFAULT_SETTINGS,
  stockDeltaForStatusChange,
  type CartLine,
  type Order,
  type OrderStatus,
  type PaymentStatus,
  type StoreSettings,
} from "./commerce";

const PREFIX = "tvs:";

function createCollection<T>(key: string, seed: () => T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();
  const serverSnap = seed();

  const read = (): T => {
    if (cache !== undefined) return cache;
    if (typeof window === "undefined") return serverSnap;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      cache = raw ? (JSON.parse(raw) as T) : seed();
    } catch {
      cache = seed();
    }
    return cache;
  };

  const write = (next: T) => {
    cache = next;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(next));
    } catch {
      // storage full (e.g. many uploaded images) — keep in memory for this session
      console.warn(`Could not save ${key} to this device`);
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFIX + key) {
        cache = undefined;
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };

  return {
    get: read,
    set: (fn: (prev: T) => T) => write(fn(read())),
    reset: () => write(seed()),
    use: () => useSyncExternalStore(subscribe, read, () => serverSnap),
  };
}

export const productsDb = createCollection<Product[]>("products", () => seedProducts);
export const categoriesDb = createCollection<Category[]>("categories", () => seedCategories);
export const ordersDb = createCollection<Order[]>("orders", () => []);
export const settingsDb = createCollection<StoreSettings>("settings", () => DEFAULT_SETTINGS);
export const cartDb = createCollection<CartLine[]>("cart", () => []);
export const wishlistDb = createCollection<string[]>("wishlist", () => []);
export const recentDb = createCollection<string[]>("recent", () => []);
export const customerDb = createCollection<{ name: string; mobile: string; email: string } | null>(
  "customer",
  () => null,
);

export const useProducts = productsDb.use;
export const useCategories = categoriesDb.use;
export const useOrders = ordersDb.use;
export const useSettings = settingsDb.use;

export const findProduct = (list: Product[], id: string) => list.find((p) => p.id === id);

/* ---- order operations ---- */

export function placeOrder(order: Order) {
  productsDb.set((ps) =>
    ps.map((p) => {
      const q = order.items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
      return q ? { ...p, stock: Math.max(0, p.stock - q) } : p;
    }),
  );
  ordersDb.set((os) => [order, ...os]);
  customerDb.set(() => order.customer);
}

export function updateOrderStatus(id: string, to: OrderStatus) {
  const order = ordersDb.get().find((o) => o.id === id);
  if (!order || order.status === to) return;
  const dir = stockDeltaForStatusChange(order.status, to);
  if (dir !== 0) {
    productsDb.set((ps) =>
      ps.map((p) => {
        const q = order.items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
        return q ? { ...p, stock: Math.max(0, p.stock + dir * q) } : p;
      }),
    );
  }
  ordersDb.set((os) =>
    os.map((o) => {
      if (o.id !== id) return o;
      const updated: Order = { ...o, status: to };
      if (to === "Cancelled" && o.paymentStatus === "pending_collection") {
        updated.paymentStatus = "cancelled";
      }
      return updated;
    }),
  );
}

export function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  collectedAt?: string,
) {
  ordersDb.set((os) =>
    os.map((o) => {
      if (o.id !== id) return o;
      return {
        ...o,
        paymentStatus,
        collectedAt:
          paymentStatus === "collected" ? (collectedAt ?? new Date().toISOString()) : undefined,
      };
    }),
  );
}

/* ---- demo admin session (device-only, NOT production security) ---- */

const ADMIN_HASH = PREFIX + "admin-passcode-hash";
const ADMIN_SESSION = "tvs:admin-session";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const adminAuth = {
  hasPasscode: () => typeof window !== "undefined" && !!localStorage.getItem(ADMIN_HASH),
  isSignedIn: () => typeof window !== "undefined" && sessionStorage.getItem(ADMIN_SESSION) === "1",
  async create(passcode: string) {
    localStorage.setItem(ADMIN_HASH, await sha256(passcode));
    sessionStorage.setItem(ADMIN_SESSION, "1");
  },
  async signIn(passcode: string) {
    const ok = (await sha256(passcode)) === localStorage.getItem(ADMIN_HASH);
    if (ok) sessionStorage.setItem(ADMIN_SESSION, "1");
    return ok;
  },
  signOut: () => sessionStorage.removeItem(ADMIN_SESSION),
  resetPasscode: () => {
    localStorage.removeItem(ADMIN_HASH);
    sessionStorage.removeItem(ADMIN_SESSION);
  },
};
