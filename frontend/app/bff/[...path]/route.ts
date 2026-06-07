import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Always run server-side and never cache: this proxy carries the backend secret
// and per-session privileged data.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";

const RECEPTION_COOKIE = "reception_auth";
const ALLOWED_ROLES = new Set(["owner", "staff", "ok"]);

/**
 * Same-origin gateway for privileged backend calls made from the browser.
 *
 * Browser code cannot hold the backend API key, so client-side reception
 * actions hit this route instead of the backend directly. The handler:
 *   1. verifies the reception session cookie (rejects anonymous callers), then
 *   2. forwards the request to the real backend, injecting the X-Api-Key header.
 *
 * The key lives only in server env (BACKEND_API_KEY) and is never sent to the
 * client.
 */
async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const role = cookies().get(RECEPTION_COOKIE)?.value;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const targetPath = "/" + path.map(encodeURIComponent).join("/");
  const url = `${API_BASE_URL}${targetPath}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const apiKey = process.env.BACKEND_API_KEY;
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.text() : undefined;

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  // Pass the backend response straight back to the caller.
  const resBody = await backendRes.arrayBuffer();
  const resHeaders = new Headers();
  const resContentType = backendRes.headers.get("content-type");
  if (resContentType) resHeaders.set("content-type", resContentType);

  return new NextResponse(resBody, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

type Ctx = { params: { path: string[] } };

export const GET = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const POST = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PUT = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PATCH = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const DELETE = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
