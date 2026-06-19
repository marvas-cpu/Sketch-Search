const list = [
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll_character2.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll_character.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll_character2.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll_character.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/mannequin.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/anatomy_doll.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/anatomy_doll.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/mannequin.glb',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/Doll%20character2.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/Doll_character2.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/Doll%20character.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/Doll_character.obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2%20(1).obj',
  'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2%20(1).glb'
];

async function check() {
  for (const url of list) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`URL: ${url} -> Status: ${res.status}`);
      if (res.status === 200) {
        console.log(`  SUCCESS! Size: ${res.headers.get('content-length')} bytes`);
      }
    } catch (e) {
      console.log(`URL: ${url} -> ERROR: ${e.message}`);
    }
  }
}
check();
