"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const MOBILE_RESULT_LIMIT = 3;

interface SearchResultItem {
  prod_id: string;
  prod_name: string;
  prod_slug: string;
  prod_category: string;
  image: string;
  price: number | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [popular, setPopular] = useState<SearchResultItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
      return;
    }

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 40);
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/search?categories=true", {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) {
          setPopular(data.results ?? []);
          if (Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("❌ Failed to load initial search data:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      clearTimeout(focusTimer);
      controller.abort();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) {
          setResults(data.results ?? []);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("❌ Search query error:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

  const trimmed = query.trim();
  const displayItems = trimmed ? results : popular;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onClose();
    router.push(`/categories?q=${encodeURIComponent(trimmed)}`);
  };

  const handleCategoryClick = (category: string) => {
    onClose();
    router.push(`/categories?category=${encodeURIComponent(category)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogContent
          className={cn(
            "w-[calc(100%-1.5rem)] rounded-none border-2 border-border bg-card p-3.5 text-foreground shadow-[6px_6px_0_0_var(--border)] sm:max-h-[88dvh] sm:w-full sm:max-w-[780px] sm:overflow-y-auto sm:p-8 md:max-w-[860px]",
            "max-sm:top-3 max-sm:translate-y-0 max-sm:overflow-visible"
          )}
        >
          <DialogTitle className="sr-only">Search the collection</DialogTitle>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-6">
            {/* Header */}
            <div>
              <p className="hidden font-mono text-xs font-black uppercase tracking-[0.2em] text-muted-foreground sm:block">
                Find your next favourite
              </p>
              <h2 className="pr-8 text-lg font-black uppercase leading-none tracking-tight text-foreground sm:mt-2 sm:pr-0 sm:text-4xl">
                Search the collection
              </h2>
            </div>

            {/* Search box */}
            <form
              onSubmit={handleSubmit}
              className="flex h-10 w-full min-w-0 items-center border-2 border-border bg-background sm:h-14"
            >
              <Search
                className="ml-3 h-4 w-4 flex-shrink-0 text-foreground sm:ml-4 sm:h-5 sm:w-5"
                strokeWidth={2.5}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try anime, cinema, gaming..."
                aria-label="Search posters"
                autoComplete="off"
                enterKeyHint="search"
                style={{ boxShadow: "none", outline: "none" }}
                className="h-full min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent px-2.5 text-sm font-bold text-foreground shadow-none outline-none ring-0 placeholder:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:px-3.5 sm:text-base"
              />
              <div className="mr-2 flex h-full flex-shrink-0 items-center sm:mr-3.5">
                {loading ? (
                  <Loader2
                    className="h-4 w-4 animate-spin text-foreground sm:h-5 sm:w-5"
                    strokeWidth={2.5}
                  />
                ) : query ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted sm:h-8 sm:w-8"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
                  </button>
                ) : null}
              </div>
            </form>

            {/* Category pills */}
            {categories.length > 0 && (
              <div className={cn("min-w-0", trimmed && "max-sm:hidden")}>
                <p className="hidden font-mono text-xs font-black uppercase tracking-[0.18em] text-muted-foreground sm:block">
                  Browse a category
                </p>
                <div className="-mx-3.5 flex gap-1.5 overflow-x-auto px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-2.5 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className={cn(
                        FOCUS,
                        "flex-shrink-0 cursor-pointer whitespace-nowrap border-2 border-border bg-card px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-foreground transition-colors hover:bg-accent sm:px-4 sm:py-2 sm:text-xs"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results / Popular in the collection */}
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 border-b-2 border-border pb-1.5 sm:pb-3">
                <p className="min-w-0 truncate font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
                  {trimmed ? `Results for "${trimmed}"` : "Popular in the collection"}
                </p>
                <Link
                  href={trimmed ? `/categories?q=${encodeURIComponent(trimmed)}` : "/categories"}
                  onClick={onClose}
                  className={cn(
                    FOCUS,
                    "inline-flex flex-shrink-0 items-center gap-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-foreground transition-opacity hover:opacity-70 sm:text-xs"
                  )}
                >
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                </Link>
              </div>

              {displayItems.length > 0 ? (
                <ul className="mt-2 flex min-w-0 flex-col gap-1.5 sm:mt-3.5 sm:gap-2.5">
                  {displayItems.map((item, index) => (
                    <li
                      key={item.prod_id}
                      className={cn("min-w-0", index >= MOBILE_RESULT_LIMIT && "hidden sm:block")}
                    >
                      <Link
                        href={`/product/${item.prod_slug}`}
                        onClick={onClose}
                        className={cn(
                          FOCUS,
                          "group flex w-full min-w-0 items-center gap-2.5 border-2 border-border bg-card p-1.5 transition-colors hover:bg-muted sm:gap-4 sm:p-3"
                        )}
                      >
                        <div className="relative h-11 w-8 flex-shrink-0 overflow-hidden border-2 border-border bg-muted sm:h-16 sm:w-12">
                          <Image
                            src={item.image}
                            alt={item.prod_name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 32px, 48px"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black uppercase leading-tight text-foreground sm:text-lg">
                            {item.prod_name}
                          </p>
                          <p className="mt-1 flex min-w-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
                            <span className="truncate">{item.prod_category}</span>
                            {item.price !== null && (
                              <span className="flex-shrink-0 font-black text-foreground">
                                ₹{item.price.toLocaleString("en-IN")}
                              </span>
                            )}
                          </p>
                        </div>

                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center border-2 border-border bg-background text-foreground transition-colors group-hover:bg-accent sm:h-9 sm:w-9">
                          <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : loading ? (
                <ul aria-hidden="true" className="mt-2 flex flex-col gap-1.5 sm:mt-3.5 sm:gap-2.5">
                  {[0, 1, 2].map((i) => (
                    <li
                      key={i}
                      className="h-[60px] animate-pulse border-2 border-border bg-muted/60 sm:h-[92px]"
                    />
                  ))}
                </ul>
              ) : (
                <div className="mt-2 border-2 border-dashed border-border bg-muted/50 px-4 py-5 text-center sm:mt-3.5 sm:py-10">
                  <p className="text-xs font-black uppercase text-foreground sm:text-base">
                    No posters matched &ldquo;{trimmed}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground sm:text-sm">
                    Try another keyword or pick a category above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}