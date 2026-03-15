'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ScoreBoard from '../ScoreBoard';
import GameOver from '../GameOver';
import ScaledGame from '../ScaledGame';
import { soundManager } from '@/utils/soundManager';

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

export default function ScooterRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Image Refs
  const scooterImgRef = useRef<HTMLImageElement | null>(null);
  const elephantImgRef = useRef<HTMLImageElement | null>(null);
  const birdImgRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
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
      soundManager.playSynth('hover');
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
    // Load images
    let loadedCount = 0;
    const onload = () => {
      loadedCount++;
      if (loadedCount === 3) setImagesLoaded(true);
    };

    const ts = `?t=${Date.now()}-v2`;
    const scooter = new Image();
    scooter.src = `/assets/games/scooter/player.png${ts}`;
    scooter.onload = onload;
    scooterImgRef.current = scooter;

    const elephant = new Image();
    elephant.src = `/assets/games/scooter/elephant.png${ts}`;
    elephant.onload = onload;
    elephantImgRef.current = elephant;

    const bird = new Image();
    bird.src = `/assets/games/scooter/bird.png${ts}`;
    bird.onload = onload;
    birdImgRef.current = bird;

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
        y: isFlying ? CANVAS_HEIGHT - 85 : CANVAS_HEIGHT - 35, // Raised flying obstacle by 25px
        width: isFlying ? 40 : 40,
        height: isFlying ? 30 : 35
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

    // Draw Obstacles (Elephant or Bird)
    state.obstacles.forEach(obs => {
      // Differentiate by y coordinate rather than width
      const isFlying = obs.y < CANVAS_HEIGHT - 50; 
      const img = isFlying ? birdImgRef.current : elephantImgRef.current;
      if (img && imagesLoaded) {
          ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
      } else {
          // Fallback
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
    });

    // Draw Player (Scooter)
    const d = state.dino;
    if (scooterImgRef.current && imagesLoaded) {
        // The image might have built in padding, fine tune drawing boundaries
        ctx.drawImage(scooterImgRef.current, d.x, d.y, d.width + 10, d.height);
    } else {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(d.x, d.y, d.width, d.height);
    }
    
  }, [imagesLoaded]);

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
    <ScaledGame logicalWidth={600} logicalHeight={350}>
      <div className="w-full max-w-[600px] w-[600px]">
        <ScoreBoard score={score} highScore={highScore} onRestart={initGame} title="Scooter Run" />
        
        <div 
          className="relative border-4 border-slate-700/50 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl glass-card cursor-pointer"
          onPointerDown={jump}
        >
          {!imagesLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20 text-white animate-pulse">
                  Loading Assets...
              </div>
          )}

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
                message="Watch out for the animals!"
                gameId="scooter-run"
              />
          )}
        </div>
      </div>
    </ScaledGame>
  );
}
