import { describe, expect, it } from "vitest";
import {
  addToCart,
  filterProducts,
  isIndianMobile,
  isIndianPin,
  lineKey,
  makeOrderId,
  setLineQty,
  stockDeltaForStatusChange,
  totals,
  validateCheckout,
} from "@/lib/commerce";
import { products } from "@/lib/products";

describe("catalogue", () => {
  it("keeps all 36 original products", () => {
    expect(products).toHaveLength(36);
    expect(new Set(products.map((p) => p.sku)).size).toBe(36);
  });
  it("search matches name, description and category", () => {
    expect(filterProducts(products, { q: "pearl" }).map((p) => p.name)).toContain(
      "Pearl Drop Earrings",
    );
    expect(filterProducts(products, { q: "watches" }).length).toBeGreaterThanOrEqual(6);
  });
  it("filters by price range and sorts low to high", () => {
    const r = filterProducts(products, { min: 1000, max: 2000, sort: "price-asc" });
    expect(r.every((p) => p.price >= 1000 && p.price <= 2000)).toBe(true);
    expect(r.map((p) => p.price)).toEqual([...r.map((p) => p.price)].sort((a, b) => a - b));
  });
  it("in-stock filter hides out-of-stock items", () => {
    expect(filterProducts(products, { inStock: true }).some((p) => p.stock === 0)).toBe(false);
  });
});

describe("cart", () => {
  const p = { stock: 5, active: true };
  it("merges identical variants instead of duplicating", () => {
    let r = addToCart([], { productId: "p1", qty: 1, size: "M" }, p);
    if (!r.ok) throw new Error();
    r = addToCart(r.cart, { productId: "p1", qty: 2, size: "M" }, p);
    expect(r.ok && r.cart).toEqual([{ productId: "p1", qty: 3, size: "M" }]);
  });
  it("keeps different sizes as separate lines", () => {
    const r = addToCart(
      [{ productId: "p1", qty: 1, size: "S" }],
      { productId: "p1", qty: 1, size: "M" },
      p,
    );
    expect(r.ok && r.cart.length).toBe(2);
  });
  it("refuses to exceed stock across variants", () => {
    const r = addToCart(
      [{ productId: "p1", qty: 4, size: "S" }],
      { productId: "p1", qty: 2, size: "M" },
      p,
    );
    expect(r.ok).toBe(false);
  });
  it("refuses out-of-stock products", () => {
    expect(addToCart([], { productId: "p1", qty: 1 }, { stock: 0, active: true }).ok).toBe(false);
  });
  it("clamps quantity to stock and removes at 0", () => {
    const c = [{ productId: "p1", qty: 1 }];
    const k = lineKey(c[0]!);
    expect(setLineQty(c, k, 9, 3)[0]!.qty).toBe(3);
    expect(setLineQty(c, k, 0, 3)).toEqual([]);
  });
});

describe("delivery and totals", () => {
  it("charges ₹99 standard delivery under ₹1,999", () => {
    expect(totals([{ price: 999, qty: 1 }])).toMatchObject({
      subtotal: 999,
      delivery: 99,
      total: 1098,
    });
  });
  it("standard delivery is free from ₹1,999", () => {
    expect(totals([{ price: 1999, qty: 1 }]).delivery).toBe(0);
  });
  it("express delivery is ₹199", () => {
    expect(totals([{ price: 2500, qty: 2 }], "express")).toMatchObject({
      subtotal: 5000,
      delivery: 199,
      total: 5199,
      items: 2,
    });
  });
  it("empty cart totals zero", () => {
    expect(totals([]).total).toBe(0);
  });
});

describe("checkout validation", () => {
  it("accepts Indian mobile numbers starting 6-9", () => {
    expect(isIndianMobile("9876543210")).toBe(true);
    expect(isIndianMobile("+91 98765 43210")).toBe(true);
    expect(isIndianMobile("5876543210")).toBe(false);
    expect(isIndianMobile("98765")).toBe(false);
  });
  it("accepts 6-digit PIN codes not starting with 0", () => {
    expect(isIndianPin("500001")).toBe(true);
    expect(isIndianPin("012345")).toBe(false);
    expect(isIndianPin("50001")).toBe(false);
  });
  it("flags every missing required field", () => {
    const e = validateCheckout({
      name: "",
      mobile: "",
      email: "",
      house: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pin: "",
    });
    expect(Object.keys(e).sort()).toEqual([
      "city",
      "email",
      "house",
      "mobile",
      "name",
      "pin",
      "state",
      "street",
    ]);
  });
});

describe("order cancellation stock", () => {
  it("returns stock on cancel and re-takes it on un-cancel", () => {
    expect(stockDeltaForStatusChange("Confirmed", "Cancelled")).toBe(1);
    expect(stockDeltaForStatusChange("Confirmed (demo)", "Cancelled")).toBe(1);
    expect(stockDeltaForStatusChange("Cancelled", "Processing")).toBe(-1);
    expect(stockDeltaForStatusChange("Processing", "Shipped")).toBe(0);
  });
});

describe("Cash on Delivery orders", () => {
  it("generates unique order ID formatted with ORD prefix", () => {
    const fixedDate = new Date("2026-11-01T10:00:00Z");
    const id = makeOrderId(fixedDate, () => 0.5);
    expect(id).toMatch(/^ORD-20261101-[A-Z0-9]{5}$/);
  });
});
