const bucket = '3D%20Doll';
const fileNames = [
  'Doll character2.obj', 'Doll_character2.obj', 'Doll character.obj', 'doll.obj',
  'Doll character2.glb', 'Doll_character2.glb', 'Doll character.glb', 'doll.glb',
  'Doll character2.gltf', 'Doll_character2.gltf', 'Doll character.gltf', 'doll.gltf',
  'Anatomy_Doll.glb', 'anatomy_doll.glb', 'anatomy_doll.obj', 'mannequin.glb', 'mannequin.obj'
];

async function scan() {
  console.log("=== Scanning 3D Doll bucket ===");
  for (const name of fileNames) {
    const url = `https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/${bucket}/${name}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 200) {
        console.log(`${name} -> ${res.status} (Content-Length: ${res.headers.get('content-length')}, Content-Type: ${res.headers.get('content-type')})`);
      } else {
        console.log(`${name} -> ${res.status}`);
      }
    } catch (e) {
      console.log(`${name} -> ERROR: ${e.message}`);
    }
  }
}
scan();
