import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  };
}

export function createSupabaseAnonClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured");
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseServiceClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function checkSupabaseConnection() {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    return {
      ok: false,
      message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    };
  }

  try {
    const anonClient = createSupabaseAnonClient();
    const { error } = await anonClient.from("subjects").select("id", { count: "exact", head: true });

    if (error) {
      return {
        ok: false,
        message: `Supabase reachable but query failed: ${error.message}`,
      };
    }

    return { ok: true, message: "Supabase URL + anon key are configured and working." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown Supabase error",
    };
  }
}
