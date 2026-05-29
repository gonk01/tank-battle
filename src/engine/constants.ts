// ============================================================
//  坦克大战 — 常量 & 配置
// ============================================================

import { SkillType, SpecialSkillType, Difficulty } from './types';
import type { PlayerSkills, PlayerSpecialSkills, Difficulty as DifficultyType } from './types';

// ====== 地图尺寸 ======
export const CELL = 32;
export const COLS = 32;
export const ROWS = 24;
export const GAME_W = CELL * COLS; // 1024
export const GAME_H = CELL * ROWS; // 768

// ====== 坦克属性（数值平衡后） ======
export const TANK_SIZE = 28;
export const BULLET_SIZE = 6;
export const BULLET_SPEED = 5;
export const PLAYER_SPEED = 2;
export const ENEMY_SPEED = 1.2;

export const PLAYER_SPAWN_COL = Math.floor(COLS / 2); // 16
export const PLAYER_SPAWN_ROW = ROWS - 3;              // 21

// ====== 玩家初始属性（平衡后：HP 3→5, ATK 1→2） ======
export const PLAYER_INITIAL_HP = 5;
export const PLAYER_INITIAL_ATTACK = 2;

// ====== 敌人配置 ======
export const INITIAL_ENEMY_COUNT = 10; // 保留兼容，实际由难度配置覆盖
export const MAX_ALIVE_ENEMIES = 10;
export const SPAWN_INTERVAL_BASE = 180; // 3 秒（60fps）
export const SPAWN_INTERVAL_MIN = 30;   // 0.5 秒
export const SPAWN_INTERVAL_DECAY = 15; // 每分钟减 15 帧
export const MAX_ENEMIES_ON_MAP_BASE = 10;
export const MAX_ENEMIES_ON_MAP_PER_MIN = 1.5;

/** 当前分钟对应的刷新间隔（帧） */
export function getSpawnInterval(minutes: number): number {
  return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - minutes * SPAWN_INTERVAL_DECAY);
}

/** 当前分钟对应的最大同时敌人数 */
export function getMaxAliveEnemies(minutes: number): number {
  return Math.min(30, Math.floor(MAX_ENEMIES_ON_MAP_BASE + minutes * MAX_ENEMIES_ON_MAP_PER_MIN));
}

// ====== 难度配置 ======

export interface DifficultyConfig {
  initialEnemyCount: number;
  largeTankSpawnInterval: number;   // 秒
  largeTankHpMultiplier: number;
  largeTankHpDoubleTime: number;    // 秒
  largeTankSpeedBoost: boolean;
  killLevelBase: number;
  killLevelTierSize: number;        // 每档多少级
  killLevelTierStep: number;        // 每档 +N 击杀
  enemyBaseHp: number;
  enemyDamageBase: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyType, DifficultyConfig> = {
  [Difficulty.EASY]: {
    initialEnemyCount: 3,
    largeTankSpawnInterval: 40,
    largeTankHpMultiplier: 0.7,
    largeTankHpDoubleTime: 120,
    largeTankSpeedBoost: false,
    killLevelBase: 3,
    killLevelTierSize: 10,
    killLevelTierStep: 5,
    enemyBaseHp: 1,
    enemyDamageBase: 1,
  },
  [Difficulty.NORMAL]: {
    initialEnemyCount: 5,
    largeTankSpawnInterval: 30,
    largeTankHpMultiplier: 1.0,
    largeTankHpDoubleTime: 60,
    largeTankSpeedBoost: false,
    killLevelBase: 5,
    killLevelTierSize: 10,
    killLevelTierStep: 5,
    enemyBaseHp: 1,
    enemyDamageBase: 1,
  },
  [Difficulty.HARD]: {
    initialEnemyCount: 8,
    largeTankSpawnInterval: 20,
    largeTankHpMultiplier: 1.2,
    largeTankHpDoubleTime: 40,
    largeTankSpeedBoost: true,
    killLevelBase: 7,
    killLevelTierSize: 10,
    killLevelTierStep: 5,
    enemyBaseHp: 2,
    enemyDamageBase: 2,
  },
};

// ====== 击杀数升级公式（替换积分制） ======

/** 升到第 level 级所需击杀数（单级） */
export function getKillsForLevel(level: number, difficulty: DifficultyType): number {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  const tier = Math.floor(level / cfg.killLevelTierSize);
  return cfg.killLevelBase + tier * cfg.killLevelTierStep;
}

/** 升到第 level 级所需累计击杀数 */
export function getCumulativeKillsForLevel(level: number, difficulty: DifficultyType): number {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += getKillsForLevel(i, difficulty);
  }
  return total;
}

/** 根据击杀数反推等级 */
export function getLevelFromKills(kills: number, difficulty: DifficultyType): number {
  let level = 0;
  while (getCumulativeKillsForLevel(level + 1, difficulty) <= kills) {
    level++;
  }
  return level;
}

