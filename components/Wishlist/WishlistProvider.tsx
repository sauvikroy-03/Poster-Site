"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import AuthModal from "@/components/AuthModal";

interface WishlistContextValue {
  wishlistedIds: Set<string>;
  isWishlisted: (prodId: string) => boolean;
  toggleWishlist: (prodId: string) => Promise<void>;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingProdId, setPendingProdId] = useState<string | null>(null);

  const loadIds = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist?idsOnly=true", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.ids)) {
        setWishlistedIds(new Set(data.ids));
      }
    } catch (err) {
      console.error("❌ Failed to load wishlist:", err);
    }
  }, []);

  useEffect(() => {
    loadIds();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadIds();
      } else {
        setWishlistedIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, [loadIds]);

  const isWishlisted = useCallback(
    (prodId: string) => wishlistedIds.has(prodId),
    [wishlistedIds]
  );

  const toggleWishlist = useCallback(
    async (prodId: string) => {
      const wasLiked = wishlistedIds.has(prodId);

      // Optimistic UI update
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(prodId);
        else next.add(prodId);
        return next;
      });

      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prod_id: prodId }),
        });

        if (res.status === 401) {
          // Revert optimistic state and open sign-in modal
          setWishlistedIds((prev) => {
            const next = new Set(prev);
            if (wasLiked) next.add(prodId);
            else next.delete(prodId);
            return next;
          });
          setPendingProdId(prodId);
          setAuthOpen(true);
          return;
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Wishlist update failed.");
        }
      } catch (err) {
        console.error("❌ Wishlist toggle error:", err);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(prodId);
          else next.delete(prodId);
          return next;
        });
      }
    },
    [wishlistedIds]
  );

  const handleAuthSuccess = async () => {
    if (pendingProdId) {
      const idToSave = pendingProdId;
      setPendingProdId(null);
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prod_id: idToSave }),
      });
    }
    await loadIds();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistedIds,
        isWishlisted,
        toggleWishlist,
        count: wishlistedIds.size,
      }}
    >
      {children}
      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingProdId(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      wishlistedIds: new Set<string>(),
      isWishlisted: () => false,
      toggleWishlist: async () => {},
      count: 0,
    };
  }
  return ctx;
}