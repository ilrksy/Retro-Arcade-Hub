import React, { useEffect, useState, useRef } from 'react';
import { GameStatus } from '../types';
import { audio } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, Lightbulb, Trophy } from 'lucide-react';

interface MemoryMatrixProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

export const MemoryMatrix: React.FC<MemoryMatrixProps> = ({ onGameOver, onExit }) => {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('highscore_memory-matrix') || '1200');
  });
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [muted, setMuted] = useState<boolean>(false);

  // Core Simon state
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [isDisplayingPattern, setIsDisplayingPattern] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(1); // 1 strike and you are out!

  const sequenceRef = useRef<number[]>([]);
  const activeBtnTimeoutRef = useRef<number | null>(null);
  const displayIdRef = useRef<number>(0);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    return () => {
      if (activeBtnTimeoutRef.current) clearTimeout(activeBtnTimeoutRef.current);
    };
  }, []);

  const startGame = () => {
    audio.playCoin();
    setScore(0);
    setLives(1);
    
    displayIdRef.current += 1;
    const currentId = displayIdRef.current;
    
    const initialSeq = [Math.floor(Math.random() * 9)];
    setSequence(initialSeq);
    sequenceRef.current = initialSeq;
    setGameStatus('PLAYING');
    
    // Stagger display of pattern slightly
    setTimeout(() => {
      if (currentId === displayIdRef.current) {
        displayPattern(initialSeq);
      }
    }, 800);
  };

  // Synthesizes individual frequencies for different matrix blocks
  const playMatrixSound = (index: number) => {
    if (muted) return;
    
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Mapping 9 grid buttons to sweet musical pentatonic scale
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequencies[index % frequencies.length], now);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.45);
  };

  const displayPattern = async (seq: number[]) => {
    setIsDisplayingPattern(true);
    const currentId = displayIdRef.current;
    
    for (let i = 0; i < seq.length; i++) {
      if (gameStatus !== 'PLAYING' || currentId !== displayIdRef.current) {
        setIsDisplayingPattern(false);
        return;
      }
      const btnIndex = seq[i];
      
      // Flash button on
      await new Promise<void>(resolve => {
        setActiveButton(btnIndex);
        playMatrixSound(btnIndex);
        
        setTimeout(() => {
          if (currentId === displayIdRef.current) {
            setActiveButton(null);
            setTimeout(resolve, 150);
          } else {
            resolve();
          }
        }, 400);
      });
    }
    
    if (currentId === displayIdRef.current) {
      setIsDisplayingPattern(false);
      setPlayerIndex(0);
    }
  };

  const handleButtonClick = (index: number) => {
    if (isDisplayingPattern || gameStatus !== 'PLAYING') return;

    setActiveButton(index);
    playMatrixSound(index);

    setTimeout(() => {
      setActiveButton(null);
    }, 150);

    // Verify move
    const currentSeq = sequenceRef.current;
    if (index === currentSeq[playerIndex]) {
      // Correct!
      const nextIndex = playerIndex + 1;
      
      if (nextIndex === currentSeq.length) {
        // Completed the sequence!
        const newScore = score + currentSeq.length * 100;
        setScore(newScore);
        
        displayIdRef.current += 1;
        const currentId = displayIdRef.current;
        
        // Add one more block to sequence
        const newSeq = [...currentSeq, Math.floor(Math.random() * 9)];
        setSequence(newSeq);
        sequenceRef.current = newSeq;

        // Play point earned sound
        setTimeout(() => {
          if (currentId === displayIdRef.current) {
            audio.playPoint();
          }
        }, 300);

        // Display next pattern after brief delay
        setTimeout(() => {
          if (currentId === displayIdRef.current) {
            displayPattern(newSeq);
          }
        }, 1000);
      } else {
        setPlayerIndex(nextIndex);
      }
    } else {
      // Strike!
      audio.playExplosion();
      setGameStatus('GAME_OVER');
      if (score > highScore) {
        audio.playGameOver();
        setTimeout(() => audio.playNewHighScore(), 150);
      } else {
        audio.playGameOver();
      }
      const newHigh = Math.max(score, highScore);
      setHighScore(newHigh);
      localStorage.setItem('highscore_memory-matrix', newHigh.toString());
      onGameOver(score);
    }
  };

  const gridButtons = [
    { color: 'border-arcade-pink shadow-arcade-pink/20 hover:bg-arcade-pink/10', glow: 'bg-arcade-pink shadow-arcade-pink/80' },
    { color: 'border-arcade-cyan shadow-arcade-cyan/20 hover:bg-arcade-cyan/10', glow: 'bg-arcade-cyan shadow-arcade-cyan/80' },
    { color: 'border-arcade-yellow shadow-arcade-yellow/20 hover:bg-arcade-yellow/10', glow: 'bg-arcade-yellow shadow-arcade-yellow/80' },
    { color: 'border-arcade-purple shadow-arcade-purple/20 hover:bg-arcade-purple/10', glow: 'bg-arcade-purple shadow-arcade-purple/80' },
    { color: 'border-emerald-500 shadow-emerald-500/20 hover:bg-emerald-500/10', glow: 'bg-emerald-500 shadow-emerald-500/80' },
    { color: 'border-amber-500 shadow-amber-500/20 hover:bg-amber-500/10', glow: 'bg-amber-500 shadow-amber-500/80' },
    { color: 'border-orange-500 shadow-orange-500/20 hover:bg-orange-500/10', glow: 'bg-orange-500 shadow-orange-500/80' },
    { color: 'border-sky-500 shadow-sky-500/20 hover:bg-sky-500/10', glow: 'bg-sky-500 shadow-sky-500/80' },
    { color: 'border-violet-500 shadow-violet-500/20 hover:bg-violet-500/10', glow: 'bg-violet-500 shadow-violet-500/80' }
  ];

  return (
    <div id="cabinet-memory-matrix" className="flex flex-col h-full bg-[#0d0c15] border-4 border-arcade-purple shadow-lg shadow-arcade-purple/30 rounded-none overflow-hidden crt-screen">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-black/80 px-4 py-2 border-b-2 border-arcade-purple font-arcade text-[10px] tracking-wider text-arcade-purple">
        <span className="flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-arcade-purple"></span> LIVE CABINET
        </span>
        <span className="glow-purple font-bold">MEMORY MATRIX</span>
        <button 
          id="btn-toggle-mute-mm"
          onClick={() => setMuted(!muted)} 
          className="hover:text-arcade-yellow transition"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Score Dashboard */}
      <div className="grid grid-cols-3 bg-black/90 p-3 text-center font-mono border-b border-arcade-purple/30 text-xs text-slate-400">
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">SCORE</div>
          <div className="font-bold text-arcade-yellow text-sm font-arcade">{score.toString().padStart(6, '0')}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">SEQUENCE</div>
          <div className="font-bold text-arcade-cyan text-sm font-arcade">
            {sequence.length > 0 ? `${playerIndex + 1}/${sequence.length}` : '0/0'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-arcade">HIGH SCORE</div>
          <div className="font-bold text-arcade-pink text-sm font-arcade">{Math.max(score, highScore).toString().padStart(6, '0')}</div>
        </div>
      </div>

      {/* Grid Canvas area */}
      <div className="relative flex-grow flex items-center justify-center bg-[#06050b] p-6 min-h-[320px]">
        
        {/* Retro Neon Matrix Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] aspect-square select-none">
          {gridButtons.map((btn, index) => {
            const isActive = activeButton === index;
            return (
              <button
                key={index}
                id={`btn-matrix-${index}`}
                disabled={isDisplayingPattern || gameStatus !== 'PLAYING'}
                onClick={() => handleButtonClick(index)}
                className={`
                  relative border-2 rounded-md aspect-square flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md
                  ${isActive ? btn.glow : btn.color}
                  ${(isDisplayingPattern || gameStatus !== 'PLAYING') ? 'cursor-not-allowed' : 'active:scale-95'}
                `}
              >
                {/* Center Core dot */}
                <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white scale-125' : 'bg-white/20'}`} />
              </button>
            );
          })}
        </div>

        {/* HUD Overlay States */}
        {gameStatus === 'IDLE' && (
          <div id="mm-overlay-idle" className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-purple glow-purple mb-3 leading-relaxed">INSERT COIN</h2>
            <p className="text-slate-400 text-xs max-w-xs mb-6 font-sans">
              Uji memori anda dengan meniru turutan cahaya dan melodi sintetik yang semakin panjang.
            </p>
            <button
              id="btn-start-mm"
              onClick={startGame}
              className="flex items-center gap-2 bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-xs px-6 py-3 border-2 border-white shadow-md shadow-arcade-pink/50 active:scale-95 transition"
            >
              <Play size={12} /> MULAKAN MEMORI
            </button>
          </div>
        )}

        {gameStatus === 'GAME_OVER' && (
          <div id="mm-overlay-gameover" className="absolute inset-0 flex flex-col justify-center items-center bg-black/95 text-center px-6">
            <h2 className="font-arcade text-lg text-arcade-pink glow-pink mb-2">NEURAL DESYNC</h2>
            <div className="text-slate-300 font-mono text-sm mb-1 font-arcade text-[10px] my-3">
              TURUTAN DIPELAJARI: <span className="text-arcade-yellow text-sm">{sequence.length - 1}</span>
            </div>
            <div className="text-slate-400 text-xs font-mono mb-4">
              MARKAH AKHIR: <span className="text-arcade-cyan">{score}</span>
            </div>
            {score > highScore && (
              <div className="text-arcade-yellow font-arcade text-[8px] animate-bounce mb-4 glow-yellow">
                REKOD BARU TERBENTUK!
              </div>
            )}
            <div className="flex gap-4">
              <button
                id="btn-retry-mm"
                onClick={startGame}
                className="flex items-center gap-2 bg-arcade-purple hover:bg-arcade-purple/80 text-white font-arcade text-xs px-4 py-2.5 border border-white active:scale-95 transition"
              >
                <RotateCcw size={12} /> CUBA LAGI
              </button>
              <button
                id="btn-exit-mm"
                onClick={onExit}
                className="bg-slate-700 hover:bg-slate-600 text-white font-arcade text-xs px-4 py-2.5 border border-slate-500 active:scale-95 transition"
              >
                KELUAR
              </button>
            </div>
          </div>
        )}

        {/* State Banner indicator (e.g. "WATCHING" vs "YOUR TURN") */}
        {gameStatus === 'PLAYING' && (
          <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
            <div className={`px-4 py-1 text-[8px] font-arcade border flex items-center gap-1.5 rounded-full bg-black/90 ${
              isDisplayingPattern 
                ? 'border-arcade-pink text-arcade-pink' 
                : 'border-arcade-cyan text-arcade-cyan animate-pulse'
            }`}>
              {isDisplayingPattern ? (
                <>
                  <Lightbulb size={10} className="animate-bounce" /> PERHATIKAN...
                </>
              ) : (
                <>
                  <Trophy size={10} /> REPLICATE SEKARANG!
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Decorative Arcade Console bezel base */}
      <div className="bg-black/90 border-t-2 border-arcade-purple/40 p-4 text-center font-arcade text-[8px] text-slate-500">
        TEKAN KOTAK MENGIKUT TURUTAN SAMA
      </div>
    </div>
  );
};
