import { S3Client } from "@aws-sdk/client-s3";

function cleanEnv(val: string | undefined): string {
  return (val ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

const endpoint = cleanEnv(
  process.env.CLOUDFLARE_R2_ENDPOINT || process.env.CLOUDFARE_R2_ENDPOINT
).replace(/\/+$/, "");

const accessKeyId = cleanEnv(
  process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.CLOUDFARE_ACCESS_KEY_ID
);

const secretAccessKey = cleanEnv(
  process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.CLOUDFARE_SECRET_ACCESS_KEY
);

export const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});