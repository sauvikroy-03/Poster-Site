import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

// Privileged client — bypasses RLS entirely. Only ever import this inside
// route handlers (never in a "use client" file), and always verify the
// requesting user's identity/ownership yourself before writing with it.
export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}