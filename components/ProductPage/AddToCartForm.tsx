"use client";

import React, { useMemo, useState } from "react";
import { Heart, Minus, Plus, Truck, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import ProjectDataInterface from "@/types/ItemDetails";
import { playMechanicalClick, playStampSound } from "@/lib/sounds";

interface ProductCardProps {
  product: ProjectDataInterface;
}

const LINE = "border-2 border-border";
const DASH = "border-2 border-dashed border-border";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const SPECIFICATIONS = [
  { label: "Paper", value: "260 GSM archival fine-art matte" },
  { label: "Ink", value: "12-colour pigment, fade-resistant" },
  { label: "Finish", value: "Non-glare textured matte" },
  { label: "Frame", value: "Matte Black" },
  { label: "Size", value: 'A2 · 16.5" × 23.4"' },
  { label: "Packaging", value: "Rigid tube / double-wall carton" },
  { label: "Origin", value: "Printed in India" },
  { label: "Dispatch", value: "Ships within 24 hours" },
];

export default function AddToCartForm({ product }: ProductCardProps) {
  const { prod_id, prod_name, prod_category, product_variants, prod_description } = product;

  const sizeOptions = useMemo(() => {
    const bySize = new Map<string, ProjectDataInterface["product_variants"][number]>();

    for (const v of product_variants) {
      const existing = bySize.get(v.prod_size);
      if (!existing || Number(v.prod_price) < Number(existing.prod_price)) {
        bySize.set(v.prod_size, v);
      }
    }

    return Array.from(bySize.values()).sort(
      (a, b) => Number(a.prod_price) - Number(b.prod_price)
    );
  }, [product_variants]);

  const [selectedVariantId, setSelectedVariantId] = useState(
    sizeOptions[0]?.variant_id
  );
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const selectedVariant = sizeOptions.find(
    (v) => v.variant_id === selectedVariantId
  );

  const basePrice = sizeOptions[0] ? Number(sizeOptions[0].prod_price) : 0;
  const price = selectedVariant ? Number(selectedVariant.prod_price) : 0;
  const comparePrice = selectedVariant
    ? Number(selectedVariant.compare_at_price)
    : 0;
  const hasDiscount = comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isAddingToCart) return;

    // 1. Play tactile mechanical click on press
    playMechanicalClick();

    setIsAddingToCart(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prod_id,
          variant_id: selectedVariant.variant_id,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.add({
          type: "warning",
          title: "Please Sign in",
          description: "You need to be signed in to add items to your cart.",
        });
        return;
      }

      // 2. Play archival rubber stamp thump when confirmed
      playStampSound();
      toast.add({
        type: "success",
        title: "Item added to cart",
        description: `${prod_name} · ${selectedVariant.prod_size} · Qty ${quantity}`,
      });
    } catch {
      toast.add({
        type: "error",
        title: "Something went wrong",
        description: "Please try again.",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const specRows = SPECIFICATIONS.reduce<(typeof SPECIFICATIONS)[]>((rows, item, i) => {
    if (i % 2 === 0) rows.push([item]);
    else rows[rows.length - 1].push(item);
    return rows;
  }, []);

  return (
    <div className="flex w-full flex-col gap-7 text-foreground">
      {/* Title + category */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {prod_category}
        </span>
        <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          {prod_name}
        </h1>
      </div>

      {/* HOT SPOT 1: price + tilted discount tag */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-5xl font-black leading-none sm:text-6xl">
            ₹{price.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xl line-through text-muted-foreground">
                ₹{comparePrice.toLocaleString("en-IN")}
              </span>
              <span
                className={`${LINE} -rotate-3 bg-secondary text-secondary-foreground px-3 py-0.5 text-sm font-extrabold shadow-[3px_3px_0_0_var(--border)]`}
              >
                {discountPercent}% off
              </span>
            </>
          )}
        </div>
        <span className="text-sm text-muted-foreground">Inclusive of all taxes</span>
      </div>

      {prod_description && <p className="max-w-prose text-base opacity-90">{prod_description}</p>}

      {/* Size: flat, selected state fills with primary ink */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-extrabold uppercase tracking-widest">Size</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sizeOptions.map((variant) => {
            const isSelected = variant.variant_id === selectedVariantId;
            const extra = Number(variant.prod_price) - basePrice;

            return (
              <button
                key={variant.variant_id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedVariantId(variant.variant_id)}
                disabled={variant.is_in_stock === "false"}
                className={`${LINE} ${FOCUS} flex cursor-pointer flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground hover:bg-muted"
                }`}
              >
                <span className="text-base font-extrabold">{variant.prod_size}</span>
                <span className="text-xs opacity-75">
                  {extra === 0 ? "Included" : `+ ₹${extra.toLocaleString("en-IN")}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity / HOT SPOT 2: Add to cart / Wishlist */}
      <div className="flex items-stretch gap-3">
        <div className={`${LINE} flex items-stretch bg-card`}>
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            className={`${FOCUS} flex w-10 cursor-pointer items-center justify-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent`}
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <span className="flex w-10 items-center justify-center border-x-2 border-border text-sm font-extrabold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            aria-label="Increase quantity"
            className={`${FOCUS} flex w-10 cursor-pointer items-center justify-center hover:bg-muted`}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Primary CTA using --accent (Terracotta) */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant || isAddingToCart}
          className={`${LINE} ${FOCUS} flex flex-1 cursor-pointer items-center justify-center gap-2 bg-accent text-accent-foreground py-3.5 text-base font-black uppercase shadow-[4px_4px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--border)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--border)] sm:py-4`}
        >
          {isAddingToCart ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            `Add to cart · ₹${(price * quantity).toLocaleString("en-IN")}`
          )}
        </button>

        {/* Wishlist button */}
        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          onClick={() => setWishlisted((w) => !w)}
          className={`${LINE} ${FOCUS} flex w-12 flex-shrink-0 cursor-pointer items-center justify-center bg-card transition-colors hover:bg-muted`}
        >
          <Heart
            size={20}
            strokeWidth={2.5}
            className="text-foreground"
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Perks: dashed "ticket" strip */}
      <div className={`${DASH} flex flex-wrap items-center gap-x-8 gap-y-3 bg-card px-5 py-4`}>
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <Truck size={18} strokeWidth={2.5} />
          <span>Free delivery above ₹999</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <ShieldCheck size={18} strokeWidth={2.5} />
          <span>7-day easy returns</span>
        </div>
      </div>

      {/* Specifications: printed spec-sheet with dashed row dividers */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-widest">Specifications</h2>

        <dl className={`${LINE} bg-card`}>
          {specRows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 gap-x-8 gap-y-3 px-4 py-3 sm:grid-cols-2 ${
                i > 0 ? "border-t-2 border-dashed border-border/40" : ""
              }`}
            >
              {row.map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <dt className="flex-shrink-0 text-sm text-muted-foreground">{item.label}</dt>
                  <dd className="text-right text-sm font-bold">{item.value}</dd>
                </div>
              ))}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
