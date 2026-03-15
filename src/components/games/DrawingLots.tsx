'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Minus, Plus } from 'lucide-react';
import ScoreBoard from '../ScoreBoard';
import ScaledGame from '../ScaledGame';
import { soundManager } from '@/utils/soundManager';

interface Lot {
  id: number;
  isWinner: boolean;
  isRevealed: boolean;
}

export default function DrawingLots() {
  const [totalLots, setTotalLots] = useState(6);
  const [lots, setLots] = useState<Lot[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const initGame = () => {
    const newLots = Array.from({ length: totalLots }, (_, i) => ({
      id: i,
      isWinner: false,
      isRevealed: false,
    }));
    
    // Assign 1 winner
    newLots[Math.floor(Math.random() * totalLots)].isWinner = true;
    
    setLots(newLots);
    setHasStarted(true);
    setHasWon(false);
    soundManager.playSynth('pop');
  };

  const handleReveal = (id: number) => {
    if (hasWon) return; // Prevent clicking after win

    setLots(current => 
      current.map(lot => {
        if (lot.id === id) {
           if(lot.isWinner) {
               setHasWon(true);
               setPlayCount(p => p+1);
           }
           return { ...lot, isRevealed: true };
        }
        return lot;
      })
    );
  };

  const resetGame = () => {
      setHasStarted(false);
      setLots([]);
      setHasWon(false);
  };

  return (
    <ScaledGame logicalWidth={500} logicalHeight={520}>
      <div className="w-full max-w-[500px] w-[500px]">
        {hasStarted && <ScoreBoard score={playCount} highScore={playCount} onRestart={resetGame} title="Drawing Lots" />}
        
        <div className="bg-slate-900/50 rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/5 relative flex flex-col items-center min-h-[400px]">
          
          <AnimatePresence mode="wait">
              {!hasStarted ? (
                  <motion.div 
                    key="setup"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center w-full h-full my-auto space-y-8"
                  >
                      <ScrollText className="w-16 h-16 text-slate-400 mb-2" />
                      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600">Setup Drawing Lots</h2>
                      
                      <div className="flex items-center gap-6">
                          <button 
                            disabled={totalLots <= 2}
                            onClick={() => {
                                soundManager.playSynth('hover');
                                setTotalLots(t => Math.max(2, t - 1));
                            }}
                            className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-5 h-5 text-white" />
                          </button>
                          <div className="flex flex-col items-center">
                              <span className="text-4xl font-black font-mono neon-text">{totalLots}</span>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Lots</span>
                          </div>
                          <button 
                            disabled={totalLots >= 12}
                            onClick={() => {
                                soundManager.playSynth('hover');
                                setTotalLots(t => Math.min(12, t + 1));
                            }}
                            className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-5 h-5 text-white" />
                          </button>
                      </div>

                      <motion.button
                        onMouseEnter={() => soundManager.playSynth('hover')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={initGame}
                        className="px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-2xl font-black text-white shadow-xl shadow-red-500/20 w-full max-w-[250px]"
                      >
                         Mix Lots
                      </motion.button>
                  </motion.div>
              ) : (
                  <motion.div
                    key="gameplay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full flex-col flex items-center justify-center h-full"
                  >
                     <p className="text-slate-400 font-medium mb-8 text-center bg-slate-800/50 px-6 py-2 rounded-full border border-white/5">
                        {hasWon ? "Winner found!" : "Pick a lot..."}
                     </p>

                     <div className="flex flex-wrap justify-center gap-4 w-full">
                         {lots.map(lot => (
                             <motion.div
                                key={lot.id}
                                className={`relative w-24 h-32 [perspective:1000px] cursor-pointer`}
                                onClick={() => handleReveal(lot.id)}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: "spring", delay: lot.id * 0.05 }}
                             >
                                 <motion.div
                                    animate={{ rotateY: lot.isRevealed ? 180 : 0 }}
                                    transition={{ duration: 0.6, type: "spring" }}
                                    className="w-full h-full relative [transform-style:preserve-3d]"
                                 >
                                     {/* Front of Lot (Closed) */}
                                     <div className={`absolute inset-0 backface-hidden rounded-xl border-2 shadow-xl flex items-center justify-center
                                          ${lot.isRevealed ? 'hidden' : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600'}
                                     `}>
                                        <div className="w-4 h-16 bg-slate-900/30 rounded-full" />
                                     </div>

                                     {/* Back of Lot (Revealed) */}
                                     <div className={`absolute inset-0 backface-hidden rounded-xl border-2 shadow-2xl flex items-center justify-center [transform:rotateY(180deg)]
                                         ${lot.isWinner 
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300' 
                                            : 'bg-slate-800 border-slate-700'
                                         }
                                     `}>
                                         {lot.isWinner ? (
                                             <span className="text-4xl text-white drop-shadow-md">🏆</span>
                                         ) : (
                                             <span className="text-3xl text-slate-500">❌</span>
                                         )}
                                     </div>
                                 </motion.div>
                             </motion.div>
                         ))}
                     </div>

                     <AnimatePresence>
                         {hasWon && (
                             <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={resetGame}
                                className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-colors"
                             >
                                Play Again
                             </motion.button>
                         )}
                     </AnimatePresence>
                  </motion.div>
              )}
          </AnimatePresence>
          
        </div>
      </div>
    </ScaledGame>
  );
}
