/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, User, Building2, TreeDeciduous, Menu, X, Github, Twitter, Info, Pencil, Palette, Eraser, Frame, Image as ImageIcon, Shapes, Smile, Star, Heart, Cloud, Sun, ZoomIn, ZoomOut, RotateCcw, Camera, Sparkles, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import SketchCanvas from './components/SketchCanvas';
import AnatomyDoll from './components/AnatomyDoll';

const SketchIcon = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <motion.div
    whileHover={{ scale: 1.1, rotate: [0, -2, 2, 0] }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center p-8 bg-white border-4 border-navy rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,128,1)] cursor-pointer group"
  >
    <div className="text-navy group-hover:text-blue-600 transition-colors">
      {children}
    </div>
    <span className="mt-4 text-xl font-bold uppercase tracking-wider">{label}</span>
  </motion.div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCapturingPose, setIsCapturingPose] = useState(false);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try tutorials_data first
      let { data, error: supabaseError } = await supabase
        .from('tutorials_data')
        .select('*');
      
      // If tutorials_data fails or is empty, try 'tutorials'
      if (supabaseError || !data || data.length === 0) {
        console.log('tutorials_data empty or error, trying tutorials table...');
        const fallback = await supabase
          .from('tutorials')
          .select('*');
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          supabaseError = null;
        } else if (supabaseError || fallback.error) {
          // If fallback also has an error, use the most relevant one
          supabaseError = supabaseError || fallback.error;
        }
      }
      
      if (supabaseError) {
        console.error('Error fetching tutorials:', supabaseError);
        setError(supabaseError.message);
        setTutorials([]);
      } else {
        setTutorials(data || []);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching tutorials:', err);
      setError(err.message || 'An unexpected error occurred');
      setTutorials([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-8 border-navy border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!selectedLevel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50 p-6 relative overflow-hidden">
        {/* Decorative background for the question screen */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-10 left-10"><Pencil size={120} className="rotate-12" /></div>
          <div className="absolute bottom-10 right-10"><ImageIcon size={150} className="-rotate-12" /></div>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white border-8 border-navy p-12 md:p-20 rounded-[3rem] shadow-[20px_20px_0px_0px_rgba(0,0,128,1)] text-center relative z-10 max-w-4xl w-full"
        >
          <div className="w-24 h-24 bg-sky-400 border-8 border-navy rounded-3xl flex items-center justify-center mx-auto mb-10 -rotate-6 shadow-xl">
            <User size={48} className="text-navy" strokeWidth={3} />
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-navy mb-4 tracking-tighter uppercase leading-none">
            Welcome Artist!
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-navy/60 mb-12 italic">
            "What level would you like to be?"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'Beginner', color: 'bg-green-400', desc: 'Starting my journey', icon: Star },
              { id: 'Average', color: 'bg-sky-400', desc: 'Feeling confident', icon: Star },
              { id: 'Pro', color: 'bg-orange-400', desc: 'Ready for a challenge', icon: Star },
              { id: '3D Doll', color: 'bg-indigo-400', desc: 'Pose a mannequin', icon: Box }
            ].map((level) => (
              <motion.button
                key={level.id}
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedLevel(level.id)}
                className="group flex flex-col items-center p-8 bg-white border-4 border-navy rounded-[2.5rem] hover:bg-sky-50 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,128,1)]"
              >
                <div className={`w-16 h-16 ${level.color} border-4 border-navy rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
                  <level.icon size={32} fill="navy" className="text-navy" />
                </div>
                <span className="text-3xl font-black text-navy mb-2 uppercase">{level.id}</span>
                <span className="text-sm font-bold opacity-40 uppercase tracking-widest text-center">{level.desc}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredTutorials = tutorials.filter(t => {
    const tutorialLevel = t.level || t.difficulty;
    if (!tutorialLevel) return false; // Hide tutorials with no level if a level is selected
    return tutorialLevel.toLowerCase() === selectedLevel?.toLowerCase();
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-navy selection:text-white overflow-x-hidden">
      {/* Background Doodles (Cartoon Fun) */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 rotate-12"><Building2 size={120} /></div>
        <div className="absolute bottom-20 right-10 -rotate-12"><TreeDeciduous size={150} /></div>
        <div className="absolute top-1/2 left-1/4 -rotate-6"><User size={100} /></div>
        <div className="absolute top-1/3 right-1/4 rotate-45"><Search size={80} /></div>
        <div className="absolute top-10 right-1/3 -rotate-12"><Pencil size={90} /></div>
        <div className="absolute bottom-1/4 left-10 rotate-12"><Palette size={110} /></div>
        <div className="absolute top-1/4 right-10 -rotate-45"><Eraser size={70} /></div>
        <div className="absolute bottom-10 left-1/3 rotate-6"><Frame size={130} /></div>
        <div className="absolute top-1/2 right-1/3 rotate-12"><ImageIcon size={100} /></div>
        <div className="absolute bottom-1/3 right-1/4 -rotate-12"><Shapes size={120} /></div>
        <div className="absolute top-1/4 left-1/3 rotate-45"><Smile size={80} /></div>
        <div className="absolute bottom-1/2 left-1/4 -rotate-12"><Star size={90} /></div>
        <div className="absolute top-10 left-1/2 -rotate-6"><Heart size={70} /></div>
        <div className="absolute top-3/4 right-10 rotate-12"><Cloud size={140} /></div>
        <div className="absolute top-5 right-5 rotate-12"><Sun size={100} /></div>
        <div className="absolute bottom-1/2 right-10 -rotate-12 opacity-10"><User size={80} /></div>
        <div className="absolute top-1/4 left-1/2 rotate-12 opacity-10"><User size={60} /></div>
        <div className="absolute bottom-10 right-1/2 -rotate-45 opacity-10"><User size={110} /></div>
      </div>

      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center bg-white border-b-8 border-navy sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ rotate: [3, -3, 3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-12 h-12 border-4 border-navy rounded-xl flex items-center justify-center bg-sky-400"
          >
            <User size={28} strokeWidth={3} />
          </motion.div>
          <span className="text-4xl font-bold tracking-tighter">SKETCH SEARCH</span>
        </div>

        {selectedLevel && (
          <div className="flex items-center gap-4">
            <span className="hidden md:block font-black text-navy opacity-40 uppercase tracking-widest text-xs">Level</span>
            <div className="flex gap-2 bg-navy/5 p-2 rounded-2xl border-4 border-navy/10 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
              {['Beginner', 'Average', 'Pro', '3D Doll'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-4 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    selectedLevel === level 
                      ? 'bg-navy text-white shadow-lg' 
                      : 'hover:bg-navy/10 text-navy/60'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu removed as links were requested to be removed */}

      <main className="flex-grow flex flex-col items-center px-6 pt-32 pb-32 relative z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-20"
        >
          <h1 className="text-7xl md:text-9xl font-bold mb-6 leading-none tracking-tighter">
            MASTER THE <br />
            <span className="bg-navy text-white px-8 py-2 inline-block -rotate-2 rounded-3xl shadow-[10px_10px_0px_0px_rgba(56,189,248,1)]">HUMAN BODY</span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold opacity-80 max-w-3xl mx-auto mt-8">
            Pick a pose and start sketching! Our cartoon-style tutorials will guide you through every muscle and bone.
          </p>
        </motion.div>

        {/* Tutorial Grid */}
        {selectedLevel === '3D Doll' ? (
          <div className="w-full max-w-4xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border-8 border-navy p-12 md:p-20 rounded-[3rem] shadow-[20px_20px_0px_0px_rgba(79,70,229,1)] text-center"
            >
              <div className="w-24 h-24 bg-indigo-400 border-8 border-navy rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3 shadow-xl">
                <Box size={48} className="text-navy" strokeWidth={3} />
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-navy mb-6 tracking-tighter uppercase leading-none">
                3D ANATOMY DOLL
              </h2>
              <p className="text-xl md:text-2xl font-bold text-navy/70 mb-12 max-w-2xl mx-auto">
                Pose the mannequin however you like! Create your own target for a sketch study.
              </p>
              <button 
                onClick={() => setIsCapturingPose(true)}
                className="group flex items-center gap-4 px-12 py-6 bg-navy text-white rounded-[2.5rem] font-black uppercase tracking-widest text-2xl shadow-[10px_10px_0px_0px_rgba(56,189,248,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all mx-auto"
              >
                <Sparkles size={32} className="group-hover:rotate-12 transition-transform" />
                Open 3D Studio
              </button>
            </motion.div>

            {isCapturingPose && (
              <AnatomyDoll 
                onCapture={(imageUrl) => {
                  setIsCapturingPose(false);
                  setSelectedTutorial({
                    id: 'custom-pose',
                    title: 'Your 3D Pose',
                    description: 'A pose manually created using the 3D Anatomy Doll. Can you replicate it?',
                    image_url: imageUrl,
                    level: '3D Doll'
                  });
                }}
                onClose={() => setIsCapturingPose(false)}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 w-full max-w-7xl">
            {error ? (
            <div className="col-span-full text-center p-20 border-8 border-dashed border-red-600/20 rounded-[3rem] bg-red-50">
              <p className="text-4xl font-bold text-red-600">FETCH ERROR! ⚠️</p>
              <p className="text-xl font-bold mt-4 opacity-70">{error}</p>
              <button 
                onClick={fetchTutorials}
                className="mt-8 px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:scale-105 transition-transform"
              >
                TRY AGAIN
              </button>
            </div>
          ) : filteredTutorials.length === 0 ? (
            <div className="col-span-full text-center p-20 border-8 border-dashed border-navy/20 rounded-[3rem]">
              <p className="text-4xl font-bold opacity-30">NO {selectedLevel.toUpperCase()} TUTORIALS YET! <br /> ADD THEM IN SUPABASE!</p>
            </div>
          ) : (
            filteredTutorials.map((tutorial) => (
              <motion.button
                key={tutorial.id}
                whileHover={{ scale: 1.05, rotate: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTutorial(tutorial)}
                className="group relative bg-white border-8 border-navy rounded-[3rem] overflow-hidden shadow-[15px_15px_0px_0px_rgba(0,0,128,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all text-left"
              >
                <div className="aspect-square bg-navy/5 border-b-8 border-navy relative overflow-hidden">
                  <img 
                    src={tutorial.image_url || `https://picsum.photos/seed/${tutorial.id}/600/600`} 
                    alt={tutorial.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 border-navy ${
                      (tutorial.level || tutorial.difficulty)?.toLowerCase() === 'beginner' ? 'bg-green-400' :
                      (tutorial.level || tutorial.difficulty)?.toLowerCase() === 'average' ? 'bg-sky-400' :
                      'bg-orange-400'
                    }`}>
                      {tutorial.level || tutorial.difficulty}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2 uppercase tracking-tight">{tutorial.title}</h3>
                  <p className="text-xl opacity-70 line-clamp-2 font-medium">{tutorial.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-navy font-bold text-xl">
                    <span>START SKETCHING</span>
                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Search size={24} strokeWidth={3} />
                    </motion.div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      )}
    </main>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {selectedTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-sky-50 overflow-y-auto"
          >
            <div className="min-h-screen p-6 md:p-12 relative">
              <button 
                onClick={() => {
                  setSelectedTutorial(null);
                  setZoomLevel(1);
                }}
                className="absolute top-8 right-8 p-4 bg-navy text-white rounded-full hover:rotate-90 transition-transform z-50 shadow-[5px_5px_0px_0px_rgba(56,189,248,1)]"
              >
                <X size={40} strokeWidth={4} />
              </button>

              <div className="max-w-[1600px] mx-auto">
                <div className="mb-12">
                  <div className="inline-block bg-sky-400 border-4 border-navy px-6 py-2 rounded-2xl font-bold text-2xl mb-6 -rotate-2">
                    {selectedTutorial.category || 'POSE STUDY'}
                  </div>
                  <h2 className="text-6xl md:text-8xl font-bold mb-4 uppercase tracking-tighter leading-none">{selectedTutorial.title}</h2>
                  <p className="text-2xl opacity-80 font-medium leading-relaxed max-w-4xl">
                    {selectedTutorial.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  {/* Left Column: Reference Pose */}
                  <div className="lg:col-span-4 space-y-8">
                    <h3 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-4">
                      <div className="w-8 h-8 border-4 border-navy rounded-lg bg-sky-400" />
                      Reference Pose
                    </h3>
                    <div className="w-full h-[600px] overflow-auto border-8 border-navy rounded-[3rem] bg-navy/5 shadow-[15px_15px_0px_0px_rgba(0,0,128,1)] relative group">
                      <div className="absolute top-6 right-6 flex flex-col gap-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
                          className="p-3 bg-white border-4 border-navy rounded-xl hover:bg-sky-100 transition-colors shadow-sm"
                          title="Zoom In"
                        >
                          <ZoomIn size={24} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                          className="p-3 bg-white border-4 border-navy rounded-xl hover:bg-sky-100 transition-colors shadow-sm"
                          title="Zoom Out"
                        >
                          <ZoomOut size={24} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => setZoomLevel(1)}
                          className="p-3 bg-white border-4 border-navy rounded-xl hover:bg-sky-100 transition-colors shadow-sm"
                          title="Reset Zoom"
                        >
                          <RotateCcw size={24} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="min-w-full min-h-full flex items-start justify-center p-12">
                        <motion.div
                          animate={{ 
                            width: `${zoomLevel * 100}%`,
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          className="flex-shrink-0"
                        >
                          <img 
                            src={selectedTutorial.image_url || `https://picsum.photos/seed/${selectedTutorial.id}/1200/1200`} 
                            alt={selectedTutorial.title}
                            className="w-full h-auto object-contain rounded-2xl"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sketch Canvas */}
                  <div className="lg:col-span-8 space-y-8">
                    <h3 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-4">
                      <div className="w-8 h-8 border-4 border-navy rounded-lg bg-sky-400" />
                      Your Canvas
                    </h3>
                    <div className="w-full flex justify-center">
                      <SketchCanvas 
                        tutorialTitle={selectedTutorial.title} 
                        tutorialDescription={selectedTutorial.description} 
                        imageUrl={selectedTutorial.image_url || `https://picsum.photos/seed/${selectedTutorial.id}/1200/1200`}
                        tutorialLevel={selectedTutorial.level || selectedTutorial.difficulty}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-12 bg-navy text-white border-t-8 border-white relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-5xl font-bold mb-6 tracking-tighter">SKETCH SEARCH</div>
            <p className="text-xl opacity-70 max-w-md font-bold">
              Learn to draw the human body with our fun, sketchy tutorials. No talent required, just a pencil and a dream!
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-bold mb-8 uppercase tracking-widest">Socials</h4>
            <div className="flex gap-8">
              <a href="#" className="hover:scale-150 transition-transform hover:text-sky-400"><Twitter size={32} strokeWidth={3} /></a>
              <a href="#" className="hover:scale-150 transition-transform hover:text-sky-400"><Github size={32} strokeWidth={3} /></a>
              <a href="#" className="hover:scale-150 transition-transform hover:text-sky-400"><Info size={32} strokeWidth={3} /></a>
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-bold mb-8 uppercase tracking-widest">Legal Stuff</h4>
            <ul className="space-y-4 opacity-70 font-bold text-lg">
              <li><a href="#" className="hover:opacity-100 hover:text-sky-400">Privacy</a></li>
              <li><a href="#" className="hover:opacity-100 hover:text-sky-400">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-12 border-t-4 border-white/20 text-center opacity-50 font-black text-xl tracking-widest">
          © 2026 SKETCH SEARCH. KEEP SKETCHING!
        </div>
      </footer>
    </div>
  );
}
