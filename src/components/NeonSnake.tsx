import React, { useRef, useEffect, useState } from 'react';
import { GameStatus } from '../types';
import { audio } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause } from 'lucide-react';

interface NeonSnakeProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

interface Point {
  x: number;
  y: number;
}

export const NeonSnake: React.FC<NeonSnakeProps> = ({ onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('highscore_neon-snake') || '1500');
  });
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [muted, setMuted] = useState<boolean>(false);

  // Snake coordinates, direction, and food positions
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const directionRef = useRef<Point>({ x: 1, y: 0 }); // moving right initially
  const nextDirectionRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const speedRef = useRef<number>(140); // speed interval in ms
  const lastUpdateTime = useRef<number>(0);

  const cols = 24;
  const rows = 16;

  const animationFrameId = useRef<number | null>(null);

  // Set up resize handler
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = 320;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 's', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
      }

      const dir = directionRef.current;
      const nextDir = nextDirectionRef.current;

      if ((e.key === 'ArrowUp' || e.key === 'w') && dir.y === 0 && nextDir.y === 0) {
        nextDirectionRef.current = { x: 0, y: -1 };
      } else if ((e.key === 'ArrowDown' || e.key === 's') && dir.y === 0 && nextDir.y === 0) {
        nextDirectionRef.current = { x: 0, y: 1 };
      } else if ((e.key === 'ArrowLeft' || e.key === 'a') && dir.x === 0 && nextDir.x === 0) {
        nextDirectionRef.current = { x: -1, y: 0 };
      } else if ((e.key === 'ArrowRight' || e.key === 'd') && dir.x === 0 && nextDir.x === 0) {
        nextDirectionRef.current = { x: 1, y: 0 };
      }

      if (e.key === ' ') {
        if (gameStatus === 'IDLE' || gameStatus === 'GAME_OVER') {
          startGame();
        } else if (gameStatus === 'PLAYING') {
          pauseGame();
        } else if (gameStatus === 'PAUSED') {
          resumeGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStatus]);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const generateFood = () => {
    let newFood: Point;
    let attempts = 0;
    const snake = snakeRef.current;

    do {
      newFood = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
      attempts++;
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) &&
      attempts < 100
    );

    foodRef.current = newFood;
  };

  const startGame = () => {
    audio.playCoin();
    setScore(0);
    speedRef.current = 140;
    
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    generateFood();
    
    lastUpdateTime.current = Date.now();
    setGameStatus('PLAYING');
  };

  const pauseGame = () => {
    setGameStatus('PAUSED');
  };

  const resumeGame = () => {
    setGameStatus('PLAYING');
  };

  // Main game loop
  useEffect(() => {
    if (gameStatus !== 'PLAYING') {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localScore = score;

    const gameLoop = (timestamp: number) => {
      const now = Date.now();
      const elapsed = now - lastUpdateTime.current;

      // Draw background frame even when waiting for next movement tick
      ctx.fillStyle = '#06050b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cyber retro matrix grid lines
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.05)';
      ctx.lineWidth = 1;
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * cellHeight);
        ctx.lineTo(canvas.width, j * cellHeight);
        ctx.stroke();
      }

      // 1. GAME UPDATE TICK
      if (elapsed >= speedRef.current) {
        lastUpdateTime.current = now;

        // Apply chosen direction
        directionRef.current = nextDirectionRef.current;
        const dir = directionRef.current;
        const snake = snakeRef.current;

        // Calculate new head
        const head = { ...snake[0] };
        head.x += dir.x;
        head.y += dir.y;

        // Border Wall Collisions (Wrap-around or Crash? Let's do CRASH for true retro intensity!)
        if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
          setGameStatus('GAME_OVER');
          if (localScore > highScore) {
            audio.playGameOver();
            setTimeout(() => audio.playNewHighScore(), 150);
          } else {
            audio.playGameOver();
          }
          const newHigh = Math.max(localScore, highScore);
          setHighScore(newHigh);
          localStorage.setItem('highscore_neon-snake', newHigh.toString());
          onGameOver(localScore);
          return;
        }

        // Self Collisions
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameStatus('GAME_OVER');
          if (localScore > highScore) {
            audio.playGameOver();
            setTimeout(() => audio.playNewHighScore(), 150);
          } else {
            audio.playGameOver();
          }
          const newHigh = Math.max(localScore, highScore);
          setHighScore(newHigh);
          localStorage.setItem('highscore_neon-snake', newHigh.toString());
          onGameOver(localScore);
          return;
        }

        // Add segment
        snake.unshift(head);

        // Check food collision
        const food = foodRef.current;
        if (head.x === food.x && head.y === food.y) {
          localScore += 100;
          setScore(localScore);
          audio.playPoint();
          generateFood();
          
          // Gradually speed up snake
          speedRef.current = Math.max(70, speedRef.current - 4);
        } else {
          // Remove tail
          snake.pop();
        }
      }

      // 2. RENDER FOOD (Neon Red Glow Cherry)
      const food = foodRef.current;

      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(
        food.x * cellWidth + cellWidth / 2,
        food.y * cellHeight + cellHeight / 2,
        Math.min(cellWidth, cellHeight) / 2.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. RENDER SNAKE (Neon Cyan body with glowing index head)
      const snake = snakeRef.current;
      for (let i = 0; i < snake.length; i++) {
        const seg = snake[i];
        
        if (i === 0) {
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
        } else {
          // Gradient fading down tail
          const alpha = Math.max(0.3, 1 - i / snake.length);
          ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`; // green neon
          ctx.shadowColor = 'rgba(57, 255, 20, 0.5)';
          ctx.shadowBlur = 4;
        }

        ctx.fillRect(
          seg.x * cellWidth + 2,
          seg.y * cellHeight + 2,
          cellWidth - 4,
          cellHeight - 4
        );
      }
      ctx.shadowBlur = 0;

      // Loop
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameStatus, score]);

  const changeDirection = (dx: number, dy: number) => {
    if (gameStatus !== 'PLAYING') return;
    const dir = directionRef.current;
    const nextDir = nextDirectionRef.current;
    if (dx !== 0 && (dir.x !== 0 || nextDir.x !== 0)) return; // ignore if trying to reverse horizontal
    if (dy !== 0 && (dir.y !== 0 || nextDir.y !== 0)) return; // ignore if trying to reverse vertical
    nextDirectionRef.current = { x: dx, y: dy };
  };

  return (
    <div id="cabinet-neon-snake" className="flex flex-col h-full bg-[#0d0c15] border-4 border-arcade-pink shadow-lg shadow-arcade-pink/30 rounded-none overflow-hidden crt-screen">
      {/* Game Cabinet Bezel / Top Banner */}
      <div className="flex justify-between items-center bg-black/80 px-4 py-2 border-b-2 border-arcade-pink font-arcade text-[10px] tracking-wider text-arcade-pink">
        <span className="flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-arcade-pink"></span> LIVE CABINET
        </span>
        <span className="glow-pink font-bold">NEON SNAKE</span>
        <button 
          id="btn-toggle-mute-ns"
          onClick={() => setMuted(!muted)} 
          className="hover:text-arcade-yellow transition"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Scores Overlay */}
      <div className="grid grid-cols-3 bg-black/90 p-3 text-center font-mono border-b border-arcade-pink/30 text-xs text-slate-400">
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">SCORE</div>
          <div className="font-bold text-arcade-yellow text-sm font-arcade">{score.toString().padStart(6, '0')}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">HIGH SCORE</div>
          <div className="font-bold text-arcade-cyan text-sm font-arcade">{Math.max(score, highScore).toString().padStart(6, '0')}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">SPEED</div>
          <div className="font-bold text-arcade-purple text-sm font-arcade">
            {Math.round(200 - speedRef.current)} MPH
          </div>
        </div>
      </div>

      {/* Playfield Canvas Container */}
      <div ref={containerRef} className="relative flex-grow flex items-center justify-center bg-[#06050b] min-h-[320px]">
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* HUD Overlay States */}
        {gameStatus === 'IDLE' && (
          <div id="ns-overlay-idle" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-pink glow-pink mb-3 leading-relaxed">INSERT COIN</h2>
            <p className="text-slate-400 text-xs max-w-xs mb-6 font-sans">
              Kumpul biji neon merah cerah untuk membesar dan mempercepatkan pergerakan. Elakkan melanggar dinding atau ekor sendiri!
            </p>
            <button
              id="btn-start-ns"
              onClick={startGame}
              className="flex items-center gap-2 bg-arcade-cyan hover:bg-arcade-cyan/80 text-black font-arcade text-xs px-6 py-3 border-2 border-white shadow-md shadow-arcade-cyan/50 active:scale-95 transition"
            >
              <Play size={12} /> TEKAN UNTUK MULA
            </button>
            <div className="mt-6 text-[10px] text-slate-500 font-mono">
              GUNAKAN KEKUNCI <span className="text-arcade-cyan">W A S D</span> ATAU <span className="text-arcade-cyan">↑ ↓ ← →</span>
            </div>
          </div>
        )}

        {gameStatus === 'PAUSED' && (
          <div id="ns-overlay-paused" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center">
            <h2 className="font-arcade text-lg text-arcade-yellow animate-pulse glow-yellow mb-4">PERMAINAN DIHENTIKAN</h2>
            <button
              id="btn-resume-ns"
              onClick={resumeGame}
              className="bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-6 py-3 border-2 border-white active:scale-95 transition"
            >
              SAMBUNG
            </button>
          </div>
        )}

        {gameStatus === 'GAME_OVER' && (
          <div id="ns-overlay-gameover" className="absolute inset-0 flex flex-col justify-center items-center bg-black/95 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-pink glow-pink mb-2">NEON CRASHED</h2>
            <div className="text-slate-300 font-mono text-sm mb-1 font-arcade text-[10px] my-3">
              MARKAH ANDA: <span className="text-arcade-yellow text-sm">{score}</span>
            </div>
            {score > highScore && (
              <div className="text-arcade-yellow font-arcade text-[8px] animate-bounce mb-4 glow-yellow">
                REKOD BARU TERBENTUK!
              </div>
            )}
            <div className="flex gap-4">
              <button
                id="btn-retry-ns"
                onClick={startGame}
                className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-4 py-2.5 border border-white active:scale-95 transition"
              >
                <RotateCcw size={12} /> CUBA LAGI
              </button>
              <button
                id="btn-exit-ns"
                onClick={onExit}
                className="bg-slate-700 hover:bg-slate-600 text-white font-arcade text-xs px-4 py-2.5 border border-slate-500 active:scale-95 transition"
              >
                KELUAR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch/Mobile Controller Panel with 4-way arrow controls */}
      <div className="bg-black border-t-2 border-arcade-pink/40 p-3 flex flex-col items-center select-none">
        <div className="grid grid-cols-3 gap-1 w-44">
          <div></div>
          <button
            id="btn-pad-up-ns"
            onClick={() => changeDirection(0, -1)}
            className="w-12 h-10 bg-slate-800 active:bg-arcade-pink border border-slate-600 rounded flex items-center justify-center text-white active:text-black shadow"
          >
            <ArrowUp size={18} />
          </button>
          <div></div>

          <button
            id="btn-pad-left-ns"
            onClick={() => changeDirection(-1, 0)}
            className="w-12 h-10 bg-slate-800 active:bg-arcade-pink border border-slate-600 rounded flex items-center justify-center text-white active:text-black shadow"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center justify-center">
            {gameStatus === 'PLAYING' ? (
              <button
                id="btn-pad-pause-ns"
                onClick={pauseGame}
                className="w-6 h-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
              >
                <Pause size={10} />
              </button>
            ) : <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800"></div>}
          </div>
          <button
            id="btn-pad-right-ns"
            onClick={() => changeDirection(1, 0)}
            className="w-12 h-10 bg-slate-800 active:bg-arcade-pink border border-slate-600 rounded flex items-center justify-center text-white active:text-black shadow"
          >
            <ArrowRight size={18} />
          </button>

          <div></div>
          <button
            id="btn-pad-down-ns"
            onClick={() => changeDirection(0, 1)}
            className="w-12 h-10 bg-slate-800 active:bg-arcade-pink border border-slate-600 rounded flex items-center justify-center text-white active:text-black shadow"
          >
            <ArrowDown size={18} />
          </button>
          <div></div>
        </div>
      </div>
    </div>
  );
};
