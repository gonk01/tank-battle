// ============================================================
//  坦克大战 — 特殊技能管理器
// ============================================================

import { Direction, SpecialSkillType } from './types';
import type { SpecialSkillType as SpecialSkillTypeType } from './types';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { SoundManager } from './SoundManager';
import { collidesWithMap } from './collision';
import type { GameMap } from './types';
import {
  GAME_W, GAME_H, TANK_SIZE,
  getSpecialSkillCooldownFrames,
  getCloneOrHomingCount,
  getInvisibilityTriggerFrames,
  getInvisibilityDurationFrames,
  getIceSlowPct,
} from './constants';

interface MineData {
  x: number;
  y: number;
  size: number;
  alive: boolean;
  pulseTimer: number;
}

export class SpecialSkillManager {
  private player: Tank;
  private tanks: Tank[];
  private bullets: Bullet[];
  private map: GameMap;
  private sound: SoundManager;

  mines: MineData[] = [];

  // 分身
  private cloneCooldown = 0;
  private cloneSelectionCount = 0;

  // 瞬移
  private teleportCooldown = 0;
  private teleportSelectionCount = 0;

  // 隐身
  private invisTriggerCooldown = 0;
  private invisDurationTimer = 0;
  private isInvisible = false;
  private invisSelectionCount = 0;

  // 地雷
  private mineCooldown = 0;
  private mineSelectionCount = 0;

  // 追踪弹
  private homingCooldown = 0;
  private homingSelectionCount = 0;

  // 冰封
  private iceSlowCooldown = 0;
  private iceSlowSelectionCount = 0;
  private iceSlowBoostCount = 0;

  constructor(
    player: Tank,
    tanks: Tank[],
    bullets: Bullet[],
    map: GameMap,
    sound: SoundManager
  ) {
    this.player = player;
    this.tanks = tanks;
    this.bullets = bullets;
    this.map = map;
    this.sound = sound;
    this.resetCooldowns();
  }

  private resetCooldowns(): void {
    this.cloneCooldown = 60; // 初始 1 秒后首次触发
    this.teleportCooldown = 30;
    this.invisTriggerCooldown = 120;
    this.invisDurationTimer = 0;
    this.isInvisible = false;
    this.mineCooldown = 90;
    this.homingCooldown = 60;
    this.iceSlowCooldown = 120;
  }

  setPlayer(p: Tank): void {
    this.player = p;
    this.resetCooldowns();
  }

  setTanks(t: Tank[]): void {
    this.tanks = t;
  }

  update(_frameCount: number): void {
    if (!this.player.alive) return;

    // === 分身 ===
    if (this.cloneSelectionCount > 0) {
      this.cloneCooldown--;
      if (this.cloneCooldown <= 0) {
        this.spawnClones();
        const cd = getSpecialSkillCooldownFrames(this.cloneSelectionCount, 12);
        this.cloneCooldown = cd;
      }
    }

    // === 隐身 ===
    if (this.invisSelectionCount > 0) {
      if (this.isInvisible) {
        this.invisDurationTimer--;
        if (this.invisDurationTimer <= 0) {
          this.isInvisible = false;
          this.invisTriggerCooldown = getInvisibilityTriggerFrames(this.invisSelectionCount);
        }
      } else {
        this.invisTriggerCooldown--;
        if (this.invisTriggerCooldown <= 0) {
          this.isInvisible = true;
          this.invisDurationTimer = getInvisibilityDurationFrames(this.invisSelectionCount);
        }
      }
    }

    // === 地雷 ===
    if (this.mineSelectionCount > 0) {
      this.mineCooldown--;
      if (this.mineCooldown <= 0) {
        this.placeMine();
        const cd = getSpecialSkillCooldownFrames(this.mineSelectionCount, 10);
        this.mineCooldown = cd;
      }
    }

    // === 追踪弹 ===
    if (this.homingSelectionCount > 0) {
      this.homingCooldown--;
      if (this.homingCooldown <= 0) {
        this.fireHomingMissiles();
        const cd = getSpecialSkillCooldownFrames(this.homingSelectionCount, 10);
        this.homingCooldown = cd;
      }
    }

    // === 冰封 ===
    if (this.iceSlowSelectionCount > 0) {
      this.iceSlowCooldown--;
      if (this.iceSlowCooldown <= 0) {
        this.triggerIceSlow();
        const cd = getSpecialSkillCooldownFrames(this.iceSlowSelectionCount, 10);
        this.iceSlowCooldown = cd;
      }
    }

    // 更新地雷脉冲
    for (const m of this.mines) {
      if (m.alive) m.pulseTimer++;
    }

    // 清理过期地雷（存活超过 20 秒）
    this.mines = this.mines.filter(m => m.alive && m.pulseTimer < 1200);
  }

