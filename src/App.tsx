/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, User, Building2, TreeDeciduous, Menu, X, Github, Twitter, Info, Pencil, Palette, Eraser, Frame, Image as ImageIcon, Shapes, Smile, Star, Heart, Cloud, Sun, Moon, ZoomIn, ZoomOut, RotateCcw, Camera, Sparkles, Box, Trash2, Check, UploadCloud } from 'lucide-react';
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

const ENRICHED_DATA_MAP: Record<string, { description: string; category: string }> = {
  "you name it_pose": {
    description: "A relaxed, leaning pose that plays with a strong line of action through the spine and a tilted hip line.",
    category: "Relaxed Postures"
  },
  "casual_pose": {
    description: "Classic upright standing stance with weight shifted onto one leg, creating high organic fluidity and subtle contrast curves.",
    category: "Casual Expressions"
  },
  "casual_pose2": {
    description: "A comfortable, laid-back stature emphasizing natural skeletal resting states and a curving torso line.",
    category: "Casual Expressions"
  },
  "casual_pose3": {
    description: "A resting stance showing comfortable body language, asymmetrical balance, and soft arm curves.",
    category: "Casual Expressions"
  },
  "cute_pose": {
    description: "An adorable, charming posture featuring inward-angled knees and a tilted head angle illustrating classic anime squash and stretch.",
    category: "Cute & Playful"
  },
  "dynamic_pose": {
    description: "An energetic action stance showing extreme movement and dramatic angles. Pay attention to the dramatic diagonal line of action!",
    category: "High Action"
  },
  "battle_pose": {
    description: "A vigilant combat readiness stance with bent knees and raised arms to deflect attacks. Perfect for action sketches.",
    category: "Martial Arts"
  },
  "battle_pose2": {
    description: "A crouched, compact defensive stance focusing on low weight distribution, coiled power, and readiness to strike.",
    category: "Martial Arts"
  },
  "hero_pose": {
    description: "The iconic superhero stance! Chest proudly puffed out, fists firmly planted on hips, and feet wide apart.",
    category: "Heroic Stances"
  },
  "hero_pose2": {
    description: "An alternative hero landing or dynamic power pose displaying extreme kinetic tension and balanced joints.",
    category: "Heroic Stances"
  },
  "standing_pose": {
    description: "A balanced symmetrical standing pose. Excellent for studying exact body proportions and anatomical alignment.",
    category: "Anatomical Basics"
  },
  "standing_pose2": {
    description: "A solid, formal posture with centered weight, straight-forward gaze, and clear perpendicular alignment lines.",
    category: "Anatomical Basics"
  },
  "action_pose": {
    description: "A high-momentum snapshot of movement, displaying twist in the pelvis and dynamic foreshortening of the limbs.",
    category: "High Action"
  },
  "walking_pose": {
    description: "A single frame of a walking cycle, illustrating weight shift, forward lean, and organic counter-balancing of legs and arms.",
    category: "Basics of Motion"
  },
  "karate_pose": {
    description: "A refined martial arts side guard showing deep stability, centered gravity, and sharp, straight-line limb projections.",
    category: "Martial Arts"
  },
  "stylish_pose": {
    description: "An elegant, stylized fashion posture showing off dramatic curves in the shoulder-hip angles and extended limbs.",
    category: "Stylized Outlines"
  },
  "body language_pose": {
    description: "The body speaks! A highly communicative and conversational posture displaying active arm gestures and an organic spine curve.",
    category: "Gesture Drawing"
  },
  "silly_pose": {
    description: "An amusing, cartoonish pose with exaggerated joints, off-kilter weight, and funny lines of action to capture personality.",
    category: "Cute & Playful"
  }
};

const getEnrichedData = (title: string) => {
  const normalized = title.trim().toLowerCase().replace(/[\r\n]+/g, '');
  for (const key in ENRICHED_DATA_MAP) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return ENRICHED_DATA_MAP[key];
    }
  }
  return {
    description: "A wonderful custom anatomy sketch reference to hone your character sketching skills.",
    category: "Pose Study"
  };
};

