import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { r2 } from "@/lib/r2";
import { getAuthedClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin"; // adjust path

export const runtime = "nodejs"; // sharp needs the Node runtime

const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_NOTE_LENGTH = 2000;

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(req: NextRequest) {
  const uploadedKeys: string[] = [];
  const bucketName =
    process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFARE_R2_BUCKET_NAME;

  try {
    const supabase = await getAuthedClient();
    if (!supabase) return fail("Server configuration error.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return fail("Please log in to review your order.", 401);

    const formData = await req.formData();
    const orderId = String(formData.get("orderId") ?? "").trim();
    const rating = Number(formData.get("rating"));
    const note = String(formData.get("note") ?? "").trim();
    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    // ---- Validate input ----
    if (!orderId) return fail("orderId is required.", 400);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return fail("Rating must be between 1 and 5.", 400);
    }
    if (note.length > MAX_NOTE_LENGTH) {
      return fail(`Review must be ${MAX_NOTE_LENGTH} characters or fewer.`, 400);
    }
    if (files.length > MAX_FILES) return fail(`You can upload up to ${MAX_FILES} photos.`, 400);
    for (const file of files) {
      if (!file.type.startsWith("image/")) return fail("Only image files are allowed.", 400);
      if (file.size > MAX_FILE_BYTES) return fail("Each photo must be under 5 MB.", 400);
    }

    // ---- Ownership + delivery check (before any upload happens) ----
    const admin = getSupabaseAdmin();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("order_id, user_id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderError) return fail("Failed to load order.", 400);
    if (!order || order.user_id !== user.id) return fail("Order not found.", 404);
    if (order.status !== "delivered") {
      return fail("You can review your order once it has been delivered.", 403);
    }

    const { data: existing } = await admin
      .from("store_reviews")
      .select("review_id")
      .eq("order_id", orderId)
      .maybeSingle();
    if (existing) return fail("You've already reviewed this order.", 409);

    // ---- Compress + upload photos to R2 (compressed only, no raw copy) ----
    const publicDomain =
      process.env.CLOUDFLARE_PUBLIC_DOMAIN || process.env.CLOUDFARE_PUBLIC_DOMAIN;
    const imageUrls: string[] = [];

    for (const file of files) {
      let compressed: Buffer;
      try {
        compressed = await sharp(Buffer.from(await file.arrayBuffer()))
          .rotate() // respect EXIF orientation
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } catch {
        return fail("One of the files isn't a valid image.", 400);
      }

      // Server-generated key: never use the user's filename
      const key = `reviewimages/${user.id}/${Date.now()}-${crypto.randomUUID()}.webp`;

      await r2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: compressed,
          ContentType: "image/webp",
        })
      );
      uploadedKeys.push(key);
      if (publicDomain) imageUrls.push(`${publicDomain}/${key}`);
    }

    // ---- Save the review ----
    const { error: insertError } = await admin.from("store_reviews").insert({
      user_id: user.id,
      order_id: orderId,
      rating,
      note: note || null,
      images: imageUrls,
    });

    if (insertError) {
      console.error("❌ Store Review Insert Error:", insertError.message);
      // Don't leave orphaned uploads behind
      await Promise.allSettled(
        uploadedKeys.map((Key) => r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key })))
      );
      // 23505 = unique violation (double-submit race)
      if (insertError.code === "23505") return fail("You've already reviewed this order.", 409);
      return fail("Failed to save your review.", 500);
    }

    return NextResponse.json({ success: true, message: "Thanks for your review!" }, { status: 201 });
  } catch (err: unknown) {
    console.error("❌ Store Review Route Catch:", err);
    await Promise.allSettled(
      uploadedKeys.map((Key) => r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key })))
    );
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}