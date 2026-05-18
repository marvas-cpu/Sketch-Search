import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, PivotControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { X, Check, RotateCcw, Box, HelpCircle, Move } from 'lucide-react';

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

const BodyPart: React.FC<BoneProps> = ({ position, rotation, scale, color = "#f8fafc", name, onSelect, isSelected, children, onRotationChange }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <group position={position}>
      {isSelected ? (
        <PivotControls
          activeAxes={[true, true, true]}
          depthTest={false}
          anchor={[0, 0, 0]}
          scale={0.75}
          onDrag={(l) => {
            const rot = new THREE.Euler().setFromRotationMatrix(l);
            onRotationChange?.([rot.x, rot.y, rot.z]);
          }}
          disableAxes={true}
          disableSliders={true}
        >
          <mesh 
            ref={meshRef}
            rotation={rotation}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(name);
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <boxGeometry args={scale} />
            <meshStandardMaterial 
              color={isSelected ? "#38bdf8" : (hovered ? "#bae6fd" : color)} 
              roughness={0.1}
              metalness={0.1}
            />
          </mesh>
          <group rotation={rotation}>
            {children}
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
            <boxGeometry args={scale} />
            <meshStandardMaterial 
              color={isSelected ? "#38bdf8" : (hovered ? "#bae6fd" : color)} 
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          {children}
        </group>
      )}
    </group>
  );
};

