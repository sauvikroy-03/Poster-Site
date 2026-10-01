"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CategoryInterface } from "@/types/categoryDetails";

export default function CategoriesFilter() {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [loading, setLoading] = useState(true);

  // Transition state to track router updates
  const [isPending, startTransition] = useTransition();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/category");
        if (response.ok) {
          setCategories(await response.json());
        } else {
          console.error("Failed to fetch categories:", response.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSelect = (slug: string | null) => {
    // Prevent duplicate triggers if already selected or currently pending
    const isCurrentlyActive = !slug
      ? !currentCategory
      : currentCategory?.toLowerCase() === slug;
    if (isCurrentlyActive || isPending) return;

    setPendingSlug(slug);

    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const getSlug = (c: CategoryInterface): string =>
    (c.slug ?? c.category_name ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

  const isAllLoading = isPending && pendingSlug === null;

  return (
    <div className="flex w-full flex-col items-start gap-3">
      {/* Category Eyebrow Badge */}
      {/* <div className="inline-flex items-center gap-1.5 border-2 border-border bg-card px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
        <span>✦</span>
        <span>Categories</span>
      </div> */}

      {/* Button Wrap Grid */}
      <div className="flex w-full flex-wrap items-center gap-2.5">
        {/* "All posters" Button */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          disabled={isPending}
          className={`flex cursor-pointer items-center gap-2 border-2 border-border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            !currentCategory
              ? "bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--border)]"
              : "bg-card text-foreground shadow-[3px_3px_0_0_var(--border)] hover:-translate-y-0.5 hover:bg-muted active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          }`}
        >
          {isAllLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
          )}
          <span>All Posters</span>
        </button>

        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[38px] w-24 animate-pulse border-2 border-border/40 bg-muted/60"
            />
          ))}

        {/* Dynamic Category Chips */}
        {!loading &&
          categories.map((c, idx) => {
            const slug = getSlug(c);
            const isActive =
              !!currentCategory && currentCategory.toLowerCase() === slug;
            const isButtonLoading = isPending && pendingSlug === slug;

            return (
              <button
                key={c.id ?? slug ?? idx}
                type="button"
                onClick={() => handleSelect(slug)}
                disabled={isPending}
                className={`flex cursor-pointer items-center gap-2 border-2 border-border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--border)]"
                    : "bg-card text-foreground shadow-[3px_3px_0_0_var(--border)] hover:-translate-y-0.5 hover:bg-muted active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                }`}
              >
                {isButtonLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                )}
                <span>{c.category_name}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}