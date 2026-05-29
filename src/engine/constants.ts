// ============================================================
//  坦克大战 — 常量 & 配置
// ============================================================

import { SkillType } from './types';

// ====== 地图尺寸 ======
export const CELL = 32;
export const COLS = 32;
export const ROWS = 24;
export const GAME_W = CELL * COLS; // 1024
export const GAME_H = CELL * ROWS; // 768

// ====== 坦克属性 ======
export const TANK_SIZE = 28;
export const BULLET_SIZE = 6;
export const BULLET_SPEED = 5;
export const PLAYER_SPEED = 2;
export const ENEMY_SPEED = 1.2;

export const PLAYER_SPAWN_COL = Math.floor(COLS / 2); // 16
export const PLAYER_SPAWN_ROW = ROWS - 3;              // 21

// ====== 敌人配置 ======
export const INITIAL_ENEMY_COUNT = 10;
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

// ====== 升级公式 ======
export const SCORE_MULTIPLIER = 5;

/** 升到目标 level 需要的累计积分 */
export function getScoreForLevel(level: number): number {
  if (level <= 0) return 0;
  return SCORE_MULTIPLIER * level * (level + 1) / 2;
}

/** 从当前 level 升到下一级还需多少分 */
export function getExpNeeded(level: number): number {
  return getScoreForLevel(level + 1) - getScoreForLevel(level);
}

/** 当前积分对应的经验进度（0~1） */
export function getExpProgress(score: number, level: number): number {
  const currentMin = getScoreForLevel(level);
  const nextMin = getScoreForLevel(level + 1);
  if (nextMin <= currentMin) return 0;
  return (score - currentMin) / (nextMin - currentMin);
}

// ====== 技能配置表 ======

export interface SkillConfig {
  type: SkillType;
  name: string;
  icon: string;
  description: string;
  /** 每级效果描述 */
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
    description: '子弹撞钢墙反弹，每级 +1 次弹射，伤害递减',
    effectDesc: (lv) => {
      const damagePct = Math.min(90, 60 + lv * 5);
      if (lv === 0) return `获得 ${1} 次弹射 (伤害保留 ${damagePct}%)`;
      return `弹射 ${lv + 1} → ${lv + 1 + 1} 次 (伤害 ${damagePct}%)`;
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
    description: '概率闪避近战攻击，上限 50%',
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
export function createDefaultSkills() {
  return {
    speed: { type: SkillType.SPEED, level: 0 },
    ricochet: { type: SkillType.RICOCHET, level: 0 },
    explosive: { type: SkillType.EXPLOSIVE, level: 0 },
    dodge: { type: SkillType.DODGE, level: 0 },
    pierce: { type: SkillType.PIERCE, level: 0 },
    regen: { type: SkillType.REGEN, level: 0 },
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

// ====== 敌人难度递增 ======
export function getEnemyHp(kills: number): number {
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

export function getEnemyDamage(kills: number): number {
  if (kills < 40) return 1;
  return 2;
}

export function getEnemyAttack(): number {
  return 1;
}

// ====== 玩家初始属性 ======
export const PLAYER_INITIAL_HP = 3;
export const PLAYER_INITIAL_ATTACK = 1;
