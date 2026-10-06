import { createClient } from "@supabase/supabase-js";

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function getSupabasePublicEnv() {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "VITE_SUPABASE_URL"),
    anonKey: readEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_ANON_KEY"
    ),
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
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceRole = readEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SERVICE_ROLE_KEY");
  if (!url) throw new Error("Missing required env var: NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRole) throw new Error("Missing required env var: SUPABASE_SERVICE_ROLE_KEY");

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
