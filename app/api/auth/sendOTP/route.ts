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

    if (!PHONE_REGEX.test(phone)) {
      return fail(
        "A valid phone number with country code is required (e.g., +919876543210).",
        400
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return fail("Server configuration error.", 500);
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

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    });

    if (error) {
      console.error("❌ Send OTP Error:", error.status, error.message);

      if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
        return fail("Too many attempts. Please wait a minute and try again.", 429);
      }
      if (/unsupported phone provider/i.test(error.message)) {
        return fail("Phone login isn't available right now. Please try again later.", 503);
      }
      return fail("Could not send the verification code. Please try again.", 400);
    }

    return NextResponse.json(
      { success: true, message: "Verification code sent to WhatsApp." },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Send OTP Route Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}