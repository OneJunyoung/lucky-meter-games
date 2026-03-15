'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Minus, Plus } from 'lucide-react';
import ScoreBoard from '../ScoreBoard';
import ScaledGame from '../ScaledGame';
import { soundManager } from '@/utils/soundManager';

export default function DiceRoll() {
  const [isRolling, setIsRolling] = useState(false);
  const [numberOfDice, setNumberOfDice] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [rollCount, setRollCount] = useState(0);
  
  // High score tracking highest roll sum
  const [score, setScore] = useState(0); 
  const [highScore, setHighScore] = useState(0);
  
  // For animation frames
  const [displayFaces, setDisplayFaces] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setResults([]);
    soundManager.playSynth('pop'); // Play a pop sound indicating the spin started
    
    // Start rapid face cycling animation
    intervalRef.current = setInterval(() => {
        const randomFaces = Array.from({length: numberOfDice}, () => Math.floor(Math.random() * 6) + 1);
        setDisplayFaces(randomFaces);
    }, 50);

    // Simulate roll delay
    timerRef.current = setTimeout(() => {
      if(intervalRef.current) clearInterval(intervalRef.current);
      
      const newResults = Array.from({length: numberOfDice}, () => Math.floor(Math.random() * 6) + 1);
      const sum = newResults.reduce((a, b) => a + b, 0);

      setDisplayFaces(newResults);
      setResults(newResults);
      setRollCount(rc => rc + 1);
      soundManager.playSynth('success'); // Play success when result lands
      
      setScore(s => {
          const newScore = s + sum;
          if(newScore > highScore) setHighScore(newScore);
          return newScore;
      });
      
      setIsRolling(false);
    }, 1500);
  };

  const resetGame = () => {
      if(intervalRef.current) clearInterval(intervalRef.current);
      if(timerRef.current) clearTimeout(timerRef.current);
      setIsRolling(false);
      setScore(0);
      setRollCount(0);
      setResults([]);
      setDisplayFaces([]);
  };

  const adjustDiceNumber = (delta: number) => {
      if(isRolling) return;
      const next = Math.max(1, Math.min(6, numberOfDice + delta));
      setNumberOfDice(next);
      setResults([]);
      setDisplayFaces([]);
      soundManager.playSynth('click');
  };

  // Grid layout depending on how many dice there are
  const getGridClass = () => {
      switch(numberOfDice) {
          case 1: return "grid-cols-1 place-items-center";
          case 2: return "grid-cols-2 gap-6 place-items-center";
          case 3: return "grid-cols-2 gap-4 place-items-center";
          case 4: return "grid-cols-2 gap-4 place-items-center";
          case 5: return "grid-cols-3 gap-3 place-items-center";
          case 6: return "grid-cols-3 gap-3 place-items-center";
          default: return "grid-cols-2";
      }
  };

  return (
    <ScaledGame logicalWidth={400} logicalHeight={520}>
      <div className="w-full max-w-[400px] w-[400px]">
        <ScoreBoard score={score} highScore={highScore} onRestart={resetGame} title={`Rolls: ${rollCount}`} />
        
        <div className="w-full aspect-[4/5] bg-slate-900/50 rounded-3xl p-6 flex flex-col items-center justify-between border border-white/5 relative overflow-hidden glass-card shadow-2xl">
            
            {/* Controls */}
            <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-2 rounded-2xl border border-white/10 z-10 w-full justify-between mt-2">
                <span className="text-slate-400 font-medium text-sm">Number of Dice</span>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => adjustDiceNumber(-1)} 
                        disabled={isRolling || numberOfDice <= 1}
                        className="w-8 h-8 rounded-full bg-slate-800 disabled:opacity-50 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-4 text-center font-bold text-white text-lg">{numberOfDice}</span>
                    <button 
                        onClick={() => adjustDiceNumber(1)} 
                        disabled={isRolling || numberOfDice >= 6}
                        className="w-8 h-8 rounded-full bg-slate-800 disabled:opacity-50 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Dice Area */}
            <div className={`w-full flex-1 flex items-center justify-center py-6`}>
                <div className={`grid ${getGridClass()} w-full h-full max-h-[300px] gap-4 p-2`}>
                   {Array.from({length: numberOfDice}).map((_, i) => {
                       // Initially show nothing or a placeholder face before roll starts
                       const face = displayFaces[i] || 1; 
                       const isPlaceholder = displayFaces.length === 0;

                       return (
                           <motion.div
                               key={i}
                               animate={isRolling ? {
                                   scale: [1, 1.1, 0.9, 1.05, 1],
                                   rotate: [0, 15, -15, 5, 0]
                               } : { scale: 1, rotate: 0 }}
                               transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
                               className={`w-full h-full object-contain aspect-square max-w-[100px] max-h-[100px] overflow-hidden ${isPlaceholder ? 'opacity-30 grayscale' : 'opacity-100'} transition-opacity`}
                           >
                               <img src={`/assets/games/dice/${face}.svg`} alt={`Dice face ${face}`} className="w-full h-full object-contain pointer-events-none drop-shadow-md rounded-2xl" />
                           </motion.div>
                       )
                   })}
                </div>
            </div>

            <motion.button
                onMouseEnter={() => soundManager.playSynth('hover')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isRolling}
                onClick={rollDice}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl font-black text-xl text-white shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
                <Dices className="w-6 h-6" />
                {isRolling ? 'Rolling...' : 'Roll Dice'}
            </motion.button>
            
            {/* Overlay Result Text */}
            <AnimatePresence>
                {!isRolling && results.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                    >
                        <div className="bg-slate-900/80 backdrop-blur-sm px-8 py-6 rounded-3xl border-2 border-amber-500/50 flex flex-col items-center justify-center shadow-2xl">
                           <span className="text-slate-300 font-medium text-sm mb-1 uppercase tracking-widest">Total Sum</span>
                           <span className="font-black text-6xl text-amber-400 neon-text">{results.reduce((a,b)=>a+b,0)}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </ScaledGame>
  );
}
