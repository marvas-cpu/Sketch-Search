import React, { useState, useRef } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';
import { Pencil, Eraser, Trash2, Sparkles, Loader2, Download, Frame, ZoomIn, ZoomOut, RotateCcw, GraduationCap, MessageSquare, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSketchFeedback } from '../lib/gemini';

interface SketchCanvasProps {
  tutorialTitle: string;
  tutorialDescription: string;
  imageUrl: string;
  tutorialLevel?: string;
}

const SketchCanvas: React.FC<SketchCanvasProps> = ({ tutorialTitle, tutorialDescription, imageUrl, tutorialLevel }) => {
  const [mode, setMode] = useState<'pencil' | 'eraser'>('pencil');
  const [pencilSize, setPencilSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(30);
  const [isTracing, setIsTracing] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canvasRef = useRef<p5Types | null>(null);
  const graphicsRef = useRef<p5Types.Graphics | null>(null);
  const imageRef = useRef<p5Types.Image | null>(null);

  const preload = (p5: p5Types) => {
    if (imageUrl) {
      imageRef.current = p5.loadImage(imageUrl);
    }
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(900, 900).parent(canvasParentRef);
    graphicsRef.current = p5.createGraphics(900, 900);
    graphicsRef.current.background(255, 0); // Transparent background for graphics
    canvasRef.current = p5;
  };

  const draw = (p5: p5Types) => {
    p5.background(255);
    
    // Draw reference image with opacity if tracing is enabled
    if (isTracing && imageRef.current) {
      p5.tint(255, 100); // 100/255 opacity
      
      const img = imageRef.current;
      const scale = Math.min(p5.width / img.width, p5.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (p5.width - w) / 2;
      const y = (p5.height - h) / 2;
      
      p5.image(img, x, y, w, h);
      p5.noTint();
    }

    // Draw user's sketch
    if (graphicsRef.current) {
      p5.image(graphicsRef.current, 0, 0);
    }

    // Handle user drawing
    if (p5.mouseIsPressed && graphicsRef.current) {
      const g = graphicsRef.current;
      if (mode === 'pencil') {
        (g as any).noErase();
        g.stroke(0);
        g.strokeWeight(pencilSize);
      } else {
        (g as any).erase();
        g.strokeWeight(eraserSize);
      }
      g.line(p5.mouseX, p5.mouseY, p5.pmouseX, p5.pmouseY);
    }
  };

  const clearCanvas = () => {
    if (graphicsRef.current) {
      graphicsRef.current.clear();
      graphicsRef.current.background(255, 0);
      setFeedback(null);
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      // We want to download the sketch, maybe without the reference image?
      // Usually users want just their work.
      if (graphicsRef.current) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 900;
        tempCanvas.height = 900;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 900, 900);
          // Draw the graphics layer
          const graphicsCanvas = (graphicsRef.current as any).canvas;
          ctx.drawImage(graphicsCanvas, 0, 0);
          
          const link = document.createElement('a');
          link.download = 'my-animation-sketch.png';
          link.href = tempCanvas.toDataURL('image/png');
          link.click();
        }
      }
    }
  };

  const handleAiCheck = async () => {
    if (!graphicsRef.current) return;
    
    setIsAnalyzing(true);
    setFeedback(null);
    
    try {
      // Get only the user's sketch for AI analysis
      const graphicsCanvas = (graphicsRef.current as any).canvas as HTMLCanvasElement;
      
      // We need it on a white background for better AI recognition
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 900;
      tempCanvas.height = 900;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 900, 900);
        ctx.drawImage(graphicsCanvas, 0, 0);
        
        const imageUri = tempCanvas.toDataURL('image/png');
        const aiFeedback = await getSketchFeedback(imageUri, tutorialTitle, tutorialDescription, tutorialLevel);
        setFeedback(aiFeedback || "Great job! Keep practicing.");
      }
    } catch (error) {
      console.error("Error analyzing sketch:", error);
      setFeedback("Oops! Something went wrong while analyzing your sketch.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-7xl mx-auto">
      {/* Top Section: Canvas Controls and Drawing */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex flex-wrap justify-center gap-4 p-4 bg-white border-4 border-navy rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,128,1)] w-fit">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setMode('pencil')}
                className={`p-3 rounded-xl transition-all ${mode === 'pencil' ? 'bg-sky-400 text-navy border-2 border-navy' : 'hover:bg-sky-100'}`}
                title="Pencil"
              >
                <Pencil size={24} strokeWidth={3} />
              </button>
              {mode === 'pencil' && (
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={pencilSize} 
                  onChange={(e) => setPencilSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-navy/20 rounded-lg appearance-none cursor-pointer accent-navy"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setMode('eraser')}
                className={`p-3 rounded-xl transition-all ${mode === 'eraser' ? 'bg-sky-400 text-navy border-2 border-navy' : 'hover:bg-sky-100'}`}
                title="Eraser"
              >
                <Eraser size={24} strokeWidth={3} />
              </button>
              {mode === 'eraser' && (
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={eraserSize} 
                  onChange={(e) => setEraserSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-navy/20 rounded-lg appearance-none cursor-pointer accent-navy"
                />
              )}
            </div>
          </div>

          <div className="w-px bg-navy/20 mx-2 hidden sm:block" />

          <div className="flex gap-2">
            <button
              onClick={() => setIsTracing(!isTracing)}
              className={`p-3 rounded-xl transition-all ${isTracing ? 'bg-sky-400 text-navy border-2 border-navy' : 'hover:bg-sky-100 text-navy/50'}`}
              title="Toggle Reference Opacity"
            >
              <Frame size={24} strokeWidth={3} />
            </button>
            <button
              onClick={clearCanvas}
              className="p-3 rounded-xl hover:bg-red-100 text-red-600 transition-all border-2 border-transparent hover:border-red-600"
              title="Clear Canvas"
            >
              <Trash2 size={24} strokeWidth={3} />
            </button>
            <button
              onClick={handleDownload}
              className="p-3 rounded-xl hover:bg-sky-100 text-navy transition-all border-2 border-transparent hover:border-navy"
              title="Download Sketch"
            >
              <Download size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="w-px bg-navy/20 mx-2 hidden sm:block" />

          <div className="flex gap-2">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
              className="p-3 bg-white border-4 border-navy rounded-xl hover:bg-sky-100 transition-colors shadow-sm text-navy"
              title="Zoom In"
            >
              <ZoomIn size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
              className="p-3 bg-white border-4 border-navy rounded-xl hover:bg-sky-100 transition-colors shadow-sm text-navy"
              title="Zoom Out"
            >
              <ZoomOut size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={() => setZoomLevel(1)}
              className="p-3 bg-white border-4 border-navy rounded-xl hover:bg-sky-100 transition-colors shadow-sm text-navy"
              title="Reset Zoom"
            >
              <RotateCcw size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="relative border-8 border-navy rounded-[2rem] overflow-auto bg-white shadow-[10px_10px_0px_0px_rgba(0,0,128,1)] w-full h-[600px] flex items-start justify-center group scrollbar-thin scrollbar-thumb-navy scrollbar-track-transparent">
          <motion.div
            animate={{ 
              width: `${zoomLevel * 900}px`,
              height: `${zoomLevel * 900}px`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 origin-top"
          >
            <div className="[&>div>canvas]:!w-full [&>div>canvas]:!h-full">
              <Sketch preload={preload} setup={setup} draw={draw} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Section: Instructor Agent */}
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div className="bg-white border-8 border-navy rounded-[3rem] p-8 shadow-[10px_10px_0px_0px_rgba(56,189,248,1)] relative overflow-visible">
          {/* Instructor Character Avatar */}
          <div className="absolute -top-12 -left-6 w-24 h-24 bg-sky-400 border-8 border-navy rounded-3xl flex items-center justify-center rotate-[-12deg] shadow-lg animate-bounce">
            <GraduationCap size={48} className="text-navy" strokeWidth={3} />
          </div>

          <div className="mt-8">
            <div className="inline-block bg-navy text-white px-4 py-1 rounded-lg font-bold text-sm mb-4">
              CHARACTER ANIMATOR
            </div>
            <h4 className="text-3xl font-bold text-navy mb-2 leading-none uppercase tracking-tighter">Your Instructor</h4>
            <p className="text-xl font-medium text-navy/60 italic mb-6">"Hello artist! Let's master this pose together!"</p>
            
            <button
              onClick={handleAiCheck}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-sky-400 text-navy border-4 border-navy rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-[6px_6px_0px_0px_rgba(0,0,128,1)]"
            >
              {isAnalyzing ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Sparkles size={24} />
              )}
              {isAnalyzing ? 'ANALYZING...' : 'CRITIQUE MY WORK'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {feedback ? (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-8 relative"
              >
                {/* Speech Bubble Tail */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-sky-50 border-t-4 border-l-4 border-navy rotate-45 z-0" />
                
                <div className="bg-sky-50 border-4 border-navy rounded-3xl p-6 relative z-10 shadow-inner">
                  <div className="flex items-center gap-2 mb-3 text-sky-600 font-bold">
                    <MessageSquare size={20} strokeWidth={3} />
                    <span>INSTRUCTOR'S NOTES</span>
                  </div>
                  <p className="text-lg font-bold text-navy leading-relaxed">
                    {feedback}
                  </p>
                </div>
              </motion.div>
            ) : !isAnalyzing && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 p-6 border-4 border-dashed border-navy/20 rounded-3xl text-center"
              >
                <p className="font-bold opacity-30 italic">Ready for feedback? <br /> Press the button above!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pro Tip Card */}
        <div className="bg-navy p-6 rounded-[2rem] text-white">
          <h5 className="font-black flex items-center gap-2 mb-2 uppercase tracking-widest text-sky-400">
            <Star size={16} fill="currentColor" />
            Pro Tip
          </h5>
          <p className="font-bold opacity-90 leading-snug">
            Pay attention to the <span className="text-sky-400">Line of Action</span>! It's the imaginary curve that follows the main flow of the body's movement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SketchCanvas;
