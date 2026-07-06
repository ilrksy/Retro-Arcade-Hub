import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameId, GameMetadata, GameStatus } from './types';
import { BrickBreaker } from './components/BrickBreaker';
import { SpaceDefenders } from './components/SpaceDefenders';
import { NeonSnake } from './components/NeonSnake';
import { MemoryMatrix } from './components/MemoryMatrix';
import { CyberPong } from './components/CyberPong';
import { Leaderboard } from './components/Leaderboard';
import { ArcadeMiniSuite } from './components/ArcadeMiniSuite';
import GamePreview from './components/GamePreview';
import { audio } from './utils/audio';
import { 
  Trophy, 
  Gamepad2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Info, 
  ArrowLeft, 
  Flame, 
  Coins, 
  Play, 
  Star,
  Maximize2,
  Minimize2,
  Search,
  LayoutGrid,
  Grid,
  ChevronRight
} from 'lucide-react';

const GAMES: GameMetadata[] = [
  {
    id: 'brick-breaker',
    title: 'BRICK BREAKER',
    tagline: 'Pecahkan Blok Neon!',
    description: 'Permainan memantulkan bola klasik dengan kelajuan berganda dan kesan zarah letupan neon.',
    year: '1986',
    genre: 'ACTION / BALL',
    difficulty: 'MEDIUM',
    accentColor: '#00f0ff',
    textColor: 'text-arcade-cyan',
    cabinetColor: 'shadow-arcade-cyan/20 border-arcade-cyan',
  },
  {
    id: 'space-defenders',
    title: 'SPACE DEFENDERS',
    tagline: 'Pertahankan Sektor Suria!',
    description: 'Retro space shooter intensif dengan pergerakan melintang dan serangan armada makhluk asing bertahap.',
    year: '1978',
    genre: 'SHOOTER / SCI-FI',
    difficulty: 'HARD',
    accentColor: '#ffea00',
    textColor: 'text-arcade-yellow',
    cabinetColor: 'shadow-arcade-yellow/20 border-arcade-yellow',
  },
  {
    id: 'neon-snake',
    title: 'NEON SNAKE',
    tagline: 'Membesar & Menggelongsor!',
    description: 'Mengendali ular neon lincah untuk memakan kuasa tenaga merah, elakkan pelanggaran dinding dalam kelajuan ekstrim.',
    year: '1976',
    genre: 'ARCADE / GRID',
    difficulty: 'EASY',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'memory-matrix',
    title: 'MEMORY MATRIX',
    tagline: 'Uji Sel Memori Saraf!',
    description: 'Papan matrik Simon dengan nada muzik sintetik berasingan. Replikasi turutan cahaya untuk membina markah tinggi.',
    year: '1981',
    genre: 'PUZZLE / BRAIN',
    difficulty: 'MEDIUM',
    accentColor: '#7000ff',
    textColor: 'text-arcade-purple',
    cabinetColor: 'shadow-arcade-purple/20 border-arcade-purple',
  },
  {
    id: 'cyber-pong',
    title: 'CYBER PONG',
    tagline: 'Glow Pong vs Pintar AI!',
    description: 'Permainan pong neon klasik menentang komputer pintar. Sokong kawalan tetikus lancar dan sentuhan mana-mana peranti.',
    year: '1972',
    genre: 'ACTION / CLASSIC',
    difficulty: 'MEDIUM',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'party-tap',
    title: 'PARTY TAP',
    tagline: 'BATTLE KELAJUAN TAP! (1-5 P)',
    description: 'Parti mashing berbilang pemain tempatan yang kelakar! Pilih sehingga 5 pemain dan ketuk skrin atau papan kekunci secepat mungkin.',
    year: '1990',
    genre: 'PARTY / MULTIPLAYER',
    difficulty: 'EASY',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'astro-race',
    title: 'ASTRO RACE',
    tagline: 'LUMBA ANGKASA! (1-5 P)',
    description: 'Lumba kapal angkasa retro sehingga 5 pemain! Pandu ke atas garisan penamat sambil mengelak batu asteroid.',
    year: '1989',
    genre: 'RACING / MULTIPLAYER',
    difficulty: 'MEDIUM',
    accentColor: '#00f0ff',
    textColor: 'text-arcade-cyan',
    cabinetColor: 'shadow-arcade-cyan/20 border-arcade-cyan',
  },
  {
    id: 'fruit-catcher',
    title: 'FRUIT CATCHER',
    tagline: 'Tangkap Buah Neon!',
    description: 'Gerakkan bakul neon anda untuk mengumpul buah neon hijau dan emas yang gugur. Elakkan bom merah!',
    year: '1982',
    genre: 'ACTION / CATCH',
    difficulty: 'EASY',
    accentColor: '#00ff66',
    textColor: 'text-emerald-400',
    cabinetColor: 'shadow-emerald-500/20 border-emerald-500',
  },
  {
    id: 'laser-dodger',
    title: 'LASER DODGER',
    tagline: 'Elak Pancaran Laser!',
    description: 'Dodge grid tembakan laser neon maut dalam arena 2D. Sangat mencabar saraf tindak balas anda!',
    year: '1984',
    genre: 'SURVIVAL / DODGE',
    difficulty: 'HARD',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'color-match',
    title: 'COLOR MATCH',
    tagline: 'Tukar Perisai Cahaya!',
    description: 'Pusingkan perisai 4-sektor untuk menyerap bebola warna-warni yang datang dari luar angkasa.',
    year: '1983',
    genre: 'PUZZLE / ACTION',
    difficulty: 'MEDIUM',
    accentColor: '#ffea00',
    textColor: 'text-arcade-yellow',
    cabinetColor: 'shadow-arcade-yellow/20 border-arcade-yellow',
  },
  {
    id: 'tetri-block',
    title: 'TETRI BLOCK',
    tagline: 'Susun Bata Melintang!',
    description: 'Turunkan blok berwarna-warni dan penuhkan barisan melintang untuk mengosongkan skrin bagi skor mega.',
    year: '1985',
    genre: 'PUZZLE / RETRO',
    difficulty: 'MEDIUM',
    accentColor: '#7000ff',
    textColor: 'text-arcade-purple',
    cabinetColor: 'shadow-arcade-purple/20 border-arcade-purple',
  },
  {
    id: 'math-blaster',
    title: 'MATH BLASTER',
    tagline: 'Tembak Formula Matematik!',
    description: 'Uji pengiraan pantas anda! Formula matematik retro jatuh dan anda perlu menembak jawapan yang betul.',
    year: '1988',
    genre: 'EDUCATIONAL / SHOOTER',
    difficulty: 'MEDIUM',
    accentColor: '#00f0ff',
    textColor: 'text-arcade-cyan',
    cabinetColor: 'shadow-arcade-cyan/20 border-arcade-cyan',
  },
  {
    id: 'neon-drifter',
    title: 'NEON DRIFTER',
    tagline: 'Drift Pada Lebuhraya Grid!',
    description: 'Kawal kereta sukan neon di laluan zig-zag. Tekan spacebar atau skrin untuk menukar arah drift.',
    year: '1992',
    genre: 'RACING / DRIFT',
    difficulty: 'MEDIUM',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'pixel-jump',
    title: 'PIXEL JUMPER',
    tagline: 'Melompat Tanpa Sempadan!',
    description: 'Melompat dari platform ke platform setinggi mungkin. Arahkan pergerakan menggunakan anak panah.',
    year: '1987',
    genre: 'PLATFORMER / JUMP',
    difficulty: 'EASY',
    accentColor: '#ffea00',
    textColor: 'text-arcade-yellow',
    cabinetColor: 'shadow-arcade-yellow/20 border-arcade-yellow',
  },
  {
    id: 'simon-retro',
    title: 'SIMON RETRO',
    tagline: 'Ikut Turutan Lampu Klasik!',
    description: 'Klasik Simon Says. Ingat sekuensi nyalaan pad neon dan bunyi sintetik retro, kemudian replikasi sekuensi.',
    year: '1979',
    genre: 'MEMORY / MUSIC',
    difficulty: 'MEDIUM',
    accentColor: '#00f0ff',
    textColor: 'text-arcade-cyan',
    cabinetColor: 'shadow-arcade-cyan/20 border-arcade-cyan',
  },
  {
    id: 'whack-a-glitch',
    title: 'WHACK A GLITCH',
    tagline: 'Ketuk Glitch Arked!',
    description: 'Whack-a-mole retro neon. Glitch muncul pada grid 3x3 secara rawak, ketuk secepat mungkin dalam had masa.',
    year: '1991',
    genre: 'REACTION / SPEED',
    difficulty: 'EASY',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'speed-typer',
    title: 'SPEED TYPER',
    tagline: 'Blaster Perkataan Neon!',
    description: 'Taip perkataan retro yang jatuh secepat mungkin untuk menembaknya sebelum menyentuh bahagian bawah kabinet.',
    year: '1993',
    genre: 'EDUCATION / TYPING',
    difficulty: 'MEDIUM',
    accentColor: '#00ff66',
    textColor: 'text-emerald-400',
    cabinetColor: 'shadow-emerald-500/20 border-emerald-500',
  },
  {
    id: 'sumo-push',
    title: 'BUMPER SUMO',
    tagline: 'TOLAK LAWAN KELUAR! (1-5 P)',
    description: 'Parti bumper fizik neon yang mendebarkan! Halakan arah panah anda, mashing butang untuk melanggar dan menolak pemain lain keluar dari arena yang semakin mengecil!',
    year: '1990',
    genre: 'ACTION / MULTIPLAYER',
    difficulty: 'MEDIUM',
    accentColor: '#7000ff',
    textColor: 'text-arcade-purple',
    cabinetColor: 'shadow-arcade-purple/20 border-arcade-purple',
  },
  {
    id: 'bomb-tag',
    title: 'NEON BOMB TAG',
    tagline: 'PAS BOM SEBELUM BOOM! (1-5 P)',
    description: 'Permainan tag bom hot-potato neon! Seorang pemain membawa bom jangka yang akan meletup. Langgar pemain lain untuk memindahkan bom tersebut sebelum masa tamat!',
    year: '1991',
    genre: 'PARTY / MULTIPLAYER',
    difficulty: 'HARD',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'grid-chase',
    title: 'PAC GRID',
    tagline: 'Makan Semua Pelet Neon!',
    description: 'Maju dalam labirin grid neon untuk memakan pelet cahaya kuning! Elak hantu virus merah yang mengejar rapat anda.',
    year: '1980',
    genre: 'MAZE / CHASE',
    difficulty: 'MEDIUM',
    accentColor: '#00ff66',
    textColor: 'text-emerald-400',
    cabinetColor: 'shadow-emerald-500/20 border-emerald-500',
  },
  {
    id: 'flappy-neon',
    title: 'FLAPPY NEON',
    tagline: 'Terbang Melintasi Tiang!',
    description: 'Kawal kapal neon mini untuk terbang melepasi sela-sela tiang bangunan elektrik pencakar langit neon yang menjulang tinggi.',
    year: '1989',
    genre: 'ACTION / TAP',
    difficulty: 'HARD',
    accentColor: '#ffea00',
    textColor: 'text-arcade-yellow',
    cabinetColor: 'shadow-arcade-yellow/20 border-arcade-yellow',
  },
  {
    id: 'meteor-storm',
    title: 'METEOR STORM',
    tagline: 'Letupkan Asteroid Gergasi!',
    description: 'Pusing dan tembak laser gila ke arah asteroid neon yang meluncur pantas dari segenap penjuru ruang angkasa!',
    year: '1982',
    genre: 'SHOOTER / RETRO',
    difficulty: 'HARD',
    accentColor: '#7000ff',
    textColor: 'text-arcade-purple',
    cabinetColor: 'shadow-arcade-purple/20 border-arcade-purple',
  },
  {
    id: 'tug-of-war',
    title: 'NEON TUG OF WAR',
    tagline: 'TARIK TALI NEON! (1-5 P)',
    description: 'Parti mengetuk butang yang bertenaga gila! Dua kumpulan (atau pemain vs CPU) mengetuk butang mereka secepat mungkin untuk menarik bendera neon ke kawasan mereka.',
    year: '1987',
    genre: 'PARTY / MULTIPLAYER',
    difficulty: 'EASY',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'tank-neon',
    title: 'NEON TANK BATTLE',
    tagline: 'TEMBAK MEKANIKAL NEON! (1-5 P)',
    description: 'Kawal kereta kebal mini bercahaya anda. Pusing, bergerak, dan lepaskan peluru neon maut untuk menghapuskan kereta kebal musuh dalam arena grid maze.',
    year: '1984',
    genre: 'ACTION / MULTIPLAYER',
    difficulty: 'HARD',
    accentColor: '#00f0ff',
    textColor: 'text-arcade-cyan',
    cabinetColor: 'shadow-arcade-cyan/20 border-arcade-cyan',
  },
  {
    id: 'paint-arena',
    title: 'NEON PAINT ARENA',
    tagline: 'WARNAKAN GRID ARENA! (1-5 P)',
    description: 'Luncurkan kenderaan bercahaya anda di atas jubin untuk mengecat warna tersendiri. Pemain dengan peratusan liputan warna tertinggi selepas masa tamat diisytihar juara!',
    year: '1992',
    genre: 'ARCADE / MULTIPLAYER',
    difficulty: 'MEDIUM',
    accentColor: '#ffea00',
    textColor: 'text-arcade-yellow',
    cabinetColor: 'shadow-arcade-yellow/20 border-arcade-yellow',
  },
  {
    id: 'space-soccer',
    title: 'NEON SPACE SOCCER',
    tagline: 'BOLA SEPAK ANGKASA! (1-5 P)',
    description: 'Bumper fizik bola sepak neon! Langgar dan heret bola tenaga gergasi ke dalam pintu gol pihak lawan sambil mempertahankan gawang anda.',
    year: '1993',
    genre: 'SPORTS / MULTIPLAYER',
    difficulty: 'MEDIUM',
    accentColor: '#00ff66',
    textColor: 'text-emerald-400',
    cabinetColor: 'shadow-emerald-500/20 border-emerald-500',
  },
  {
    id: 'neon-golf',
    title: 'NEON MINI GOLF',
    tagline: 'PANCARAN BOLA KE LUBANG!',
    description: 'Tarik, halakan anak panah kuasa, dan lepaskan bola mini neon melepasi halangan gila untuk mendarat dalam lubang hitam yang bercahaya gemerlap.',
    year: '1988',
    genre: 'PUZZLE / PHYSICS',
    difficulty: 'MEDIUM',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'glitch-sweeper',
    title: 'CYBER SWEEPER',
    tagline: 'NYAHKOD SEL GLITCH!',
    description: 'Versi Minesweeper klasik berwajah futuristik! Tekan sel untuk mendedahkan nombor dan letakkan bendera isyarat pada pepijat glitch maut.',
    year: '1981',
    genre: 'PUZZLE / STRATEGY',
    difficulty: 'MEDIUM',
    accentColor: '#7000ff',
    textColor: 'text-arcade-purple',
    cabinetColor: 'shadow-arcade-purple/20 border-arcade-purple',
  },
  {
    id: 'hex-shield',
    title: 'NEON HEX SHIELD',
    tagline: 'PUTAR PERISAI SEGI ENAM!',
    description: 'Pusingkan perisai hexagon anda untuk menyesuaikan warna bahagian dengan bebola laser maut yang membedil dari luar.',
    year: '1986',
    genre: 'DEFENSE / ACTION',
    difficulty: 'HARD',
    accentColor: '#00f0ff',
    textColor: 'text-arcade-cyan',
    cabinetColor: 'shadow-arcade-cyan/20 border-arcade-cyan',
  },
  {
    id: 'pixel-painter',
    title: 'PIXEL TAP PAINTER',
    tagline: 'KETUK REFLEKS WARNA! (1-5 P)',
    description: 'Uji kepekaan tindak balas saraf mata dan jari anda! Ketuk pad tepat pada detik jubin warna berubah sepadan dengan warna sasaran anda.',
    year: '1991',
    genre: 'REFLEX / MULTIPLAYER',
    difficulty: 'EASY',
    accentColor: '#00ff66',
    textColor: 'text-emerald-400',
    cabinetColor: 'shadow-emerald-500/20 border-emerald-500',
  },
  {
    id: 'cyber-runner',
    title: 'CYBER RUNNER',
    tagline: 'LARI & LOMPAT DI ATAS GRID!',
    description: 'Lari tanpa henti di lebuhraya grid neon! Lompat melepasi penghalang siber maut dan tunduk di bawah laser plasma dengan tindak balas pantas.',
    year: '1988',
    genre: 'ACTION / RUNNER',
    difficulty: 'MEDIUM',
    accentColor: '#ffaa00',
    textColor: 'text-amber-400',
    cabinetColor: 'shadow-amber-500/20 border-amber-500',
  },
  {
    id: 'neon-stacker',
    title: 'CYBER STACKER',
    tagline: 'SUSUN BLOK SAKTI NEON!',
    description: 'Klasik permainan arked menimbun blok! Tebas dan susun blok bergerak sebaris demi sebaris ke langit. Elak lebihan blok dipotong atau permainan tamat!',
    year: '1995',
    genre: 'ARCADE / REFLEX',
    difficulty: 'MEDIUM',
    accentColor: '#00f0ff',
    textColor: 'text-arcade-cyan',
    cabinetColor: 'shadow-arcade-cyan/20 border-arcade-cyan',
  },
  {
    id: 'copter-neon',
    title: 'NEON COPTER',
    tagline: 'NAVIGASI GUA ELEKTRIK!',
    description: 'Kawal helikopter neon merentasi gua elektrik yang sempit dan berliku. Pegang untuk terbang tinggi, lepas untuk jatuh, sambil mengelak dinding dan blok maut!',
    year: '1982',
    genre: 'SURVIVAL / CAVER',
    difficulty: 'HARD',
    accentColor: '#ff007f',
    textColor: 'text-arcade-pink',
    cabinetColor: 'shadow-arcade-pink/20 border-arcade-pink',
  },
  {
    id: 'space-lander',
    title: 'NEON LANDER',
    tagline: 'PENDARATAN GRAVITI ANGKASA!',
    description: 'Kemudi modul pendarat angkasa lepas menentang graviti bulan. Kawal tujahan dan sudut condong pendaratan dengan selamat di atas tapak bercahaya sebelum kehabisan bahan api.',
    year: '1979',
    genre: 'PHYSICS / CLASSIC',
    difficulty: 'HARD',
    accentColor: '#ffea00',
    textColor: 'text-arcade-yellow',
    cabinetColor: 'shadow-arcade-yellow/20 border-arcade-yellow',
  }
];

