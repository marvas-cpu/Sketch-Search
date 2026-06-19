async function test() {
  const url = 'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2.obj';
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`Original URL status: ${res.status}`);
  if (res.status === 200) {
    console.log(`Content-Length: ${res.headers.get('content-length')}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
  }
}
test();
