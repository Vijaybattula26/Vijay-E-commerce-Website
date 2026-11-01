import { and, eq } from "drizzle-orm";
import { db } from "./index.ts";
import { users, wishlistItems } from "./schema.ts";

export async function upsertUser(uid: string, email: string, displayName?: string) {
  try {
    const res = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
        },
      })
      .returning();
    return res[0];
  } catch (err) {
    console.error("Failed to upsert user:", err);
    throw new Error("Failed to sync user record", { cause: err });
  }
}

export async function ensureUserExists(uid: string, email?: string, displayName?: string) {
  try {
    await db
      .insert(users)
      .values({
        uid,
        email: email || `${uid}@user.local`,
        displayName: displayName ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          ...(email ? { email } : {}),
          ...(displayName ? { displayName } : {}),
        },
      });
  } catch (err) {
    console.error("Failed to ensure user exists:", err);
  }
}

export async function getWishlist(userUid: string): Promise<string[]> {
  try {
    const items = await db
      .select({ productId: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.userUid, userUid));
    return items.map((i) => i.productId);
  } catch (err) {
    console.error("Failed to get wishlist:", err);
    throw new Error("Failed to load wishlist", { cause: err });
  }
}

export async function addToWishlist(userUid: string, productId: string): Promise<void> {
  try {
    await ensureUserExists(userUid);
    await db
      .insert(wishlistItems)
      .values({
        userUid,
        productId,
      })
      .onConflictDoNothing();
  } catch (err) {
    console.error("Failed to add to wishlist:", err);
    throw new Error("Failed to add to wishlist", { cause: err });
  }
}

export async function removeFromWishlist(userUid: string, productId: string): Promise<void> {
  try {
    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userUid, userUid), eq(wishlistItems.productId, productId)));
  } catch (err) {
    console.error("Failed to remove from wishlist:", err);
    throw new Error("Failed to remove from wishlist", { cause: err });
  }
}

export async function syncWishlist(userUid: string, localIds: string[]): Promise<string[]> {
  try {
    await ensureUserExists(userUid);
    if (localIds.length > 0) {
      for (const pid of localIds) {
        if (typeof pid === "string" && pid.trim()) {
          await db
            .insert(wishlistItems)
            .values({
              userUid,
              productId: pid.trim(),
            })
            .onConflictDoNothing();
        }
      }
    }
    return await getWishlist(userUid);
  } catch (err) {
    console.error("Failed to sync wishlist:", err);
    throw new Error("Failed to sync wishlist", { cause: err });
  }
}
