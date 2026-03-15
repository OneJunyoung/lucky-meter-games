'use client';

import { motion, Variants } from 'framer-motion';
import { Candy, CircleDashed, Gamepad2, Dices, Route, Shuffle, Grid3X3, Play } from 'lucide-react';
import Link from 'next/link';
import { soundManager } from '@/utils/soundManager';

const GAMES = [
  { slug: 'candy-match', title: 'Candy Match', icon: Candy, color: 'from-pink-500 to-rose-400', shadow: 'shadow-pink-500/20' },
  { slug: 'bubble-pop', title: 'Bubble Pop', icon: CircleDashed, color: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20' },
  { slug: 'scooter-run', title: 'Scooter Run', icon: Gamepad2, color: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-500/20' },
  { slug: 'dice-roll', title: 'Dice Roll', icon: Dices, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
  { slug: 'ghost-leg', title: 'Ghost Leg', icon: Route, color: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-500/20' },
  { slug: 'drawing-lots', title: 'Drawing Lots', icon: Shuffle, color: 'from-red-400 to-rose-600', shadow: 'shadow-red-500/20' },
  { slug: 'gomoku', title: 'Gomoku', icon: Grid3X3, color: 'from-indigo-400 to-blue-600', shadow: 'shadow-indigo-500/20' },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4 } },
};

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <main className="z-10 w-full max-w-6xl flex flex-col items-center space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-4">
            <span className="text-sm font-medium text-blue-300 tracking-wider uppercase">Welcome to the arcade</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Lucky <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 neon-text">Meter</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A minimalist collection of highly addictive mini-games. Dive in and test your luck today.
          </p>
        </motion.div>

        {/* Game Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
        >
          {GAMES.map((game, index) => {
            const Icon = game.icon;
            // Make the 7th item span 2 columns on lg, or center it
            const isLast = index === GAMES.length - 1;
            
            return (
              <motion.div
                key={game.slug}
                variants={item}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative glass-card rounded-2xl overflow-hidden ${
                  isLast ? 'sm:col-span-2 lg:col-span-1 xl:col-span-1' : ''
                }`}
              >
                {/* Glow behind card on hover */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none bg-white" />
                
                <div className="p-6 flex flex-col h-full relative z-10">
                  <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${game.color} ${game.shadow} shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                    {game.title}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-8 flex-1">
                    Play {game.title.toLowerCase()} and test your skills in this quick mini-game.
                  </p>

                  <Link href={`/games/${game.slug}`} className="block mt-auto" onClick={() => soundManager.playSynth('success')}>
                    <motion.button
                      onMouseEnter={() => soundManager.playSynth('hover')}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium flex items-center justify-center gap-2 transition-colors relative overflow-hidden group/btn"
                    >
                      <span className="relative z-10">Play Now</span>
                      <Play className="w-4 h-4 fill-current relative z-10" />
                      
                      {/* Button hover gradient sweep */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${game.color} opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300`} />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
