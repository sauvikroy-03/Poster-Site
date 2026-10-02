"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Package, User as UserIcon, Loader2 } from "lucide-react";

interface AccountSidebarProps {
  activeTab: "orders" | "profile";
}

const TABS = [
  { key: "orders" as const, label: "Orders", icon: Package },
  { key: "profile" as const, label: "Profile", icon: UserIcon },
];

export default function AccountSidebar({ activeTab }: AccountSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [loadingTab, setLoadingTab] = useState<"orders" | "profile" | null>(null);

  const goToTab = (tab: "orders" | "profile") => {
    if (tab === activeTab || isPending) return;

    setLoadingTab(tab);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <>
      {/* Mobile: horizontal scrollable brutalist tabs */}
      <nav className="flex w-full gap-2.5 overflow-x-auto px-0.5 py-1 md:hidden">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const isLoading = isPending && loadingTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => goToTab(key)}
              disabled={isPending}
              className={`flex shrink-0 items-center gap-2 border-2 border-border px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider transition-transform disabled:cursor-not-allowed ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--border)]"
                  : "bg-card text-muted-foreground shadow-[3px_3px_0_0_var(--border)] hover:bg-muted hover:text-foreground active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--border)]"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-current" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {label}
            </button>
          );
        })}
      </nav>

      {/* Desktop: vertical brutalist sidebar */}
      <nav className="hidden w-60 shrink-0 flex-col gap-2.5 md:sticky md:top-24 md:flex md:self-start">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const isLoading = isPending && loadingTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => goToTab(key)}
              disabled={isPending}
              className={`flex items-center gap-3 border-2 border-border px-4 py-3 text-left font-mono text-xs font-black uppercase tracking-wider transition-transform disabled:cursor-not-allowed ${
                isActive
                  ? "translate-x-[2px] translate-y-[2px] bg-primary text-primary-foreground shadow-[4px_4px_0_0_var(--border)]"
                  : "bg-card text-muted-foreground shadow-[4px_4px_0_0_var(--border)] hover:bg-muted hover:text-foreground active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)]"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-current" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}