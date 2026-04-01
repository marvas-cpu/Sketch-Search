import React, { useState, useRef } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';
import { Pencil, Eraser, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { getSketchFeedback } from '../lib/gemini';

interface SketchCanvasProps {
  tutorialTitle: string;
  tutorialDescription: string;
}

const SketchCanvas: React.FC<SketchCanvasProps> = ({ tutorialTitle, tutorialDescription }) => {
  const [mode, setMode] = useState<'pencil' | 'eraser'>('pencil');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canvasRef = useRef<p5Types | null>(null);

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(500, 500).parent(canvasParentRef);
    p5.background(255);
    canvasRef.current = p5;
  };

  const draw = (p5: p5Types) => {
    if (p5.mouseIsPressed) {
      if (mode === 'pencil') {
        p5.stroke(0);
        p5.strokeWeight(4);
      } else {
        p5.stroke(255);
        p5.strokeWeight(30);
      }
      p5.line(p5.mouseX, p5.mouseY, p5.pmouseX, p5.pmouseY);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.background(255);
      setFeedback(null);
    }
  };

  const handleAiCheck = async () => {
    if (!canvasRef.current) return;
    
    setIsAnalyzing(true);
    setFeedback(null);
    
    try {
      // Get canvas as base64 image
      const canvasElement = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvasElement) {
        const imageUri = canvasElement.toDataURL('image/png');
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
      <div className="flex gap-4 p-4 bg-white border-4 border-navy rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,128,1)]">
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
        <div className="w-px bg-navy/20 mx-2" />
        <button
          onClick={clearCanvas}
          className="p-3 rounded-xl hover:bg-red-100 text-red-600 transition-all"
          title="Clear Canvas"
        >
          <Trash2 size={24} strokeWidth={3} />
        </button>
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

      <div className="relative border-8 border-navy rounded-[2rem] overflow-hidden bg-white shadow-[10px_10px_0px_0px_rgba(0,0,128,1)]">
        <Sketch setup={setup} draw={draw} />
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
