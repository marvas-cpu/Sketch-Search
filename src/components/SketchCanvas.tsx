import React, { useState, useRef } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';
import { Pencil, Eraser, Trash2, Sparkles, Loader2, Download, Frame } from 'lucide-react';
import { getSketchFeedback } from '../lib/gemini';

interface SketchCanvasProps {
  tutorialTitle: string;
  tutorialDescription: string;
  imageUrl: string;
}

const SketchCanvas: React.FC<SketchCanvasProps> = ({ tutorialTitle, tutorialDescription, imageUrl }) => {
  const [mode, setMode] = useState<'pencil' | 'eraser'>('pencil');
  const [isTracing, setIsTracing] = useState(true);
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
      p5.image(imageRef.current, 0, 0, p5.width, p5.height);
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
        g.stroke(0);
        g.strokeWeight(4);
      } else {
        // For eraser in composite mode, we can use erase() if p5 supports it or just draw white
        // Snippet says stroke(255)
        g.stroke(255);
        g.strokeWeight(30);
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
          link.download = `${tutorialTitle.toLowerCase().replace(/\s+/g, '-')}-sketch.png`;
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
        const aiFeedback = await getSketchFeedback(imageUri, tutorialTitle, tutorialDescription);
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
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-wrap justify-center gap-4 p-4 bg-white border-4 border-navy rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,128,1)]">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('pencil')}
            className={`p-3 rounded-xl transition-all ${mode === 'pencil' ? 'bg-sky-400 text-navy border-2 border-navy' : 'hover:bg-sky-100'}`}
            title="Pencil"
          >
            <Pencil size={24} strokeWidth={3} />
          </button>
          <button
            onClick={() => setMode('eraser')}
            className={`p-3 rounded-xl transition-all ${mode === 'eraser' ? 'bg-sky-400 text-navy border-2 border-navy' : 'hover:bg-sky-100'}`}
            title="Eraser"
          >
            <Eraser size={24} strokeWidth={3} />
          </button>
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

        <button
          onClick={handleAiCheck}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {isAnalyzing ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Sparkles size={24} />
          )}
          {isAnalyzing ? 'ANALYZING...' : 'AI CHECK'}
        </button>
      </div>

      <div className="relative border-8 border-navy rounded-[2rem] overflow-hidden bg-white shadow-[10px_10px_0px_0px_rgba(0,0,128,1)] max-w-full [&>div>canvas]:max-w-full [&>div>canvas]:h-auto">
        <Sketch preload={preload} setup={setup} draw={draw} />
      </div>

      {feedback && (
        <div className="w-full max-w-lg p-6 bg-sky-50 border-4 border-sky-400 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
          <h4 className="text-xl font-bold text-navy mb-2 flex items-center gap-2">
            <Sparkles size={20} className="text-sky-500" />
            AI FEEDBACK
          </h4>
          <p className="text-lg font-medium text-navy/80 leading-relaxed">
            {feedback}
          </p>
        </div>
      )}
    </div>
  );
};

export default SketchCanvas;
