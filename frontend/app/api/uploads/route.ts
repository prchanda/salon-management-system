import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/session-cookie";
import { getSupabaseAdmin, BLOG_BUCKET, PRODUCTS_BUCKET } from "@/lib/supabase";

// This route carries the Supabase service-role key (via getSupabaseAdmin) and
// must always run server-side, never cached.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RECEPTION_COOKIE = "reception_auth";
const ALLOWED_ROLES = new Set(["owner", "staff"]);

// Whitelist of accepted upload targets. The client sends an opaque "kind" and
// the server decides the bucket + folder — clients can't write to arbitrary
// buckets or paths.
const KINDS: Record<string, { bucket: string; folder: string }> = {
  blog: { bucket: BLOG_BUCKET, folder: "covers" },
  product: { bucket: PRODUCTS_BUCKET, folder: "items" },
};

// The client compresses to WebP under ~500 KB; allow a little headroom.
const MAX_BYTES = 600 * 1024;

function randomId(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Authenticated image upload gateway.
 *
 * The Supabase anon key is public, so client-side uploads would let anyone
 * write to our Storage buckets. Instead, the browser POSTs the already
 * compressed WebP here; this handler verifies the reception session, validates
 * the file server-side, and performs the upload with the service-role key.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // TEMP DIAGNOSTIC: 5xx response bodies are stripped on Azure SWA, hiding the
  // real upload error. Wrap everything and surface the actual message/stack as
  // a pass-through 200 so we can see it from the client. REMOVE after diagnosis.
  try {
    return await handleUpload(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack ?? "" : "";
    console.error("[uploads] DIAG top-level throw", { message, stack });
    return NextResponse.json(
      { __diag: true, message, stack },
      { status: 200 }
    );
  }
}

async function handleUpload(req: NextRequest): Promise<NextResponse> {
  const role = await verifyValue(cookies().get(RECEPTION_COOKIE)?.value);
  if (!role || !ALLOWED_ROLES.has(role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return new NextResponse("Invalid form data", { status: 400 });
  }

  const target = KINDS[String(form.get("kind") ?? "")];
  if (!target) {
    return new NextResponse("Unknown upload kind", { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return new NextResponse("Missing file", { status: 400 });
  }
  if (file.type !== "image/webp") {
    return new NextResponse("Only WebP images are accepted", { status: 415 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return new NextResponse("File too large", { status: 413 });
  }

  const path = `${target.folder}/${randomId()}.webp`;
  // DIAG: surface every failure mode as a pass-through 200 so the stripped-5xx
  // problem doesn't hide it.
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { __diag: true, stage: "getSupabaseAdmin", message },
      { status: 200 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(target.bucket)
    .upload(path, bytes, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) {
    return NextResponse.json(
      {
        __diag: true,
        stage: "supabase.upload",
        bucket: target.bucket,
        path,
        message: error.message,
        name: (error as { name?: string }).name,
      },
      { status: 200 }
    );
  }

  const publicUrl = supabase.storage.from(target.bucket).getPublicUrl(path).data
    .publicUrl;
  return NextResponse.json({ url: publicUrl });
}
