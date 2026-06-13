import "server-only";

// Server-only Supabase client used for privileged Storage uploads.
//
// This uses the SERVICE ROLE key, which must never reach the browser. All
// uploads go through the authenticated /api/uploads route handler, so the
// anonymous (public) key is no longer used anywhere in the app.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!client) {
    client = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export const BLOG_BUCKET = "blog";
export const PRODUCTS_BUCKET = "products";
