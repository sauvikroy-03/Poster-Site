import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body.password?.trim();

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }

    // 1. Length check (min 8 chars)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 2. Uppercase letter check
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least one uppercase letter." },
        { status: 400 }
      );
    }

    // 3. Lowercase letter check
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least one lowercase letter." },
        { status: 400 }
      );
    }

    // 4. Number check
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least one number." },
        { status: 400 }
      );
    }

    // 5. Special character/symbol check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least one special character (!@#$%^&* etc.)." },
        { status: 400 }
      );
    }

    // All validation passed
    return NextResponse.json(
      {
        success: true,
        message: "Password meets all security criteria.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Password Validation Error:", err);
    return NextResponse.json(
      { success: false, message: "Invalid request format or payload." },
      { status: 400 }
    );
  }
}