import React, { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, PivotControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { X, Check, RotateCcw, Box, HelpCircle, Move, Search, Database, AlertCircle, Link2 } from 'lucide-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

interface BoneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  name: string;
  onSelect: (name: string) => void;
  isSelected: boolean;
  children?: React.ReactNode;
  onRotationChange?: (rotation: [number, number, number]) => void;
}

const BodyPart: React.FC<BoneProps & { 
  type?: 'pelvis' | 'torso' | 'head' | 'upper_arm' | 'lower_arm' | 'thigh' | 'calf';
}> = ({ 
  position, 
  rotation, 
  scale, 
  color = "#dfc8a5", // Beautiful warm light birch wood tone
  name, 
  onSelect, 
  isSelected, 
  children, 
  onRotationChange,
  type
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const jointColor = "#a38c73"; // Walnut joint connectors
  
  // Render highly stylized anatomical drawing mannequin parts
  const renderGeometry = () => {
    switch (type) {
      case 'head':
        return (
          <group>
            {/* Neck pillar joint */}
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.07, 0.08, 0.14, 16]} />
              <meshStandardMaterial color={jointColor} roughness={0.5} />
            </mesh>
            {/* Smooth mannequin head egg shape */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.18, 32, 16]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
            </mesh>
            {/* Center alignment ridge to help drawing orientation */}
            <mesh position={[0, 0.02, 0.17]}>
              <boxGeometry args={[0.015, 0.11, 0.025]} />
              <meshStandardMaterial color={jointColor} roughness={0.5} />
            </mesh>
          </group>
        );
      case 'torso':
        return (
          <group>
            {/* Chest barrel */}
            <mesh position={[0, 0.12, 0]} scale={[1, 1.1, 0.9]}>
              <cylinderGeometry args={[0.26, 0.18, 0.45, 16]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
            </mesh>
            {/* Shoulder alignment nodes */}
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[0.54, 0.05, 0.14]} />
              <meshStandardMaterial color={jointColor} roughness={0.4} />
            </mesh>
          </group>
        );
      case 'pelvis':
        return (
          <group>
            {/* Main hip core */}
            <mesh scale={[1.1, 0.8, 1.15]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
            </mesh>
          </group>
        );
      case 'upper_arm':
      case 'lower_arm':
        return (
          <group>
            {/* Ball joint at origin */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial color={jointColor} roughness={0.5} />
            </mesh>
            {/* Wooden cylindrical bone representation */}
            <mesh position={[0, -scale[1] / 2, 0]}>
              <cylinderGeometry args={[scale[0] * 0.4, scale[0] * 0.3, scale[1] * 0.9, 16]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
            </mesh>
          </group>
        );
      case 'thigh':
      case 'calf':
        return (
          <group>
            {/* Robust ball joint at origin */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshStandardMaterial color={jointColor} roughness={0.5} />
            </mesh>
            {/* Tapered leg cylinder bone */}
            <mesh position={[0, -scale[1] / 2, 0]}>
              <cylinderGeometry args={[scale[0] * 0.42, scale[0] * 0.32, scale[1] * 0.9, 16]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
            </mesh>
          </group>
        );
      default:
        return (
          <group>
            <mesh>
              <boxGeometry args={scale} />
              <meshStandardMaterial color={color} roughness={0.3} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group position={position}>
      {isSelected ? (
        <PivotControls
          activeAxes={[true, true, true]}
          depthTest={false}
          anchor={[0, 0, 0]}
          scale={0.55}
          onDrag={(matrix) => {
            const rot = new THREE.Euler().setFromRotationMatrix(matrix);
            onRotationChange?.([rot.x, rot.y, rot.z]);
          }}
          disableAxes={true}
          disableSliders={true}
        >
          <group rotation={rotation}>
            <mesh 
              ref={meshRef}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(name);
              }}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              {renderGeometry()}
            </mesh>
            {/* Sky blue selection highlight ring */}
            <mesh scale={[1.2, 1.2, 1.2]}>
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.35} />
            </mesh>
            <group>
              {children}
            </group>
          </group>
        </PivotControls>
      ) : (
        <group rotation={rotation}>
          <mesh 
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(name);
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            {renderGeometry()}
            {hovered && (
              <mesh scale={[1.12, 1.12, 1.12]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color="#bae6fd" wireframe transparent opacity={0.25} />
              </mesh>
            )}
          </mesh>
          {children}
        </group>
      )}
    </group>
  );
};

const Mannequin: React.FC<{ 
  selectedPart: string; 
  bodyState: any; 
  onSelect: (name: string) => void; 
  onRotate: (name: string, rot: [number, number, number]) => void;
}> = ({ selectedPart, bodyState, onSelect, onRotate }) => {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Pelvis/Root */}
      <BodyPart 
        name="pelvis" 
        position={[0, 1.3, 0]} 
        rotation={bodyState.pelvis.rotation} 
        scale={[0.5, 0.35, 0.3]} 
        onSelect={onSelect} 
        isSelected={selectedPart === 'pelvis'}
        onRotationChange={(rot) => onRotate('pelvis', rot)}
        type="pelvis"
      >
        {/* Torso */}
        <BodyPart 
          name="torso" 
          position={[0, 0.42, 0]} 
          rotation={bodyState.torso.rotation} 
          scale={[0.6, 0.72, 0.35]} 
          onSelect={onSelect} 
          isSelected={selectedPart === 'torso'}
          onRotationChange={(rot) => onRotate('torso', rot)}
          type="torso"
        >
          {/* Head */}
          <BodyPart 
            name="head" 
            position={[0, 0.65, 0]} 
            rotation={bodyState.head.rotation} 
            scale={[0.35, 0.45, 0.35]} 
            onSelect={onSelect} 
            isSelected={selectedPart === 'head'}
            onRotationChange={(rot) => onRotate('head', rot)}
            type="head"
          />
          
          {/* Left Arm */}
          <BodyPart 
            name="l_shoulder" 
            position={[-0.45, 0.25, 0]} 
            rotation={bodyState.l_shoulder.rotation} 
            scale={[0.25, 0.5, 0.2]} 
            onSelect={onSelect} 
            isSelected={selectedPart === 'l_shoulder'}
            onRotationChange={(rot) => onRotate('l_shoulder', rot)}
            type="upper_arm"
          >
             <BodyPart 
                name="l_elbow" 
                position={[0, -0.45, 0]} 
                rotation={bodyState.l_elbow.rotation} 
                scale={[0.2, 0.45, 0.18]} 
                onSelect={onSelect} 
                isSelected={selectedPart === 'l_elbow'}
                onRotationChange={(rot) => onRotate('l_elbow', rot)}
                type="lower_arm"
              />
          </BodyPart>

          {/* Right Arm */}
          <BodyPart 
            name="r_shoulder" 
            position={[0.45, 0.25, 0]} 
            rotation={bodyState.r_shoulder.rotation} 
            scale={[0.25, 0.5, 0.2]} 
            onSelect={onSelect} 
            isSelected={selectedPart === 'r_shoulder'}
            onRotationChange={(rot) => onRotate('r_shoulder', rot)}
            type="upper_arm"
          >
             <BodyPart 
                name="r_elbow" 
                position={[0, -0.45, 0]} 
                rotation={bodyState.r_elbow.rotation} 
                scale={[0.2, 0.45, 0.18]} 
                onSelect={onSelect} 
                isSelected={selectedPart === 'r_elbow'}
                onRotationChange={(rot) => onRotate('r_elbow', rot)}
                type="lower_arm"
              />
          </BodyPart>
        </BodyPart>

        {/* Left Leg */}
        <BodyPart 
          name="l_hip" 
          position={[-0.18, -0.4, 0]} 
          rotation={bodyState.l_hip.rotation} 
          scale={[0.25, 0.65, 0.25]} 
          onSelect={onSelect} 
          isSelected={selectedPart === 'l_hip'}
          onRotationChange={(rot) => onRotate('l_hip', rot)}
          type="thigh"
        >
          <BodyPart 
            name="l_knee" 
            position={[0, -0.6, 0]} 
            rotation={bodyState.l_knee.rotation} 
            scale={[0.22, 0.65, 0.22]} 
            onSelect={onSelect} 
            isSelected={selectedPart === 'l_knee'}
            onRotationChange={(rot) => onRotate('l_knee', rot)}
            type="calf"
          />
        </BodyPart>

        {/* Right Leg */}
        <BodyPart 
          name="r_hip" 
          position={[0.18, -0.4, 0]} 
          rotation={bodyState.r_hip.rotation} 
          scale={[0.25, 0.65, 0.25]} 
          onSelect={onSelect} 
          isSelected={selectedPart === 'r_hip'}
          onRotationChange={(rot) => onRotate('r_hip', rot)}
          type="thigh"
        >
          <BodyPart 
            name="r_knee" 
            position={[0, -0.6, 0]} 
            rotation={bodyState.r_knee.rotation} 
            scale={[0.22, 0.65, 0.22]} 
            onSelect={onSelect} 
            isSelected={selectedPart === 'r_knee'}
            onRotationChange={(rot) => onRotate('r_knee', rot)}
            type="calf"
          />
        </BodyPart>
      </BodyPart>
    </group>
  );
};

const DEFAULT_BODY_STATE = {
  pelvis: { rotation: [0, 0, 0] as [number, number, number] },
  torso: { rotation: [0, 0, 0] as [number, number, number] },
  head: { rotation: [0, 0, 0] as [number, number, number] },
  l_shoulder: { rotation: [0, 0, 0] as [number, number, number] },
  l_elbow: { rotation: [0, 0, 0] as [number, number, number] },
  r_shoulder: { rotation: [0, 0, 0] as [number, number, number] },
  r_elbow: { rotation: [0, 0, 0] as [number, number, number] },
  l_hip: { rotation: [0, 0, 0] as [number, number, number] },
  l_knee: { rotation: [0, 0, 0] as [number, number, number] },
  r_hip: { rotation: [0, 0, 0] as [number, number, number] },
  r_knee: { rotation: [0, 0, 0] as [number, number, number] },
};

interface AnatomyDollProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

const AnatomyDoll: React.FC<AnatomyDollProps> = ({ onCapture, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Model state configurations
  const [modelType, setModelType] = useState<'procedural' | 'supabase'>('procedural');
  const [selectedPart, setSelectedPart] = useState<string>('pelvis');
  const [bodyState, setBodyState] = useState(DEFAULT_BODY_STATE);
  
  // Supabase/Custom loading variables
  const [gltfModel, setGltfModel] = useState<any>(null);
  const [gltfRotations, setGltfRotations] = useState<Record<string, [number, number, number]>>({});
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState('https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character2.obj');

  // Attempt to load standard Supabase models on mount
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

    // If auto-detection fails, set descriptive message informing why fallback is active
    setSupabaseLoading(false);
    setSupabaseError("Supabase Model asset is missing. To load yours, update 'poses/anatomy_doll.glb' on Supabase, or paste a URL below.");
    setModelType('procedural');
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
    // Traverse meshes and enrich visual styles for beautiful rendering
    objGroup.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Give the OBJ mesh parts standard matte color if material is fresh/undefined or basic white
        if (!node.material || (Array.isArray(node.material) && node.material.length === 0)) {
          node.material = new THREE.MeshStandardMaterial({
            color: "#dfc8a5", // Rich timber timber representation
            roughness: 0.35,
            metalness: 0.05,
            side: THREE.DoubleSide
          });
        } else {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((mat: any) => {
            mat.side = THREE.DoubleSide;
            if (mat.color && (mat.color.getHex() === 0xffffff || mat.color.getHex() === 0xcccccc)) {
              mat.color.set("#dfc8a5"); // Warm aesthetic timber tone instead of plain grey/white
            }
          });
        }
      }
    });

    // Find children in the model to use as pose segments/bones
    const parts: string[] = [];
    objGroup.traverse((node: any) => {
      if (node.name && (node.isMesh || node.isGroup || node.isBone) && node !== objGroup) {
        parts.push(node.name);
      }
    });

    if (parts.length === 0) {
      // Auto-segment parts if they don't have explicit names so that we can select & manipulate segments!
      let meshIdx = 1;
      objGroup.traverse((node: any) => {
        if (node.isMesh) {
          node.name = node.name || `Body Part ${meshIdx++}`;
          parts.push(node.name);
        }
      });
    }

    const initialRotations: Record<string, [number, number, number]> = {};
    parts.forEach(p => {
      const obj = objGroup.getObjectByName(p);
      if (obj) {
        initialRotations[p] = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
      }
    });

    // Automatically align scale and position using a bounding box
    const box = new THREE.Box3().setFromObject(objGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Position model above grid and center it
    objGroup.position.x += (-center.x);
    objGroup.position.y += (-center.y) + size.y / 2 + 0.1; 
    objGroup.position.z += (-center.z);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = 2.2 / maxDim;
      objGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    // Embed under virtual gltf wrapper object so it integrates with existing canvas mechanics
    setGltfModel({ scene: objGroup });
    setGltfRotations(initialRotations);
    setModelUrl(url);
    if (parts.length > 0) {
      setSelectedPart(parts[0]);
    }
    setSupabaseLoaded(true);
    setSupabaseLoading(false);
    setModelType('supabase');
  };

  const applyLoadedGltfModel = (gltf: any, url: string) => {
    // Collect bones, or meshes/groups if un-rigged
    const parts: string[] = [];
    gltf.scene.traverse((node: any) => {
      if (node.isBone) {
        parts.push(node.name);
      }
    });
    
    if (parts.length === 0) {
      gltf.scene.traverse((node: any) => {
        if (node.name && (node.isMesh || node.isGroup) && node !== gltf.scene) {
          parts.push(node.name);
        }
      });
    }

    const initialRotations: Record<string, [number, number, number]> = {};
    parts.forEach(p => {
      const obj = gltf.scene.getObjectByName(p);
      if (obj) {
        initialRotations[p] = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
      }
    });

    // Automatically align scale and position using a bounding box
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Position model above grid and center it
    gltf.scene.position.x += (-center.x);
    gltf.scene.position.y += (-center.y) + size.y / 2 + 0.1; 
    gltf.scene.position.z += (-center.z);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = 2.2 / maxDim;
      gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    setGltfModel(gltf);
    setGltfRotations(initialRotations);
    setModelUrl(url);
    if (parts.length > 0) {
      setSelectedPart(parts[0]);
    }
    setSupabaseLoaded(true);
    setSupabaseLoading(false);
    setModelType('supabase');
  };

  const updateRotation = (axis: number, value: number) => {
    setBodyState(prev => {
      const newState = { ...prev };
      newState[selectedPart as keyof typeof bodyState] = {
        ...newState[selectedPart as keyof typeof bodyState],
        rotation: [...prev[selectedPart as keyof typeof bodyState].rotation] as [number, number, number]
      };
      newState[selectedPart as keyof typeof bodyState].rotation[axis] = value;
      return newState;
    });
  };

  const updateGltfRotation = (axis: number, value: number) => {
    setGltfRotations(prev => {
      const current = prev[selectedPart] || [0, 0, 0];
      const updated = [...current] as [number, number, number];
      updated[axis] = value;
      
      if (gltfModel) {
        const obj = gltfModel.scene.getObjectByName(selectedPart);
        if (obj) {
          obj.rotation.set(updated[0], updated[1], updated[2]);
        }
      }
      return {
        ...prev,
        [selectedPart]: updated
      };
    });
  };

  const handleManualRotate = (name: string, rot: [number, number, number]) => {
    setBodyState(prev => ({
      ...prev,
      [name]: { rotation: rot }
    }));
  };

  const handleCapture = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
    onCapture(dataUrl);
  };

  const resetMannequin = () => {
    if (modelType === 'supabase' && gltfModel) {
      const resetRots: Record<string, [number, number, number]> = {};
      Object.keys(gltfRotations).forEach(k => {
        resetRots[k] = [0, 0, 0];
        const obj = gltfModel.scene.getObjectByName(k);
        if (obj) {
          obj.rotation.set(0, 0, 0);
        }
      });
      setGltfRotations(resetRots);
    } else {
      setBodyState(DEFAULT_BODY_STATE);
    }
  };

  // Selection Indicator helper in 3D canvas
  const SelectedBoneHelper = () => {
    if (!gltfModel || modelType !== 'supabase' || !selectedPart) return null;
    const obj = gltfModel.scene.getObjectByName(selectedPart);
    if (!obj) return null;

    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);

    return (
      <group position={worldPos}>
        <axesHelper args={[0.35]} />
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.6} />
        </mesh>
      </group>
    );
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
                <OrbitControls makeDefault enablePan={false} minDistance={1.5} maxDistance={7} />
                
                <ambientLight intensity={0.9} />
                <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
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

                {modelType === 'supabase' && gltfModel ? (
                  <group position={[0, -0.6, 0]}>
                    <primitive 
                      object={gltfModel.scene} 
                      onClick={(e: any) => {
                        e.stopPropagation();
                        let current = e.object;
                        const keys = Object.keys(gltfRotations);
                        while (current && current !== gltfModel.scene) {
                          if (keys.includes(current.name)) {
                            setSelectedPart(current.name);
                            break;
                          }
                          current = current.parent;
                        }
                      }}
                    />
                    <SelectedBoneHelper />
                  </group>
                ) : (
                  <Mannequin 
                    selectedPart={selectedPart} 
                    bodyState={bodyState} 
                    onSelect={(name) => setSelectedPart(name)}
                    onRotate={handleManualRotate}
                  />
                )}
                
                <Environment preset="city" />
              </Canvas>
            </Suspense>
            
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
              <div className="px-6 py-3 bg-navy text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border-b-4 border-sky-400">
                <Move size={16} />
                Selected Part: <span className="text-sky-300 ml-1">{selectedPart.replace(/[_-]/g, ' ')}</span>
              </div>
              <div className="px-4 py-2 bg-white/95 backdrop-blur-sm border-2 border-navy/15 font-black text-navy text-[10px] rounded-xl shadow-lg flex items-center gap-2">
                <Database size={12} className="text-sky-500" />
                Active Source: <span className="text-orange-500 text-[11px] font-black uppercase tracking-wider">{modelType === 'supabase' ? 'Supabase 3D' : 'Articulated Timber'}</span>
              </div>
            </div>
            
            <button 
              onClick={() => alert(`How to pose:\n1. Drag the surrounding canvas scene to rotate your viewport perspective.\n2. Click any part of the doll to select it, or use the part dropdown list.\n3. Adjust precise sliders on the controller panel to rotate the selection.\n4. If using "Articulated Timber", feel free to directly drag the 3D ring gizmos that appear directly on active parts!`)}
              className="absolute bottom-6 left-6 p-4 bg-white border-4 border-navy rounded-[1.5rem] text-navy hover:bg-sky-50 transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              <HelpCircle size={28} strokeWidth={3} />
            </button>

            <div className="absolute bottom-6 right-6 hidden md:block px-4 py-2 bg-navy/10 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-navy/60">
              {modelType === 'supabase' ? 'Custom skeletal model' : 'Articulated high-fidelity fallback model'}
            </div>
          </div>

          {/* Right: Controller & Options Pane */}
          <div className="w-full lg:w-96 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar shrink-0">
            {/* Model Selector / Custom source segment */}
            <div className="bg-slate-50 p-5 border-4 border-navy rounded-[2.2rem] space-y-4">
              <h3 className="font-black text-navy text-md uppercase leading-none tracking-tight flex items-center gap-2">
                <Database size={18} className="text-sky-600" /> Model Source
              </h3>
              
              <div className="flex bg-navy/5 p-1 rounded-xl border border-navy/10">
                <button
                  type="button"
                  onClick={() => setModelType('procedural')}
                  className={`flex-1 py-1 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${modelType === 'procedural' ? 'bg-navy text-white shadow-md' : 'text-navy/50 hover:text-navy'}`}
                >
                  Procedural Timber
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (supabaseLoaded) {
                      setModelType('supabase');
                    } else {
                      autoDetectAndLoadSupabase();
                    }
                  }}
                  className={`flex-1 py-1 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${modelType === 'supabase' ? 'bg-navy text-white shadow-md' : 'text-navy/50 hover:text-navy'}`}
                >
                  Supabase GLTF {supabaseLoaded && "✓"}
                </button>
              </div>

              {/* Supabase Custom URL Loading Input */}
              <div className="space-y-2 pt-1 border-t border-navy/10">
                <div className="flex items-center gap-2 justify-between">
                  <label className="text-[10px] font-black uppercase text-navy/40 tracking-wider flex items-center gap-1">
                    <Link2 size={10} /> Model URL Path (Supabase / Public CDN):
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
                    placeholder="https://.../model.glb"
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

            {/* Bone & rotation precision values */}
            <div className="bg-slate-50 p-5 border-4 border-navy rounded-[2.2rem] space-y-5">
              <h3 className="font-black text-navy uppercase text-lg leading-none flex items-center gap-2">
                <div className="w-8 h-8 bg-navy text-white rounded-lg flex items-center justify-center">
                  <Box size={18} />
                </div>
                Bone Precision
              </h3>

              {/* List Dropdown for Supabase bones */}
              {modelType === 'supabase' && Object.keys(gltfRotations).length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-navy/50 tracking-wider">
                    Select Bone / Mesh:
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

              {modelType === 'procedural' && (
                <div className="grid grid-cols-2 gap-1 bg-navy/5 p-1 rounded-xl border border-navy/10 text-[9px] font-bold text-navy/70 text-center uppercase tracking-wider select-none shrink-0">
                  <div className={`p-1.5 rounded-lg ${selectedPart === 'pelvis' || selectedPart === 'torso' || selectedPart === 'head' ? 'bg-white text-navy font-black shadow-sm' : ''}`}>Core</div>
                  <div className={`p-1.5 rounded-lg ${selectedPart !== 'pelvis' && selectedPart !== 'torso' && selectedPart !== 'head' ? 'bg-white text-navy font-black shadow-sm' : ''}`}>Limbs</div>
                </div>
              )}

              <div className="space-y-5">
                {['X Rotation', 'Y Rotation', 'Z Rotation'].map((axis, i) => {
                  const val = modelType === 'supabase'
                    ? (gltfRotations[selectedPart] ? gltfRotations[selectedPart][i] : 0)
                    : (bodyState[selectedPart as keyof typeof bodyState]?.rotation[i] || 0);

                  const changeHandler = (v: number) => {
                    if (modelType === 'supabase') {
                      updateGltfRotation(i, v);
                    } else {
                      updateRotation(i, v);
                    }
                  };

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
                          onChange={(e) => changeHandler(parseFloat(e.target.value))}
                          className="w-full h-8 appearance-none bg-transparent cursor-pointer relative z-10 accent-sky-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interaction buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={resetMannequin}
                className="flex items-center justify-center gap-3 w-full py-4 bg-white border-4 border-navy text-navy rounded-2xl font-black uppercase tracking-wider hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all active:scale-95 cursor-pointer text-xs"
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
                <span className="text-[9px] uppercase font-bold opacity-60">Generate drawing tutorial</span>
              </button>
            </div>

            <div className="bg-sky-50 p-4 border border-navy/15 rounded-[1.8rem] flex gap-3 items-start">
              <div className="text-xl">💡</div>
              <p className="text-[10px] font-bold text-navy/70 leading-relaxed uppercase">
                <span className="text-navy">Master Tip:</span> For realistic posture, start with the <span className="text-navy">Pelvis</span> to balance gravity, then rotate the shoulders and hips.
              </p>
            </div>
          </div>
        </div>
       </motion.div>
    </div>
  );
};

export default AnatomyDoll;
