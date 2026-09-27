import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode");

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { success: false, message: "A valid 6-digit pincode is required." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    // This API returns an array with one object; Status "Success" with a
    // populated PostOffice array means the pincode is valid and resolvable.
    const result = data?.[0];
    if (!result || result.Status !== "Success" || !result.PostOffice?.length) {
      return NextResponse.json(
        { success: false, message: "Pincode not found." },
        { status: 404 }
      );
    }

    const office = result.PostOffice[0];

    return NextResponse.json({
      success: true,
      city: office.District,
      state: office.State,
    });
  } catch (err) {
    console.error("❌ Pincode Lookup Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to look up pincode." },
      { status: 500 }
    );
  }
}