const glitchVariants = {
  initial: {
    opacity: 0,
    x: 0,
    skewX: 0,
    filter: 'hue-rotate(0deg) brightness(1) contrast(1)',
    scaleY: 1,
  },
  animate: {
    opacity: [0, 0.8, 0.4, 1, 0.9, 1],
    x: [0, -10, 15, -8, 5, 0],
    skewX: [0, 8, -8, 4, -4, 0],
    filter: [
      'hue-rotate(0deg) brightness(1) contrast(1)',
      'hue-rotate(60deg) brightness(1.4) contrast(1.3)',
      'hue-rotate(-30deg) brightness(0.8) contrast(1)',
      'hue-rotate(120deg) brightness(1.6) contrast(1.5)',
      'hue-rotate(0deg) brightness(1.1) contrast(1)',
      'hue-rotate(0deg) brightness(1) contrast(1)',
    ],
    scaleY: [1, 0.85, 1.15, 0.95, 1.05, 1],
    transition: {
      duration: 0.35,
      ease: "easeInOut",
    }
  },
  exit: {
    opacity: [1, 0.6, 0.8, 0],
    x: [0, 12, -12, 15],
    skewX: [0, -10, 10, -15],
    filter: [
      'hue-rotate(0deg) brightness(1)',
      'hue-rotate(-60deg) brightness(1.5)',
      'hue-rotate(90deg) brightness(0.6)',
      'hue-rotate(0deg) brightness(0)',
    ],
    scaleY: [1, 1.2, 0.5, 0.1],
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    }
  }
};

