import React, { useState, useEffect, useRef } from 'react';
import { GameId, GameStatus } from '../types';
import { audio } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft, ArrowUp, ArrowDown, ArrowLeftRight, Award, Zap, Flame, User, Users, ChevronRight, Check, AlertTriangle, Shield, RefreshCw } from 'lucide-react';

interface ArcadeMiniSuiteProps {
  gameId: GameId;
  onGameOver: (score: number) => void;
  onExit: () => void;
}

export const ArcadeMiniSuite: React.FC<ArcadeMiniSuiteProps> = ({ gameId, onGameOver, onExit }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem(`highscore_${gameId}`) || '1000');
  });

  useEffect(() => {
    setHighScore(Number(localStorage.getItem(`highscore_${gameId}`) || '1000'));
  }, [gameId]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationId = useRef<number | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // 1-5 Player setup states (Used for party-tap and astro-race)
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [multiplayerWinner, setMultiplayerWinner] = useState<number | null>(null);
  const [playerScores, setPlayerScores] = useState<number[]>([0, 0, 0, 0, 0]);

  // Game specific state configs
  const [currentQuestion, setCurrentQuestion] = useState<{ q: string; a: number; options: number[] }>({ q: '2 + 3', a: 5, options: [4, 5, 6] });
  const [typedWord, setTypedWord] = useState<string>('');
  const [simonSequence, setSimonSequence] = useState<number[]>([]);
  const [simonPlayerSequence, setSimonPlayerSequence] = useState<number[]>([]);
  const [simonActivePad, setSimonActivePad] = useState<number | null>(null);
  const [simonTurn, setSimonTurn] = useState<'CPU' | 'PLAYER'>('CPU');
  const [whackGrid, setWhackGrid] = useState<boolean[]>(Array(9).fill(false));
  const [whackGold, setWhackGold] = useState<boolean[]>(Array(9).fill(false));

  // Shared Keys mapping for 5 players
  // Player 1: Pink (Key: Q), Player 2: Cyan (Key: P), Player 3: Yellow (Key: Z), Player 4: Purple (Key: M), Player 5: Green (Key: Space)
  const playerColors = ['#ff007f', '#00f0ff', '#ffea00', '#7000ff', '#00ff66'];
  const playerColorNames = ['Pink (Q)', 'Cyan (P)', 'Kuning (Z)', 'Ungu (M)', 'Hijau (Space)'];
  const playerKeys = ['q', 'p', 'z', 'm', ' '];

  // Canvas-based state refs
  const stateRef = useRef<any>({});

  const CANVAS_GAMES = [
    'astro-race', 'fruit-catcher', 'laser-dodger', 'color-match', 'tetri-block',
    'neon-drifter', 'pixel-jump', 'speed-typer', 'sumo-push', 'bomb-tag',
    'grid-chase', 'flappy-neon', 'meteor-storm', 'tug-of-war', 'tank-neon',
    'paint-arena', 'space-soccer', 'neon-golf', 'glitch-sweeper', 'hex-shield',
    'pixel-painter', 'cyber-runner', 'neon-stacker', 'copter-neon', 'space-lander'
  ];

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      keysPressed.current[e.key] = true; // original case for space

      // Prevent scrolling for navigation keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }

      // 5-Player Quick Handler for Party Tap (Mashing Mode)
      if (gameStatus === 'PLAYING') {
        if (gameId === 'party-tap') {
          const idx = playerKeys.indexOf(key);
          if (idx !== -1 && idx < playerCount) {
            handlePartyTapInput(idx);
          }
        } else if (gameId === 'astro-race') {
          const idx = playerKeys.indexOf(key);
          if (idx !== -1 && idx < playerCount) {
            handleAstroRaceThrust(idx);
          }
        } else if (gameId === 'sumo-push') {
          const idx = playerKeys.indexOf(key);
          if (idx !== -1 && idx < playerCount) {
            handleSumoPushThrust(idx);
          }
        } else if (gameId === 'bomb-tag') {
          const idx = playerKeys.indexOf(key);
          if (idx !== -1 && idx < playerCount) {
            handleBombTagThrust(idx);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameId, gameStatus, playerCount]);

  // Reset Game States on GameId Swap
  useEffect(() => {
    setGameStatus('IDLE');
    setScore(0);
    setMultiplayerWinner(null);
    setPlayerScores([0, 0, 0, 0, 0]);
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
    }
  }, [gameId]);

  // Handle high scores saving
  const saveHighScore = (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem(`highscore_${gameId}`, finalScore.toString());
      // Delay high score sound slightly so it layers beautifully right after the game over sound!
      setTimeout(() => {
        playSound('newhighscore');
      }, 150);
    }
    onGameOver(finalScore);
  };

  // Sound helpers
  const playSound = (type: 'point' | 'bounce' | 'laser' | 'explosion' | 'victory' | 'gameover' | 'newhighscore') => {
    if (type === 'point') audio.playPoint();
    else if (type === 'bounce') audio.playBounce();
    else if (type === 'laser') audio.playLaser();
    else if (type === 'explosion') audio.playExplosion();
    else if (type === 'victory') audio.playVictory();
    else if (type === 'gameover') audio.playGameOver();
    else if (type === 'newhighscore') audio.playNewHighScore();
  };

  // ==========================================
  // GAME 6: PARTY TAP (1-5 Players)
  // ==========================================
  const startPartyTap = () => {
    playSound('point');
    setPlayerScores(Array(5).fill(0));
    setMultiplayerWinner(null);
    setGameStatus('PLAYING');

    stateRef.current = {
      timeLeft: 10.0, // 10 seconds of pure chaos
      lastTick: Date.now(),
      boostPlayer: -1,
      boostTime: 0,
    };
  };

  const handlePartyTapInput = (playerIdx: number) => {
    if (gameStatus !== 'PLAYING') return;
    playSound('bounce');
    setPlayerScores(prev => {
      const next = [...prev];
      let add = 10;
      // If they tapped during their colored boost!
      if (stateRef.current.boostPlayer === playerIdx) {
        add = 30;
        stateRef.current.boostPlayer = -1; // reset
      }
      next[playerIdx] += add;
      return next;
    });
  };

  // Party Tap Loop Handler
  const updatePartyTap = () => {
    const state = stateRef.current;
    const now = Date.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      setGameStatus('GAME_OVER');
      playSound('victory');

      // Find winner
      let maxScore = -1;
      let winnerIdx = 0;
      playerScores.slice(0, playerCount).forEach((s, idx) => {
        if (s > maxScore) {
          maxScore = s;
          winnerIdx = idx;
        }
      });

      setMultiplayerWinner(winnerIdx);
      saveHighScore(maxScore);
      return;
    }

    // Random Boost flashing for extra points
    if (state.boostPlayer === -1 && Math.random() < 0.05) {
      state.boostPlayer = Math.floor(Math.random() * playerCount);
      state.boostTime = 1.0; // 1 second to react
    } else if (state.boostPlayer !== -1) {
      state.boostTime -= dt;
      if (state.boostTime <= 0) {
        state.boostPlayer = -1;
      }
    }
  };

  // ==========================================
  // GAME 7: ASTRO RACE (1-5 Players Canvas)
  // ==========================================
  const startAstroRace = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setMultiplayerWinner(null);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 400;
    const height = canvas ? canvas.height : 320;

    // Set initial heights for spaceships
    const ships = [];
    const laneWidth = width / playerCount;
    for (let i = 0; i < playerCount; i++) {
      ships.push({
        x: laneWidth * i + laneWidth / 2,
        y: height - 40,
        speed: 0,
        stun: 0,
        color: playerColors[i],
      });
    }

    stateRef.current = {
      ships,
      asteroids: [],
      starField: Array(30).fill(null).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: Math.random() * 2 + 1
      })),
      lastSpawn: 0,
    };
  };

  const handleAstroRaceThrust = (playerIdx: number) => {
    if (gameStatus !== 'PLAYING') return;
    const ship = stateRef.current.ships[playerIdx];
    if (ship && ship.stun <= 0) {
      ship.y = Math.max(20, ship.y - 12);
      playSound('laser');
    }
  };

  const drawAndUpdateAstroRace = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state || !state.ships) return;

    // 1. Draw Space background
    ctx.fillStyle = '#030206';
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#ffffff';
    state.starField.forEach((star: any) => {
      star.y += star.speed;
      if (star.y > height) star.y = 0;
      ctx.fillRect(star.x, star.y, 1.5, 1.5);
    });

    // 2. Lanes dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const laneWidth = width / playerCount;
    for (let i = 1; i < playerCount; i++) {
      ctx.beginPath();
      ctx.moveTo(laneWidth * i, 0);
      ctx.lineTo(laneWidth * i, height);
      ctx.stroke();
    }

    // Finish Line at the top
    ctx.fillStyle = '#ffea00';
    ctx.fillRect(0, 30, width, 4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0, 28, width, 8);
    ctx.setLineDash([]);

    // 3. Asteroids Spawning & Movement
    if (Date.now() - state.lastSpawn > 1200) {
      state.asteroids.push({
        x: Math.random() > 0.5 ? -20 : width + 20,
        y: 60 + Math.random() * (height - 150),
        vx: (Math.random() * 3 + 1.5) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 8 + 6,
      });
      state.lastSpawn = Date.now();
    }

    ctx.fillStyle = '#a1a1aa';
    state.asteroids.forEach((ast: any, idx: number) => {
      ast.x += ast.vx;
      ctx.beginPath();
      ctx.arc(ast.x, ast.y, ast.size, 0, Math.PI * 2);
      ctx.fill();

      // Check collision with ships
      state.ships.forEach((ship: any, sIdx: number) => {
        const dx = ship.x - ast.x;
        const dy = ship.y - ast.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ast.size + 10 && ship.stun <= 0) {
          ship.stun = 30; // Stun cycles
          ship.y = Math.min(height - 40, ship.y + 40); // push back
          playSound('explosion');
        }
      });

      // Cleanup offscreen asteroids
      if (ast.x < -50 || ast.x > width + 50) {
        state.asteroids.splice(idx, 1);
      }
    });

    // 4. Update & Draw Ships
    state.ships.forEach((ship: any, idx: number) => {
      if (ship.stun > 0) {
        ship.stun--;
        ctx.fillStyle = '#ef4444'; // Red blink
      } else {
        ctx.fillStyle = ship.color;
      }

      // Draw Spaceship Triangle
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y - 12);
      ctx.lineTo(ship.x - 8, ship.y + 8);
      ctx.lineTo(ship.x + 8, ship.y + 8);
      ctx.closePath();
      ctx.fill();

      // Draw active player label
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`P${idx + 1}`, ship.x, ship.y + 18);

      // Check Victory Condition
      if (ship.y <= 34) {
        setGameStatus('GAME_OVER');
        setMultiplayerWinner(idx);
        playSound('victory');
        saveHighScore(1000 + (height - ship.y) * 10);
      }
    });
  };

  // ==========================================
  // GAME 8: FRUIT CATCHER
  // ==========================================
  const startFruitCatcher = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      playerX: 180,
      playerWidth: 50,
      fruits: [],
      lastSpawn: 0,
      lives: 3
    };
  };

  const drawAndUpdateFruitCatcher = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    ctx.fillStyle = '#07060f';
    ctx.fillRect(0, 0, width, height);

    // Update player position via keyboard / keys pressed
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
      state.playerX = Math.max(0, state.playerX - 6);
    }
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
      state.playerX = Math.min(width - state.playerWidth, state.playerX + 6);
    }

    // Spawn Fruits
    if (Date.now() - state.lastSpawn > 900) {
      const isBomb = Math.random() < 0.25;
      const isGolden = Math.random() < 0.15;
      state.fruits.push({
        x: Math.random() * (width - 20) + 10,
        y: 0,
        speed: Math.random() * 2 + 2,
        isBomb,
        isGolden,
        size: isGolden ? 8 : 6
      });
      state.lastSpawn = Date.now();
    }

    // Update Fruits
    state.fruits.forEach((fruit: any, idx: number) => {
      fruit.y += fruit.speed;

      // Draw Fruit
      if (fruit.isBomb) {
        ctx.fillStyle = '#ef4444'; // Red bomb
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.size, 0, Math.PI * 2);
        ctx.fill();
        // Fuse spark
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(fruit.x - 1, fruit.y - fruit.size - 2, 2, 2);
      } else if (fruit.isGolden) {
        ctx.fillStyle = '#ffea00'; // Gold point
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#00ff66'; // Green fruit
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Check Catch Collision
      const basketY = height - 30;
      if (fruit.y >= basketY - 5 && fruit.y <= basketY + 10) {
        if (fruit.x >= state.playerX && fruit.x <= state.playerX + state.playerWidth) {
          // Caught!
          state.fruits.splice(idx, 1);
          if (fruit.isBomb) {
            state.lives -= 1;
            playSound('explosion');
            if (state.lives <= 0) {
              setGameStatus('GAME_OVER');
              playSound('gameover');
              saveHighScore(score);
            }
          } else {
            playSound('bounce');
            setScore(s => {
              const add = fruit.isGolden ? 150 : 50;
              return s + add;
            });
          }
          return;
        }
      }

      // Out of bounds
      if (fruit.y > height) {
        state.fruits.splice(idx, 1);
        if (!fruit.isBomb) {
          // missed regular fruit costs nothing, keeps game fast
        }
      }
    });

    // Draw Basket
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;
    ctx.fillRect(state.playerX, height - 30, state.playerWidth, 8);
    ctx.shadowBlur = 0;

    // Draw HUD inside canvas
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES: ${'❤️'.repeat(Math.max(0, state.lives))}`, 10, 20);
  };

  const handleFruitMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameId !== 'fruit-catcher' || gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const scaleX = canvas.width / rect.width;
    let newX = (mouseX * scaleX) - (stateRef.current.playerWidth / 2);
    if (newX < 0) newX = 0;
    if (newX > canvas.width - stateRef.current.playerWidth) {
      newX = canvas.width - stateRef.current.playerWidth;
    }
    stateRef.current.playerX = newX;
  };

  const handleFruitTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameId !== 'fruit-catcher' || gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;

    const scaleX = canvas.width / rect.width;
    let newX = (touchX * scaleX) - (stateRef.current.playerWidth / 2);
    if (newX < 0) newX = 0;
    if (newX > canvas.width - stateRef.current.playerWidth) {
      newX = canvas.width - stateRef.current.playerWidth;
    }
    stateRef.current.playerX = newX;
  };

  // ==========================================
  // GAME 9: LASER DODGER
  // ==========================================
  const startLaserDodger = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      x: 200,
      y: 160,
      size: 10,
      lasers: [],
      lastLaser: 0,
      timeElapsed: 0
    };
  };

  const drawAndUpdateLaserDodger = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, width, height);

    // Update Player position
    const speed = 4;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) state.x = Math.max(10, state.x - speed);
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) state.x = Math.min(width - 10, state.x + speed);
    if (keysPressed.current['arrowup'] || keysPressed.current['w']) state.y = Math.max(10, state.y - speed);
    if (keysPressed.current['arrowdown'] || keysPressed.current['s']) state.y = Math.min(height - 10, state.y + speed);

    state.timeElapsed += 1;
    if (state.timeElapsed % 10 === 0) {
      setScore(s => s + 5);
    }

    // Laser Spawner
    if (Date.now() - state.lastLaser > 1500) {
      const type = Math.random() > 0.5 ? 'H' : 'V';
      state.lasers.push({
        type,
        coord: type === 'H' ? Math.random() * (height - 40) + 20 : Math.random() * (width - 40) + 20,
        warning: 60, // frames of warning
        active: 30, // frames of active fire
      });
      state.lastLaser = Date.now();
    }

    // Laser processing
    state.lasers.forEach((laser: any, idx: number) => {
      if (laser.warning > 0) {
        laser.warning--;
        // Draw dashed warning line
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        if (laser.type === 'H') {
          ctx.moveTo(0, laser.coord);
          ctx.lineTo(width, laser.coord);
        } else {
          ctx.moveTo(laser.coord, 0);
          ctx.lineTo(laser.coord, height);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (laser.active > 0) {
        laser.active--;
        // Active laser blast!
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 8;
        ctx.beginPath();
        if (laser.type === 'H') {
          ctx.moveTo(0, laser.coord);
          ctx.lineTo(width, laser.coord);
        } else {
          ctx.moveTo(laser.coord, 0);
          ctx.lineTo(laser.coord, height);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Collision Check
        let hit = false;
        if (laser.type === 'H') {
          if (Math.abs(state.y - laser.coord) < 12) hit = true;
        } else {
          if (Math.abs(state.x - laser.coord) < 12) hit = true;
        }

        if (hit) {
          playSound('explosion');
          setGameStatus('GAME_OVER');
          playSound('gameover');
          saveHighScore(score);
        }
      } else {
        state.lasers.splice(idx, 1);
      }
    });

    // Draw Player
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;
    ctx.fillRect(state.x - state.size / 2, state.y - state.size / 2, state.size, state.size);
    ctx.shadowBlur = 0;
  };

  // Laser Dodger drag handlers
  const handleLaserTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameId !== 'laser-dodger' || gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    stateRef.current.x = (touch.clientX - rect.left) * scaleX;
    stateRef.current.y = (touch.clientY - rect.top) * scaleY;
  };

  const handleLaserMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameId !== 'laser-dodger' || gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    stateRef.current.x = (e.clientX - rect.left) * scaleX;
    stateRef.current.y = (e.clientY - rect.top) * scaleY;
  };

  // ==========================================
  // GAME 10: COLOR MATCH
  // ==========================================
  const startColorMatch = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      shieldAngle: 0, // 0 to 3 corresponding to top/right/bottom/left
      balls: [],
      lastSpawn: 0,
      score: 0
    };
  };

  const drawAndUpdateColorMatch = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Handle Rotation Input
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
      keysPressed.current['arrowleft'] = false;
      keysPressed.current['a'] = false;
      state.shieldAngle = (state.shieldAngle + 3) % 4; // rotate counterclockwise
      playSound('bounce');
    }
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
      keysPressed.current['arrowright'] = false;
      keysPressed.current['d'] = false;
      state.shieldAngle = (state.shieldAngle + 1) % 4; // rotate clockwise
      playSound('bounce');
    }

    // Shield quadrant colors (0: Top/Right region, 1: Bottom/Right region, etc.)
    const shieldColors = ['#ff007f', '#00f0ff', '#ffea00', '#7000ff'];

    // Draw central node core (sleek glowing white core)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw surrounding colored shields, rotating based on state.shieldAngle
    for (let d = 0; d < 4; d++) {
      // The color segment shifts clockwise with shieldAngle
      const color = shieldColors[(d - state.shieldAngle + 4) % 4];
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      // Draw 90 degree arc centered at physical direction d
      // 0: Top, 1: Right, 2: Bottom, 3: Left
      const centerAngle = (d * Math.PI / 2) - Math.PI / 2;
      const startAngle = centerAngle - Math.PI / 4;
      const endAngle = centerAngle + Math.PI / 4;
      ctx.arc(centerX, centerY, 24, startAngle, endAngle);
      ctx.stroke();
    }

    // Spawn Incoming Balls
    if (Date.now() - state.lastSpawn > 1400) {
      const incomingDir = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
      const randomColorIdx = Math.floor(Math.random() * 4); // Random color from wheel!

      let bx = centerX, by = centerY;
      if (incomingDir === 0) by = -20;
      else if (incomingDir === 1) bx = width + 20;
      else if (incomingDir === 2) by = height + 20;
      else if (incomingDir === 3) bx = -20;

      state.balls.push({
        x: bx,
        y: by,
        targetX: centerX,
        targetY: centerY,
        colorIdx: randomColorIdx,
        speed: 1.6,
        incomingDir
      });
      state.lastSpawn = Date.now();
    }

    // Update Balls
    state.balls.forEach((ball: any, idx: number) => {
      const dx = ball.targetX - ball.x;
      const dy = ball.targetY - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 26) {
        ball.x += (dx / dist) * ball.speed;
        ball.y += (dy / dist) * ball.speed;

        ctx.fillStyle = shieldColors[ball.colorIdx];
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Collided with shield! Let's check if the shield color at incomingDir matches ball.colorIdx
        state.balls.splice(idx, 1);
        const shieldColorIdx = (ball.incomingDir - state.shieldAngle + 4) % 4;
        
        if (shieldColorIdx === ball.colorIdx) {
          playSound('point');
          state.score += 100;
          setScore(state.score);
        } else {
          // Failure
          playSound('explosion');
          setGameStatus('GAME_OVER');
          playSound('gameover');
          saveHighScore(state.score);
        }
      }
    });
  };

  // ==========================================
  // GAME 11: TETRI BLOCK (Minimal Retro Matching Stack)
  // ==========================================
  const startTetriBlock = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      grid: Array(10).fill(null).map(() => Array(8).fill('#161525')),
      curX: 3,
      curY: 0,
      curColor: '#ff007f',
      lastDrop: Date.now()
    };
  };

  const drawAndUpdateTetriBlock = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, width, height);

    // Controller input
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
      keysPressed.current['arrowleft'] = false;
      keysPressed.current['a'] = false;
      if (state.curX > 0 && state.grid[state.curY][state.curX - 1] === '#161525') state.curX--;
      playSound('bounce');
    }
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
      keysPressed.current['arrowright'] = false;
      keysPressed.current['d'] = false;
      if (state.curX < 7 && state.grid[state.curY][state.curX + 1] === '#161525') state.curX++;
      playSound('bounce');
    }
    if (keysPressed.current['arrowdown'] || keysPressed.current['s']) {
      keysPressed.current['arrowdown'] = false;
      keysPressed.current['s'] = false;
      // manual drop
      dropBlock();
    }

    // Automatic drop timer
    if (Date.now() - state.lastDrop > 800) {
      dropBlock();
    }

    function dropBlock() {
      state.lastDrop = Date.now();
      if (state.curY < 9 && state.grid[state.curY + 1][state.curX] === '#161525') {
        state.curY++;
      } else {
        // lock block
        state.grid[state.curY][state.curX] = state.curColor;
        playSound('point');
        setScore(s => s + 30);

        // check row clears or match colors
        checkMatches();

        // spawn next
        state.curX = 3;
        state.curY = 0;
        state.curColor = playerColors[Math.floor(Math.random() * playerColors.length)];

        // Check lose condition
        if (state.grid[state.curY][state.curX] !== '#161525') {
          setGameStatus('GAME_OVER');
          playSound('gameover');
          saveHighScore(score);
        }
      }
    }

    function checkMatches() {
      // Simplistic grid matches: if any row is full, clear it
      for (let y = 0; y < 10; y++) {
        let isFull = true;
        for (let x = 0; x < 8; x++) {
          if (state.grid[y][x] === '#161525') isFull = false;
        }
        if (isFull) {
          // Clear row
          playSound('victory');
          setScore(s => s + 500);
          for (let row = y; row > 0; row--) {
            state.grid[row] = [...state.grid[row - 1]];
          }
          state.grid[0] = Array(8).fill('#161525');
        }
      }
    }

    // Render Grid
    const size = 26;
    const offsetX = (width - 8 * size) / 2;
    const offsetY = (height - 10 * size) / 2;

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = state.grid[y][x];
        ctx.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, size - 2);
      }
    }

    // Render Current falling block
    ctx.fillStyle = state.curColor;
    ctx.fillRect(offsetX + state.curX * size + 1, offsetY + state.curY * size + 1, size - 2, size - 2);
  };

  // ==========================================
  // GAME 12: QUICK MATH BLASTER
  // ==========================================
  const startMathBlaster = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    generateMathQuestion();
  };

  const generateMathQuestion = () => {
    const num1 = Math.floor(Math.random() * 12) + 2;
    const num2 = Math.floor(Math.random() * 12) + 2;
    const isAdd = Math.random() > 0.5;

    const q = isAdd ? `${num1} + ${num2}` : `${num1} x ${num2}`;
    const a = isAdd ? num1 + num2 : num1 * num2;

    const opt1 = a + (Math.random() > 0.5 ? 2 : -2);
    const opt2 = a + (Math.random() > 0.5 ? 5 : -3);
    const options = [a, opt1, opt2].sort(() => Math.random() - 0.5);

    setCurrentQuestion({ q, a, options });
  };

  const handleMathAnswer = (opt: number) => {
    if (opt === currentQuestion.a) {
      playSound('point');
      setScore(s => s + 200);
      generateMathQuestion();
    } else {
      playSound('explosion');
      setGameStatus('GAME_OVER');
      playSound('gameover');
      saveHighScore(score);
    }
  };

  // ==========================================
  // GAME 13: NEON DRIFTER
  // ==========================================
  const startNeonDrifter = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      carX: 200,
      dir: 1, // 1 for right, -1 for left
      points: [],
      speed: 3.5,
      score: 0,
      curveTimer: 0,
      curveDir: 0
    };

    // Generate smooth initial track (enough points to cover any fullscreen canvas height, up to 1200 pixels)
    let cx = 200;
    let currentCurveDir = 0;
    let currentCurveTimer = 0;

    for (let i = 0; i < 1200; i++) {
      if (currentCurveTimer <= 0) {
        currentCurveTimer = Math.floor(Math.random() * 50) + 30; // curve segment length
        currentCurveDir = (Math.random() - 0.5) * 1.5; // gentle slope
      }
      currentCurveTimer--;
      cx += currentCurveDir;
      if (cx < 100) { cx = 100; currentCurveDir = 1; }
      if (cx > 300) { cx = 300; currentCurveDir = -1; }
      stateRef.current.points.push(cx);
    }
    stateRef.current.curveTimer = currentCurveTimer;
    stateRef.current.curveDir = currentCurveDir;
  };

  const drawAndUpdateNeonDrifter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, width, height);

    // Ensure we have enough track points if canvas height has changed/resized
    while (state.points.length < height + 100) {
      state.points.push(200);
    }

    // Drifter steering
    if (keysPressed.current[' '] || keysPressed.current['arrowleft'] || keysPressed.current['arrowright']) {
      keysPressed.current[' '] = false;
      keysPressed.current['arrowleft'] = false;
      keysPressed.current['arrowright'] = false;
      state.dir = -state.dir;
      playSound('bounce');
    }

    // Car updates
    state.carX += state.dir * state.speed;
    state.score += 2;
    setScore(state.score);

    // Track scroll: Shift bottom-most point and generate a new continuous point at the top
    state.points.shift();
    let lastPoint = state.points[state.points.length - 1] || 200;
    state.curveTimer--;
    if (state.curveTimer <= 0) {
      state.curveTimer = Math.floor(Math.random() * 50) + 30;
      state.curveDir = (Math.random() - 0.5) * 1.8;
    }
    let nextPoint = lastPoint + state.curveDir;
    if (nextPoint < 100) { nextPoint = 100; state.curveDir = 1; }
    if (nextPoint > 300) { nextPoint = 300; state.curveDir = -1; }
    state.points.push(nextPoint);

    // Draw Track Line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 44; // width of road
    ctx.beginPath();
    ctx.lineJoin = 'round';
    for (let i = 0; i < height; i++) {
      ctx.lineTo(state.points[i], height - i);
    }
    ctx.stroke();

    // Inner center dotted line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    for (let i = 0; i < height; i++) {
      ctx.lineTo(state.points[i], height - i);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Check boundary crash (car is at height - 44, so we check points[44])
    const activeRoadCenter = state.points[44] || 200;
    if (Math.abs(state.carX - activeRoadCenter) > 22) { // 22 is half of 44 road width
      playSound('explosion');
      setGameStatus('GAME_OVER');
      playSound('gameover');
      saveHighScore(state.score);
    }

    // Draw Car
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.fillRect(state.carX - 6, height - 44, 12, 16);
    ctx.shadowBlur = 0;
  };

  // ==========================================
  // GAME 14: PIXEL JUMPER
  // ==========================================
  const startPixelJumper = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    const initialPlats = [];
    for (let i = 0; i < 8; i++) {
      initialPlats.push({
        x: Math.random() * 320 + 30,
        y: 300 - i * 45,
        width: 50,
        height: 6
      });
    }

    stateRef.current = {
      px: 200,
      py: 150,
      vy: 0,
      platforms: initialPlats,
      lastScoreCheck: 0
    };
  };

  const drawAndUpdatePixelJumper = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, width, height);

    // Player inputs
    const speed = 4.5;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) state.px = Math.max(10, state.px - speed);
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) state.px = Math.min(width - 10, state.px + speed);

    // Gravity
    state.vy += 0.2; // gravity acceleration
    state.py += state.vy;

    // Camera scrolling (if player climbs past midpoint)
    if (state.py < height / 2) {
      const diff = height / 2 - state.py;
      state.py = height / 2;
      setScore(s => s + Math.floor(diff));

      // scroll platforms down
      state.platforms.forEach((plat: any) => {
        plat.y += diff;
        if (plat.y > height) {
          // Re-generate at top
          plat.y = 0;
          plat.x = Math.random() * (width - 60) + 10;
        }
      });
    }

    // Draw Platforms
    ctx.fillStyle = '#00f0ff';
    state.platforms.forEach((plat: any) => {
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Collision Check: only landing from top down
      if (state.vy > 0) {
        if (state.px >= plat.x - 5 && state.px <= plat.x + plat.width + 5) {
          if (state.py + 10 >= plat.y && state.py + 10 <= plat.y + 10) {
            state.vy = -6.5; // bounce up
            playSound('bounce');
          }
        }
      }
    });

    // Draw Jumper
    ctx.fillStyle = '#ffea00';
    ctx.fillRect(state.px - 6, state.py, 12, 12);

    // Out of bounds check
    if (state.py > height) {
      playSound('explosion');
      setGameStatus('GAME_OVER');
      playSound('gameover');
      saveHighScore(score);
    }
  };

  const handleJumperTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameId !== 'pixel-jump' || gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;

    stateRef.current.px = (touch.clientX - rect.left) * scaleX;
  };

  const handleJumperMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameId !== 'pixel-jump' || gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    stateRef.current.px = (e.clientX - rect.left) * scaleX;
  };

  // ==========================================
  // GAME 15: SIMON RETRO
  // ==========================================
  const startSimonRetro = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setSimonSequence([Math.floor(Math.random() * 4)]);
    setSimonPlayerSequence([]);
    setSimonTurn('CPU');
  };

  useEffect(() => {
    if (gameId !== 'simon-retro' || gameStatus !== 'PLAYING' || simonTurn !== 'CPU') return;

    // CPU sequence presentation
    let index = 0;
    const interval = setInterval(() => {
      if (index < simonSequence.length) {
        const val = simonSequence[index];
        setSimonActivePad(val);
        playSound('point');
        setTimeout(() => setSimonActivePad(null), 300);
        index++;
      } else {
        clearInterval(interval);
        setSimonTurn('PLAYER');
      }
    }, 600);

    return () => clearInterval(interval);
  }, [simonSequence, simonTurn, gameId, gameStatus]);

  const handleSimonPadPress = (padIdx: number) => {
    if (gameStatus !== 'PLAYING' || simonTurn !== 'PLAYER') return;

    setSimonActivePad(padIdx);
    playSound('point');
    setTimeout(() => setSimonActivePad(null), 150);

    const nextPlaySeq = [...simonPlayerSequence, padIdx];
    setSimonPlayerSequence(nextPlaySeq);

    // check if matches sequence
    const step = nextPlaySeq.length - 1;
    if (nextPlaySeq[step] !== simonSequence[step]) {
      // Wrong sequence
      playSound('explosion');
      setGameStatus('GAME_OVER');
      playSound('gameover');
      saveHighScore(score);
      return;
    }

    if (nextPlaySeq.length === simonSequence.length) {
      // Correct sequence completed!
      setScore(s => s + 500);
      setSimonPlayerSequence([]);
      setTimeout(() => {
        setSimonSequence(seq => [...seq, Math.floor(Math.random() * 4)]);
        setSimonTurn('CPU');
      }, 1000);
    }
  };

  // ==========================================
  // GAME 16: WHACK-A-GLITCH
  // ==========================================
  const startWhackAGlitch = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      timeLeft: 15,
      lastTick: Date.now(),
      lastSpawn: 0
    };
  };

  const updateWhackAGlitch = () => {
    const state = stateRef.current;
    const now = Date.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      setGameStatus('GAME_OVER');
      playSound('victory');
      saveHighScore(score);
      return;
    }

    // Random glitch popping
    if (Date.now() - state.lastSpawn > 600) {
      const idx = Math.floor(Math.random() * 9);
      const isGold = Math.random() < 0.2;

      setWhackGrid(g => {
        const next = [...g];
        next[idx] = true;
        return next;
      });

      setWhackGold(g => {
        const next = [...g];
        next[idx] = isGold;
        return next;
      });

      // auto-fade after 0.8s
      setTimeout(() => {
        setWhackGrid(g => {
          const next = [...g];
          next[idx] = false;
          return next;
        });
      }, 800);

      state.lastSpawn = Date.now();
    }
  };

  const handleWhack = (idx: number) => {
    if (whackGrid[idx]) {
      playSound('point');
      const add = whackGold[idx] ? 300 : 100;
      setScore(s => s + add);

      // turn off
      setWhackGrid(g => {
        const next = [...g];
        next[idx] = false;
        return next;
      });
    } else {
      // Penalty for miswhacking
      playSound('bounce');
      setScore(s => Math.max(0, s - 50));
    }
  };

  // ==========================================
  // GAME 17: SPEED TYPER
  // ==========================================
  const startSpeedTyper = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setTypedWord('');

    stateRef.current = {
      words: [],
      lastSpawn: 0,
      dictionary: ['ARCADE', 'RETRO', 'GLOW', 'PIXEL', 'CABINET', 'NEON', 'CYBER', 'DRAGON', 'REACTION', 'GAMER', 'COIN', 'LEVEL', 'MATRIX', 'TACTICAL', 'DEFENSE', 'BATTLE']
    };
  };

  const drawAndUpdateSpeedTyper = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, width, height);

    // Spawn Words
    if (Date.now() - state.lastSpawn > 1800) {
      const word = state.dictionary[Math.floor(Math.random() * state.dictionary.length)];
      state.words.push({
        text: word,
        x: Math.random() * (width - 120) + 30,
        y: 20,
        speed: Math.random() * 0.8 + 0.4
      });
      state.lastSpawn = Date.now();
    }

    // Update & Draw Words
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';

    state.words.forEach((w: any, idx: number) => {
      w.y += w.speed;

      // Draw active background track highlight if matching first letter
      ctx.fillStyle = 'rgba(255, 0, 127, 0.15)';
      ctx.fillRect(w.x - 45, w.y - 12, 90, 18);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(w.text, w.x, w.y);

      // Hit bottom check
      if (w.y > height - 10) {
        playSound('explosion');
        setGameStatus('GAME_OVER');
        playSound('gameover');
        saveHighScore(score);
      }
    });

    // Draw keyboard helper hint on mobile
    ctx.fillStyle = '#ff007f';
    ctx.font = '10px monospace';
    ctx.fillText(`TAIP & TEKAN ENTER UNTUK MENEMBAK`, width / 2, height - 20);
  };

  const submitTyperWord = (e: React.FormEvent) => {
    e.preventDefault();
    const wordClean = typedWord.trim().toUpperCase();
    const state = stateRef.current;
    if (!state || !state.words) return;

    const matchedIdx = state.words.findIndex((w: any) => w.text === wordClean);
    if (matchedIdx !== -1) {
      playSound('point');
      setScore(s => s + 250);
      state.words.splice(matchedIdx, 1);
    } else {
      playSound('bounce');
    }
    setTypedWord('');
  };


  // ==========================================
  // GAME 19: BUMPER SUMO (1-5 Players Canvas)
  // ==========================================
  const startSumoPush = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setMultiplayerWinner(null);
    setScore(0);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 400;
    const height = canvas ? canvas.height : 320;

    const players = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const activePlayerCount = playerCount === 1 ? 4 : playerCount;

    for (let i = 0; i < activePlayerCount; i++) {
      const angle = (i * 2 * Math.PI) / activePlayerCount;
      players.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        angle: angle + Math.PI,
        color: playerColors[i],
        id: i,
        alive: true,
        radius: 12,
      });
    }

    stateRef.current = {
      players,
      arenaRadius: Math.min(width, height) * 0.45,
      centerX,
      centerY,
      particles: [],
      arenaShrinkRate: 4, // pixels per second
      lastTime: Date.now(),
      activePlayerCount,
    };
  };

  const handleSumoPushThrust = (playerIdx: number) => {
    if (gameStatus !== 'PLAYING') return;
    const state = stateRef.current;
    if (!state || !state.players) return;
    const player = state.players[playerIdx];
    if (player && player.alive) {
      const force = 4.2;
      player.vx += Math.cos(player.angle) * force;
      player.vy += Math.sin(player.angle) * force;
      playSound('bounce');
      // spawn tiny smoke particles behind them
      for (let i = 0; i < 4; i++) {
        state.particles.push({
          x: player.x - Math.cos(player.angle) * player.radius,
          y: player.y - Math.sin(player.angle) * player.radius,
          vx: -Math.cos(player.angle) * 1 + (Math.random() - 0.5),
          vy: -Math.sin(player.angle) * 1 + (Math.random() - 0.5),
          color: player.color,
          alpha: 1,
          size: Math.random() * 2 + 1,
          life: 0.3,
        });
      }
    }
  };

  const drawAndUpdateSumoPush = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state || !state.players) return;

    // Background
    ctx.fillStyle = '#04020a';
    ctx.fillRect(0, 0, width, height);

    const now = Date.now();
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    // Shrink arena
    state.arenaRadius = Math.max(35, state.arenaRadius - dt * state.arenaShrinkRate);

    // Draw shrinking circular arena limit with glowing gradient
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#7000ff';
    ctx.strokeStyle = '#7000ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(state.centerX, state.centerY, state.arenaRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw safe ground (subtle circle pattern fill)
    ctx.fillStyle = 'rgba(112, 0, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(state.centerX, state.centerY, state.arenaRadius, 0, Math.PI * 2);
    ctx.fill();

    // Update & Draw Particles
    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life * 2);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    state.particles = state.particles.filter((p: any) => p.life > 0);

    // Update & Draw Players
    state.players.forEach((p: any) => {
      if (!p.alive) return;

      // Friction
      p.vx *= 0.95;
      p.vy *= 0.95;

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Spin pointer or drive bot
      if (playerCount === 1 && p.id > 0) {
        // Find closest alive opponent (including human player)
        let target = { x: state.centerX, y: state.centerY };
        let minDist = 9999;
        state.players.forEach((other: any) => {
          if (other.id !== p.id && other.alive) {
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
              minDist = dist;
              target = { x: other.x, y: other.y };
            }
          }
        });
        // Point towards target
        const targetAngle = Math.atan2(target.y - p.y, target.x - p.x);
        p.angle = targetAngle;

        // Thrust periodically if inside arena
        const distFromCenter = Math.sqrt((p.x - state.centerX) ** 2 + (p.y - state.centerY) ** 2);
        if (distFromCenter < state.arenaRadius - 10 && Math.random() < 0.04) {
          const force = 3.8;
          p.vx += Math.cos(p.angle) * force;
          p.vy += Math.sin(p.angle) * force;
          // sparks
          for (let i = 0; i < 3; i++) {
            state.particles.push({
              x: p.x - Math.cos(p.angle) * p.radius,
              y: p.y - Math.sin(p.angle) * p.radius,
              vx: -Math.cos(p.angle) * 1 + (Math.random() - 0.5),
              vy: -Math.sin(p.angle) * 1 + (Math.random() - 0.5),
              color: p.color,
              alpha: 1,
              size: Math.random() * 2 + 1,
              life: 0.3,
            });
          }
        }
      } else {
        p.angle = (p.angle || 0) + 0.07;
      }

      // Stay-inside check (if entirely out, eliminate!)
      const dx = p.x - state.centerX;
      const dy = p.y - state.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > state.arenaRadius) {
        p.alive = false;
        playSound('explosion');
        // blow up particles
        for (let k = 0; k < 15; k++) {
          state.particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: p.color,
            alpha: 1,
            size: Math.random() * 3 + 1,
            life: 0.5,
          });
        }
      }

      // Draw pointer direction
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18);
      ctx.stroke();

      // Draw player bumper
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius - 3, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`P${p.id + 1}`, p.x, p.y + p.radius + 11);
    });

    // Circle bumper collision logic (restitution/bounce)
    for (let i = 0; i < state.players.length; i++) {
      const p1 = state.players[i];
      if (!p1.alive) continue;
      for (let j = i + 1; j < state.players.length; j++) {
        const p2 = state.players[j];
        if (!p2.alive) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          p1.x -= nx * overlap * 0.5;
          p1.y -= ny * overlap * 0.5;
          p2.x += nx * overlap * 0.5;
          p2.y += ny * overlap * 0.5;

          const rvx = p2.vx - p1.vx;
          const rvy = p2.vy - p1.vy;
          const velNormal = rvx * nx + rvy * ny;

          if (velNormal < 0) {
            const restitution = 1.4; // very springy!
            const impulse = -(1 + restitution) * velNormal;
            p1.vx -= impulse * nx * 0.5;
            p1.vy -= impulse * ny * 0.5;
            p2.vx += impulse * nx * 0.5;
            p2.vy += impulse * ny * 0.5;
            playSound('laser');

            // Sparks
            for (let k = 0; k < 6; k++) {
              state.particles.push({
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#ffffff',
                alpha: 1,
                size: Math.random() * 2 + 1,
                life: 0.3,
              });
            }
          }
        }
      }
    }

    // Multi-player win checks
    const alivePlayers = state.players.filter((p: any) => p.alive);
    if (playerCount > 1) {
      if (alivePlayers.length === 1) {
        setMultiplayerWinner(alivePlayers[0].id);
        setGameStatus('GAME_OVER');
        playSound('victory');
        saveHighScore(1200);
      } else if (alivePlayers.length === 0) {
        setGameStatus('GAME_OVER');
        playSound('gameover');
      }
    } else {
      // 1P Mode Score is survival time + defeating bots
      if (!state.players[0].alive) {
        setGameStatus('GAME_OVER');
        playSound('gameover');
        saveHighScore(score);
      } else if (alivePlayers.length === 1 && alivePlayers[0].id === 0) {
        // Player is the sole survivor!
        setMultiplayerWinner(0);
        setGameStatus('GAME_OVER');
        playSound('victory');
        saveHighScore(score + 1000);
      } else {
        // Increment score
        setScore(prev => prev + 1);
      }
    }

    // Top indicator
    ctx.fillStyle = '#7000ff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ARENA MENYUSUT! ELAK JATUH KELUAR!`, width / 2, 25);
  };

  // ==========================================
  // GAME 20: NEON BOMB TAG (1-5 Players Canvas)
  // ==========================================
  const startBombTag = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setMultiplayerWinner(null);
    setScore(0);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 400;
    const height = canvas ? canvas.height : 320;

    const players = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const activePlayerCount = playerCount === 1 ? 4 : playerCount;

    for (let i = 0; i < activePlayerCount; i++) {
      const angle = (i * 2 * Math.PI) / activePlayerCount;
      players.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        angle: angle + Math.PI,
        color: playerColors[i],
        id: i,
        alive: true,
        radius: 12,
      });
    }

    // Randomly assign initial bomb from the active players
    const bombCarrier = Math.floor(Math.random() * activePlayerCount);

    stateRef.current = {
      players,
      bombCarrier,
      bombTimer: 8.0, // 8 seconds countdown
      particles: [],
      lastTime: Date.now(),
      roundResetTimer: 0,
      activePlayerCount,
    };
  };

  const handleBombTagThrust = (playerIdx: number) => {
    if (gameStatus !== 'PLAYING') return;
    const state = stateRef.current;
    if (!state || !state.players) return;
    const player = state.players[playerIdx];
    if (player && player.alive) {
      const force = 4.0;
      player.vx += Math.cos(player.angle) * force;
      player.vy += Math.sin(player.angle) * force;
      playSound('bounce');
      // spawn tiny sparks
      for (let i = 0; i < 3; i++) {
        state.particles.push({
          x: player.x - Math.cos(player.angle) * player.radius,
          y: player.y - Math.sin(player.angle) * player.radius,
          vx: -Math.cos(player.angle) * 1 + (Math.random() - 0.5),
          vy: -Math.sin(player.angle) * 1 + (Math.random() - 0.5),
          color: player.color,
          alpha: 1,
          size: Math.random() * 2 + 1,
          life: 0.3,
        });
      }
    }
  };

  const drawAndUpdateBombTag = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state || !state.players) return;

    const createSparks = (x: number, y: number, color: string) => {
      for (let k = 0; k < 8; k++) {
        state.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          color,
          alpha: 1,
          size: Math.random() * 2 + 1,
          life: 0.4,
        });
      }
    };

    // Background
    ctx.fillStyle = '#06050e';
    ctx.fillRect(0, 0, width, height);

    const now = Date.now();
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    // Draw grid lines for sci-fi look
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Bomb timer update
    if (state.roundResetTimer > 0) {
      state.roundResetTimer -= dt;
      if (state.roundResetTimer <= 0) {
        // Find next round carriers or finish game
        const aliveOnes = state.players.filter((p: any) => p.alive);
        if (aliveOnes.length <= 1) {
          if (aliveOnes.length === 1 && playerCount > 1) {
            setMultiplayerWinner(aliveOnes[0].id);
            setGameStatus('GAME_OVER');
            playSound('victory');
            saveHighScore(1000);
          } else {
            setGameStatus('GAME_OVER');
            playSound('gameover');
          }
          return;
        } else {
          // Reset positions and select a new carrier
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) * 0.35;
          aliveOnes.forEach((p: any, idx: number) => {
            const angle = (idx * 2 * Math.PI) / aliveOnes.length;
            p.x = centerX + radius * Math.cos(angle);
            p.y = centerY + radius * Math.sin(angle);
            p.vx = 0;
            p.vy = 0;
          });
          const randIdx = Math.floor(Math.random() * aliveOnes.length);
          state.bombCarrier = aliveOnes[randIdx].id;
          state.bombTimer = Math.max(5.0, 8.0 - (playerCount - aliveOnes.length) * 1.0); // gets faster
          playSound('point');
        }
      }
    } else {
      state.bombTimer -= dt;
      if (state.bombTimer <= 0) {
        // EXPLODE!
        const carrier = state.players[state.bombCarrier];
        if (carrier && carrier.alive) {
          carrier.alive = false;
          playSound('explosion');
          // particles
          for (let k = 0; k < 25; k++) {
            state.particles.push({
              x: carrier.x,
              y: carrier.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#ef4444',
              alpha: 1,
              size: Math.random() * 4 + 2,
              life: 0.8,
            });
          }
          // Set delay before next round
          state.roundResetTimer = 2.0;
        }
      }
    }

    // Update & Draw Particles
    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life * 2);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    state.particles = state.particles.filter((p: any) => p.life > 0);

    // Update & Draw Players
    state.players.forEach((p: any) => {
      if (!p.alive) return;

      // Friction
      p.vx *= 0.94;
      p.vy *= 0.94;

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wall Bounce
      const margin = p.radius + 5;
      if (p.x < margin) { p.x = margin; p.vx *= -1; playSound('bounce'); }
      if (p.x > width - margin) { p.x = width - margin; p.vx *= -1; playSound('bounce'); }
      if (p.y < margin) { p.y = margin; p.vy *= -1; playSound('bounce'); }
      if (p.y > height - margin) { p.y = height - margin; p.vy *= -1; playSound('bounce'); }

      // Face pointer rotates or CPU bot AI driving
      if (playerCount === 1 && p.id > 0) {
        const isCarrier = (state.bombCarrier === p.id);
        if (isCarrier) {
          // CHASE closest alive player
          let target = { x: width / 2, y: height / 2 };
          let minDist = 9999;
          state.players.forEach((other: any) => {
            if (other.id !== p.id && other.alive) {
              const dx = other.x - p.x;
              const dy = other.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minDist) {
                minDist = dist;
                target = { x: other.x, y: other.y };
              }
            }
          });
          p.angle = Math.atan2(target.y - p.y, target.x - p.x);
        } else {
          // RUN AWAY from the carrier
          const carrier = state.players[state.bombCarrier];
          if (carrier && carrier.alive) {
            // Point away from the carrier
            p.angle = Math.atan2(p.y - carrier.y, p.x - carrier.x);
          } else {
            p.angle = (p.angle || 0) + 0.06;
          }
        }

        // Thrust periodically
        if (Math.random() < 0.05) {
          const force = 3.5;
          p.vx += Math.cos(p.angle) * force;
          p.vy += Math.sin(p.angle) * force;
          // sparks
          for (let i = 0; i < 3; i++) {
            state.particles.push({
              x: p.x - Math.cos(p.angle) * p.radius,
              y: p.y - Math.sin(p.angle) * p.radius,
              vx: -Math.cos(p.angle) * 1 + (Math.random() - 0.5),
              vy: -Math.sin(p.angle) * 1 + (Math.random() - 0.5),
              color: p.color,
              alpha: 1,
              size: Math.random() * 2 + 1,
              life: 0.3,
            });
          }
        }
      } else {
        p.angle = (p.angle || 0) + 0.06;
      }

      // Draw pointer indicator
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20);
      ctx.stroke();

      // Draw player disc
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw inside accent
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius - 3, 0, Math.PI * 2);
      ctx.fill();

      // If carrier, draw flashing bomb icon or red glow
      if (state.bombCarrier === p.id && state.roundResetTimer <= 0) {
        const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', p.x, p.y - 18);
      }
    });

    // Handle collisions (for bouncing and transferring the bomb!)
    for (let i = 0; i < state.players.length; i++) {
      const p1 = state.players[i];
      if (!p1.alive) continue;
      for (let j = i + 1; j < state.players.length; j++) {
        const p2 = state.players[j];
        if (!p2.alive) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist) {
          // Bounce off
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          p1.x -= nx * overlap * 0.5;
          p1.y -= ny * overlap * 0.5;

          const rvx = p2.vx - p1.vx;
          const rvy = p2.vy - p1.vy;
          const velNormal = rvx * nx + rvy * ny;

          if (velNormal < 0) {
            const restitution = 1.3; // extra bouncy!
            const impulse = -(1 + restitution) * velNormal;
            p1.vx -= impulse * nx * 0.5;
            p1.vy -= impulse * ny * 0.5;
            p2.vx += impulse * nx * 0.5;
            p2.vy += impulse * ny * 0.5;
            playSound('laser');

            // Transfer bomb!
            if (state.roundResetTimer <= 0) {
              if (state.bombCarrier === p1.id) {
                state.bombCarrier = p2.id;
                playSound('explosion');
                createSparks(p2.x, p2.y, '#ef4444');
              } else if (state.bombCarrier === p2.id) {
                state.bombCarrier = p1.id;
                playSound('explosion');
                createSparks(p1.x, p1.y, '#ef4444');
              }
            }
          }
        }
      }
    }

    // Draw HUD / Timer inside canvas
    if (state.roundResetTimer <= 0) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BOM MELETUP DALAM: ${state.bombTimer.toFixed(1)}s`, width / 2, 25);
    } else {
      ctx.fillStyle = '#ffea00';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ROUND SETERUSNYA BERSEDIA...`, width / 2, 25);
    }

    // Label remaining players
    state.players.forEach((p: any) => {
      if (!p.alive) return;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`P${p.id + 1}`, p.x, p.y + p.radius + 12);
    });

    // 1 player survival timer scoring
    if (playerCount === 1) {
      const alivePlayers = state.players.filter((p: any) => p.alive);
      if (!state.players[0].alive) {
        // Human died
        setGameStatus('GAME_OVER');
        playSound('gameover');
        saveHighScore(score);
      } else if (alivePlayers.length === 1 && alivePlayers[0].id === 0) {
        // Player wins!
        setMultiplayerWinner(0);
        setGameStatus('GAME_OVER');
        playSound('victory');
        saveHighScore(score + 1000);
      } else {
        // Human still alive
        setScore(prev => prev + 1);
      }
    }
  };


  // ==========================================
  // GAME 21: PAC GRID (1 Player Canvas)
  // ==========================================
  const startGridChase = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 400;
    const height = canvas ? canvas.height : 320;

    // Define a simple neon grid maze (1 = wall, 0 = pellet)
    const maze = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1],
      [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const rows = maze.length;
    const cols = maze[0].length;

    // Put pellets in all 0 positions
    const pellets = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (maze[r][c] === 0) {
          pellets.push({ r, c, active: true });
        }
      }
    }

    stateRef.current = {
      maze,
      rows,
      cols,
      pellets,
      player: {
        r: 1,
        c: 1,
        x: 0,
        y: 0,
        targetR: 1,
        targetC: 1,
        progress: 0,
        dir: 'right',
        nextDir: 'right',
        speed: 3.5,
      },
      ghosts: [
        { r: 9, c: 1, targetR: 9, targetC: 1, progress: 0, color: '#ef4444', speed: 2.2 },
        { r: 9, c: 14, targetR: 9, targetC: 14, progress: 0, color: '#ff007f', speed: 1.8 }
      ],
      particles: [],
      lastTime: Date.now(),
    };
  };

  const drawAndUpdateGridChase = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state || !state.player) return;

    const now = Date.now();
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    // Background
    ctx.fillStyle = '#030206';
    ctx.fillRect(0, 0, width, height);

    const cellW = width / state.cols;
    const cellH = height / state.rows;

    // Draw Maze Walls
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (state.maze[r][c] === 1) {
          ctx.fillStyle = '#0b0c16';
          ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
          ctx.strokeStyle = '#00f0ff';
          ctx.strokeRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
        }
      }
    }

    // Draw Pellets
    state.pellets.forEach((p: any) => {
      if (!p.active) return;
      ctx.fillStyle = '#ffea00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffea00';
      ctx.beginPath();
      ctx.arc((p.c + 0.5) * cellW, (p.r + 0.5) * cellH, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Update Particles
    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    state.particles = state.particles.filter((p: any) => p.life > 0);

    // Player Direction Input
    const p = state.player;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) p.nextDir = 'left';
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) p.nextDir = 'right';
    if (keysPressed.current['arrowup'] || keysPressed.current['w']) p.nextDir = 'up';
    if (keysPressed.current['arrowdown'] || keysPressed.current['s']) p.nextDir = 'down';

    // Move player between grid cells
    if (p.r === p.targetR && p.c === p.targetC) {
      let dr = 0, dc = 0;
      if (p.nextDir === 'left') dc = -1;
      else if (p.nextDir === 'right') dc = 1;
      else if (p.nextDir === 'up') dr = -1;
      else if (p.nextDir === 'down') dr = 1;

      const nr = p.r + dr;
      const nc = p.c + dc;
      if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols && state.maze[nr][nc] === 0) {
        p.targetR = nr;
        p.targetC = nc;
        p.dir = p.nextDir;
        p.progress = 0;
      } else {
        let cdr = 0, cdc = 0;
        if (p.dir === 'left') cdc = -1;
        else if (p.dir === 'right') cdc = 1;
        else if (p.dir === 'up') cdr = -1;
        else if (p.dir === 'down') cdr = 1;

        const cnr = p.r + cdr;
        const cnc = p.c + cdc;
        if (cnr >= 0 && cnr < state.rows && cnc >= 0 && cnc < state.cols && state.maze[cnr][cnc] === 0) {
          p.targetR = cnr;
          p.targetC = cnc;
          p.progress = 0;
        }
      }
    }

    if (p.r !== p.targetR || p.c !== p.targetC) {
      p.progress += dt * p.speed;
      if (p.progress >= 1) {
        p.r = p.targetR;
        p.c = p.targetC;
        p.progress = 0;

        // Eat pellet
        const pellet = state.pellets.find((pel: any) => pel.r === p.r && pel.c === p.c && pel.active);
        if (pellet) {
          pellet.active = false;
          setScore(prev => prev + 10);
          playSound('point');

          // Spawn spark particles
          for (let i = 0; i < 4; i++) {
            state.particles.push({
              x: (p.c + 0.5) * cellW,
              y: (p.r + 0.5) * cellH,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              color: '#ffea00',
              size: Math.random() * 2 + 1,
              life: 0.3,
            });
          }

          // Check if all eaten
          const activePellets = state.pellets.filter((pel: any) => pel.active);
          if (activePellets.length === 0) {
            playSound('victory');
            state.pellets.forEach((pel: any) => pel.active = true);
            p.speed += 0.5;
          }
        }
      }
    }

    const lerpX = (p.c + (p.targetC - p.c) * p.progress) * cellW + cellW / 2;
    const lerpY = (p.r + (p.targetR - p.r) * p.progress) * cellH + cellH / 2;
    p.x = lerpX;
    p.y = lerpY;

    // Draw Pac (Cyan open mouth)
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    let mouthAngle = 0.2 * Math.sin(Date.now() / 80) + 0.2;
    let startA = mouthAngle;
    let endA = Math.PI * 2 - mouthAngle;
    if (p.dir === 'left') { startA += Math.PI; endA += Math.PI; }
    else if (p.dir === 'up') { startA += Math.PI * 1.5; endA += Math.PI * 1.5; }
    else if (p.dir === 'down') { startA += Math.PI * 0.5; endA += Math.PI * 0.5; }

    ctx.arc(p.x, p.y, Math.min(cellW, cellH) * 0.45, startA, endA);
    ctx.lineTo(p.x, p.y);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ghosts update
    state.ghosts.forEach((g: any, idx: number) => {
      if (g.r === g.targetR && g.c === g.targetC) {
        const directions = [];
        if (p.r < g.r) directions.push({ dr: -1, dc: 0, dir: 'up' });
        if (p.r > g.r) directions.push({ dr: 1, dc: 0, dir: 'down' });
        if (p.c < g.c) directions.push({ dr: 0, dc: -1, dir: 'left' });
        if (p.c > g.c) directions.push({ dr: 0, dc: 1, dir: 'right' });

        const otherDirs = [
          { dr: -1, dc: 0, dir: 'up' },
          { dr: 1, dc: 0, dir: 'down' },
          { dr: 0, dc: -1, dir: 'left' },
          { dr: 0, dc: 1, dir: 'right' }
        ];
        const chosen = directions.concat(otherDirs.filter(od => !directions.some(d => d.dir === od.dir)));

        for (let d of chosen) {
          const nr = g.r + d.dr;
          const nc = g.c + d.dc;
          if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols && state.maze[nr][nc] === 0) {
            g.targetR = nr;
            g.targetC = nc;
            g.progress = 0;
            break;
          }
        }
      }

      if (g.r !== g.targetR || g.c !== g.targetC) {
        g.progress += dt * g.speed;
        if (g.progress >= 1) {
          g.r = g.targetR;
          g.c = g.targetC;
          g.progress = 0;
        }
      }

      const gx = (g.c + (g.targetC - g.c) * g.progress) * cellW + cellW / 2;
      const gy = (g.r + (g.targetR - g.r) * g.progress) * cellH + cellH / 2;

      // Draw Ghost
      ctx.fillStyle = g.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = g.color;
      ctx.beginPath();
      ctx.arc(gx, gy, Math.min(cellW, cellH) * 0.45, Math.PI, 0, false);
      ctx.lineTo(gx + Math.min(cellW, cellH) * 0.45, gy + Math.min(cellW, cellH) * 0.45);
      ctx.lineTo(gx + Math.min(cellW, cellH) * 0.2, gy + Math.min(cellW, cellH) * 0.3);
      ctx.lineTo(gx, gy + Math.min(cellW, cellH) * 0.45);
      ctx.lineTo(gx - Math.min(cellW, cellH) * 0.2, gy + Math.min(cellW, cellH) * 0.3);
      ctx.lineTo(gx - Math.min(cellW, cellH) * 0.45, gy + Math.min(cellW, cellH) * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(gx - 4, gy - 2, 3, 0, Math.PI * 2);
      ctx.arc(gx + 4, gy - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(gx - 4, gy - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(gx + 4, gy - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Check player collision
      const dx = lerpX - gx;
      const dy = lerpY - gy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < Math.min(cellW, cellH) * 0.6) {
        playSound('explosion');
        setGameStatus('GAME_OVER');
        saveHighScore(score);
      }
    });
  };


  // ==========================================
  // GAME 22: FLAPPY NEON (1 Player Canvas)
  // ==========================================
  const startFlappyNeon = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 400;
    const height = canvas ? canvas.height : 320;

    stateRef.current = {
      player: {
        x: width * 0.25,
        y: height / 2,
        vy: 0,
        radius: 8,
        gravity: 360,
        lift: -150,
      },
      pillars: [],
      particles: [],
      spawnTimer: 0,
      spawnInterval: 2.2,
      lastTime: Date.now(),
    };
  };

  const handleFlappyFlap = () => {
    const state = stateRef.current;
    if (!state || !state.player || gameStatus !== 'PLAYING') return;
    state.player.vy = state.player.lift;
    playSound('bounce');
    
    // Spawn thrust particles
    for (let i = 0; i < 5; i++) {
      state.particles.push({
        x: state.player.x - 5,
        y: state.player.y,
        vx: -2 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 3,
        color: '#ffea00',
        size: Math.random() * 2 + 1,
        life: 0.4,
      });
    }
  };

  const drawAndUpdateFlappyNeon = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state || !state.player) return;

    const now = Date.now();
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    // Listen for inputs
    if (keysPressed.current[' '] || keysPressed.current['arrowup']) {
      handleFlappyFlap();
      keysPressed.current[' '] = false;
      keysPressed.current['arrowup'] = false;
    }

    // Background
    ctx.fillStyle = '#02040c';
    ctx.fillRect(0, 0, width, height);

    // Draw grid background
    ctx.strokeStyle = 'rgba(238, 238, 238, 0.02)';
    ctx.lineWidth = 1;
    for (let x = (Date.now() / 20) % 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(width - x, 0);
      ctx.lineTo(width - x, height);
      ctx.stroke();
    }

    // Update Player
    const p = state.player;
    p.vy += p.gravity * dt;
    p.y += p.vy * dt;

    // Boundary checks
    if (p.y - p.radius < 0 || p.y + p.radius > height) {
      playSound('explosion');
      setGameStatus('GAME_OVER');
      saveHighScore(score);
      return;
    }

    // Draw particles
    state.particles.forEach((prt: any) => {
      prt.x += prt.vx;
      prt.y += prt.vy;
      prt.life -= dt;
      ctx.fillStyle = prt.color;
      ctx.globalAlpha = Math.max(0, prt.life * 2);
      ctx.beginPath();
      ctx.arc(prt.x, prt.y, prt.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    state.particles = state.particles.filter((prt: any) => prt.life > 0);

    // Spawn Pillars
    state.spawnTimer += dt;
    if (state.spawnTimer >= state.spawnInterval) {
      state.spawnTimer = 0;
      const gapHeight = 85;
      const minPillarHeight = 40;
      const maxPillarHeight = height - gapHeight - minPillarHeight;
      const topHeight = minPillarHeight + Math.random() * (maxPillarHeight - minPillarHeight);
      state.pillars.push({
        x: width + 40,
        topHeight,
        bottomHeight: height - topHeight - gapHeight,
        gapHeight,
        width: 32,
        passed: false,
        speed: 105,
      });
    }

    // Update & Draw Pillars
    state.pillars.forEach((pil: any) => {
      pil.x -= pil.speed * dt;

      // Collision checks
      const hitTop = p.x + p.radius > pil.x && p.x - p.radius < pil.x + pil.width && p.y - p.radius < pil.topHeight;
      const hitBottom = p.x + p.radius > pil.x && p.x - p.radius < pil.x + pil.width && p.y + p.radius > height - pil.bottomHeight;
      if (hitTop || hitBottom) {
        playSound('explosion');
        setGameStatus('GAME_OVER');
        saveHighScore(score);
        return;
      }

      // Check passed
      if (!pil.passed && pil.x + pil.width < p.x) {
        pil.passed = true;
        setScore(prev => prev + 100);
        playSound('point');
      }

      // Draw Top Pillar
      ctx.save();
      ctx.strokeStyle = '#ffea00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffea00';
      ctx.fillStyle = '#060a16';
      ctx.lineWidth = 2.5;

      ctx.fillRect(pil.x, 0, pil.width, pil.topHeight);
      ctx.strokeRect(pil.x, -5, pil.width, pil.topHeight + 5);

      ctx.fillRect(pil.x, height - pil.bottomHeight, pil.width, pil.bottomHeight);
      ctx.strokeRect(pil.x, height - pil.bottomHeight, pil.width, pil.bottomHeight + 5);
      ctx.restore();
    });

    state.pillars = state.pillars.filter((pil: any) => pil.x + pil.width > -50);

    // Draw Player Jet
    ctx.save();
    ctx.translate(p.x, p.y);
    const angle = Math.max(-0.4, Math.min(0.6, p.vy / 200));
    ctx.rotate(angle);

    ctx.fillStyle = '#ffea00';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffea00';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };


  // ==========================================
  // GAME 23: METEOR STORM (1 Player Canvas)
  // ==========================================
  const startMeteorStorm = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 400;
    const height = canvas ? canvas.height : 320;

    stateRef.current = {
      player: {
        x: width / 2,
        y: height / 2,
        angle: 0,
        radius: 10,
        cooldown: 0,
      },
      meteors: [],
      lasers: [],
      particles: [],
      spawnTimer: 0,
      spawnInterval: 1.5,
      lastTime: Date.now(),
    };
  };

  const handleMeteorShoot = () => {
    const state = stateRef.current;
    if (!state || !state.player || gameStatus !== 'PLAYING') return;
    const p = state.player;
    if (p.cooldown > 0) return;

    p.cooldown = 0.25;
    playSound('laser');

    const speed = 250;
    state.lasers.push({
      x: p.x + Math.cos(p.angle) * 12,
      y: p.y + Math.sin(p.angle) * 12,
      vx: Math.cos(p.angle) * speed,
      vy: Math.sin(p.angle) * speed,
      size: 3,
      life: 1.5,
    });
  };

  const drawAndUpdateMeteorStorm = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state || !state.player) return;

    const now = Date.now();
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    // Listen for inputs
    const p = state.player;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
      p.angle -= 4.0 * dt;
    }
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
      p.angle += 4.0 * dt;
    }
    if (keysPressed.current[' '] || keysPressed.current['arrowup'] || keysPressed.current['w']) {
      handleMeteorShoot();
      if (keysPressed.current[' ']) keysPressed.current[' '] = false;
    }

    if (p.cooldown > 0) p.cooldown -= dt;

    // Background
    ctx.fillStyle = '#030208';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 15; i++) {
      const rx = (i * 1234 + Date.now() / 20) % width;
      const ry = (i * 5678) % height;
      ctx.fillRect(rx, ry, 1, 1);
    }

    // Particles
    state.particles.forEach((prt: any) => {
      prt.x += prt.vx * dt;
      prt.y += prt.vy * dt;
      prt.life -= dt;
      ctx.fillStyle = prt.color;
      ctx.globalAlpha = Math.max(0, prt.life * 2);
      ctx.beginPath();
      ctx.arc(prt.x, prt.y, prt.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    state.particles = state.particles.filter((prt: any) => prt.life > 0);

    // Lasers
    state.lasers.forEach((laser: any) => {
      laser.x += laser.vx * dt;
      laser.y += laser.vy * dt;
      laser.life -= dt;

      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(laser.x - laser.vx * 0.05, laser.y - laser.vy * 0.05);
      ctx.stroke();
      ctx.restore();
    });
    state.lasers = state.lasers.filter((l: any) => l.life > 0);

    // Spawn Meteors
    state.spawnTimer += dt;
    if (state.spawnTimer >= state.spawnInterval) {
      state.spawnTimer = 0;
      let mx = 0, my = 0;
      if (Math.random() < 0.5) {
        mx = Math.random() < 0.5 ? -15 : width + 15;
        my = Math.random() * height;
      } else {
        mx = Math.random() * width;
        my = Math.random() < 0.5 ? -15 : height + 15;
      }

      const angleToPlayer = Math.atan2(p.y - my, p.x - mx) + (Math.random() - 0.5) * 0.5;
      const speed = 40 + Math.random() * 60 + (score / 20);
      const size = 12 + Math.random() * 12;

      state.meteors.push({
        x: mx,
        y: my,
        vx: Math.cos(angleToPlayer) * speed,
        vy: Math.sin(angleToPlayer) * speed,
        radius: size,
        color: '#7000ff',
      });
    }

    // Update & Draw Meteors
    state.meteors.forEach((m: any, mIdx: number) => {
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      ctx.save();
      ctx.strokeStyle = '#7000ff';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#7000ff';
      ctx.fillStyle = '#06030c';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const rad = m.radius * (0.8 + 0.3 * Math.sin(mIdx + i));
        const px = m.x + Math.cos(angle) * rad;
        const py = m.y + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Check player collision
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < m.radius + p.radius - 2) {
        playSound('explosion');
        setGameStatus('GAME_OVER');
        saveHighScore(score);
        return;
      }

      // Laser collision
      state.lasers.forEach((laser: any) => {
        const ldx = m.x - laser.x;
        const ldy = m.y - laser.y;
        const ldist = Math.sqrt(ldx * ldx + ldy * ldy);
        if (ldist < m.radius + 3) {
          laser.life = 0;
          m.life = 0;
          playSound('explosion');
          setScore(prev => prev + (m.radius > 18 ? 150 : 250));

          for (let i = 0; i < 10; i++) {
            state.particles.push({
              x: m.x,
              y: m.y,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120,
              color: '#7000ff',
              size: Math.random() * 3 + 1,
              life: 0.5,
            });
          }
        }
      });
    });

    state.meteors = state.meteors.filter((m: any) => m.life !== 0 && m.x > -50 && m.x < width + 50 && m.y > -50 && m.y < height + 50);

    // Draw Ship
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#02040b';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };


  // ==========================================
  // GAME 23: TUG OF WAR (1-5 Players Canvas)
  // ==========================================
  const startTugOfWar = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setMultiplayerWinner(null);

    stateRef.current = {
      flagPos: 0.5,
      particles: [],
      cpuPullTimer: 0,
      lastPull: Date.now()
    };
  };

  const drawAndUpdateTugOfWar = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.25, 0); ctx.lineTo(width * 0.25, height);
    ctx.moveTo(width * 0.75, 0); ctx.lineTo(width * 0.75, height);
    ctx.stroke();

    let leftPull = 0;
    let rightPull = 0;

    if (playerCount === 1) {
      if (keysPressed.current[playerKeys[0]]) {
        keysPressed.current[playerKeys[0]] = false;
        leftPull += 0.025;
        playSound('bounce');
      }
      const now = Date.now();
      if (now - state.cpuPullTimer > 150) {
        state.cpuPullTimer = now;
        rightPull += 0.015 + Math.random() * 0.018;
      }
    } else {
      [0, 2, 4].forEach(idx => {
        if (idx < playerCount && keysPressed.current[playerKeys[idx]]) {
          keysPressed.current[playerKeys[idx]] = false;
          leftPull += 0.022;
          playSound('bounce');
        }
      });
      [1, 3].forEach(idx => {
        if (idx < playerCount && keysPressed.current[playerKeys[idx]]) {
          keysPressed.current[playerKeys[idx]] = false;
          rightPull += 0.022;
          playSound('bounce');
        }
      });
    }

    state.flagPos += (rightPull - leftPull);
    state.flagPos = Math.max(0.1, Math.min(0.9, state.flagPos));

    if (leftPull > 0 || rightPull > 0) {
      for (let i = 0; i < 3; i++) {
        state.particles.push({
          x: width * state.flagPos,
          y: height / 2 + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          color: leftPull > 0 ? '#ff007f' : '#00f0ff',
          life: 0.5
        });
      }
    }

    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.016;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    state.particles = state.particles.filter((p: any) => p.life > 0);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(30, height / 2);
    ctx.lineTo(width - 30, height / 2);
    ctx.stroke();

    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, height / 2);
    ctx.lineTo(width - 30, height / 2);
    ctx.stroke();

    ctx.fillStyle = '#ff007f33';
    ctx.fillRect(0, 0, width * 0.15, height);
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(width * 0.15, 0, 4, height);

    ctx.fillStyle = '#00f0ff33';
    ctx.fillRect(width * 0.85, 0, width * 0.15, height);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(width * 0.85 - 4, 0, 4, height);

    const fx = width * state.flagPos;
    ctx.fillStyle = '#ffea00';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffea00';
    ctx.beginPath();
    ctx.moveTo(fx, height / 2 - 12);
    ctx.lineTo(fx + 10, height / 2);
    ctx.lineTo(fx, height / 2 + 12);
    ctx.lineTo(fx - 10, height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff007f';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(playerCount === 1 ? 'PEMAIN (KIRI)' : 'KUMPULAN PINK', 10, 20);

    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'right';
    ctx.fillText(playerCount === 1 ? 'CPU (KANAN)' : 'KUMPULAN CYAN', width - 10, 20);

    if (state.flagPos <= 0.15) {
      playSound('victory');
      setMultiplayerWinner(0);
      setGameStatus('GAME_OVER');
      saveHighScore(1000);
    } else if (state.flagPos >= 0.85) {
      playSound('victory');
      setMultiplayerWinner(1);
      setGameStatus('GAME_OVER');
      saveHighScore(500);
    }
  };

  // ==========================================
  // GAME 24: NEON TANK BATTLE (1-5 Players)
  // ==========================================
  const startTankNeon = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setMultiplayerWinner(null);

    const initialTanks = [];
    const colors = ['#ff007f', '#00f0ff', '#ffea00', '#7000ff', '#00ff66'];

    for (let i = 0; i < playerCount; i++) {
      initialTanks.push({
        id: i,
        x: 40 + i * 50,
        y: 80 + i * 30,
        angle: Math.random() * Math.PI * 2,
        speed: 1.5,
        color: colors[i],
        bullets: [],
        alive: true,
        lastShot: 0
      });
    }

    if (playerCount === 1) {
      for (let i = 0; i < 3; i++) {
        initialTanks.push({
          id: 10 + i,
          x: 200 + Math.random() * 100,
          y: 60 + Math.random() * 120,
          angle: Math.random() * Math.PI * 2,
          speed: 1.0,
          color: '#ffffff',
          bullets: [],
          alive: true,
          isAI: true,
          lastShot: 0
        });
      }
    }

    stateRef.current = {
      tanks: initialTanks,
      particles: [],
      lastTick: Date.now()
    };
  };

  const drawAndUpdateTankNeon = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    const dt = 0.016;

    ctx.fillStyle = '#050409';
    ctx.fillRect(0, 0, width, height);

    const obstacles = [
      { x: width * 0.3, y: height * 0.3, w: 20, h: height * 0.4 },
      { x: width * 0.65, y: height * 0.3, w: 20, h: height * 0.4 }
    ];

    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    });

    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    state.particles = state.particles.filter((p: any) => p.life > 0);

    state.tanks.forEach((tank: any) => {
      if (!tank.alive) return;

      if (!tank.isAI) {
        const key = playerKeys[tank.id];
        if (keysPressed.current[key]) {
          keysPressed.current[key] = false;
          const now = Date.now();
          if (now - tank.lastShot > 400) {
            tank.lastShot = now;
            playSound('laser');
            tank.bullets.push({
              x: tank.x + Math.cos(tank.angle) * 12,
              y: tank.y + Math.sin(tank.angle) * 12,
              vx: Math.cos(tank.angle) * 4.5,
              vy: Math.sin(tank.angle) * 4.5,
              life: 1.5
            });
            tank.x -= Math.cos(tank.angle) * 6;
            tank.y -= Math.sin(tank.angle) * 6;
          }
        }
        tank.angle += 0.04;
      } else {
        tank.angle += 0.02;
        const now = Date.now();
        if (now - tank.lastShot > 1800 + Math.random() * 1000) {
          tank.lastShot = now;
          tank.bullets.push({
            x: tank.x + Math.cos(tank.angle) * 12,
            y: tank.y + Math.sin(tank.angle) * 12,
            vx: Math.cos(tank.angle) * 3,
            vy: Math.sin(tank.angle) * 3,
            life: 2.0
          });
        }
        tank.x += Math.cos(tank.angle) * tank.speed;
        tank.y += Math.sin(tank.angle) * tank.speed;
      }

      tank.x = Math.max(15, Math.min(width - 15, tank.x));
      tank.y = Math.max(15, Math.min(height - 15, tank.y));

      obstacles.forEach(obs => {
        if (tank.x > obs.x - 10 && tank.x < obs.x + obs.w + 10 &&
            tank.y > obs.y - 10 && tank.y < obs.y + obs.h + 10) {
          tank.angle += Math.PI;
          tank.x += Math.cos(tank.angle) * 10;
          tank.y += Math.sin(tank.angle) * 10;
        }
      });

      tank.bullets.forEach((bullet: any, bIdx: number) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life -= dt;

        ctx.fillStyle = tank.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = tank.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        obstacles.forEach(obs => {
          if (bullet.x > obs.x && bullet.x < obs.x + obs.w &&
              bullet.y > obs.y && bullet.y < obs.y + obs.h) {
            bullet.life = 0;
          }
        });

        state.tanks.forEach((otherTank: any) => {
          if (!otherTank.alive || otherTank.id === tank.id) return;

          const dx = bullet.x - otherTank.x;
          const dy = bullet.y - otherTank.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 12) {
            bullet.life = 0;
            otherTank.alive = false;
            playSound('explosion');

            for (let i = 0; i < 15; i++) {
              state.particles.push({
                x: otherTank.x,
                y: otherTank.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: otherTank.color,
                size: Math.random() * 3 + 1,
                life: 0.6
              });
            }

            if (!otherTank.isAI && otherTank.id === 0) {
              if (playerCount === 1) {
                setGameStatus('GAME_OVER');
                saveHighScore(score);
              }
            } else if (otherTank.isAI) {
              setScore(s => s + 200);
            }
          }
        });
      });
      tank.bullets = tank.bullets.filter((b: any) => b.life > 0);

      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.rotate(tank.angle);

      ctx.fillStyle = tank.color;
      ctx.fillRect(-10, -8, 20, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = tank.color;
      ctx.fillRect(0, -2, 14, 4);

      ctx.restore();
    });

    if (playerCount > 1) {
      const remainingPlayers = state.tanks.filter((t: any) => !t.isAI && t.alive);
      if (remainingPlayers.length <= 1) {
        if (remainingPlayers.length === 1) {
          setMultiplayerWinner(remainingPlayers[0].id);
        }
        setGameStatus('GAME_OVER');
        playSound('victory');
      }
    } else {
      const remainingAI = state.tanks.filter((t: any) => t.isAI && t.alive);
      if (remainingAI.length === 0) {
        playSound('victory');
        setGameStatus('GAME_OVER');
        saveHighScore(score + 1000);
      }
    }
  };

  // ==========================================
  // GAME 25: NEON PAINT ARENA (1-5 Players)
  // ==========================================
  const startPaintArena = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setMultiplayerWinner(null);

    const initialPainters = [];
    const colors = ['#ff007f', '#00f0ff', '#ffea00', '#7000ff', '#00ff66'];

    for (let i = 0; i < playerCount; i++) {
      initialPainters.push({
        id: i,
        x: 1,
        y: 1 + i * 2,
        dx: 1,
        dy: 0,
        color: colors[i],
        score: 0
      });
    }

    if (playerCount === 1) {
      for (let i = 0; i < 3; i++) {
        initialPainters.push({
          id: 10 + i,
          x: 8,
          y: 2 + i * 2,
          dx: -1,
          dy: 0,
          color: colors[i + 1],
          isAI: true,
          score: 0
        });
      }
    }

    const paintGrid = Array(10).fill(null).map(() => Array(10).fill('#18181b'));

    stateRef.current = {
      painters: initialPainters,
      paintGrid,
      timeLeft: 15.0,
      lastTick: Date.now(),
      lastMove: Date.now()
    };
  };

  const drawAndUpdatePaintArena = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    ctx.fillStyle = '#090810';
    ctx.fillRect(0, 0, width, height);

    const now = Date.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      setGameStatus('GAME_OVER');
      playSound('victory');

      let maxTiles = -1;
      let winnerId = 0;
      state.painters.forEach((p: any) => {
        if (p.score > maxTiles) {
          maxTiles = p.score;
          winnerId = p.id;
        }
      });
      if (winnerId >= 10) setMultiplayerWinner(0);
      else setMultiplayerWinner(winnerId);
      
      saveHighScore(maxTiles * 100);
      return;
    }

    const cols = 10, rows = 10;
    const cw = width / cols;
    const ch = (height - 30) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellColor = state.paintGrid[r][c];
        ctx.fillStyle = cellColor;
        ctx.fillRect(c * cw + 2, r * ch + 32, cw - 4, ch - 4);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cw + 1, r * ch + 31, cw - 2, ch - 2);
      }
    }

    state.painters.forEach((p: any) => {
      if (!p.isAI) {
        const key = playerKeys[p.id];
        if (keysPressed.current[key]) {
          keysPressed.current[key] = false;
          const temp = p.dx;
          p.dx = -p.dy;
          p.dy = temp;
          playSound('bounce');
        }
      } else {
        if (Math.random() < 0.1 || p.x + p.dx < 0 || p.x + p.dx >= cols || p.y + p.dy < 0 || p.y + p.dy >= rows) {
          const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
          const validDirs = dirs.filter(d => p.x + d.x >= 0 && p.x + d.x < cols && p.y + d.y >= 0 && p.y + d.y < rows);
          if (validDirs.length > 0) {
            const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
            p.dx = chosen.x;
            p.dy = chosen.y;
          }
        }
      }
    });

    if (now - state.lastMove > 220) {
      state.lastMove = now;

      state.painters.forEach((p: any) => {
        p.x = (p.x + p.dx + cols) % cols;
        p.y = (p.y + p.dy + rows) % rows;

        state.paintGrid[p.y][p.x] = p.color;

        let scoreCount = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (state.paintGrid[r][c] === p.color) scoreCount++;
          }
        }
        p.score = scoreCount;
        if (p.id === 0) setScore(scoreCount * 100);
      });
    }

    state.painters.forEach((p: any) => {
      const px = p.x * cw + cw / 2;
      const py = p.y * ch + ch / 2 + 30;

      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(px, py, cw * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(px, py, cw * 0.15, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`MASA TINGGAL: ${state.timeLeft.toFixed(1)}s`, width / 2, 18);
  };

  // ==========================================
  // GAME 26: NEON SPACE SOCCER (1-5 Players)
  // ==========================================
  const startSpaceSoccer = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setMultiplayerWinner(null);

    const initialPlayers = [];
    const colors = ['#ff007f', '#00f0ff', '#ffea00', '#7000ff', '#00ff66'];

    for (let i = 0; i < playerCount; i++) {
      initialPlayers.push({
        id: i,
        x: 60 + i * 30,
        y: 100 + i * 40,
        vx: 0,
        vy: 0,
        radius: 14,
        angle: Math.random() * Math.PI * 2,
        color: colors[i]
      });
    }

    if (playerCount === 1) {
      initialPlayers.push({
        id: 1,
        x: 300,
        y: 160,
        vx: 0,
        vy: 0,
        radius: 14,
        angle: Math.PI,
        color: '#00f0ff',
        isAI: true
      });
    }

    stateRef.current = {
      players: initialPlayers,
      ball: {
        x: 180,
        y: 160,
        vx: 2.0,
        vy: 1.5,
        radius: 8
      },
      p1Score: 0,
      p2Score: 0,
      particles: [],
      lastTick: Date.now()
    };
  };

  const drawAndUpdateSpaceSoccer = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    ctx.fillStyle = '#040308';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2);
    ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
    ctx.stroke();

    const ball = state.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y < 15 || ball.y > height - 15) {
      ball.vy *= -1;
      playSound('bounce');
    }

    const goalYTop = height * 0.3;
    const goalYBottom = height * 0.7;

    if (ball.x < 15) {
      if (ball.y > goalYTop && ball.y < goalYBottom) {
        state.p2Score++;
        playSound('explosion');
        ball.x = width / 2;
        ball.y = height / 2;
        ball.vx = 2.5;
        ball.vy = (Math.random() - 0.5) * 4;
      } else {
        ball.x = 15;
        ball.vx *= -1;
        playSound('bounce');
      }
    }

    if (ball.x > width - 15) {
      if (ball.y > goalYTop && ball.y < goalYBottom) {
        state.p1Score++;
        setScore(s => s + 500);
        playSound('explosion');
        ball.x = width / 2;
        ball.y = height / 2;
        ball.vx = -2.5;
        ball.vy = (Math.random() - 0.5) * 4;
      } else {
        ball.x = width - 15;
        ball.vx *= -1;
        playSound('bounce');
      }
    }

    state.players.forEach((p: any) => {
      if (!p.isAI) {
        const key = playerKeys[p.id];
        if (keysPressed.current[key]) {
          keysPressed.current[key] = false;
          p.vx = Math.cos(p.angle) * 7;
          p.vy = Math.sin(p.angle) * 7;
          playSound('bounce');
        }
        p.angle += 0.05;
      } else {
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          p.vx += (dx / dist) * 0.25;
          p.vy += (dy / dist) * 0.25;
        }
      }

      p.vx *= 0.94;
      p.vy *= 0.94;

      p.x += p.vx;
      p.y += p.vy;

      p.x = Math.max(20, Math.min(width - 20, p.x));
      p.y = Math.max(20, Math.min(height - 20, p.y));

      const bdx = ball.x - p.x;
      const bdy = ball.y - p.y;
      const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
      const bmin = p.radius + ball.radius;

      if (bdist < bmin) {
        const nx = bdx / bdist;
        const ny = bdy / bdist;
        ball.vx = nx * 5 + p.vx * 0.5;
        ball.vy = ny * 5 + p.vy * 0.5;
        playSound('point');

        for (let i = 0; i < 4; i++) {
          state.particles.push({
            x: ball.x,
            y: ball.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: p.color,
            life: 0.4
          });
        }
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.radius, 0);
      ctx.stroke();

      ctx.restore();
    });

    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, goalYTop); ctx.lineTo(10, goalYBottom);
    ctx.stroke();

    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(width - 10, goalYTop); ctx.lineTo(width - 10, goalYBottom);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.016;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    state.particles = state.particles.filter((p: any) => p.life > 0);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.p1Score} - ${state.p2Score}`, width / 2, 24);

    if (state.p1Score >= 3) {
      playSound('victory');
      setMultiplayerWinner(0);
      setGameStatus('GAME_OVER');
      saveHighScore(score);
    } else if (state.p2Score >= 3) {
      playSound('gameover');
      setMultiplayerWinner(1);
      setGameStatus('GAME_OVER');
    }
  };

  // ==========================================
  // GAME 27: NEON MINI GOLF (1 Player)
  // ==========================================
  const startNeonGolf = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      ball: {
        x: 60,
        y: 160,
        vx: 0,
        vy: 0,
        radius: 7
      },
      target: {
        x: 300,
        y: 160,
        radius: 12
      },
      strokes: 0,
      isAiming: false,
      aimX: 0,
      aimY: 0,
      aimDx: 0,
      aimDy: 0,
      aimAnchorX: 0,
      aimAnchorY: 0,
      lastTick: Date.now()
    };
  };

  const drawAndUpdateNeonGolf = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    ctx.fillStyle = '#03050c';
    ctx.fillRect(0, 0, width, height);

    const b = state.ball;

    const handleShoot = (powerX: number, powerY: number) => {
      b.vx = powerX * 0.12;
      b.vy = powerY * 0.12;
      state.strokes++;
      playSound('laser');
    };

    if (keysPressed.current[' '] && Math.abs(b.vx) < 0.1 && Math.abs(b.vy) < 0.1) {
      keysPressed.current[' '] = false;
      handleShoot(8, -5);
    }

    b.vx *= 0.98;
    b.vy *= 0.98;

    b.x += b.vx;
    b.y += b.vy;

    if (b.x < 15 || b.x > width - 15) {
      b.vx *= -1;
      b.x = b.x < 15 ? 15 : width - 15;
      playSound('bounce');
    }
    if (b.y < 15 || b.y > height - 15) {
      b.vy *= -1;
      b.y = b.y < 15 ? 15 : height - 15;
      playSound('bounce');
    }

    ctx.fillStyle = '#00ff6633';
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ff66';
    ctx.beginPath();
    ctx.arc(state.target.x, state.target.y, state.target.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(state.target.x, state.target.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(state.target.x, state.target.y - 4);
    ctx.lineTo(state.target.x, state.target.y - 20);
    ctx.lineTo(state.target.x + 8, state.target.y - 15);
    ctx.lineTo(state.target.x, state.target.y - 12);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Aim Line if dragging
    if (state.isAiming) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + state.aimDx, b.y + state.aimDy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.min(60, Math.sqrt(state.aimDx * state.aimDx + state.aimDy * state.aimDy)), 0, Math.PI * 2);
      ctx.stroke();
    }

    const dx = b.x - state.target.x;
    const dy = b.y - state.target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < state.target.radius + 2 && Math.abs(b.vx) < 1.5 && Math.abs(b.vy) < 1.5) {
      playSound('victory');
      setGameStatus('GAME_OVER');
      const golfScore = Math.max(100, 2000 - state.strokes * 300);
      setScore(golfScore);
      saveHighScore(golfScore);
    }

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`STROKES: ${state.strokes}`, 15, 20);
    ctx.textAlign = 'right';
    ctx.fillText('TARIK & LEPASKAN UNTUK SHOT / TEKAN SPACEBAR', width - 15, 20);
  };

  // ==========================================
  // GAME 28: CYBER GLITCH SWEEPER (1 Player)
  // ==========================================
  const startGlitchSweeper = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    const cols = 8, rows = 8;
    const grid = [];

    const glitchPositions = new Set();
    while (glitchPositions.size < 8) {
      const idx = Math.floor(Math.random() * (cols * rows));
      glitchPositions.add(idx);
    }

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        row.push({
          r,
          c,
          isGlitch: glitchPositions.has(idx),
          revealed: false,
          flagged: false,
          neighborGlitches: 0
        });
      }
      grid.push(row);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].isGlitch) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isGlitch) {
              count++;
            }
          }
        }
        grid[r][c].neighborGlitches = count;
      }
    }

    stateRef.current = {
      grid,
      rows,
      cols,
      cursorX: 0,
      cursorY: 0,
      lastTick: Date.now()
    };
  };

  const cascadeRevealGlitchSweeper = (r: number, c: number, state: any) => {
    const rows = state.rows;
    const cols = state.cols;
    const cell = state.grid[r][c];
    if (cell.revealed || cell.flagged || cell.isGlitch) return;

    cell.revealed = true;
    setScore(s => s + 100);

    if (cell.neighborGlitches === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            cascadeRevealGlitchSweeper(nr, nc, state);
          }
        }
      }
    }
  };

  const drawAndUpdateGlitchSweeper = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    ctx.fillStyle = '#06050a';
    ctx.fillRect(0, 0, width, height);

    const rows = state.rows;
    const cols = state.cols;
    const cw = width / cols;
    const ch = (height - 30) / rows;

    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
      keysPressed.current['arrowleft'] = false; keysPressed.current['a'] = false;
      state.cursorX = (state.cursorX + cols - 1) % cols;
      playSound('bounce');
    }
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
      keysPressed.current['arrowright'] = false; keysPressed.current['d'] = false;
      state.cursorX = (state.cursorX + 1) % cols;
      playSound('bounce');
    }
    if (keysPressed.current['arrowup'] || keysPressed.current['w']) {
      keysPressed.current['arrowup'] = false; keysPressed.current['w'] = false;
      state.cursorY = (state.cursorY + rows - 1) % rows;
      playSound('bounce');
    }
    if (keysPressed.current['arrowdown'] || keysPressed.current['s']) {
      keysPressed.current['arrowdown'] = false; keysPressed.current['s'] = false;
      state.cursorY = (state.cursorY + 1) % rows;
      playSound('bounce');
    }

    if (keysPressed.current[' ']) {
      keysPressed.current[' '] = false;
      const cell = state.grid[state.cursorY][state.cursorX];
      if (!cell.revealed && !cell.flagged) {
        if (cell.isGlitch) {
          cell.revealed = true;
          playSound('explosion');
          setGameStatus('GAME_OVER');
          saveHighScore(score);
        } else {
          playSound('point');
          cascadeRevealGlitchSweeper(state.cursorY, state.cursorX, state);

          let won = true;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (!state.grid[r][c].isGlitch && !state.grid[r][c].revealed) {
                won = false;
              }
            }
          }
          if (won) {
            playSound('victory');
            setGameStatus('GAME_OVER');
            saveHighScore(score + 1000);
          }
        }
      }
    }

    if (keysPressed.current['f'] || keysPressed.current['enter']) {
      keysPressed.current['f'] = false; keysPressed.current['enter'] = false;
      const cell = state.grid[state.cursorY][state.cursorX];
      if (!cell.revealed) {
        cell.flagged = !cell.flagged;
        playSound('bounce');
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = state.grid[r][c];
        const cx = c * cw;
        const cy = r * ch + 30;

        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);

        if (cell.revealed) {
          ctx.fillStyle = '#111019';
          ctx.fillRect(cx + 2, cy + 2, cw - 4, ch - 4);

          if (cell.isGlitch) {
            ctx.fillStyle = '#ff007f';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('👾', cx + cw / 2, cy + ch / 2 + 4);
          } else if (cell.neighborGlitches > 0) {
            const colors = ['', '#00f0ff', '#ffea00', '#ff007f', '#7000ff'];
            ctx.fillStyle = colors[Math.min(cell.neighborGlitches, 4)];
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(cell.neighborGlitches.toString(), cx + cw / 2, cy + ch / 2 + 4);
          }
        } else {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(cx + 2, cy + 2, cw - 4, ch - 4);

          if (cell.flagged) {
            ctx.fillStyle = '#ffea00';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🚩', cx + cw / 2, cy + ch / 2 + 4);
          }
        }

        if (state.cursorX === c && state.cursorY === r) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx + 2, cy + 2, cw - 4, ch - 4);
        }
      }
    }

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARROWS: GERAK | SPACE: NYAHKOD | ENTER/F: BENDERA', width / 2, 18);
  };

  // ==========================================
  // GAME 29: NEON HEX SHIELD (1 Player)
  // ==========================================
  const startHexShield = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);

    stateRef.current = {
      angle: 0,
      lasers: [],
      particles: [],
      lastSpawn: 0,
      health: 3
    };
  };

  const drawAndUpdateHexShield = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
      keysPressed.current['arrowleft'] = false; keysPressed.current['a'] = false;
      state.angle = (state.angle + 5) % 6;
      playSound('bounce');
    }
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
      keysPressed.current['arrowright'] = false; keysPressed.current['d'] = false;
      state.angle = (state.angle + 1) % 6;
      playSound('bounce');
    }

    const now = Date.now();
    if (now - state.lastSpawn > 1600) {
      state.lastSpawn = now;
      const angleDir = Math.floor(Math.random() * 6);
      const colorIdx = Math.floor(Math.random() * 3);
      const colors = ['#ff007f', '#00f0ff', '#ffea00'];

      const theta = (angleDir * Math.PI) / 3;
      const dist = 240;

      state.lasers.push({
        x: cx + Math.cos(theta) * dist,
        y: cy + Math.sin(theta) * dist,
        vx: -Math.cos(theta) * 2.2,
        vy: -Math.sin(theta) * 2.2,
        angleDir,
        color: colors[colorIdx],
        colorIdx
      });
    }

    const colors = ['#ff007f', '#00f0ff', '#ffea00', '#ff007f', '#00f0ff', '#ffea00'];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((state.angle * Math.PI) / 3);

    ctx.strokeStyle = colors[state.angle];
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = colors[state.angle];
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI / 6, Math.PI / 6);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const theta = (i * Math.PI) / 3;
      const hx = Math.cos(theta) * 16;
      const hy = Math.sin(theta) * 16;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    state.lasers.forEach((l: any, idx: number) => {
      l.x += l.vx;
      l.y += l.vy;

      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
      ctx.fill();

      const dx = l.x - cx;
      const dy = l.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 26) {
        state.lasers.splice(idx, 1);
        const diff = (l.angleDir - state.angle + 6) % 6;
        if (diff === 3) {
          playSound('point');
          setScore(s => s + 100);
        } else {
          playSound('explosion');
          state.health--;
          if (state.health <= 0) {
            setGameStatus('GAME_OVER');
            saveHighScore(score);
          }
        }
      }
    });

    ctx.fillStyle = '#ef4444';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('❤️ '.repeat(state.health), 15, 20);
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'right';
    ctx.fillText('ARROWS: PUTAR PERISAI', width - 15, 20);
  };

  // ==========================================
  // GAME 30: PIXEL TAP PAINTER (1-5 Players)
  // ==========================================
  const startPixelPainter = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setMultiplayerWinner(null);

    const initialPlayers = [];
    const colors = ['#ff007f', '#00f0ff', '#ffea00', '#7000ff', '#00ff66'];

    for (let i = 0; i < playerCount; i++) {
      initialPlayers.push({
        id: i,
        color: colors[i],
        targetColorIdx: Math.floor(Math.random() * 3),
        score: 0
      });
    }

    stateRef.current = {
      players: initialPlayers,
      currentColorIdx: 0,
      colors: ['#ff007f', '#00f0ff', '#ffea00'],
      colorNames: ['PINK', 'CYAN', 'KUNING'],
      lastCycle: Date.now(),
      timeLeft: 12.0,
      lastTick: Date.now()
    };
  };

  const drawAndUpdatePixelPainter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    const dt = 0.016;
    state.timeLeft -= dt;

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      setGameStatus('GAME_OVER');
      playSound('victory');

      let maxScore = -1;
      let winnerId = 0;
      state.players.forEach((p: any) => {
        if (p.score > maxScore) {
          maxScore = p.score;
          winnerId = p.id;
        }
      });
      setMultiplayerWinner(winnerId);
      saveHighScore(maxScore);
      return;
    }

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    const now = Date.now();
    if (now - state.lastCycle > 650) {
      state.lastCycle = now;
      state.currentColorIdx = (state.currentColorIdx + 1) % 3;
    }

    const activeColor = state.colors[state.currentColorIdx];
    ctx.fillStyle = activeColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = activeColor;
    ctx.fillRect(width / 2 - 40, height / 2 - 40, 80, 80);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(width / 2 - 42, height / 2 - 42, 84, 84);

    state.players.forEach((p: any) => {
      const key = playerKeys[p.id];
      if (keysPressed.current[key]) {
        keysPressed.current[key] = false;

        if (state.currentColorIdx === p.targetColorIdx) {
          p.score += 200;
          playSound('point');
          if (p.id === 0) setScore(s => s + 200);
          p.targetColorIdx = Math.floor(Math.random() * 3);
        } else {
          p.score = Math.max(0, p.score - 100);
          playSound('explosion');
        }
      }
    });

    const pw = width / playerCount;
    state.players.forEach((p: any, idx: number) => {
      const cx = idx * pw + pw / 2;
      const targetColor = state.colors[p.targetColorIdx];
      const targetName = state.colorNames[p.targetColorIdx];

      ctx.fillStyle = p.color;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`P${p.id + 1}: SKOR ${p.score}`, cx, height - 35);

      ctx.fillStyle = targetColor;
      ctx.fillText(`SASAR: ${targetName}`, cx, height - 20);

      ctx.fillStyle = '#52525b';
      ctx.font = '7px monospace';
      ctx.fillText(`BUTANG: ${playerKeys[p.id].toUpperCase()}`, cx, height - 8);
    });

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`MASA TINGGAL: ${state.timeLeft.toFixed(1)}s`, width / 2, 20);
  };


  // ==========================================
  // GAME 31: CYBER RUNNER (Infinite Neon Runner)
  // ==========================================
  const startCyberRunner = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    setMultiplayerWinner(null);

    stateRef.current = {
      player: {
        x: 60,
        y: 200, // Ground level
        vy: 0,
        width: 14,
        height: 24,
        isJumping: false,
        isDucking: false,
        duckTimer: 0,
        color: '#ffea00', // Neon yellow/orange
      },
      obstacles: [],
      particles: [],
      bgBuildings: [],
      groundOffset: 0,
      speed: 4.5,
      score: 0,
      lastSpawn: Date.now(),
      spawnInterval: 1400,
      lastTick: Date.now()
    };

    // Initialize parallax background buildings
    const buildings = [];
    let bx = 0;
    while (bx < 800) {
      const bWidth = Math.random() * 60 + 40;
      const bHeight = Math.random() * 120 + 50;
      buildings.push({
        x: bx,
        w: bWidth,
        h: bHeight,
        color: ['#1c1535', '#151c35', '#251535'][Math.floor(Math.random() * 3)],
        strokeColor: ['#ff007f', '#00f0ff', '#7000ff'][Math.floor(Math.random() * 3)]
      });
      bx += bWidth + Math.random() * 20;
    }
    stateRef.current.bgBuildings = buildings;
  };

  const drawAndUpdateCyberRunner = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    const dt = 0.016; // approximate delta time for animations
    state.score += 0.55;
    setScore(Math.floor(state.score));

    // Gradually ramp up speed
    state.speed += 0.0008;

    ctx.fillStyle = '#050409';
    ctx.fillRect(0, 0, width, height);

    const groundY = height - 45;

    // Draw Parallax Neon City Background
    state.bgBuildings.forEach((b: any) => {
      // scroll buildings slowly
      b.x -= state.speed * 0.15;
      if (b.x + b.w < 0) {
        // Wrap to the right
        let maxRight = 0;
        state.bgBuildings.forEach((other: any) => {
          if (other.x > maxRight) maxRight = other.x;
        });
        b.x = maxRight + b.w + Math.random() * 20;
      }

      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, groundY - b.h, b.w, b.h);

      ctx.strokeStyle = b.strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, groundY - b.h, b.w, b.h);

      // Add simple decorative windows
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      for (let wy = groundY - b.h + 10; wy < groundY - 10; wy += 25) {
        for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 15) {
          ctx.fillRect(wx, wy, 6, 10);
        }
      }
    });

    // Draw Scrolling Ground Grid
    state.groundOffset = (state.groundOffset - state.speed) % 30;
    
    // Draw solid ground neon line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Ground perspective lines / grid slices
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let x = state.groundOffset; x < width + 30; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 20, height);
      ctx.stroke();
    }

    // Draw horizontal grid lines below ground
    for (let gy = groundY + 8; gy < height; gy += 10) {
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.25 - (gy - groundY) / 100})`;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // Update Player physics
    const p = state.player;

    // Handle Controls (Keyboard & Tap)
    const upKey = keysPressed.current['arrowup'] || keysPressed.current['w'] || keysPressed.current[' '];
    const downKey = keysPressed.current['arrowdown'] || keysPressed.current['s'];

    if (upKey && !p.isJumping && !p.isDucking) {
      p.vy = -12.5;
      p.isJumping = true;
      playSound('laser');
    }

    if (downKey) {
      if (!p.isJumping) {
        p.isDucking = true;
        p.height = 14; // shrink hit box
      } else {
        // Fast fall if ducking in air!
        p.vy += 1.0;
      }
    } else {
      if (p.isDucking) {
        p.isDucking = false;
        p.height = 24; // restore height
      }
    }

    // Gravity
    p.vy += 0.65; // gravity force
    p.y += p.vy;

    // Constrain to ground
    const currentHeight = p.isDucking ? 14 : 24;
    const playerFootY = p.y + currentHeight;
    if (playerFootY >= groundY) {
      p.y = groundY - currentHeight;
      p.vy = 0;
      p.isJumping = false;
    }

    // Generate neon running trail particles
    if (!p.isJumping && Math.random() < 0.4) {
      state.particles.push({
        x: p.x,
        y: groundY - 2 - Math.random() * 4,
        vx: -state.speed * 0.4 + (Math.random() - 0.5),
        vy: -Math.random() * 1.5,
        color: p.isDucking ? '#ff007f' : '#ffea00',
        alpha: 1.0,
        size: Math.random() * 3 + 1
      });
    }

    // Update & Draw Particles
    state.particles.forEach((pt: any, idx: number) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.04;
      if (pt.alpha <= 0) {
        state.particles.splice(idx, 1);
        return;
      }
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    });
    ctx.globalAlpha = 1.0; // restore alpha

    // Spawn Obstacles
    if (Date.now() - state.lastSpawn > state.spawnInterval) {
      state.lastSpawn = Date.now();
      // randomize interval slightly
      state.spawnInterval = Math.random() * 600 + 1000 - Math.min(300, state.speed * 30);

      const type = Math.random() > 0.45 ? 'LOW' : 'HIGH';
      if (type === 'LOW') {
        // Cyber Spike/Barricade
        const obsHeight = Math.random() * 12 + 16;
        state.obstacles.push({
          x: width + 20,
          y: groundY - obsHeight,
          w: 12,
          h: obsHeight,
          type: 'LOW',
          color: '#ff007f' // Pink spike
        });
      } else {
        // Plasma Drone/Flyer
        state.obstacles.push({
          x: width + 20,
          y: groundY - 45, // Elevated flying obstacle! Player MUST duck!
          w: 14,
          h: 12,
          type: 'HIGH',
          color: '#00f0ff' // Cyan drone
        });
      }
    }

    // Update & Draw Obstacles
    state.obstacles.forEach((obs: any, idx: number) => {
      obs.x -= state.speed;

      // Draw obstacle with neon glow
      ctx.fillStyle = obs.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = obs.color;
      
      if (obs.type === 'LOW') {
        // Draw triangular spike
        ctx.beginPath();
        ctx.moveTo(obs.x, groundY);
        ctx.lineTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x + obs.w, groundY);
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw hover drone rect
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        
        // draw glowing sensor eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x + 2, obs.y + 4, 3, 3);
        ctx.fillStyle = obs.color; // restore
      }
      ctx.shadowBlur = 0; // restore shadow

      // Collide check
      const px1 = p.x;
      const px2 = p.x + p.width;
      const py1 = p.y;
      const py2 = p.y + currentHeight;

      const ox1 = obs.x;
      const ox2 = obs.x + obs.w;
      const oy1 = obs.y;
      const oy2 = obs.y + obs.h;

      // Box Collision
      if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
        // CRASH!
        playSound('explosion');
        setGameStatus('GAME_OVER');
        playSound('gameover');
        saveHighScore(Math.floor(state.score));
      }

      // Out of bounds check
      if (obs.x + obs.w < -20) {
        state.obstacles.splice(idx, 1);
        playSound('point'); // nice sound feedback for passing!
      }
    });

    // Draw Player Character (Sleek Cyber Runner Vector)
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;

    if (p.isDucking) {
      // Ducking slide pose (longer horizontally, shorter vertically)
      ctx.fillRect(p.x - 4, p.y, p.width + 6, p.height);
      // visor line
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(p.x + p.width - 2, p.y + 2, 4, 3);
    } else {
      // Standing/Running pose
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Cyber Visor glow (cool futuristic design!)
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(p.x + 4, p.y + 3, p.width - 4, 4);

      // Running leg animations (alternating leg lines!)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const runCycle = Math.floor(Date.now() / 100) % 2;
      if (p.isJumping) {
        // Bent jump legs
        ctx.moveTo(p.x + 3, p.y + p.height);
        ctx.lineTo(p.x + 1, p.y + p.height + 4);
        ctx.moveTo(p.x + 11, p.y + p.height);
        ctx.lineTo(p.x + 13, p.y + p.height + 4);
      } else {
        if (runCycle === 0) {
          ctx.moveTo(p.x + 3, p.y + p.height);
          ctx.lineTo(p.x, p.y + p.height + 6);
          ctx.moveTo(p.x + p.width - 3, p.y + p.height);
          ctx.lineTo(p.x + p.width + 2, p.y + p.height + 4);
        } else {
          ctx.moveTo(p.x + 3, p.y + p.height);
          ctx.lineTo(p.x + 5, p.y + p.height + 6);
          ctx.moveTo(p.x + p.width - 3, p.y + p.height);
          ctx.lineTo(p.x + p.width - 6, p.y + p.height + 4);
        }
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // restore

    // HUD controls overlay text
    ctx.fillStyle = '#71717a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SPACE / W / ARROW_UP: LOMPAT', 12, height - 12);
    ctx.fillText('S / ARROW_DOWN: LUNSUR / UNDUK', 12, height - 24);
  };


  // ==========================================
  // GAME 27: CYBER STACKER (NEON STACKER)
  // ==========================================
  const startNeonStacker = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    stateRef.current = {
      rows: [], // will contain { x, width }
      currentRowIndex: 0,
      currentX: 10,
      currentWidth: 120,
      currentSpeed: 4,
      direction: 1,
      cameraOffset: 0,
      flashFrames: 0,
      particles: [],
      shouldPlace: false
    };
  };

  const drawAndUpdateNeonStacker = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    // Draw background grid
    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1d1230';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const blockHeight = 18;
    const padding = 2;
    const baseRowY = height - 50;

    // Initialize first base row if empty
    if (state.rows.length === 0) {
      const initialWidth = 120;
      const initialX = (width - initialWidth) / 2;
      state.rows.push({ x: initialX, width: initialWidth });
      state.currentRowIndex = 1;
      state.currentWidth = initialWidth;
      state.currentX = 0;
    }

    // Screen flash visual effect
    if (state.flashFrames > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.flashFrames * 0.15})`;
      ctx.fillRect(0, 0, width, height);
      state.flashFrames--;
    }

    // Update Moving Block
    state.currentX += state.currentSpeed * state.direction;
    if (state.currentX + state.currentWidth > width) {
      state.currentX = width - state.currentWidth;
      state.direction = -1;
    } else if (state.currentX < 0) {
      state.currentX = 0;
      state.direction = 1;
    }

    // Capture Placement Trigger (Space, Enter or Tap/Click)
    const isPlacing = keysPressed.current[' '] || keysPressed.current['space'] || keysPressed.current['enter'] || state.shouldPlace;
    if (isPlacing) {
      keysPressed.current[' '] = false;
      keysPressed.current['space'] = false;
      keysPressed.current['enter'] = false;
      state.shouldPlace = false;

      const underRow = state.rows[state.currentRowIndex - 1];
      const left = Math.max(state.currentX, underRow.x);
      const right = Math.min(state.currentX + state.currentWidth, underRow.x + underRow.width);
      const placedWidth = right - left;

      if (placedWidth <= 0) {
        // Drop completely off -> Game Over
        playSound('explosion');
        // Spawn dropping particles
        for (let i = 0; i < 20; i++) {
          state.particles.push({
            x: state.currentX + state.currentWidth / 2,
            y: baseRowY - state.currentRowIndex * blockHeight + state.cameraOffset,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#ff007f',
            life: 30,
            maxLife: 30,
            size: Math.random() * 4 + 2
          });
        }
        setGameStatus('GAME_OVER');
        playSound('gameover');
        saveHighScore(score);
      } else {
        // Successful Placement!
        const offsetDiff = Math.abs(state.currentX - underRow.x);
        let finalX = left;

        if (offsetDiff < 5) {
          // Perfect alignment! Snap it!
          finalX = underRow.x;
          state.flashFrames = 5;
          playSound('point');
          setScore((prev) => prev + 250); // perfect bonus!

          // Perfect sparkle particles
          for (let i = 0; i < 15; i++) {
            state.particles.push({
              x: finalX + placedWidth / 2 + (Math.random() - 0.5) * placedWidth,
              y: baseRowY - state.currentRowIndex * blockHeight + state.cameraOffset,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 4 - 1,
              color: '#ffea00',
              life: 25,
              maxLife: 25,
              size: Math.random() * 3 + 2
            });
          }
        } else {
          // Ordinary placement, play bounce
          playSound('bounce');
          setScore((prev) => prev + 100);

          // Spawn slice particles on left or right depending on overhang
          const overhangLeft = state.currentX < underRow.x;
          const px = overhangLeft ? state.currentX : underRow.x + underRow.width;
          const pw = Math.abs(state.currentX - underRow.x);
          for (let i = 0; i < 8; i++) {
            state.particles.push({
              x: px + Math.random() * pw,
              y: baseRowY - state.currentRowIndex * blockHeight + state.cameraOffset,
              vx: (Math.random() - 0.5) * 4,
              vy: Math.random() * 4 + 1, // falling spark
              color: '#00f0ff',
              life: 20,
              maxLife: 20,
              size: Math.random() * 3 + 1
            });
          }
        }

        // Add to placed rows list
        state.rows.push({ x: finalX, width: placedWidth });
        state.currentRowIndex++;
        state.currentWidth = placedWidth;

        // Increase speed slightly
        state.currentSpeed = Math.min(11, 4 + state.currentRowIndex * 0.45);
        state.direction = Math.random() < 0.5 ? 1 : -1;
        state.currentX = Math.random() < 0.5 ? 0 : width - placedWidth;

        // Auto Scroll Camera view down if stack is getting high
        const stackY = baseRowY - state.currentRowIndex * blockHeight + state.cameraOffset;
        if (stackY < 120) {
          state.cameraOffset += blockHeight;
        }
      }
    }

    // Update & Draw Particles
    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // Render particle
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0; // reset
    state.particles = state.particles.filter((p: any) => p.life > 0);

    // Render Placed Rows
    state.rows.forEach((row: { x: number, width: number }, idx: number) => {
      const rowY = baseRowY - idx * blockHeight + state.cameraOffset;
      if (rowY < -20 || rowY > height + 20) return; // clip if offscreen

      // Neon color theme alternate
      const isBase = idx === 0;
      const rowColor = isBase ? '#7000ff' : (idx % 2 === 0 ? '#00f0ff' : '#ff007f');

      // Draw glowing block shadow
      ctx.shadowBlur = 8;
      ctx.shadowColor = rowColor;
      ctx.fillStyle = rowColor;
      ctx.fillRect(row.x + padding, rowY + padding, row.width - padding * 2, blockHeight - padding * 2);
      ctx.shadowBlur = 0; // restore

      // Top lighting reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(row.x + padding, rowY + padding, row.width - padding * 2, 3);
    });

    // Render Current Active Row Block (the moving target)
    if (gameStatus === 'PLAYING') {
      const movingY = baseRowY - state.currentRowIndex * blockHeight + state.cameraOffset;
      const glowColor = '#ffea00'; // energetic glowing yellow for moving block
      ctx.shadowBlur = 12;
      ctx.shadowColor = glowColor;
      ctx.fillStyle = glowColor;
      ctx.fillRect(state.currentX + padding, movingY + padding, state.currentWidth - padding * 2, blockHeight - padding * 2);
      ctx.shadowBlur = 0;

      // Gloss
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(state.currentX + padding, movingY + padding, state.currentWidth - padding * 2, 3);
    }

    // DRAW HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TINGGI: ${state.currentRowIndex - 1}`, 15, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`SKOR: ${score}`, width - 15, 25);

    // Help Text
    ctx.fillStyle = '#71717a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TEKAN SPACEBAR ATAU KETUK SKRIN UNTUK MELETAKKAN BLOK', width / 2, height - 12);
  };


  // ==========================================
  // GAME 28: NEON COPTER
  // ==========================================
  const startCopterNeon = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    stateRef.current = {
      y: 160,
      vy: 0,
      gravity: 0.16,
      thrust: -0.42,
      cavePoints: [], // will contain { x, top, bottom }
      obstacles: [],
      particles: [],
      speed: 3.2,
      lastSpawn: 0,
      distance: 0,
      shouldPlace: false
    };
  };

  const drawAndUpdateCopterNeon = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    // Draw Space grid background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#12121a';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Populate Initial Cave Points across screen if empty
    const segmentWidth = 20;
    if (state.cavePoints.length === 0) {
      const count = Math.ceil(width / segmentWidth) + 2;
      for (let i = 0; i < count; i++) {
        const x = i * segmentWidth;
        // Sane spacious boundaries initially
        state.cavePoints.push({
          x,
          top: 35 + Math.sin(i * 0.1) * 12,
          bottom: height - 35 - Math.sin(i * 0.1) * 12
        });
      }
    }

    // Scroll Cave Left
    state.distance += state.speed;
    state.cavePoints.forEach((pt: any) => {
      pt.x -= state.speed;
    });

    // Remove leftmost, generate rightmost
    if (state.cavePoints[0].x + segmentWidth < 0) {
      state.cavePoints.shift();
      // Generate new point seamlessly based on the previous last point
      const lastPt = state.cavePoints[state.cavePoints.length - 1];
      const newX = lastPt.x + segmentWidth;
      
      // Keep cave boundaries from getting too crazy (limit top/bottom wanders)
      const scale = state.distance * 0.0001; // difficulty factor
      const wander = Math.sin(state.distance * 0.005) * (25 + Math.min(25, scale * 30));
      const midPoint = (height / 2) + wander;
      const currentGap = Math.max(80, 150 - Math.min(65, scale * 40)); // gap shrinks as you go farther!
      
      const nextTop = Math.max(15, midPoint - currentGap / 2);
      const nextBottom = Math.min(height - 15, midPoint + currentGap / 2);

      state.cavePoints.push({
        x: newX,
        top: nextTop,
        bottom: nextBottom
      });

      // Spawn occasional obstacles (12% chance per new segment)
      if (Math.random() < 0.12 && Date.now() - state.lastSpawn > 1200) {
        state.obstacles.push({
          x: newX,
          y: nextTop + Math.random() * (nextBottom - nextTop - 24) + 12,
          size: Math.random() * 8 + 6,
          color: '#00f0ff',
          rot: 0,
          rotSpeed: (Math.random() - 0.5) * 0.1
        });
        state.lastSpawn = Date.now();
      }
    }

    // Apply Controls and Physics on Helicopter (Player)
    const isPressingThrust = keysPressed.current[' '] || keysPressed.current['space'] || keysPressed.current['arrowup'] || keysPressed.current['w'] || state.shouldPlace;
    if (isPressingThrust) {
      state.vy += state.thrust;
      // Spawn tiny exhaust fire particles
      state.particles.push({
        x: 55,
        y: state.y + (Math.random() - 0.5) * 6,
        vx: -Math.random() * 3 - 2,
        vy: (Math.random() - 0.5) * 1.5,
        color: '#ff007f',
        life: 15,
        maxLife: 15,
        size: Math.random() * 3 + 1
      });
    } else {
      state.vy += state.gravity;
    }

    // Cap velocity
    state.vy = Math.max(-5.5, Math.min(5.5, state.vy));
    state.y += state.vy;

    // Increment Score slowly
    setScore(Math.floor(state.distance / 12));

    // Collision Check at player position (x = 65, width ~ 18, height ~ 12)
    const playerX = 65;
    const playerRadius = 7;

    // Find closest cave segment
    const playerSegment = state.cavePoints.find((pt: any) => pt.x <= playerX && pt.x + segmentWidth >= playerX) || state.cavePoints[0];
    
    // Check Cave Wall collisions
    if (state.y - playerRadius < playerSegment.top || state.y + playerRadius > playerSegment.bottom) {
      // Boom!
      playSound('explosion');
      setGameStatus('GAME_OVER');
      playSound('gameover');
      saveHighScore(score);
    }

    // Update & Check Obstacles
    state.obstacles.forEach((obs: any, idx: number) => {
      obs.x -= state.speed;
      obs.rot += obs.rotSpeed;

      // Obstacle collision check with ship
      const dx = obs.x - playerX;
      const dy = obs.y - state.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < obs.size + playerRadius) {
        // Boom!
        playSound('explosion');
        setGameStatus('GAME_OVER');
        playSound('gameover');
        saveHighScore(score);
      }

      // Render Obstacle
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.rot);
      ctx.shadowBlur = 6;
      ctx.shadowColor = obs.color;
      ctx.fillStyle = obs.color;
      ctx.fillRect(-obs.size, -obs.size, obs.size * 2, obs.size * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-obs.size, -obs.size, obs.size * 2, obs.size * 2);
      ctx.restore();
    });

    // Remove offscreen obstacles
    state.obstacles = state.obstacles.filter((obs: any) => obs.x + obs.size * 2 > 0);

    // Update & Draw Jet Particles
    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
    state.particles = state.particles.filter((p: any) => p.life > 0);

    // Draw Tunnel Cave Ceiling
    ctx.beginPath();
    ctx.moveTo(state.cavePoints[0].x, 0);
    state.cavePoints.forEach((pt: any) => {
      ctx.lineTo(pt.x, pt.top);
    });
    ctx.lineTo(state.cavePoints[state.cavePoints.length - 1].x, 0);
    ctx.closePath();
    ctx.fillStyle = '#09030b';
    ctx.fill();

    // Ceiling Neon Outline
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff66';
    ctx.beginPath();
    state.cavePoints.forEach((pt: any, idx: number) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.top);
      else ctx.lineTo(pt.x, pt.top);
    });
    ctx.stroke();

    // Draw Tunnel Cave Floor
    ctx.beginPath();
    ctx.moveTo(state.cavePoints[0].x, height);
    state.cavePoints.forEach((pt: any) => {
      ctx.lineTo(pt.x, pt.bottom);
    });
    ctx.lineTo(state.cavePoints[state.cavePoints.length - 1].x, height);
    ctx.closePath();
    ctx.fillStyle = '#09030b';
    ctx.fill();

    // Floor Neon Outline
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff66';
    ctx.beginPath();
    state.cavePoints.forEach((pt: any, idx: number) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.bottom);
      else ctx.lineTo(pt.x, pt.bottom);
    });
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Draw Player Helicopter (Elegant Neon Pink Vector Capsule)
    ctx.save();
    ctx.translate(playerX, state.y);
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff007f';

    // Rotor blade spinning animation
    const bladeAngle = (Date.now() * 0.05) % Math.PI;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(bladeAngle) * 14, -8);
    ctx.lineTo(Math.cos(bladeAngle) * 14, -8);
    ctx.stroke();

    // Rotor mast
    ctx.fillStyle = '#71717a';
    ctx.fillRect(-1.5, -8, 3, 4);

    // Main Cabin
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit shield (Cyan)
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(3, -1, 4, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Tail boom & stabilizer
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-15, -1);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-17, -5, 2, 8);

    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`JARAK: ${Math.floor(state.distance / 10)}m`, 15, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`SKOR: ${score}`, width - 15, 25);

    ctx.fillStyle = '#71717a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TEKAN & PEGANG SPACEBAR ATAU KETUK UNTUK TERBANG NAIK', width / 2, height - 12);
  };


  // ==========================================
  // GAME 29: NEON LANDER (SPACE LANDER)
  // ==========================================
  const startSpaceLander = () => {
    playSound('point');
    setGameStatus('PLAYING');
    setScore(0);
    stateRef.current = {
      x: 40,
      y: 60,
      vx: 1.0,
      vy: 0.1,
      angle: 0, // degrees: 0 is straight up, negative is left, positive is right
      fuel: 1000,
      gravity: 0.035,
      thrust: 0.09,
      rotationSpeed: 3.2,
      terrainPoints: [],
      particles: [],
      landed: false,
      landedDelay: 0,
      shouldPlace: false
    };
  };

  const drawAndUpdateSpaceLander = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const state = stateRef.current;
    if (!state) return;

    // Deep Dark Space background
    ctx.fillStyle = '#030206';
    ctx.fillRect(0, 0, width, height);

    // Glowing Neon Moon
    ctx.fillStyle = '#18122b';
    ctx.beginPath();
    ctx.arc(width - 60, 60, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7000ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Generate terrain with flat pads if empty
    if (state.terrainPoints.length === 0) {
      const segmentCount = 14;
      const segWidth = width / segmentCount;
      const tempPoints = [];
      
      // We want to force at least 1 or 2 flat landing pads
      const padIndex1 = 4;
      const padIndex2 = 10;

      for (let i = 0; i <= segmentCount; i++) {
        const tx = i * segWidth;
        let ty;
        let isPad = false;

        if (i === padIndex1 || i === padIndex1 + 1) {
          ty = height - 40; // Flat pad 1
          isPad = true;
        } else if (i === padIndex2 || i === padIndex2 + 1) {
          ty = height - 55; // Flat pad 2
          isPad = true;
        } else {
          // Jagged mountains
          ty = height - 20 - Math.random() * 60 - Math.sin(i * 0.7) * 20;
        }
        tempPoints.push({ x: tx, y: ty, isPad });
      }

      // Smooth/flatten pads exactly
      tempPoints[padIndex1 + 1].y = tempPoints[padIndex1].y;
      tempPoints[padIndex2 + 1].y = tempPoints[padIndex2].y;

      state.terrainPoints = tempPoints;
    }

    if (state.landed) {
      // Landed state pause before next round
      state.vx = 0;
      state.vy = 0;
      state.angle = 0;
      state.landedDelay++;

      if (state.landedDelay > 70) {
        // Reset to next stage
        state.x = 40;
        state.y = 50;
        state.vx = 0.8;
        state.vy = 0;
        state.angle = 0;
        state.fuel = Math.min(1000, state.fuel + 400); // partially refill fuel!
        state.terrainPoints = []; // regenerate harder terrain!
        state.landed = false;
        state.landedDelay = 0;
      }
    } else {
      // Rotation Input
      if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
        state.angle -= state.rotationSpeed;
      }
      if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
        state.angle += state.rotationSpeed;
      }

      // Keep angle in range [-180, 180]
      if (state.angle < -180) state.angle += 360;
      if (state.angle > 180) state.angle -= 360;

      // Thrust Input
      const isThrusting = (keysPressed.current[' '] || keysPressed.current['space'] || keysPressed.current['arrowup'] || keysPressed.current['w'] || state.shouldPlace) && state.fuel > 0;
      if (isThrusting) {
        state.fuel = Math.max(0, state.fuel - 1.8);
        
        // Thrust direction is vector corresponding to angle
        // 0 degrees is straight up (-Y axis)
        const rad = (state.angle - 90) * Math.PI / 180;
        state.vx += Math.cos(rad) * state.thrust;
        state.vy += Math.sin(rad) * state.thrust;

        // Exhaust spark particles
        const exhaustRad = (state.angle + 90) * Math.PI / 180;
        state.particles.push({
          x: state.x + Math.cos(exhaustRad) * 6,
          y: state.y + Math.sin(exhaustRad) * 6,
          vx: Math.cos(exhaustRad) * 3 + (Math.random() - 0.5) * 1.5,
          vy: Math.sin(exhaustRad) * 3 + (Math.random() - 0.5) * 1.5,
          color: '#ffea00',
          life: 15,
          maxLife: 15,
          size: Math.random() * 3 + 1
        });
      }

      // Gravity
      state.vy += state.gravity;

      // Position update
      state.x += state.vx;
      state.y += state.vy;

      // Wrap Screen horizontal
      if (state.x < 0) state.x = width;
      if (state.x > width) state.x = 0;

      // Ceiling boundary
      if (state.y < 0) {
        state.y = 0;
        state.vy = 0;
      }

      // Ground / Terrain Collision check
      const currentSegmentIndex = state.terrainPoints.findIndex((pt: any, idx: number) => {
        return idx < state.terrainPoints.length - 1 && state.x >= pt.x && state.x <= state.terrainPoints[idx + 1].x;
      });

      if (currentSegmentIndex !== -1) {
        const ptA = state.terrainPoints[currentSegmentIndex];
        const ptB = state.terrainPoints[currentSegmentIndex + 1];
        
        // Linear Interpolate ground height under ship
        const ratio = (state.x - ptA.x) / (ptB.x - ptA.x);
        const groundY = ptA.y + ratio * (ptB.y - ptA.y);

        // Check crash or land (ship radius ~ 6px)
        if (state.y + 6 >= groundY) {
          state.y = groundY - 6;

          // Check if landed on pad
          const isOnPad = ptA.isPad && ptB.isPad;
          const safeAngle = Math.abs(state.angle) < 14;
          const safeVVel = state.vy < 1.3;
          const safeHVel = Math.abs(state.vx) < 0.8;

          if (isOnPad && safeAngle && safeVVel && safeHVel) {
            // SUCCESSFUL LANDING!
            state.landed = true;
            playSound('victory');
            const landingReward = 500 + Math.floor(state.fuel / 2);
            setScore((prev) => prev + landingReward);
          } else {
            // EXPLODE CRASH
            playSound('explosion');
            // Huge explosion sparks
            for (let i = 0; i < 35; i++) {
              state.particles.push({
                x: state.x,
                y: state.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: '#ef4444',
                life: 40,
                maxLife: 40,
                size: Math.random() * 5 + 2
              });
            }
            setGameStatus('GAME_OVER');
            playSound('gameover');
            saveHighScore(score);
          }
        }
      }
    }

    // Draw Jagged Terrain and Landing Pads
    ctx.lineWidth = 2.5;
    for (let i = 0; i < state.terrainPoints.length - 1; i++) {
      const ptA = state.terrainPoints[i];
      const ptB = state.terrainPoints[i + 1];

      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);

      if (ptA.isPad && ptB.isPad) {
        ctx.strokeStyle = '#00f0ff'; // Cyan for Landing Pads
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00f0ff';
        ctx.stroke();

        // Draw bonus text on pad
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00f0ff';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAD LANDING (SAFE)', ptA.x + (ptB.x - ptA.x) / 2, ptA.y + 12);
      } else {
        ctx.strokeStyle = '#7000ff'; // Purple mountain vector
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0; // reset

    // Update & Draw Particles
    state.particles.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
    state.particles = state.particles.filter((p: any) => p.life > 0);

    // Draw Player Spaceship module
    ctx.save();
    ctx.translate(state.x, state.y);
    ctx.rotate(state.angle * Math.PI / 180);
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffea00';

    // Ship cabin body
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 1);
    ctx.lineTo(-5, 1);
    ctx.closePath();
    ctx.fill();

    // Visor Window
    ctx.fillStyle = '#030206';
    ctx.fillRect(-2, -3, 4, 2);

    // Legs / Lander struts
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 1);
    ctx.lineTo(-6, 6);
    ctx.lineTo(-8, 6); // foot pad
    ctx.moveTo(4, 1);
    ctx.lineTo(6, 6);
    ctx.lineTo(8, 6); // foot pad
    ctx.stroke();

    ctx.restore();
    ctx.shadowBlur = 0;

    // Victory Banner Overlay
    if (state.landed) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fillRect(0, height / 2 - 25, width, 50);

      ctx.fillStyle = '#00f0ff';
      ctx.font = '12px "Press Start 2P", Courier, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PENDARATAN SEMPURNA! +500', width / 2, height / 2 + 4);
    }

    // Draw HUD metrics
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FUEL: ${Math.floor(state.fuel)}`, 15, 20);
    
    // Fuel meter bar
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(15, 24, 70, 4);
    const fuelRatio = state.fuel / 1000;
    ctx.fillStyle = fuelRatio > 0.3 ? '#00ff66' : '#ef4444';
    ctx.fillRect(15, 24, 70 * fuelRatio, 4);

    // Velocity limits displays
    const isSafeV = state.vy < 1.3;
    const isSafeH = Math.abs(state.vx) < 0.8;
    ctx.fillStyle = isSafeV ? '#00ff66' : '#ef4444';
    ctx.fillText(`V.VEL: ${state.vy.toFixed(2)}`, 100, 20);
    ctx.fillStyle = isSafeH ? '#00ff66' : '#ef4444';
    ctx.fillText(`H.VEL: ${state.vx.toFixed(2)}`, 100, 32);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`ANGLE: ${state.angle.toFixed(0)}°`, width - 90, 20);
    ctx.fillText(`SKOR: ${score}`, width - 90, 32);

    ctx.fillStyle = '#71717a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARROW_LEFT/RIGHT: CONDONG | ARROW_UP/SPACE: ENJIN TUJAHAN', width / 2, height - 12);
  };



  // ==========================================
  // UNIFIED ENGINE LOOP FOR CANVAS-BASED GAMES
  // ==========================================
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    // List of games that run in 2D Canvas Loop
    if (!CANVAS_GAMES.includes(gameId)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const runLoop = () => {
      // Scale canvas dynamically only when container size changes (prevents frame-by-frame resets and fixes fullscreen/theater mode coordinate layout bugs!)
      if (containerRef.current) {
        const targetWidth = containerRef.current.clientWidth;
        const targetHeight = containerRef.current.clientHeight || 320;
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }
      }

      // Route Drawing
      if (gameId === 'astro-race') drawAndUpdateAstroRace(ctx, canvas.width, canvas.height);
      else if (gameId === 'fruit-catcher') drawAndUpdateFruitCatcher(ctx, canvas.width, canvas.height);
      else if (gameId === 'laser-dodger') drawAndUpdateLaserDodger(ctx, canvas.width, canvas.height);
      else if (gameId === 'color-match') drawAndUpdateColorMatch(ctx, canvas.width, canvas.height);
      else if (gameId === 'tetri-block') drawAndUpdateTetriBlock(ctx, canvas.width, canvas.height);
      else if (gameId === 'neon-drifter') drawAndUpdateNeonDrifter(ctx, canvas.width, canvas.height);
      else if (gameId === 'pixel-jump') drawAndUpdatePixelJumper(ctx, canvas.width, canvas.height);
      else if (gameId === 'speed-typer') drawAndUpdateSpeedTyper(ctx, canvas.width, canvas.height);
      else if (gameId === 'sumo-push') drawAndUpdateSumoPush(ctx, canvas.width, canvas.height);
      else if (gameId === 'bomb-tag') drawAndUpdateBombTag(ctx, canvas.width, canvas.height);
      else if (gameId === 'grid-chase') drawAndUpdateGridChase(ctx, canvas.width, canvas.height);
      else if (gameId === 'flappy-neon') drawAndUpdateFlappyNeon(ctx, canvas.width, canvas.height);
      else if (gameId === 'meteor-storm') drawAndUpdateMeteorStorm(ctx, canvas.width, canvas.height);
      else if (gameId === 'tug-of-war') drawAndUpdateTugOfWar(ctx, canvas.width, canvas.height);
      else if (gameId === 'tank-neon') drawAndUpdateTankNeon(ctx, canvas.width, canvas.height);
      else if (gameId === 'paint-arena') drawAndUpdatePaintArena(ctx, canvas.width, canvas.height);
      else if (gameId === 'space-soccer') drawAndUpdateSpaceSoccer(ctx, canvas.width, canvas.height);
      else if (gameId === 'neon-golf') drawAndUpdateNeonGolf(ctx, canvas.width, canvas.height);
      else if (gameId === 'glitch-sweeper') drawAndUpdateGlitchSweeper(ctx, canvas.width, canvas.height);
      else if (gameId === 'hex-shield') drawAndUpdateHexShield(ctx, canvas.width, canvas.height);
      else if (gameId === 'pixel-painter') drawAndUpdatePixelPainter(ctx, canvas.width, canvas.height);
      else if (gameId === 'cyber-runner') drawAndUpdateCyberRunner(ctx, canvas.width, canvas.height);
      else if (gameId === 'neon-stacker') drawAndUpdateNeonStacker(ctx, canvas.width, canvas.height);
      else if (gameId === 'copter-neon') drawAndUpdateCopterNeon(ctx, canvas.width, canvas.height);
      else if (gameId === 'space-lander') drawAndUpdateSpaceLander(ctx, canvas.width, canvas.height);

      animationId.current = requestAnimationFrame(runLoop);
    };

    animationId.current = requestAnimationFrame(runLoop);
    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [gameId, gameStatus, playerCount, score]);

  // NON-CANVAS TIMER TICKS (Whack-a-glitch / Party-Tap)
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const tickInterval = setInterval(() => {
      if (gameId === 'party-tap') {
        updatePartyTap();
      } else if (gameId === 'whack-a-glitch') {
        updateWhackAGlitch();
      }
    }, 40);

    return () => clearInterval(tickInterval);
  }, [gameId, gameStatus, playerCount, playerScores]);


  // Handler to start any game
  const startGame = () => {
    if (gameId === 'party-tap') startPartyTap();
    else if (gameId === 'astro-race') startAstroRace();
    else if (gameId === 'fruit-catcher') startFruitCatcher();
    else if (gameId === 'laser-dodger') startLaserDodger();
    else if (gameId === 'color-match') startColorMatch();
    else if (gameId === 'tetri-block') startTetriBlock();
    else if (gameId === 'math-blaster') startMathBlaster();
    else if (gameId === 'neon-drifter') startNeonDrifter();
    else if (gameId === 'pixel-jump') startPixelJumper();
    else if (gameId === 'simon-retro') startSimonRetro();
    else if (gameId === 'whack-a-glitch') startWhackAGlitch();
    else if (gameId === 'speed-typer') startSpeedTyper();
    else if (gameId === 'sumo-push') startSumoPush();
    else if (gameId === 'bomb-tag') startBombTag();
    else if (gameId === 'grid-chase') startGridChase();
    else if (gameId === 'flappy-neon') startFlappyNeon();
    else if (gameId === 'meteor-storm') startMeteorStorm();
    else if (gameId === 'tug-of-war') startTugOfWar();
    else if (gameId === 'tank-neon') startTankNeon();
    else if (gameId === 'paint-arena') startPaintArena();
    else if (gameId === 'space-soccer') startSpaceSoccer();
    else if (gameId === 'neon-golf') startNeonGolf();
    else if (gameId === 'glitch-sweeper') startGlitchSweeper();
    else if (gameId === 'hex-shield') startHexShield();
    else if (gameId === 'pixel-painter') startPixelPainter();
    else if (gameId === 'cyber-runner') startCyberRunner();
    else if (gameId === 'neon-stacker') startNeonStacker();
    else if (gameId === 'copter-neon') startCopterNeon();
    else if (gameId === 'space-lander') startSpaceLander();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (gameId === 'cyber-runner') {
      const state = stateRef.current;
      if (state && state.player) {
        if (x < canvas.width / 2) {
          keysPressed.current['arrowup'] = true;
          setTimeout(() => {
            keysPressed.current['arrowup'] = false;
          }, 100);
        } else {
          keysPressed.current['arrowdown'] = true;
        }
      }
    } else if (gameId === 'neon-golf') {
      const state = stateRef.current;
      if (!state || !state.ball) return;
      const b = state.ball;
      if (Math.abs(b.vx) < 0.15 && Math.abs(b.vy) < 0.15) {
        state.isAiming = true;
        state.aimAnchorX = x;
        state.aimAnchorY = y;
        state.aimDx = 0;
        state.aimDy = 0;
      }
    } else if (gameId === 'glitch-sweeper') {
      const state = stateRef.current;
      if (state && state.grid) {
        const cw = canvas.width / state.cols;
        const ch = (canvas.height - 30) / state.rows;
        const c = Math.floor(x / cw);
        const r = Math.floor((y - 30) / ch);
        if (c >= 0 && c < state.cols && r >= 0 && r < state.rows) {
          state.cursorX = c;
          state.cursorY = r;
          
          const cell = state.grid[r][c];
          if (e.button === 2) { // Right Click: Toggle Flag!
            e.preventDefault();
            if (!cell.revealed) {
              cell.flagged = !cell.flagged;
              playSound('bounce');
            }
          } else { // Left Click: Reveal!
            if (!cell.revealed && !cell.flagged) {
              if (cell.isGlitch) {
                cell.revealed = true;
                playSound('explosion');
                setGameStatus('GAME_OVER');
                saveHighScore(score);
              } else {
                playSound('point');
                cascadeRevealGlitchSweeper(r, c, state);

                let won = true;
                for (let rowIdx = 0; rowIdx < state.rows; rowIdx++) {
                  for (let colIdx = 0; colIdx < state.cols; colIdx++) {
                    if (!state.grid[rowIdx][colIdx].isGlitch && !state.grid[rowIdx][colIdx].revealed) {
                      won = false;
                    }
                  }
                }
                if (won) {
                  playSound('victory');
                  setGameStatus('GAME_OVER');
                  saveHighScore(score + 1000);
                }
              }
            }
          }
        }
      }
    } else if (gameId === 'hex-shield') {
      const state = stateRef.current;
      if (state) {
        if (x < canvas.width / 2) {
          state.angle = (state.angle + 5) % 6;
        } else {
          state.angle = (state.angle + 1) % 6;
        }
        playSound('bounce');
      }
    } else if (gameId === 'neon-stacker' || gameId === 'copter-neon' || gameId === 'space-lander') {
      const state = stateRef.current;
      if (state) state.shouldPlace = true;
    }
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING' || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    if (gameId === 'cyber-runner') {
      const state = stateRef.current;
      if (state && state.player) {
        if (x < canvas.width / 2) {
          keysPressed.current['arrowup'] = true;
          setTimeout(() => {
            keysPressed.current['arrowup'] = false;
          }, 100);
        } else {
          keysPressed.current['arrowdown'] = true;
        }
      }
    } else if (gameId === 'neon-golf') {
      const state = stateRef.current;
      if (!state || !state.ball) return;
      const b = state.ball;
      if (Math.abs(b.vx) < 0.15 && Math.abs(b.vy) < 0.15) {
        state.isAiming = true;
        state.aimAnchorX = x;
        state.aimAnchorY = y;
        state.aimDx = 0;
        state.aimDy = 0;
      }
    } else if (gameId === 'glitch-sweeper') {
      const state = stateRef.current;
      if (state && state.grid) {
        const cw = canvas.width / state.cols;
        const ch = (canvas.height - 30) / state.rows;
        const c = Math.floor(x / cw);
        const r = Math.floor((y - 30) / ch);
        if (c >= 0 && c < state.cols && r >= 0 && r < state.rows) {
          const isSameCell = state.cursorX === c && state.cursorY === r;
          state.cursorX = c;
          state.cursorY = r;
          
          if (isSameCell) {
            const cell = state.grid[r][c];
            if (!cell.revealed && !cell.flagged) {
              if (cell.isGlitch) {
                cell.revealed = true;
                playSound('explosion');
                setGameStatus('GAME_OVER');
                saveHighScore(score);
              } else {
                playSound('point');
                cascadeRevealGlitchSweeper(r, c, state);

                let won = true;
                for (let rowIdx = 0; rowIdx < state.rows; rowIdx++) {
                  for (let colIdx = 0; colIdx < state.cols; colIdx++) {
                    if (!state.grid[rowIdx][colIdx].isGlitch && !state.grid[rowIdx][colIdx].revealed) {
                      won = false;
                    }
                  }
                }
                if (won) {
                  playSound('victory');
                  setGameStatus('GAME_OVER');
                  saveHighScore(score + 1000);
                }
              }
            }
          } else {
            playSound('bounce');
          }
        }
      }
    } else if (gameId === 'hex-shield') {
      const state = stateRef.current;
      if (state) {
        if (x < canvas.width / 2) {
          state.angle = (state.angle + 5) % 6;
        } else {
          state.angle = (state.angle + 1) % 6;
        }
        playSound('bounce');
      }
    } else if (gameId === 'neon-stacker' || gameId === 'copter-neon' || gameId === 'space-lander') {
      const state = stateRef.current;
      if (state) state.shouldPlace = true;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING') return;
    if (gameId === 'fruit-catcher') handleFruitMouseMove(e);
    else if (gameId === 'laser-dodger') handleLaserMouseMove(e);
    else if (gameId === 'pixel-jump') handleJumperMouseMove(e);
    else if (gameId === 'neon-golf') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const state = stateRef.current;
      if (state && state.isAiming) {
        state.aimDx = state.aimAnchorX - x;
        state.aimDy = state.aimAnchorY - y;
      }
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING' || e.touches.length === 0) return;
    if (gameId === 'fruit-catcher') handleFruitTouchMove(e);
    else if (gameId === 'laser-dodger') handleLaserTouchMove(e);
    else if (gameId === 'pixel-jump') handleJumperTouchMove(e);
    else if (gameId === 'neon-golf') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      const state = stateRef.current;
      if (state && state.isAiming) {
        state.aimDx = state.aimAnchorX - x;
        state.aimDy = state.aimAnchorY - y;
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    handleCanvasRelease(x, y);
  };

  const handleCanvasTouchEnd = () => {
    if (gameStatus !== 'PLAYING') return;
    handleCanvasRelease(0, 0);
  };

  const handleCanvasRelease = (x: number, y: number) => {
    if (gameId === 'cyber-runner') {
      keysPressed.current['arrowdown'] = false;
    } else if (gameId === 'neon-golf') {
      const state = stateRef.current;
      if (state && state.isAiming) {
        state.isAiming = false;
        const b = state.ball;
        const dragDist = Math.sqrt(state.aimDx * state.aimDx + state.aimDy * state.aimDy);
        if (dragDist > 10) {
          const maxPower = 120;
          const power = Math.min(maxPower, dragDist) * 0.12;
          const angle = Math.atan2(state.aimDy, state.aimDx);
          b.vx = Math.cos(angle) * power;
          b.vy = Math.sin(angle) * power;
          state.strokes++;
          playSound('laser');
        }
      }
    } else if (gameId === 'neon-stacker' || gameId === 'copter-neon' || gameId === 'space-lander') {
      const state = stateRef.current;
      if (state) state.shouldPlace = false;
    }
  };

  return (
    <div className="flex flex-col bg-[#07060b] border border-zinc-800 rounded-none overflow-hidden select-none relative">
      {/* HUD Header Bar */}
      <div className="flex justify-between items-center bg-[#0C0C0F] px-4 py-2 border-b border-zinc-800 text-xs">
        <div>
          <span className="text-[9px] text-zinc-500 font-arcade">MAIN KABINET</span>
          <div className="font-bold text-arcade-cyan text-sm font-arcade uppercase">{gameId.replace('-', ' ')}</div>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-zinc-500 block font-arcade">SKOR TERKINI</span>
          <span className="text-arcade-yellow font-bold text-sm font-arcade">{score}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-zinc-500 font-arcade">REKOD TINGGI</span>
          <div className="font-bold text-arcade-pink text-sm font-arcade">{highScore}</div>
        </div>
      </div>

      {/* Playfield Container */}
      <div 
        ref={containerRef}
        className="relative flex-grow flex flex-col items-stretch justify-start bg-[#06050b] min-h-[320px] h-full"
      >
        {/* Canvas for canvas games */}
        {CANVAS_GAMES.includes(gameId) && (
          <div className="flex-grow min-h-0 relative">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-pointer touch-none"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onTouchStart={handleCanvasTouchStart}
              onTouchMove={handleCanvasTouchMove}
              onTouchEnd={handleCanvasTouchEnd}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* Multiplayer Quick-Tap Buttons for Mobile Canvas-Based Games */}
        {gameStatus === 'PLAYING' && ['astro-race', 'sumo-push', 'bomb-tag', 'tug-of-war', 'tank-neon', 'paint-arena', 'space-soccer', 'pixel-painter'].includes(gameId) && (
          <div className="bg-[#0C0C0F] border-t border-zinc-800 p-2 grid grid-cols-2 sm:grid-cols-5 gap-1.5 shrink-0 z-10 select-none">
            {Array(playerCount).fill(null).map((_, idx) => (
              <button
                key={idx}
                id={`btn-canvas-tap-pad-${idx}`}
                onTouchStart={(e) => { e.preventDefault(); keysPressed.current[playerKeys[idx]] = true; }}
                onTouchEnd={(e) => { e.preventDefault(); keysPressed.current[playerKeys[idx]] = false; }}
                onMouseDown={(e) => { e.preventDefault(); keysPressed.current[playerKeys[idx]] = true; }}
                onMouseUp={(e) => { e.preventDefault(); keysPressed.current[playerKeys[idx]] = false; }}
                style={{ borderColor: playerColors[idx], boxShadow: `0 0 8px ${playerColors[idx]}20` }}
                className="bg-zinc-900/90 hover:bg-zinc-800 border py-2 flex flex-col items-center justify-center rounded active:scale-95 transition cursor-pointer"
              >
                <span className="text-[7px] text-zinc-400 font-arcade">P{idx + 1} BUTTON</span>
                <span className="text-[9px] font-mono font-bold text-white mt-0.5">{playerColorNames[idx].split(' ')[0]}</span>
                <span className="text-[6px] text-zinc-500 font-mono">KEKUNCI: {playerKeys[idx].toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}

        {/* DOM-based rendering for specific games */}
        {gameStatus === 'PLAYING' && gameId === 'party-tap' && (
          <div className="absolute inset-0 flex flex-col justify-between p-4 bg-[#0a0a14]">
            {/* Center timing indicator */}
            <div className="flex-grow flex flex-col justify-center items-center text-center">
              <div className="text-xs text-zinc-500 font-mono mb-1">MASA TINGGAL: <span className="text-white text-sm font-bold">{stateRef.current.timeLeft?.toFixed(1)}s</span></div>
              
              <div className="h-16 flex items-center justify-center">
                {stateRef.current.boostPlayer !== -1 ? (
                  <div 
                    style={{ color: playerColors[stateRef.current.boostPlayer] }} 
                    className="font-arcade text-base animate-ping tracking-widest uppercase"
                  >
                    TAP SEKARANG: P{stateRef.current.boostPlayer + 1}!
                  </div>
                ) : (
                  <div className="font-arcade text-zinc-400 text-xs tracking-wider">TEKAN BUTANG ANDA LAJU-LAJU!</div>
                )}
              </div>
            </div>

            {/* Tap arenas for up to 5 players */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full mt-auto">
              {Array(playerCount).fill(null).map((_, idx) => (
                <button
                  key={idx}
                  id={`btn-party-tap-pad-${idx}`}
                  onTouchStart={() => handlePartyTapInput(idx)}
                  onMouseDown={() => handlePartyTapInput(idx)}
                  style={{ borderColor: playerColors[idx], boxShadow: `0 0 10px ${playerColors[idx]}20` }}
                  className="bg-zinc-900 hover:bg-zinc-800 border-2 py-4 flex flex-col items-center justify-center rounded-lg active:scale-95 transition cursor-pointer"
                >
                  <span className="text-[9px] text-zinc-500 font-arcade">PEMAIN {idx + 1}</span>
                  <div className="font-arcade text-xs text-white my-1">{playerScores[idx]}</div>
                  <div className="text-[7px] text-zinc-400 font-mono">KEKUNCI: {playerKeys[idx].toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {gameStatus === 'PLAYING' && gameId === 'math-blaster' && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#07060f] px-6">
            <div className="text-arcade-pink font-arcade text-xs mb-2">SELESAIKAN FORMULA!</div>
            <div className="text-4xl font-bold text-white font-mono tracking-wide mb-8 bg-zinc-950 px-6 py-3 border border-zinc-800">{currentQuestion.q}</div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  id={`btn-math-opt-${idx}`}
                  onClick={() => handleMathAnswer(opt)}
                  className="bg-zinc-900 hover:bg-arcade-cyan hover:text-black border-2 border-zinc-800 text-white font-arcade text-xs py-3 rounded active:scale-95 transition cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameStatus === 'PLAYING' && gameId === 'simon-retro' && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#06050b] p-6">
            <div className="text-[9px] font-arcade mb-4 text-zinc-400">
              {simonTurn === 'CPU' ? 'SILA LIHAT DAN INGAT!' : 'GILIRAN ANDA MENIRU SEKUENSI!'}
            </div>

            <div className="grid grid-cols-2 gap-4 w-44 h-44">
              {shieldColors.map((color, idx) => (
                <button
                  key={idx}
                  id={`btn-simon-pad-${idx}`}
                  onClick={() => handleSimonPadPress(idx)}
                  disabled={simonTurn === 'CPU'}
                  style={{
                    backgroundColor: simonActivePad === idx ? color : 'transparent',
                    borderColor: color,
                    boxShadow: simonActivePad === idx ? `0 0 20px ${color}` : 'none'
                  }}
                  className="border-4 h-20 w-20 rounded-lg active:scale-95 transition-all duration-100 cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        {gameStatus === 'PLAYING' && gameId === 'whack-a-glitch' && (
          <div className="absolute inset-0 flex flex-col justify-between p-4 bg-[#0a0a14]">
            <div className="text-center">
              <span className="text-[9px] text-zinc-500 font-arcade block">MASA TINGGAL</span>
              <span className="text-arcade-pink font-arcade text-sm font-bold">{stateRef.current.timeLeft?.toFixed(1)}s</span>
            </div>

            <div className="grid grid-cols-3 gap-3 w-64 h-64 mx-auto my-auto">
              {whackGrid.map((active, idx) => (
                <button
                  key={idx}
                  id={`btn-whack-pad-${idx}`}
                  onClick={() => handleWhack(idx)}
                  style={{
                    borderColor: active ? (whackGold[idx] ? '#ffea00' : '#ff007f') : '#27272a',
                    backgroundColor: active ? (whackGold[idx] ? '#ffea0030' : '#ff007f30') : 'transparent',
                    boxShadow: active ? `0 0 15px ${whackGold[idx] ? '#ffea00' : '#ff007f'}` : 'none'
                  }}
                  className="border-2 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  {active && (
                    <span className={`w-3 h-3 rounded-full animate-ping ${whackGold[idx] ? 'bg-arcade-yellow' : 'bg-arcade-pink'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input panel for Speed Typer */}
        {gameStatus === 'PLAYING' && gameId === 'speed-typer' && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
            <form onSubmit={submitTyperWord} className="flex gap-2 w-full max-w-xs">
              <input
                id="input-typer-word"
                type="text"
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                placeholder="TAIP DI SINI..."
                autoFocus
                className="flex-grow bg-zinc-950 border border-zinc-800 text-arcade-cyan font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-arcade-cyan text-center uppercase"
              />
              <button
                id="btn-submit-typer"
                type="submit"
                className="bg-arcade-pink text-white font-arcade text-[9px] px-3 py-2 border border-white rounded"
              >
                TEMBAK
              </button>
            </form>
          </div>
        )}


        {/* IDLE state layout (lobby & settings) */}
        {gameStatus === 'IDLE' && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/90 text-center px-6 py-4">
            <h2 className="font-arcade text-sm text-arcade-cyan glow-cyan mb-2 leading-relaxed uppercase">{gameId.replace('-', ' ')}</h2>
            
            {/* Multiplayer Setup section (Party Tap, Astro Race, Sumo Push, Bomb Tag) */}
            {['party-tap', 'astro-race', 'sumo-push', 'bomb-tag'].includes(gameId) ? (
              <div className="mb-4 bg-zinc-900/60 p-3 border border-zinc-800 rounded-none max-w-xs">
                <span className="text-[9px] text-zinc-400 font-arcade block mb-2">PILIH JUMLAH PEMAIN (1 - 5)</span>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      id={`btn-select-players-${num}`}
                      onClick={() => setPlayerCount(num)}
                      className={`w-8 h-8 rounded font-arcade text-xs border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                        playerCount === num 
                          ? 'bg-arcade-pink text-white border-white' 
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="text-[7px] text-zinc-500 font-mono mt-2 leading-normal">
                  Sesuai untuk berbilang pemain di satu skrin/papan kekunci!
                </div>
              </div>
            ) : (
              <p className="text-zinc-400 text-xs max-w-xs mb-4 font-sans leading-relaxed">
                {gameId === 'fruit-catcher' && 'Tangkap buah neon hijau & emas yang jatuh menggunakan tetikus, sentuhan, atau butang anak panah. Elak bom!'}
                {gameId === 'laser-dodger' && 'Kawal nod pixel merah muda untuk mengelak tembakan laser cyan gergasi. Sentuh & heret atau guna WASD.'}
                {gameId === 'color-match' && 'Pusingkan perisai neon untuk menangkap bebola cahaya yang secocok. Gunakan kekunci anak panah kiri/kanan.'}
                {gameId === 'tetri-block' && 'Susun bata neon berwarna untuk memenuhi garisan melintang. Kawal guna kekunci anak panah atau butang skrin.'}
                {gameId === 'math-blaster' && 'Selesaikan formula matematik retro sepantas mungkin dan tembak perisai jawapan betul!'}
                {gameId === 'neon-drifter' && 'Drift kereta neon di atas jalan zig-zag. Tekan SPACEBAR atau mana-mana untuk tukar arah.'}
                {gameId === 'pixel-jump' && 'Melompat ke atas platform neon gergasi tanpa terjatuh ke bawah. Kawal pergerakan dengan tetikus atau anak panah.'}
                {gameId === 'simon-retro' && 'Uji minda anda dengan mengulangi sekuensi lampu dan bunyi retro klasik.'}
                {gameId === 'whack-a-glitch' && 'Ketuk glitch merah muda yang muncul di grid secepat mungkin dalam 15 saat.'}
                {gameId === 'speed-typer' && 'Taip perkataan neon retro yang jatuh sebelum ia mencecah dasar kabinet!'}
                {gameId === 'cyber-runner' && 'Lari tanpa henti di lebuhraya grid neon! Lompat melepasi penghalang siber maut dan tunduk di bawah laser plasma.'}
              </p>
            )}

            {/* Instruction description specifically for sumo-push and bomb-tag */}
            {gameId === 'sumo-push' && (
              <p className="text-zinc-400 text-[10px] max-w-xs mb-4 font-sans leading-normal">
                Kawal arah panah berputar di sekeliling anda, dan ketuk butang kawalan anda untuk meluncur ke hadapan untuk menolak pemain lain keluar dari arena yang menyusut!
              </p>
            )}
            {gameId === 'bomb-tag' && (
              <p className="text-zinc-400 text-[10px] max-w-xs mb-4 font-sans leading-normal">
                Seorang pemain bermula dengan membawa Bom 💣. Tekan butang kawalan anda untuk meluncur ke hadapan, langgar pemain lain untuk memindahkan bom sebelum masa tamat!
              </p>
            )}

            <button
              id="btn-start-mini-game"
              onClick={startGame}
              className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-6 py-3 border border-white shadow-md shadow-arcade-pink/40 active:scale-95 transition cursor-pointer"
            >
              <Play size={12} /> TEKAN UNTUK MULA
            </button>
          </div>
        )}

        {/* GAME_OVER state layout */}
        {gameStatus === 'GAME_OVER' && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/95 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-pink glow-pink mb-2">TAMAT PERMAINAN</h2>
            
            {/* Display multiplayer winner details */}
            {['party-tap', 'astro-race', 'sumo-push', 'bomb-tag'].includes(gameId) && multiplayerWinner !== null ? (
              <div className="my-4 p-3 bg-zinc-900 border border-zinc-800 rounded-none w-full max-w-xs">
                <span className="text-arcade-yellow font-arcade text-xs block animate-bounce mb-1">TAHNIAH PEMENANG!</span>
                <div className="font-bold font-arcade text-sm" style={{ color: playerColors[multiplayerWinner] }}>
                  PEMAIN {multiplayerWinner + 1} ({playerColorNames[multiplayerWinner].split(' ')[0]})
                </div>
              </div>
            ) : (
              <div className="text-zinc-300 font-mono text-xs font-arcade my-3">
                MATA AKHIR ANDA: <span className="text-arcade-yellow text-sm font-bold">{score}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                id="btn-retry-mini-game"
                onClick={startGame}
                className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-4 py-2.5 border border-white active:scale-95 transition cursor-pointer"
              >
                <RotateCcw size={12} /> CUBA LAGI
              </button>
              <button
                id="btn-exit-mini-game"
                onClick={onExit}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-arcade text-xs px-4 py-2.5 border border-zinc-700 active:scale-95 transition cursor-pointer"
              >
                KELUAR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Arrow Buttons for Mobile Compatibility / Neon Style Controllers */}
      <div className="bg-black border-t-2 border-zinc-900 p-3 flex justify-between items-center select-none">
        <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-600 uppercase">
          <Zap size={10} className="text-arcade-cyan animate-pulse" /> CONTROL CABINET
        </div>
        
        {/* Render Mobile/On-Screen D-Pad only when playing and supported */}
        {gameStatus === 'PLAYING' && (
          <div className="flex gap-2">
            {['fruit-catcher', 'laser-dodger', 'pixel-jump', 'color-match', 'tetri-block', 'grid-chase', 'glitch-sweeper', 'hex-shield'].includes(gameId) && (
              <>
                <button
                  id="btn-pad-left-mini"
                  onMouseDown={() => { keysPressed.current['arrowleft'] = true; }}
                  onMouseUp={() => { keysPressed.current['arrowleft'] = false; }}
                  onTouchStart={() => { keysPressed.current['arrowleft'] = true; }}
                  onTouchEnd={() => { keysPressed.current['arrowleft'] = false; }}
                  className="w-10 h-10 bg-zinc-900 active:bg-arcade-cyan border border-zinc-800 flex items-center justify-center text-white active:text-black rounded"
                >
                  ←
                </button>
                <button
                  id="btn-pad-right-mini"
                  onMouseDown={() => { keysPressed.current['arrowright'] = true; }}
                  onMouseUp={() => { keysPressed.current['arrowright'] = false; }}
                  onTouchStart={() => { keysPressed.current['arrowright'] = true; }}
                  onTouchEnd={() => { keysPressed.current['arrowright'] = false; }}
                  className="w-10 h-10 bg-zinc-900 active:bg-arcade-cyan border border-zinc-800 flex items-center justify-center text-white active:text-black rounded"
                >
                  →
                </button>
              </>
            )}
 
            {['laser-dodger', 'pixel-jump', 'grid-chase', 'glitch-sweeper'].includes(gameId) && (
              <>
                <button
                  id="btn-pad-up-mini"
                  onMouseDown={() => { keysPressed.current['arrowup'] = true; }}
                  onMouseUp={() => { keysPressed.current['arrowup'] = false; }}
                  onTouchStart={() => { keysPressed.current['arrowup'] = true; }}
                  onTouchEnd={() => { keysPressed.current['arrowup'] = false; }}
                  className="w-10 h-10 bg-zinc-900 active:bg-arcade-cyan border border-zinc-800 flex items-center justify-center text-white active:text-black rounded"
                >
                  ↑
                </button>
                <button
                  id="btn-pad-down-mini"
                  onMouseDown={() => { keysPressed.current['arrowdown'] = true; }}
                  onMouseUp={() => { keysPressed.current['arrowdown'] = false; }}
                  onTouchStart={() => { keysPressed.current['arrowdown'] = true; }}
                  onTouchEnd={() => { keysPressed.current['arrowdown'] = false; }}
                  className="w-10 h-10 bg-zinc-900 active:bg-arcade-cyan border border-zinc-800 flex items-center justify-center text-white active:text-black rounded"
                >
                  ↓
                </button>
              </>
            )}
 
            {gameId === 'glitch-sweeper' && (
              <>
                <button
                  id="btn-pad-sweeper-reveal"
                  onMouseDown={() => { keysPressed.current[' '] = true; }}
                  onMouseUp={() => { keysPressed.current[' '] = false; }}
                  onTouchStart={() => { keysPressed.current[' '] = true; }}
                  onTouchEnd={() => { keysPressed.current[' '] = false; }}
                  className="bg-arcade-pink font-arcade text-[9px] text-white px-3 py-2 border border-white rounded active:scale-95 transition"
                >
                  REVEAL
                </button>
                <button
                  id="btn-pad-sweeper-flag"
                  onMouseDown={() => { keysPressed.current['f'] = true; }}
                  onMouseUp={() => { keysPressed.current['f'] = false; }}
                  onTouchStart={() => { keysPressed.current['f'] = true; }}
                  onTouchEnd={() => { keysPressed.current['f'] = false; }}
                  className="bg-arcade-yellow font-arcade text-[9px] text-black px-3 py-2 border border-white rounded active:scale-95 transition"
                >
                  FLAG
                </button>
              </>
            )}

            {gameId === 'neon-golf' && (
              <button
                id="btn-pad-golf-shoot"
                onMouseDown={() => { keysPressed.current[' '] = true; }}
                onMouseUp={() => { keysPressed.current[' '] = false; }}
                onTouchStart={() => { keysPressed.current[' '] = true; }}
                onTouchEnd={() => { keysPressed.current[' '] = false; }}
                className="bg-arcade-cyan font-arcade text-[9px] text-black px-4 py-2 border border-white rounded active:scale-95 transition"
              >
                GOLF SHOT
              </button>
            )}
 
            {gameId === 'neon-drifter' && (
              <button
                id="btn-pad-drift-mini"
                onClick={() => { keysPressed.current[' '] = true; }}
                className="bg-arcade-pink font-arcade text-[9px] text-white px-4 py-2 border border-white rounded active:scale-95 transition"
              >
                DRIFT
              </button>
            )}
 
            {gameId === 'flappy-neon' && (
              <button
                id="btn-pad-flap-mini"
                onMouseDown={() => { keysPressed.current[' '] = true; }}
                onMouseUp={() => { keysPressed.current[' '] = false; }}
                onTouchStart={() => { keysPressed.current[' '] = true; }}
                onTouchEnd={() => { keysPressed.current[' '] = false; }}
                className="bg-arcade-yellow font-arcade text-[9px] text-black px-4 py-2 border border-white rounded active:scale-95 transition"
              >
                LOMPAT (FLAP)
              </button>
            )}
 
            {gameId === 'meteor-storm' && (
              <>
                <button
                  id="btn-pad-rot-left"
                  onMouseDown={() => { keysPressed.current['arrowleft'] = true; }}
                  onMouseUp={() => { keysPressed.current['arrowleft'] = false; }}
                  onTouchStart={() => { keysPressed.current['arrowleft'] = true; }}
                  onTouchEnd={() => { keysPressed.current['arrowleft'] = false; }}
                  className="w-10 h-10 bg-zinc-900 active:bg-arcade-cyan border border-zinc-800 flex items-center justify-center text-white active:text-black rounded"
                >
                  ↺
                </button>
                <button
                  id="btn-pad-rot-right"
                  onMouseDown={() => { keysPressed.current['arrowright'] = true; }}
                  onMouseUp={() => { keysPressed.current['arrowright'] = false; }}
                  onTouchStart={() => { keysPressed.current['arrowright'] = true; }}
                  onTouchEnd={() => { keysPressed.current['arrowright'] = false; }}
                  className="w-10 h-10 bg-zinc-900 active:bg-arcade-cyan border border-zinc-800 flex items-center justify-center text-white active:text-black rounded"
                >
                  ↻
                </button>
                <button
                  id="btn-pad-shoot"
                  onMouseDown={() => { keysPressed.current[' '] = true; }}
                  onMouseUp={() => { keysPressed.current[' '] = false; }}
                  onTouchStart={() => { keysPressed.current[' '] = true; }}
                  onTouchEnd={() => { keysPressed.current[' '] = false; }}
                  className="bg-arcade-cyan font-arcade text-[9px] text-black px-4 py-2 border border-white rounded active:scale-95 transition"
                >
                  TEMBAK
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const shieldColors = ['#ff007f', '#00f0ff', '#ffea00', '#7000ff'];
