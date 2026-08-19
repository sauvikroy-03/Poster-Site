import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body.password?.trim();

    // 1. Password validation (min 8 chars standard)
    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing environment variables." },
        { status: 500 }
      );
    }

    // 2. Initialize Supabase SSR with the existing session cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // 3. Attach password to the currently authenticated user
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Failed to set password." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password set successfully.",
        user: { id: data.user?.id, email: data.user?.email },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Set Password Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}