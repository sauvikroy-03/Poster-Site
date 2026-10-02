// app/account/page.tsx
import React, { Suspense } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ProfilePanel from "@/components/Profile/ProfilePanel";
import AccountTabs from "@/components/Profile/AccountTabs";

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

export default function AccountPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Tabs switch on the client, so there is no server round trip when clicking */}
      <AccountTabs
        profile={
          <Suspense fallback={<PanelSkeleton />}>
            <ProfileView />
          </Suspense>
        }
      />
    </div>
  );
}