'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreBoard from '../ScoreBoard';

const PLAYERS = 4;
const RUNGS_PER_LEVEL = 4;

interface Rung {
  x: number;
  y: number;
  width: number;
}

export default function GhostLeg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [rungs, setRungs] = useState<Rung[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [playCount, setPlayCount] = useState(0);

  // Generate Board
  const initGame = useCallback(() => {
    const newRungs: Rung[] = [];
    const spacingX = 300 / (PLAYERS - 1);
    const spacingY = 400 / (RUNGS_PER_LEVEL + 1);

    // Randomly place horizontal lines (rungs) connecting adjacent vertical lines
    for (let y = 1; y <= RUNGS_PER_LEVEL; y++) {
      for (let x = 0; x < PLAYERS - 1; x++) {
        // 50% chance to put a rung, but ensure no overlapping rungs at same Y
        if (Math.random() > 0.5) {
            // Check if there's a rung immediately to the left at the same Y level to prevent infinite loops / ambiguous paths
            const hasAdjacentConflict = newRungs.some(r => r.y === y * spacingY && r.x === (x - 1) * spacingX);
            if (!hasAdjacentConflict) {
              newRungs.push({
                x: x * spacingX,
                y: y * spacingY,
                width: spacingX
              });
            }
        }
      }
    }
    
    // Assign one 'WIN' and rest 'LOSE'
    const newResults = Array(PLAYERS).fill('LOSE');
    newResults[Math.floor(Math.random() * PLAYERS)] = 'WIN';

    setRungs(newRungs);
    setResults(newResults);
    setIsPlaying(false);
    setSelectedPlayer(null);
    setResultIndex(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Trace logic
  const tracePath = (startIndex: number) => {
    const spacingX = 300 / (PLAYERS - 1);
    let currentXIndex = startIndex;
    const path: {x: number, y: number}[] = [];
    
    path.push({ x: currentXIndex * spacingX, y: 0 });

    const sortedRungs = [...rungs].sort((a,b) => a.y - b.y);

    for (const rung of sortedRungs) {
       // Is rung attached to our current line on the right?
       if (rung.x === currentXIndex * spacingX) {
           path.push({ x: currentXIndex * spacingX, y: rung.y });
           currentXIndex += 1; // Move right
           path.push({ x: currentXIndex * spacingX, y: rung.y });
       } 
       // Is rung attached to our current line on the left?
       else if (rung.x === (currentXIndex - 1) * spacingX) {
           path.push({ x: currentXIndex * spacingX, y: rung.y });
           currentXIndex -= 1; // Move left
           path.push({ x: currentXIndex * spacingX, y: rung.y });
       }
    }

    path.push({ x: currentXIndex * spacingX, y: 400 });
    return { path, finalIndex: currentXIndex };
  };

  const handleSelect = (idx: number) => {
    if (isPlaying || selectedPlayer !== null) return;
    setIsPlaying(true);
    setSelectedPlayer(idx);

    const { path, finalIndex } = tracePath(idx);
    
    // Animate drawing the path on canvas
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    let currentStep = 0;
    let progress = 0;
    
    const animate = () => {
        if(currentStep >= path.length - 1) {
            setResultIndex(finalIndex);
            setIsPlaying(false);
            setPlayCount(p => p+1);
            return;
        }

        const p1 = path[currentStep];
        const p2 = path[currentStep + 1];

        // Draw line segment incrementally
        progress += 0.1;
        const currentX = p1.x + (p2.x - p1.x) * Math.min(progress, 1);
        const currentY = p1.y + (p2.y - p1.y) * Math.min(progress, 1);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = '#38bdf8'; // sky-400
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

  // Base Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We only want to clear and draw the base if we aren't currently animating a trace
    if(!isPlaying && selectedPlayer === null) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#475569'; // slate-600
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const spacingX = 300 / (PLAYERS - 1);

      // Draw Verticals
      for (let i = 0; i < PLAYERS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * spacingX, 0);
        ctx.lineTo(i * spacingX, 400);
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

  }, [rungs, isPlaying, selectedPlayer]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <ScoreBoard score={playCount} highScore={playCount} onRestart={initGame} title="Ghost Leg" />
        
        <div className="bg-slate-900/50 rounded-3xl p-6 shadow-2xl border border-white/5 relative flex flex-col items-center">
          
          {/* Top Selectors */}
          <div className="w-[300px] flex justify-between mb-4 relative z-10">
            {Array.from({ length: PLAYERS }).map((_, idx) => (
              <motion.button
                key={`top-${idx}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(idx)}
                disabled={isPlaying || selectedPlayer !== null}
                className={`w-10 h-10 rounded-full font-black text-sm border-2 ${
                  selectedPlayer === idx 
                    ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]' 
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-400'
                } flex items-center justify-center transition-colors z-10`}
              >
                {idx + 1}
              </motion.button>
            ))}
          </div>

          {/* Canvas Board */}
          <canvas
            ref={canvasRef}
            width={300}
            height={400}
            className="w-[300px] h-[400px] block my-auto relative z-0"
          />

          {/* Bottom Results */}
          <div className="w-[300px] flex justify-between mt-4 relative z-10">
            {results.map((res, idx) => (
              <div
                key={`bot-${idx}`}
                className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border-2 transition-all duration-500 ${
                  resultIndex === idx && res === 'WIN' 
                    ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                    : resultIndex === idx 
                        ? 'bg-slate-700 border-slate-500 text-white'
                        : resultIndex !== null
                            ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50' // Dim others when finished
                            : 'bg-slate-800 border-slate-700 text-transparent' // Hide text initially
                }`}
              >
                {/* Only reveal text if the game is over and it's the chosen result, or reveal all loosely */}
                <AnimatePresence>
                     {resultIndex !== null && (
                         <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                         >
                            {res === 'WIN' ? '🏆' : '❌'}
                         </motion.span>
                     )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}