/** 击杀数经验进度 0~1 */
export function getKillExpProgress(kills: number, level: number, difficulty: DifficultyType): number {
  const currentMin = getCumulativeKillsForLevel(level, difficulty);
  const nextMin = getCumulativeKillsForLevel(level + 1, difficulty);
  if (nextMin <= currentMin) return 0;
  return Math.min(1, (kills - currentMin) / (nextMin - currentMin));
}

/** 距下一级还需多少击杀 */
export function getKillExpNeeded(level: number, difficulty: DifficultyType): number {
  return getKillsForLevel(level, difficulty);
}

// 保留旧函数（兼容）
export const SCORE_MULTIPLIER = 5;
export function getScoreForLevel(level: number): number {
  if (level <= 0) return 0;
  return SCORE_MULTIPLIER * level * (level + 1) / 2;
}
export function getExpNeeded(level: number): number {
  return getScoreForLevel(level + 1) - getScoreForLevel(level);
}
export function getExpProgress(score: number, level: number): number {
  const currentMin = getScoreForLevel(level);
  const nextMin = getScoreForLevel(level + 1);
  if (nextMin <= currentMin) return 0;
  return (score - currentMin) / (nextMin - currentMin);
}

// ====== 大型坦克常量 ======
export const LARGE_TANK_SIZE = 56;
export const LARGE_TANK_SPEED = 0.8;
export const LARGE_TANK_PURSUIT_SPEED = 1.2;
export const LARGE_TANK_SHOOT_INTERVAL = 90;   // 帧
export const LARGE_TANK_BULLET_SPEED = 3;
export const LARGE_TANK_MIN_RANGE = 150;
export const LARGE_TANK_MAX_RANGE = 250;
export const LARGE_TANK_WARNING_DURATION = 180; // 3 秒预警
export const LARGE_TANK_RESPAWN_LEVEL_INTERVAL = 5;
export const LARGE_TANK_SPAWN_COL = Math.floor(COLS / 2);
export const LARGE_TANK_SPAWN_ROW = 2;

// ====== 特殊技能数值公式 ======

/** 通用冷却（帧）：初始 baseInterval 秒，每次选择递减 */
export function getSpecialSkillCooldownFrames(selectionCount: number, baseIntervalSec = 10): number {
  let cd = baseIntervalSec * 60; // 转为帧
  for (let i = 0; i < selectionCount; i++) {
    const reduction = Math.max(0.1, 1.0 - i * 0.1);
    cd -= reduction * 60;
  }
  return Math.max(120, Math.round(cd)); // 最低 2 秒
}

/** 分身/追踪弹数量 */
export function getCloneOrHomingCount(selections: number): number {
  return Math.min(5, Math.ceil(selections / 2));
}

/** 隐身触发间隔（帧） */
export function getInvisibilityTriggerFrames(selections: number): number {
  let interval = 6 * 60; // 初始 6 秒
  for (let i = 0; i < selections; i++) {
    const reduction = Math.max(0.1, 0.6 - i * 0.1);
    interval -= reduction * 60;
  }
  return Math.max(90, Math.round(interval)); // 最低 1.5 秒
}

/** 隐身持续时间（帧） */
export function getInvisibilityDurationFrames(selections: number): number {
  let duration = 1.2 * 60; // 初始 1.2 秒
  for (let i = 0; i < selections; i++) {
    const reduction = Math.max(0.05, 0.12 - i * 0.01);
    duration -= reduction * 60;
  }
  return Math.max(18, Math.round(duration)); // 最低 0.3 秒
}

/** 冰封减速百分比 */
export function getIceSlowPct(slowBoosts: number): number {
  let pct = 50;
  for (let i = 0; i < slowBoosts; i++) {
    pct += Math.max(1, 8 - i * 1);
  }
  return Math.min(90, pct);
}

// ====== 技能配置表 ======

export interface SkillConfig {
  type: SkillType;
  name: string;
  icon: string;
  description: string;
  effectDesc: (level: number) => string;
}

