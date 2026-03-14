'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';
import ScoreBoard from '../ScoreBoard';

export default function DiceRoll() {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rollCount, setRollCount] = useState(0);
  
  // High score tracking highest roll sum (simplistic meta-game)
  const [score, setScore] = useState(0); 
  const [highScore, setHighScore] = useState(0);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null); // hide result text while rolling
    
    // Simulate roll delay
    setTimeout(() => {
      const finalVal = Math.floor(Math.random() * 6) + 1;
      setResult(finalVal);
      setRollCount(rc => rc + 1);
      
      setScore(s => {
          const newScore = s + finalVal;
          if(newScore > highScore) setHighScore(newScore);
          return newScore;
      });
      
      setIsRolling(false);
    }, 1500);
  };

  const resetGame = () => {
      setScore(0);
      setRollCount(0);
      setResult(null);
  }

  // Generate 3D rotations based on final value or random spinning
  const getRotation = () => {
    if (isRolling) {
      // Wild spinning state
      return {
        rotateX: [0, 720, 1440, 2160],
        rotateY: [0, 1080, 2160, 3240],
        rotateZ: [0, 360, 720, 1080]
      };
    }
    
    // Settle on the specific face
    switch(result) {
      case 1:  return { rotateX: 0, rotateY: 0, rotateZ: 0 };
      case 2:  return { rotateX: 0, rotateY: 180, rotateZ: 0 };
      case 3:  return { rotateX: 0, rotateY: -90, rotateZ: 0 };
      case 4:  return { rotateX: 0, rotateY: 90, rotateZ: 0 };
      case 5:  return { rotateX: -90, rotateY: 0, rotateZ: 0 };
      case 6:  return { rotateX: 90, rotateY: 0, rotateZ: 0 };
      default: return { rotateX: 0, rotateY: 0, rotateZ: 0 };
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <ScoreBoard score={score} highScore={highScore} onRestart={resetGame} title={`Rolls: ${rollCount}`} />
        
        <div className="w-full aspect-square bg-slate-900/50 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center border border-white/5 relative overflow-hidden">
            
            {/* 3D Dice Container */}
            <div className="relative w-32 h-32 [perspective:1000px] mb-12">
              <motion.div
                animate={getRotation()}
                transition={{ 
                    duration: isRolling ? 1.5 : 0.5, 
                    ease: isRolling ? "linear" : "easeOut" 
                }}
                className="w-full h-full relative [transform-style:preserve-3d]"
              >
                {/* 1: Front */}
                <DiceFace value={1} classes="[transform:translateZ(64px)]" />
                {/* 2: Back */}
                <DiceFace value={2} classes="[transform:rotateY(180deg)_translateZ(64px)]" />
                {/* 3: Right */}
                <DiceFace value={3} classes="[transform:rotateY(90deg)_translateZ(64px)]" />
                {/* 4: Left */}
                <DiceFace value={4} classes="[transform:rotateY(-90deg)_translateZ(64px)]" />
                {/* 5: Top */}
                <DiceFace value={5} classes="[transform:rotateX(90deg)_translateZ(64px)]" />
                {/* 6: Bottom */}
                <DiceFace value={6} classes="[transform:rotateX(-90deg)_translateZ(64px)]" />
              </motion.div>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isRolling}
                onClick={rollDice}
                className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl font-black text-xl text-white shadow-xl shadow-amber-500/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Dices className="w-6 h-6" />
                {isRolling ? 'Rolling...' : 'Roll Dice'}
            </motion.button>
            
            {/* Overlay Result Text */}
            <AnimatePresence>
                {!isRolling && result !== null && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-6 font-black text-3xl text-amber-400 neon-text"
                    >
                        You rolled a {result}!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DiceFace({ value, classes }: { value: number, classes: string }) {
    // Generate dot positions based on value
    const dots = () => {
        switch(value) {
            case 1: return <div className="w-6 h-6 bg-slate-900 rounded-full" />;
            case 2: return (
                <div className="w-full h-full flex justify-between p-2 pb-8">
                    <div className="w-5 h-5 bg-slate-900 rounded-full self-start" />
                    <div className="w-5 h-5 bg-slate-900 rounded-full self-end" />
                </div>
            );
            case 3: return (
                <div className="w-full h-full flex flex-col justify-between items-center p-2">
                    <div className="w-5 h-5 bg-slate-900 rounded-full self-start" />
                    <div className="w-5 h-5 bg-slate-900 rounded-full" />
                    <div className="w-5 h-5 bg-slate-900 rounded-full self-end" />
                </div>
            );
            case 4: return (
                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-3">
                    {[0,1,2,3].map(i => <div key={i} className="w-5 h-5 bg-slate-900 rounded-full justify-self-center align-self-center" />)}
                </div>
            );
            case 5: return (
                <div className="w-full h-full relative p-2">
                    <div className="absolute top-2 left-2 w-5 h-5 bg-slate-900 rounded-full" />
                    <div className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-slate-900 rounded-full" />
                    <div className="absolute bottom-2 left-2 w-5 h-5 bg-slate-900 rounded-full" />
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-slate-900 rounded-full" />
                </div>
            );
            case 6: return (
                <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-y-1 gap-x-2 p-2">
                    {[0,1,2,3,4,5].map(i => <div key={i} className="w-5 h-5 bg-slate-900 rounded-full justify-self-center self-center" />)}
                </div>
            );
        }
    };

    return (
        <div className={`absolute w-32 h-32 bg-slate-100 rounded-2xl border-2 border-slate-300 shadow-inner flex items-center justify-center overflow-hidden ${classes}`}>
            {dots()}
        </div>
    );
}
