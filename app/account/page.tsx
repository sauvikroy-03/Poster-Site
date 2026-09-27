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

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "orders" ? "orders" : "profile";
  const email = await getUserEmail();

  return (
    <div className="min-h-screen w-full bg-[#fbfaf8]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10 md:flex-row md:gap-14 md:py-14">
        <Suspense
          fallback={
            <div className="h-10 w-full animate-pulse rounded-full bg-neutral-100 md:h-40 md:w-48" />
          }
        >
          <AccountSidebar activeTab={activeTab} />
        </Suspense>

        <div className="min-w-0 flex-1">
          {activeTab === "orders" ? <OrdersPanel /> : <ProfilePanel email={email} />}
        </div>
      </div>
    </div>
  );
}