"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { toast } from "@/components/ui/toast";
import type { CartItemData } from "@/components/Cart/Item";

const DEBOUNCE_MS = 200;

type CartContextValue = {
  items: CartItemData[];
  subtotal: number;
  itemCount: number;
  updateQuantity: (cartId: string, quantity: number) => void;
  removeItem: (cartId: string) => Promise<void>;
  /** Fires any pending quantity updates now and waits for them.
   *  Resolves true only if everything is saved on the server. */
  flush: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({
  initialItems,
  children,
}: {
  initialItems: CartItemData[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState(initialItems);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Per-item bookkeeping, keyed by cart_id
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const lastSynced = useRef(
    new Map(initialItems.map((i) => [i.cart_id, i.quantity]))
  );
  const requestSeq = useRef(new Map<string, number>());
  // quantities the user has set that the server doesn't know about yet
  const pending = useRef(new Map<string, number>());
  // PATCH requests currently on the wire
  const inflight = useRef(new Set<Promise<boolean>>());

  const setQty = useCallback((cartId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.cart_id === cartId ? { ...i, quantity } : i))
    );
  }, []);

  // Returns true if the server accepted the update
  const sync = useCallback(
    async (cartId: string, quantity: number): Promise<boolean> => {
      const seq = (requestSeq.current.get(cartId) ?? 0) + 1;
      requestSeq.current.set(cartId, seq);

      const rollback = () => {
        // only roll back if no newer request has been fired since
        if (requestSeq.current.get(cartId) === seq) {
          setQty(cartId, lastSynced.current.get(cartId)!);
        }
      };

      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_id: cartId, quantity }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.add({
            type: "error",
            description: data.message || "Failed to update quantity.",
          });
          rollback();
          return false;
        }

        if (requestSeq.current.get(cartId) === seq) {
          lastSynced.current.set(cartId, quantity);
        }
        return true;
      } catch {
        toast.add({
          type: "error",
          description: "Something went wrong. Please try again.",
        });
        rollback();
        return false;
      }
    },
    [setQty]
  );

  const runSync = useCallback(
    (cartId: string, quantity: number) => {
      pending.current.delete(cartId);
      const p = sync(cartId, quantity);
      inflight.current.add(p);
      p.finally(() => inflight.current.delete(p));
      return p;
    },
    [sync]
  );

  const updateQuantity = useCallback(
    (cartId: string, quantity: number) => {
      setQty(cartId, quantity); // instant UI + instant summary

      if (quantity === lastSynced.current.get(cartId)) {
        pending.current.delete(cartId);
      } else {
        pending.current.set(cartId, quantity);
      }

      const existing = timers.current.get(cartId);
      if (existing) clearTimeout(existing);

      timers.current.set(
        cartId,
        setTimeout(() => {
          timers.current.delete(cartId);
          const q = pending.current.get(cartId);
          if (q !== undefined && q !== lastSynced.current.get(cartId)) {
            runSync(cartId, q);
          }
        }, DEBOUNCE_MS)
      );
    },
    [setQty, runSync]
  );

  const flush = useCallback(async (): Promise<boolean> => {
    // cancel debounce timers and fire everything pending right now
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();

    for (const [id, q] of Array.from(pending.current)) {
      if (q !== lastSynced.current.get(id)) {
        runSync(id, q);
      } else {
        pending.current.delete(id);
      }
    }

    const results = await Promise.all(Array.from(inflight.current));
    return results.every(Boolean);
  }, [runSync]);

  const removeItem = useCallback(async (cartId: string) => {
    const timer = timers.current.get(cartId);
    if (timer) clearTimeout(timer);
    timers.current.delete(cartId);
    pending.current.delete(cartId);

    const index = itemsRef.current.findIndex((i) => i.cart_id === cartId);
    const removed = itemsRef.current[index];
    if (!removed) return;

    setItems((prev) => prev.filter((i) => i.cart_id !== cartId));

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.add({ type: "success", description: "Item removed from cart" });
    } catch (e) {
      toast.add({
        type: "error",
        description:
          e instanceof Error && e.message ? e.message : "Failed to remove item.",
      });
      // put it back where it was
      setItems((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      updateQuantity,
      removeItem,
      flush,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce(
        (sum, i) => sum + Number(i.product_variants.prod_price) * i.quantity,
        0
      ),
    }),
    [items, updateQuantity, removeItem, flush]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}