  /** 玩家受伤时调用（瞬移检查），返回是否触发瞬移 */
  onPlayerDamage(): boolean {
    if (this.teleportSelectionCount === 0) return false;
    if (this.teleportCooldown > 0) return false;

    const safePos = this.findSafePosition();
    if (!safePos) return false;

    this.player.x = safePos.x;
    this.player.y = safePos.y;
    this.sound.playTeleport();
    this.teleportCooldown = getSpecialSkillCooldownFrames(this.teleportSelectionCount, 12);
    return true;
  }

  isPlayerInvisibleNow(): boolean {
    return this.isInvisible;
  }

  /** 注册技能选择 */
  onSkillChosen(type: SpecialSkillTypeType): void {
    switch (type) {
      case SpecialSkillType.CLONE:
        this.cloneSelectionCount++;
        break;
      case SpecialSkillType.TELEPORT:
        this.teleportSelectionCount++;
        this.teleportCooldown = 0; // 首次立即可用
        break;
      case SpecialSkillType.INVISIBILITY:
        this.invisSelectionCount++;
        break;
      case SpecialSkillType.MINE:
        this.mineSelectionCount++;
        break;
      case SpecialSkillType.HOMING:
        this.homingSelectionCount++;
        break;
      case SpecialSkillType.ICE_SLOW:
        this.iceSlowSelectionCount++;
        break;
    }
  }

  /** 冰封冷却方向强化 */
  onIceSlowCooldownBoost(): void {
    this.iceSlowSelectionCount++;
  }

  /** 冰封减速方向强化 */
  onIceSlowSlowBoost(): void {
    this.iceSlowBoostCount++;
  }

  // ====== 内部实现 ======

  private spawnClones(): void {
    const count = getCloneOrHomingCount(this.cloneSelectionCount);
    for (let i = 0; i < count; i++) {
      const clone = new Tank(
        this.player.x + (Math.random() - 0.5) * 40,
        this.player.y + (Math.random() - 0.5) * 40,
        this.player.dir,
        false
      );
      clone.isClone = true;
      clone.hp = 999; // 不死亡（靠自爆或超时）
      clone.maxHp = 999;
      clone.attack = this.player.attack;
      clone.flash = 15;
      this.tanks.push(clone);
    }
    this.sound.playCloneSpawn();
  }

  private placeMine(): void {
    const mine: MineData = {
      x: this.player.cx,
      y: this.player.cy,
      size: 8,
      alive: true,
      pulseTimer: 0,
    };
    this.mines.push(mine);
    this.sound.playMinePlace();
  }

  private fireHomingMissiles(): void {
    const count = getCloneOrHomingCount(this.homingSelectionCount);
    // 找最近的敌人
    let nearest: { x: number; y: number; alive: boolean } | null = null;
    let nearestDist = Infinity;
    for (const t of this.tanks) {
      if (!t.alive || t.isPlayer || (t as any).isClone) continue;
      const dist = Math.hypot(t.cx - this.player.cx, t.cy - this.player.cy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { x: t.cx, y: t.cy, alive: true };
      }
    }

    if (!nearest) return;

    for (let i = 0; i < count; i++) {
      const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const b = new Bullet(
        this.player.cx + (Math.random() - 0.5) * 10,
        this.player.cy + (Math.random() - 0.5) * 10,
        dir,
        'player',
        this.player.attack,
        null // 追踪弹不使用被动技能
      );
      b.homingTarget = nearest;
      this.bullets.push(b);
    }
  }

  private triggerIceSlow(): void {
    const slowPct = getIceSlowPct(this.iceSlowBoostCount);
    const slowFactor = 1 - slowPct / 100; // e.g. 50% -> 0.5

    for (const t of this.tanks) {
      if (!t.alive || t.isPlayer || (t as any).isClone) continue;
      t.slowTimer = 180; // 3 秒
      t.slowFactor = slowFactor;
    }
    this.sound.playIceSlow();
  }

  private findSafePosition(): { x: number; y: number } | null {
    const enemies = this.tanks.filter(t => !t.alive || t.isPlayer || (t as any).isClone);
    for (let attempt = 0; attempt < 30; attempt++) {
      const nx = Math.random() * (GAME_W - TANK_SIZE);
      const ny = Math.random() * (GAME_H - TANK_SIZE);

      // 检查墙壁碰撞
      if (collidesWithMap({ x: nx, y: ny, w: TANK_SIZE, h: TANK_SIZE }, this.map)) continue;

      // 检查距离所有敌人至少 120px
      let tooClose = false;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dist = Math.hypot(e.cx - (nx + TANK_SIZE / 2), e.cy - (ny + TANK_SIZE / 2));
        if (dist < 120) { tooClose = true; break; }
      }
      if (tooClose) continue;

      return { x: nx, y: ny };
    }
    return null;
  }
}
