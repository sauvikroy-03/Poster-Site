import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const password = body.password ? String(body.password) : null;

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    else if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least one uppercase letter." },
        { status: 400 }
      );
    }
    else if (!/[a-z]/.test(password)) {
    return NextResponse.json(
        { success: false, message: "Password must contain at least one lowercase letter." },
        { status: 400 }
      );
  }
  else if (!/[0-9]/.test(password)) {
    return NextResponse.json(
        { success: false, message: "Password must contain at least one number." },
        { status: 400 }
      );
  
  }
  else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return NextResponse.json(
        { success: false, message: "Password must contain at least one special character (!@#$%^&* etc.)." },
        { status: 400 }
      );
   
  }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("❌ SignUp Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    // Check if the email already exists and is confirmed
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Verification code sent successfully." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Send OTP Route Catch:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}