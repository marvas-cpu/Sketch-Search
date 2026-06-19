import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfiecgwbfcebzvvyqfaw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaWVjZ3diZmNlYnp2dnlxZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjgyNzMsImV4cCI6MjA4OTI0NDI3M30.UUlLuQZ8y55LeaS4awvzmkvEis5Uc1HuMmtSWydF06U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== Listing Supabase Tables ===");
  // Query catalogs / schema tables
  const { data, error } = await supabase.rpc('get_tables_info'); // if rpc exists. Otherwise let's try reading schema metadata or common table names
  if (error) {
    console.log("No rpc get_tables_info:", error.message);
  } else {
    console.log("Tables list from RPC:", data);
  }

  // Probe some common table names:
  const common = ['models', 'doll_models', 'settings', 'config', 'poses_data', 'mannequin', 'mannequins', 'active_pose', 'user_poses'];
  for (const table of common) {
    const { data: records, error: rErr } = await supabase.from(table).select('*').limit(1);
    if (!rErr) {
      console.log(`Table exists: "${table}"`, records);
    }
  }
}
main().catch(console.error);
