"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Package, User as UserIcon } from "lucide-react";

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

  const goToTab = (tab: "orders" | "profile") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Mobile: horizontal scrollable pill tabs */}
      <nav className="flex gap-2 overflow-x-auto px-0.5 py-1 md:hidden">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => goToTab(key)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-black text-white"
                  : "bg-white text-neutral-500 ring-1 ring-black/10 hover:text-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Desktop: vertical sidebar, fixed width, sticky while scrolling */}
      <nav className="hidden w-56 flex-shrink-0 flex-col gap-1 md:sticky md:top-24 md:flex md:self-start">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => goToTab(key)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:bg-black/5 hover:text-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}