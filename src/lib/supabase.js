import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When both env vars are present we run in cloud mode (login + shared sync).
// Otherwise the app falls back to local mode (localStorage, single device).
export const SUPABASE_READY = Boolean(url && key);

export const supabase = SUPABASE_READY ? createClient(url, key) : null;
