import React, { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { X, Check, RotateCcw, Box, HelpCircle, Move, Database, AlertCircle, Link2, Sliders, RefreshCw, Sparkles } from 'lucide-react';
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

const getFriendlyPartName = (name: string): string => {
  if (!name) return 'None';
  
  const mappings: Record<string, string> = {
    'spine': 'Lower Spine (Pelvis)',
    'spine.001': 'Spine Lower-Mid',
    'spine.002': 'Spine Mid-Upper',
    'spine.003': 'Spine Upper',
    'spine.004': 'Neck Base',
    'spine.005': 'Neck Mid',
    'spine.006': 'Head Joint',
    'shoulder.L': 'Left Shoulder Joint',
    'upper_arm.L': 'Left Upper Arm (Bicep)',
    'forearm.L': 'Left Forearm (Elbow)',
    'hand.L': 'Left Hand (Wrist)',
    'shoulder.R': 'Right Shoulder Joint',
    'upper_arm.R': 'Right Upper Arm (Bicep)',
    'forearm.R': 'Right Forearm (Elbow)',
    'hand.R': 'Right Hand (Wrist)',
    'thigh.L': 'Left Thigh (Hip Joint)',
    'shin.L': 'Left Shin (Knee)',
    'foot.L': 'Left Foot (Ankle)',
    'toe.L': 'Left Toes',
    'thigh.R': 'Right Thigh (Hip Joint)',
    'shin.R': 'Right Shin (Knee)',
    'foot.R': 'Right Foot (Ankle)',
    'toe.R': 'Right Toes',
    'pelvis.L': 'Left Pelvis',
    'pelvis.R': 'Right Pelvis',
  };

  if (name.startsWith('thumb.')) {
    return `Left Thumb Joint ${name.split('.')[1] || ''}`;
  }
  if (name.startsWith('f_index.')) {
    return `Left Index Finger ${name.split('.')[1] || ''}`;
  }
  if (name.startsWith('f_middle.')) {
    return `Left Middle Finger ${name.split('.')[1] || ''}`;
  }
  if (name.startsWith('f_ring.')) {
    return `Left Ring Finger ${name.split('.')[1] || ''}`;
  }
  if (name.endsWith('.R')) {
    const base = name.substring(0, name.length - 2);
    if (base.startsWith('thumb.')) return `Right Thumb Joint ${base.split('.')[1] || ''}`;
    if (base.startsWith('f_index.')) return `Right Index Finger ${base.split('.')[1] || ''}`;
    if (base.startsWith('f_middle.')) return `Right Middle Finger ${base.split('.')[1] || ''}`;
    if (base.startsWith('f_ring.')) return `Right Ring Finger ${base.split('.')[1] || ''}`;
  }

  if (mappings[name]) return mappings[name];
  return name.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getPartPriority = (name: string): number => {
  if (name === 'spine') return 10;
  if (name.startsWith('spine.')) {
    const num = parseFloat(name.split('.')[1]) || 0;
    return 10 + num;
  }
  
  if (name.includes('upper_arm')) return 30;
  if (name.includes('forearm')) return 40;
  if (name.includes('hand')) return 50;
  
  if (name.includes('thigh')) return 60;
  if (name.includes('shin')) return 70;
  if (name.includes('foot')) return 80;
  
  if (name.includes('shoulder')) return 20;
  if (name.includes('pelvis')) return 25;
  
  if (name.includes('palm')) return 90;
  if (name.includes('f_index') || name.includes('thumb') || name.includes('f_middle') || name.includes('f_ring')) return 100;
  
  return 150;
};

const mapDEFToActualBone = (name: string): string => {
  let target = name;
  
  const rigifyToMixamo: Record<string, string> = {
    'DEF-spine': 'Spine',
    'DEF-spine.001': 'Spine1',
    'DEF-spine.002': 'Spine2',
    'DEF-spine.003': 'Spine2',
    'DEF-neck': 'Neck',
    'DEF-head': 'Head',
    'DEF-shoulder.L': 'LeftShoulder',
    'DEF-upper_arm.L': 'LeftArm',
    'DEF-forearm.L': 'LeftForeArm',
    'DEF-hand.L': 'LeftHand',
    'DEF-shoulder.R': 'RightShoulder',
    'DEF-upper_arm.R': 'RightArm',
    'DEF-forearm.R': 'RightForeArm',
    'DEF-hand.R': 'RightHand',
    'DEF-thigh.L': 'LeftUpLeg',
    'DEF-shin.L': 'LeftLeg',
    'DEF-foot.L': 'LeftFoot',
    'DEF-thigh.R': 'RightUpLeg',
    'DEF-shin.R': 'RightLeg',
    'DEF-foot.R': 'RightFoot'
  };

  if (rigifyToMixamo[target]) {
    return rigifyToMixamo[target];
  }

  // Strip DEF- prefix or mixamorig: prefix just in case
  if (target.startsWith('DEF-')) {
    target = target.substring(4);
  }
  if (target.toLowerCase().includes('mixamorig')) {
    target = target.replace(/mixamorig:?_?/i, '');
  }

  // Common aliases
  const aliases: Record<string, string> = {
    'upper_arm.l': 'LeftArm',
    'upper_arm_l': 'LeftArm',
    'upper_arm.r': 'RightArm',
    'upper_arm_r': 'RightArm',
    'forearm.l': 'LeftForeArm',
    'forearm_l': 'LeftForeArm',
    'forearm.r': 'RightForeArm',
    'forearm_r': 'RightForeArm',
    'neck': 'Neck',
    'head': 'Head',
    'spine': 'Spine',
    'spine.001': 'Spine1',
    'spine.002': 'Spine2',
    'thigh.l': 'LeftUpLeg',
    'thigh_l': 'LeftUpLeg',
    'thigh.r': 'RightUpLeg',
    'thigh_r': 'RightUpLeg',
    'shin.l': 'LeftLeg',
    'shin_l': 'LeftLeg',
    'shin.r': 'RightLeg',
    'shin_r': 'RightLeg',
    'foot.l': 'LeftFoot',
    'foot_l': 'LeftFoot',
    'foot.r': 'RightFoot',
    'foot_r': 'RightFoot',
    'hand.l': 'LeftHand',
    'hand_l': 'LeftHand',
    'hand.r': 'RightHand',
    'hand_r': 'RightHand',
  };

  if (aliases[target]) return aliases[target];
  if (aliases[target.toLowerCase()]) return aliases[target.toLowerCase()];

  return target;
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

  // Advanced sliders configurations
  const [activeSlidersTab, setActiveSlidersTab] = useState<'focused' | 'all'>('all');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    spine: true,
    leftArm: true,
    rightArm: true,
    leftLeg: true,
    rightLeg: true,
    other: false,
  });

  const groupedBones = useMemo(() => {
    const categories: Record<string, { label: string; bones: string[] }> = {
      spine: { label: 'Spine & Head 🧠', bones: [] },
      leftArm: { label: 'Left Arm & Hand 💪', bones: [] },
      rightArm: { label: 'Right Arm & Hand 🛡️', bones: [] },
      leftLeg: { label: 'Left Leg & Foot 🦵', bones: [] },
      rightLeg: { label: 'Right Leg & Foot 👟', bones: [] },
      other: { label: 'Other/Custom Joints ⚙️', bones: [] },
    };

    Object.keys(gltfRotations).forEach((part) => {
      const lower = part.toLowerCase();
      if (lower.includes('spine') || lower.includes('neck') || lower.includes('head')) {
        categories.spine.bones.push(part);
      } else if (lower.includes('leftarm') || lower.includes('leftshoulder') || lower.includes('leftforearm') || lower.includes('lefthand') || (lower.includes('.l') && (lower.includes('arm') || lower.includes('shoulder') || lower.includes('hand') || lower.includes('finger') || lower.includes('thumb')))) {
        categories.leftArm.bones.push(part);
      } else if (lower.includes('rightarm') || lower.includes('rightshoulder') || lower.includes('rightforearm') || lower.includes('righthand') || (lower.includes('.r') && (lower.includes('arm') || lower.includes('shoulder') || lower.includes('hand') || lower.includes('finger') || lower.includes('thumb')))) {
        categories.rightArm.bones.push(part);
      } else if (lower.includes('leftupleg') || lower.includes('leftleg') || lower.includes('leftfoot') || (lower.includes('.l') && (lower.includes('thigh') || lower.includes('shin') || lower.includes('foot') || lower.includes('toe') || lower.includes('leg')))) {
        categories.leftLeg.bones.push(part);
      } else if (lower.includes('rightupleg') || lower.includes('rightleg') || lower.includes('rightfoot') || (lower.includes('.r') && (lower.includes('thigh') || lower.includes('shin') || lower.includes('foot') || lower.includes('toe') || lower.includes('leg')))) {
        categories.rightLeg.bones.push(part);
      } else {
        categories.other.bones.push(part);
      }
    });

    return Object.entries(categories).filter(([_, cat]) => cat.bones.length > 0);
  }, [gltfRotations]);

  // Supabase / Custom model loading state
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState('https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll.glb');

  // Debug system logger to match user's custom template script feedback
  const [debugLogs, setDebugLogs] = useState<string[]>(['Αναμονή για εκκίνηση φόρτωσης...']);
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);

  const showLog = (message: string, isError = false) => {
    setDebugLogs(prev => [...prev, `${isError ? '❌ ' : 'ℹ️ '} ${message}`]);
  };

  // Helper inside component to pose joints from a Rigify/DEF payload
  const applyGeminiPose = (poseJson: Record<string, { x?: number; y?: number; z?: number }>) => {
    if (!gltfModel) {
      console.warn("The 3D mannequin model hasn't loaded yet.");
      return;
    }

    const updatedRotations = { ...gltfRotations };
    
    for (const rawBoneName in poseJson) {
      const actualName = mapDEFToActualBone(rawBoneName);
      const obj = gltfModel.scene.getObjectByName(actualName);
      if (obj) {
        const rotations = poseJson[rawBoneName];
        if (rotations.x !== undefined) obj.rotation.x = rotations.x;
        if (rotations.y !== undefined) obj.rotation.y = rotations.y;
        if (rotations.z !== undefined) obj.rotation.z = rotations.z;
        
        updatedRotations[actualName] = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
      } else {
        console.warn(`Bone mapping not found for direct Input Name: ${rawBoneName} (Mapped Name: ${actualName})`);
      }
    }
    
    setGltfRotations(updatedRotations);
  };

  // Sync global window functions
  useEffect(() => {
    if (gltfModel) {
      (window as any).applyGeminiPose = (poseJson: any) => {
        applyGeminiPose(poseJson);
      };
      
      (window as any).resetPose = () => {
        resetMannequin();
      };
      
      (window as any).testPose = () => {
        const fakePose = {
          "DEF-upper_arm.R": { "x": 1.2, "y": 0.0, "z": -0.5 },
          "DEF-forearm.R": { "x": 0.8, "y": 0.0, "z": 0.0 },
          "DEF-head": { "x": 0.0, "y": 0.4, "z": 0.0 }
        };
        applyGeminiPose(fakePose);
      };
    }
    
    return () => {
      delete (window as any).applyGeminiPose;
      delete (window as any).resetPose;
      delete (window as any).testPose;
    };
  }, [gltfModel, gltfRotations]);

  // Dynamic lil-gui overlay controller for testing major Mixamo rigged bone rotations
  useEffect(() => {
    if (!gltfModel) return;

    let guiInstance: any = null;

    const setupGui = () => {
      if (!(window as any).lil || !(window as any).lil.GUI) return;

      // Ensure any leftover GUI is destroyed first
      if ((window as any)._activeAnatomyDollGui) {
        try {
          (window as any)._activeAnatomyDollGui.destroy();
        } catch (e) {}
      }

      const GUI = (window as any).lil.GUI;
      guiInstance = new GUI({
        title: '🤸 Mannequin Bones Controller',
        autoPlace: true
      });
      (window as any)._activeAnatomyDollGui = guiInstance;

      const guiDom = guiInstance.domElement;
      if (guiDom) {
        guiDom.style.top = '100px';
        guiDom.style.right = '20px';
        guiDom.style.zIndex = '9999';
        guiDom.style.position = 'absolute';
      }

      // Add major Mixamo joints requested by user
      const targetBones = [
        { key: 'Head', label: 'Head 🧠' },
        { key: 'Spine', label: 'Spine 🦴' },
        { key: 'LeftArm', label: 'Left Upper Arm 💪' },
        { key: 'RightArm', label: 'Right Upper Arm 🛡️' },
        { key: 'LeftForeArm', label: 'Left Forearm 🦾' },
        { key: 'RightForeArm', label: 'Right Forearm 🦾' }
      ];

      targetBones.forEach((joint) => {
        const bone = gltfModel.scene.getObjectByName(joint.key);
        if (bone) {
          const folder = guiInstance.addFolder(joint.label);
          
          const syncRotation = () => {
            setGltfRotations(prev => ({
              ...prev,
              [joint.key]: [bone.rotation.x, bone.rotation.y, bone.rotation.z]
            }));
          };

          const limits = { min: -3.14, max: 3.14 };
          folder.add(bone.rotation, 'x', limits.min, limits.max, 0.01).name('Rotate X').onChange(syncRotation).listen();
          folder.add(bone.rotation, 'y', limits.min, limits.max, 0.01).name('Rotate Y').onChange(syncRotation).listen();
          folder.add(bone.rotation, 'z', limits.min, limits.max, 0.01).name('Rotate Z').onChange(syncRotation).listen();
          
          folder.open();
        }
      });
    };

    if (!(window as any).lil || !(window as any).lil.GUI) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/lil-gui@0.18';
      script.async = true;
      script.onload = () => {
        setupGui();
      };
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        if (guiInstance) {
          try {
            guiInstance.destroy();
          } catch (e) {}
        }
        if ((window as any)._activeAnatomyDollGui === guiInstance) {
          (window as any)._activeAnatomyDollGui = null;
        }
      };
    } else {
      setupGui();
      return () => {
        if (guiInstance) {
          try {
            guiInstance.destroy();
          } catch (e) {}
        }
        if ((window as any)._activeAnatomyDollGui === guiInstance) {
          (window as any)._activeAnatomyDollGui = null;
        }
      };
    }
  }, [gltfModel]);

  // Attempt to load standard Supabase model on mount
  useEffect(() => {
    try {
      showLog('Εκκίνηση Three.js...');
      showLog('Ζητείται το αρχείο από το Supabase...');
      autoDetectAndLoadSupabase();
    } catch (err: any) {
      showLog('ΚΡΙΣΙΜΟ ΣΦΑΛΜΑ ΚΩΔΙΚΑ: ' + (err.message || err), true);
    }
  }, []);

  const loadAnyModel = async (url: string): Promise<{ type: 'obj' | 'gltf'; data: any }> => {
    const isObj = url.toLowerCase().split('?')[0].endsWith('.obj') || url.toLowerCase().includes('.obj');
    if (isObj) {
      const loader = new OBJLoader();
      const obj = await new Promise<any>((resolve, reject) => {
        loader.load(url, resolve, (xhr) => {
          if (xhr.lengthComputable) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setDownloadPercent(percent);
          }
        }, reject);
      });
      return { type: 'obj', data: obj };
    } else {
      const loader = new GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(url, resolve, (xhr) => {
          if (xhr.lengthComputable) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setDownloadPercent(percent);
          }
        }, reject);
      });
      return { type: 'gltf', data: gltf };
    }
  };

  const autoDetectAndLoadSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseError(null);
    const candidates = [
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll.glb',
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character6.glb',
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character5.glb',
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character4.glb',
      'https://cfiecgwbfcebzvvyqfaw.supabase.co/storage/v1/object/public/3D%20Doll/Doll%20character3.glb',
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
    const errMsg = "Supabase Model asset is missing. Please ensure your storage bucket has public access or paste your model URL path below.";
    setSupabaseError(errMsg);
    showLog('ΣΦΑΛΜΑ THREE.JS ΚΑΤΑ ΤΗ ΦΟΡΤΩΣΗ: ' + errMsg, true);
  };

  const handleManualLoad = async (urlToLoad: string) => {
    if (!urlToLoad) return;
    setSupabaseLoading(true);
    setSupabaseError(null);
    showLog(`Μη αυτόματη φόρτωση URL: ${urlToLoad}...`);
    try {
      const result = await loadAnyModel(urlToLoad);
      if (result.type === 'obj') {
        applyLoadedObjModel(result.data, urlToLoad);
      } else {
        applyLoadedGltfModel(result.data, urlToLoad);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Failed to parse or fetch model. Check the CORS settings or URL endpoint.";
      setSupabaseError(errMsg);
      showLog('ΣΦΑΛΜΑ THREE.JS ΚΑΤΑ ΤΗ ΦΟΡΤΩΣΗ: ' + errMsg, true);
      setSupabaseLoading(false);
    }
  };

  const applyLoadedObjModel = (objGroup: any, url: string) => {
    showLog('Το αρχείο κατέβηκε επιτυχώς! Γίνεται εισαγωγή στη σκηνή...');
    // Determine if we need to auto-rig (only 1 mesh or LineSegments)
    let meshCount = 0;
    let sourceNode: any = null;
    objGroup.traverse((node: any) => {
      if (node.isMesh || node.isLineSegments || node.isLine) {
        meshCount++;
        if (!sourceNode) {
          sourceNode = node;
        }
      }
    });

    let puppet: THREE.Group;

    if (meshCount <= 1 && sourceNode && sourceNode.geometry) {
      console.log("Monolithic un-rigged OBJ detected! Performing high-precision programmatic anatomical rigging...");
      
      // Center the source geometry so coordinate calculations are 100% symmetric
      sourceNode.geometry.center();

      const originalGeom = sourceNode.geometry;
      // Convert to non-indexed to avoid indexing reference bugs during vertex chunk mapping
      const unindexedGeom = originalGeom.index ? originalGeom.toNonIndexed() : originalGeom.clone();
      const posAttr = unindexedGeom.getAttribute('position');

      if (posAttr) {
        // Anatomical joints mapping with exact symmetrical relative pivots & bounds
        const partsList = [
          { name: 'Head', filter: (x: number, y: number, z: number) => y > 1.15, pivot: [0, 1.25, 0] },
          { name: 'Torso', filter: (x: number, y: number, z: number) => y >= -0.4 && y <= 1.15 && x >= -0.35 && x <= 0.35, pivot: [0, 0.4, 0] },
          { name: 'Left_Upper_Arm', filter: (x: number, y: number, z: number) => x < -0.35 && y >= 0.2, pivot: [-0.45, 0.9, 0] },
          { name: 'Left_Forearm', filter: (x: number, y: number, z: number) => x < -0.35 && y < 0.2 && y >= -0.7, pivot: [-0.85, 0.1, 0] },
          { name: 'Left_Hand', filter: (x: number, y: number, z: number) => x < -0.35 && y < -0.7, pivot: [-1.25, -0.4, 0] },
          { name: 'Right_Upper_Arm', filter: (x: number, y: number, z: number) => x > 0.35 && y >= 0.2, pivot: [0.45, 0.9, 0] },
          { name: 'Right_Forearm', filter: (x: number, y: number, z: number) => x > 0.35 && y < 0.2 && y >= -0.7, pivot: [0.85, 0.1, 0] },
          { name: 'Right_Hand', filter: (x: number, y: number, z: number) => x > 0.35 && y < -0.7, pivot: [1.25, -0.4, 0] },
          { name: 'Left_Thigh', filter: (x: number, y: number, z: number) => x < 0 && y < -0.4 && y >= -1.2, pivot: [-0.25, -0.4, 0] },
          { name: 'Left_Shin', filter: (x: number, y: number, z: number) => x < 0 && y < -1.2, pivot: [-0.25, -1.2, 0] },
          { name: 'Right_Thigh', filter: (x: number, y: number, z: number) => x >= 0 && y < -0.4 && y >= -1.2, pivot: [0.25, -0.4, 0] },
          { name: 'Right_Shin', filter: (x: number, y: number, z: number) => x >= 0 && y < -1.2, pivot: [0.25, -1.2, 0] }
        ];

        const vertexCount = posAttr.count;
        const isLine = sourceNode.isLineSegments || sourceNode.isLine;
        const step = isLine ? 2 : 3;

        const partVertices: Record<string, number[]> = {};
        partsList.forEach(p => {
          partVertices[p.name] = [];
        });

        for (let i = 0; i < vertexCount; i += step) {
          let avgX = 0, avgY = 0, avgZ = 0;
          let count = 0;
          for (let s = 0; s < step; s++) {
            const idx = i + s;
            if (idx < vertexCount) {
              avgX += posAttr.getX(idx);
              avgY += posAttr.getY(idx);
              avgZ += posAttr.getZ(idx);
              count++;
            }
          }
          if (count > 0) {
            avgX /= count;
            avgY /= count;
            avgZ /= count;
          }

          let assignedPart = 'Torso';
          for (const p of partsList) {
            if (p.filter(avgX, avgY, avgZ)) {
              assignedPart = p.name;
              break;
            }
          }

          for (let s = 0; s < step; s++) {
            const idx = i + s;
            if (idx < vertexCount) {
              partVertices[assignedPart].push(
                posAttr.getX(idx),
                posAttr.getY(idx),
                posAttr.getZ(idx)
              );
            }
          }
        }

        puppet = new THREE.Group();
        puppet.name = "Puppet_Root";

        const groupByName: Record<string, THREE.Group> = {};
        partsList.forEach(p => {
          const group = new THREE.Group();
          group.name = p.name;
          group.position.set(p.pivot[0], p.pivot[1], p.pivot[2]);
          groupByName[p.name] = group;
        });

        partsList.forEach(p => {
          const name = p.name;
          const verts = partVertices[name];
          if (verts.length === 0) return;

          const geom = new THREE.BufferGeometry();
          const arr = new Float32Array(verts);
          geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));

          const pos = geom.getAttribute('position');
          if (pos) {
            for (let j = 0; j < pos.count; j++) {
              pos.setX(j, pos.getX(j) - p.pivot[0]);
              pos.setY(j, pos.getY(j) - p.pivot[1]);
              pos.setZ(j, pos.getZ(j) - p.pivot[2]);
            }
          }
          geom.computeBoundingBox();
          geom.computeBoundingSphere();

          let visualPart: THREE.Object3D;
          if (isLine) {
            visualPart = new THREE.LineSegments(
              geom,
              new THREE.LineBasicMaterial({ 
                color: '#475569', 
                linewidth: 2,
                transparent: true,
                opacity: 0.85
              })
            );
          } else {
            visualPart = new THREE.Mesh(
              geom,
              new THREE.MeshStandardMaterial({
                color: "#e2e8f0",
                roughness: 0.65,
                metalness: 0.1,
                side: THREE.DoubleSide
              })
            );
          }
          visualPart.name = name + "_Mesh";
          visualPart.castShadow = true;
          visualPart.receiveShadow = true;

          groupByName[name].add(visualPart);
        });

        const tPivot = partsList.find(p => p.name === 'Torso')!.pivot;
        const hPivot = partsList.find(p => p.name === 'Head')!.pivot;
        const luaPivot = partsList.find(p => p.name === 'Left_Upper_Arm')!.pivot;
        const lfaPivot = partsList.find(p => p.name === 'Left_Forearm')!.pivot;
        const lhPivot = partsList.find(p => p.name === 'Left_Hand')!.pivot;
        const ruaPivot = partsList.find(p => p.name === 'Right_Upper_Arm')!.pivot;
        const rfaPivot = partsList.find(p => p.name === 'Right_Forearm')!.pivot;
        const rhPivot = partsList.find(p => p.name === 'Right_Hand')!.pivot;
        const ltPivot = partsList.find(p => p.name === 'Left_Thigh')!.pivot;
        const lsPivot = partsList.find(p => p.name === 'Left_Shin')!.pivot;
        const rtPivot = partsList.find(p => p.name === 'Right_Thigh')!.pivot;
        const rsPivot = partsList.find(p => p.name === 'Right_Shin')!.pivot;

        puppet.add(groupByName['Torso']);

        groupByName['Head'].position.set(hPivot[0] - tPivot[0], hPivot[1] - tPivot[1], hPivot[2] - tPivot[2]);
        groupByName['Torso'].add(groupByName['Head']);

        groupByName['Left_Upper_Arm'].position.set(luaPivot[0] - tPivot[0], luaPivot[1] - tPivot[1], luaPivot[2] - tPivot[2]);
        groupByName['Torso'].add(groupByName['Left_Upper_Arm']);

        groupByName['Left_Forearm'].position.set(lfaPivot[0] - luaPivot[0], lfaPivot[1] - luaPivot[1], lfaPivot[2] - luaPivot[2]);
        groupByName['Left_Upper_Arm'].add(groupByName['Left_Forearm']);

        groupByName['Left_Hand'].position.set(lhPivot[0] - lfaPivot[0], lhPivot[1] - lfaPivot[1], lhPivot[2] - lfaPivot[2]);
        groupByName['Left_Forearm'].add(groupByName['Left_Hand']);

        groupByName['Right_Upper_Arm'].position.set(ruaPivot[0] - tPivot[0], ruaPivot[1] - tPivot[1], ruaPivot[2] - tPivot[2]);
        groupByName['Torso'].add(groupByName['Right_Upper_Arm']);

        groupByName['Right_Forearm'].position.set(rfaPivot[0] - ruaPivot[0], rfaPivot[1] - ruaPivot[1], rfaPivot[2] - ruaPivot[2]);
        groupByName['Right_Upper_Arm'].add(groupByName['Right_Forearm']);

        groupByName['Right_Hand'].position.set(rhPivot[0] - rfaPivot[0], rhPivot[1] - rfaPivot[1], rhPivot[2] - rfaPivot[2]);
        groupByName['Right_Forearm'].add(groupByName['Right_Hand']);

        groupByName['Left_Thigh'].position.set(ltPivot[0] - tPivot[0], ltPivot[1] - tPivot[1], ltPivot[2] - tPivot[2]);
        groupByName['Torso'].add(groupByName['Left_Thigh']);

        groupByName['Left_Shin'].position.set(lsPivot[0] - ltPivot[0], lsPivot[1] - ltPivot[1], lsPivot[2] - ltPivot[2]);
        groupByName['Left_Thigh'].add(groupByName['Left_Shin']);

        groupByName['Right_Thigh'].position.set(rtPivot[0] - tPivot[0], rtPivot[1] - tPivot[1], rtPivot[2] - tPivot[2]);
        groupByName['Torso'].add(groupByName['Right_Thigh']);

        groupByName['Right_Shin'].position.set(rsPivot[0] - rtPivot[0], rsPivot[1] - rtPivot[1], rsPivot[2] - rtPivot[2]);
        groupByName['Right_Thigh'].add(groupByName['Right_Shin']);

        const parts: string[] = partsList.map(p => p.name);
        const initialRotations: Record<string, [number, number, number]> = {};
        const initialPositions: Record<string, [number, number, number]> = {};
        parts.forEach(p => {
          const o = puppet.getObjectByName(p);
          if (o) {
            initialRotations[p] = [o.rotation.x, o.rotation.y, o.rotation.z];
            initialPositions[p] = [o.position.x, o.position.y, o.position.z];
          }
        });

        // 1. Scale puppet automatically to standard 1.8 units tall
        const box = new THREE.Box3().setFromObject(puppet);
        const size2 = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size2.x, size2.y, size2.z);
        if (maxDim > 0) {
          const scaleFactor = 1.8 / maxDim;
          puppet.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        puppet.updateMatrixWorld(true);

        // 2. Align puppet's horizontal center, and place bottom of feet exactly on the grid level (y = 0)
        const scaledBox2 = new THREE.Box3().setFromObject(puppet);
        const scaledCenter2 = scaledBox2.getCenter(new THREE.Vector3());
        puppet.position.x = -scaledCenter2.x;
        puppet.position.y = -scaledBox2.min.y;
        puppet.position.z = -scaledCenter2.z;

        setGltfModel({ scene: puppet });
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
        return;
      }
    }

    // Fallback standard un-rigged loader
    let meshIdx = 1;
    objGroup.traverse((node: any) => {
      if (node.isMesh || node.isLineSegments || node.isLine) {
        node.name = node.name || `Body_Part_${meshIdx++}`;
        node.castShadow = true;
        node.receiveShadow = true;
        
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

    const parts: string[] = [];
    objGroup.traverse((node: any) => {
      if (node.name && (node.isMesh || node.isGroup || node.isBone || node.isLineSegments || node.isLine) && node !== objGroup) {
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

    // --- ΕΠΙΘΕΤΙΚΟ ΑΥΤΟΜΑΤΟ ΖΟΟΜ ΚΑΙ ΕΥΡΕΣΗ ΜΟΝΤΕΛΟΥ ---
    const box = new THREE.Box3().setFromObject(objGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Αν το μοντέλο βγήκε τεράστιο ή μικρό από το Blender, το αναγκάζουμε να έρθει σε νορμάλ μέγεθος
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        // Αν το μοντέλο είναι π.χ. 100 μέτρα, το μικραίνουμε για να χωράει στην κάμερα
        const scaleFactor = 2.0 / maxDim;
        objGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Ξαναϋπολογίζουμε το κέντρο μετά το scale
        box.setFromObject(objGroup);
        box.getCenter(center);
    }

    // Μεταφέρουμε το μοντέλο ακριβώς στο κέντρο της οθόνης (0, 0, 0)
    objGroup.position.x += (objGroup.position.x - center.x);
    objGroup.position.y += (objGroup.position.y - center.y);
    objGroup.position.z += (objGroup.position.z - center.z);

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
    setDownloadPercent(null);
    showLog('Το μοντέλο τοποθετήθηκε με επιτυχία στην οθόνη!');
  };

  const applyLoadedGltfModel = (gltf: any, url: string) => {
    showLog('Το αρχείο κατέβηκε επιτυχώς! Γίνεται εισαγωγή στη σκηνή...');
    // Traverse to verify if the model actually has skeletal bone elements
    let hasBones = false;
    gltf.scene.traverse((node: any) => {
      if (node.isBone) {
        hasBones = true;
        if (node.name.toLowerCase().includes('mixamorig')) {
          const match = node.name.match(/mixamorig:?_?([a-zA-Z590-9_-]+)/i);
          if (match) {
            node.name = match[1];
          } else {
            node.name = node.name.replace(/mixamorig:?_?/i, '');
          }
        }
      }
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Traversal to collect targetable elements
    const parts: string[] = [];
    gltf.scene.traverse((node: any) => {
      if (node.name && node !== gltf.scene) {
        // If hasBones is true, we ONLY list/select bones to avoid listing skins or un-rigged components.
        if (hasBones) {
          if (node.isBone) {
            if (!parts.includes(node.name)) {
              parts.push(node.name);
            }
          }
        } else {
          if ((node.isMesh || node.isGroup) && !parts.includes(node.name)) {
            parts.push(node.name);
          }
        }
      }
    });

    // Sort parts so major skeletal limbs are listed first in the dropdown for beautiful UX
    parts.sort((a, b) => {
      const prioA = getPartPriority(a);
      const prioB = getPartPriority(b);
      if (prioA !== prioB) return prioA - prioB;
      return a.localeCompare(b);
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

    // --- ΕΠΙΘΕΤΙΚΟ ΑΥΤΟΜΑΤΟ ΖΟΟΜ ΚΑΙ ΕΥΡΕΣΗ ΜΟΝΤΕΛΟΥ ---
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Αν το μοντέλο βγήκε τεράστιο ή μικρό από το Blender, το αναγκάζουμε να έρθει σε νορμάλ μέγεθος
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        // Αν το μοντέλο είναι π.χ. 100 μέτρα, το μικραίνουμε για να χωράει στην κάμερα
        const scaleFactor = 2.0 / maxDim;
        gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Ξαναϋπολογίζουμε το κέντρο μετά το scale
        box.setFromObject(gltf.scene);
        box.getCenter(center);
    }

    // Μεταφέρουμε το μοντέλο ακριβώς στο κέντρο της οθόνης (0, 0, 0)
    gltf.scene.position.x += (gltf.scene.position.x - center.x);
    gltf.scene.position.y += (gltf.scene.position.y - center.y);
    gltf.scene.position.z += (gltf.scene.position.z - center.z);

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
    setDownloadPercent(null);
    showLog('Το μοντέλο τοποθετήθηκε με επιτυχία στην οθόνη!');
  };

  const updateBoneRotation = (boneName: string, axis: number, value: number) => {
    if (!gltfModel) return;
    const obj = gltfModel.scene.getObjectByName(boneName);
    if (obj) {
      obj.rotation.setComponent(axis, value);
      setGltfRotations(prev => ({
        ...prev,
        [boneName]: [obj.rotation.x, obj.rotation.y, obj.rotation.z]
      }));
    }
  };

  const updateGltfRotation = (axis: number, value: number) => {
    if (!selectedPart) return;
    updateBoneRotation(selectedPart, axis, value);
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
    
    // For a bone (which lacks vertices of its own), we render a nice glowing joint representation
    if (selectedObject.isBone) {
      const worldPos = new THREE.Vector3();
      selectedObject.getWorldPosition(worldPos);
      
      // Offset by the parent group's relative Y coordinate shift (-1.0)
      worldPos.y -= -1.0;
      
      return (
        <mesh position={[worldPos.x, worldPos.y, worldPos.z]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.8} />
        </mesh>
      );
    }
    
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
        space={transformMode === 'rotate' ? 'local' : 'world'}
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

            {/* Real-time System Debug Log to match user's custom template script feedback */}
            <div className="absolute bottom-4 left-4 right-4 bg-navy/95 border-2 border-slate-700/50 text-emerald-400 p-4 font-mono text-[11px] rounded-2xl max-h-[140px] overflow-y-auto z-30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-1">
              <div className="font-sans font-black text-[9px] uppercase tracking-widest text-[#5bc9ff] mb-1 pb-1 border-b border-slate-700/50 flex items-center justify-between">
                <span>System Debug Log / Διαγνωστικά Συστήματος</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-emerald-400 font-bold">● ACTIVE</span>
                </span>
              </div>
              <div className="flex flex-col gap-0.5 select-text">
                {debugLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    {log}
                  </div>
                ))}
                {downloadPercent !== null && downloadPercent < 100 && (
                  <div className="text-sky-300 font-bold flex items-center gap-1.5 animate-pulse">
                    <span>📥</span>
                    <span>Λήψη 3D Μοντέλου: {downloadPercent}%</span>
                  </div>
                )}
              </div>
            </div>
            
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
                <PerspectiveCamera makeDefault position={[0, 0.1, 3.2]} fov={40} />
                <OrbitControls makeDefault enablePan={true} minDistance={1} maxDistance={10} enabled={!isDragging} target={[0, 0, 0]} />
                
                <hemisphereLight args={[0xffffff, 0x444444, 1.2]} position={[0, 20, 0]} />
                <directionalLight intensity={1.0} position={[5, 10, 7.5]} castShadow />
                
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
                  <group position={[0, 0, 0]}>
                    <primitive 
                      object={gltfModel.scene} 
                      onClick={(e: any) => {
                        e.stopPropagation();
                        let current = e.object;
                        if (current) {
                          // High-precision bone selection using skeleton skin indices/weights
                          if (current.isSkinnedMesh && current.skeleton && current.geometry) {
                            const face = e.face;
                            const skinIndexAttr = current.geometry.getAttribute('skinIndex');
                            const skinWeightAttr = current.geometry.getAttribute('skinWeight');
                            
                            if (face && skinIndexAttr && skinWeightAttr) {
                              const vertexIndices = [face.a, face.b, face.c];
                              const boneWeights: Record<number, number> = {};
                              
                              vertexIndices.forEach(vIdx => {
                                for (let k = 0; k < 4; k++) {
                                  const bIdx = skinIndexAttr.getComponent(vIdx, k);
                                  const weight = skinWeightAttr.getComponent(vIdx, k);
                                  if (weight > 0.01) {
                                    boneWeights[bIdx] = (boneWeights[bIdx] || 0) + weight;
                                  }
                                }
                              });
                              
                              let bestBoneIdx = -1;
                              let maxWeight = -1;
                              for (const bIdxStr in boneWeights) {
                                const bIdx = parseInt(bIdxStr);
                                if (boneWeights[bIdx] > maxWeight) {
                                  maxWeight = boneWeights[bIdx];
                                  bestBoneIdx = bIdx;
                                }
                              }
                              
                              if (bestBoneIdx !== -1 && current.skeleton.bones[bestBoneIdx]) {
                                const clickedBone = current.skeleton.bones[bestBoneIdx];
                                if (clickedBone && clickedBone.name) {
                                  setSelectedPart(clickedBone.name);
                                  return;
                                }
                              }
                            }
                          }

                          // Fallback 1: Spatial bone proximity
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
                          
                          // Fallback 2: Name checking
                          if (current.name) {
                            let partName = current.name;
                            if (partName.endsWith('_Mesh')) {
                              partName = partName.replace('_Mesh', '');
                            }
                            setSelectedPart(partName);
                          }
                        }
                      }}
                    />
                    
                    {/* Render clickable and visible bone joint helper spheres so users can select and pose easily */}
                    {Object.keys(gltfRotations).map((partName) => {
                      const bone = gltfModel.scene.getObjectByName(partName);
                      if (!bone || !bone.isBone) return null;
                      
                      const worldPos = new THREE.Vector3();
                      bone.getWorldPosition(worldPos);
                      
                      // Convert from world space to parent group space (by subtracting parent group y position -1.0)
                      worldPos.y -= -1.0;
                      
                      const isSelected = selectedPart === partName;
                      
                      return (
                        <mesh 
                          key={`joint-helper-${partName}`} 
                          position={[worldPos.x, worldPos.y, worldPos.z]}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPart(partName);
                          }}
                        >
                          <sphereGeometry args={[isSelected ? 0.06 : 0.035, 16, 16]} />
                          <meshBasicMaterial 
                            color={isSelected ? "#00c4ff" : "#fbbf24"} 
                            transparent 
                            opacity={isSelected ? 0.95 : 0.65}
                            depthTest={false}
                          />
                        </mesh>
                      );
                    })}
                    
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
                Selected Joint: <span className="text-sky-300 ml-1">{selectedPart ? getFriendlyPartName(selectedPart) : 'None (Click to select)'}</span>
              </div>
              <div className="px-4 py-2 bg-white/95 backdrop-blur-sm border-2 border-navy/15 font-black text-navy text-[10px] rounded-xl shadow-lg flex items-center gap-2">
                <Database size={12} className="text-sky-500" />
                Active Model: <span className="text-orange-500 text-[11px] font-black uppercase tracking-wider">{modelUrl.substring(modelUrl.lastIndexOf('/') + 1) || 'Doll character6.glb'}</span>
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

            {/* AI Pose Controller Integration */}
            <div className="bg-slate-50 p-5 border-4 border-navy rounded-[2.2rem] space-y-4">
              <h3 className="font-black text-navy text-md uppercase leading-none tracking-tight flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600 animate-pulse animate-duration-1000" /> AI Pose Controller
              </h3>
              <p className="text-[11px] font-bold text-navy/70 leading-relaxed uppercase">
                Μόλις το Gemini επιστρέψει το JSON, η συνάρτηση <code className="bg-navy/10 px-1 py-0.5 rounded text-navy">applyGeminiPose()</code> θα αλλάξει την πόζα της κούκλας.
              </p>
              <button
                type="button"
                onClick={() => {
                  if ((window as any).testPose) {
                    (window as any).testPose();
                  }
                }}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,128,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> Δοκιμή Πόζας (Test Pose)
              </button>
            </div>

            {/* Mesh & rotation precision values */}
            <div className="bg-slate-50 p-5 border-4 border-navy rounded-[2.2rem] space-y-4">
              <h3 className="font-black text-navy uppercase text-lg leading-none flex items-center gap-2">
                <div className="w-8 h-8 bg-navy text-white rounded-lg flex items-center justify-center">
                  <Sliders size={18} />
                </div>
                Mannequin Pivot Edit
              </h3>

              {/* Tab Selector for Focused vs. All Bones */}
              <div className="flex bg-navy/5 p-1 rounded-xl border border-navy/10 select-none">
                <button
                  type="button"
                  onClick={() => setActiveSlidersTab('all')}
                  className={`flex-1 py-1.5 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${activeSlidersTab === 'all' ? 'bg-navy text-white shadow-md' : 'text-navy/50 hover:text-navy'}`}
                >
                  All Bones Sliders
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlidersTab('focused')}
                  className={`flex-1 py-1.5 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${activeSlidersTab === 'focused' ? 'bg-navy text-white shadow-md' : 'text-navy/50 hover:text-navy'}`}
                >
                  Selected Bone Only
                </button>
              </div>

              {activeSlidersTab === 'all' ? (
                <div className="space-y-3 pt-1">
                  <div className="bg-sky-50 p-2.5 border border-sky-200 rounded-xl text-[10px] font-bold text-navy/70 leading-relaxed uppercase">
                    💡 Click on any joint name to select and overlay 3D handles in viewport!
                  </div>
                  {groupedBones.map(([catKey, category]) => {
                    const isOpen = openCategories[catKey] || false;
                    return (
                      <div key={catKey} className="border-2 border-navy/15 rounded-2xl overflow-hidden bg-white/50">
                        <button
                          type="button"
                          onClick={() => setOpenCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                          className="w-full px-4 py-2.5 bg-navy/5 border-b-2 border-navy/5 text-left font-black text-[11px] uppercase tracking-wider text-navy flex justify-between items-center hover:bg-navy/10 transition-all"
                        >
                          <span>{category.label}</span>
                          <span className="text-xs">{isOpen ? '▼' : '▶'}</span>
                        </button>
                        
                        {isOpen && (
                          <div className="p-3 space-y-4 max-h-96 overflow-y-auto custom-scrollbar bg-white/20">
                            {category.bones.map((boneName) => {
                              const isBoneSelected = selectedPart === boneName;
                              return (
                                <div key={boneName} className={`space-y-2 p-2 rounded-xl border-2 transition-all ${isBoneSelected ? 'bg-sky-50 border-sky-300 shadow-sm' : 'border-transparent'}`}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPart(boneName)}
                                    className="w-full text-left font-black text-[10px] uppercase tracking-normal text-navy flex items-center justify-between"
                                  >
                                    <span className="truncate hover:text-sky-600 transition-colors">
                                      {isBoneSelected ? '● ' : ''}{getFriendlyPartName(boneName)}
                                    </span>
                                    <span className="text-[9px] text-navy/40 lowercase tracking-tight opacity-70">
                                      {boneName}
                                    </span>
                                  </button>
                                  
                                  <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-navy/5">
                                    {['X', 'Y', 'Z'].map((axisLabel, axisIdx) => {
                                      const val = gltfRotations[boneName] ? gltfRotations[boneName][axisIdx] : 0;
                                      return (
                                        <div key={`${boneName}-${axisLabel}`} className="flex items-center gap-2">
                                          <span className="text-[9px] font-black text-navy/50 w-3">{axisLabel}</span>
                                          <input 
                                            type="range"
                                            min={-Math.PI}
                                            max={Math.PI}
                                            step={0.01}
                                            value={val}
                                            onChange={(e) => updateBoneRotation(boneName, axisIdx, parseFloat(e.target.value))}
                                            className="flex-1 h-2 appearance-none bg-navy/10 cursor-pointer accent-sky-500 rounded-full"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-[9px] font-mono text-navy font-bold w-8 text-right bg-blue-50 px-1 py-0.5 rounded border border-blue-100/30">
                                            {Math.round(val * 180 / Math.PI)}°
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
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
                            {getFriendlyPartName(partName)}
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
              )}
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
