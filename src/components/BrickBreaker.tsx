import React, { useRef, useEffect, useState } from 'react';
import { GameStatus } from '../types';
import { audio } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft, ArrowRight, Pause } from 'lucide-react';

interface BrickBreakerProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const BrickBreaker: React.FC<BrickBreakerProps> = ({ onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('highscore_brick-breaker') || '1000');
  });
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [muted, setMuted] = useState<boolean>(false);

  // Status Ref to prevent closure over stale status in events without re-running effects
  const statusRef = useRef<GameStatus>('IDLE');
  useEffect(() => {
    statusRef.current = gameStatus;
  }, [gameStatus]);

  // Keyboard controls
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Game state in refs to prevent useEffect re-triggering and keeping things extremely smooth
  const paddleRef = useRef({ x: 150, width: 75, height: 10, speed: 6 });
  const ballRef = useRef({ x: 150, y: 200, dx: 3, dy: -3, radius: 6, speed: 4.5 });
  const bricksRef = useRef<Array<{ x: number; y: number; width: number; height: number; alive: boolean; color: string; value: number }>>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Setup/Reset the bricks grid
  const initBricks = () => {
    const rows = 5;
    const cols = 8;
    const padding = 6;
    const offsetTop = 30;
    const offsetLeft = 15;
    const width = 31; // approximate, dynamic based on canvas width
    const height = 12;

    const colors = ['#ff007f', '#7000ff', '#00f0ff', '#ffea00', '#39ff14'];
    const values = [100, 80, 60, 40, 20];

    const tempBricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tempBricks.push({
          x: c * (width + padding) + offsetLeft,
          y: r * (height + padding) + offsetTop,
          width: width,
          height: height,
          alive: true,
          color: colors[r % colors.length],
          value: values[r % values.length],
        });
      }
    }
    bricksRef.current = tempBricks;
  };

  // Adjust layout to container sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const oldWidth = canvas.width;
      const width = container.clientWidth;
      canvas.width = width;
      canvas.height = 320; // fixed retro screen height

      // Scale paddle and bricks dynamically based on width
      const totalWidthAvailable = width - 30; // margins
      const cols = 8;
      const padding = 6;
      const brickWidth = (totalWidthAvailable - (cols - 1) * padding) / cols;

      if (statusRef.current !== 'PLAYING') {
        paddleRef.current.x = (width - paddleRef.current.width) / 2;
        ballRef.current.x = width / 2;
        ballRef.current.y = 260;
        ballRef.current.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
        ballRef.current.dy = -3.5;
      } else if (oldWidth > 0) {
        paddleRef.current.x = (paddleRef.current.x / oldWidth) * width;
        ballRef.current.x = (ballRef.current.x / oldWidth) * width;
      }

      // Reset brick positions
      bricksRef.current.forEach((b, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        b.width = brickWidth;
        b.x = c * (brickWidth + padding) + 15;
      });
    };

    initBricks();
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key] = true;

      // Handle space for start/pause
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

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus]);

  // Audio mute sync
  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const startGame = () => {
    audio.playCoin();
    setScore(0);
    setLives(3);
    initBricks();
    
    // Reset ball/paddle
    const canvas = canvasRef.current;
    if (canvas) {
      paddleRef.current.x = (canvas.width - paddleRef.current.width) / 2;
      ballRef.current.x = canvas.width / 2;
      ballRef.current.y = 260;
      ballRef.current.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
      ballRef.current.dy = -3.5;
    }
    particlesRef.current = [];
    setGameStatus('PLAYING');
  };

  const pauseGame = () => {
    setGameStatus('PAUSED');
  };

  const resumeGame = () => {
    setGameStatus('PLAYING');
  };

  const addParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: color,
        alpha: 1,
        size: Math.random() * 3 + 2,
      });
    }
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
    let localLives = lives;

    const gameLoop = () => {
      // 1. CLEAR CANVAS
      ctx.fillStyle = '#06050b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background cyber grid
      ctx.strokeStyle = 'rgba(112, 0, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. MOVE PADDLE
      const paddle = paddleRef.current;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
        paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
      }

      // 3. MOVE BALL
      const ball = ballRef.current;
      ball.x += ball.dx;
      ball.y += ball.dy;

      // 4. BALL WALL COLLISIONS
      if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx = -ball.dx;
        audio.playBounce();
      } else if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx = -ball.dx;
        audio.playBounce();
      }

      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy = -ball.dy;
        audio.playBounce();
      }

      // 5. BALL OUT OF BOUNDS (BOTTOM)
      if (ball.y + ball.radius > canvas.height) {
        localLives -= 1;
        setLives(localLives);
        audio.playExplosion();

        if (localLives <= 0) {
          setGameStatus('GAME_OVER');
          if (localScore > highScore) {
            audio.playGameOver();
            setTimeout(() => audio.playNewHighScore(), 150);
          } else {
            audio.playGameOver();
          }
          const newHigh = Math.max(localScore, highScore);
          setHighScore(newHigh);
          localStorage.setItem('highscore_brick-breaker', newHigh.toString());
          onGameOver(localScore);
          return;
        } else {
          // Reset ball to mid paddle
          ball.x = paddle.x + paddle.width / 2;
          ball.y = 260;
          ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
          ball.dy = -3.5;
        }
      }

      // 6. BALL PADDLE COLLISION
      if (
        ball.y + ball.radius >= canvas.height - 20 - paddle.height &&
        ball.y - ball.radius <= canvas.height - 20 &&
        ball.x + ball.radius >= paddle.x &&
        ball.x - ball.radius <= paddle.x + paddle.width
      ) {
        // Bounce and modify angle based on where it hit the paddle
        const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dy = -Math.abs(ball.dy);
        ball.dx = hitPoint * ball.speed;
        audio.playBounce();
      }

      // 7. BALL BRICK COLLISIONS
      const bricks = bricksRef.current;
      let bricksAlive = 0;
      for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (!b.alive) continue;
        bricksAlive++;

        if (
          ball.x + ball.radius >= b.x &&
          ball.x - ball.radius <= b.x + b.width &&
          ball.y + ball.radius >= b.y &&
          ball.y - ball.radius <= b.y + b.height
        ) {
          b.alive = false;
          localScore += b.value;
          setScore(localScore);
          audio.playPoint();
          addParticles(b.x + b.width / 2, b.y + b.height / 2, b.color);

          // Reverse ball direction based on approach
          const overlapX = Math.min(ball.x + ball.radius - b.x, b.x + b.width - (ball.x - ball.radius));
          const overlapY = Math.min(ball.y + ball.radius - b.y, b.y + b.height - (ball.y - ball.radius));

          if (overlapX < overlapY) {
            ball.dx = -ball.dx;
          } else {
            ball.dy = -ball.dy;
          }

          // Dynamic speed boost
          ball.dx *= 1.02;
          ball.dy *= 1.02;
          break; // hit one brick per frame maximum
        }
      }

      // Win state
      if (bricksAlive === 0) {
        audio.playVictory();
        initBricks(); // Reload more bricks!
        ball.x = paddle.x + paddle.width / 2;
        ball.y = 260;
        ball.dx = 3;
        ball.dy = -3.5;
      }

      // 8. RENDER PADDLE
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(paddle.x, canvas.height - 20 - paddle.height, paddle.width, paddle.height);
      ctx.shadowBlur = 0; // reset

      // 9. RENDER BALL
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0; // reset

      // 10. RENDER BRICKS
      for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        
        // Brick highlight accent
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(b.x, b.y, b.width, 2);
        ctx.fillRect(b.x, b.y, 2, b.height);
      }
      ctx.shadowBlur = 0;

      // 11. PARTICLES UPDATE & DRAW
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      // Loop
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameStatus, score, lives]);

  const handleMobileLeft = (pressed: boolean) => {
    keysPressed.current['ArrowLeft'] = pressed;
  };

  const handleMobileRight = (pressed: boolean) => {
    keysPressed.current['ArrowRight'] = pressed;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Scale to internal canvas width
    const scaleX = canvas.width / rect.width;
    const paddleWidth = paddleRef.current.width;

    let newX = (mouseX * scaleX) - (paddleWidth / 2);
    if (newX < 0) newX = 0;
    if (newX > canvas.width - paddleWidth) newX = canvas.width - paddleWidth;

    paddleRef.current.x = newX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;

    // Scale to internal canvas width
    const scaleX = canvas.width / rect.width;
    const paddleWidth = paddleRef.current.width;

    let newX = (touchX * scaleX) - (paddleWidth / 2);
    if (newX < 0) newX = 0;
    if (newX > canvas.width - paddleWidth) newX = canvas.width - paddleWidth;

    paddleRef.current.x = newX;
  };

  return (
    <div id="cabinet-brick-breaker" className="flex flex-col h-full bg-[#0d0c15] border-4 border-arcade-cyan shadow-lg shadow-arcade-cyan/30 rounded-none overflow-hidden crt-screen">
      {/* Game Cabinet Bezel / Top Banner */}
      <div className="flex justify-between items-center bg-black/80 px-4 py-2 border-b-2 border-arcade-cyan font-arcade text-[10px] tracking-wider text-arcade-cyan">
        <span className="flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-arcade-cyan"></span> LIVE CABINET
        </span>
        <span className="glow-cyan font-bold">BRICK BREAKER</span>
        <button 
          id="btn-toggle-mute-bb"
          onClick={() => setMuted(!muted)} 
          className="hover:text-arcade-yellow transition"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Scores Overlay */}
      <div className="grid grid-cols-3 bg-black/90 p-3 text-center font-mono border-b border-arcade-cyan/30 text-xs text-slate-400">
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">SCORE</div>
          <div className="font-bold text-arcade-yellow text-sm font-arcade">{score.toString().padStart(6, '0')}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">HIGH SCORE</div>
          <div className="font-bold text-arcade-pink text-sm font-arcade">{Math.max(score, highScore).toString().padStart(6, '0')}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">LIVES</div>
          <div className="flex justify-center gap-1 mt-1 text-arcade-pink text-lg">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-90 transition-all duration-300'}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Playfield Canvas Container */}
      <div ref={containerRef} className="relative flex-grow flex items-center justify-center bg-[#06050b] min-h-[320px]">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full cursor-ew-resize touch-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        />

        {/* HUD Overlay States */}
        {gameStatus === 'IDLE' && (
          <div id="bb-overlay-idle" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-cyan glow-cyan mb-3 leading-relaxed">INSERT COIN</h2>
            <p className="text-slate-400 text-xs max-w-xs mb-6 font-sans">
              Pecahkan semua blok neon menggunakan pedal pemantul bertenaga. Sedia untuk cabaran kelajuan pantas?
            </p>
            <button
              id="btn-start-bb"
              onClick={startGame}
              className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-6 py-3 border-2 border-white shadow-md shadow-arcade-pink/50 active:scale-95 transition"
            >
              <Play size={12} /> TEKAN UNTUK MULA
            </button>
            <div className="mt-6 text-[10px] text-slate-500 font-mono">
              GUNAKAN KEKUNCI <span className="text-arcade-yellow">←</span> / <span className="text-arcade-yellow">→</span> ATAU <span className="text-arcade-yellow">A</span> / <span className="text-arcade-yellow">D</span>
            </div>
          </div>
        )}

        {gameStatus === 'PAUSED' && (
          <div id="bb-overlay-paused" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center">
            <h2 className="font-arcade text-lg text-arcade-yellow animate-pulse glow-yellow mb-4">PERMAINAN DIHENTIKAN</h2>
            <button
              id="btn-resume-bb"
              onClick={resumeGame}
              className="bg-arcade-cyan hover:bg-arcade-cyan/80 text-black font-arcade text-xs px-6 py-3 border-2 border-white active:scale-95 transition"
            >
              SAMBUNG
            </button>
          </div>
        )}

        {gameStatus === 'GAME_OVER' && (
          <div id="bb-overlay-gameover" className="absolute inset-0 flex flex-col justify-center items-center bg-black/90 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-pink glow-pink mb-2">GAME OVER</h2>
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
                id="btn-retry-bb"
                onClick={startGame}
                className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-4 py-2.5 border border-white active:scale-95 transition"
              >
                <RotateCcw size={12} /> CUBA LAGI
              </button>
              <button
                id="btn-exit-bb"
                onClick={onExit}
                className="bg-slate-700 hover:bg-slate-600 text-white font-arcade text-xs px-4 py-2.5 border border-slate-500 active:scale-95 transition"
              >
                KELUAR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch/Mobile Controller Panel */}
      <div className="bg-black border-t-2 border-arcade-cyan/40 p-4 grid grid-cols-3 items-center gap-2 select-none">
        <div className="flex justify-start">
          <button
            id="btn-pad-left-bb"
            onTouchStart={() => handleMobileLeft(true)}
            onTouchEnd={() => handleMobileLeft(false)}
            onMouseDown={() => handleMobileLeft(true)}
            onMouseUp={() => handleMobileLeft(false)}
            onMouseLeave={() => handleMobileLeft(false)}
            className="w-14 h-14 bg-slate-800 active:bg-arcade-cyan border-2 border-slate-600 rounded-lg flex items-center justify-center text-white active:text-black shadow-lg cursor-pointer touch-none"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="flex justify-center">
          {gameStatus === 'PLAYING' && (
            <button
              id="btn-pad-pause-bb"
              onClick={pauseGame}
              className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
            >
              <Pause size={16} />
            </button>
          )}
        </div>

        <div className="flex justify-end">
          <button
            id="btn-pad-right-bb"
            onTouchStart={() => handleMobileRight(true)}
            onTouchEnd={() => handleMobileRight(false)}
            onMouseDown={() => handleMobileRight(true)}
            onMouseUp={() => handleMobileRight(false)}
            onMouseLeave={() => handleMobileRight(false)}
            className="w-14 h-14 bg-slate-800 active:bg-arcade-cyan border-2 border-slate-600 rounded-lg flex items-center justify-center text-white active:text-black shadow-lg cursor-pointer touch-none"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
