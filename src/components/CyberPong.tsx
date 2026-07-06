import React, { useRef, useEffect, useState } from 'react';
import { GameStatus } from '../types';
import { audio } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft, ArrowUp, ArrowDown, Pause } from 'lucide-react';

interface CyberPongProps {
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

export const CyberPong: React.FC<CyberPongProps> = ({ onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [playerScore, setPlayerScore] = useState<number>(0);
  const [cpuScore, setCpuScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('highscore_cyber-pong') || '1500');
  });
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [muted, setMuted] = useState<boolean>(false);

  // Status Ref to prevent stale closures in event listeners
  const statusRef = useRef<GameStatus>('IDLE');
  useEffect(() => {
    statusRef.current = gameStatus;
  }, [gameStatus]);

  // Keyboard controls
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Game structures in refs
  const ballRef = useRef({ x: 150, y: 160, vx: 3, vy: 1.5, radius: 6, speed: 4 });
  const playerPaddleRef = useRef({ y: 120, width: 8, height: 60, speed: 6 });
  const cpuPaddleRef = useRef({ y: 120, width: 8, height: 60, speed: 3.5 }); // Bot speed
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Initialize and scale canvas to container
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const oldWidth = canvas.width;
      const width = container.clientWidth;
      canvas.width = width;
      canvas.height = 320; // Standard cabinet screen height

