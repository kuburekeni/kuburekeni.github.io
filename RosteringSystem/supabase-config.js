// Fill these in from your Supabase project:
// Project Settings → API → Project URL, and the "anon public" key.
// The anon key is safe to expose in client code — Row Level Security
// (set up in schema.sql) is what actually protects the data.
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