const Mannequin: React.FC<{ selectedPart: string, bodyState: any, onSelect: (name: string) => void, onRotate: (name: string, rot: [number, number, number]) => void }> = ({ selectedPart, bodyState, onSelect, onRotate }) => {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Pelvis/Root */}
      <BodyPart 
        name="pelvis" 
        position={[0, 1.2, 0]} 
        rotation={bodyState.pelvis.rotation} 
        scale={[0.5, 0.35, 0.3]} 
        onSelect={onSelect} 
        isSelected={selectedPart === 'pelvis'}
        onRotationChange={(rot) => onRotate('pelvis', rot)}
      >
        {/* Torso */}
        <BodyPart 
          name="torso" 
          position={[0, 0.45, 0]} 
          rotation={bodyState.torso.rotation} 
          scale={[0.6, 0.75, 0.35]} 
          onSelect={onSelect} 
          isSelected={selectedPart === 'torso'}
          onRotationChange={(rot) => onRotate('torso', rot)}
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
          >
             <BodyPart 
                name="l_elbow" 
                position={[0, -0.45, 0]} 
                rotation={bodyState.l_elbow.rotation} 
                scale={[0.2, 0.45, 0.18]} 
                onSelect={onSelect} 
                isSelected={selectedPart === 'l_elbow'}
                onRotationChange={(rot) => onRotate('l_elbow', rot)}
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
          >
             <BodyPart 
                name="r_elbow" 
                position={[0, -0.45, 0]} 
                rotation={bodyState.r_elbow.rotation} 
                scale={[0.2, 0.45, 0.18]} 
                onSelect={onSelect} 
                isSelected={selectedPart === 'r_elbow'}
                onRotationChange={(rot) => onRotate('r_elbow', rot)}
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
        >
          <BodyPart 
            name="l_knee" 
            position={[0, -0.6, 0]} 
            rotation={bodyState.l_knee.rotation} 
            scale={[0.22, 0.65, 0.22]} 
            onSelect={onSelect} 
            isSelected={selectedPart === 'l_knee'}
            onRotationChange={(rot) => onRotate('l_knee', rot)}
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
        >
          <BodyPart 
            name="r_knee" 
            position={[0, -0.6, 0]} 
            rotation={bodyState.r_knee.rotation} 
            scale={[0.22, 0.65, 0.22]} 
            onSelect={onSelect} 
            isSelected={selectedPart === 'r_knee'}
            onRotationChange={(rot) => onRotate('r_knee', rot)}
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
  const [selectedPart, setSelectedPart] = useState<string>('pelvis');
  const [bodyState, setBodyState] = useState(DEFAULT_BODY_STATE);

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
    setBodyState(DEFAULT_BODY_STATE);
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
              <p className="font-bold text-navy/40 uppercase tracking-widest text-[10px] md:text-xs">Interactive Pose Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-navy text-white rounded-full hover:rotate-90 transition-transform">
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* 3D Scene Container */}
          <div className="flex-1 bg-slate-50 border-8 border-navy rounded-[2.5rem] overflow-hidden relative shadow-inner group">
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
                <color attach="background" args={['#f8fafc']} />
                <PerspectiveCamera makeDefault position={[0, 1.5, 5]} fov={40} />
                <OrbitControls makeDefault enablePan={false} minDistance={2} maxDistance={8} />
                
                <ambientLight intensity={0.8} />
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

                <Mannequin 
                  selectedPart={selectedPart} 
                  bodyState={bodyState} 
                  onSelect={(name) => setSelectedPart(name)}
                  onRotate={handleManualRotate}
                />
                
                <Environment preset="city" />
              </Canvas>
            </Suspense>
            
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
              <div className="px-6 py-3 bg-navy text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border-b-4 border-sky-400">
                <Move size={16} />
                Active: <span className="text-sky-300 ml-1">{selectedPart.replace('_', ' ')}</span>
              </div>
              <div className="px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-navy/10 font-bold text-navy text-[10px] rounded-xl shadow-sm">
                🖱️ ROTATE: LEFT CLICK DRAG
              </div>
              <div className="px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-navy/10 font-bold text-navy text-[10px] rounded-xl shadow-sm">
                🖐️ POSE: DRAG GIZMO ON BONE
              </div>
            </div>
            
            <button 
              onClick={() => alert('1. Click any body part to select it.\n2. Drag the rings (gizmo) appearing on the bone to rotate it directly.\n3. Or use the sliders on the right for precise adjustments.\n4. Drag the empty space to rotate your view.')}
              className="absolute bottom-6 left-6 p-4 bg-white border-4 border-navy rounded-[1.5rem] text-navy hover:bg-sky-50 transition-all shadow-lg hover:scale-110 active:scale-95"
            >
              <HelpCircle size={28} strokeWidth={3} />
            </button>

            <div className="absolute bottom-6 right-6 hidden md:block px-4 py-2 bg-navy/10 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-navy/40">
              High Precision 3D Engine
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar shrink-0">
            <div className="bg-slate-50 p-6 border-4 border-navy rounded-[2.5rem] space-y-6">
              <h3 className="font-black text-navy uppercase text-xl leading-none flex items-center gap-3">
                <div className="w-10 h-10 bg-navy text-white rounded-xl flex items-center justify-center">
                  <Box size={24} />
                </div>
                Bone Precision
              </h3>
              
              <div className="space-y-6">
                {['X Rotation', 'Y Rotation', 'Z Rotation'].map((axis, i) => (
                  <div key={axis} className="space-y-3">
                    <div className="flex justify-between items-center font-black text-navy uppercase tracking-widest text-[10px]">
                      <span>{axis}</span>
                      <div className="bg-navy text-white px-2 py-1 rounded-md text-[9px]">
                        {Math.round(bodyState[selectedPart as keyof typeof bodyState].rotation[i] * 180 / Math.PI)}°
                      </div>
                    </div>
                    <div className="relative flex items-center group">
                      <div className="absolute left-0 right-0 h-1.5 bg-navy/10 rounded-full" />
                      <input 
                        type="range"
                        min={-Math.PI}
                        max={Math.PI}
                        step={0.001}
                        value={bodyState[selectedPart as keyof typeof bodyState].rotation[i]}
                        onChange={(e) => updateRotation(i, parseFloat(e.target.value))}
                        className="w-full h-8 appearance-none bg-transparent cursor-pointer relative z-10 accent-sky-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={resetMannequin}
                className="flex items-center justify-center gap-3 w-full py-5 bg-white border-4 border-navy text-navy rounded-2xl font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all active:scale-95"
              >
                <RotateCcw size={22} strokeWidth={3} />
                Reset Skeleton
              </button>
              
              <button
                onClick={handleCapture}
                className="group flex flex-col items-center justify-center gap-1 w-full py-8 bg-sky-400 border-4 border-navy text-navy rounded-[2.5rem] font-black uppercase tracking-widest shadow-[10px_10px_0px_0px_rgba(0,0,128,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95"
              >
                <div className="flex items-center gap-3 text-3xl">
                  <Check size={36} strokeWidth={4} />
                  SAVE POSE
                </div>
                <span className="text-[10px] uppercase font-bold opacity-60">Generate drawing tutorial</span>
              </button>
            </div>

            <div className="bg-sky-50 p-5 border-2 border-navy/20 rounded-[2rem] flex gap-4 items-start">
              <div className="text-2xl mt-1">💡</div>
              <p className="text-[11px] font-bold text-navy/70 leading-relaxed uppercase">
                <span className="text-navy">Master Tip:</span> First, position the <span className="text-navy">Pelvis</span> to establish the center of gravity. Adjust <span className="text-navy">L_Shoulder</span> and <span className="text-navy">R_Shoulder</span> to define posture.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnatomyDoll;
