"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

export default function CategorySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input if ?q= changes externally (e.g. clicking a category chip)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setValue(urlQuery);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const pushQuery = (nextRaw: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const trimmed = nextRaw.trim().slice(0, 100);
    const current = (searchParams.get("q") ?? "").trim();
    if (trimmed === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("q", trimmed);
      // Search runs across all categories rather than restricting to a previously selected chip
      params.delete("category");
    } else {
      params.delete("q");
    }

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      pushQuery(next);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    setValue("");
    pushQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      pushQuery(value);
    } else if (e.key === "Escape" && value) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search posters..."
        aria-label="Search posters"
        className="w-full border-2 border-border bg-card py-2 pl-10 pr-9 text-xs font-bold uppercase tracking-wider text-foreground placeholder:text-muted-foreground outline-none shadow-[2px_2px_0_0_var(--border)] transition-all focus:bg-background"
      />
      {isPending ? (
        <Loader2
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      ) : value ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
