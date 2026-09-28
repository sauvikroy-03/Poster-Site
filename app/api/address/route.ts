import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface AddressPayload {
  id?: string;
  setDefault?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: {
    countryIso2?: string;
    dialCode?: string;
    number?: string;
  };
  address?: {
    type?: string;
    line1?: string;
    landmark?: string | null;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ADDRESS_COLUMNS =
  "id, first_name, last_name, email, phone_country_iso2, phone_dial_code, phone_number, address_line1, landmark, pincode, city, state, country, address_type, is_default, created_at";

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

async function createSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

// Validates the form payload and flattens it to table columns
function parseAddress(body: AddressPayload) {
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase();
  const phoneNumber = body.phone?.number?.trim();
  const addressType = body.address?.type;
  const line1 = body.address?.line1?.trim();
  const pincode = body.address?.pincode?.trim();
  const city = body.address?.city?.trim();
  const state = body.address?.state?.trim();

  if (!firstName || !lastName) return { error: "First name and last name are required." };
  if (!email || !EMAIL_REGEX.test(email)) return { error: "A valid email address is required." };
  if (!phoneNumber || !/^\d{6,15}$/.test(phoneNumber))
    return { error: "A valid phone number is required." };
  if (!line1) return { error: "Address is required." };
  if (!pincode || !/^\d{4,10}$/.test(pincode)) return { error: "A valid pincode is required." };
  if (!city || !state) return { error: "City and state are required." };
  if (addressType !== "home" && addressType !== "office")
    return { error: "Address type must be 'home' or 'office'." };

  return {
    values: {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_country_iso2: body.phone?.countryIso2?.trim() || "IN",
      phone_dial_code: body.phone?.dialCode?.trim() || "+91",
      phone_number: phoneNumber,
      address_line1: line1,
      landmark: body.address?.landmark?.trim() || null,
      pincode,
      city,
      state,
      country: body.address?.country?.trim() || "India",
      address_type: addressType,
    },
  };
}

// ---------------- GET: list the logged-in user's addresses ----------------
export async function GET() {
  try {
    const supabase = await createSupabase();
    if (!supabase) return fail("Server configuration error: Missing environment variables.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return fail("Please log in to view your addresses.", 401);

    const { data, error } = await supabase
      .from("user_address")
      .select(ADDRESS_COLUMNS)
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Address Fetch Error:", error.message);
      return fail(error.message, 400);
    }

    return NextResponse.json({ success: true, addresses: data ?? [] }, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Address GET Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}

// ---------------- POST: add an address ----------------
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AddressPayload;

    const parsed = parseAddress(body);
    if ("error" in parsed) return fail(parsed.error as string, 400);

    const supabase = await createSupabase();
    if (!supabase) return fail("Server configuration error: Missing environment variables.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return fail("Please log in to save an address.", 401);

    // First address becomes the default automatically
    const { count, error: countError } = await supabase
      .from("user_address")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("❌ Address Count Error:", countError.message);
      return fail(countError.message, 400);
    }

    const { data, error } = await supabase
      .from("user_address")
      .insert({
        user_id: user.id,
        ...parsed.values,
        is_default: (count ?? 0) === 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ Address Insert Error:", error.message);
      return fail(error.message, 400);
    }

    return NextResponse.json(
      { success: true, message: "Address added successfully.", addressId: data.id },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("❌ Address POST Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}

// ---------------- PATCH: edit an address, or make it the default ----------------
// Body: { id, setDefault: true }   -> make this address the default
//       { id, ...formPayload }     -> edit the address fields
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as AddressPayload;
    const id = body.id?.trim();

    if (!id) return fail("Address id is required.", 400);

    const supabase = await createSupabase();
    if (!supabase) return fail("Server configuration error: Missing environment variables.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return fail("Please log in to update your address.", 401);

    // ---- Change default ----
    if (body.setDefault) {
      const { data: target, error: targetError } = await supabase
        .from("user_address")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (targetError || !target) return fail("Address not found.", 404);

      // Clear the old default first so the "one default per user" unique index isn't violated
      const { error: clearError } = await supabase
        .from("user_address")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true)
        .neq("id", id);

      if (clearError) {
        console.error("❌ Clear Default Error:", clearError.message);
        return fail(clearError.message, 400);
      }

      const { error: setError } = await supabase
        .from("user_address")
        .update({ is_default: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (setError) {
        console.error("❌ Set Default Error:", setError.message);
        return fail(setError.message, 400);
      }

      return NextResponse.json(
        { success: true, message: "Default address updated." },
        { status: 200 }
      );
    }

    // ---- Edit fields ----
    const parsed = parseAddress(body);
    if ("error" in parsed) return fail(parsed.error as string, 400);

    const { data, error } = await supabase
      .from("user_address")
      .update(parsed.values)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("❌ Address Update Error:", error.message);
      return fail(error.message, 400);
    }

    if (!data) return fail("Address not found.", 404);

    return NextResponse.json(
      { success: true, message: "Address updated successfully." },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Address PATCH Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}