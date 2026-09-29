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
      {/* Mobile: horizontal scrollable pill tabs */}
      <nav className="flex w-full gap-2 overflow-x-auto px-0.5 py-1 md:hidden">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const isLoading = isPending && loadingTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => goToTab(key)}
              disabled={isPending}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                isActive
                  ? "bg-black text-white"
                  : "bg-white text-neutral-500 ring-1 ring-black/10 hover:text-black"
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

      {/* Desktop: vertical sidebar, fixed width, sticky while scrolling */}
      <nav className="hidden w-56 shrink-0 flex-col gap-1 md:sticky md:top-24 md:flex md:self-start">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const isLoading = isPending && loadingTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => goToTab(key)}
              disabled={isPending}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                isActive
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:bg-black/5 hover:text-black"
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