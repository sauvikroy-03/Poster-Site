"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import AccountSidebar, { type AccountTab } from "@/components/Profile/AccountSidebar";
import OrdersPanel from "@/components/Profile/OrdersPanel";

interface AccountTabsProps {
  /** Server-rendered profile panel, passed in so it can still stream */
  profile: React.ReactNode;
}

export default function AccountTabs({ profile }: AccountTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab: AccountTab = searchParams.get("tab") === "orders" ? "orders" : "profile";
  const [activeTab, setActiveTab] = useState<AccountTab>(urlTab);

  // Keep in sync when the URL changes from outside (links, back/forward button)
  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (tab: AccountTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab); // instant
    window.history.pushState(null, "", `${pathname}?tab=${tab}`); // URL follows, no server request
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10 md:flex-row md:gap-14 md:py-14">
      <aside className="w-full shrink-0 md:w-60">
        <AccountSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>

      {/* Both panels stay mounted, so their data is already loaded when you switch */}
      <div className="min-w-0 flex-1">
        <div className={activeTab === "orders" ? "" : "hidden"}>
          <OrdersPanel />
        </div>
        <div className={activeTab === "profile" ? "" : "hidden"}>{profile}</div>
      </div>
    </div>
  );
}