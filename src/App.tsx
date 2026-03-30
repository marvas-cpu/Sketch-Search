/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, User, Building2, TreeDeciduous, Menu, X, Github, Twitter, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<any | null>(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables are missing!');
        return;
      }

      const { data, error } = await supabase
        .from('tutorials')
        .select('*');
      
      if (error) {
        console.error('Error fetching tutorials:', error);
      } else {
        setTutorials(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching tutorials:', err);
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

  return (
    <div className="min-h-screen flex flex-col selection:bg-navy selection:text-white overflow-x-hidden">
      {/* Background Doodles (Cartoon Fun) */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 rotate-12"><Building2 size={120} /></div>
        <div className="absolute bottom-20 right-10 -rotate-12"><TreeDeciduous size={150} /></div>
        <div className="absolute top-1/2 left-1/4 -rotate-6"><User size={100} /></div>
        <div className="absolute top-1/3 right-1/4 rotate-45"><Search size={80} /></div>
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
          <span className="text-4xl font-bold tracking-tighter">POSE LAB</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-xl font-bold items-center">
          <a href="#" className="hover:scale-110 transition-transform hover:text-blue-600">TUTORIALS</a>
          <a href="#" className="hover:scale-110 transition-transform hover:text-blue-600">MY SKETCHES</a>
        </div>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-3 border-4 border-navy rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,128,1)]"
        >
          {isMenuOpen ? <X size={32} strokeWidth={3} /> : <Menu size={32} strokeWidth={3} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 top-[104px] bg-white z-40 flex flex-col items-center justify-center gap-10 text-5xl font-bold md:hidden"
          >
            <a href="#" onClick={() => setIsMenuOpen(false)}>TUTORIALS</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>MY SKETCHES</a>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow flex flex-col items-center px-6 pt-16 pb-32 relative z-10">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 w-full max-w-7xl">
          {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) ? (
            <div className="col-span-full text-center p-20 border-8 border-dashed border-red-600/20 rounded-[3rem] bg-red-50">
              <p className="text-4xl font-bold text-red-600">SUPABASE NOT CONFIGURED! ⚠️</p>
              <p className="text-xl font-bold mt-4 opacity-70">Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the AI Studio Secrets panel!</p>
            </div>
          ) : tutorials.length === 0 ? (
            <div className="col-span-full text-center p-20 border-8 border-dashed border-navy/20 rounded-[3rem]">
              <p className="text-4xl font-bold opacity-30">NO TUTORIALS YET! <br /> ADD THEM IN SUPABASE!</p>
            </div>
          ) : (
            tutorials.map((tutorial) => (
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
                  <div className="absolute top-6 right-6 bg-sky-400 border-4 border-navy px-4 py-1 rounded-full font-bold text-lg rotate-12">
                    {tutorial.difficulty || 'BEGINNER'}
                  </div>
                </div>
                <div className="p-8">
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
      </main>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {selectedTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white border-8 border-navy rounded-[4rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative shadow-[20px_20px_0px_0px_rgba(56,189,248,1)]"
            >
              <button 
                onClick={() => setSelectedTutorial(null)}
                className="absolute top-8 right-8 p-4 bg-navy text-white rounded-full hover:rotate-90 transition-transform z-10"
              >
                <X size={40} strokeWidth={4} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="bg-navy/5 border-r-8 border-navy">
                  <img 
                    src={selectedTutorial.image_url || `https://picsum.photos/seed/${selectedTutorial.id}/800/800`} 
                    alt={selectedTutorial.title}
                    className="w-full h-full object-contain p-12"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-12 md:p-20">
                  <div className="inline-block bg-sky-400 border-4 border-navy px-6 py-2 rounded-2xl font-bold text-2xl mb-8 -rotate-2">
                    {selectedTutorial.category || 'POSE STUDY'}
                  </div>
                  <h2 className="text-6xl font-bold mb-8 uppercase tracking-tighter leading-none">{selectedTutorial.title}</h2>
                  <p className="text-2xl opacity-80 mb-12 font-medium leading-relaxed">
                    {selectedTutorial.description}
                  </p>
                  
                  <div className="space-y-6">
                    <h4 className="text-3xl font-bold uppercase">Pro Tips:</h4>
                    <ul className="space-y-4">
                      {['Start with basic circles', 'Focus on the line of action', 'Keep your strokes loose!'].map((tip, i) => (
                        <li key={i} className="flex items-center gap-4 text-xl font-bold">
                          <div className="w-8 h-8 border-4 border-navy rounded-lg bg-sky-400 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button className="mt-16 w-full py-6 bg-navy text-white rounded-3xl text-3xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[8px_8px_0px_0px_rgba(56,189,248,1)]">
                    DOWNLOAD SKETCH
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-12 bg-navy text-white border-t-8 border-white relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-5xl font-bold mb-6 tracking-tighter">POSE LAB</div>
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
          © 2026 POSE LAB. KEEP SKETCHING!
        </div>
      </footer>
    </div>
  );
}
