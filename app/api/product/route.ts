import { NextResponse, NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

interface VariantInput {
  prod_price?: string | number;
  compare_at_price?: string | number;
  prod_size?: string;
  prod_material?: string;
  is_in_stock?: boolean;
}

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function generateSKU(productName: string, size: string, material: string): string {
  const productCode = productName
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("-") || "PROD";

  const sizeCode = size.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "STD";

  const materialCode = material
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase() || "PAP";

  const shortId = Math.random().toString(36).substring(2, 5).toUpperCase();

  return `PST-${productCode}-${sizeCode}-${materialCode}-${shortId}`;
}

export async function POST(req: NextRequest) {
  console.log("👉 1. Received POST request to /api/product");
  try {
    const formData = await req.formData();

    // 1. Extract Form Fields
    const files = formData.getAll("files") as File[];
    const productName = formData.get("productName") as string;
    const productDescription = formData.get("productDescription") as string;
    const productCategory = formData.get("productCategory") as string;
    const productTagsRaw = formData.get("productTags") as string;
    const variantsRaw = formData.get("variants") as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!productName || !productCategory) {
      return NextResponse.json(
        { error: "Product name and category are required" },
        { status: 400 }
      );
    }

    const productTags = productTagsRaw
      ? productTagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const parsedVariants: VariantInput[] = variantsRaw ? JSON.parse(variantsRaw) : [];

    const supabase = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!
    );

    const bucketName =
      process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFARE_R2_BUCKET_NAME;

    // 2. Process and upload each file to Cloudflare R2
    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const rawBuffer = Buffer.from(bytes);

      const compressedBuffer = await sharp(rawBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const timestamp = Date.now();
      const originalName = file.name || `poster-${timestamp}.png`;
      const sanitizedFileName = originalName.replace(/\s+/g, "_");
      const baseNameWithoutExt = sanitizedFileName.replace(/\.[^/.]+$/, "");
      const compressedFileName = `${baseNameWithoutExt}.webp`;

      const rawKey = `raw/${timestamp}-${sanitizedFileName}`;
      const compressedKey = `compressed/${timestamp}-${compressedFileName}`;

      await Promise.all([
        r2.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: rawKey,
            Body: rawBuffer,
            ContentType: file.type || "application/octet-stream",
          })
        ),
        r2.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: compressedKey,
            Body: compressedBuffer,
            ContentType: "image/webp",
          })
        ),
      ]);

      const publicDomain =
        process.env.CLOUDFLARE_PUBLIC_DOMAIN || process.env.CLOUDFARE_PUBLIC_DOMAIN;

      return {
        name: file.name,
        raw: {
          key: rawKey,
          url: publicDomain ? `${publicDomain}/${rawKey}` : null,
        },
        compressed: {
          key: compressedKey,
          url: publicDomain ? `${publicDomain}/${compressedKey}` : null,
        },
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    const compressedImageUrls = uploadedFiles
      .map((f) => f.compressed.url)
      .filter(Boolean) as string[];

    const rawImageUrls=uploadedFiles.map((f)=>f.raw.url).filter(Boolean) as string[];

    // 3. Generate Slug & Insert Product
    const baseSlug = generateSlug(productName);
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        prod_name: productName,
        prod_description: productDescription,
        prod_category: productCategory,
        prod_tags: productTags,
        prod_images: compressedImageUrls,
        raw_prod_images:rawImageUrls,
        prod_is_active: true,
        prod_slug: uniqueSlug,
      })
      .select("prod_id")
      .single();

    if (productError || !productData?.prod_id) {
      console.error("❌ Product Insert Error:", productError);
      return NextResponse.json(
        { error: productError?.message || "Failed to create product" },
        { status: 400 }
      );
    }

    const newProductId = productData.prod_id;

    // 4. Format variant rows with backend-only generated SKU
    if (parsedVariants.length > 0) {
      const variantRows = parsedVariants.map((v: VariantInput) => {
        const price = Number(v.prod_price) || 0;
        const comparePrice = v.compare_at_price ? Number(v.compare_at_price) : null;
        const size = v.prod_size?.trim() || "Standard";
        const material = v.prod_material?.trim() || "300 GSM Matte Paper";

        const generatedSku = generateSKU(productName, size, material);

        return {
          prod_id: newProductId,
          prod_size: size,
          prod_material: material,
          prod_price: price,
          compare_at_price:
            comparePrice !== null && comparePrice > price ? comparePrice : null,
          sku: generatedSku,
          is_in_stock: v.is_in_stock ?? true,
        };
      });

      const { error: variantsError } = await supabase
        .from("product_variants")
        .insert(variantRows);

      if (variantsError) {
        console.error("❌ Variant Insert Error:", variantsError);
        return NextResponse.json(
          { error: "Product created, but failed to insert variants: " + variantsError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Product and variants uploaded successfully",
      productId: newProductId,
      files: uploadedFiles,
    });
  } catch (error: unknown) {
    console.error("Upload Error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload files";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


export async function GET(request:NextRequest){
      const supabase = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!
    );




    const { data, error } = await supabase
  .from("products")
  .select(`
    prod_id,
    prod_name,
    prod_slug,
    prod_category,
    prod_images,
    product_variants (
      variant_id,
      prod_size,
      prod_material,
      prod_price,
      compare_at_price,
      sku,
      is_in_stock
    )
  `)
  .eq("prod_is_active", true);


  return(NextResponse.json(data,{status:200}))
}