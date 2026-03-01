import { createClient } from "@supabase/supabase-js";

// ── Remplace ces deux valeurs par celles de ton projet Supabase ──
// Dashboard → Settings → API
export const SUPABASE_URL  = "https://asegyziygzydzfbpxugs.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZWd5eml5Z3p5ZHpmYnB4dWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzM2NDgsImV4cCI6MjA4Nzk0OTY0OH0.pgJ0as1TPtPiFmkmBsivYnkLtuqz8VxpcTRSCe2mSEw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
