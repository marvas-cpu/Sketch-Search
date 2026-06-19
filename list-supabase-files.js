import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfiecgwbfcebzvvyqfaw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaWVjZ3diZmNlYnp2dnlxZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjgyNzMsImV4cCI6MjA4OTI0NDI3M30.UUlLuQZ8y55LeaS4awvzmkvEis5Uc1HuMmtSWydF06U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listBucket(bucketName) {
  console.log(`\n=== Listing files in bucket "${bucketName}" ===`);
  const { data, error } = await supabase.storage.from(bucketName).list('', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
  if (error) {
    console.error(`Error listing ${bucketName}:`, error);
  } else {
    data.forEach(file => {
      console.log(`- ${file.name} (Size: ${file.metadata?.size || 'unknown'}, Created: ${file.created_at})`);
    });
  }
}

async function main() {
  await listBucket('3D Doll');
  await listBucket('poses');
}

main().catch(console.error);