export const SKILL_CONFIGS: SkillConfig[] = [
  {
    type: SkillType.SPEED,
    name: '移动速度',
    icon: '🚀',
    description: '提升移动速度，每级 +8%',
    effectDesc: (lv) => {
      if (lv === 0) return '获得速度加成 +8%';
      return `速度 +${Math.round((lv + 1) * 8)}% (${(2 * (1 + (lv + 1) * 0.08)).toFixed(2)})`;
    },
  },
  {
    type: SkillType.RICOCHET,
    name: '弹射子弹',
    icon: '🔄',
    description: '子弹撞钢墙反弹，每级 +1 次弹射',
    effectDesc: (lv) => {
      const damagePct = Math.min(90, 60 + lv * 5);
      if (lv === 0) return `获得 ${1} 次弹射 (伤害保留 ${damagePct}%)`;
      return `弹射 ${lv + 1} → ${lv + 2} 次 (伤害 ${damagePct}%)`;
    },
  },
  {
    type: SkillType.EXPLOSIVE,
    name: '爆炸子弹',
    icon: '💥',
    description: '子弹命中产生范围爆炸',
    effectDesc: (lv) => {
      const radius = 24 + 8 * lv;
      const dmg = Math.min(100, 40 + lv * 10);
      if (lv === 0) return `获得爆炸 (半径 ${radius}px, 伤害 ${dmg}%)`;
      return `爆炸半径 ${24 + 8 * (lv)} → ${24 + 8 * (lv + 1)}px (伤害 ${dmg}%)`;
    },
  },
  {
    type: SkillType.DODGE,
    name: '闪避',
    icon: '🍀',
    description: '概率闪避攻击，上限 50%',
    effectDesc: (lv) => {
      const pct = Math.min(50, 8 + (lv + 1) * 4);
      if (lv === 0) return `获得 ${pct}% 闪避率`;
      return `闪避 ${Math.min(50, 8 + lv * 4)}% → ${pct}%`;
    },
  },
  {
    type: SkillType.PIERCE,
    name: '穿透子弹',
    icon: '🔱',
    description: '子弹穿透敌人继续飞行',
    effectDesc: (lv) => {
      const dmg = Math.min(80, 50 + lv * 5);
      if (lv === 0) return `获得 ${1} 次穿透 (伤害 ${dmg}%)`;
      return `穿透 ${lv} → ${lv + 1} 次 (伤害 ${dmg}%)`;
    },
  },
  {
    type: SkillType.REGEN,
    name: '生命回复',
    icon: '🩸',
    description: '击杀敌人回复 HP',
    effectDesc: (lv) => {
      const heal = ((lv + 1) * 0.5).toFixed(1);
      if (lv === 0) return `获得击杀回复 ${heal} HP`;
      return `回复 ${(lv * 0.5).toFixed(1)} → ${heal} HP/杀`;
    },
  },
];

export function getSkillConfig(type: SkillType): SkillConfig {
  return SKILL_CONFIGS.find(s => s.type === type)!;
}

/** 创建初始技能状态 */
export function createDefaultSkills(): PlayerSkills {
  return {
    speed: { type: SkillType.SPEED, level: 0 },
    ricochet: { type: SkillType.RICOCHET, level: 0 },
    explosive: { type: SkillType.EXPLOSIVE, level: 0 },
    dodge: { type: SkillType.DODGE, level: 0 },
    pierce: { type: SkillType.PIERCE, level: 0 },
    regen: { type: SkillType.REGEN, level: 0 },
    special: createDefaultSpecialSkills(),
  };
}

export function createDefaultSpecialSkills(): PlayerSpecialSkills {
  return {
    clone: { type: SpecialSkillType.CLONE, level: 0 },
    teleport: { type: SpecialSkillType.TELEPORT, level: 0 },
    invisibility: { type: SpecialSkillType.INVISIBILITY, level: 0 },
    mine: { type: SpecialSkillType.MINE, level: 0 },
    homing: { type: SpecialSkillType.HOMING, level: 0 },
    iceSlow: { type: SpecialSkillType.ICE_SLOW, level: 0 },
  };
}

// ====== 技能效果取值函数 ======

export function getSpeedBonus(level: number): number {
  return 1 + level * 0.08;
}

export function getRicochetCount(level: number): number {
  return level;
}

export function getRicochetDamagePct(level: number): number {
  return Math.min(90, 60 + (level - 1) * 5);
}

export function getExplosiveRadius(level: number): number {
  if (level === 0) return 0;
  return 24 + (level - 1) * 8;
}

export function getExplosiveDamagePct(level: number): number {
  if (level === 0) return 0;
  return Math.min(100, 40 + (level - 1) * 10);
}

export function getDodgeChance(level: number): number {
  if (level === 0) return 0;
  return Math.min(50, 8 + (level - 1) * 4);
}

export function getPierceCount(level: number): number {
  return level;
}

export function getPierceDamagePct(level: number): number {
  if (level === 0) return 0;
  return Math.min(80, 50 + (level - 1) * 5);
}

export function getRegenHeal(level: number): number {
  return level * 0.5;
}

// ====== 敌人难度递增（保留兼容 + 难度分档） ======
export function getEnemyHp(kills: number, difficulty?: DifficultyType): number {
  // 难度分档优先
  if (difficulty) {
    const cfg = DIFFICULTY_CONFIGS[difficulty];
    return cfg.enemyBaseHp + Math.floor(kills / 20);
  }
  // 兼容旧逻辑
  if (kills < 10) return 1;
  if (kills < 20) return 1 + Math.floor(Math.random() * 2);
  if (kills < 30) return 2;
  if (kills < 40) return 2 + Math.floor(Math.random() * 2);
  if (kills < 50) return 3;
  return 3 + Math.floor(Math.random() * 2);
}

export function getEnemySpeedMultiplier(kills: number): number {
  return 1 + Math.floor(kills / 20) * 0.1;
}

export function getEnemyDamage(kills: number, difficulty?: DifficultyType): number {
  if (difficulty) {
    const cfg = DIFFICULTY_CONFIGS[difficulty];
    return cfg.enemyDamageBase + (kills >= 40 ? 1 : 0);
  }
  if (kills < 40) return 1;
  return 2;
}

export function getEnemyAttack(): number {
  return 1;
}
