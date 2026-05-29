// ============================================================
//  坦克大战 — 子弹（含技能）
// ============================================================

import { Direction } from './types';
import type { PlayerSkills } from './types';
import {
  BULLET_SIZE,
  BULLET_SPEED,
  GAME_W,
  GAME_H,
  getRicochetCount,
  getExplosiveRadius,
  getPierceCount,
} from './constants';

export interface BulletSkillData {
  ricochetCount: number;
  ricochetMax: number;
  ricochetDamagePct: number;
  explosiveRadius: number;
  pierceCount: number;
  pierceMax: number;
  pierceDamagePct: number;
}

export class Bullet {
  x: number;
  y: number;
  dir: Direction;
  owner: 'player' | 'enemy';
  damage: number;
  w = BULLET_SIZE;
  h = BULLET_SIZE;
  alive = true;

  // 弹射
  ricochetCount = 0;
  ricochetMax = 0;
  ricochetDamagePct = 60;

  // 爆炸
  explosiveRadius = 0;

  // 穿透
  pierceCount = 0;
  pierceMax = 0;
  pierceDamagePct = 50;

  constructor(
    x: number,
    y: number,
    dir: Direction,
    owner: 'player' | 'enemy',
    damage: number,
    skills?: PlayerSkills | null
  ) {
    this.x = x - BULLET_SIZE / 2;
    this.y = y - BULLET_SIZE / 2;
    this.dir = dir;
    this.owner = owner;
    this.damage = damage;

    // 应用玩家技能
    if (owner === 'player' && skills) {
      this.ricochetMax = getRicochetCount(skills.ricochet.level);
      this.ricochetDamagePct = Math.min(90, 60 + (skills.ricochet.level - 1) * 5);
      if (skills.ricochet.level === 0) {
        this.ricochetMax = 0;
      }

      this.explosiveRadius = getExplosiveRadius(skills.explosive.level);

      this.pierceMax = getPierceCount(skills.pierce.level);
      this.pierceDamagePct = skills.pierce.level > 0
        ? Math.min(80, 50 + (skills.pierce.level - 1) * 5)
        : 50;
    }
  }

  update(): void {
    const dx = [0, 1, 0, -1][this.dir];
    const dy = [-1, 0, 1, 0][this.dir];
    this.x += dx * BULLET_SPEED;
    this.y += dy * BULLET_SPEED;

    if (
      this.x < 0 ||
      this.x > GAME_W - this.w ||
      this.y < 0 ||
      this.y > GAME_H - this.h
    ) {
      this.alive = false;
    }
  }

  get cx(): number { return this.x + this.w / 2; }
  get cy(): number { return this.y + this.h / 2; }

  /** 弹射：改变方向为反向 */
  reflect(): void {
    if (this.ricochetCount >= this.ricochetMax) {
      this.alive = false;
      return;
    }
    this.ricochetCount++;

    // 反转方向
    this.dir = ((this.dir + 2) % 4) as unknown as Direction;

    // 伤害衰减
    this.damage = Math.max(1, Math.floor(this.damage * this.ricochetDamagePct / 100));
  }

  /** 穿透后伤害衰减 */
  applyPierceDamage(): void {
    if (this.pierceCount >= this.pierceMax) {
      this.alive = false;
      return;
    }
    this.pierceCount++;
    this.damage = Math.max(1, Math.floor(this.damage * this.pierceDamagePct / 100));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 弹射子弹视觉放大
    if (this.ricochetCount > 0) {
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 10;
    } else if (this.explosiveRadius > 0) {
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowColor = this.owner === 'player' ? '#ffd700' : '#ff6b6b';
      ctx.shadowBlur = 6;
    }

    ctx.fillStyle = this.owner === 'player' ? '#ffd700' : '#ff6b6b';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;
  }
}
