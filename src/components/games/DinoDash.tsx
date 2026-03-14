'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ScoreBoard from '../ScoreBoard';
import GameOver from '../GameOver';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const GRAVITY = 0.6;
const JUMP_POWER = -10;
const SPEED = 5;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function DinoDash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Game Engine State
  const gameState = useRef({
    frames: 0,
    score: 0,
    gameOver: false,
    speed: SPEED,
    dino: {
      x: 50,
      y: CANVAS_HEIGHT - 40,
      width: 30,
      height: 40,
      vy: 0,
      isGrounded: true
    },
    obstacles: [] as Rect[],
    particles: [] as {x: number, y: number, vx: number, vy: number, life: number}[]
  });

  const jump = useCallback(() => {
    if (gameState.current.gameOver) return;
    if (gameState.current.dino.isGrounded) {
      gameState.current.dino.vy = JUMP_POWER;
      gameState.current.dino.isGrounded = false;
      
      // Jump particles
      for(let i=0; i<5; i++) {
          gameState.current.particles.push({
              x: gameState.current.dino.x + 15,
              y: gameState.current.dino.y + 40,
              vx: (Math.random() - 0.5) * 4,
              vy: Math.random() * -2,
              life: 1
          });
      }
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  }, [jump]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const initGame = useCallback(() => {
    gameState.current = {
      frames: 0,
      score: 0,
      gameOver: false,
      speed: SPEED,
      dino: {
        x: 50,
        y: CANVAS_HEIGHT - 40,
        width: 30,
        height: 40,
        vy: 0,
        isGrounded: true
      },
      obstacles: [],
      particles: []
    };
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const update = useCallback(() => {
    if (gameState.current.gameOver) return;

    const state = gameState.current;
    state.frames++;

    // Score based on frames surviving
    if (state.frames % 10 === 0) {
      state.score += 1;
      setScore(state.score);
    }

    // Speed up slightly over time
    if (state.frames % 500 === 0) {
      state.speed += 0.5;
    }

    // Dino Physics
    const dino = state.dino;
    dino.vy += GRAVITY;
    dino.y += dino.vy;

    if (dino.y + dino.height >= CANVAS_HEIGHT) {
      dino.y = CANVAS_HEIGHT - dino.height;
      dino.vy = 0;
      dino.isGrounded = true;
    }

    // Spawn Obstacles
    if (state.frames % Math.max(60, 120 - Math.floor(state.speed * 5)) === 0) {
      const isFlying = Math.random() > 0.7;
      state.obstacles.push({
        x: CANVAS_WIDTH,
        y: isFlying ? CANVAS_HEIGHT - 70 : CANVAS_HEIGHT - Math.random() * 20 - 20,
        width: 20,
        height: isFlying ? 20 : Math.random() * 20 + 20
      });
    }

    // Update Obstacles & Collision
    for (let i = 0; i < state.obstacles.length; i++) {
      const obs = state.obstacles[i];
      obs.x -= state.speed;

      // AABB Collision Detect
      if (
        dino.x < obs.x + obs.width &&
        dino.x + dino.width > obs.x &&
        dino.y < obs.y + obs.height &&
        dino.y + dino.height > obs.y
      ) {
        state.gameOver = true;
        setGameOver(true);
        if (state.score > highScore) setHighScore(state.score);
      }
    }

    // Remove off-screen obstacles
    state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > 0);
    
    // Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if(p.life <= 0) state.particles.splice(i, 1);
    }
  }, [highScore]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const state = gameState.current;

    // Ground
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, CANVAS_HEIGHT - 2, canvas.width, 2);

    // Draw Particles
    state.particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.fillRect(p.x, p.y, 4, 4);
    });

    // Draw Obstacles (Cactus / Bird representation)
    ctx.fillStyle = '#ef4444'; // red-500
    state.obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Draw Dino
    ctx.fillStyle = '#22c55e'; // green-500
    const d = state.dino;
    ctx.fillRect(d.x, d.y, d.width, d.height);
    
    // Dino Eye
    ctx.fillStyle = 'white';
    ctx.fillRect(d.x + 20, d.y + 5, 4, 4);
    
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
      <div className="w-full max-w-[600px]">
        <ScoreBoard score={score} highScore={highScore} onRestart={initGame} title="Dino Dash" />
        
        <div 
          className="relative border-4 border-slate-700/50 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl glass-card cursor-pointer"
          onPointerDown={jump}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto block select-none"
            style={{ touchAction: 'none' }}
          />
          
          <div className="absolute inset-x-0 bottom-4 text-center text-slate-500 text-xs font-mono opacity-50 pointer-events-none">
             Tap or Spacebar to Jump
          </div>

          {gameOver && (
              <GameOver 
                isOpen={gameOver}
                score={score}
                isNewHighScore={score >= highScore && score > 0}
                onRestart={initGame}
                title="Crashed!"
                message="Watch out for the red obstacles!"
              />
          )}
        </div>
      </div>
    </div>
  );
}