const normalizeLevel = (levelInput: string): string => {
  if (!levelInput) return '';
  const lvl = levelInput.trim().toLowerCase();
  if (lvl.startsWith('beg') || lvl.includes('begin') || lvl.includes('begg')) {
    return 'Beginner';
  }
  if (lvl.startsWith('av') || lvl.includes('average')) {
    return 'Average';
  }
  if (lvl.startsWith('pr') || lvl.includes('pro')) {
    return 'Pro';
  }
  if (lvl.includes('doll') || lvl.includes('3d')) {
    return '3D Doll';
  }
  return levelInput;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [customTutorials, setCustomTutorials] = useState<any[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCapturingPose, setIsCapturingPose] = useState(false);

  // Form states for custom storage updates
  const [savingPoseUrl, setSavingPoseUrl] = useState<string | null>(null);
  const [newTutorialTitle, setNewTutorialTitle] = useState('');
  const [newTutorialDesc, setNewTutorialDesc] = useState('');
  const [newTutorialLevel, setNewTutorialLevel] = useState('Beginner');
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    fetchTutorials();
    // Load custom tutorials from localStorage
    const saved = localStorage.getItem('sketch_search_custom_tutorials');
    if (saved) {
      try {
        setCustomTutorials(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing custom tutorials', e);
      }
    }
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

  const handleSaveNewTutorial = async (title: string, desc: string, level: string, url: string, isManual: boolean) => {
    const cleanTitle = title.trim();
    if (!cleanTitle || !url) return;

    setIsSaving(true);
    let finalImageUrl = url;

    // Direct Base64 Data URI check, perfect for snapshots and local file uploads
    if (url.startsWith('data:')) {
      try {
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });

        // Generate a clean slug or key for the uploaded image file name
        const cleanName = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const filename = `${isManual ? 'upload' : 'doll'}-${cleanName}-${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('poses')
          .upload(filename, blob, {
            contentType: mime,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image to poses bucket:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('poses')
            .getPublicUrl(filename);
          
          if (publicUrlData?.publicUrl) {
            finalImageUrl = publicUrlData.publicUrl;
            console.log('Successfully uploaded file to Supabase Storage!', finalImageUrl);
          }
        }
      } catch (err) {
        console.error('Failed to upload image blob:', err);
      }
    }

    const newTutorial = {
      id: `custom-${Date.now()}`,
      title: cleanTitle,
      description: desc.trim() || (isManual ? 'A custom reference pose study.' : 'A custom 3D mannequin pose study.'),
      image_url: finalImageUrl,
      level: level,
      difficulty: level,
      category: isManual ? 'MANUAL REFERENCE' : 'CUSTOM POSE',
      custom: true,
      created_at: new Date().toISOString()
    };

    // 1. Instantly update local/cache state so there is zero delay for the user
    const updated = [newTutorial, ...customTutorials];
    setCustomTutorials(updated);
    localStorage.setItem('sketch_search_custom_tutorials', JSON.stringify(updated));

    // 2. Clear states and set selection
    setSelectedTutorial(newTutorial);
    setSelectedLevel(level);

    // 3. Try to write to Supabase (so they are persistent and become EXACTLY part of the main dataset for everyone)
    try {
      const payload = {
        title: newTutorial.title,
        description: newTutorial.description,
        image_url: newTutorial.image_url,
        level: newTutorial.level,
        difficulty: newTutorial.level,
        category: newTutorial.category
      };

      // Try inserting into tutorials_data
      const { data: d1, error: e1 } = await supabase
        .from('tutorials_data')
        .insert([payload])
        .select();
      console.log('Inserted into tutorials_data Result:', d1, e1);

      // Try inserting into tutorials
      if (e1) {
        const { data: d2, error: e2 } = await supabase
          .from('tutorials')
          .insert([payload])
          .select();
        console.log('Inserted into tutorials Result:', d2, e2);
      }

      // Fetch the latest tutorials so that the user sees it directly from Supabase!
      await fetchTutorials();
    } catch (err) {
      console.error('Error writing tutorial to database:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white'}`}>
        <div className={`w-16 h-16 border-8 border-t-transparent rounded-full animate-spin ${isDarkMode ? 'border-sky-400' : 'border-navy'}`}></div>
      </div>
    );
  }

  if (!selectedLevel) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-sky-50 text-navy'}`}>
        {/* Decorative background for the question screen */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-10 left-10"><Pencil size={120} className="rotate-12" /></div>
          <div className="absolute bottom-10 right-10"><ImageIcon size={150} className="-rotate-12" /></div>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-12 md:p-20 rounded-[3rem] text-center relative z-10 max-w-4xl w-full border-8 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 shadow-[20px_20px_0px_0px_rgba(56,189,248,0.2)]' 
              : 'bg-white border-navy shadow-[20px_20px_0px_0px_rgba(0,0,128,1)]'
          }`}
        >
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-10 -rotate-6 shadow-xl border-8 transition-colors duration-300 ${
            isDarkMode ? 'bg-sky-450 border-slate-800 text-slate-900' : 'bg-sky-400 border-navy text-navy'
          }`}>
            <User size={48} className={isDarkMode ? 'text-slate-950' : 'text-navy'} strokeWidth={3} />
          </div>
          
          <h2 className={`text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase leading-none transition-colors duration-300 ${isDarkMode ? 'text-slate-100' : 'text-navy'}`}>
            Welcome Artist!
          </h2>
          <p className={`text-2xl md:text-3xl font-bold mb-12 italic transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-navy/60'}`}>
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
                className={`group flex flex-col items-center p-8 border-4 rounded-[2.5rem] transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-705 shadow-[8px_8px_0px_0px_rgba(56,189,248,0.15)]' 
                    : 'bg-white border-navy text-navy hover:bg-sky-50 shadow-[8px_8px_0px_0px_rgba(0,0,128,1)]'
                }`}
              >
                <div className={`w-16 h-16 ${level.color} border-4 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform ${isDarkMode ? 'border-slate-800' : 'border-navy'}`}>
                  <level.icon size={32} fill={isDarkMode ? '#0f172a' : 'navy'} className={isDarkMode ? 'text-slate-900' : 'text-navy'} />
                </div>
                <span className="text-3xl font-black mb-2 uppercase">{level.id}</span>
                <span className={`text-sm font-bold uppercase tracking-widest text-center transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'opacity-40 text-navy'}`}>{level.desc}</span>
              </motion.button>
            ))}
          </div>

          {/* Quick theme toggler button within the box */}
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-4 font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-sky-450 hover:bg-slate-700' 
                  : 'bg-sky-100 border-navy text-navy hover:bg-sky-200'
              }`}
            >
              {isDarkMode ? <Sun size={14} className="text-yellow-400 animate-pulse" /> : <Moon size={14} className="text-blue-800" />}
              <span>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const allTutorials = (() => {
    // Trim titles and enrich default metadata
    const enrichedDb = tutorials.map(t => {
      const cleanTitle = t.title ? t.title.trim().replace(/[\r\n]+/g, '') : 'Pose Study';
      const enrichment = getEnrichedData(cleanTitle);
      const rawLevel = t.level || t.difficulty || 'Beginner';
      const normLevel = normalizeLevel(rawLevel);
      return {
        ...t,
        title: cleanTitle,
        description: t.description || enrichment.description,
        category: t.category || enrichment.category,
        level: normLevel,
        difficulty: normLevel
      };
    });

    const enrichedCustom = customTutorials.map(t => {
      const normLevel = normalizeLevel(t.level || t.difficulty || 'Beginner');
      return {
        ...t,
        level: normLevel,
        difficulty: normLevel
      };
    });

    return [...enrichedDb, ...enrichedCustom].filter(t => {
      const isHello = t.title.toLowerCase().includes('hello');
      const isPro = t.level?.toLowerCase() === 'pro' || t.difficulty?.toLowerCase() === 'pro';
      return !(isHello && isPro);
    });
  })();

  const filteredTutorials = allTutorials.filter(t => {
    const tutorialLevel = t.level || t.difficulty;
    if (!tutorialLevel) return false;
    return normalizeLevel(tutorialLevel).toLowerCase() === normalizeLevel(selectedLevel || '').toLowerCase();
  });

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-100 selection:bg-slate-100 selection:text-slate-900' 
        : 'bg-white text-navy selection:bg-navy selection:text-white'
    }`}>
      {/* Background Doodles (Cartoon Fun) */}
      <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-300 ${
        isDarkMode ? 'text-slate-150 opacity-[0.03]' : 'text-navy opacity-5'
      }`}>
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
      <nav className={`p-6 flex justify-between items-center border-b-8 sticky top-0 z-50 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 border-b-8 border-slate-800' : 'bg-white border-b-8 border-navy'
      }`}>
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ rotate: [3, -3, 3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className={`w-12 h-12 border-4 rounded-xl flex items-center justify-center bg-sky-400 transition-colors duration-300 ${
              isDarkMode ? 'border-slate-800' : 'border-navy'
            }`}
          >
            <User size={28} strokeWidth={3} className={isDarkMode ? 'text-slate-950' : 'text-navy'} />
          </motion.div>
          <span className="text-4xl font-bold tracking-tighter">SKETCH SEARCH</span>
        </div>

        {selectedLevel && (
          <div className="flex items-center gap-4">
            <span className={`hidden md:block font-black uppercase tracking-widest text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-slate-400' : 'text-navy opacity-40'
            }`}>Level</span>
            <div className={`flex gap-2 p-2 rounded-2xl border-4 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-800 border-slate-705' : 'bg-navy/5 border-navy/10'
            }`}>
              {['Beginner', 'Average', 'Pro', '3D Doll'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-4 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedLevel === level 
                      ? (isDarkMode ? 'bg-sky-450 text-slate-950 shadow-lg font-black' : 'bg-navy text-white shadow-lg') 
                      : (isDarkMode ? 'hover:bg-slate-700 text-slate-350' : 'hover:bg-navy/10 text-navy/60')
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Quick header Theme Toggler Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 border-4 rounded-xl transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-705 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-sky-100 border-navy text-navy hover:bg-sky-200'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} className="text-yellow-400 animate-spin-slow" /> : <Moon size={20} className="text-blue-800" />}
            </button>
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
            <span className={`px-8 py-2 inline-block -rotate-2 rounded-3xl transition-all duration-305 ${
              isDarkMode 
                ? 'bg-slate-800 text-sky-450 border-4 border-slate-705 shadow-[10px_10px_0px_0px_rgba(56,189,248,0.25)]' 
                : 'bg-navy text-white shadow-[10px_10px_0px_0px_rgba(56,189,248,1)]'
            }`}>HUMAN BODY</span>
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
              className={`p-12 md:p-20 border-8 rounded-[3rem] text-center transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-[20px_20px_0px_0px_rgba(56,189,248,0.2)]'
                  : 'bg-white border-navy shadow-[20px_20px_0px_0px_rgba(79,70,229,1)]'
              }`}
            >
              <div className={`w-24 h-24 border-8 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3 shadow-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-indigo-400 border-slate-800' : 'bg-indigo-400 border-navy'
              }`}>
                <Box size={48} className={isDarkMode ? 'text-slate-950' : 'text-navy'} strokeWidth={3} />
              </div>
              <h2 className={`text-5xl md:text-6xl font-black mb-6 tracking-tighter uppercase leading-none transition-colors duration-300 ${isDarkMode ? 'text-slate-100' : 'text-navy'}`}>
                3D ANATOMY DOLL
              </h2>
              <p className={`text-xl md:text-2xl font-bold mb-12 max-w-2xl mx-auto transition-colors duration-300 ${
                isDarkMode ? 'text-slate-400' : 'text-navy/70'
              }`}>
                Pose the mannequin however you like! Create your own target for a sketch study.
              </p>
              <button 
                onClick={() => setIsCapturingPose(true)}
                className={`group flex items-center gap-4 px-12 py-6 border-4 rounded-[2.5rem] font-black uppercase tracking-widest text-2xl transition-all mx-auto duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-sky-400 text-slate-950 border-slate-800 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-2 hover:translate-y-2' 
                    : 'bg-navy text-white border-navy shadow-[10px_10px_0px_0px_rgba(56,189,248,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2'
                }`}
              >
                <Sparkles size={32} className="group-hover:rotate-12 transition-transform" />
                Open 3D Studio
              </button>
            </motion.div>

            {/* Model is preloaded globally in the background to ensure instant startup! */}
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
                  className={`group relative border-8 rounded-[3rem] overflow-hidden hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all text-left flex flex-col justify-between cursor-pointer h-full w-full ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 shadow-[15px_15px_0px_0px_rgba(255,255,255,0.15)] text-slate-100' 
                      : 'bg-white border-navy shadow-[15px_15px_0px_0px_rgba(0,0,128,1)] text-navy'
                  }`}
                >
                  <div className="w-full">
                    <div className={`aspect-square border-b-8 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-navy/5 border-navy'}`}>
                      <img 
                        src={tutorial.image_url || `https://picsum.photos/seed/${tutorial.id}/600/600`} 
                        alt={tutorial.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${
                          isDarkMode ? 'border-slate-800 text-slate-950' : 'border-navy'
                        } ${
                          (tutorial.level || tutorial.difficulty)?.toLowerCase() === 'beginner' ? 'bg-green-400' :
                          (tutorial.level || tutorial.difficulty)?.toLowerCase() === 'average' ? 'bg-sky-400' :
                          'bg-orange-400'
                        }`}>
                          {tutorial.level || tutorial.difficulty}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold mb-2 uppercase tracking-tight">{tutorial.title}</h3>
                      <p className={`text-xl line-clamp-2 font-medium transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'opacity-70 text-navy/70'}`}>{tutorial.description}</p>
                    </div>
                  </div>
                  
                  <div className="p-8 pt-0 w-full">
                    <div className={`mt-2 flex items-center gap-2 font-bold text-xl transition-colors duration-300 ${isDarkMode ? 'text-sky-450' : 'text-navy'}`}>
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
    
      {/* 3D Anatomy Doll Preloaded Studio */}
      <div className={isCapturingPose ? "block" : "hidden pointer-events-none opacity-0 absolute pb-1 w-1 h-1 overflow-hidden"}>
        <AnatomyDoll 
          onCapture={(imageUrl) => {
            setSavingPoseUrl(imageUrl);
            setNewTutorialLevel('3D Doll');
          }}
          onClose={() => setIsCapturingPose(false)}
        />
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {selectedTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] overflow-y-auto transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-sky-50 text-navy'
            }`}
          >
            <div className="min-h-screen p-6 md:p-12 relative">
              <button 
                onClick={() => {
                  setSelectedTutorial(null);
                  setZoomLevel(1);
                }}
                className={`absolute top-8 right-8 p-4 rounded-full hover:rotate-90 transition-transform z-50 border-4 focus:outline-none cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-800 text-white border-slate-705 shadow-[5px_5px_0px_0px_rgba(56,189,248,0.25)]' 
                    : 'bg-navy text-white border-navy shadow-[5px_5px_0px_0px_rgba(56,189,248,1)]'
                }`}
              >
                <X size={40} strokeWidth={4} />
              </button>

              <div className="max-w-[1600px] mx-auto">
                <div className="mb-12">
                  <div className={`inline-block border-4 px-6 py-2 rounded-2xl font-bold text-2xl mb-6 -rotate-2 ${
                    isDarkMode ? 'bg-slate-800 text-sky-400 border-slate-705' : 'bg-sky-400 text-navy border-navy'
                  }`}>
                    {selectedTutorial.category || 'POSE STUDY'}
                  </div>
                  <h2 className="text-6xl md:text-8xl font-bold mb-4 uppercase tracking-tighter leading-none">{selectedTutorial.title}</h2>
                  <p className={`text-2xl font-medium leading-relaxed max-w-4xl transition-colors duration-300 ${isDarkMode ? 'text-slate-350' : 'opacity-80'}`}>
                    {selectedTutorial.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  {/* Left Column: Reference Pose */}
                  <div className="lg:col-span-4 space-y-8">
                    <h3 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-4">
                      <div className={`w-8 h-8 border-4 rounded-lg bg-sky-400 ${isDarkMode ? 'border-slate-800' : 'border-navy'}`} />
                      Reference Pose
                    </h3>
                    <div className={`w-full h-[600px] overflow-auto border-8 rounded-[3rem] relative group transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-800 shadow-[15px_15px_0px_0px_rgba(255,255,255,0.15)] bg-slate-900/50' 
                        : 'bg-navy/5 border-navy shadow-[15px_15px_0px_0px_rgba(0,0,128,1)]'
                    }`}>
                      <div className="absolute top-6 right-6 flex flex-col gap-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
                          className={`p-3 border-4 rounded-xl shadow-sm cursor-pointer ${
                            isDarkMode ? 'bg-slate-800 border-slate-705 text-white hover:bg-slate-700' : 'bg-white border-navy text-navy hover:bg-sky-100'
                          }`}
                          title="Zoom In"
                        >
                          <ZoomIn size={24} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                          className={`p-3 border-4 rounded-xl shadow-sm cursor-pointer ${
                            isDarkMode ? 'bg-slate-800 border-slate-705 text-white hover:bg-slate-700' : 'bg-white border-navy text-navy hover:bg-sky-100'
                          }`}
                          title="Zoom Out"
                        >
                          <ZoomOut size={24} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => setZoomLevel(1)}
                          className={`p-3 border-4 rounded-xl shadow-sm cursor-pointer ${
                            isDarkMode ? 'bg-slate-800 border-slate-705 text-white hover:bg-slate-700' : 'bg-white border-navy text-navy hover:bg-sky-100'
                          }`}
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
                            className="w-full h-auto object-contain rounded-2xl animate-sketch"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sketch Canvas */}
                  <div className="lg:col-span-8 space-y-8">
                    <h3 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-4">
                      <div className={`w-8 h-8 border-4 rounded-lg bg-sky-450 ${isDarkMode ? 'border-slate-800' : 'border-navy'}`} />
                      Your Canvas
                    </h3>
                    <div className="w-full flex justify-center">
                      <SketchCanvas 
                        tutorialTitle={selectedTutorial.title} 
                        tutorialDescription={selectedTutorial.description} 
                        imageUrl={selectedTutorial.image_url || `https://picsum.photos/seed/${selectedTutorial.id}/1200/1200`}
                        tutorialLevel={selectedTutorial.level || selectedTutorial.difficulty}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Custom Pose Modal */}
      <AnimatePresence>
        {savingPoseUrl && !isAddingManually && (
          <div className="fixed inset-0 z-[200] bg-navy/80 backdrop-blur-sm flex items-center justify-center p-6 transition-all duration-300">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`border-8 p-8 md:p-12 rounded-[2.5rem] max-w-lg w-full text-center space-y-6 relative transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-805 text-slate-100 shadow-[15px_15px_0px_0px_rgba(56,189,248,0.25)]' 
                  : 'bg-white border-navy text-navy shadow-[15px_15px_0px_0px_rgba(56,189,248,1)]'
              }`}
            >
              <button 
                onClick={() => setSavingPoseUrl(null)}
                className={`absolute top-4 right-4 p-2 rounded-full hover:rotate-90 transition-transform cursor-pointer border-2 ${
                  isDarkMode ? 'bg-slate-800 border-slate-705 text-white' : 'bg-navy text-white border-navy'
                }`}
              >
                <X size={20} strokeWidth={3} />
              </button>

              <div className={`w-16 h-16 bg-green-400 border-4 rounded-2xl flex items-center justify-center mx-auto -rotate-3 shadow-md ${
                isDarkMode ? 'border-slate-800 text-slate-950' : 'border-navy text-navy'
              }`}>
                <Camera size={32} strokeWidth={3} className={isDarkMode ? 'text-slate-950' : 'text-navy'} />
              </div>

              <h3 className="text-3xl font-black uppercase tracking-tight">
                Save Your 3D Pose!
              </h3>
              
              <div className={`w-full aspect-video border-4 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-navy'
              }`}>
                <img src={savingPoseUrl || ''} alt="Captured Pose" className="h-full object-contain" />
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider opacity-60 mb-1">Pose Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Flying Kick, Sleeping Cat" 
                    value={newTutorialTitle}
                    onChange={(e) => setNewTutorialTitle(e.target.value)}
                    disabled={isSaving}
                    className={`w-full px-4 py-3 border-4 rounded-xl font-bold uppercase placeholder:opacity-50 text-navy focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-50 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:ring-slate-700/55' : 'bg-slate-50 border-navy'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider opacity-60 mb-1">Anatomical Focus / Notes</label>
                  <textarea 
                    placeholder="E.g., Focus on weight distribution and spine curve." 
                    value={newTutorialDesc}
                    onChange={(e) => setNewTutorialDesc(e.target.value)}
                    disabled={isSaving}
                    rows={2}
                    className={`w-full px-4 py-3 border-4 rounded-xl font-bold uppercase placeholder:opacity-50 text-navy focus:outline-none focus:ring-4 focus:ring-sky-200 resize-none disabled:opacity-50 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:ring-slate-700/55' : 'bg-slate-55 border-navy'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider opacity-60 mb-1">Level / Category</label>
                    <select
                      value={newTutorialLevel}
                      onChange={(e) => setNewTutorialLevel(e.target.value)}
                      disabled={isSaving}
                      className={`w-full px-4 py-3 border-4 rounded-xl font-bold uppercase focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-50 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-slate-700/55' : 'bg-slate-50 border-navy text-navy'
                      }`}
                    >
                      <option value="Beginner" className={isDarkMode ? 'bg-slate-800' : ''}>Beginner</option>
                      <option value="Average" className={isDarkMode ? 'bg-slate-800' : ''}>Average</option>
                      <option value="Pro" className={isDarkMode ? 'bg-slate-800' : ''}>Pro</option>
                      <option value="3D Doll" className={isDarkMode ? 'bg-slate-800' : ''}>3D Doll</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newTutorialTitle.trim() || isSaving) return;
                        await handleSaveNewTutorial(
                          newTutorialTitle,
                          newTutorialDesc,
                          newTutorialLevel,
                          savingPoseUrl || '',
                          false
                        );
                        setSavingPoseUrl(null);
                        setIsCapturingPose(false);
                        setNewTutorialTitle('');
                        setNewTutorialDesc('');
                      }}
                      disabled={!newTutorialTitle.trim() || isSaving}
                      className={`w-full py-3.5 hover:bg-green-500 disabled:opacity-50 font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isDarkMode ? 'bg-green-400 text-slate-900 border-4 border-slate-705 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)] bg-emerald-450 hover:bg-emerald-400' : 'bg-green-400 text-navy border-4 border-navy shadow-[4px_4px_0px_0px_rgba(0,0,128,1)]'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={14} strokeWidth={3} /> Save Pose
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`p-12 transition-colors duration-300 relative z-10 ${
        isDarkMode 
          ? 'bg-slate-900 text-slate-100 border-t-8 border-slate-850' 
          : 'bg-navy text-white border-t-8 border-white'
      }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-5xl font-bold mb-6 tracking-tighter">SKETCH SEARCH</div>
            <p className="text-xl opacity-75 max-w-md font-bold">
              Learn to draw the human body with our fun, sketchy tutorials. No talent required, just a pencil and a dream!
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-bold mb-8 uppercase tracking-widest">Socials</h4>
            <div className="flex gap-8">
              <a href="#" className="hover:scale-150 transition-transform hover:text-sky-400 text-current"><Twitter size={32} strokeWidth={3} /></a>
              <a href="#" className="hover:scale-150 transition-transform hover:text-sky-400 text-current"><Github size={32} strokeWidth={3} /></a>
              <a href="#" className="hover:scale-150 transition-transform hover:text-sky-400 text-current"><Info size={32} strokeWidth={3} /></a>
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-bold mb-8 uppercase tracking-widest">Legal Stuff</h4>
            <ul className="space-y-4 opacity-75 font-bold text-lg">
              <li><a href="#" className="hover:opacity-100 hover:text-sky-400 text-current">Privacy</a></li>
              <li><a href="#" className="hover:opacity-100 hover:text-sky-400 text-current">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className={`mt-16 pt-12 border-t-4 text-center opacity-50 font-black text-xl tracking-widest ${
          isDarkMode ? 'border-slate-800' : 'border-white/20'
        }`}>
          © 2026 SKETCH SEARCH. KEEP SKETCHING!
        </div>
      </footer>
    </div>
  );
}
