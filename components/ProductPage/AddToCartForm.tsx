"use client";

import React, { useMemo, useState } from "react";
import { Heart, Minus, Plus, Truck, ShieldCheck } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";

interface ProductCardProps {
  product: ProjectDataInterface;
}

const SPECIFICATIONS = [
  { label: "Paper", value: "260 GSM archival fine-art matte" },
  { label: "Ink", value: "12-colour pigment, fade-resistant" },
  { label: "Finish", value: "Non-glare textured matte" },
  { label: "Frame", value: "Matte Black" },
  { label: "Size", value: "A2 · 16.5\" × 23.4\"" },
  { label: "Packaging", value: "Rigid tube / double-wall carton" },
  { label: "Origin", value: "Printed in India" },
  { label: "Dispatch", value: "Ships within 24 hours" },
];

export default function AddToCartForm({ product }: ProductCardProps) {
  const { prod_id, prod_name, prod_category, product_variants, prod_description } = product;

  // One representative variant per unique size — cheapest material for that size,
  // since Frame/material selection is intentionally omitted from this UI.
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

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const payload = {
      prod_id,
      variant_id: selectedVariant.variant_id,
      prod_size: selectedVariant.prod_size,
      prod_material: selectedVariant.prod_material,
      sku: selectedVariant.sku,
      unit_price: price,
      quantity,
      line_total: price * quantity,
    };

    // TODO: wire this into your actual cart mutation (context/store/API call)
    console.log("Add to cart:", payload);
  };

  // Pair specs two-at-a-time so each row renders as a 2-column grid,
  // matching the reference layout (odd-length lists leave the last cell empty).
  const specRows = SPECIFICATIONS.reduce<typeof SPECIFICATIONS[]>((rows, item, i) => {
    if (i % 2 === 0) rows.push([item]);
    else rows[rows.length - 1].push(item);
    return rows;
  }, []);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Title */}
      <h1 className="text-4xl font-extrabold uppercase leading-none tracking-tight text-black sm:text-5xl">
        {prod_name}
      </h1>

      {/* Rating row — omitted: no rating/review fields on ProjectDataInterface yet */}
      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold uppercase tracking-wide text-neutral-500">
          {prod_category}
        </span>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-black sm:text-4xl">
            ₹{price.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg text-neutral-400 line-through">
                ₹{comparePrice.toLocaleString("en-IN")}
              </span>
              <span className="text-sm font-bold text-red-600">
                {discountPercent}% off
              </span>
            </>
          )}
        </div>
        <span className="text-xs text-neutral-500">Inclusive of all taxes</span>
      </div>

      {/* Description */}
      <div className="flex items-center gap-3 text-sm">
        <span className="tracking-wide text-neutral-500">{prod_description}</span>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          Size
        </span>
        <div className="grid grid-cols-2 gap-3">
          {sizeOptions.map((variant) => {
            const isSelected = variant.variant_id === selectedVariantId;
            const extra = Number(variant.prod_price) - basePrice;

            return (
              <button
                key={variant.variant_id}
                type="button"
                onClick={() => setSelectedVariantId(variant.variant_id)}
                disabled={variant.is_in_stock === "false"}
                className={`flex flex-col items-start gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? "border-black bg-neutral-100"
                    : "border-neutral-300 bg-white hover:border-black"
                }`}
              >
                <span className="text-sm font-bold text-black">
                  {variant.prod_size}
                </span>
                <span className="text-xs text-neutral-500">
                  {extra === 0 ? "Included" : `+ ₹${extra.toLocaleString("en-IN")}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity + Add to Cart + Wishlist */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-4 rounded-full border border-neutral-300 px-4 py-3">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            aria-label="Decrease quantity"
            className="text-black disabled:opacity-30"
            disabled={quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="w-4 text-center text-sm font-bold">{quantity}</span>
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            aria-label="Increase quantity"
            className="text-black"
          >
            <Plus size={16} />
          </button>
        </div>

<button
  type="button"
  onClick={handleAddToCart}
  disabled={!selectedVariant}
  className="flex-1 cursor-pointer rounded-full bg-black py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:scale-y-110 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-y-100"
>
  Add to Cart · ₹{(price * quantity).toLocaleString("en-IN")}
</button>

        <button
          type="button"
          aria-label="Add to wishlist"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-neutral-300 transition-colors hover:border-black"
        >
          <Heart size={18} className="text-black" />
        </button>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-neutral-100 px-6 py-5">
        <div className="flex items-center gap-2 text-sm text-neutral-800">
          <Truck size={18} className="text-red-500" />
          <span>Free delivery above ₹999</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-800">
          <ShieldCheck size={18} className="text-red-500" />
          <span>7-day easy returns</span>
        </div>
      </div>

      {/* Specifications */}
      <div className="flex flex-col gap-6 border-t border-neutral-200 pt-6">
        <h2 className="text-2xl font-extrabold text-black">Specifications</h2>

        <dl className="flex flex-col">
          {specRows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-4 border-b border-neutral-200 py-4"
            >
              {row.map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <dt className="flex-shrink-0 text-sm text-neutral-500">
                    {item.label}
                  </dt>
                  <dd className="text-right text-sm font-semibold text-black">
                    {item.value}
                  </dd>
                </div>
              ))}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}