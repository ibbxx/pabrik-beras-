import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep session persisted so user stays logged in
    persistSession: true,
    // Keep auto-refresh; the AuthContext now correctly ignores TOKEN_REFRESHED
    autoRefreshToken: true,
    // Prevent re-parsing URL hash on tab focus (which can trigger SIGNED_IN again)
    detectSessionInUrl: true,
  },
});
