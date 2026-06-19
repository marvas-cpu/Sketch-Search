import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfiecgwbfcebzvvyqfaw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaWVjZ3diZmNlYnp2dnlxZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjgyNzMsImV4cCI6MjA4OTI0NDI3M30.UUlLuQZ8y55LeaS4awvzmkvEis5Uc1HuMmtSWydF06U';

// Create client targeting the 'storage' schema
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'storage' }
});

async function main() {
  console.log("=== Querying storage.objects table ===");
  const { data, error } = await supabase.from('objects').select('id, name, bucket_id, metadata, created_at');
  if (error) {
    console.error("Error querying storage.objects:", error);
  } else {
    console.log(`Found ${data.length} files:`);
    data.forEach(item => {
      console.log(`Bucket: "${item.bucket_id}" | Name: "${item.name}" | Size: ${item.metadata?.size || 'unknown'} | Type: ${item.metadata?.mimetype || 'unknown'} | Created: ${item.created_at}`);
    });
  }
}

main().catch(console.error);
