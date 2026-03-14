'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreBoard from '../ScoreBoard';
import GameOver from '../GameOver';

const CANDY_COLORS = [
  'bg-red-500', 
  'bg-blue-500', 
  'bg-green-500', 
  'bg-yellow-400', 
  'bg-purple-500', 
  'bg-orange-500'
];

const width = 8;
const boardSize = width * width;

export default function CandyMatch() {
  const [board, setBoard] = useState<string[]>([]);
  const [draggedCandyId, setDraggedCandyId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);

  // Initialize Board
  const createBoard = useCallback(() => {
    const randomBoard = Array.from({ length: boardSize }, () => 
      CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)]
    );
    setBoard(randomBoard);
    setScore(0);
    setMovesLeft(20);
    setGameOver(false);
  }, []);

  useEffect(() => {
    createBoard();
  }, [createBoard]);
  
  // Logic to process matches (simplified for tokens, checks horizontal & vertical >= 3)
  const checkMatches = useCallback(() => {
    if (board.length === 0) return false;
    let matchFound = false;
    const newBoard = [...board];

    // Check Rows
    for (let i = 0; i < boardSize; i++) {
      const isRightEdge1 = (i % width) === width - 1;
      const isRightEdge2 = (i % width) === width - 2;
      
      if (isRightEdge1 || isRightEdge2) continue; // Skip edge elements for 3-match

      const color = newBoard[i];
      if (!color) continue;

      if (newBoard[i + 1] === color && newBoard[i + 2] === color) {
        newBoard[i] = '';
        newBoard[i + 1] = '';
        newBoard[i + 2] = '';
        matchFound = true;
      }
    }

    // Check Columns
    for (let i = 0; i < boardSize - (width * 2); i++) {
      const color = newBoard[i];
      if (!color) continue;

      if (newBoard[i + width] === color && newBoard[i + (width * 2)] === color) {
        newBoard[i] = '';
        newBoard[i + width] = '';
        newBoard[i + (width * 2)] = '';
        matchFound = true;
      }
    }

    if (matchFound) {
      setBoard(newBoard);
      setScore(s => s + 30);
    }
    return matchFound;
  }, [board]);

  // Pull down new candies to fill empty spots
  const pullDownCandies = useCallback(() => {
    let boardChanged = false;
    const newBoard = [...board];
    
    for (let i = boardSize - 1; i >= width; i--) {
      if (newBoard[i] === '') {
        // Find nearest candy above
        let candyAboveIdx = i - width;
        while (candyAboveIdx >= 0 && newBoard[candyAboveIdx] === '') {
          candyAboveIdx -= width;
        }

        if (candyAboveIdx >= 0) {
          newBoard[i] = newBoard[candyAboveIdx];
          newBoard[candyAboveIdx] = '';
          boardChanged = true;
        }
      }
    }

    // Fill top empty spaces
    for (let i = 0; i < boardSize; i++) {
        if(newBoard[i] === '') {
            newBoard[i] = CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)];
            boardChanged = true;
        }
    }

    if(boardChanged) {
        setBoard(newBoard);
    }
  }, [board]);


  useEffect(() => {
    const timer = setTimeout(() => {
      const hasMatch = checkMatches();
      if (!hasMatch) {
         pullDownCandies();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [checkMatches, pullDownCandies]);

  // Handle Dragging
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if(gameOver || movesLeft <= 0) return;
    setDraggedCandyId(index);
    e.dataTransfer.setData('text/plain', index.toString()); // Required for Firefox drag support
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedCandyId === null || gameOver || movesLeft <= 0) return;

    
    // Check adjacency (left, right, up, down)
    const validMoves = [
        draggedCandyId - 1, draggedCandyId + 1, 
        draggedCandyId - width, draggedCandyId + width
    ];

    // Wrap around edge cases protection
    const isLeftEdge = draggedCandyId % width === 0;
    const isRightEdge = draggedCandyId % width === width - 1;
    if (isLeftEdge && targetIndex === draggedCandyId - 1) { setDraggedCandyId(null); return; }
    if (isRightEdge && targetIndex === draggedCandyId + 1) { setDraggedCandyId(null); return; }

    if (validMoves.includes(targetIndex)) {
        const newBoard = [...board];
        const temp = newBoard[targetIndex];
        newBoard[targetIndex] = newBoard[draggedCandyId];
        newBoard[draggedCandyId] = temp;
        
        setBoard(newBoard);
        setMovesLeft(m => m - 1);
        setDraggedCandyId(null);
    } else {
        setDraggedCandyId(null); // Reset if invalid move
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Game Over handling
  useEffect(() => {
      if(movesLeft <= 0 && !gameOver) {
          setGameOver(true);
          if(score > highScore) setHighScore(score);
      }
  }, [movesLeft, score, highScore, gameOver]);


  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center w-full max-w-[400px]">
        
        <ScoreBoard 
            score={score} 
            highScore={highScore} 
            onRestart={createBoard} 
            title={`Moves: ${movesLeft}`} 
        />

        <div 
            className="w-full aspect-square bg-slate-900/80 rounded-2xl p-2 grid grid-cols-8 gap-1 shadow-2xl border border-white/5 relative overflow-hidden"
        >
          <AnimatePresence>
            {board.map((color, idx) => (
                <div
                    key={idx}
                    className="w-full h-full p-0.5"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                >
                    <motion.div
                        layoutId={`candy-${idx}`}
                        className={`w-full h-full rounded-md shadow-inner cursor-pointer ${color} hover:brightness-110 active:scale-90 transition-all`}
                        draggable={!gameOver}
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, idx)}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                </div>
            ))}
          </AnimatePresence>

          {/* Game Over Modal Absolute Layer */}
          {gameOver && (
            <div className="absolute inset-0">
                <GameOver 
                    isOpen={gameOver}
                    score={score}
                    isNewHighScore={score > highScore}
                    onRestart={createBoard}
                    title="Out of Moves!"
                    message="Can you score higher next time?"
                />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
