import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { adminAuth } from "./lib/firebase-admin";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  syncWishlist,
  upsertUser,
} from "./db/wishlist";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

async function handleWishlistApi(request: Request, url: URL): Promise<Response> {
  const jsonHeader = { "content-type": "application/json" };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization",
      },
    });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
      status: 401,
      headers: jsonHeader,
    });
  }

  const token = authHeader.slice(7).trim();
  let decodedUser: { uid: string; email?: string; name?: string };
  try {
    decodedUser = await adminAuth.verifyIdToken(token);
  } catch (err) {
    console.error("Token verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid authentication token" }), {
      status: 401,
      headers: jsonHeader,
    });
  }

  const userUid = decodedUser.uid;
  const userEmail = decodedUser.email || `${userUid}@user.local`;
  const displayName = decodedUser.name || undefined;

  try {
    await upsertUser(userUid, userEmail, displayName);

    if (url.pathname === "/api/wishlist" && request.method === "GET") {
      const wishlist = await getWishlist(userUid);
      return new Response(JSON.stringify({ wishlist }), {
        status: 200,
        headers: jsonHeader,
      });
    }

    if (url.pathname === "/api/wishlist/sync" && request.method === "POST") {
      let body: { productIds?: unknown } = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const rawProductIds = Array.isArray(body.productIds) ? body.productIds : [];
      const productIds = rawProductIds.filter(
        (id): id is string => typeof id === "string" && !!id.trim(),
      );

      const synced = await syncWishlist(userUid, productIds);
      return new Response(
        JSON.stringify({
          wishlist: synced,
          user: { uid: userUid, email: userEmail, displayName },
        }),
        {
          status: 200,
          headers: jsonHeader,
        },
      );
    }

    if (url.pathname === "/api/wishlist/toggle" && request.method === "POST") {
      let body: { productId?: unknown } = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const productId = typeof body.productId === "string" ? body.productId.trim() : "";
      if (!productId) {
        return new Response(JSON.stringify({ error: "Missing productId" }), {
          status: 400,
          headers: jsonHeader,
        });
      }

      const current = await getWishlist(userUid);
      const exists = current.includes(productId);
      if (exists) {
        await removeFromWishlist(userUid, productId);
      } else {
        await addToWishlist(userUid, productId);
      }
      const updated = await getWishlist(userUid);
      return new Response(
        JSON.stringify({
          wishlist: updated,
          inWishlist: !exists,
        }),
        {
          status: 200,
          headers: jsonHeader,
        },
      );
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: jsonHeader,
    });
  } catch (err) {
    console.error("Wishlist API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error processing wishlist" }), {
      status: 500,
      headers: jsonHeader,
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/wishlist")) {
        return await handleWishlistApi(request, url);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
