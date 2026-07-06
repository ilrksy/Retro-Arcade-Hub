export type GameId = 
  | 'brick-breaker' 
  | 'space-defenders' 
  | 'neon-snake' 
  | 'memory-matrix' 
  | 'cyber-pong'
  | 'party-tap'
  | 'astro-race'
  | 'fruit-catcher'
  | 'laser-dodger'
  | 'color-match'
  | 'tetri-block'
  | 'math-blaster'
  | 'neon-drifter'
  | 'pixel-jump'
  | 'simon-retro'
  | 'whack-a-glitch'
  | 'speed-typer'
  | 'sumo-push'
  | 'bomb-tag'
  | 'grid-chase'
  | 'flappy-neon'
  | 'meteor-storm'
  | 'tug-of-war'
  | 'tank-neon'
  | 'paint-arena'
  | 'space-soccer'
  | 'neon-golf'
  | 'glitch-sweeper'
    | 'hex-shield'
    | 'pixel-painter'
    | 'cyber-runner'
    | 'neon-stacker'
    | 'copter-neon'
    | 'space-lander';

export interface GameMetadata {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  year: string;
  genre: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  accentColor: string;
  textColor: string;
  cabinetColor: string;
}

export interface HighScore {
  id: string;
  gameId: GameId;
  name: string;
  score: number;
  date: string;
  isCustom?: boolean;
}

export type GameStatus = 'IDLE' | 'STARTING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
