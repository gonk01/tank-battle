// ============================================================
//  坦克大战 — 类型定义
// ============================================================

export const Direction = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export const DX: Record<number, number> = {
  [Direction.UP]: 0,
  [Direction.RIGHT]: 1,
  [Direction.DOWN]: 0,
  [Direction.LEFT]: -1,
};

export const DY: Record<number, number> = {
  [Direction.UP]: -1,
  [Direction.RIGHT]: 0,
  [Direction.DOWN]: 1,
  [Direction.LEFT]: 0,
};

export const CellType = {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
} as const;
export type CellType = (typeof CellType)[keyof typeof CellType];

export type GameMap = number[][];

/** 矩形碰撞体 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ============================================================
//  难度系统
// ============================================================

export const Difficulty = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  [Difficulty.EASY]: '简单',
  [Difficulty.NORMAL]: '普通',
  [Difficulty.HARD]: '困难',
};

export const DIFFICULTY_ICONS: Record<Difficulty, string> = {
  [Difficulty.EASY]: '🌱',
  [Difficulty.NORMAL]: '⚔️',
  [Difficulty.HARD]: '💀',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  [Difficulty.EASY]: '3 敌人开局，升级快，大型坦克弱',
  [Difficulty.NORMAL]: '5 敌人开局，标准规则',
  [Difficulty.HARD]: '8 敌人开局，升级慢，大型坦克强且加速追击',
};

// ============================================================
//  主题系统
// ============================================================

export type ThemeId = 'hell' | 'forest' | 'ww2';
export type PlayerDecal = 'none' | 'star' | 'leaf' | 'flame';
export type EnemyDecal = 'none' | 'skull' | 'cross' | 'thorn';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
  // 地面
  groundColor: string;
  gridColor: string;
  // 可破坏墙
  brickColor: string;
  brickStroke: string;
  brickHighlight: string;
  // 不可破坏墙
  steelGradient: [string, string, string];
  steelRivet: string;
  // 玩家坦克
  playerBody: string;
  playerTurret: string;
  playerTrack: string;
  playerHighlight: string;
  playerDecal: PlayerDecal;
  // 敌方坦克
  enemyBody: string;
  enemyTurret: string;
  enemyTrack: string;
  enemyHighlight: string;
  enemyDecal: EnemyDecal;
}

// ============================================================
//  被动技能系统（原有 6 项）
// ============================================================

export const SkillType = {
  SPEED: 'speed',
  RICOCHET: 'ricochet',
  EXPLOSIVE: 'explosive',
  DODGE: 'dodge',
  PIERCE: 'pierce',
  REGEN: 'regen',
} as const;
export type SkillType = (typeof SkillType)[keyof typeof SkillType];

export const SKILL_ICONS: Record<SkillType, string> = {
  [SkillType.SPEED]: '🚀',
  [SkillType.RICOCHET]: '🔄',
  [SkillType.EXPLOSIVE]: '💥',
  [SkillType.DODGE]: '🍀',
  [SkillType.PIERCE]: '🔱',
  [SkillType.REGEN]: '🩸',
};

export const SKILL_NAMES: Record<SkillType, string> = {
  [SkillType.SPEED]: '移动速度',
  [SkillType.RICOCHET]: '弹射子弹',
  [SkillType.EXPLOSIVE]: '爆炸子弹',
  [SkillType.DODGE]: '闪避',
  [SkillType.PIERCE]: '穿透子弹',
  [SkillType.REGEN]: '生命回复',
};

export interface SkillState {
  type: SkillType;
  level: number; // 0 = 未获取
}

// ============================================================
//  特殊技能系统（新增 6 项）
// ============================================================

export const SpecialSkillType = {
  CLONE: 'clone',
  TELEPORT: 'teleport',
  INVISIBILITY: 'invisibility',
  MINE: 'mine',
  HOMING: 'homing',
  ICE_SLOW: 'iceSlow',
} as const;
export type SpecialSkillType = (typeof SpecialSkillType)[keyof typeof SpecialSkillType];

export const SPECIAL_SKILL_ICONS: Record<SpecialSkillType, string> = {
  [SpecialSkillType.CLONE]: '👥',
  [SpecialSkillType.TELEPORT]: '⚡',
  [SpecialSkillType.INVISIBILITY]: '👻',
  [SpecialSkillType.MINE]: '💣',
  [SpecialSkillType.HOMING]: '🎯',
  [SpecialSkillType.ICE_SLOW]: '❄️',
};

export const SPECIAL_SKILL_NAMES: Record<SpecialSkillType, string> = {
  [SpecialSkillType.CLONE]: '分身',
  [SpecialSkillType.TELEPORT]: '瞬移避险',
  [SpecialSkillType.INVISIBILITY]: '隐身',
  [SpecialSkillType.MINE]: '地雷放置',
  [SpecialSkillType.HOMING]: '追踪弹',
  [SpecialSkillType.ICE_SLOW]: '冰封减速',
};

export interface SpecialSkillState {
  type: SpecialSkillType;
  level: number; // 0 = 未获取
}

export interface PlayerSpecialSkills {
  clone: SpecialSkillState;
  teleport: SpecialSkillState;
  invisibility: SpecialSkillState;
  mine: SpecialSkillState;
  homing: SpecialSkillState;
  iceSlow: SpecialSkillState;
}

export interface PlayerSkills {
  speed: SkillState;
  ricochet: SkillState;
  explosive: SkillState;
  dodge: SkillState;
  pierce: SkillState;
  regen: SkillState;
  special: PlayerSpecialSkills;
}

// ============================================================
//  游戏实体数据
// ============================================================

export interface MineData {
  x: number;
  y: number;
  size: number;
  alive: boolean;
  pulseTimer: number;
}

export interface LargeTankWarningData {
  x: number;
  y: number;
  timer: number;    // 剩余帧数
  duration: number; // 总帧数（用于渐出计算）
}

/** 升级选择项 */
export interface UpgradeChoice {
  type: 'hp' | 'attack' | 'special';
  specialType?: SpecialSkillType;
}

// ============================================================
//  游戏状态（React 侧消费）
// ============================================================

export interface GameState {
  score: number;
  hp: number;
  maxHp: number;
  attack: number;
  level: number;
  expProgress: number;     // 进度 0~1
  expNeeded: number;        // 距下一级还需击杀数
  kills: number;
  timeSurvived: number;     // 秒
  gameOver: boolean;
  paused: boolean;
  upgrading: boolean;
  showUpgradeChoice: boolean;
  themeId: ThemeId;
  difficulty: Difficulty;
  skills: PlayerSkills;
  specialSkills: PlayerSpecialSkills;
  showSpecialSkillChoice: boolean;
  specialSkillChoices: SpecialSkillType[];
  pendingIceSlowChoice: boolean;
  hasLargeTankWarning: boolean;
  soundMuted: boolean;
}

export interface KeysPressed {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
  [' ']: boolean;
}