export default function App() {
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const cabinetContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [selectedLeaderboardGameId, setSelectedLeaderboardGameId] = useState<GameId>('brick-breaker');
  const [muted, setMuted] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [insertedCoins, setInsertedCoins] = useState<number>(() => {
    return Number(localStorage.getItem('arcade_inserted_coins') || '5');
  });

  // Search and Filter and Favorite States
  const [favorites, setFavorites] = useState<GameId[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('arcade_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITE' | 'SOLO' | 'MULTIPLAYER'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCompactView, setIsCompactView] = useState<boolean>(false);

  const toggleFavorite = (id: GameId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(x => x !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('arcade_favorites', JSON.stringify(updated));
  };

  const [newHighScoreToRegister, setNewHighScoreToRegister] = useState<{
    gameId: GameId;
    score: number;
    onRegistered: (name: string) => void;
  } | null>(null);

  // High score player name state
  const [highScoreNames, setHighScoreNames] = useState<{ [key in GameId]: string }>(() => {
    const names: { [key in GameId]: string } = {} as any;
    const DEFAULT_NAMES: { [key: string]: string } = {
      'brick-breaker': 'N3O',
      'space-defenders': 'XWP',
      'neon-snake': 'VIP',
      'memory-matrix': 'MPA',
    };
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
      names[id] = localStorage.getItem(`highscore_name_${id}`) || DEFAULT_NAMES[id] || 'CPU';
    });
    return names;
  });

  // High score tracking state
  const [highScores, setHighScores] = useState<{ [key in GameId]: number }>({
    'brick-breaker': Number(localStorage.getItem('highscore_brick-breaker') || '1000'),
    'space-defenders': Number(localStorage.getItem('highscore_space-defenders') || '2500'),
    'neon-snake': Number(localStorage.getItem('highscore_neon-snake') || '1500'),
    'memory-matrix': Number(localStorage.getItem('highscore_memory-matrix') || '1200'),
    'cyber-pong': Number(localStorage.getItem('highscore_cyber-pong') || '1500'),
    'party-tap': Number(localStorage.getItem('highscore_party-tap') || '1500'),
    'astro-race': Number(localStorage.getItem('highscore_astro-race') || '1200'),
    'fruit-catcher': Number(localStorage.getItem('highscore_fruit-catcher') || '800'),
    'laser-dodger': Number(localStorage.getItem('highscore_laser-dodger') || '900'),
    'color-match': Number(localStorage.getItem('highscore_color-match') || '1000'),
    'tetri-block': Number(localStorage.getItem('highscore_tetri-block') || '1400'),
    'math-blaster': Number(localStorage.getItem('highscore_math-blaster') || '1600'),
    'neon-drifter': Number(localStorage.getItem('highscore_neon-drifter') || '1100'),
    'pixel-jump': Number(localStorage.getItem('highscore_pixel-jump') || '1300'),
    'simon-retro': Number(localStorage.getItem('highscore_simon-retro') || '1000'),
    'whack-a-glitch': Number(localStorage.getItem('highscore_whack-a-glitch') || '1200'),
    'speed-typer': Number(localStorage.getItem('highscore_speed-typer') || '1500'),
    'sumo-push': Number(localStorage.getItem('highscore_sumo-push') || '1200'),
    'bomb-tag': Number(localStorage.getItem('highscore_bomb-tag') || '1000'),
    'grid-chase': Number(localStorage.getItem('highscore_grid-chase') || '1000'),
    'flappy-neon': Number(localStorage.getItem('highscore_flappy-neon') || '800'),
    'meteor-storm': Number(localStorage.getItem('highscore_meteor-storm') || '1200'),
    'tug-of-war': Number(localStorage.getItem('highscore_tug-of-war') || '1500'),
    'tank-neon': Number(localStorage.getItem('highscore_tank-neon') || '1000'),
    'paint-arena': Number(localStorage.getItem('highscore_paint-arena') || '1200'),
    'space-soccer': Number(localStorage.getItem('highscore_space-soccer') || '800'),
    'neon-golf': Number(localStorage.getItem('highscore_neon-golf') || '1000'),
    'glitch-sweeper': Number(localStorage.getItem('highscore_glitch-sweeper') || '1400'),
    'hex-shield': Number(localStorage.getItem('highscore_hex-shield') || '1200'),
    'pixel-painter': Number(localStorage.getItem('highscore_pixel-painter') || '1500'),
    'cyber-runner': Number(localStorage.getItem('highscore_cyber-runner') || '1000'),
    'neon-stacker': Number(localStorage.getItem('highscore_neon-stacker') || '1000'),
    'copter-neon': Number(localStorage.getItem('highscore_copter-neon') || '800'),
    'space-lander': Number(localStorage.getItem('highscore_space-lander') || '1200'),
  });

  // Track page theme and mute values
  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  // Listen to fullscreen changes to sync with theater mode (e.g. if exited via Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      if (!isCurrentlyFullscreen && isTheaterMode) {
        setIsTheaterMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isTheaterMode]);

  // Set up a ResizeObserver on the main game cabinet container.
  // When its size changes (e.g., when entering or exiting theater/fullscreen mode),
  // we trigger a window resize event to force child components to recalculate layouts.
  useEffect(() => {
    if (!cabinetContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    observer.observe(cabinetContainerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [activeGameId]);

  const handleMuteToggle = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    audio.setMuted(newMuted);
  };

  const insertCoin = () => {
    audio.playCoin();
    const newCoins = insertedCoins + 1;
    setInsertedCoins(newCoins);
    localStorage.setItem('arcade_inserted_coins', newCoins.toString());
  };

  const playCoinSoundOnly = () => {
    audio.playCoin();
  };

  // Triggers when a game finishes inside the cabinet
  const handleGameFinished = (gameId: GameId, finalScore: number) => {
    const currentHigh = highScores[gameId];
    if (finalScore > currentHigh) {
      // Register local state high score
      const updatedHighs = { ...highScores, [gameId]: finalScore };
      setHighScores(updatedHighs);
      localStorage.setItem(`highscore_${gameId}`, finalScore.toString());

      // Prepare Leaderboard state to prompt username registration
      setNewHighScoreToRegister({
        gameId,
        score: finalScore,
        onRegistered: (name: string) => {
          setHighScoreNames(prev => ({ ...prev, [gameId]: name }));
          setNewHighScoreToRegister(null);
          // Refresh leaderboards view
          setSelectedLeaderboardGameId(gameId);
        }
      });
      // Set leaderboard view to current game
      setSelectedLeaderboardGameId(gameId);
    }
  };

  const launchCabinet = (id: GameId) => {
    audio.playCoin();
    // Coins are completely optional now! Deduct only if they actually have them.
    if (insertedCoins > 0) {
      setInsertedCoins(prev => {
        const remaining = prev - 1;
        localStorage.setItem('arcade_inserted_coins', remaining.toString());
        return remaining;
      });
    }
    setActiveGameId(id);
    setSelectedLeaderboardGameId(id);
  };

  const closeCabinet = () => {
    setActiveGameId(null);
    setIsTheaterMode(false);
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {
      console.warn("Fullscreen exit failed on cabinet close", err);
    }
  };

  const toggleFullscreen = () => {
    if (!isTheaterMode) {
      setIsTheaterMode(true);
      try {
        if (document.documentElement.requestFullscreen) {
          const p = document.documentElement.requestFullscreen();
          if (p && typeof p.catch === 'function') {
            p.catch((err) => {
              console.log("Graceful fallback: Fullscreen request rejected inside sandbox iframe", err);
            });
          }
        }
      } catch (err) {
        console.warn("Fullscreen API fallback", err);
      }
    } else {
      setIsTheaterMode(false);
      try {
        if (document.exitFullscreen && document.fullscreenElement) {
          const p = document.exitFullscreen();
          if (p && typeof p.catch === 'function') {
            p.catch((err) => {
              console.log("Graceful fallback: Fullscreen exit rejected", err);
            });
          }
        }
      } catch (err) {
        console.warn("Fullscreen API exit fallback", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 flex flex-col font-sans relative selection:bg-indigo-500 selection:text-white">
      {/* Background Elegant Grid Decoration */}
      <div className="absolute inset-0 bg-[#08080A] bg-[linear-gradient(rgba(244,244,245,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(244,244,245,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header / Navigation Marquee */}
      <header className="border-b border-zinc-800/50 bg-[#0C0C0F]/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo & Animated Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-none flex items-center justify-center border border-zinc-700/50 shadow-md shadow-indigo-500/10">
              <Gamepad2 className="text-black" size={20} />
            </div>
            <div>
              <h1 className="font-arcade text-xs sm:text-sm tracking-wider text-white glow-pink flex items-center gap-2">
                RETRO <span className="text-arcade-cyan glow-cyan">ARCADE</span> HUB
              </h1>
              <p className="text-[9px] font-mono text-zinc-400 mt-0.5 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={8} className="text-arcade-yellow animate-spin" /> EST. 2026 • KESAN BUNYI SINTETIK
              </p>
            </div>
          </div>

          {/* Interactive Coin Slot & Sound Controls */}
          <div className="flex items-center gap-3">
            {/* Insert Coin Widget */}
            <div className="flex items-center bg-[#0C0C0F] border border-zinc-800/60 p-1.5 rounded-none pr-3">
              <button
                id="btn-insert-coin-hud"
                onClick={insertCoin}
                className="bg-[#EAB308] hover:bg-[#CA8A04] active:scale-95 text-black font-arcade text-[8px] px-2.5 py-1.5 border border-[#FEF08A]/40 flex items-center gap-1 cursor-pointer transition shadow-sm"
              >
                <Coins size={12} /> MASUK SYILING
              </button>
              <div className="ml-3 text-right">
                <div className="text-[8px] text-zinc-500 font-arcade">CREDITS</div>
                <div className="font-arcade text-xs text-arcade-yellow animate-pulse glow-yellow">
                  {insertedCoins.toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Mute toggle button */}
            <button
              id="btn-master-mute"
              onClick={handleMuteToggle}
              className={`p-2.5 rounded-none border transition cursor-pointer ${
                muted 
                  ? 'bg-red-950/40 border-red-900 text-red-500 hover:bg-red-900/40' 
                  : 'bg-[#0C0C0F] border border-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
              title={muted ? "Nyahbisu Bunyi" : "Bisu Bunyi"}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Play Active Cabinet Stage (Col 1 to 8) */}
        <div className="lg:col-span-8 flex flex-col justify-start">
          <AnimatePresence mode="wait">
            {activeGameId ? (
              <motion.div
                key="active-cabinet"
                variants={glitchVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={isTheaterMode ? "fixed inset-0 z-50 bg-[#08080A] p-2 sm:p-4 flex flex-col justify-between items-stretch overflow-hidden h-screen w-screen" : "flex flex-col h-full"}
              >
                {/* Back button to Hub & Fullscreen controls */}
                <div className="mb-2 flex justify-between items-center bg-[#0C0C0F]/80 p-2 border border-zinc-800/40 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      id="btn-back-to-hub"
                      onClick={closeCabinet}
                      className="flex items-center gap-2 text-xs font-arcade text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      <ArrowLeft size={14} /> BALIK KE HUB
                    </button>

                    <button
                      id="btn-toggle-fullscreen"
                      onClick={toggleFullscreen}
                      className="flex items-center gap-1.5 text-[10px] font-arcade text-arcade-cyan hover:text-white transition cursor-pointer bg-zinc-900 border border-zinc-800 px-2.5 py-1"
                      title="Tukar Mod Skrin Penuh"
                    >
                      {isTheaterMode ? <Minimize2 size={12} className="animate-pulse" /> : <Maximize2 size={12} />}
                      {isTheaterMode ? 'SKRIN BIASA' : 'SKRIN PENUH'}
                    </button>
                  </div>

                  <div className="text-[10px] font-arcade text-zinc-500 flex items-center gap-1.5">
                    <Flame size={12} className="text-arcade-pink animate-bounce" /> BERSEDIA PEMAIN 1
                  </div>
                </div>

                {/* Cabinet Shell Container */}
                <div ref={cabinetContainerRef} className="relative border-x-8 border-t-8 border-[#0C0C0F] bg-black/90 p-1 rounded-none shadow-2xl flex-grow flex flex-col min-h-0">
                  {/* Speaker grille decorative slots */}
                  <div className="flex justify-center gap-1 py-1 bg-zinc-950 border-b border-zinc-800/40 mb-2">
                    <div className="w-8 h-1 bg-zinc-800/60 rounded-full"></div>
                    <div className="w-8 h-1 bg-zinc-800/60 rounded-full"></div>
                    <div className="w-8 h-1 bg-zinc-800/60 rounded-full"></div>
                  </div>

                  {/* Render active game */}
                  {activeGameId === 'brick-breaker' && (
                    <BrickBreaker 
                      onGameOver={(score) => handleGameFinished('brick-breaker', score)} 
                      onExit={closeCabinet} 
                    />
                  )}
                  {activeGameId === 'space-defenders' && (
                    <SpaceDefenders 
                      onGameOver={(score) => handleGameFinished('space-defenders', score)} 
                      onExit={closeCabinet} 
                    />
                  )}
                  {activeGameId === 'neon-snake' && (
                    <NeonSnake 
                      onGameOver={(score) => handleGameFinished('neon-snake', score)} 
                      onExit={closeCabinet} 
                    />
                  )}
                  {activeGameId === 'memory-matrix' && (
                    <MemoryMatrix 
                      onGameOver={(score) => handleGameFinished('memory-matrix', score)} 
                      onExit={closeCabinet} 
                    />
                  )}
                  {activeGameId === 'cyber-pong' && (
                    <CyberPong 
                      onGameOver={(score) => handleGameFinished('cyber-pong', score)} 
                      onExit={closeCabinet} 
                    />
                  )}
                  {!['brick-breaker', 'space-defenders', 'neon-snake', 'memory-matrix', 'cyber-pong'].includes(activeGameId!) && activeGameId && (
                    <ArcadeMiniSuite
                      gameId={activeGameId}
                      onGameOver={(score) => handleGameFinished(activeGameId, score)}
                      onExit={closeCabinet}
                    />
                  )}

                  {/* Physical Arcade Console Base Bezel Illustration */}
                  <div className="bg-gradient-to-b from-zinc-950 to-[#0C0C0F] p-4 border-t-2 border-zinc-950 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-10 mb-2">
                      {/* Left Joystick graphic */}
                      <div className="relative w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-600 rounded-full border border-white absolute -top-1.5 animate-bounce shadow"></div>
                      </div>
                      {/* Neon coin slot insert */}
                      <div className="w-12 h-6 border border-arcade-pink bg-black flex items-center justify-center relative cursor-pointer" onClick={playCoinSoundOnly}>
                        <div className="w-0.5 h-3 bg-arcade-pink animate-pulse" />
                        <span className="text-[6px] font-arcade text-arcade-pink absolute bottom-0.5">25¢</span>
                      </div>
                      {/* Physical buttons graphic */}
                      <div className="flex gap-2.5">
                        <span className="w-4 h-4 bg-arcade-cyan rounded-full border border-white"></span>
                        <span className="w-4 h-4 bg-arcade-pink rounded-full border border-white"></span>
                      </div>
                    </div>
                    <span className="text-[7px] font-arcade text-zinc-600">PREMIUM ANALOG CABINET DESIGN • STEREO FEEDBACK</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="game-selector-grid"
                variants={glitchVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {/* Big Welcome Neon Poster */}
                <div className="border border-zinc-800/50 bg-gradient-to-r from-indigo-500/5 to-transparent p-6 rounded-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="max-w-lg">
                    <div className="text-[9px] font-arcade text-arcade-pink glow-pink mb-2 flex items-center gap-1">
                      <Sparkles size={10} /> MULTI-CABINET SELECTION
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-arcade tracking-tight text-white mb-2 leading-relaxed">
                      SILA PILIH PERMAINAN ANDA
                    </h2>
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
                      Selamat datang ke Hub Arked Retro! Sila masukkan syiling kredit anda, dan klik main untuk menghidupkan salah satu kabinet neon klasik di bawah.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        id="btn-coin-promo"
                        onClick={insertCoin} 
                        className="bg-[#EAB308] hover:bg-[#CA8A04] text-black font-arcade text-[9px] px-4 py-2 border border-[#FEF08A]/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Coins size={12} /> DAPATKAN KREDIT PERCUMA
                      </button>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#0C0C0F] border border-zinc-800/50 rounded-none text-xs text-zinc-400 font-mono">
                        <Info size={14} className="text-arcade-cyan" />
                        Gunakan papan kekunci atau butang sesentuh mudah alih.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search, Filter, and View Mode Panel */}
                <div className="bg-[#0C0C0F] border border-zinc-800/80 p-3 sm:p-4 rounded-none flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 relative">
                  {/* Neon Grid decoration */}
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-arcade-cyan via-arcade-pink to-arcade-yellow" />
                  
                  {/* Left: Search Bar & Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow lg:max-w-3xl">
                    {/* Search Field */}
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none" size={14} />
                      <input
                        id="input-game-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari permainan..."
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-arcade-cyan focus:outline-none text-xs text-white pl-9 pr-3 py-2 font-mono transition-all duration-200"
                      />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 border border-zinc-900">
                      {[
                        { id: 'ALL', label: 'Semua' },
                        { id: 'FAVORITE', label: 'Kegemaran ⭐' },
                        { id: 'SOLO', label: 'Solo 🕹️' },
                        { id: 'MULTIPLAYER', label: '1v1 / Multi 👥' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          id={`btn-tab-filter-${tab.id.toLowerCase()}`}
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            playCoinSoundOnly();
                          }}
                          className={`px-2.5 py-1.5 text-[9px] font-arcade transition-all ${
                            activeTab === tab.id 
                              ? 'bg-arcade-pink text-white border border-white/20 font-bold' 
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 cursor-pointer'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: View Mode Toggle */}
                  <div className="flex gap-1 bg-zinc-950 p-1 border border-zinc-900 self-start lg:self-auto shrink-0">
                    <button
                      id="btn-view-cabinet"
                      onClick={() => {
                        setIsCompactView(false);
                        playCoinSoundOnly();
                      }}
                      className={`px-3 py-1.5 text-[9px] font-arcade transition-all flex items-center gap-1.5 cursor-pointer ${
                        !isCompactView 
                          ? 'bg-arcade-cyan text-black font-bold' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <LayoutGrid size={11} /> KABINET
                    </button>
                    <button
                      id="btn-view-compact"
                      onClick={() => {
                        setIsCompactView(true);
                        playCoinSoundOnly();
                      }}
                      className={`px-3 py-1.5 text-[9px] font-arcade transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCompactView 
                          ? 'bg-arcade-cyan text-black font-bold' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Grid size={11} /> KOMPAK
                    </button>
                  </div>
                </div>

                {/* Empty Search / Favorite State */}
                {(() => {
                  const filteredGames = GAMES.filter((game) => {
                    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          game.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          game.genre.toLowerCase().includes(searchQuery.toLowerCase());
                    if (!matchesSearch) return false;

                    if (activeTab === 'FAVORITE') {
                      return favorites.includes(game.id);
                    } else if (activeTab === 'SOLO') {
                      return !game.title.includes('(1-5 P)') && !game.tagline.includes('(1-5 P)');
                    } else if (activeTab === 'MULTIPLAYER') {
                      return game.title.includes('(1-5 P)') || game.tagline.includes('(1-5 P)');
                    }
                    return true;
                  });

                  if (filteredGames.length === 0) {
                    return (
                      <div className="text-center py-12 border border-zinc-800/40 bg-zinc-950/40">
                        <Gamepad2 size={24} className="mx-auto text-zinc-700 mb-2 animate-bounce" />
                        <div className="font-arcade text-[10px] text-zinc-500">TIADA PERMAINAN DIJUMPAI</div>
                        <p className="text-[11px] font-mono text-zinc-600 mt-1">Cuba cari perkataan lain atau tetapkan semula penapis anda.</p>
                      </div>
                    );
                  }

                  return isCompactView ? (
                    /* Compact Grid mode */
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredGames.map((game) => {
                        const isFav = favorites.includes(game.id);
                        return (
                          <div 
                            key={game.id}
                            id={`compact-card-${game.id}`}
                            className="group bg-[#0C0C0F]/80 border border-zinc-800/60 p-3 relative overflow-hidden transition-all duration-300 flex flex-col justify-between hover:border-zinc-700/80 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer"
                            onClick={() => launchCabinet(game.id)}
                          >
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800/40 group-hover:bg-gradient-to-r from-arcade-pink via-arcade-cyan to-arcade-yellow transition-all duration-500" />
                            
                            <div>
                              {/* Compact Header: Title and Star Favorite button */}
                              <div className="flex justify-between items-start gap-1 mb-1.5">
                                <h3 className={`font-arcade text-[9px] tracking-wider font-bold uppercase truncate ${game.textColor}`} title={game.title}>
                                  {game.title.replace(' (1-5 P)', '')}
                                </h3>
                                <button
                                  id={`btn-fav-compact-${game.id}`}
                                  onClick={(e) => toggleFavorite(game.id, e)}
                                  className="text-zinc-700 hover:text-arcade-yellow active:scale-90 transition p-0.5 shrink-0 cursor-pointer"
                                >
                                  <Star size={11} className={isFav ? "fill-arcade-yellow text-arcade-yellow" : ""} />
                                </button>
                              </div>

                              {/* Tiny Screen */}
                              <div className="h-16 mb-2 rounded border border-zinc-900 overflow-hidden relative">
                                <GamePreview gameId={game.id} accentColor={game.accentColor} className="h-full mb-0 border-none" />
                              </div>

                              {/* Small details */}
                              <div className="text-[8px] font-mono text-zinc-500 flex justify-between uppercase">
                                <span>{game.genre.split(' / ')[0]}</span>
                                <span className={`font-bold ${
                                  game.difficulty === 'EASY' ? 'text-emerald-500' :
                                  game.difficulty === 'MEDIUM' ? 'text-arcade-cyan' : 'text-arcade-pink'
                                }`}>{game.difficulty}</span>
                              </div>
                            </div>

                            {/* Small action button row */}
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-900/60">
                              <button
                                id={`btn-view-leaderboard-comp-${game.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLeaderboardGameId(game.id);
                                }}
                                className="text-[7px] font-arcade text-zinc-500 hover:text-arcade-yellow flex items-center gap-0.5 transition cursor-pointer"
                              >
                                <Trophy size={8} /> RECORD
                              </button>
                              <span className="text-[7px] font-arcade text-arcade-pink flex items-center gap-0.5 group-hover:glow-pink transition font-semibold">
                                PLAY <ChevronRight size={8} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Cabinet list normal grid mode */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredGames.map((game) => {
                        const isHighScoreActive = highScores[game.id] > 0;
                        const isFav = favorites.includes(game.id);
                        return (
                          <div 
                            key={game.id}
                            id={`cabinet-card-${game.id}`}
                            className={`group bg-[#0C0C0F]/60 border border-zinc-800/50 p-4 relative overflow-hidden transition-all duration-300 flex flex-col justify-between hover:border-zinc-700/80 ${
                              activeGameId === game.id ? 'ring-2 ring-arcade-pink' : ''
                            }`}
                          >
                            {/* Decorative glowing header bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800/50 group-hover:bg-gradient-to-r from-arcade-pink via-arcade-cyan to-arcade-yellow transition-all duration-500" />
                            
                            <div>
                              {/* Title / Year */}
                              <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-arcade text-[11px] sm:text-xs tracking-wider font-bold flex items-center gap-2 ${game.textColor}`}>
                                  {game.title}
                                  <button
                                    id={`btn-fav-normal-${game.id}`}
                                    onClick={(e) => toggleFavorite(game.id, e)}
                                    className="text-zinc-700 hover:text-arcade-yellow active:scale-90 transition p-0.5 cursor-pointer"
                                    title="Tambah ke Kegemaran"
                                  >
                                    <Star size={12} className={isFav ? "fill-arcade-yellow text-arcade-yellow" : ""} />
                                  </button>
                                </h3>
                                <span className="font-mono text-[9px] text-zinc-500 bg-[#0C0C0F] border border-zinc-800/50 px-1.5 py-0.5 uppercase">
                                  Y: {game.year}
                                </span>
                              </div>

                              {/* Procedural Animated CRT Game Preview Screen */}
                              <GamePreview gameId={game.id} accentColor={game.accentColor} />

                              {/* Tagline */}
                              <div className="text-[10px] font-arcade text-zinc-400 mb-2 font-medium">
                                {game.tagline}
                              </div>

                              {/* Description */}
                              <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-4">
                                {game.description}
                              </p>

                              {/* Tech Meta info */}
                              <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-900/60 font-mono text-[9px] text-zinc-500 mb-4 bg-[#08080A]/60 px-2">
                                <div>
                                  <div className="text-[8px] text-zinc-600">GENRE</div>
                                  <div className="font-bold text-zinc-400 uppercase truncate">{game.genre.split('/')[0]}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-zinc-600">DIFFICULTY</div>
                                  <div className={`font-bold ${
                                    game.difficulty === 'EASY' ? 'text-emerald-500' :
                                    game.difficulty === 'MEDIUM' ? 'text-arcade-cyan' : 'text-arcade-pink'
                                  }`}>
                                    {game.difficulty}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-zinc-600">TOP RECORD</div>
                                  <div className="font-bold text-arcade-yellow truncate" title={highScores[game.id].toLocaleString()}>
                                    {highScores[game.id].toLocaleString()}
                                    {highScoreNames[game.id] && (
                                      <span className="text-[9px] text-zinc-500 font-mono ml-1 uppercase font-normal">
                                        ({highScoreNames[game.id]})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Play cabinet controls */}
                            <div className="flex justify-between items-center gap-2">
                              <button
                                id={`btn-view-leaderboard-${game.id}`}
                                onClick={() => setSelectedLeaderboardGameId(game.id)}
                                className={`text-[9px] font-arcade px-3 py-2 border flex items-center gap-1 transition cursor-pointer ${
                                  selectedLeaderboardGameId === game.id 
                                    ? 'bg-[#08080A] border-zinc-800/80 text-arcade-yellow' 
                                    : 'bg-transparent border-zinc-800/50 text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                <Trophy size={10} /> REKOD
                              </button>

                              <button
                                id={`btn-play-cabinet-${game.id}`}
                                onClick={() => launchCabinet(game.id)}
                                className="bg-arcade-pink hover:bg-arcade-pink/80 active:scale-95 text-white font-arcade text-[10px] px-4 py-2 border border-white flex items-center gap-1 cursor-pointer transition shadow-md shadow-arcade-pink/10 hover:shadow-arcade-pink/20"
                              >
                                <Play size={10} /> MAIN SEKARANG
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unified High Scores & Instructions Side Panel (Col 9 to 12) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit self-start">
          
          {/* Main Leaderboard Widget */}
          <div id="side-leaderboard" className="relative">
            <Leaderboard 
              selectedGameId={selectedLeaderboardGameId} 
              newHighScoreToRegister={newHighScoreToRegister}
            />
          </div>

          {/* Quick instructions / Help board */}
          <div className="bg-[#0C0C0F] border border-zinc-800/50 p-4 rounded-none">
            <h4 className="font-arcade text-[10px] text-arcade-cyan glow-cyan mb-3 flex items-center gap-1.5">
              <Info size={14} /> CARA BERMAIN
            </h4>
            <ul className="space-y-3 font-mono text-xs text-zinc-400">
              <li className="border-l border-arcade-cyan/30 pl-3">
                <span className="text-arcade-cyan font-bold block">1. MAIN PERCUMA (FREE PLAY)</span>
                Semua permainan adalah percuma! Masuk Syiling hanyalah sekadar hiasan kosmetik arked yang menyeronokkan.
              </li>
              <li className="border-l border-arcade-pink/30 pl-3">
                <span className="text-arcade-pink font-bold block">2. MULTI-DEVICE & KAWALAN TETIKUS</span>
                Sesuai untuk semua peranti. PC boleh gerak guna tetikus (mouse), peranti mudah alih guna panel sesentuh.
              </li>
              <li className="border-l border-arcade-yellow/30 pl-3">
                <span className="text-arcade-yellow font-bold block">3. REKOD TERTINGGI</span>
                Kalahkan rekod sedia ada untuk memasukkan nama anda ke dalam sistem rekod papan pendaratan Hub!
              </li>
            </ul>
          </div>

        </div>

      </main>

      {/* Retro Footer marquee style */}
      <footer className="border-t border-zinc-800/50 bg-[#0C0C0F] py-4 px-6 text-center text-xs text-zinc-600 font-mono mt-auto relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 Retro Arcade Hub. Dicipta khas dengan synth audio offline.</span>
          <span className="text-[10px] text-arcade-pink glow-pink animate-pulse font-arcade">● ONLINE TERMINAL READY</span>
        </div>
      </footer>
    </div>
  );
}
