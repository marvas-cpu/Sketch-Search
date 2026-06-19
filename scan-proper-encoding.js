const bucket = '3D Doll';
const fileNames = [
  'Doll character2.obj', 'Doll_character2.obj', 'Doll character.obj', 'doll.obj',
  'Doll character2.glb', 'Doll_character2.glb', 'Doll character.glb', 'doll.glb',
  'Doll character2.gltf', 'Doll_character2.gltf', 'Doll character.gltf', 'doll.gltf',
  'Anatomy_Doll.glb', 'anatomy_doll.glb', 'anatomy_doll.obj', 'mannequin.glb', 'mannequin.obj',
  'doll_clean.obj', 'doll_clean.glb', 'doll_mesh.glb', 'doll_skeleton.glb'
];

async function scan() {
  console.log("=== Scanning Supabase with correct URL-encoding ===");
  for (const name of fileNames) {
    const bucketEnc = encodeURIComponent(bucket);
    const nameEnc = encodeURIComponent(name);
    const url = `https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/${bucketEnc}/${nameEnc}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 200) {
        console.log(`[3D Doll] ${name} -> ${res.status} (Content-Length: ${res.headers.get('content-length')}, Type: ${res.headers.get('content-type')})`);
      }
    } catch (e) {
      console.log(`[3D Doll] ${name} -> ERROR: ${e.message}`);
    }
  }

  // Also scan 'poses' bucket
  for (const name of fileNames) {
    const bucketEnc = encodeURIComponent('poses');
    const nameEnc = encodeURIComponent(name);
    const url = `https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/${bucketEnc}/${nameEnc}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 200) {
        console.log(`[poses] ${name} -> ${res.status} (Content-Length: ${res.headers.get('content-length')}, Type: ${res.headers.get('content-type')})`);
      }
    } catch (e) {
      console.log(`[poses] ${name} -> ERROR: ${e.message}`);
    }
  }
}
scan();
