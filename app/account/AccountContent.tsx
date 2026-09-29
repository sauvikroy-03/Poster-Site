// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { useSearchParams } from "next/navigation";
// import AccountSidebar, { TabKey } from "@/components/Profile/AccountSidebar";
// import OrdersView from "@/components/Profile/OrdersPanel";
// import ProfileView from "@/components/Profile/ProfilePanel";

// export default function AccountContent() {
//   const searchParams = useSearchParams();

//   // Read initial tab from URL search params on mount
//   const getInitialTab = (): TabKey => {
//     const tabParam = searchParams.get("tab");
//     return tabParam === "profile" ? "profile" : "orders";
//   };

//   const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);

//   // Sync state with shallow URL change (0ms latency, zero server requests)
//   const handleTabChange = useCallback((tab: TabKey) => {
//     setActiveTab(tab);

//     const url = new URL(window.location.href);
//     url.searchParams.set("tab", tab);
//     window.history.replaceState(null, "", url.toString());
//   }, []);

//   // Listen for browser forward/back button navigation
//   useEffect(() => {
//     const handlePopState = () => {
//       const currentUrl = new URL(window.location.href);
//       const tab = currentUrl.searchParams.get("tab");
//       setActiveTab(tab === "profile" ? "profile" : "orders");
//     };

//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, []);

//  return (
//   <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
//     <div className="flex flex-col gap-8 md:flex-row md:items-start">
//       {/* Sidebar navigation */}
//       <AccountSidebar activeTab={activeTab} onTabChange={handleTabChange} />

//       {/* Main content area - stretches full remaining width */}
//       <main className="w-full min-w-0 flex-1">
//         {activeTab === "orders" ? <OrdersView /> : <ProfileView />}
//       </main>
//     </div>
//   </div>
// );
// }
import React from 'react'

export default function AccountContent() {
  return (
    <div>
      
    </div>
  )
}
