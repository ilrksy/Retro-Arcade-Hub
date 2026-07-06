import React, { useRef, useEffect, useState } from 'react';
import { GameStatus } from '../types';
import { audio } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft, ArrowRight, Pause, Zap } from 'lucide-react';

interface SpaceDefendersProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
  speed: number;
  radius: number;
}

interface Alien {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  hp: number;
  color: string;
  points: number;
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

export const SpaceDefenders: React.FC<SpaceDefendersProps> = ({ onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('highscore_space-defenders') || '2500');
  });
  const [lives, setLives] = useState<number>(3);
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [muted, setMuted] = useState<boolean>(false);

  // Status Ref to prevent stale closures in event listeners
  const statusRef = useRef<GameStatus>('IDLE');
  useEffect(() => {
    statusRef.current = gameStatus;
  }, [gameStatus]);

  // Controller inputs
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Game assets in refs for buttery-smooth performance
  const playerRef = useRef({ x: 150, width: 30, height: 20, speed: 5 });
  const bulletsRef = useRef<Bullet[]>([]);
  const aliensRef = useRef<Alien[]>([]);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastShotTime = useRef<number>(0);
  const spawnTimer = useRef<number>(0);
  const levelTimer = useRef<number>(0);

  const animationFrameId = useRef<number | null>(null);

  // Initialize scrolling starfield background
  const initStars = (width: number) => {
    const tempStars: Star[] = [];
    for (let i = 0; i < 40; i++) {
      tempStars.push({
        x: Math.random() * width,
        y: Math.random() * 320,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2 + 0.5,
      });
    }
    starsRef.current = tempStars;
  };

  // Adjust game layout and sizes on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const oldWidth = canvas.width;
      const width = container.clientWidth;
      canvas.width = width;
      canvas.height = 320; // standard retro cabinet screen height

      if (statusRef.current !== 'PLAYING') {
        playerRef.current.x = (width - playerRef.current.width) / 2;
      } else if (oldWidth > 0) {
        playerRef.current.x = (playerRef.current.x / oldWidth) * width;
      }
      initStars(width);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp', 'a', 'd', 'w'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key] = true;

      if (e.key === ' ') {
        if (gameStatus === 'IDLE' || gameStatus === 'GAME_OVER') {
          startGame();
        } else if (gameStatus === 'PLAYING') {
          shootLaser();
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

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const startGame = () => {
    audio.playCoin();
    setScore(0);
    setLevel(1);
    setLives(3);
    
    bulletsRef.current = [];
    aliensRef.current = [];
    particlesRef.current = [];
    spawnTimer.current = 0;
    levelTimer.current = 0;

    const canvas = canvasRef.current;
    if (canvas) {
      playerRef.current.x = (canvas.width - playerRef.current.width) / 2;
    }
    setGameStatus('PLAYING');
  };

  const pauseGame = () => {
    setGameStatus('PAUSED');
  };

  const resumeGame = () => {
    setGameStatus('PLAYING');
  };

  const shootLaser = () => {
    if (gameStatus !== 'PLAYING') return;

    const now = Date.now();
    // Fire cooldown
    if (now - lastShotTime.current < 250) return;

    const player = playerRef.current;
    bulletsRef.current.push({
      x: player.x + player.width / 2,
      y: 290, // player position top
      speed: 7,
      radius: 3,
    });

    audio.playLaser();
    lastShotTime.current = now;
  };

  const addExplosionParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
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
    let localLevel = level;
    let localLives = lives;

    const gameLoop = () => {
      // 1. BLACK SPACE BACKGROUND
      ctx.fillStyle = '#06050b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. STARFIELD PARALLAX BACKGROUND
      const stars = starsRef.current;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.speed / 2})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }

      // 3. MOVE PLAYER
      const player = playerRef.current;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
        player.x = Math.max(0, player.x - player.speed);
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
      }

      // 4. BULLET MOVEMENT & DRAWING
      const bullets = bulletsRef.current;
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= b.speed;
        if (b.y < 0) {
          bullets.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      }
      ctx.shadowBlur = 0; // reset glow

      // 5. ALIEN SPAWNING ENGINE
      spawnTimer.current += 1;
      // Spawn interval decreases slightly with level
      const spawnInterval = Math.max(30, 80 - localLevel * 5);
      if (spawnTimer.current >= spawnInterval) {
        spawnTimer.current = 0;
        
        const alienColors = ['#ff007f', '#7000ff', '#ffea00', '#39ff14'];
        const width = 24;
        const height = 16;
        const xPos = Math.random() * (canvas.width - width - 20) + 10;
        const speed = Math.random() * 1.2 + 0.8 + localLevel * 0.15;
        const hp = Math.ceil(Math.random() * (localLevel > 3 ? 2 : 1));

        aliensRef.current.push({
          x: xPos,
          y: -height,
          speed: speed,
          width: width,
          height: height,
          hp: hp,
          color: alienColors[Math.floor(Math.random() * alienColors.length)],
          points: hp * 150,
        });
      }

      // Level increase timer
      levelTimer.current += 1;
      if (levelTimer.current >= 800) { // roughly 13-15 seconds
        levelTimer.current = 0;
        localLevel += 1;
        setLevel(localLevel);
        audio.playVictory();
      }

      // 6. ALIEN MOVEMENT & COLLISION DETECTION
      const aliens = aliensRef.current;
      for (let i = aliens.length - 1; i >= 0; i--) {
        const a = aliens[i];
        a.y += a.speed;

        // Reach bottom of defense sector
        if (a.y > canvas.height - 40) {
          aliens.splice(i, 1);
          localLives -= 1;
          setLives(localLives);
          audio.playExplosion();
          addExplosionParticles(a.x + a.width / 2, canvas.height - 40, '#ff0000');

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
            localStorage.setItem('highscore_space-defenders', newHigh.toString());
            onGameOver(localScore);
            return;
          }
          continue;
        }

        // Hit by player spaceship?
        if (
          a.y + a.height >= 290 &&
          a.x + a.width >= player.x &&
          a.x <= player.x + player.width
        ) {
          aliens.splice(i, 1);
          localLives -= 1;
          setLives(localLives);
          audio.playExplosion();
          addExplosionParticles(a.x + a.width / 2, a.y + a.height / 2, '#ff007f');

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
            localStorage.setItem('highscore_space-defenders', newHigh.toString());
            onGameOver(localScore);
            return;
          }
          continue;
        }

        // Hit by laser bullets?
        let alienHit = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (
            b.x >= a.x &&
            b.x <= a.x + a.width &&
            b.y - b.radius <= a.y + a.height &&
            b.y + b.radius >= a.y
          ) {
            // Remove bullet
            bullets.splice(j, 1);
            
            a.hp -= 1;
            if (a.hp <= 0) {
              alienHit = true;
              aliens.splice(i, 1);
              localScore += a.points;
              setScore(localScore);
              audio.playExplosion();
              addExplosionParticles(a.x + a.width / 2, a.y + a.height / 2, a.color);
            } else {
              audio.playBounce();
              addExplosionParticles(b.x, b.y, '#ffffff'); // minor spark
            }
            break;
          }
        }

        if (alienHit) continue;

        // Draw alien ship (retro vector pixel block shape)
        ctx.fillStyle = a.color;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 6;
        
        // Draw Retro Space Invader design dynamically
        ctx.fillRect(a.x + 4, a.y, a.width - 8, a.height);
        ctx.fillRect(a.x, a.y + 4, a.width, a.height - 8);
        ctx.fillRect(a.x + 2, a.y + a.height - 2, 4, 4);
        ctx.fillRect(a.x + a.width - 6, a.y + a.height - 2, 4, 4);
        
        // Pixel eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(a.x + 6, a.y + 6, 2, 2);
        ctx.fillRect(a.x + a.width - 8, a.y + 6, 2, 2);
      }
      ctx.shadowBlur = 0; // reset

      // 7. PARTICLES RENDERING
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
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

      // 8. RENDER PLAYER SPACESHIP
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 8;
      
      // Draw fighter plane look
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, 290); // Nose tip
      ctx.lineTo(player.x, 310); // Bottom left wing
      ctx.lineTo(player.x + player.width, 310); // Bottom right wing
      ctx.fill();
      ctx.closePath();

      // Cockpit shield color
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, 293);
      ctx.lineTo(player.x + player.width / 2 - 4, 303);
      ctx.lineTo(player.x + player.width / 2 + 4, 303);
      ctx.fill();
      ctx.closePath();
      
      ctx.shadowBlur = 0;

      // 9. BOTTOM LASER BARRIER (DEFENSE AREA LINE)
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 10);
      ctx.lineTo(canvas.width, canvas.height - 10);
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // Loop
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameStatus, score, level, lives]);

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
    const pWidth = playerRef.current.width;

    let newX = (mouseX * scaleX) - (pWidth / 2);
    if (newX < 0) newX = 0;
    if (newX > canvas.width - pWidth) newX = canvas.width - pWidth;

    playerRef.current.x = newX;
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
    const pWidth = playerRef.current.width;

    let newX = (touchX * scaleX) - (pWidth / 2);
    if (newX < 0) newX = 0;
    if (newX > canvas.width - pWidth) newX = canvas.width - pWidth;

    playerRef.current.x = newX;
  };

  const handleCanvasClick = () => {
    if (gameStatus === 'PLAYING') {
      shootLaser();
    }
  };

  return (
    <div id="cabinet-space-defenders" className="flex flex-col h-full bg-[#0d0c15] border-4 border-arcade-yellow shadow-lg shadow-arcade-yellow/30 rounded-none overflow-hidden crt-screen">
      {/* Game Cabinet Bezel / Top Banner */}
      <div className="flex justify-between items-center bg-black/80 px-4 py-2 border-b-2 border-arcade-yellow font-arcade text-[10px] tracking-wider text-arcade-yellow">
        <span className="flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-arcade-yellow"></span> LIVE CABINET
        </span>
        <span className="glow-yellow font-bold">SPACE DEFENDERS</span>
        <button 
          id="btn-toggle-mute-sd"
          onClick={() => setMuted(!muted)} 
          className="hover:text-arcade-cyan transition"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Scores Overlay */}
      <div className="grid grid-cols-4 bg-black/90 p-3 text-center font-mono border-b border-arcade-yellow/30 text-xs text-slate-400">
        <div>
          <div className="text-[9px] text-slate-500 font-arcade">SCORE</div>
          <div className="font-bold text-arcade-yellow text-sm font-arcade">{score.toString().padStart(6, '0')}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-500 font-arcade">LEVEL</div>
          <div className="font-bold text-arcade-cyan text-sm font-arcade">{level.toString().padStart(2, '0')}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-500 font-arcade">HIGH SCORE</div>
          <div className="font-bold text-arcade-pink text-sm font-arcade">{Math.max(score, highScore).toString().padStart(6, '0')}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-500 font-arcade">SHIELD</div>
          <div className="flex justify-center gap-1 mt-1 text-arcade-pink text-lg leading-none">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? 'opacity-100 scale-100 text-arcade-pink' : 'opacity-20 scale-90 text-slate-500 transition-all duration-300'}>
                ▲
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Playfield Canvas Container */}
      <div ref={containerRef} className="relative flex-grow flex items-center justify-center bg-[#06050b] min-h-[320px]">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full cursor-crosshair touch-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onClick={handleCanvasClick}
        />

        {/* HUD Overlay States */}
        {gameStatus === 'IDLE' && (
          <div id="sd-overlay-idle" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-yellow glow-yellow mb-3 leading-relaxed">INSERT COIN</h2>
            <p className="text-slate-400 text-xs max-w-xs mb-6 font-sans">
              Pertahankan sektor luar angkasa daripada serangan makhluk asing yang semakin pantas. Tembak laser dengan butang ZAP!
            </p>
            <button
              id="btn-start-sd"
              onClick={startGame}
              className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-6 py-3 border-2 border-white shadow-md shadow-arcade-pink/50 active:scale-95 transition"
            >
              <Play size={12} /> MULAKAN PERMAINAN
            </button>
            <div className="mt-6 text-[10px] text-slate-500 font-mono">
              GERAK <span className="text-arcade-cyan">←</span> / <span className="text-arcade-cyan">→</span>, TEMBAK <span className="text-arcade-cyan">SPACEBAR</span>
            </div>
          </div>
        )}

        {gameStatus === 'PAUSED' && (
          <div id="sd-overlay-paused" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center">
            <h2 className="font-arcade text-lg text-arcade-cyan animate-pulse glow-cyan mb-4">PERMAINAN DIHENTIKAN</h2>
            <button
              id="btn-resume-sd"
              onClick={resumeGame}
              className="bg-arcade-yellow hover:bg-arcade-yellow/80 text-black font-arcade text-xs px-6 py-3 border-2 border-white active:scale-95 transition"
            >
              SAMBUNG
            </button>
          </div>
        )}

        {gameStatus === 'GAME_OVER' && (
          <div id="sd-overlay-gameover" className="absolute inset-0 flex flex-col justify-center items-center bg-black/90 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-pink glow-pink mb-2">SEKTOR RUNTUH</h2>
            <div className="text-slate-300 font-mono text-sm mb-1 font-arcade text-[10px] my-3">
              MARKAH AKHIR: <span className="text-arcade-yellow text-sm">{score}</span>
            </div>
            {score > highScore && (
              <div className="text-arcade-cyan font-arcade text-[8px] animate-bounce mb-4 glow-cyan">
                REKOD TERTINGGI BARU!
              </div>
            )}
            <div className="flex gap-4">
              <button
                id="btn-retry-sd"
                onClick={startGame}
                className="flex items-center gap-2 bg-arcade-yellow hover:bg-arcade-yellow/80 text-black font-arcade text-xs px-4 py-2.5 border border-white active:scale-95 transition"
              >
                <RotateCcw size={12} /> CUBA LAGI
              </button>
              <button
                id="btn-exit-sd"
                onClick={onExit}
                className="bg-slate-700 hover:bg-slate-600 text-white font-arcade text-xs px-4 py-2.5 border border-slate-500 active:scale-95 transition"
              >
                KELUAR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch/Mobile Controller Panel with Left/Right AND Shoot Button! */}
      <div className="bg-black border-t-2 border-arcade-yellow/40 p-4 grid grid-cols-3 items-center gap-2 select-none">
        <div className="flex gap-2">
          <button
            id="btn-pad-left-sd"
            onTouchStart={() => handleMobileLeft(true)}
            onTouchEnd={() => handleMobileLeft(false)}
            onMouseDown={() => handleMobileLeft(true)}
            onMouseUp={() => handleMobileLeft(false)}
            onMouseLeave={() => handleMobileLeft(false)}
            className="w-12 h-12 bg-slate-800 active:bg-arcade-yellow border-2 border-slate-600 rounded-lg flex items-center justify-center text-white active:text-black shadow-lg cursor-pointer touch-none"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            id="btn-pad-right-sd"
            onTouchStart={() => handleMobileRight(true)}
            onTouchEnd={() => handleMobileRight(false)}
            onMouseDown={() => handleMobileRight(true)}
            onMouseUp={() => handleMobileRight(false)}
            onMouseLeave={() => handleMobileRight(false)}
            className="w-12 h-12 bg-slate-800 active:bg-arcade-yellow border-2 border-slate-600 rounded-lg flex items-center justify-center text-white active:text-black shadow-lg cursor-pointer touch-none"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="flex justify-center">
          {gameStatus === 'PLAYING' && (
            <button
              id="btn-pad-pause-sd"
              onClick={pauseGame}
              className="w-9 h-9 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
            >
              <Pause size={14} />
            </button>
          )}
        </div>

        <div className="flex justify-end">
          <button
            id="btn-pad-fire-sd"
            onClick={shootLaser}
            className="w-16 h-12 bg-arcade-pink active:bg-arcade-pink/80 text-white font-arcade text-[10px] border-2 border-white rounded-lg flex flex-col items-center justify-center shadow-lg shadow-arcade-pink/30 active:scale-95 transition cursor-pointer touch-none"
          >
            <Zap size={16} className="mb-0.5" />
            ZAP
          </button>
        </div>
      </div>
    </div>
  );
};
