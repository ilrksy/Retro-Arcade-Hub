import React, { useState, useEffect } from 'react';
import { GameId, HighScore } from '../types';
import { Trophy, Star, User, Calendar, Trash2 } from 'lucide-react';

interface LeaderboardProps {
  selectedGameId: GameId;
  onClose?: () => void;
  newHighScoreToRegister?: {
    gameId: GameId;
    score: number;
    onRegistered: (name: string) => void;
  } | null;
}

// Initial retro seed scores if empty
const DEFAULT_SCORES: HighScore[] = [
  { id: '1', gameId: 'brick-breaker', name: 'N30N_RIDER', score: 2500, date: '2026-06-15' },
  { id: '2', gameId: 'brick-breaker', name: 'RETRO_BOY', score: 1800, date: '2026-06-20' },
  { id: '3', gameId: 'brick-breaker', name: 'CHAMP_88', score: 1200, date: '2026-07-01' },
  { id: '4', gameId: 'brick-breaker', name: 'G-BOT', score: 800, date: '2026-07-02' },

  { id: '5', gameId: 'space-defenders', name: 'X_WING_PRO', score: 5800, date: '2026-05-10' },
  { id: '6', gameId: 'space-defenders', name: 'METEOR_STRIKE', score: 4200, date: '2026-06-12' },
  { id: '7', gameId: 'space-defenders', name: 'CYBER_ACE', score: 3100, date: '2026-06-28' },
  { id: '8', gameId: 'space-defenders', name: 'STAR_DUST', score: 1500, date: '2026-07-03' },

  { id: '9', gameId: 'neon-snake', name: 'VIPER_99', score: 3200, date: '2026-04-18' },
  { id: '10', gameId: 'neon-snake', name: 'COBRA_KID', score: 2400, date: '2026-05-22' },
  { id: '11', gameId: 'neon-snake', name: 'ANACONDA', score: 1600, date: '2026-06-30' },
  { id: '12', gameId: 'neon-snake', name: 'SLITHER_BOT', score: 900, date: '2026-07-01' },

  { id: '13', gameId: 'memory-matrix', name: 'MIND_PALACE', score: 2800, date: '2026-03-05' },
  { id: '14', gameId: 'memory-matrix', name: 'BRAIN_IAC', score: 2100, date: '2026-05-14' },
  { id: '15', gameId: 'memory-matrix', name: 'NEURAL_LINK', score: 1400, date: '2026-06-29' },
  { id: '16', gameId: 'memory-matrix', name: 'CHIP_8', score: 600, date: '2026-07-02' },
];

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  selectedGameId, 
  newHighScoreToRegister,
  onClose
}) => {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('arcade_leaderboards');
    if (saved) {
      setScores(JSON.parse(saved));
    } else {
      setScores(DEFAULT_SCORES);
      localStorage.setItem('arcade_leaderboards', JSON.stringify(DEFAULT_SCORES));
    }
  }, []);

  const getGameTitle = (id: GameId) => {
    return id.replace('-', ' ').toUpperCase();
  };

  const getGameAccentColor = (id: GameId) => {
    switch (id) {
      case 'brick-breaker': return 'text-arcade-cyan border-arcade-cyan';
      case 'space-defenders': return 'text-arcade-yellow border-arcade-yellow';
      case 'neon-snake': return 'text-arcade-pink border-arcade-pink';
      case 'memory-matrix': return 'text-arcade-purple border-arcade-purple';
      case 'cyber-pong': return 'text-arcade-pink border-arcade-pink';
      case 'party-tap': return 'text-arcade-pink border-arcade-pink';
      case 'astro-race': return 'text-arcade-cyan border-arcade-cyan';
      case 'fruit-catcher': return 'text-emerald-400 border-emerald-500';
      case 'laser-dodger': return 'text-arcade-pink border-arcade-pink';
      case 'color-match': return 'text-arcade-yellow border-arcade-yellow';
      case 'tetri-block': return 'text-arcade-purple border-arcade-purple';
      case 'math-blaster': return 'text-arcade-cyan border-arcade-cyan';
      case 'neon-drifter': return 'text-arcade-pink border-arcade-pink';
      case 'pixel-jump': return 'text-arcade-yellow border-arcade-yellow';
      case 'simon-retro': return 'text-arcade-cyan border-arcade-cyan';
      case 'whack-a-glitch': return 'text-arcade-pink border-arcade-pink';
      case 'speed-typer': return 'text-emerald-400 border-emerald-500';
      case 'sumo-push': return 'text-arcade-purple border-arcade-purple';
      case 'bomb-tag': return 'text-arcade-pink border-arcade-pink';
      case 'grid-chase': return 'text-emerald-400 border-emerald-500';
      case 'flappy-neon': return 'text-arcade-yellow border-arcade-yellow';
      case 'meteor-storm': return 'text-arcade-purple border-arcade-purple';
      default: return 'text-arcade-cyan border-arcade-cyan';
    }
  };

  const filteredScores = scores
    .filter(s => s.gameId === selectedGameId)
    .sort((a, b) => b.score - a.score);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighScoreToRegister || playerName.length !== 3) return;

    const formattedName = playerName.trim().toUpperCase();
    const newEntry: HighScore = {
      id: Date.now().toString(),
      gameId: newHighScoreToRegister.gameId,
      name: formattedName,
      score: newHighScoreToRegister.score,
      date: new Date().toISOString().split('T')[0],
      isCustom: true
    };

    const updatedScores = [newEntry, ...scores];
    setScores(updatedScores);
    localStorage.setItem('arcade_leaderboards', JSON.stringify(updatedScores));

    // Keep individual highscore and name updated
    localStorage.setItem(`highscore_${newHighScoreToRegister.gameId}`, newHighScoreToRegister.score.toString());
    localStorage.setItem(`highscore_name_${newHighScoreToRegister.gameId}`, formattedName);

    setPlayerName('');
    newHighScoreToRegister.onRegistered(formattedName);
  };

  const clearScores = () => {
    if (window.confirm('Adakah anda pasti mahu set semula semua rekod papan pendahulu?')) {
      setScores(DEFAULT_SCORES);
      localStorage.setItem('arcade_leaderboards', JSON.stringify(DEFAULT_SCORES));
      localStorage.setItem('highscore_brick-breaker', '1000');
      localStorage.setItem('highscore_space-defenders', '2500');
      localStorage.setItem('highscore_neon-snake', '1500');
      localStorage.setItem('highscore_memory-matrix', '1200');

      const ALL_GAME_IDS: GameId[] = [
        'brick-breaker', 'space-defenders', 'neon-snake', 'memory-matrix', 'cyber-pong',
        'party-tap', 'astro-race', 'fruit-catcher', 'laser-dodger', 'color-match',
        'tetri-block', 'math-blaster', 'neon-drifter', 'pixel-jump', 'simon-retro',
        'whack-a-glitch', 'speed-typer', 'sumo-push', 'bomb-tag', 'grid-chase',
        'flappy-neon', 'meteor-storm', 'tug-of-war', 'tank-neon', 'paint-arena',
        'space-soccer', 'neon-golf', 'glitch-sweeper', 'hex-shield', 'pixel-painter',
        'cyber-runner', 'neon-stacker', 'copter-neon', 'space-lander'
      ];
      ALL_GAME_IDS.forEach(id => {
        localStorage.removeItem(`highscore_name_${id}`);
      });

      window.location.reload();
    }
  };

  return (
    <div className="bg-[#0C0C0F] border border-zinc-800/50 p-5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.8)] relative overflow-hidden font-sans">
      {/* Dynamic scanlines for that vintage ledger card aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none" />

      {/* High Score Submission Form Modal View */}
      {newHighScoreToRegister && (
        <div className="mb-6 bg-[#08080A]/90 border border-arcade-yellow p-4 text-center rounded-none relative z-10 animate-pulse">
          <h3 className="font-arcade text-xs text-arcade-yellow mb-2 glow-yellow">REKOD TERBARU DITUBUHKAN!</h3>
          <p className="text-zinc-300 text-xs mb-3 font-mono">
            Markah {newHighScoreToRegister.score} untuk <span className="text-arcade-cyan font-bold">{getGameTitle(newHighScoreToRegister.gameId)}</span>
          </p>
          <form onSubmit={handleSubmitScore} className="flex flex-col sm:flex-row gap-2 justify-center items-center">
            <input
              id="input-player-name"
              type="text"
              placeholder="AAA"
              maxLength={3}
              minLength={3}
              pattern="[A-Za-z]{3}"
              title="Sila masukkan tepat 3 huruf (A-Z)"
              required
              value={playerName}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                setPlayerName(val);
              }}
              className="bg-black border-2 border-arcade-yellow text-arcade-yellow text-center font-arcade text-sm tracking-widest p-2 rounded-none focus:outline-none focus:border-arcade-pink w-32 uppercase font-bold"
            />
            <button
              id="btn-submit-score"
              type="submit"
              className="w-full sm:w-auto bg-arcade-pink hover:bg-arcade-pink/80 text-white font-arcade text-[10px] px-4 py-2 border border-white cursor-pointer active:scale-95 transition"
            >
              DAFTAR
            </button>
          </form>
        </div>
      )}

      {/* Title */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800/50 relative z-10">
        <h3 className="font-arcade text-[10px] sm:text-xs text-zinc-300 flex items-center gap-2">
          <Trophy size={14} className="text-arcade-yellow" />
          PAPAN PENDARATAN: <span className={getGameAccentColor(selectedGameId)}>{getGameTitle(selectedGameId)}</span>
        </h3>
        
        <button
          id="btn-clear-leaderboard"
          onClick={clearScores}
          title="Reset Leaderboard"
          className="text-zinc-600 hover:text-red-500 transition cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-1.5 relative z-10">
        {filteredScores.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs font-mono">
            Tiada rekod lagi untuk permainan ini. Mulakan bermain!
          </div>
        ) : (
          filteredScores.map((scoreObj, index) => {
            const isTop3 = index < 3;
            const medalColors = ['text-arcade-yellow glow-yellow', 'text-arcade-cyan glow-cyan', 'text-arcade-pink glow-pink'];
            
            return (
              <div 
                key={scoreObj.id} 
                className={`flex justify-between items-center bg-[#08080A]/60 px-3 py-2 border-l-2 font-mono text-xs ${
                  scoreObj.isCustom ? 'border-arcade-cyan bg-arcade-cyan/5' : 'border-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-arcade text-[10px] w-6 text-center ${isTop3 ? medalColors[index] : 'text-zinc-500'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isTop3 ? <Star size={12} className={medalColors[index]} /> : <User size={12} className="text-zinc-600" />}
                    <span className={`font-arcade text-[10px] ${isTop3 ? 'text-zinc-200' : 'text-zinc-400'}`}>
                      {scoreObj.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-arcade text-[9px] text-arcade-yellow font-bold">
                    {scoreObj.score.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-600 hidden sm:flex items-center gap-1">
                    <Calendar size={10} />
                    {scoreObj.date}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
