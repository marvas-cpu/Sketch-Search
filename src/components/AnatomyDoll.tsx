import React, { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { X, Check, RotateCcw, Box, HelpCircle, Move, Database, AlertCircle, Link2, Sliders, RefreshCw } from 'lucide-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

interface AnatomyDollProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

const isRootBone = (object: any) => {
  if (!object) return false;
  if (!object.isBone) return true;
  return !object.parent || !object.parent.isBone;
};

const canTranslateObject = (object: any, gltfModelScene: any) => {
  if (!object || !gltfModelScene) return true;
  if (object.isBone) {
    return !object.parent || !object.parent.isBone;
  }
  // If it's a nested submesh (where parent is not the root scene group), lock translation to keep it attached to the puppet body
  if (object.parent && object.parent !== gltfModelScene) {
    return false;
  }
  return true;
};

const AnatomyDoll: React.FC<AnatomyDollProps> = ({ onCapture, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Model state configurations
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [gltfModel, setGltfModel] = useState<any>(null);
  const [gltfRotations, setGltfRotations] = useState<Record<string, [number, number, number]>>({});
  const [gltfTranslations, setGltfTranslations] = useState<Record<string, [number, number, number]>>({});
  
  // Initial baseline fallback state to restore transforms
  const [originalRotations, setOriginalRotations] = useState<Record<string, [number, number, number]>>({});
  const [originalPositions, setOriginalPositions] = useState<Record<string, [number, number, number]>>({});

  // Interaction options
  const [transformMode, setTransformMode] = useState<'rotate' | 'translate'>('rotate');
  const [isDragging, setIsDragging] = useState(false);

  // Supabase / Custom model loading state
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState('https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2.obj');

  // Attempt to load standard Supabase model on mount
  useEffect(() => {
    autoDetectAndLoadSupabase();
  }, []);

  const loadAnyModel = async (url: string): Promise<{ type: 'obj' | 'gltf'; data: any }> => {
    const isObj = url.toLowerCase().split('?')[0].endsWith('.obj') || url.toLowerCase().includes('.obj');
    if (isObj) {
      const loader = new OBJLoader();
      const obj = await new Promise<any>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
      return { type: 'obj', data: obj };
    } else {
      const loader = new GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
      return { type: 'gltf', data: gltf };
    }
  };

  const autoDetectAndLoadSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseError(null);
    const candidates = [
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2.obj',
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/anatomy_doll.glb',
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/poses/mannequin.glb'
    ];

    for (const url of candidates) {
      try {
        const result = await loadAnyModel(url);
        if (result.type === 'obj') {
          applyLoadedObjModel(result.data, url);
        } else {
          applyLoadedGltfModel(result.data, url);
        }
        return; // Break immediately if we succeed!
      } catch (err) {
        // Fall back silently during auto-probing
      }
    }

    setSupabaseLoading(false);
    setSupabaseError("Supabase Model asset is missing. Please ensure your storage bucket has public access or paste your model URL path below.");
  };

  const handleManualLoad = async (urlToLoad: string) => {
    if (!urlToLoad) return;
    setSupabaseLoading(true);
    setSupabaseError(null);
    try {
      const result = await loadAnyModel(urlToLoad);
      if (result.type === 'obj') {
        applyLoadedObjModel(result.data, urlToLoad);
      } else {
        applyLoadedGltfModel(result.data, urlToLoad);
      }
    } catch (err: any) {
      console.error(err);
      setSupabaseError(err.message || "Failed to parse or fetch model. Check the CORS settings or URL endpoint.");
      setSupabaseLoading(false);
    }
  };

  const applyLoadedObjModel = (objGroup: any, url: string) => {
    // Auto-name meshes at the start to ensure they are targetable and selectable
    let meshIdx = 1;
    objGroup.traverse((node: any) => {
      if (node.isMesh) {
        node.name = node.name || `Body_Part_${meshIdx++}`;
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Premium matte drawing model theme
        if (!node.material || (Array.isArray(node.material) && node.material.length === 0)) {
          node.material = new THREE.MeshStandardMaterial({
            color: "#e2e8f0",
            roughness: 0.65,
            metalness: 0.1,
            side: THREE.DoubleSide
          });
        } else {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((mat: any) => {
            mat.side = THREE.DoubleSide;
            if (mat.color && (mat.color.getHex() === 0xffffff || mat.color.getHex() === 0xcccccc)) {
              mat.color.set("#e2e8f0");
            }
          });
        }
      }
    });

    // Gather parts
    const parts: string[] = [];
    objGroup.traverse((node: any) => {
      if (node.name && (node.isMesh || node.isGroup || node.isBone) && node !== objGroup) {
        if (!parts.includes(node.name)) {
          parts.push(node.name);
        }
      }
    });

    const initialRotations: Record<string, [number, number, number]> = {};
    const initialPositions: Record<string, [number, number, number]> = {};
    parts.forEach(p => {
      const obj = objGroup.getObjectByName(p);
      if (obj) {
        initialRotations[p] = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
        initialPositions[p] = [obj.position.x, obj.position.y, obj.position.z];
      }
    });

    // Center and scale model using bounding box calculations
    const box = new THREE.Box3().setFromObject(objGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    objGroup.position.x += (-center.x);
    objGroup.position.y += (-center.y) + size.y / 2 + 0.1; 
    objGroup.position.z += (-center.z);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = 2.4 / maxDim;
      objGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    setGltfModel({ scene: objGroup });
    setOriginalPositions(initialPositions);
    setOriginalRotations(initialRotations);
    setGltfRotations(initialRotations);
    setGltfTranslations(initialPositions);
    setModelUrl(url);
    if (parts.length > 0) {
      setSelectedPart(parts[0]);
    }
    setSupabaseLoaded(true);
    setSupabaseLoading(false);
  };

  const applyLoadedGltfModel = (gltf: any, url: string) => {
    // Traversal to collect targetable elements
    const parts: string[] = [];
    gltf.scene.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
      if (node.name && (node.isBone || node.isMesh || node.isGroup) && node !== gltf.scene) {
        if (!parts.includes(node.name)) {
          parts.push(node.name);
        }
      }
    });

    const initialRotations: Record<string, [number, number, number]> = {};
    const initialPositions: Record<string, [number, number, number]> = {};
    parts.forEach(p => {
      const obj = gltf.scene.getObjectByName(p);
      if (obj) {
        initialRotations[p] = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
        initialPositions[p] = [obj.position.x, obj.position.y, obj.position.z];
      }
    });

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    gltf.scene.position.x += (-center.x);
    gltf.scene.position.y += (-center.y) + size.y / 2 + 0.1; 
    gltf.scene.position.z += (-center.z);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = 2.4 / maxDim;
      gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    setGltfModel(gltf);
    setOriginalPositions(initialPositions);
    setOriginalRotations(initialRotations);
    setGltfRotations(initialRotations);
    setGltfTranslations(initialPositions);
    setModelUrl(url);
    if (parts.length > 0) {
      setSelectedPart(parts[0]);
    }
    setSupabaseLoaded(true);
    setSupabaseLoading(false);
  };

  const updateGltfRotation = (axis: number, value: number) => {
    if (!selectedPart || !gltfModel) return;
    const obj = gltfModel.scene.getObjectByName(selectedPart);
    if (obj) {
      obj.rotation.setComponent(axis, value);
      setGltfRotations(prev => ({
        ...prev,
        [selectedPart]: [obj.rotation.x, obj.rotation.y, obj.rotation.z]
      }));
    }
  };

  const updateGltfTranslation = (axis: number, value: number) => {
    if (!selectedPart || !gltfModel || !selectedObject) return;
    if (!canTranslateObject(selectedObject, gltfModel.scene)) return;
    const obj = gltfModel.scene.getObjectByName(selectedPart);
    if (obj) {
      obj.position.setComponent(axis, value);
      setGltfTranslations(prev => ({
        ...prev,
        [selectedPart]: [obj.position.x, obj.position.y, obj.position.z]
      }));
    }
  };

  const handleCapture = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
    onCapture(dataUrl);
  };

  const resetMannequin = () => {
    if (gltfModel) {
      Object.keys(originalRotations).forEach(k => {
        const obj = gltfModel.scene.getObjectByName(k);
        if (obj) {
          const origRot = originalRotations[k] || [0, 0, 0];
          const origPos = originalPositions[k] || [0, 0, 0];
          obj.rotation.set(origRot[0], origRot[1], origRot[2]);
          obj.position.set(origPos[0], origPos[1], origPos[2]);
        }
      });
      setGltfRotations({ ...originalRotations });
      setGltfTranslations({ ...originalPositions });
    }
  };

  const selectedObject = useMemo(() => {
    if (!gltfModel || !selectedPart) return null;
    return gltfModel.scene.getObjectByName(selectedPart);
  }, [gltfModel, selectedPart]);

  // Adapt transformation mode automatically when selecting locked joints
  useEffect(() => {
    if (selectedObject && gltfModel && !canTranslateObject(selectedObject, gltfModel.scene) && transformMode === 'translate') {
      setTransformMode('rotate');
    }
  }, [selectedPart, selectedObject, gltfModel, transformMode]);

  // Synchronise dragging updates from 3D helper
  const handleGizmoChange = () => {
    if (selectedObject) {
      if (transformMode === 'translate' && gltfModel && !canTranslateObject(selectedObject, gltfModel.scene)) {
        const orig = originalPositions[selectedPart] || [0, 0, 0];
        selectedObject.position.set(orig[0], orig[1], orig[2]);
        return;
      }
      setGltfRotations(prev => ({
        ...prev,
        [selectedPart]: [selectedObject.rotation.x, selectedObject.rotation.y, selectedObject.rotation.z]
      }));
      setGltfTranslations(prev => ({
        ...prev,
        [selectedPart]: [selectedObject.position.x, selectedObject.position.y, selectedObject.position.z]
      }));
    }
  };

  const SelectionHelper = () => {
    if (!selectedObject) return null;
    return <boxHelper args={[selectedObject, '#38bdf8']} />;
  };

  const CustomTransformControls = () => {
    const controlsRef = useRef<any>(null);
    useEffect(() => {
      const controls = controlsRef.current;
      if (controls) {
        const handleDragging = (e: any) => {
          setIsDragging(e.value);
        };
        controls.addEventListener('dragging-changed', handleDragging);
        return () => {
          controls.removeEventListener('dragging-changed', handleDragging);
        };
      }
    }, [selectedObject]);

    return selectedObject ? (
      <TransformControls 
        ref={controlsRef}
        object={selectedObject}
        mode={transformMode}
        size={0.8}
        onChange={handleGizmoChange}
      />
    ) : null;
  };

  return (
    <div className="fixed inset-0 z-[110] bg-navy/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-xl">
       <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-8 border-navy rounded-[3.5rem] p-6 md:p-10 max-w-7xl w-full h-[95vh] md:h-[90vh] shadow-[20px_20px_0px_0px_rgba(56,189,248,1)] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-navy uppercase tracking-tighter">Anatomy Doll 3D</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="font-bold text-navy/40 uppercase tracking-widest text-[10px] md:text-sm">Interactive Pose Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-navy text-white rounded-full hover:rotate-90 transition-transform cursor-pointer">
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Left: 3D Scene Viewport */}
          <div className="flex-1 bg-slate-100 border-8 border-navy rounded-[2.5rem] overflow-hidden relative shadow-inner group">
            {supabaseLoading && (
              <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-white/90 z-20">
                <div className="w-14 h-14 border-4 border-sky-400 border-t-navy rounded-full animate-spin" />
                <span className="font-bold text-navy text-sm uppercase tracking-widest animate-pulse">Loading model from Supabase...</span>
              </div>
            )}
            
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                <div className="w-12 h-12 border-4 border-sky-400 border-t-navy rounded-full animate-spin" />
              </div>
            }>
              <Canvas
                ref={canvasRef}
                gl={{ preserveDrawingBuffer: true, antialias: true }}
                shadows
                className="cursor-crosshair"
              >
                <color attach="background" args={['#f1f5f9']} />
                <PerspectiveCamera makeDefault position={[0, 1.4, 4.5]} fov={40} />
                <OrbitControls makeDefault enablePan={true} minDistance={1} maxDistance={10} enabled={!isDragging} />
                
                <ambientLight intensity={0.9} />
                <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={1.2} castShadow />
                <pointLight position={[-5, 5, -5]} intensity={0.5} />
                
                <Grid 
                  infiniteGrid 
                  fadeDistance={12} 
                  fadeStrength={3} 
                  sectionSize={1.5} 
                  sectionColor="#cbd5e1"
                  cellColor="#e2e8f0"
                  cellSize={0.5}
                  position={[0, -1, 0]}
                />

                {gltfModel && (
                  <group position={[0, -0.6, 0]}>
                    <primitive 
                      object={gltfModel.scene} 
                      onClick={(e: any) => {
                        e.stopPropagation();
                        let current = e.object;
                        if (current) {
                          // Find nearest bone if rigged/skinned mesh to make bones targetable
                          if (current.isSkinnedMesh && current.skeleton && current.skeleton.bones.length > 0) {
                            let nearestBone = null;
                            let minDist = Infinity;
                            current.skeleton.bones.forEach((bone: any) => {
                              const bonePos = new THREE.Vector3();
                              bone.getWorldPosition(bonePos);
                              const dist = e.point.distanceTo(bonePos);
                              if (dist < minDist) {
                                minDist = dist;
                                nearestBone = bone;
                              }
                            });
                            if (nearestBone) {
                              setSelectedPart((nearestBone as any).name);
                              return;
                            }
                          }
                          if (current.name) {
                            setSelectedPart(current.name);
                          }
                        }
                      }}
                    />
                    
                    {/* Bounding outline display for selected element */}
                    <SelectionHelper />

                    {/* Highly responsive interactive 3D gizmo */}
                    <CustomTransformControls />
                  </group>
                )}
                
                <Environment preset="city" />
              </Canvas>
            </Suspense>
            
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
              <div className="px-6 py-3 bg-navy text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border-b-4 border-sky-400">
                <Move size={16} />
                Selected Mesh: <span className="text-sky-300 ml-1">{selectedPart ? selectedPart.replace(/[_-]/g, ' ') : 'None (Click to select)'}</span>
              </div>
              <div className="px-4 py-2 bg-white/95 backdrop-blur-sm border-2 border-navy/15 font-black text-navy text-[10px] rounded-xl shadow-lg flex items-center gap-2">
                <Database size={12} className="text-sky-500" />
                Active Model: <span className="text-orange-500 text-[11px] font-black uppercase tracking-wider">Doll character2.obj</span>
              </div>
            </div>
            
            <button 
              onClick={() => alert('How to pose:\n1. Click on any part of the 3D model directly to select it.\n2. In the right panel, select "Rotate" to orient details, or "Translate" to adjust their positions.\n3. Grab the colored ring/arrow handles directly in the 3D viewport to adjust dynamically.\n4. Fine-tune your adjustments using the high-precision sliders in the control panel.\n5. Press "SAVE POSE" when you are happy with the arrangement to begin the sketch tutorial!')}
              className="absolute bottom-6 left-6 p-4 bg-white border-4 border-navy rounded-[1.5rem] text-navy hover:bg-sky-50 transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              <HelpCircle size={28} strokeWidth={3} />
            </button>

            <div className="absolute bottom-6 right-6 hidden md:block px-4 py-2 bg-navy/10 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-navy/60">
              Interactive 3D Skeletal Mesh Manipulator
            </div>
          </div>

          {/* Right: Controller & Options Pane */}
          <div className="w-full lg:w-96 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar shrink-0">
            {/* Custom URL controller loaded directly */}
            <div className="bg-slate-50 p-5 border-4 border-navy rounded-[2.2rem] space-y-4">
              <h3 className="font-black text-navy text-md uppercase leading-none tracking-tight flex items-center gap-2">
                <Database size={18} className="text-sky-600" /> Supabase Storage URL
              </h3>
              
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 justify-between">
                  <label className="text-[10px] font-black uppercase text-navy/40 tracking-wider flex items-center gap-1">
                    <Link2 size={10} /> Active 3D Model CDN Endpoint:
                  </label>
                  {supabaseLoaded && (
                    <span className="text-[8px] bg-green-500 text-white font-bold px-1.5 py-0.5 rounded uppercase">Connected</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={modelUrl}
                    onChange={(e) => setModelUrl(e.target.value)}
                    placeholder="https://.../model.obj"
                    className="flex-1 px-3 py-2 border-2 border-navy/20 bg-white rounded-lg text-[11px] font-bold text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy"
                  />
                  <button
                    type="button"
                    onClick={() => handleManualLoad(modelUrl)}
                    disabled={supabaseLoading}
                    className="px-3 bg-navy text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-sky-600 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Load
                  </button>
                </div>
              </div>

              {supabaseError && (
                <div className="p-3 bg-orange-50 border-2 border-orange-200 rounded-xl flex gap-1.5 items-start">
                  <AlertCircle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-orange-700 font-bold leading-tight uppercase">{supabaseError}</p>
                </div>
              )}
            </div>

            {/* Mesh & rotation precision values */}
            <div className="bg-slate-50 p-5 border-4 border-navy rounded-[2.2rem] space-y-4">
              <h3 className="font-black text-navy uppercase text-lg leading-none flex items-center gap-2">
                <div className="w-8 h-8 bg-navy text-white rounded-lg flex items-center justify-center">
                  <Sliders size={18} />
                </div>
                Mannequin Pivot Edit
              </h3>

              {/* List Dropdown for Supabase bones */}
              {Object.keys(gltfRotations).length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-navy/50 tracking-wider">
                    Select Part to Move:
                  </label>
                  <select 
                    value={selectedPart}
                    onChange={(e) => setSelectedPart(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-navy rounded-xl font-bold text-xs text-navy uppercase tracking-wide focus:outline-none"
                  >
                    {Object.keys(gltfRotations).map((partName) => (
                      <option key={partName} value={partName}>
                        {partName.replace(/[_-]/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mode Toggler */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-black uppercase text-navy/50 tracking-wider">
                  Transformation Mode:
                </label>
                <div className="flex bg-navy/5 p-1 rounded-xl border border-navy/10 select-none">
                  <button
                    type="button"
                    onClick={() => setTransformMode('rotate')}
                    className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${transformMode === 'rotate' ? 'bg-navy text-white shadow-md' : 'text-navy/50 hover:text-navy'}`}
                  >
                    <RefreshCw size={12} /> Rotate
                  </button>
                  <button
                    type="button"
                    disabled={selectedObject && gltfModel && !canTranslateObject(selectedObject, gltfModel.scene)}
                    onClick={() => setTransformMode('translate')}
                    className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${transformMode === 'translate' ? 'bg-navy text-white shadow-md' : 'text-navy/50 hover:text-navy'} disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <Move size={12} /> Translate
                  </button>
                </div>
                {selectedObject && gltfModel && !canTranslateObject(selectedObject, gltfModel.scene) && (
                  <p className="text-[10px] text-orange-500 font-bold uppercase mt-1.5 bg-orange-50 border border-orange-100 p-2 rounded-xl">
                    ⚠️ Joint can only be rotated to keep the mannequin connected!
                  </p>
                )}
              </div>

              {/* Interactive sliders based on transform mode */}
              <div className="space-y-4 pt-2">
                {transformMode === 'rotate' ? (
                  ['X Rotation', 'Y Rotation', 'Z Rotation'].map((axis, i) => {
                    const val = gltfRotations[selectedPart] ? gltfRotations[selectedPart][i] : 0;
                    return (
                      <div key={axis} className="space-y-2">
                        <div className="flex justify-between items-center font-black text-navy uppercase tracking-widest text-[9px]">
                          <span>{axis}</span>
                          <div className="bg-navy text-white px-2 py-0.5 rounded-md text-[8px]">
                            {Math.round(val * 180 / Math.PI)}°
                          </div>
                        </div>
                        <div className="relative flex items-center group">
                          <div className="absolute left-0 right-0 h-1.5 bg-navy/15 rounded-full" />
                          <input 
                            type="range"
                            min={-Math.PI}
                            max={Math.PI}
                            step={0.001}
                            value={val}
                            onChange={(e) => updateGltfRotation(i, parseFloat(e.target.value))}
                            className="w-full h-8 appearance-none bg-transparent cursor-pointer relative z-10 accent-sky-500"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  ['X Position', 'Y Position', 'Z Position'].map((axis, i) => {
                    const val = gltfTranslations[selectedPart] ? gltfTranslations[selectedPart][i] : 0;
                    return (
                      <div key={axis} className="space-y-2">
                        <div className="flex justify-between items-center font-black text-navy uppercase tracking-widest text-[9px]">
                          <span>{axis}</span>
                          <div className="bg-navy text-white px-2 py-0.5 rounded-md text-[8px]">
                            {val.toFixed(3)}
                          </div>
                        </div>
                        <div className="relative flex items-center group">
                          <div className="absolute left-0 right-0 h-1.5 bg-navy/15 rounded-full" />
                          <input 
                            type="range"
                            min={-2.0}
                            max={2.0}
                            step={0.001}
                            value={val}
                            onChange={(e) => updateGltfTranslation(i, parseFloat(e.target.value))}
                            className="w-full h-8 appearance-none bg-transparent cursor-pointer relative z-10 accent-sky-400"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Interaction buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={resetMannequin}
                className="flex items-center justify-center gap-3 w-full py-4 bg-white border-4 border-navy text-navy rounded-2xl font-black uppercase tracking-wider hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all active:scale-95 cursor-pointer text-xs animate-none"
              >
                <RotateCcw size={18} strokeWidth={3} />
                Reset Skeleton
              </button>
              
              <button
                type="button"
                onClick={handleCapture}
                className="group flex flex-col items-center justify-center gap-1 w-full py-6 bg-sky-400 border-4 border-navy text-navy rounded-[2.2rem] font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,128,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-3 text-2xl">
                  <Check size={30} strokeWidth={4} />
                  SAVE POSE
                </div>
                <span className="text-[9px] uppercase font-bold opacity-60">Generate drawings tutorial</span>
              </button>
            </div>

            <div className="bg-sky-50 p-4 border border-navy/15 rounded-[1.8rem] flex gap-3 items-start">
              <div className="text-xl">💡</div>
              <p className="text-[10px] font-bold text-navy/70 leading-relaxed uppercase">
                <span className="text-navy">Instructor Tip:</span> Toggle between <span className="text-navy">Rotate</span> and <span className="text-navy">Translate</span> to perfectly fine-tune unrigged model joints!
              </p>
            </div>
          </div>
        </div>
       </motion.div>
    </div>
  );
};

export default AnatomyDoll;
