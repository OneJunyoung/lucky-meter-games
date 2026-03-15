'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users } from 'lucide-react';
import ScoreBoard from '../ScoreBoard';
import GameOver from '../GameOver';
import ScaledGame from '../ScaledGame';
import { soundManager } from '@/utils/soundManager';

const BOARD_SIZE = 15;

type Player = 'black' | 'white' | null;
type GameMode = 'vs-ai' | 'pvp';

export default function Gomoku() {
  const [mode, setMode] = useState<GameMode>('vs-ai');
  const [board, setBoard] = useState<Player[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [winner, setWinner] = useState<Player | 'draw'>(null);
  
  // Scores
  const [scoreAI, setScoreAI] = useState(0); 
  const [highScoreAI, setHighScoreAI] = useState(0);
  const [scorePvP, setScorePvP] = useState(0);
  const [highScorePvP, setHighScorePvP] = useState(0);

  const initGame = useCallback((newMode?: GameMode) => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer('black');
    setWinner(null);
    if(newMode) setMode(newMode);
  }, []);

  const changeMode = (newMode: GameMode) => {
      if(newMode === mode) return;
      soundManager.playSynth('click');
      initGame(newMode);
  };

  const checkWin = (grid: Player[][], r: number, c: number, targetPlayer: Player): boolean => {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1] 
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && grid[nr][nc] === targetPlayer) count++;
        else break;
      }
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
    // If it's vs-ai and it's White's turn, ignore clicks
    if (mode === 'vs-ai' && currentPlayer === 'white') return;
    if (winner || board[r][c] !== null) return;
    
    soundManager.playSynth('pop');

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = currentPlayer;
    setBoard(newBoard);
    
    if (checkWin(newBoard, r, c, currentPlayer)) {
      setWinner(currentPlayer);
      if(mode === 'vs-ai' && currentPlayer === 'black') {
          setScoreAI(s => {
             const newScore = s + 1;
             setHighScoreAI(h => Math.max(h, newScore));
             return newScore;
          });
      }
      if(mode === 'pvp') {
          setScorePvP(s => {
             const newScore = s + 1;
             setHighScorePvP(h => Math.max(h, newScore));
             return newScore;
          });
      }
      return;
    }

    if (newBoard.every(row => row.every(cell => cell !== null))) {
        setWinner('draw');
        return;
    }

    setCurrentPlayer(prev => prev === 'black' ? 'white' : 'black');
  };

  // --- HARD AI HEURISTIC LOGIC ---
  
  // Evaluates a single line of consecutive pieces in one direction
  const evaluateDirection = (grid: Player[][], r: number, c: number, dr: number, dc: number, player: Player): number => {
      let count = 1;
      let blockedEnds = 0;

      // Forward
      let i = 1;
      while (true) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) {
              blockedEnds++;
              break;
          }
          if (grid[nr][nc] === player) {
              count++;
          } else if (grid[nr][nc] !== null) {
              blockedEnds++;
              break;
          } else {
              // Empty space
              break;
          }
          i++;
      }

      // Backward
      i = 1;
      while (true) {
          const nr = r - dr * i;
          const nc = c - dc * i;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) {
              blockedEnds++;
              break;
          }
          if (grid[nr][nc] === player) {
              count++;
          } else if (grid[nr][nc] !== null) {
              blockedEnds++;
              break;
          } else {
              break;
          }
          i++;
      }

      if (count >= 5) return 10000000; // Win
      
      if (count === 4) {
          if (blockedEnds === 0) return 1000000; // Open 4 (guaranteed win next turn)
          if (blockedEnds === 1) return 100000;  // Blocked 4 (must defend/attack immediately)
      }
      
      if (count === 3) {
          if (blockedEnds === 0) return 50000; // Open 3 (deadly if unchecked)
          if (blockedEnds === 1) return 10000;
      }

      if (count === 2) {
          if (blockedEnds === 0) return 5000;
          if (blockedEnds === 1) return 500;
      }

      if (count === 1) {
          if (blockedEnds === 0) return 10;
      }

      return 0;
  };

  const evaluateCell = (grid: Player[][], r: number, c: number, player: Player): number => {
      let score = 0;
      const directions = [ [1, 0], [0, 1], [1, 1], [1, -1] ];
      for (const [dr, dc] of directions) {
          score += evaluateDirection(grid, r, c, dr, dc, player);
      }
      return score;
  };

  useEffect(() => {
    // Only AI plays when mode is vs-ai and it's white's turn
    if (mode === 'pvp' || currentPlayer === 'black' || winner) return;

    // Simulate thinking delay so it feels natural
    const timer = setTimeout(() => {
      let bestScore = -Infinity;
      let bestMoves: {r: number, c: number}[] = [];
      
      const newBoard = board.map(row => [...row]);

      // Optimize: Only check empty cells that are adjacent to at least one placed piece (max radius 2)
      const candidates: {r: number, c: number}[] = [];
      let isBoardEmpty = true;

      for(let i=0; i<BOARD_SIZE; i++){
          for(let j=0; j<BOARD_SIZE; j++){
              if(newBoard[i][j] !== null) {
                  isBoardEmpty = false;
                  continue;
              }
              // Check neighbors within 2 steps
              let hasNeighbor = false;
              for(let di=-2; di<=2; di++) {
                  for(let dj=-2; dj<=2; dj++){
                      if(i+di >= 0 && i+di < BOARD_SIZE && j+dj >= 0 && j+dj < BOARD_SIZE && newBoard[i+di][j+dj] !== null) {
                          hasNeighbor = true;
                      }
                  }
              }
              if(hasNeighbor) candidates.push({r: i, c: j});
          }
      }

      if (isBoardEmpty) {
          // AI plays center if it happens to go first (not currently standard, but good fallback)
          bestMoves.push({ r: Math.floor(BOARD_SIZE/2), c: Math.floor(BOARD_SIZE/2) });
      } else {
         for (const cand of candidates) {
             // 1. How good is this move for AI offensively?
             newBoard[cand.r][cand.c] = 'white';
             const offendScore = evaluateCell(newBoard, cand.r, cand.c, 'white');
             newBoard[cand.r][cand.c] = null;

             // 2. How critical is this move for stopping the Player?
             newBoard[cand.r][cand.c] = 'black';
             const defendScore = evaluateCell(newBoard, cand.r, cand.c, 'black');
             newBoard[cand.r][cand.c] = null;

             // Defensive plays are heavily weighted slightly higher to ensure blocks happen if scores tie
             const totalScore = offendScore + (defendScore * 1.05);

             if (totalScore > bestScore) {
                 bestScore = totalScore;
                 bestMoves = [cand];
             } else if (totalScore === bestScore) {
                 bestMoves.push(cand);
             }
         }
      }

      // Pick randomly from equal best moves to prevent totally deterministic games
      const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];

      if (move) {
          newBoard[move.r][move.c] = 'white';
          setBoard(newBoard);
          soundManager.playSynth('pop'); 
          
          if (checkWin(newBoard, move.r, move.c, 'white')) {
             setWinner('white');
          } else {
             if (newBoard.every(row => row.every(cell => cell !== null))) {
                 setWinner('draw');
             } else {
                 setCurrentPlayer('black');
             }
          }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [currentPlayer, board, winner, mode]);


  // Determine Titles
  let displayTitle = '';
  if (mode === 'vs-ai') {
      displayTitle = currentPlayer === 'black' ? "Your Turn (Black)" : "AI thinking... (White)";
  } else {
      displayTitle = currentPlayer === 'black' ? "Black's Turn" : "White's Turn";
  }

  const getGameOverTitle = () => {
       if (winner === 'draw') return "Draw!";
       if (mode === 'vs-ai') {
           return winner === 'black' ? 'Victory!' : 'Defeat!';
       } else {
           return winner === 'black' ? 'Black Wins!' : 'White Wins!';
       }
  };

  const getGameOverMessage = () => {
      if(winner === 'draw') return "The board is full.";
      if (mode === 'vs-ai') {
          return winner === 'black' ? 'You lined up 5 in a row!' : 'The advanced AI outsmarted you.';
      } else {
          return `${winner === 'black' ? 'Black' : 'White'} matched 5 in a row!`;
      }
  };

  return (
    <ScaledGame logicalWidth={500} logicalHeight={720}>
      <div className="w-full max-w-[500px] w-[500px]">
        
        {/* Top bar with Mode Toggle */}
        <div className="flex bg-slate-900/50 rounded-2xl p-2 mb-4 shadow-xl border border-white/5 backdrop-blur-sm gap-2 w-full">
            <button 
                onClick={() => changeMode('vs-ai')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    mode === 'vs-ai' 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                    : 'bg-transparent text-slate-400 hover:bg-white/5'
                }`}
            >
                <Bot className="w-5 h-5" />
                Vs AI
            </button>
            <button 
                onClick={() => changeMode('pvp')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    mode === 'pvp' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                    : 'bg-transparent text-slate-400 hover:bg-white/5'
                }`}
            >
                <Users className="w-5 h-5" />
                Play with Friend
            </button>
        </div>

        <ScoreBoard 
           score={mode === 'vs-ai' ? scoreAI : scorePvP} 
           highScore={mode === 'vs-ai' ? Math.max(scoreAI, highScoreAI) : Math.max(scorePvP, highScorePvP)} 
           onRestart={() => initGame()} 
           title={displayTitle} 
        />
        
        <div className="bg-[#DEB887] p-2 sm:p-4 rounded-xl shadow-2xl relative w-full aspect-square border-4 border-[#8B4513]">
          <div className="grid w-full h-full relative" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)` }}>
            {/* Draw lines */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <div key={`h-${i}`} className="absolute bg-[#8B4513]/50 w-full" style={{ height: '1.5px', top: `calc(${(i * 100) / BOARD_SIZE}% + ${100 / BOARD_SIZE / 2}%)` }} />
              ))}
              {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <div key={`v-${i}`} className="absolute bg-[#8B4513]/50 h-full" style={{ width: '1.5px', left: `calc(${(i * 100) / BOARD_SIZE}% + ${100 / BOARD_SIZE / 2}%)` }} />
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
                    {!cell && !winner && (mode === 'pvp' || currentPlayer === 'black') && (
                        <div className={`w-[60%] h-[60%] rounded-full opacity-0 group-hover:opacity-40 transition-opacity ${currentPlayer === 'black' ? 'bg-black' : 'bg-white'}`} flex-shrink-0 />
                    )}
                    
                    {/* Piece */}
                    {cell && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`w-[85%] h-[85%] rounded-full shadow-lg flex-shrink-0 ${
                              cell === 'black' 
                               ? 'bg-gradient-to-br from-slate-700 to-black ring-1 ring-black/50' 
                               : 'bg-gradient-to-br from-white to-slate-200 ring-1 ring-black/20'
                          }`}
                        />
                    )}

                    {/* Highlight last move loosely by adding a tiny inner ring if we ever track it, keeping it clean for now */}
                </div>
              ))
            )}
          </div>

          {winner && (
              <GameOver 
                isOpen={!!winner}
                score={mode === 'vs-ai' ? scoreAI : scorePvP}
                isNewHighScore={false}
                onRestart={() => initGame()}
                title={getGameOverTitle()}
                message={getGameOverMessage()}
              />
          )}
        </div>
      </div>
    </ScaledGame>
  );
}
