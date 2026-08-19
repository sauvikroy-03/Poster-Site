import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const token = body.token?.trim();
    const password = body.password?.trim();

    // 1. Input Validation
    if (!email || !token || token.length !== 6) {
      return NextResponse.json(
        { success: false, message: "A valid email and 6-digit code are required." },
        { status: 400 }
      );
    }

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

    // 2. Initialize Supabase SSR with Cookie Store
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

    // 3. Step 1: Verify the 6-digit OTP
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (verifyError || !verifyData.user) {
      return NextResponse.json(
        { success: false, message: verifyError?.message || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // 4. Step 2: Set the user's password on the verified session
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message || "Failed to set account password." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account verified and password set successfully.",
        user: {
          id: updateData.user?.id,
          email: updateData.user?.email,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Verify OTP & Set Password Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}