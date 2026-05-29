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
//  技能系统
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

export interface PlayerSkills {
  speed: SkillState;
  ricochet: SkillState;
  explosive: SkillState;
  dodge: SkillState;
  pierce: SkillState;
  regen: SkillState;
}

/** 升级选择项 */
export interface UpgradeChoice {
  type: 'hp' | 'attack' | 'skill';
  skillType?: SkillType;
}

// ============================================================
//  游戏状态
// ============================================================

export interface GameState {
  score: number;
  hp: number;
  maxHp: number;
  attack: number;
  level: number;
  expProgress: number;   // 当前已得积分（% 下一级所需）
  expNeeded: number;      // 升到下一级所需积分数
  kills: number;
  timeSurvived: number;   // 秒
  gameOver: boolean;
  paused: boolean;
  upgrading: boolean;
  showUpgradeChoice: boolean;
  themeId: ThemeId;
  skills: PlayerSkills;
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
