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
  const [isAgentExpanded, setIsAgentExpanded] = useState(false);
  const canvasRef = useRef<p5Types | null>(null);
  const graphicsRef = useRef<p5Types.Graphics | null>(null);
  const imageRef = useRef<p5Types.Image | null>(null);

  const parsedPercentage = React.useMemo(() => {
    if (!feedback) return null;
    const match = feedback.match(/(\d+)\s*%/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val >= 0 && val <= 100) return val;
    }
    return null;
  }, [feedback]);

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

      {/* Floating Instructor Agent - Compact & Compressible emoji that expands on click */}
      <div className="fixed bottom-8 right-8 z-[150] flex flex-col items-end gap-3 font-sans">
        <AnimatePresence>
          {isAgentExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
              className="bg-white border-6 border-navy rounded-[2.5rem] p-6 shadow-[8px_8px_0px_0px_rgba(56,189,248,1)] w-[400px] max-w-[calc(100vw-2rem)] select-none text-navy flex flex-col gap-4"
            >
              {/* Header inside popup */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-400 border-4 border-navy rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm rotate-[-6deg]">
                    🎓
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight leading-none">Anatomy Tutor</h4>
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Interactive Coach</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAgentExpanded(false)}
                  className="w-8 h-8 rounded-full border-2 border-navy flex items-center justify-center font-black hover:bg-red-100 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Dynamic instruction status */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-navy/70 italic leading-snug">
                  "Hello artist! Let's see how you did on this pose! Sketch on the canvas, then ask me to calculate your accuracy."
                </p>

                {/* Score percentage view */}
                {parsedPercentage !== null ? (
                  <div className="bg-sky-50 border-4 border-navy rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    {/* Ring score */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="#cbd5e1"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="#38bdf8"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 26}
                          initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - parsedPercentage / 100) }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-navy">
                        {parsedPercentage}%
                      </div>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-[10px] uppercase text-sky-700 tracking-wider">Accuracy Score</h5>
                      <p className="font-extrabold text-sm uppercase leading-snug">
                        {parsedPercentage >= 75 ? 'Excellent Pose! 🌟' : parsedPercentage >= 40 ? 'Great Progress! 👍' : 'Keep practicing! 💪'}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Primary critical action button */}
                <button
                  type="button"
                  onClick={handleAiCheck}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-400 text-navy border-3 border-navy rounded-xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,128,1)] uppercase"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-navy" />
                      Evaluating Pose...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-navy" />
                      How did I do? (%)
                    </>
                  )}
                </button>

                {/* Feedback Body text */}
                <div className="max-h-60 overflow-y-auto pr-1 text-xs font-bold leading-relaxed scrollbar-thin custom-scrollbar">
                  {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-navy/50 italic animate-pulse">
                      <span>Analyzing line of action, pose weight & proportions...</span>
                    </div>
                  )}

                  {!isAnalyzing && feedback && (
                    <div className="space-y-3 bg-sky-50/50 border-2 border-navy/10 rounded-2xl p-4 mt-2">
                      <div className="flex items-center gap-1.5 text-sky-600 font-extrabold uppercase tracking-wider text-[10px]">
                        <MessageSquare size={12} strokeWidth={3} />
                        <span>COACH'S NOTES</span>
                      </div>
                      <p className="text-[13px] font-bold text-navy leading-relaxed">
                        {feedback}
                      </p>
                    </div>
                  )}

                  {!isAnalyzing && !feedback && (
                    <div className="text-center py-6 border-2 border-dashed border-navy/15 rounded-2xl text-navy/40 italic text-[11px]">
                      Ready for evaluation? Press "How did I do?" to receive your percentage score feedback!
                    </div>
                  )}
                </div>

                {/* Pro tip inside expanded agent window */}
                <div className="bg-navy p-4 rounded-2xl text-white text-[11px] leading-snug">
                  <span className="font-black text-sky-400 block mb-1 uppercase tracking-wider">🌟 Pro Tip:</span>
                  Pay attention to the <span className="text-sky-400">Line of Action</span>! It's the key curve following the main flow of human body movement.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating compact emoji coach trigger orb */}
        <button
          type="button"
          onClick={() => setIsAgentExpanded(prev => !prev)}
          className={`w-16 h-16 bg-sky-400 border-4 border-navy rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,128,1)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-3xl select-none cursor-pointer relative ${!isAgentExpanded ? 'animate-bounce' : ''}`}
          title="Ask Anatomy Tuto-Bot Coach"
        >
          🎓
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-navy text-[10px] items-center justify-center font-black text-white">!</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default SketchCanvas;
