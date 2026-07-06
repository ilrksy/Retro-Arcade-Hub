import React, { useEffect, useState } from 'react';
import { GameId } from '../types';

interface GamePreviewProps {
  gameId: GameId;
  accentColor: string;
  className?: string;
}

export default function GamePreview({ gameId, accentColor, className = "h-24 mb-3" }: GamePreviewProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full bg-[#030206] border border-zinc-900 overflow-hidden flex items-center justify-center ${className}`}>
      {/* CRT Scanline Scanlines Simulation */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[#140c1c]/15 pointer-events-none z-10" />
      
      {/* Dynamic Animated Preview Layouts based on gameId */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* GAME: Brick Breaker */}
        {gameId === 'brick-breaker' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-between">
            {/* Row of bricks */}
            <div className="grid grid-cols-6 gap-1">
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div 
                  key={idx} 
                  className={`h-2 border border-black transition-opacity duration-300 ${
                    idx === 1 && frame > 40 ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
                />
              ))}
            </div>
            {/* Ball bouncing */}
            <div 
              className="w-1.5 h-1.5 rounded-full absolute bg-white"
              style={{
                left: `${30 + Math.abs(50 - (frame % 100)) * 0.8}%`,
                bottom: `${20 + Math.abs(50 - ((frame + 25) % 100)) * 0.5}%`,
                boxShadow: '0 0 8px #fff'
              }}
            />
            {/* Paddle */}
            <div 
              className="h-1.5 w-10 mx-auto bg-arcade-cyan mb-1"
              style={{
                transform: `translateX(${(Math.abs(50 - (frame % 100)) - 25) * 0.8}px)`,
                boxShadow: '0 0 6px #00f0ff'
              }}
            />
          </div>
        )}

        {/* GAME: Space Defenders */}
        {gameId === 'space-defenders' && (
          <div className="w-full h-full relative p-2">
            {/* Invaders */}
            <div className="flex justify-around mt-1">
              {[0, 1, 2, 3].map(idx => (
                <div 
                  key={idx} 
                  className="text-[10px] animate-bounce"
                  style={{ 
                    color: accentColor, 
                    textShadow: `0 0 6px ${accentColor}`,
                    transform: `translateY(${idx % 2 === 0 ? '2px' : '-2px'})` 
                  }}
                >
                  👾
                </div>
              ))}
            </div>
            {/* Lasers shooting */}
            <div 
              className="w-0.5 h-3 bg-arcade-yellow absolute"
              style={{
                left: '50%',
                bottom: `${(frame * 1.5) % 100}%`,
                boxShadow: '0 0 6px #ffea00'
              }}
            />
            {/* Player space ship */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-arcade-cyan drop-shadow-[0_0_4px_#00f0ff]">
              ▲
            </div>
          </div>
        )}

        {/* GAME: Neon Snake */}
        {gameId === 'neon-snake' && (
          <div className="w-full h-full relative p-2">
            {/* Flashing food */}
            <div 
              className="w-1.5 h-1.5 rounded-full absolute bg-red-500 animate-ping"
              style={{ left: '70%', top: '40%' }}
            />
            <div 
              className="w-1.5 h-1.5 rounded-full absolute bg-red-500"
              style={{ left: '70%', top: '40%', boxShadow: '0 0 6px #ef4444' }}
            />
            {/* Crawling snake blocks */}
            {[0, 1, 2, 3, 4].map(idx => {
              const xOffset = 30 + (idx * 6) - (frame % 10);
              return (
                <div 
                  key={idx}
                  className="w-1.5 h-1.5 absolute animate-pulse"
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 0 4px ${accentColor}`,
                    left: `${xOffset}%`,
                    top: idx > 2 ? '40%' : `${30 + (idx * 3)}%`
                  }}
                />
              );
            })}
          </div>
        )}

        {/* GAME: Memory Matrix */}
        {gameId === 'memory-matrix' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
                const isLit = (idx + Math.floor(frame / 15)) % 3 === 0;
                return (
                  <div 
                    key={idx}
                    className="w-3.5 h-3.5 border border-zinc-900 transition-colors duration-300"
                    style={{
                      backgroundColor: isLit ? accentColor : 'transparent',
                      boxShadow: isLit ? `0 0 8px ${accentColor}` : 'none'
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* GAME: Cyber Pong */}
        {gameId === 'cyber-pong' && (
          <div className="w-full h-full relative p-2 flex items-center justify-between">
            {/* Left Paddle */}
            <div 
              className="w-1 h-6 bg-arcade-pink"
              style={{
                transform: `translateY(${(Math.sin(frame / 5) * 15)}px)`,
                boxShadow: '0 0 6px #ff007f'
              }}
            />
            {/* Moving Ball */}
            <div 
              className="w-2.5 h-2.5 bg-arcade-yellow rounded-none absolute"
              style={{
                left: `${15 + Math.abs(50 - (frame % 100)) * 1.4}%`,
                top: `${25 + Math.abs(50 - ((frame + 20) % 100)) * 1.0}%`,
                boxShadow: '0 0 8px #ffea00'
              }}
            />
            {/* Right Paddle */}
            <div 
              className="w-1 h-6 bg-arcade-cyan"
              style={{
                transform: `translateY(${(Math.sin((frame + 10) / 5) * 15)}px)`,
                boxShadow: '0 0 6px #00f0ff'
              }}
            />
          </div>
        )}

        {/* GAME: Party Tap */}
        {gameId === 'party-tap' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div className="relative w-16 h-16 rounded-full border border-zinc-850 flex items-center justify-center">
              {/* Expanding ripple ring */}
              <div 
                className="absolute border rounded-full transition-all duration-75"
                style={{
                  width: `${(frame % 20) * 4}px`,
                  height: `${(frame % 20) * 4}px`,
                  borderColor: accentColor,
                  opacity: (20 - (frame % 20)) / 20,
                  boxShadow: `0 0 8px ${accentColor}`
                }}
              />
              <div className="text-[10px] font-arcade animate-pulse text-white">TAP!</div>
            </div>
          </div>
        )}

        {/* GAME: Astro Race */}
        {gameId === 'astro-race' && (
          <div className="w-full h-full relative p-2 flex items-center justify-around">
            {[0, 1, 2].map(idx => {
              const speed = [1.2, 1.8, 1.5][idx];
              const pos = (frame * speed) % 100;
              const color = ['#ff007f', '#00f0ff', '#ffea00'][idx];
              return (
                <div 
                  key={idx}
                  className="relative flex flex-col items-center"
                  style={{ bottom: `${pos - 20}%` }}
                >
                  <div className="text-[11px]" style={{ color, textShadow: `0 0 6px ${color}` }}>🚀</div>
                  {/* Fire exhaust particles */}
                  <div className="w-1 h-2 bg-orange-500 animate-pulse mt-0.5" />
                </div>
              );
            })}
          </div>
        )}

        {/* GAME: Fruit Catcher */}
        {gameId === 'fruit-catcher' && (
          <div className="w-full h-full relative p-2">
            {/* Falling fruits */}
            <div 
              className="text-[10px] absolute animate-bounce"
              style={{
                left: '40%',
                top: `${(frame * 1.6) % 100}%`,
              }}
            >
              🍎
            </div>
            <div 
              className="text-[10px] absolute"
              style={{
                left: '70%',
                top: `${((frame + 50) * 1.6) % 100}%`,
              }}
            >
              ⭐
            </div>
            {/* Basket moving back and forth */}
            <div 
              className="absolute bottom-1 text-[12px] text-arcade-cyan drop-shadow-[0_0_6px_#00f0ff]"
              style={{
                left: `${35 + Math.sin(frame / 6) * 30}%`
              }}
            >
              🧺
            </div>
          </div>
        )}

        {/* GAME: Laser Dodger */}
        {gameId === 'laser-dodger' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-around">
            {/* Horizontal lasers */}
            <div 
              className="h-0.5 bg-red-500 w-full"
              style={{
                opacity: frame % 10 > 5 ? 1 : 0.2,
                boxShadow: '0 0 8px #ef4444'
              }}
            />
            {/* Character jumping up and down */}
            <div 
              className="text-[10px] absolute left-[45%]"
              style={{
                bottom: `${10 + Math.abs(Math.sin(frame / 4)) * 40}%`
              }}
            >
              🏃‍♂️
            </div>
            <div 
              className="h-0.5 bg-red-500 w-full"
              style={{
                opacity: (frame + 5) % 10 > 5 ? 1 : 0.2,
                boxShadow: '0 0 8px #ef4444'
              }}
            />
          </div>
        )}

        {/* GAME: Color Match */}
        {gameId === 'color-match' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            {/* Spinning color wheel */}
            <div 
              className="w-14 h-14 rounded-full border border-zinc-800 grid grid-cols-2 overflow-hidden"
              style={{
                transform: `rotate(${frame * 12}deg)`,
                boxShadow: '0 0 10px rgba(255,255,255,0.1)'
              }}
            >
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-500" />
              <div className="bg-green-500" />
            </div>
            <div className="absolute w-2 h-2 rounded-full bg-white shadow" />
          </div>
        )}

        {/* GAME: Tetri Block */}
        {gameId === 'tetri-block' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-end">
            <div className="w-16 mx-auto bg-zinc-950/80 border border-zinc-850 p-1 flex flex-col gap-0.5">
              {/* Fake stack */}
              <div className="grid grid-cols-4 gap-0.5">
                <div className="h-2 bg-arcade-cyan" style={{ boxShadow: '0 0 4px #00f0ff' }} />
                <div className="h-2 bg-arcade-cyan" style={{ boxShadow: '0 0 4px #00f0ff' }} />
                <div className="h-2 bg-zinc-900" />
                <div className="h-2 bg-arcade-pink" style={{ boxShadow: '0 0 4px #ff007f' }} />
              </div>
              <div className="grid grid-cols-4 gap-0.5">
                <div className="h-2 bg-arcade-yellow" style={{ boxShadow: '0 0 4px #ffea00' }} />
                <div className="h-2 bg-arcade-yellow" style={{ boxShadow: '0 0 4px #ffea00' }} />
                <div className="h-2 bg-arcade-yellow" style={{ boxShadow: '0 0 4px #ffea00' }} />
                <div className="h-2 bg-arcade-yellow" style={{ boxShadow: '0 0 4px #ffea00' }} />
              </div>
            </div>
            {/* Falling Tetrimino */}
            <div 
              className="absolute w-8 h-4 grid grid-cols-2 gap-0.5"
              style={{
                left: '42%',
                top: `${(frame * 1.2) % 65}%`
              }}
            >
              <div className="h-2 bg-arcade-pink" />
              <div className="h-2 bg-arcade-pink" />
            </div>
          </div>
        )}

        {/* GAME: Math Blaster */}
        {gameId === 'math-blaster' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-around items-center">
            <div className="text-[10px] font-arcade text-zinc-300">5 + 3 = ?</div>
            <div className="flex gap-4 font-arcade text-[10px]">
              <span className="text-red-500 animate-pulse">6</span>
              <span className="text-green-500 font-bold border border-green-500 px-1" style={{ boxShadow: '0 0 6px #22c55e' }}>8</span>
              <span className="text-blue-500">9</span>
            </div>
          </div>
        )}

        {/* GAME: Neon Drifter */}
        {gameId === 'neon-drifter' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40">
              <path d="M 10 20 Q 30 5, 50 20 T 90 20" fill="none" stroke="rgba(255,0,127,0.2)" strokeWidth="4" />
              <path d="M 10 20 Q 30 5, 50 20 T 90 20" fill="none" stroke="#ff007f" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 3px #ff007f)' }} />
            </svg>
            <div 
              className="absolute text-[12px] drop-shadow-[0_0_6px_#00f0ff]"
              style={{
                left: `${15 + (frame % 70)}%`,
                top: `${14 + Math.sin(frame / 4) * 8}px`,
                transform: `rotate(${Math.cos(frame / 4) * 20}deg)`
              }}
            >
              🏎️
            </div>
          </div>
        )}

        {/* GAME: Pixel Jump */}
        {gameId === 'pixel-jump' && (
          <div className="w-full h-full relative p-2 flex items-end justify-between">
            {/* Ground */}
            <div className="h-0.5 bg-zinc-800 w-full absolute bottom-1" />
            <div 
              className="text-[12px] absolute z-20"
              style={{
                left: '25%',
                bottom: `${4 + Math.max(0, Math.sin(frame / 3) * 25)}px`
              }}
            >
              🏃‍♂️
            </div>
            <div 
              className="text-[10px] absolute"
              style={{
                right: `${(frame * 1.8) % 100}%`,
                bottom: '4px'
              }}
            >
              🌵
            </div>
          </div>
        )}

        {/* GAME: Simon Retro */}
        {gameId === 'simon-retro' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-full bg-[#030206] border border-zinc-900">
              <div className="w-4 h-4 rounded-tl-full bg-green-950" style={{ backgroundColor: frame % 20 < 5 ? '#22c55e' : '', boxShadow: frame % 20 < 5 ? '0 0 8px #22c55e' : '' }} />
              <div className="w-4 h-4 rounded-tr-full bg-red-950" style={{ backgroundColor: (frame + 5) % 20 < 5 ? '#ef4444' : '', boxShadow: (frame + 5) % 20 < 5 ? '0 0 8px #ef4444' : '' }} />
              <div className="w-4 h-4 rounded-bl-full bg-yellow-950" style={{ backgroundColor: (frame + 10) % 20 < 5 ? '#eab308' : '', boxShadow: (frame + 10) % 20 < 5 ? '0 0 8px #eab308' : '' }} />
              <div className="w-4 h-4 rounded-br-full bg-blue-950" style={{ backgroundColor: (frame + 15) % 20 < 5 ? '#3b82f6' : '', boxShadow: (frame + 15) % 20 < 5 ? '0 0 8px #3b82f6' : '' }} />
            </div>
          </div>
        )}

        {/* GAME: Whack-a-Glitch */}
        {gameId === 'whack-a-glitch' && (
          <div className="w-full h-full relative p-2 flex items-center justify-around">
            {[0, 1, 2].map(idx => {
              const isUp = (idx + Math.floor(frame / 12)) % 3 === 0;
              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full">
                  <div className={`text-[12px] transition-transform duration-200 ${isUp ? 'translate-y-0 scale-100' : 'translate-y-4 scale-0 opacity-0'}`}>
                    👾
                  </div>
                  <div className="w-6 h-1.5 rounded-full bg-zinc-900 border border-zinc-800" />
                </div>
              );
            })}
          </div>
        )}

        {/* GAME: Speed Typer */}
        {gameId === 'speed-typer' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-around items-center">
            <div 
              className="font-arcade text-[10px] text-arcade-cyan absolute"
              style={{
                top: `${(frame * 1.1) % 65}%`,
                boxShadow: '0 0 4px rgba(0, 240, 255, 0.2)'
              }}
            >
              VITE
            </div>
            <div className="w-20 h-3 border border-zinc-900 bg-zinc-950 flex justify-around mt-auto mb-1">
              <div className="w-1 h-1 bg-zinc-800" />
              <div className="w-1 h-1 bg-zinc-800" />
              <div className="w-1 h-1 bg-zinc-800" />
            </div>
          </div>
        )}

        {/* GAME: Sumo Push */}
        {gameId === 'sumo-push' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-500/60 flex items-center justify-center relative">
              <div 
                className="w-4 h-4 rounded-full bg-red-600 border border-white absolute flex items-center justify-center text-[7px]"
                style={{
                  left: `${15 + Math.abs(20 - (frame % 40)) * 0.8}px`,
                  boxShadow: '0 0 6px #ef4444'
                }}
              >
                🔴
              </div>
              <div 
                className="w-4 h-4 rounded-full bg-blue-600 border border-white absolute flex items-center justify-center text-[7px]"
                style={{
                  right: `${15 + Math.abs(20 - (frame % 40)) * 0.8}px`,
                  boxShadow: '0 0 6px #3b82f6'
                }}
              >
                🔵
              </div>
            </div>
          </div>
        )}

        {/* GAME: Bomb Tag */}
        {gameId === 'bomb-tag' && (
          <div className="w-full h-full relative p-2 flex items-center justify-around">
            <div className="text-[10px] flex flex-col items-center">
              <span>🏃‍♂️</span>
              <span className="text-[6px] text-zinc-500 font-arcade">P1</span>
            </div>
            <div 
              className="text-[12px] absolute animate-bounce"
              style={{
                left: `${25 + Math.abs(50 - (frame % 100)) * 0.5}%`
              }}
            >
              💣
            </div>
            <div className="text-[10px] flex flex-col items-center">
              <span>🏃‍♀️</span>
              <span className="text-[6px] text-zinc-500 font-arcade">P2</span>
            </div>
          </div>
        )}

        {/* GAME: Pac Grid / Grid Chase */}
        {gameId === 'grid-chase' && (
          <div className="w-full h-full relative p-2">
            <div className="absolute inset-x-2 inset-y-1.5 border border-[#00f0ff]/30 grid grid-cols-4 grid-rows-3 opacity-30" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 text-[4px] text-yellow-400">
              <span>●</span>
              <span>●</span>
              <span>●</span>
            </div>
            <div 
              className="text-[12px] absolute drop-shadow-[0_0_6px_#ffea00]"
              style={{
                left: `${20 + (frame % 60)}%`,
                top: '40%'
              }}
            >
              {frame % 4 < 2 ? '😋' : '😮'}
            </div>
            <div 
              className="text-[12px] absolute drop-shadow-[0_0_6px_#ef4444]"
              style={{
                left: `${10 + (frame % 60)}%`,
                top: '40%'
              }}
            >
              👻
            </div>
          </div>
        )}

        {/* GAME: Flappy Neon */}
        {gameId === 'flappy-neon' && (
          <div className="w-full h-full relative p-2 flex items-center justify-between">
            <div 
              className="text-[12px] absolute drop-shadow-[0_0_6px_#ffea00]"
              style={{
                left: '25%',
                top: `${30 + Math.abs(Math.sin(frame / 4)) * 40}%`,
                transform: `rotate(${Math.cos(frame / 4) * -20}deg)`
              }}
            >
              🚀
            </div>
            <div 
              className="absolute w-2 bg-[#ffea00] h-8 top-0"
              style={{
                right: `${(frame * 1.5) % 100}%`,
                boxShadow: '0 0 6px #ffea00'
              }}
            />
            <div 
              className="absolute w-2 bg-[#ffea00] h-10 bottom-0"
              style={{
                right: `${(frame * 1.5) % 100}%`,
                boxShadow: '0 0 6px #ffea00'
              }}
            />
          </div>
        )}

        {/* GAME: Meteor Storm */}
        {gameId === 'meteor-storm' && (
          <div className="w-full h-full relative p-2">
            <div 
              className="absolute text-[12px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_6px_#00f0ff]"
              style={{
                transform: `translate(-50%, -50%) rotate(${frame * 15}deg)`
              }}
            >
              🚀
            </div>
            <div 
              className="text-[11px] absolute animate-pulse"
              style={{
                left: `${70 - (frame % 30) * 0.8}%`,
                top: `${20 + (frame % 30) * 0.5}%`
              }}
            >
              ☄️
            </div>
            <div 
              className="w-4 h-0.5 bg-arcade-cyan absolute"
              style={{
                left: `${50 + (frame % 25) * 1.5}%`,
                top: '52%',
                boxShadow: '0 0 6px #00f0ff'
              }}
            />
          </div>
        )}

        {/* GAME: Tug Of War */}
        {gameId === 'tug-of-war' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-center items-center">
            <div className="text-[7px] font-arcade text-zinc-500 mb-1 tracking-wider">TUG OF WAR</div>
            <div className="w-4/5 h-0.5 bg-zinc-800 relative flex items-center">
              <div 
                className="w-2 h-2 bg-red-500 rounded-none absolute"
                style={{ 
                  left: `${45 + Math.sin(frame / 6) * 18}%`, 
                  boxShadow: '0 0 6px #ef4444' 
                }}
              />
            </div>
            <div className="flex justify-between w-4/5 text-[8px] mt-1 text-arcade-cyan font-arcade">
              <span>◀ P1</span>
              <span className="text-arcade-pink">P2 ▶</span>
            </div>
          </div>
        )}

        {/* GAME: Tank Neon */}
        {gameId === 'tank-neon' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div className="absolute left-6 top-1/4 w-1.5 h-6 bg-zinc-800" />
            <div className="absolute right-6 bottom-1/4 w-1.5 h-6 bg-zinc-800" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-arcade-cyan text-[11px]">🚜</div>
            <div 
              className="w-1 h-1 rounded-full bg-arcade-pink absolute"
              style={{
                left: `${15 + (frame % 50) * 1.2}%`,
                top: '50%',
                boxShadow: '0 0 4px #ff007f'
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-arcade-pink text-[11px] scale-x-[-1]">🚜</div>
          </div>
        )}

        {/* GAME: Paint Arena */}
        {gameId === 'paint-arena' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-0.5 w-16">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(idx => {
                const colors = ['bg-[#ff007f]', 'bg-[#00f0ff]', 'bg-zinc-950', 'bg-[#ffea00]'];
                const colorIdx = (idx + Math.floor(frame / 12)) % colors.length;
                return (
                  <div 
                    key={idx} 
                    className={`h-2.5 w-3.5 border border-zinc-900 transition-all duration-300 ${colors[colorIdx]}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* GAME: Space Soccer */}
        {gameId === 'space-soccer' && (
          <div className="w-full h-full relative p-1 flex items-center justify-between">
            <div className="h-8 w-1 bg-arcade-cyan" />
            <div 
              className="text-[11px] absolute"
              style={{
                left: `${15 + Math.abs(50 - (frame % 100)) * 1.3}%`,
                top: `${20 + Math.abs(50 - ((frame + 40) % 100)) * 0.7}%`
              }}
            >
              ⚽
            </div>
            <div className="h-8 w-1 bg-arcade-pink" />
          </div>
        )}

        {/* GAME: Neon Golf */}
        {gameId === 'neon-golf' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="text-[8px] leading-none">🚩</span>
              <div className="w-3 h-1 bg-black border border-emerald-500 rounded-full" />
            </div>
            <div 
              className="w-1.5 h-1.5 rounded-full bg-white absolute"
              style={{
                left: `${12 + (frame % 65)}%`,
                top: `${48 + Math.sin(frame / 6) * 6}%`,
                boxShadow: '0 0 4px #fff'
              }}
            />
          </div>
        )}

        {/* GAME: Glitch Sweeper */}
        {gameId === 'glitch-sweeper' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center scale-90">
            <div className="grid grid-cols-3 gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
                const isRevealed = idx === 1 || idx === 3 || idx === 8;
                const isFlagged = idx === 4;
                return (
                  <div 
                    key={idx} 
                    className="w-3.5 h-3.5 border border-zinc-900 flex items-center justify-center text-[7px]"
                    style={{ backgroundColor: isRevealed ? '#111019' : '#27272a' }}
                  >
                    {isRevealed && idx === 1 && <span className="text-arcade-cyan font-bold font-mono">1</span>}
                    {isRevealed && idx === 3 && <span className="text-arcade-pink font-bold font-mono">👾</span>}
                    {isFlagged && <span className="text-arcade-yellow font-bold font-mono">🚩</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GAME: Hex Shield */}
        {gameId === 'hex-shield' && (
          <div className="w-full h-full relative p-2 flex items-center justify-center">
            <div 
              className="w-8 h-8 border border-arcade-cyan relative flex items-center justify-center"
              style={{ 
                transform: `rotate(${frame * 3}deg)`, 
                borderRadius: '30%',
                boxShadow: '0 0 6px rgba(0,240,255,0.15)'
              }}
            >
              <div className="w-1 h-4 bg-arcade-pink absolute top-0" />
            </div>
            <div 
              className="w-1 h-1 bg-red-500 absolute"
              style={{
                right: `${10 + (frame % 35) * 1.6}%`,
                top: '50%',
                boxShadow: '0 0 4px #ef4444'
              }}
            />
          </div>
        )}

        {/* GAME: Pixel Painter */}
        {gameId === 'pixel-painter' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-around items-center">
            <div className="text-[7px] font-mono text-zinc-500 tracking-wider">TAP MATCH</div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(idx => {
                const isActive = (idx + Math.floor(frame / 8)) % 3 === 0;
                const colors = ['bg-[#ff007f]', 'bg-[#00f0ff]', 'bg-[#ffea00]'];
                return (
                  <div 
                    key={idx} 
                    className={`w-4 h-4 border border-zinc-900 transition-all ${
                      isActive ? colors[idx] : 'bg-zinc-900'
                    }`}
                    style={{ boxShadow: isActive ? '0 0 4px currentColor' : 'none' }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* GAME: Cyber Runner */}
        {gameId === 'cyber-runner' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-end">
            <div className="absolute inset-x-2 bottom-4 h-[1px] bg-arcade-pink opacity-50" />
            <div 
              className="text-[12px] absolute z-20"
              style={{
                left: '20%',
                bottom: `${4 + Math.max(0, Math.sin(frame / 2.5) * 18)}px`
              }}
            >
              🏃‍♂️
            </div>
            <div 
              className="w-1.5 h-3 bg-arcade-cyan absolute"
              style={{
                right: `${(frame * 2.2) % 100}%`,
                bottom: '16px',
                boxShadow: '0 0 6px #00f0ff'
              }}
            />
            <div 
              className="w-1 h-1 rounded-full bg-arcade-yellow absolute"
              style={{
                right: `${((frame + 40) * 1.8) % 100}%`,
                bottom: '16px',
                boxShadow: '0 0 4px #ffea00'
              }}
            />
          </div>
        )}

        {/* GAME: Cyber Stacker */}
        {gameId === 'neon-stacker' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-end items-center gap-0.5">
            {/* Placed stacked rows */}
            <div className="w-16 h-1.5 bg-arcade-purple" style={{ backgroundColor: '#7000ff', boxShadow: '0 0 4px #7000ff' }} />
            <div className="w-12 h-1.5 bg-arcade-cyan" style={{ backgroundColor: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} />
            <div className="w-12 h-1.5 bg-arcade-pink" style={{ backgroundColor: '#ff007f', boxShadow: '0 0 4px #ff007f' }} />
            {/* Active sliding row */}
            <div 
              className="w-8 h-1.5 bg-arcade-yellow absolute"
              style={{
                backgroundColor: '#ffea00',
                boxShadow: '0 0 6px #ffea00',
                left: `${15 + Math.abs(50 - (frame % 100)) * 1.1}%`,
                bottom: '24px'
              }}
            />
          </div>
        )}

        {/* GAME: Neon Copter */}
        {gameId === 'copter-neon' && (
          <div className="w-full h-full relative p-1">
            {/* Flashing cave ceiling and floor boundary */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#00ff66]/30 border-b border-[#00ff66] shadow-[0_1px_4px_#00ff66]" />
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#00ff66]/30 border-t border-[#00ff66] shadow-[0_-1px_4px_#00ff66]" />
            {/* Scrolling obstacle */}
            <div 
              className="w-2.5 h-2.5 bg-arcade-cyan absolute rotate-45"
              style={{
                right: `${(frame * 1.6) % 100}%`,
                top: '40%',
                boxShadow: '0 0 6px #00f0ff'
              }}
            />
            {/* Hovering player helicopter */}
            <div 
              className="text-[12px] absolute"
              style={{
                left: '20%',
                top: `${35 + Math.sin(frame / 3.5) * 15}%`,
                textShadow: '0 0 6px #ff007f'
              }}
            >
              🛸
            </div>
          </div>
        )}

        {/* GAME: Neon Lander */}
        {gameId === 'space-lander' && (
          <div className="w-full h-full relative p-2 flex flex-col justify-between items-center">
            {/* Floating stars */}
            <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-2 left-6 animate-pulse" />
            <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-4 right-10 animate-pulse" />
            {/* Rocket Modules descending */}
            <div 
              className="text-[11px] absolute"
              style={{
                top: `${10 + Math.abs(40 - (frame % 80)) * 0.9}%`,
                left: `${25 + (frame % 80) * 0.4}%`,
                transform: `rotate(${Math.sin(frame / 5) * 12}deg)`,
                textShadow: '0 0 6px #ffea00'
              }}
            >
              🛸
              {/* Flame spark */}
              {frame % 4 < 2 && <div className="text-[6px] absolute -bottom-1 left-1.5 text-orange-500">🔥</div>}
            </div>
            {/* Ground Landing Pad */}
            <div className="w-14 h-1 bg-[#00f0ff] mt-auto shadow-[0_0_8px_#00f0ff] border-t border-white" />
          </div>
        )}

      </div>
    </div>
  );
}
