async function test() {
  const url = 'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2.obj';
  const res = await fetch(url);
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response body:`, text);
}
test();
