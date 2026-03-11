/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, User, Building2, TreeDeciduous, Menu, X, Github, Twitter, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen flex flex-col selection:bg-navy selection:text-white">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center bg-white border-b-4 border-navy sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border-4 border-navy rounded-lg flex items-center justify-center rotate-3">
            <Search size={24} strokeWidth={3} />
          </div>
          <span className="text-3xl font-bold tracking-tighter">SKETCH SEARCH</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-xl font-bold">
          <a href="#" className="hover:underline decoration-4 underline-offset-4">EXPLORE</a>
          <a href="#" className="hover:underline decoration-4 underline-offset-4">COLLECTIONS</a>
          <a href="#" className="hover:underline decoration-4 underline-offset-4">ABOUT</a>
        </div>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 border-4 border-navy rounded-xl hover:bg-navy hover:text-white transition-colors"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[88px] bg-white z-40 flex flex-col items-center justify-center gap-8 text-4xl font-bold md:hidden"
          >
            <a href="#" onClick={() => setIsMenuOpen(false)}>EXPLORE</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>COLLECTIONS</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>ABOUT</a>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow flex flex-col items-center px-6 pt-20 pb-32">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-none">
            SEARCH THE <br />
            <span className="bg-navy text-white px-4 py-1 inline-block -rotate-1">IMAGINATION</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-80 max-w-2xl mx-auto">
            A creative search engine for artists, dreamers, and sketchers. 
            Find inspiration in every stroke.
          </p>
        </motion.div>

        {/* Search Bar */}
        <div className="w-full max-w-3xl relative mb-24">
          <div className="absolute -inset-2 bg-navy rounded-[2rem] rotate-1 opacity-10"></div>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full p-6 md:p-8 text-2xl md:text-3xl border-4 border-navy rounded-3xl outline-none focus:shadow-[12px_12px_0px_0px_rgba(0,0,128,1)] transition-all placeholder:text-navy/30 font-bold"
            />
            <button className="absolute right-4 p-4 bg-navy text-white rounded-2xl hover:scale-105 active:scale-95 transition-transform">
              <Search size={32} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Animated Icon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl">
          <SketchIcon label="Human">
            <User size={80} strokeWidth={2.5} className="animate-sketch" />
          </SketchIcon>
          <SketchIcon label="Building">
            <Building2 size={80} strokeWidth={2.5} className="animate-sketch" />
          </SketchIcon>
          <SketchIcon label="Nature">
            <TreeDeciduous size={80} strokeWidth={2.5} className="animate-sketch" />
          </SketchIcon>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-12 bg-navy text-white border-t-8 border-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-4xl font-bold mb-4">SKETCH SEARCH</div>
            <p className="text-lg opacity-70 max-w-md">
              The world's first search engine dedicated to the beauty of hand-drawn sketches and creative doodles.
            </p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-6 uppercase tracking-widest">Connect</h4>
            <div className="flex gap-6">
              <a href="#" className="hover:scale-125 transition-transform"><Twitter size={24} /></a>
              <a href="#" className="hover:scale-125 transition-transform"><Github size={24} /></a>
              <a href="#" className="hover:scale-125 transition-transform"><Info size={24} /></a>
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-6 uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 opacity-70">
              <li><a href="#" className="hover:opacity-100">Privacy Policy</a></li>
              <li><a href="#" className="hover:opacity-100">Terms of Service</a></li>
              <li><a href="#" className="hover:opacity-100">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/20 text-center opacity-50 font-bold">
          © 2026 SKETCH SEARCH. BUILT WITH IMAGINATION.
        </div>
      </footer>
    </div>
  );
}
