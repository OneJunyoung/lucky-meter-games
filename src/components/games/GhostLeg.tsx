'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import ScoreBoard from '../ScoreBoard';
import ScaledGame from '../ScaledGame';
import { soundManager } from '@/utils/soundManager';

const PATH_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
];

interface Rung {
  x: number;
  y: number;
  width: number;
}

export default function GhostLeg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Controls
  const [numPlayers, setNumPlayers] = useState(4);
  const [numWins, setNumWins] = useState(1);
  
  // Game logic
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [rungs, setRungs] = useState<Rung[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [playCount, setPlayCount] = useState(0);

  const CANVAS_WIDTH = 340;
  const CANVAS_HEIGHT = 420;

  // Generate Board
  const initGame = useCallback(() => {
    const newRungs: Rung[] = [];
    const RUNGS_PER_LEVEL = 5;
    const padding = 16; // Half of w-8 (32px)
    const spacingX = (CANVAS_WIDTH - 32) / (numPlayers - 1);
    const spacingY = CANVAS_HEIGHT / (RUNGS_PER_LEVEL + 1);

    for (let y = 1; y <= RUNGS_PER_LEVEL; y++) {
      for (let x = 0; x < numPlayers - 1; x++) {
        if (Math.random() > 0.5) {
            const hasAdjacentConflict = newRungs.some(r => r.y === y * spacingY && Math.abs(r.x - (padding + (x - 1) * spacingX)) < 1);
            if (!hasAdjacentConflict) {
              newRungs.push({
                x: padding + x * spacingX,
                y: y * spacingY,
                width: spacingX
              });
            }
        }
      }
    }
    
    const newResults = Array(numPlayers).fill('LOSE');
    let winsPlaced = 0;
    while(winsPlaced < numWins) {
        const idx = Math.floor(Math.random() * numPlayers);
        if (newResults[idx] !== 'WIN') {
            newResults[idx] = 'WIN';
            winsPlaced++;
        }
    }

    setRungs(newRungs);
    setResults(newResults);
    setSelectedPlayers([]);
    setIsAnimating(false);
  }, [numPlayers, numWins]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const tracePath = (startIndex: number) => {
    const padding = 16;
    const spacingX = (CANVAS_WIDTH - 32) / (numPlayers - 1);
    let currentXIndex = startIndex;
    const path: {x: number, y: number}[] = [];
    
    path.push({ x: padding + currentXIndex * spacingX, y: 0 });
    const sortedRungs = [...rungs].sort((a,b) => a.y - b.y);

    for (const rung of sortedRungs) {
       // Using Math.abs for float precision issues
       if (Math.abs(rung.x - (padding + currentXIndex * spacingX)) < 1) {
           path.push({ x: padding + currentXIndex * spacingX, y: rung.y });
           currentXIndex += 1; 
           path.push({ x: padding + currentXIndex * spacingX, y: rung.y });
       } 
       else if (Math.abs(rung.x - (padding + (currentXIndex - 1) * spacingX)) < 1) {
           path.push({ x: padding + currentXIndex * spacingX, y: rung.y });
           currentXIndex -= 1; 
           path.push({ x: padding + currentXIndex * spacingX, y: rung.y });
       }
    }

    path.push({ x: padding + currentXIndex * spacingX, y: CANVAS_HEIGHT });
    return { path, finalIndex: currentXIndex };
  };

  const handleSelect = (idx: number) => {
    if (isAnimating || selectedPlayers.includes(idx)) return;
    soundManager.playSynth('hover'); // Initial selection sound
    setIsAnimating(true);

    const { path, finalIndex } = tracePath(idx);
    
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    let currentStep = 0;
    let progress = 0;
    
    const animate = () => {
        if(currentStep >= path.length - 1) {
            setSelectedPlayers(prev => [...prev, idx]);
            if (results[finalIndex] === 'WIN') {
                soundManager.playSynth('success');
            } else {
                soundManager.playSynth('gameover');
            }
            setIsAnimating(false);
            return;
        }

        const p1 = path[currentStep];
        const p2 = path[currentStep + 1];

        progress += 0.15; // Animation speed
        const currentX = p1.x + (p2.x - p1.x) * Math.min(progress, 1);
        const currentY = p1.y + (p2.y - p1.y) * Math.min(progress, 1);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = PATH_COLORS[idx % PATH_COLORS.length];
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (progress >= 1) {
            currentStep++;
            progress = 0;
        }

        requestAnimationFrame(animate);
    };

    animate();
  };

  // Base Draw. Clears only when resetting (selectedPlayers is empty)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedPlayers.length === 0 && !isAnimating) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const padding = 16;
      const spacingX = (CANVAS_WIDTH - 32) / (numPlayers - 1);

      // Draw Verticals
      for (let i = 0; i < numPlayers; i++) {
        ctx.beginPath();
        ctx.moveTo(padding + i * spacingX, 0);
        ctx.lineTo(padding + i * spacingX, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw Horizontals
      rungs.forEach(rung => {
        ctx.beginPath();
        ctx.moveTo(rung.x, rung.y);
        ctx.lineTo(rung.x + rung.width, rung.y);
        ctx.stroke();
      });
    }
  }, [rungs, selectedPlayers.length, isAnimating, numPlayers]);

  const adjustPlayers = (delta: number) => {
      if (selectedPlayers.length > 0 || isAnimating) return;
      const next = Math.max(2, Math.min(8, numPlayers + delta));
      setNumPlayers(next);
      if (numWins >= next) setNumWins(next - 1);
      soundManager.playSynth('click');
  };

  const adjustWins = (delta: number) => {
      if (selectedPlayers.length > 0 || isAnimating) return;
      const next = Math.max(1, Math.min(numPlayers - 1, numWins + delta));
      setNumWins(next);
      soundManager.playSynth('click');
  };

  const resetGame = () => {
      setPlayCount(p => p+1);
      initGame();
      soundManager.playSynth('click');
  };

  // Determine which final indices have actually been reached by traced paths
  const reachedIndices: Record<number, { found: boolean, outcome: string }> = {};
  for(let i=0; i<numPlayers; i++) {
      reachedIndices[i] = { found: false, outcome: '' };
  }
  
  selectedPlayers.forEach(pIdx => {
      const { finalIndex } = tracePath(pIdx);
      reachedIndices[finalIndex] = { found: true, outcome: results[finalIndex] };
  });

  const gameStarted = selectedPlayers.length > 0 || isAnimating;

  return (
    <ScaledGame logicalWidth={420} logicalHeight={750}>
      <div className="w-full max-w-[420px] w-[420px]">
        <ScoreBoard score={playCount} highScore={playCount} onRestart={resetGame} title="Ghost Leg" />
        
        <div className="bg-slate-900/50 rounded-3xl p-6 shadow-2xl border border-white/5 relative flex flex-col items-center glass-card">
          
          {/* Settings / Controls */}
          <div className="w-full flex justify-between gap-4 mb-6">
              <div className="flex-1 bg-slate-950/50 rounded-xl p-3 border border-white/10 flex flex-col items-center shadow-inner">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Players</span>
                  <div className="flex items-center gap-2">
                       <button onClick={() => adjustPlayers(-1)} disabled={gameStarted || numPlayers <= 2} className="w-6 h-6 rounded-full bg-slate-800 disabled:opacity-30 text-white flex items-center justify-center hover:bg-slate-700 transition">
                           <Minus className="w-3 h-3" />
                       </button>
                       <span className="font-black text-xl w-6 text-center text-sky-400">{numPlayers}</span>
                       <button onClick={() => adjustPlayers(1)} disabled={gameStarted || numPlayers >= 8} className="w-6 h-6 rounded-full bg-slate-800 disabled:opacity-30 text-white flex items-center justify-center hover:bg-slate-700 transition">
                           <Plus className="w-3 h-3" />
                       </button>
                  </div>
              </div>
              <div className="flex-1 bg-slate-950/50 rounded-xl p-3 border border-white/10 flex flex-col items-center shadow-inner">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Winners</span>
                  <div className="flex items-center gap-2">
                       <button onClick={() => adjustWins(-1)} disabled={gameStarted || numWins <= 1} className="w-6 h-6 rounded-full bg-slate-800 disabled:opacity-30 text-white flex items-center justify-center hover:bg-slate-700 transition">
                           <Minus className="w-3 h-3" />
                       </button>
                       <span className="font-black text-xl w-6 text-center text-amber-400">{numWins}</span>
                       <button onClick={() => adjustWins(1)} disabled={gameStarted || numWins >= numPlayers - 1} className="w-6 h-6 rounded-full bg-slate-800 disabled:opacity-30 text-white flex items-center justify-center hover:bg-slate-700 transition">
                           <Plus className="w-3 h-3" />
                       </button>
                  </div>
              </div>
          </div>

          {/* Top Selectors */}
          <div className="w-[340px] flex justify-between mb-4 relative z-10 flex-wrap">
            {Array.from({ length: numPlayers }).map((_, idx) => {
              const isSelected = selectedPlayers.includes(idx);
              const color = PATH_COLORS[idx % PATH_COLORS.length];
              return (
                <motion.button
                  key={`top-${idx}`}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnimating || isSelected}
                  style={{ 
                      backgroundColor: isSelected ? color : undefined,
                      borderColor: isSelected ? color : undefined,
                  }}
                  className={`w-8 h-8 rounded-full font-black text-xs border-2 shadow-lg ${
                    isSelected 
                      ? 'text-slate-900 shadow-md' 
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                  } flex items-center justify-center transition-all z-10`}
                >
                  {idx + 1}
                </motion.button>
              )
            })}
          </div>

          {/* Canvas Board */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-[340px] h-[420px] block my-auto relative z-0 opacity-80"
          />

          {/* Bottom Results */}
          <div className="w-[340px] flex justify-between mt-4 relative z-10">
            {results.map((res, idx) => {
              const info = reachedIndices[idx];
              const isRevealed = info.found;
              return (
                <div
                  key={`bot-${idx}`}
                  className={`w-8 h-8 rounded-lg font-bold text-lg flex items-center justify-center border-2 transition-all duration-500 shadow-xl ${
                    isRevealed && res === 'WIN' 
                      ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                      : isRevealed 
                          ? 'bg-slate-700 border-slate-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-700' 
                  }`}
                >
                  <AnimatePresence>
                       {isRevealed && (
                           <motion.span
                              initial={{ opacity: 0, scale: 0, rotate: -180 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                           >
                              {res === 'WIN' ? '🏆' : '💀'}
                           </motion.span>
                       )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
          
        </div>
      </div>
    </ScaledGame>
  );
}
