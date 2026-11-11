"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import StarPicker from "@/components/Reviews/StarPicker";
import Stars from "@/components/Utility/Stars";

const LINE = "border-2 border-border";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const MAX_PHOTOS = 3;
const MAX_NOTE = 2000;

interface ReviewItem {
  order_item_id: string;
  product_id: string;
  prod_name: string;
  prod_image: string | null;
  prod_size: string | null;
  rating: number | null;
}

interface StoreReview {
  rating: number;
  note: string | null;
  images: string[];
}

interface ReviewData {
  orderNumber: string;
  storeReview: StoreReview | null;
  items: ReviewItem[];
}

// Shrinks phone photos before upload (keeps requests small). Falls back to the original file.
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.8)
    );
    if (!blob) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export default function ReviewForm({ orderId }: { orderId: string }) {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [storeRating, setStoreRating] = useState(0);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?orderId=${encodeURIComponent(orderId)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || "Failed to load your order.");
        return;
      }
      setData(json as ReviewData);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Free object URLs on unmount
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (picked.length > room) {
      toast.add({
        type: "warning",
        title: "Photo limit",
        description: `You can add up to ${MAX_PHOTOS} photos.`,
      });
    }

    const valid = picked.filter((f) => f.type.startsWith("image/")).slice(0, room);
    const compressed = await Promise.all(valid.map(compressImage));
    setPhotos((prev) => [
      ...prev,
      ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitStore = async () => {
    if (storeRating === 0 || isSubmitting || savingItemId !== null) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("rating", String(storeRating));
      formData.append("note", note.trim());
      photos.forEach((p) => formData.append("files", p.file));

      const res = await fetch("/api/reviews/store", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.add({
          type: "error",
          title: "Couldn't submit review",
          description: json.message || "Please try again.",
        });
        // Already reviewed elsewhere: sync the page to the saved state
        if (res.status === 409) await load();
        return;
      }

      toast.add({ type: "success", title: "Thanks for your review!", description: "" });
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      await load();
    } catch {
      toast.add({
        type: "error",
        title: "Something went wrong",
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRateProduct = async (item: ReviewItem, rating: number) => {
    // Locked once the order review is submitted (the server enforces this too)
    if (savingItemId || data?.storeReview) return;
    const previous = item.rating;

    // Optimistic update
    setSavingItemId(item.order_item_id);
    setData((d) =>
      d
        ? {
            ...d,
            items: d.items.map((i) =>
              i.order_item_id === item.order_item_id ? { ...i, rating } : i
            ),
          }
        : d
    );

    try {
      const res = await fetch("/api/reviews/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId: item.order_item_id, rating }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        // Locked on the server (e.g. review submitted in another tab): resync the page
        if (res.status === 403) await load();
        throw new Error(json.message || "Failed to save rating.");
      }
    } catch (err) {
      // Roll back
      setData((d) =>
        d
          ? {
              ...d,
              items: d.items.map((i) =>
                i.order_item_id === item.order_item_id ? { ...i, rating: previous } : i
              ),
            }
          : d
      );
      toast.add({
        type: "error",
        title: "Couldn't save rating",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSavingItemId(null);
    }
  };

  // ---------- States ----------
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div
        className={`${LINE} flex h-64 flex-col items-center justify-center gap-2 border-dashed bg-card p-8 text-center`}
      >
        <p className="text-sm font-black uppercase text-foreground">
          {errorMsg || "Something went wrong."}
        </p>
      </div>
    );
  }

  const { storeReview, items, orderNumber } = data;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Order {orderNumber}
        </span>
        <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          Rate your order
        </h1>
      </div>

      {/* Step 1: store review */}
      <section
        className={`${LINE} flex flex-col gap-5 bg-card p-5 shadow-[4px_4px_0_0_var(--border)] sm:p-6`}
      >
        <h2 className="text-sm font-extrabold uppercase tracking-widest">
          How was your unboxing &amp; delivery?
        </h2>

        {storeReview ? (
          <div className="flex flex-col gap-3">
            <Stars rating={storeReview.rating} size={24} />
            {storeReview.note && (
              <p className="text-sm text-muted-foreground">{storeReview.note}</p>
            )}
            {storeReview.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {storeReview.images.map((src) => (
                  <div
                    key={src}
                    className="relative h-20 w-20 overflow-hidden border-2 border-border/20 bg-muted"
                  >
                    <Image src={src} alt="Your review photo" fill className="object-cover" sizes="80px" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Review submitted. Thank you!
            </p>
          </div>
        ) : (
          <>
            <StarPicker value={storeRating} onChange={setStoreRating} label="Order rating" />

            <div className="flex flex-col gap-1.5">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
                rows={4}
                placeholder="Tell us about the print quality, packaging, delivery… (optional)"
                className={`${LINE} ${FOCUS} w-full resize-none bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground`}
              />
              <span className="self-end text-xs text-muted-foreground">
                {note.length}/{MAX_NOTE}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {photos.map((p, i) => (
                <div
                  key={p.preview}
                  className="relative h-20 w-20 overflow-hidden border-2 border-border/20 bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Remove photo"
                    className="absolute right-0.5 top-0.5 border-2 border-border bg-card p-0.5 hover:bg-muted"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${FOCUS} flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-border bg-card text-xs font-bold uppercase transition-colors hover:bg-muted`}
                >
                  <ImagePlus size={18} strokeWidth={2.5} />
                  Photo
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitStore}
              disabled={storeRating === 0 || isSubmitting || savingItemId !== null}
              className={`${LINE} ${FOCUS} flex cursor-pointer items-center justify-center gap-2 bg-accent py-3.5 text-base font-black uppercase text-accent-foreground shadow-[4px_4px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--border)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--border)]`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Submit review"}
            </button>
          </>
        )}
      </section>

      {/* Step 2: product ratings (tap-only, optional, locked after submit) */}
      {items.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-extrabold uppercase tracking-widest">
              Rate your posters
            </h2>
            <p className="text-sm text-muted-foreground">
              {storeReview
                ? "Your ratings have been submitted."
                : "Optional. Each tap saves instantly. You can change them until you submit your order review."}
            </p>
          </div>

          <div className={`${LINE} flex flex-col bg-card`}>
            {items.map((item, i) => (
              <div
                key={item.order_item_id}
                className={`flex flex-wrap items-center gap-4 p-4 ${
                  i > 0 ? "border-t-2 border-dashed border-border/40" : ""
                }`}
              >
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden border-2 border-border/20 bg-muted">
                  {item.prod_image && (
                    <Image
                      src={item.prod_image}
                      alt={item.prod_name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black uppercase text-foreground">
                    {item.prod_name}
                  </p>
                  {item.prod_size && (
                    <p className="text-xs text-muted-foreground">{item.prod_size}</p>
                  )}
                </div>

                <StarPicker
                  value={item.rating ?? 0}
                  onChange={(r) => handleRateProduct(item, r)}
                  size={22}
                  disabled={!!storeReview || savingItemId === item.order_item_id}
                  label={`Rating for ${item.prod_name}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}