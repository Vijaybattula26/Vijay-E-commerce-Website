import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { toast } from "sonner";
import { auth, googleAuthProvider } from "./firebase";
import { customerDb, wishlistDb } from "./db";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncWishlistNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncWithServer = useCallback(async (currentUser: User) => {
    try {
      setSyncing(true);
      setSyncError(null);
      const token = await currentUser.getIdToken();
      const localWishlist = wishlistDb.get();

      const res = await fetch("/api/wishlist/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: localWishlist }),
      });

      if (!res.ok) {
        throw new Error(`Sync request failed with status ${res.status}`);
      }

      const data = (await res.json()) as { wishlist: string[] };
      if (Array.isArray(data.wishlist)) {
        wishlistDb.set(() => data.wishlist);
        setLastSyncedAt(new Date());
      }

      // Update saved customer profile if not set yet
      const currentCustomer = customerDb.get();
      if (!currentCustomer && (currentUser.displayName || currentUser.email)) {
        customerDb.set(() => ({
          name: currentUser.displayName || "",
          mobile: "",
          email: currentUser.email || "",
        }));
      }
    } catch (err) {
      console.error("Failed to sync wishlist with cloud:", err);
      setSyncError("Could not sync wishlist to cloud database");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        await syncWithServer(nextUser);
      }
    });

    return () => unsubscribe();
  }, [syncWithServer]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const cred = await signInWithPopup(auth, googleAuthProvider);
      toast.success("Signed in successfully", {
        description: `Welcome, ${cred.user.displayName || cred.user.email}! Wishlist synced.`,
      });
      await syncWithServer(cred.user);
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      const message =
        err instanceof Error ? err.message : "Unable to sign in with Google at this time.";
      toast.error("Sign-in failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setLastSyncedAt(null);
      toast.info("Signed out of your account");
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error("Failed to sign out");
    }
  };

  const syncWishlistNow = async () => {
    if (!user) {
      toast.info("Please sign in to sync your wishlist across devices");
      return;
    }
    await syncWithServer(user);
    toast.success("Wishlist synced with cloud database");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        syncing,
        lastSyncedAt,
        syncError,
        signInWithGoogle,
        signOut,
        syncWishlistNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
