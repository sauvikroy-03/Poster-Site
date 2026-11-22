import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAPID_HOST = "pinterest-video-and-image-downloader.p.rapidapi.com";
const MAX_BYTES = 20 * 1024 * 1024; // same limit as the upload box
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Pinterest can answer unknown clients differently, so look like a normal browser
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
};

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

// pinterest.com, in.pinterest.com, pinterest.co.uk, pinterest.fr ... but not pinterest.evil.com
function isPinterestHost(host: string) {
  return (
    host === "pinterest.com" ||
    host.endsWith(".pinterest.com") ||
    /^(?:[a-z]{2}\.)?pinterest\.(?:co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/.test(host)
  );
}

function isPinimgHost(host: string) {
  return host === "pinimg.com" || host.endsWith(".pinimg.com");
}

// A pin.it link doesn't go straight to the pin. It usually hops through
// api.pinterest.com/url_shortener/<code>/redirect/ first, then lands on
// pinterest.com/pin/<id>/sent/?... so we keep following until we reach a /pin/ page.
// Redirects are followed by hand so we only ever visit pin.it or Pinterest hosts.
function isShortenerStep(u: URL) {
  return (
    u.hostname === "pin.it" ||
    (isPinterestHost(u.hostname) && u.pathname.startsWith("/url_shortener/"))
  );
}

async function resolveShortLink(input: URL): Promise<URL> {
  let current = input;

  for (let hop = 0; hop < 6 && isShortenerStep(current); hop++) {
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
    } catch (err) {
      console.error("❌ Short link fetch failed:", current.href, err);
      break;
    }

    const location = res.headers.get("location");
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔗 hop ${hop}: ${res.status} ${current.href} -> ${location ?? "(no redirect)"}`);
    }
    if (!location) break;

    let next: URL;
    try {
      next = new URL(location, current); // handles relative Location headers
    } catch {
      break;
    }

    // Never follow a redirect to anywhere that isn't pin.it or Pinterest
    if (next.hostname !== "pin.it" && !isPinterestHost(next.hostname)) break;
    current = next;
  }

  return current;
}

// The sample response was dummy data, so look in every likely field
function pickImageUrl(payload: unknown): { url?: string; isVideo: boolean } {
  const root = (payload ?? {}) as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const candidates = [data.download_url, data.image, data.url, data.thumbnail];
  const url = candidates.find(
    (v): v is string => typeof v === "string" && /^https?:\/\//i.test(v)
  );
  return { url, isVideo: data.type === "video" };
}

// Pinterest serves smaller copies at /236x/, /736x/ and so on. /originals/ is the full file.
function upgradeToOriginal(url: string) {
  return url.replace(/\/\d+x(?:\d+(?:_[A-Za-z]+)?)?\//, "/originals/");
}

type Download =
  | { ok: true; bytes: ArrayBuffer; type: string }
  | { ok: false; reason: "failed" | "type" | "size" };

async function downloadImage(url: string): Promise<Download> {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return { ok: false, reason: "failed" };
  }
  // Only ever download from Pinterest's image servers
  if (target.protocol !== "https:" || !isPinimgHost(target.hostname)) {
    return { ok: false, reason: "failed" };
  }

  const res = await fetch(target, { signal: AbortSignal.timeout(20000), cache: "no-store" });
  if (!res.ok || !isPinimgHost(new URL(res.url).hostname)) {
    return { ok: false, reason: "failed" };
  }

  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) return { ok: false, reason: "type" };

  if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return { ok: false, reason: "size" };
  }
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) return { ok: false, reason: "size" };

  return { ok: true, bytes, type };
}

export async function GET(request: Request) {
  try {
    // ---- 1. Only signed-in users (every import costs one API call). Delete this block to allow guests. ----
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return fail("Server configuration error.", 500);

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Please log in to import from Pinterest.", 401);

    // ---- 2. Validate the pin link ----
    const raw = new URL(request.url).searchParams.get("url")?.trim() ?? "";
    let pin: URL;
    try {
      pin = new URL(raw);
    } catch {
      return fail("That doesn't look like a valid link.", 400);
    }
    if (!/^https?:$/.test(pin.protocol)) return fail("That doesn't look like a valid link.", 400);

    // pin.it/xxxx  ->  pinterest.com/pin/<id>/...
    if (isShortenerStep(pin)) pin = await resolveShortLink(pin);

    // Pull the numeric pin id out of /pin/<id>/ , /pin/<id>/sent/ or /pin/<title>--<id>/
    const pinId = pin.pathname.match(/^\/pin\/(?:[^/]*--)?(\d+)/)?.[1];

    if (!isPinterestHost(pin.hostname) || !pinId) {
      const stillShort = isShortenerStep(pin);
      return fail(
        stillShort
          ? "Couldn't open that short link. Try pasting the full pin link instead."
          : "Paste a link to a Pinterest pin.",
        400
      );
    }

    // Drops tracking params and trailing segments like /sent/
    const cleanPinUrl = `${pin.origin}/pin/${pinId}/`;

    // ---- 3. Ask RapidAPI for the image ----
    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      console.error("❌ RAPID_API_KEY is not set");
      return fail("Pinterest import isn't set up yet.", 500);
    }

    const apiRes = await fetch(
      `https://${RAPID_HOST}/pinterest?url=${encodeURIComponent(cleanPinUrl)}`,
      {
        headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": RAPID_HOST },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      }
    );

    if (apiRes.status === 429) {
      return fail("Pinterest import is busy right now. Try again in a minute.", 429);
    }
    if (!apiRes.ok) {
      console.error("❌ RapidAPI error:", apiRes.status, await apiRes.text().catch(() => ""));
      return fail("Couldn't read that pin right now. Try again, or upload the image.", 502);
    }

    const json = await apiRes.json().catch(() => null);
    if (process.env.NODE_ENV !== "production") {
      console.log("📌 RapidAPI response:", JSON.stringify(json));
    }

    const { url: imageUrl, isVideo } = pickImageUrl(json);
    if (isVideo) return fail("That pin is a video. Use a pin with a still image.", 422);
    if (!imageUrl) return fail("We couldn't find an image on that pin. Is it public?", 404);

    // ---- 4. Download it (full-size copy first, then whatever the API gave us) ----
    const candidates = [...new Set([upgradeToOriginal(imageUrl), imageUrl])];
    let result: Download = { ok: false, reason: "failed" };
    for (const candidate of candidates) {
      result = await downloadImage(candidate).catch(() => ({ ok: false, reason: "failed" }) as Download);
      if (result.ok) break;
    }

    if (!result.ok) {
      if (result.reason === "type") {
        return fail("That pin isn't a JPG, PNG or WEBP image. GIFs aren't supported.", 422);
      }
      if (result.reason === "size") return fail("That image is over 20 MB.", 413);
      return fail("Couldn't download the image from that pin.", 502);
    }

    return new Response(result.bytes, {
      headers: { "Content-Type": result.type, "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("❌ Pinterest route error:", err);
    return fail("Something went wrong fetching that pin.", 500);
  }
}