      // Center paddles and ball
      if (statusRef.current !== 'PLAYING') {
        playerPaddleRef.current.y = (320 - playerPaddleRef.current.height) / 2;
        cpuPaddleRef.current.y = (320 - cpuPaddleRef.current.height) / 2;
        resetBall(width, 320);
      } else if (oldWidth > 0) {
        ballRef.current.x = (ballRef.current.x / oldWidth) * width;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', ' ', 'w', 's'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key] = true;

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

  // Audio sync
  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const resetBall = (width: number, height: number) => {
    const ball = ballRef.current;
    ball.x = width / 2;
    ball.y = height / 2;
    // Serve in random horizontal direction
    ball.speed = 4.5;
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // slice angle
    ball.vx = dirX * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
  };

  const createBounceParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color,
        alpha: 1,
        size: Math.random() * 2 + 1,
      });
    }
  };

  const startGame = () => {
    audio.playCoin();
    setPlayerScore(0);
    setCpuScore(0);
    setGameStatus('PLAYING');

    const canvas = canvasRef.current;
    if (canvas) {
      resetBall(canvas.width, canvas.height);
    }
  };

  const pauseGame = () => {
    setGameStatus('PAUSED');
  };

  const resumeGame = () => {
    audio.playCoin();
    setGameStatus('PLAYING');
  };

  // Keyboard movement logic
  const updatePaddlePositions = (canvasHeight: number) => {
    const pPaddle = playerPaddleRef.current;
    
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) {
      pPaddle.y = Math.max(0, pPaddle.y - pPaddle.speed);
    }
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S']) {
      pPaddle.y = Math.min(canvasHeight - pPaddle.height, pPaddle.y + pPaddle.speed);
    }
  };

  // Drag controls for touch and mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    // Center player paddle on mouse Y
    const halfHeight = playerPaddleRef.current.height / 2;
    let newY = mouseY - halfHeight;
    if (newY < 0) newY = 0;
    if (newY > canvas.height - playerPaddleRef.current.height) {
      newY = canvas.height - playerPaddleRef.current.height;
    }
    playerPaddleRef.current.y = newY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchY = touch.clientY - rect.top;

    const halfHeight = playerPaddleRef.current.height / 2;
    let newY = touchY - halfHeight;
    if (newY < 0) newY = 0;
    if (newY > canvas.height - playerPaddleRef.current.height) {
      newY = canvas.height - playerPaddleRef.current.height;
    }
    playerPaddleRef.current.y = newY;
  };

  // Game Engine Loop
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // 1. Clear Screen
      ctx.fillStyle = '#06050b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Center Net Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // 2. Physics & Ball Updates
      const ball = ballRef.current;
      const pPaddle = playerPaddleRef.current;
      const cPaddle = cpuPaddleRef.current;

      // Update manual player paddle position (from keyboard inputs)
      updatePaddlePositions(canvas.height);

      // Update AI paddle position (follows ball smoothly with speed limit)
      const cpuTargetY = ball.y - cPaddle.height / 2;
      const diffY = cpuTargetY - cPaddle.y;
      // Adaptive bot: higher difficulty if ball is coming towards it
      const currentBotSpeed = ball.vx > 0 ? cPaddle.speed : cPaddle.speed * 0.7;
      if (Math.abs(diffY) > 4) {
        if (diffY > 0) {
          cPaddle.y = Math.min(canvas.height - cPaddle.height, cPaddle.y + currentBotSpeed);
        } else {
          cPaddle.y = Math.max(0, cPaddle.y - currentBotSpeed);
        }
      }

      // Move Ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall Bounce (Top / Bottom)
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy;
        audio.playBounce();
        createBounceParticles(ball.x, ball.y, '#00f0ff');
      } else if (ball.y + ball.radius >= canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.vy = -ball.vy;
        audio.playBounce();
        createBounceParticles(ball.x, ball.y, '#00f0ff');
      }

      // Player Paddle Collision Check (Left side)
      if (ball.vx < 0 && ball.x - ball.radius <= 20 + pPaddle.width) {
        // Horizontal overlap
        if (ball.x >= 20) {
          // Vertical overlap
          if (ball.y >= pPaddle.y && ball.y <= pPaddle.y + pPaddle.height) {
            // Deflect ball based on where it hit on the paddle
            const relativeIntersectY = (pPaddle.y + pPaddle.height / 2) - ball.y;
            const normalizedIntersectY = relativeIntersectY / (pPaddle.height / 2);
            const bounceAngle = normalizedIntersectY * (Math.PI / 3.5); // Max 51 degrees

            // Increase speed slightly
            ball.speed = Math.min(10, ball.speed + 0.5);
            ball.vx = ball.speed * Math.cos(bounceAngle);
            ball.vy = -ball.speed * Math.sin(bounceAngle);
            ball.x = 20 + pPaddle.width + ball.radius; // Resolve overlap

            audio.playBounce();
            createBounceParticles(ball.x, ball.y, '#ff007f');
          }
        }
      }

      // CPU Paddle Collision Check (Right side)
      const cpuPaddleX = canvas.width - 20 - cPaddle.width;
      if (ball.vx > 0 && ball.x + ball.radius >= cpuPaddleX) {
        if (ball.x <= canvas.width - 20) {
          if (ball.y >= cPaddle.y && ball.y <= cPaddle.y + cPaddle.height) {
            const relativeIntersectY = (cPaddle.y + cPaddle.height / 2) - ball.y;
            const normalizedIntersectY = relativeIntersectY / (cPaddle.height / 2);
            const bounceAngle = normalizedIntersectY * (Math.PI / 3.5);

            ball.speed = Math.min(10, ball.speed + 0.5);
            ball.vx = -ball.speed * Math.cos(bounceAngle);
            ball.vy = -ball.speed * Math.sin(bounceAngle);
            ball.x = cpuPaddleX - ball.radius;

            audio.playBounce();
            createBounceParticles(ball.x, ball.y, '#7000ff');
          }
        }
      }

      // Scoring (Out of bounds)
      if (ball.x < 0) {
        // CPU Scores
        audio.playExplosion();
        setCpuScore(prev => {
          const next = prev + 1;
          if (next >= 7) {
            setGameStatus('GAME_OVER');
            const calculatedFinalScore = Math.max(0, playerScore * 250 - next * 50 + 500);
            if (calculatedFinalScore > highScore) {
              audio.playGameOver();
              setTimeout(() => audio.playNewHighScore(), 150);
            } else {
              audio.playGameOver();
            }
            const newHigh = Math.max(calculatedFinalScore, highScore);
            setHighScore(newHigh);
            localStorage.setItem('highscore_cyber-pong', newHigh.toString());
            onGameOver(calculatedFinalScore);
          } else {
            resetBall(canvas.width, canvas.height);
          }
          return next;
        });
      } else if (ball.x > canvas.width) {
        // Player Scores
        audio.playPoint();
        createBounceParticles(canvas.width - 10, ball.y, '#ffea00');
        setPlayerScore(prev => {
          const next = prev + 1;
          if (next >= 7) {
            setGameStatus('GAME_OVER');
            const calculatedFinalScore = 1000 + next * 300 - cpuScore * 100;
            if (calculatedFinalScore > highScore) {
              audio.playVictory();
              setTimeout(() => audio.playNewHighScore(), 150);
            } else {
              audio.playVictory();
            }
            const newHigh = Math.max(calculatedFinalScore, highScore);
            setHighScore(newHigh);
            localStorage.setItem('highscore_cyber-pong', newHigh.toString());
            onGameOver(calculatedFinalScore);
          } else {
            resetBall(canvas.width, canvas.height);
          }
          return next;
        });
      }

      // 3. Render Game Assets
      // Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Ball
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw Player Paddle (Left, Hot Pink Neon)
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 12;
      ctx.fillRect(20, pPaddle.y, pPaddle.width, pPaddle.height);

      // Draw CPU Paddle (Right, Neon Purple)
      ctx.fillStyle = '#7000ff';
      ctx.shadowColor = '#7000ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(canvas.width - 20 - cPaddle.width, cPaddle.y, cPaddle.width, cPaddle.height);

      // Reset shadows
      ctx.shadowBlur = 0;

      // Loop
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStatus, playerScore, cpuScore]);

  // Touch handlers to move paddle manually (optional touch pad buttons)
  const handleMobileUp = (active: boolean) => {
    keysPressed.current['ArrowUp'] = active;
  };

  const handleMobileDown = (active: boolean) => {
    keysPressed.current['ArrowDown'] = active;
  };

  return (
    <div className="flex flex-col bg-[#08080a] border border-zinc-800 rounded-none overflow-hidden select-none relative">
      {/* Top HUD bar */}
      <div className="flex justify-between items-center bg-[#0C0C0F] px-4 py-2 border-b border-zinc-800 text-xs select-none">
        <div>
          <span className="text-[9px] text-zinc-500 font-arcade">SCORE PLAYER</span>
          <div className="font-bold text-arcade-pink text-base font-arcade">{playerScore} / 7</div>
        </div>
        <div className="text-center">
          <span className="text-[8px] text-zinc-500 block font-arcade">CYBER PONG</span>
          <span className="text-[7px] text-arcade-yellow font-mono tracking-widest animate-pulse">MATCH POINT: 7</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-zinc-500 font-arcade">SCORE CPU</span>
          <div className="font-bold text-arcade-purple text-base font-arcade">{cpuScore} / 7</div>
        </div>
      </div>

      {/* Playfield Canvas Container */}
      <div 
        ref={containerRef} 
        className="relative flex-grow flex items-center justify-center bg-[#06050b] min-h-[320px]"
      >
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full cursor-ns-resize touch-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        />

        {/* HUD Overlay States */}
        {gameStatus === 'IDLE' && (
          <div id="cp-overlay-idle" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-cyan glow-cyan mb-3 leading-relaxed">CYBER PONG</h2>
            <p className="text-zinc-400 text-xs max-w-xs mb-6 font-sans leading-relaxed">
              Kalahkan bot pintar dalam perlawanan 7 mata pantas. Kawal guna MOUSE (gerak atas/bawah), SENTUHAN skrin, atau key W/S.
            </p>
            <button
              id="btn-start-cp"
              onClick={startGame}
              className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-6 py-3 border-2 border-white shadow-md shadow-arcade-pink/50 active:scale-95 transition"
            >
              <Play size={12} /> TEKAN UNTUK MULA
            </button>
            <div className="mt-6 text-[10px] text-zinc-500 font-mono">
              ATAU GUNAKAN KEKUNCI <span className="text-arcade-yellow">W</span> / <span className="text-arcade-yellow">S</span> ATAU ANAK PANAH
            </div>
          </div>
        )}

        {gameStatus === 'PAUSED' && (
          <div id="cp-overlay-paused" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center">
            <h2 className="font-arcade text-lg text-arcade-yellow animate-pulse glow-yellow mb-4">PERMAINAN DIHENTIKAN</h2>
            <button
              id="btn-resume-cp"
              onClick={resumeGame}
              className="bg-arcade-cyan hover:bg-arcade-cyan/80 text-black font-arcade text-xs px-6 py-3 border-2 border-white active:scale-95 transition"
            >
              SAMBUNG
            </button>
          </div>
        )}

        {gameStatus === 'GAME_OVER' && (
          <div id="cp-overlay-gameover" className="absolute inset-0 flex flex-col justify-center items-center bg-black/95 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-pink glow-pink mb-2">
              {playerScore >= 7 ? 'PEMAIN MENANG!' : 'CPU MENANG!'}
            </h2>
            <div className="text-zinc-300 font-mono text-[10px] font-arcade my-3">
              MATA ANDA: <span className="text-arcade-yellow text-sm font-bold">{playerScore}</span> VS CPU: <span className="text-arcade-purple text-sm font-bold">{cpuScore}</span>
            </div>
            <div className="flex gap-4">
              <button
                id="btn-retry-cp"
                onClick={startGame}
                className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-4 py-2.5 border border-white active:scale-95 transition"
              >
                <RotateCcw size={12} /> CUBA LAGI
              </button>
              <button
                id="btn-exit-cp"
                onClick={onExit}
                className="bg-zinc-700 hover:bg-zinc-600 text-white font-arcade text-xs px-4 py-2.5 border border-zinc-500 active:scale-95 transition"
              >
                KELUAR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch/Mobile Controller Panel */}
      <div className="bg-black border-t-2 border-arcade-pink/40 p-4 grid grid-cols-3 items-center gap-2 select-none">
        <div className="flex justify-start">
          <button
            id="btn-pad-up-cp"
            onTouchStart={() => handleMobileUp(true)}
            onTouchEnd={() => handleMobileUp(false)}
            onMouseDown={() => handleMobileUp(true)}
            onMouseUp={() => handleMobileUp(false)}
            onMouseLeave={() => handleMobileUp(false)}
            className="w-14 h-14 bg-zinc-800 active:bg-arcade-pink border-2 border-zinc-600 rounded-lg flex items-center justify-center text-white active:text-black shadow-lg cursor-pointer touch-none"
          >
            <ArrowUp size={24} />
          </button>
        </div>

        <div className="flex justify-center">
          {gameStatus === 'PLAYING' && (
            <button
              id="btn-pad-pause-cp"
              onClick={pauseGame}
              className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <Pause size={16} />
            </button>
          )}
        </div>

        <div className="flex justify-end">
          <button
            id="btn-pad-down-cp"
            onTouchStart={() => handleMobileDown(true)}
            onTouchEnd={() => handleMobileDown(false)}
            onMouseDown={() => handleMobileDown(true)}
            onMouseUp={() => handleMobileDown(false)}
            onMouseLeave={() => handleMobileDown(false)}
            className="w-14 h-14 bg-zinc-800 active:bg-arcade-pink border-2 border-zinc-600 rounded-lg flex items-center justify-center text-white active:text-black shadow-lg cursor-pointer touch-none"
          >
            <ArrowDown size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
