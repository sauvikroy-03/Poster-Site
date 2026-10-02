"use client";

import React from "react";
import { Package, User as UserIcon } from "lucide-react";

export type AccountTab = "orders" | "profile";

interface AccountSidebarProps {
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
}

const TABS = [
  { key: "orders" as const, label: "Orders", icon: Package },
  { key: "profile" as const, label: "Profile", icon: UserIcon },
];

export default function AccountSidebar({ activeTab, onTabChange }: AccountSidebarProps) {
  return (
    <>
      {/* Mobile: horizontal scrollable brutalist tabs */}
      <nav className="flex w-full gap-2.5 overflow-x-auto px-0.5 py-1 md:hidden">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 border-2 border-border px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider transition-transform ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--border)]"
                  : "bg-card text-muted-foreground shadow-[3px_3px_0_0_var(--border)] hover:bg-muted hover:text-foreground active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--border)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Desktop: vertical brutalist sidebar */}
      <nav className="hidden w-60 shrink-0 flex-col gap-2.5 md:sticky md:top-24 md:flex md:self-start">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 border-2 border-border px-4 py-3 text-left font-mono text-xs font-black uppercase tracking-wider transition-transform ${
                isActive
                  ? "translate-x-[2px] translate-y-[2px] bg-primary text-primary-foreground shadow-[4px_4px_0_0_var(--border)]"
                  : "bg-card text-muted-foreground shadow-[4px_4px_0_0_var(--border)] hover:bg-muted hover:text-foreground active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)]"
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