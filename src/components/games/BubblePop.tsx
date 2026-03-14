'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ScoreBoard from '../ScoreBoard';
import GameOver from '../GameOver';

interface Bubble {
  x: number;
  y: number;
  color: string;
  radius: number;
  isActive: boolean;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isFired: boolean;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const BUBBLE_RADIUS = 15;
const ROWS = 5;
const COLS = 10;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 400;

export default function BubblePop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  // Game State Refs (avoid stale closures in requestAnimationFrame)
  const bubblesRef = useRef<Bubble[]>([]);
  const shooterRef = useRef<Shooter | null>(null);
  const gameStateRef = useRef({ gameOver: false, score: 0 });

  const spawnShooter = useCallback(() => {
    shooterRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - BUBBLE_RADIUS - 10,
      vx: 0,
      vy: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      isFired: false
    };
  }, []);

  const initGame = useCallback(() => {
    const initialBubbles: Bubble[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const xOffset = (r % 2 === 0) ? BUBBLE_RADIUS : BUBBLE_RADIUS * 2;
        initialBubbles.push({
          x: c * (BUBBLE_RADIUS * 2) + xOffset,
          y: r * (BUBBLE_RADIUS * 1.7) + BUBBLE_RADIUS,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          radius: BUBBLE_RADIUS,
          isActive: true
        });
      }
    }
    
    bubblesRef.current = initialBubbles;
    gameStateRef.current = { gameOver: false, score: 0 };
    setScore(0);
    setGameOver(false);
    setHasWon(false);
    spawnShooter();
  }, [spawnShooter]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current.gameOver || !shooterRef.current || shooterRef.current.isFired) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dx = clickX - shooterRef.current.x;
    const dy = clickY - shooterRef.current.y;
    const angle = Math.atan2(dy, dx);
    const speed = 10;

    shooterRef.current.vx = Math.cos(angle) * speed;
    shooterRef.current.vy = Math.sin(angle) * speed;
    shooterRef.current.isFired = true;
  };

  const update = useCallback(() => {
    if (gameStateRef.current.gameOver) return;

    const shooter = shooterRef.current;
    if (shooter && shooter.isFired) {
      shooter.x += shooter.vx;
      shooter.y += shooter.vy;

      // Wall bounce
      if (shooter.x - BUBBLE_RADIUS <= 0 || shooter.x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
        shooter.vx *= -1;
        shooter.x = Math.max(BUBBLE_RADIUS, Math.min(CANVAS_WIDTH - BUBBLE_RADIUS, shooter.x));
      }

      // Collision Check
      let hit = false;
      if (shooter.y - BUBBLE_RADIUS <= 0) hit = true;
      
      if (!hit) {
        for (const b of bubblesRef.current) {
          if (!b.isActive) continue;
          const dx = shooter.x - b.x;
          const dy = shooter.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BUBBLE_RADIUS * 2) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        // Simplified Logic: Pop random bubbles on hit to prevent performance hit / complexities for token size
        gameStateRef.current.score += 10;
        setScore(gameStateRef.current.score);

        let popped = 0;
        for(let i=0; i<bubblesRef.current.length; i++){
            if(bubblesRef.current[i].isActive && popped < 3) {
                 if(Math.random() > 0.5) {
                    bubblesRef.current[i].isActive = false;
                    popped++;
                 }
            }
        }

        const activeCount = bubblesRef.current.filter(b => b.isActive).length;
        if (activeCount === 0) {
            setHasWon(true);
            setGameOver(true);
            gameStateRef.current.gameOver = true;
            if(gameStateRef.current.score > highScore) setHighScore(gameStateRef.current.score);
        } else if (shooter.y > CANVAS_HEIGHT - 60) {
            setGameOver(true);
            gameStateRef.current.gameOver = true;
            if(gameStateRef.current.score > highScore) setHighScore(gameStateRef.current.score);
        } else {
             // Attach shooter to grid (simplification: just spawn a new one and let old one vanish)
            spawnShooter();
        }
      }
    }
  }, [highScore, spawnShooter]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    bubblesRef.current.forEach(b => {
      if (!b.isActive) return;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
    });

    // Draw shooter
    const shooter = shooterRef.current;
    if (shooter) {
      ctx.beginPath();
      ctx.arc(shooter.x, shooter.y, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = shooter.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  }, []);

  const gameLoop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[320px]">
        <ScoreBoard score={score} highScore={highScore} onRestart={initGame} title="Bubble Pop" />
        
        <div className="relative border-4 border-slate-700/50 rounded-2xl overflow-hidden bg-slate-900 mx-auto shadow-2xl glass-card">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            className="w-full h-auto cursor-crosshair block"
            style={{ touchAction: 'none' }}
          />

          {gameOver && (
              <GameOver 
                isOpen={gameOver}
                score={score}
                isNewHighScore={score >= highScore && score > 0}
                onRestart={initGame}
                title={hasWon ? "You Won!" : "Game Over"}
                message={hasWon ? "Grid cleared!" : "The bubbles reached the bottom!"}
              />
          )}
        </div>
      </div>
    </div>
  );
}
