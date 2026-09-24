"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CategoryInterface } from "@/types/categoryDetails";

export default function CategoriesFilter() {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [loading, setLoading] = useState(true);

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
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getSlug = (c: any): string =>
    (c.slug ?? c.category_slug ?? c.category_name ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Categories
      </span>

      {/* wrap, not stack */}
      <div className="flex w-full flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold transition-all ${
            !currentCategory
              ? "bg-black text-white"
              : "border border-neutral-200 bg-white text-neutral-700 hover:border-black"
          }`}
        >
          All posters
        </button>

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-neutral-200/70"
            />
          ))}

        {!loading &&
          categories.map((c: any, idx) => {
            const slug = getSlug(c);
            const isActive =
              !!currentCategory && currentCategory.toLowerCase() === slug;

            return (
              <button
                key={c.id ?? slug ?? idx}
                type="button"
                onClick={() => handleSelect(slug)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-black text-white"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:border-black"
                }`}
              >
                {c.category_name}
              </button>
            );
          })}
      </div>
    </div>
  );
}