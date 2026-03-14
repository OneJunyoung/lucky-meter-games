'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import ScoreBoard from '../ScoreBoard';
import GameOver from '../GameOver';

const BOARD_SIZE = 15;

type Player = 'black' | 'white' | null;

export default function Gomoku() {
  const [board, setBoard] = useState<Player[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is Black
  const [winner, setWinner] = useState<Player | 'draw'>(null);
  const [score, setScore] = useState(0); // Win count
  const [highScore, setHighScore] = useState(0);

  const initGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setIsPlayerTurn(true);
    setWinner(null);
  }, []);

  const checkWin = (grid: Player[][], r: number, c: number, targetPlayer: Player): boolean => {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1] // Horizontal, Vertical, Diagonal D, Diagonal U
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      // Forward
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && grid[nr][nc] === targetPlayer) count++;
        else break;
      }
      // Backward
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && grid[nr][nc] === targetPlayer) count++;
        else break;
      }
      
      if (count >= 5) return true;
    }
    return false;
  };

  const handleCellClick = (r: number, c: number) => {
    if (!isPlayerTurn || winner || board[r][c] !== null) return;

    // Player Move
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 'black';
    setBoard(newBoard);
    
    if (checkWin(newBoard, r, c, 'black')) {
      setWinner('black');
      setScore(s => s + 1);
      if(score + 1 > highScore) setHighScore(score + 1);
      return;
    }

    setIsPlayerTurn(false);
  };

  // Simple rule-based AI
  // Note: Minimax is too heavy for 15x15 without deep optimizations, using a heuristic weighting
  useEffect(() => {
    if (isPlayerTurn || winner) return;

    // Simulate thinking delay
    const timer = setTimeout(() => {
      let bestScore = -Infinity;
      let move = { r: -1, c: -1 };
      
      const newBoard = board.map(row => [...row]);

      // Simple heuristic: block player's wins immediately if possible, or build lines
      // For token limits, checking random empty spot if no immediate blocks are detected, but ideally we evaluate all empty cells
      // 1. Find all empty cells adjacent to pieces to limit search space
      const candidates: {r: number, c: number}[] = [];
      for(let i=0; i<BOARD_SIZE; i++){
          for(let j=0; j<BOARD_SIZE; j++){
              if(newBoard[i][j] === null) {
                  // Check neighbors 1 step away
                  let hasNeighbor = false;
                  for(let di=-1; di<=1; di++) {
                      for(let dj=-1; dj<=1; dj++){
                          if(i+di >= 0 && i+di < BOARD_SIZE && j+dj >= 0 && j+dj < BOARD_SIZE && newBoard[i+di][j+dj] !== null) {
                              hasNeighbor = true;
                          }
                      }
                  }
                  if(hasNeighbor) candidates.push({r: i, c: j});
              }
          }
      }

      if (candidates.length === 0) {
          // AI makes first move in center if board was empty (not usually applicable here)
          move = { r: Math.floor(BOARD_SIZE/2), c: Math.floor(BOARD_SIZE/2) };
      } else {
         // Evaluate (Very basic block / win weight)
         for (const cand of candidates) {
             let cellScore = 0;
             
             // Check if AI can win here
             newBoard[cand.r][cand.c] = 'white';
             if (checkWin(newBoard, cand.r, cand.c, 'white')) {
                  cellScore += 10000;
             }
             newBoard[cand.r][cand.c] = null;

             // Check if Player is about to win here
             newBoard[cand.r][cand.c] = 'black';
             if (checkWin(newBoard, cand.r, cand.c, 'black')) {
                  cellScore += 5000; // Block must be prioritized just below winning
             }
             newBoard[cand.r][cand.c] = null;
             
             // Add random noise for variety if scores are equal
             cellScore += Math.random() * 10;

             if (cellScore > bestScore) {
                 bestScore = cellScore;
                 move = cand;
             }
         }
      }

      if (move.r !== -1) {
          newBoard[move.r][move.c] = 'white';
          setBoard(newBoard);
          if (checkWin(newBoard, move.r, move.c, 'white')) {
             setWinner('white');
          } else {
             // Check draw
             if (newBoard.every(row => row.every(cell => cell !== null))) {
                 setWinner('draw');
             } else {
                 setIsPlayerTurn(true);
             }
          }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, board, winner]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        <ScoreBoard score={score} highScore={highScore} onRestart={initGame} title={isPlayerTurn ? "Your Turn (Black)" : "AI Turn (White)"} />
        
        <div className="bg-[#DEB887] p-4 rounded-xl shadow-2xl relative w-full aspect-square border-4 border-[#8B4513]">
          <div className="grid w-full h-full relative" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)` }}>
            {/* Draw lines */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <div key={`h-${i}`} className="absolute bg-[#8B4513]/50 w-full" style={{ height: '1px', top: `calc(${(i * 100) / BOARD_SIZE}% + ${100 / BOARD_SIZE / 2}%)` }} />
              ))}
              {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <div key={`v-${i}`} className="absolute bg-[#8B4513]/50 h-full" style={{ width: '1px', left: `calc(${(i * 100) / BOARD_SIZE}% + ${100 / BOARD_SIZE / 2}%)` }} />
              ))}
            </div>

            {/* Interactive Grid Nodes */}
            {board.map((row, r) => 
              row.map((cell, c) => (
                <div 
                  key={`${r}-${c}`}
                  className="relative z-10 w-full h-full flex items-center justify-center cursor-pointer group"
                  onClick={() => handleCellClick(r, c)}
                >
                    {/* Hover indicator */}
                    {!cell && isPlayerTurn && !winner && (
                        <div className="w-[60%] h-[60%] rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    
                    {/* Piece */}
                    {cell && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`w-[80%] h-[80%] rounded-full shadow-lg ${cell === 'black' ? 'bg-black' : 'bg-white'}`}
                        />
                    )}
                </div>
              ))
            )}
          </div>

          {winner && (
              <GameOver 
                isOpen={!!winner}
                score={score}
                isNewHighScore={winner === 'black' && score > highScore}
                onRestart={initGame}
                title={winner === 'black' ? 'Victory!' : winner === 'white' ? 'Defeat!' : 'Draw!'}
                message={winner === 'black' ? 'You lined up 5 in a row!' : 'The AI outsmarted you.'}
              />
          )}
        </div>
      </div>
    </div>
  );
}
