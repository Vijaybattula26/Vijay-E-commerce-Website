/**
 * Cash on Delivery (COD) Payment Processing Module.
 *
 * This project strictly uses Cash on Delivery (COD) as the sole payment method.
 * Online payment gateways, merchant credentials, and payment redirects are not used.
 */

export interface CodOrderDraft {
  customer: { name: string; mobile: string; email: string; address: string };
  items: { id: string; name: string; price: number; qty: number }[];
  total: number;
}

export interface CodPaymentResult {
  ok: boolean;
  paymentMethod: "Cash on Delivery";
  paymentStatus: "pending_collection";
  reference: string;
}

/**
 * Validates and processes a Cash on Delivery order.
 * Sets payment status to pending_collection until cash is collected at delivery.
 */
export async function processCodPayment(order: CodOrderDraft): Promise<CodPaymentResult> {
  // Validate total is greater than 0
  if (order.total <= 0) {
    throw new Error("Order total must be greater than zero for Cash on Delivery.");
  }

  // Artificial short delay for natural UI feedback
  await new Promise((r) => setTimeout(r, 600));

  return {
    ok: true,
    paymentMethod: "Cash on Delivery",
    paymentStatus: "pending_collection",
    reference: `COD-${Date.now().toString(36).toUpperCase()}`,
  };
}
