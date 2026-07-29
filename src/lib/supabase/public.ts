import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

let publicClient: SupabaseClient | null | undefined;

export function createPublicSupabaseClient() {
  if (publicClient !== undefined) {
    return publicClient;
  }

  const config = getSupabasePublicConfig();

  if (!config.url || !config.publicKey || !config.isConfigured) {
    publicClient = null;
    return publicClient;
  }

  publicClient = createClient(config.url, config.publicKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "quicksol-public-catalog",
      },
    },
  });

  return publicClient;
}
