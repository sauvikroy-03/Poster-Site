import React, { Suspense } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AccountSidebar from "@/components/Profile/AccountSidebar";
import ProfilePanel from "@/components/Profile/ProfilePanel";
import OrdersPanel from "@/components/Profile/OrdersPanel";

async function getUserEmail(): Promise<string | undefined> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return undefined;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return data.user?.email;
}

// Streamed async subcomponent for Profile
async function ProfileView() {
  const email = await getUserEmail();
  return <ProfilePanel email={email} />;
}

function PanelSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6">
      <div className="h-7 w-40 border-2 border-border bg-muted" />
      <div className="h-28 w-full border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]" />
      <div className="h-44 w-full border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]" />
    </div>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "orders" ? "orders" : "profile";

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10 md:flex-row md:gap-14 md:py-14">
        {/* Sidebar renders instantly */}
        <aside className="w-full shrink-0 md:w-60">
          <AccountSidebar activeTab={activeTab} />
        </aside>

        {/* Panel streams independently based on the active tab */}
        <div className="min-w-0 flex-1">
          <Suspense key={activeTab} fallback={<PanelSkeleton />}>
            {activeTab === "orders" ? <OrdersPanel /> : <ProfileView />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}