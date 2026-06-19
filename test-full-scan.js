const buckets = ['poses', 'models', 'assets', 'anatomy', '3d', 'objects', 'files', 'public'];
const names = [
  'anatomy_doll.glb', 'Anatomy_Doll.glb', 'anatomy_doll_3d.glb', 'anatomyDoll.glb',
  'mannequin.glb', 'Mannequin.glb', 'manequin.glb', 'Manequin.glb',
  'doll.glb', 'Doll.glb', 'anatomy.glb', 'Anatomy.glb',
  'drawing_doll.glb', 'DrawingDoll.glb', 'drawing_model.glb', 'DrawingModel.glb',
  'reference_model.glb', 'reference.glb', 'Reference.glb',
  'body.glb', 'Body.glb', 'human.glb', 'Human.glb',
  'dummy.glb', 'Dummy.glb', 'anatomy_model.glb', 'Anatomy_Model.glb',
  'body_mannequin.glb', 'BodyMannequin.glb'
];

async function scan() {
  console.log("=== Broad 3D File Scan across all buckets ===");
  const promises = [];
  for (const b of buckets) {
    for (const name of names) {
      const url = `https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/${b}/${name}`;
      promises.push((async () => {
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (res.status === 200) {
            console.log(`FOUND IT! URL: ${url}`);
          }
        } catch (e) {
          // ignore
        }
      })());
    }
  }
  await Promise.all(promises);
  console.log("Scan complete!");
}

scan();
