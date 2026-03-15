'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ScoreBoard from '../ScoreBoard';
import GameOver from '../GameOver';
import ScaledGame from '../ScaledGame';
import { soundManager } from '@/utils/soundManager';

interface Bubble {
  id: string;
  r: number;
  c: number;
  x: number;
  y: number;
  color: string;
  isDropping: boolean;
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
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);
const COLS = 10;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 400;
const MAX_ROWS = Math.floor(CANVAS_HEIGHT / ROW_HEIGHT) + 2;

export default function BubblePop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  const bubblesRef = useRef<Bubble[]>([]);
  const shooterRef = useRef<Shooter | null>(null);
  const gameStateRef = useRef({ gameOver: false, score: 0, shots: 0 });
  const cannonAngleRef = useRef({ angle: Math.PI / 2, dir: 1 });

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
    for (let r = 0; r < 5; r++) {
      let cols = (r % 2 === 0) ? COLS : COLS - 1;
      for (let c = 0; c < cols; c++) {
        const xOffset = (r % 2 === 0) ? BUBBLE_RADIUS : BUBBLE_DIAMETER;
        initialBubbles.push({
          id: `${r}-${c}-${Math.random()}`,
          r: r,
          c: c,
          x: c * BUBBLE_DIAMETER + xOffset,
          y: r * ROW_HEIGHT + BUBBLE_RADIUS,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          isDropping: false
        });
      }
    }
    
    bubblesRef.current = initialBubbles;
    gameStateRef.current = { gameOver: false, score: 0, shots: 0 };
    cannonAngleRef.current = { angle: Math.PI / 2, dir: 1 };
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

    const angle = cannonAngleRef.current.angle;
    const speed = 12;

    shooterRef.current.vx = Math.cos(angle) * speed;
    shooterRef.current.vy = -Math.sin(angle) * speed;
    shooterRef.current.isFired = true;
    soundManager.playSynth('pop'); // Launch sound
  };

  const shiftGridDown = useCallback(() => {
      bubblesRef.current.forEach(b => {
          if (!b.isDropping) {
              b.r += 1;
              if (b.r % 2 !== 0 && b.c === COLS - 1) {
                  b.c = Math.max(0, b.c - 1);
              }
          }
      });

      for (let c = 0; c < COLS; c++) {
           bubblesRef.current.push({
               id: Date.now() + Math.random().toString() + c,
               r: 0,
               c: c,
               x: c * (BUBBLE_DIAMETER) + BUBBLE_RADIUS,
               y: -BUBBLE_RADIUS,
               color: COLORS[Math.floor(Math.random() * COLORS.length)],
               isDropping: false
           });
      }
  }, []);

  const getNeighbors = (r: number, c: number) => {
    const dirsEven = [[-1,-1], [-1,0], [0,-1], [0,1], [1,-1], [1,0]];
    const dirsOdd = [[-1,0], [-1,1], [0,-1], [0,1], [1,0], [1,1]];
    const dirs = r % 2 === 0 ? dirsEven : dirsOdd;
    
    return dirs.map(d => ({r: r + d[0], c: c + d[1]}))
               .filter(pos => pos.r >= 0 && pos.c >= 0 && pos.c < ((pos.r % 2 === 0) ? COLS : COLS - 1));
  };

  const findMatchCluster = (r: number, c: number, color: string) => {
      const matchIds: string[] = [];
      const visited = new Set<string>();
      const queue = [{r, c}];
      
      const startBubble = bubblesRef.current.find(b => b.r === r && b.c === c && !b.isDropping);
      if(!startBubble) return [];

      visited.add(`${r},${c}`);
      matchIds.push(startBubble.id);

      while(queue.length > 0) {
          const curr = queue.shift()!;
          for (const n of getNeighbors(curr.r, curr.c)) {
              if (!visited.has(`${n.r},${n.c}`)) {
                  const b = bubblesRef.current.find(bz => bz.r === n.r && bz.c === n.c && !bz.isDropping);
                  if (b && b.color === color) {
                      visited.add(`${n.r},${n.c}`);
                      matchIds.push(b.id);
                      queue.push(n);
                  }
              }
          }
      }
      return matchIds;
  };

  const dropOrphans = useCallback(() => {
      const connected = new Set<string>();
      const queue: {r: number, c: number}[] = [];
      
      bubblesRef.current.forEach(b => {
          if (b.r === 0 && !b.isDropping) {
              connected.add(`${b.r},${b.c}`);
              queue.push({r: b.r, c: b.c});
          }
      });

      while(queue.length > 0) {
          const curr = queue.shift()!;
          for (const n of getNeighbors(curr.r, curr.c)) {
              if (!connected.has(`${n.r},${n.c}`)) {
                  const b = bubblesRef.current.find(bz => bz.r === n.r && bz.c === n.c && !bz.isDropping);
                  if (b) {
                      connected.add(`${n.r},${n.c}`);
                      queue.push(n);
                  }
              }
          }
      }

      let droppedCount = 0;
      bubblesRef.current.forEach(b => {
          if (!b.isDropping && !connected.has(`${b.r},${b.c}`)) {
              b.isDropping = true;
              droppedCount++;
          }
      });
      
      if (droppedCount > 0) {
          gameStateRef.current.score += droppedCount * 20; 
          setScore(gameStateRef.current.score);
      }
  }, []);

  const update = useCallback(() => {
    if (gameStateRef.current.gameOver) return;

    // Cannon rotation
    const ROTATION_SPEED = 0.05;
    cannonAngleRef.current.angle += ROTATION_SPEED * cannonAngleRef.current.dir;

    if (cannonAngleRef.current.angle >= Math.PI - 0.1) {
      cannonAngleRef.current.dir = -1;
      cannonAngleRef.current.angle = Math.PI - 0.1;
    } else if (cannonAngleRef.current.angle <= 0.1) {
      cannonAngleRef.current.dir = 1;
      cannonAngleRef.current.angle = 0.1;
    }

    // Dropping bubbles
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        let b = bubblesRef.current[i];
        if (b.isDropping) {
            b.y += 10;
            if (b.y > CANVAS_HEIGHT + 20) {
                bubblesRef.current.splice(i, 1);
            }
        } else {
            const expectedX = b.c * BUBBLE_DIAMETER + (b.r % 2 === 0 ? BUBBLE_RADIUS : BUBBLE_DIAMETER);
            const expectedY = b.r * ROW_HEIGHT + BUBBLE_RADIUS;
            b.x += (expectedX - b.x) * 0.2;
            b.y += (expectedY - b.y) * 0.2;
        }
    }

    const shooter = shooterRef.current;
    if (shooter && shooter.isFired) {
      shooter.x += shooter.vx;
      shooter.y += shooter.vy;

      // Wall bounce
      if (shooter.x - BUBBLE_RADIUS <= 0 || shooter.x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
        shooter.vx *= -1;
        shooter.x = Math.max(BUBBLE_RADIUS, Math.min(CANVAS_WIDTH - BUBBLE_RADIUS, shooter.x));
      }

      let hit = false;
      if (shooter.y - BUBBLE_RADIUS <= 0) hit = true; // hit ceiling
      
      if (!hit) {
        for (const b of bubblesRef.current) {
          if (b.isDropping) continue;
          const dx = shooter.x - b.x;
          const dy = shooter.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BUBBLE_RADIUS * 1.8) { 
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        let minDiff = Infinity;
        let bestR = 0;
        let bestC = 0;
        
        let targetY = Math.max(BUBBLE_RADIUS, shooter.y);

        let startR = Math.max(0, Math.floor((targetY - BUBBLE_RADIUS) / ROW_HEIGHT) - 1);
        let endR = Math.min(MAX_ROWS, startR + 3);
        
        // Find closest empty grid cell
        for (let r = startR; r <= endR; r++) {
            let cols = (r % 2 === 0) ? COLS : COLS - 1;
            for (let c = 0; c < cols; c++) {
                if (!bubblesRef.current.find(b => b.r === r && b.c === c && !b.isDropping)) {
                    let cx = c * BUBBLE_DIAMETER + (r % 2 === 0 ? BUBBLE_RADIUS : BUBBLE_DIAMETER);
                    let cy = r * ROW_HEIGHT + BUBBLE_RADIUS;
                    let dist = Math.hypot(shooter.x - cx, shooter.y - cy);
                    if (dist < minDiff) {
                        minDiff = dist;
                        bestR = r;
                        bestC = c;
                    }
                }
            }
        }

        const newBubble = {
            id: Date.now() + Math.random().toString(),
            r: bestR,
            c: bestC,
            x: shooter.x,
            y: shooter.y,
            color: shooter.color,
            isDropping: false
        };
        bubblesRef.current.push(newBubble);
        
        const matchCluster = findMatchCluster(bestR, bestC, shooter.color);
        if (matchCluster.length >= 3) {
            matchCluster.forEach(id => {
               const b = bubblesRef.current.find(b => b.id === id);
               if (b) {
                   b.isDropping = true;
                   gameStateRef.current.score += 10;
               }
            });
            setScore(gameStateRef.current.score);
            soundManager.playSynth('pop');

            dropOrphans();
        } else {
            gameStateRef.current.shots++;
            soundManager.playSynth('click'); 
            
            if (gameStateRef.current.shots >= 5) {
                gameStateRef.current.shots = 0;
                shiftGridDown();
            }
        }

        // Lose condition
        const activeBubbles = bubblesRef.current.filter(b => !b.isDropping);
        const bottomMost = Math.max(...activeBubbles.map(b => b.r * ROW_HEIGHT + BUBBLE_RADIUS), 0);
        
        if (bottomMost > CANVAS_HEIGHT - 60) {
            setGameOver(true);
            gameStateRef.current.gameOver = true;
            if(gameStateRef.current.score > highScore) setHighScore(gameStateRef.current.score);
        } else if (activeBubbles.length === 0) {
            setHasWon(true);
            setGameOver(true);
            gameStateRef.current.gameOver = true;
            if(gameStateRef.current.score > highScore) setHighScore(gameStateRef.current.score);
        } else {
            spawnShooter();
        }
      }
    }
  }, [highScore, spawnShooter, dropOrphans, shiftGridDown]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubblesRef.current.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
    });

    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - BUBBLE_RADIUS - 10);
    ctx.rotate(Math.PI / 2 - cannonAngleRef.current.angle);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-4, -40, 8, 40);
    ctx.restore();

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
    <ScaledGame logicalWidth={320} logicalHeight={520}>
      <div className="w-full max-w-[320px] w-[320px]">
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
                gameId="bubble-pop"
              />
          )}
        </div>
      </div>
    </ScaledGame>
  );
}
