import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Validates E.164 format with country code (e.g., +919876543210)
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = body.phone ? String(body.phone).replace(/\s+/g, "") : "";
    const token = body.token ? String(body.token).trim() : "";

    if (!PHONE_REGEX.test(phone)) {
      return fail(
        "A valid phone number with country code is required (e.g., +919876543210).",
        400
      );
    }
    if (!/^\d{6}$/.test(token)) {
      return fail("Please enter the 6-digit verification code.", 400);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return fail("Server configuration error: Missing environment variables.", 500);
    }

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

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms", // stays "sms" even though the code arrives on WhatsApp
    });

    if (error) {
      console.error("❌ Supabase verifyOtp Error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
        return fail("Too many attempts. Please wait a minute and try again.", 429);
      }
      if (/expired|invalid/i.test(error.message)) {
        return fail("Invalid or expired verification code.", 400);
      }
      return fail("Could not verify the code. Please try again.", 400);
    }

    if (!data.user || !data.session) {
      return fail("Unable to verify user session.", 400);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Signed in successfully.",
        user: {
          id: data.user.id,
          phone: data.user.phone ? `+${data.user.phone}` : phone,
          email: data.user.email ?? null,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Uncaught Verification Exception:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}