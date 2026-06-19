import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfiecgwbfcebzvvyqfaw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaWVjZ3diZmNlYnp2dnlxZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjgyNzMsImV4cCI6MjA4OTI0NDI3M30.UUlLuQZ8y55LeaS4awvzmkvEis5Uc1HuMmtSWydF06U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== Listing Buckets ===");
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
  } else {
    console.log("Buckets:", data);
  }
}
main().catch(console.error);
