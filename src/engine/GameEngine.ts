// ============================================================
//  坦克大战 — 游戏引擎（无尽模式）
// ============================================================

import type { GameState, KeysPressed } from './types';
import { Direction } from './types';
import type { SkillType } from './types';
import type { ThemeConfig, PlayerSkills } from './types';
import {
  CELL, COLS, ROWS, TANK_SIZE,
  GAME_W, GAME_H,
  PLAYER_SPAWN_COL, PLAYER_SPAWN_ROW,
  INITIAL_ENEMY_COUNT,
  getSpawnInterval, getMaxAliveEnemies,
  getScoreForLevel, getExpNeeded, getExpProgress,
  createDefaultSkills,
  getEnemyHp, getEnemySpeedMultiplier, getEnemyDamage,
  getRegenHeal,
} from './constants';
import { createMap } from './map';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { Explosion, MeleeEffect, ExplosiveEffect } from './Explosion';
import { updateEnemyAI, trySpawnEnemy, checkMeleeAttack } from './enemyAI';

type StateCallback = (state: GameState) => void;

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  theme: ThemeConfig;

  map = createMap();
  tanks: Tank[] = [];
  bullets: Bullet[] = [];
  explosions: Explosion[] = [];
  meleeEffects: MeleeEffect[] = [];
  explosiveEffects: ExplosiveEffect[] = [];

  player: Tank;
  keys: KeysPressed = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false,
    ' ': false,
  };
  lastShootKey = false;

  score = 0;
  kills = 0;
  playerLevel = 0;
  hpChoiceCount = 0;
  enemiesSpawned = 0;
  spawnTimer = 60;
  paused = false;
  gameOver = false;
  upgrading = false;
  showUpgradeChoice = false;
  gameTime = 0; // 秒

  frameCount = 0;
  lastTime = 0;
  accumulator = 0;
  readonly tickRate = 1000 / 60;
  running = false;
  rafId = 0;

  onStateChange: StateCallback | null = null;
  onUpgradeChoice: ((choices: any) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, theme: ThemeConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = GAME_W;
    this.canvas.height = GAME_H;
    this.theme = theme;

    this.player = this.createPlayer();
    this.init();
  }

  private createPlayer(): Tank {
    const t = new Tank(
      PLAYER_SPAWN_COL * CELL + (CELL - TANK_SIZE) / 2,
      PLAYER_SPAWN_ROW * CELL + (CELL - TANK_SIZE) / 2,
      Direction.UP, true
    );
    t.skills = createDefaultSkills();
    return t;
  }

  init(): void {
    this.map = createMap();
    this.tanks = [];
    this.bullets = [];
    this.explosions = [];
    this.meleeEffects = [];
    this.explosiveEffects = [];
    this.score = 0;
    this.kills = 0;
    this.playerLevel = 0;
    this.hpChoiceCount = 0;
    this.enemiesSpawned = 0;
    this.spawnTimer = 60;
    this.gameOver = false;
    this.upgrading = false;
    this.showUpgradeChoice = false;
    this.paused = false;
    this.gameTime = 0;
    this.frameCount = 0;
    this.lastTime = 0;
    this.accumulator = 0;

    this.player = this.createPlayer();
    this.tanks.push(this.player);

    // 开局生成 10 个敌人
    for (let i = 0; i < INITIAL_ENEMY_COUNT; i++) {
      this.spawnEnemy();
    }

    this.emitState();
  }

  start(): void {
    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private loop(timestamp: number): void {
    if (!this.running) return;
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.accumulator += delta;
    while (this.accumulator >= this.tickRate) {
      this.update();
      this.accumulator -= this.tickRate;
    }

    this.draw();
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  private update(): void {
    this.frameCount++;

    // 更新特效
    for (const e of this.explosions) e.update();
    this.explosions = this.explosions.filter(e => !e.dead);
    for (const e of this.meleeEffects) e.update();
    this.meleeEffects = this.meleeEffects.filter(e => !e.dead);
    for (const e of this.explosiveEffects) e.update();
    this.explosiveEffects = this.explosiveEffects.filter(e => !e.dead);

    // 升级选择弹窗暂停
    if (this.showUpgradeChoice || this.upgrading) return;
    if (this.gameOver || this.paused) return;

    // 计时
    this.gameTime += 1 / 60;

    // 输入
    this.handleInput();
    this.player.update();

    // 敌人 AI + 近战
    const enemies = this.tanks.filter(t => !t.isPlayer && t.alive);
    const difficultyDamage = getEnemyDamage(this.kills);

    for (const enemy of enemies) {
      enemy.update();
      updateEnemyAI(enemy, this.map, this.tanks, this.player);

      // 近战碰撞检测
      const meleeDmg = checkMeleeAttack(enemy, this.player, difficultyDamage);
      if (meleeDmg > 0) {
        this.meleeEffects.push(new MeleeEffect(enemy.cx, enemy.cy));
        const killed = this.player.takeDamage(meleeDmg);
        if (killed) {
          this.gameOver = true;
          this.emitState();
          return;
        }
        this.emitState();
      }
    }

    // 生成敌人
    const minutes = Math.floor(this.gameTime / 60);
    const maxAlive = getMaxAliveEnemies(minutes);
    const currentAlive = enemies.length;

    if (currentAlive < maxAlive) {
      this.spawnTimer--;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnTimer = getSpawnInterval(minutes);
      }
    }

    // 子弹 & 碰撞
    this.updateBullets();
    this.emitState();
  }

  private handleInput(): void {
    if (!this.player.alive) return;

    if (this.keys.ArrowUp || this.keys.w) {
      this.player.move(Direction.UP, this.map, this.tanks);
    } else if (this.keys.ArrowDown || this.keys.s) {
      this.player.move(Direction.DOWN, this.map, this.tanks);
    } else if (this.keys.ArrowLeft || this.keys.a) {
      this.player.move(Direction.LEFT, this.map, this.tanks);
    } else if (this.keys.ArrowRight || this.keys.d) {
      this.player.move(Direction.RIGHT, this.map, this.tanks);
    }

    const shootNow = this.keys[' '];
    if (shootNow && !this.lastShootKey) {
      this.player.shoot(this.bullets);
    }
    this.lastShootKey = shootNow;
  }

  private updateBullets(): void {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.update();
      if (!b.alive) continue;

      const col = Math.floor((b.x + b.w / 2) / CELL);
      const row = Math.floor((b.y + b.h / 2) / CELL);

      // 子弹 vs 墙壁
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        const cell = this.map[row][col];
        if (cell === 1) {
          this.map[row][col] = 0;
          this.handleBulletExplosion(b);
          b.alive = false;
          continue;
        } else if (cell === 2) {
          // 钢墙：弹射或销毁
          if (b.ricochetMax > 0 && b.ricochetCount < b.ricochetMax) {
            b.reflect();
            continue;
          }
          this.handleBulletExplosion(b);
          b.alive = false;
          continue;
        }
      }

      // 子弹 vs 子弹
      for (const other of this.bullets) {
        if (other === b || !other.alive) continue;
        if (
          b.x < other.x + other.w && b.x + b.w > other.x &&
          b.y < other.y + other.h && b.y + b.h > other.y
        ) {
          b.alive = false;
          other.alive = false;
          this.explosions.push(new Explosion((b.x + b.w / 2), (b.y + b.h / 2)));
          break;
        }
      }

      if (!b.alive) continue;

      // 子弹 vs 坦克
      for (const t of this.tanks) {
        if (!t.alive) continue;
        if (b.owner === 'player' && t.isPlayer) continue;
        if (b.owner === 'enemy' && !t.isPlayer) continue;
        if (
          b.x < t.x + t.w && b.x + b.w > t.x &&
          b.y < t.y + t.h && b.y + b.h > t.y
        ) {
          const killed = t.takeDamage(b.damage);

          this.handleBulletExplosion(b);

          if (killed) {
            this.explosions.push(new Explosion(t.cx, t.cy, true));
            if (!t.isPlayer) {
              this.kills++;
              this.score++;
              this.playerLevel = this.getLevelFromScore(this.score);

              // 吸血回复
              this.applyRegen();

              // 检查升级
              this.checkUpgrade();
            } else {
              this.gameOver = true;
            }
          } else {
            this.explosions.push(new Explosion(b.x + b.w / 2, b.y + b.h / 2));
          }

          // 穿透
          if (b.owner === 'player' && !t.isPlayer && b.pierceMax > 0) {
            b.applyPierceDamage();
            if (!b.alive) break;
            continue; // 继续飞行
          }

          b.alive = false;
          break;
        }
      }
    }

    this.bullets = this.bullets.filter(b => b.alive);
  }

  private handleBulletExplosion(b: Bullet): void {
    if (b.explosiveRadius > 0) {
      this.explosiveEffects.push(new ExplosiveEffect(b.cx, b.cy, b.explosiveRadius));
      // AoE 伤害
      const dmgPct = Math.min(100, 40 + (this.player.skills!.explosive.level - 1) * 10);
      const aoeDmg = Math.max(1, Math.floor(b.damage * dmgPct / 100));
      for (const t of this.tanks) {
        if (!t.alive) continue;
        if (b.owner === 'player' && t.isPlayer) continue;
        const dist = Math.hypot(t.cx - b.cx, t.cy - b.cy);
        if (dist <= b.explosiveRadius) {
          const killed = t.takeDamage(aoeDmg);
          if (killed) {
            this.explosions.push(new Explosion(t.cx, t.cy, true));
            if (!t.isPlayer) {
              this.kills++;
              this.score++;
              this.playerLevel = this.getLevelFromScore(this.score);
              this.applyRegen();
              this.checkUpgrade();
            } else {
              this.gameOver = true;
            }
          }
        }
      }
    }
  }

  private applyRegen(): void {
    if (!this.player.skills) return;
    const regenLevel = this.player.skills.regen.level;
    if (regenLevel > 0) {
      const heal = getRegenHeal(regenLevel);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    }
  }

  private getLevelFromScore(score: number): number {
    let level = 0;
    while (getScoreForLevel(level + 1) <= score) {
      level++;
    }
    return level;
  }

  private checkUpgrade(): void {
    const nextLevel = this.playerLevel;
    if (nextLevel > this.player.level) {
      this.player.level = nextLevel;
      this.upgrading = true;
      this.showUpgradeChoice = true;
      this.paused = true;
      this.emitState();
    }
  }

  /** 玩家已选择升级 */
  applyUpgrade(type: 'hp' | 'attack' | 'skill', skillType?: SkillType): void {
    if (type === 'hp') {
      this.hpChoiceCount++;
      const bonus = 2 + Math.floor(this.hpChoiceCount * 0.5);
      this.player.maxHp += bonus;
      this.player.hp = this.player.maxHp; // 回满
    } else if (type === 'attack') {
      this.player.attack += 1;
    } else if (type === 'skill' && skillType && this.player.skills) {
      const skill = this.player.skills[skillType as keyof PlayerSkills];
      if (skill) {
        skill.level += 1;
      }
    }

    this.upgrading = false;
    this.showUpgradeChoice = false;
    this.paused = false;
    this.emitState();
  }

  private spawnEnemy(): void {
    const enemy = trySpawnEnemy(
      this.map, this.tanks, this.kills,
      getEnemyHp,
      getEnemySpeedMultiplier,
      getEnemyDamage,
    );

    if (enemy) {
      this.tanks.push(enemy);
      this.enemiesSpawned++;
    }
  }

  private emitState(): void {
    if (!this.onStateChange) return;

    // alive enemies count used internally

    this.onStateChange({
      score: this.score,
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      attack: this.player.attack,
      level: this.player.level,
      expProgress: getExpProgress(this.score, this.player.level),
      expNeeded: getExpNeeded(this.player.level),
      kills: this.kills,
      timeSurvived: Math.floor(this.gameTime),
      gameOver: this.gameOver,
      paused: this.paused,
      upgrading: this.upgrading,
      showUpgradeChoice: this.showUpgradeChoice,
      themeId: this.theme.id,
      skills: this.player.skills || createDefaultSkills(),
    });
  }

  // ====== 绘制 ======
  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    this.drawMap(ctx);

    // 网格线
    ctx.strokeStyle = this.theme.gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, GAME_H);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(GAME_W, i * CELL);
      ctx.stroke();
    }

    // 坦克
    for (const t of this.tanks) {
      t.draw(ctx, this.frameCount, this.theme);
    }

    // 子弹
    for (const b of this.bullets) {
      b.draw(ctx);
    }

    // 特效
    for (const e of this.explosions) e.draw(ctx);
    for (const e of this.meleeEffects) e.draw(ctx);
    for (const e of this.explosiveEffects) e.draw(ctx);

    // 暂停
    if (this.paused && !this.gameOver && !this.showUpgradeChoice) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸ 暂停中', GAME_W / 2, GAME_H / 2 - 20);
      ctx.font = '18px Arial';
      ctx.fillStyle = '#aaa';
      ctx.fillText('按 Enter 继续', GAME_W / 2, GAME_H / 2 + 40);
    }
  }

  private drawMap(ctx: CanvasRenderingContext2D): void {
    const t = this.theme;
    // 背景
    ctx.fillStyle = t.groundColor;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * CELL;
        const y = row * CELL;
        const cell = this.map[row][col];

        switch (cell) {
          case 1:
            ctx.fillStyle = t.brickColor;
            ctx.fillRect(x, y, CELL, CELL);
            ctx.strokeStyle = t.brickStroke;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, CELL, CELL);
            ctx.beginPath();
            ctx.moveTo(x + CELL / 2, y);
            ctx.lineTo(x + CELL / 2, y + CELL);
            ctx.moveTo(x, y + CELL / 2);
            ctx.lineTo(x + CELL, y + CELL / 2);
            ctx.stroke();
            ctx.fillStyle = t.brickHighlight;
            ctx.fillRect(x + 2, y + 2, CELL / 2 - 3, CELL / 2 - 3);
            break;

          case 2:
            const grad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
            grad.addColorStop(0, t.steelGradient[0]);
            grad.addColorStop(0.5, t.steelGradient[1]);
            grad.addColorStop(1, t.steelGradient[2]);
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, CELL, CELL);
            ctx.strokeStyle = t.steelRivet;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
            ctx.fillStyle = t.steelRivet;
            ctx.beginPath();
            ctx.arc(x + 4, y + 4, 2, 0, Math.PI * 2);
            ctx.arc(x + CELL - 4, y + 4, 2, 0, Math.PI * 2);
            ctx.arc(x + 4, y + CELL - 4, 2, 0, Math.PI * 2);
            ctx.arc(x + CELL - 4, y + CELL - 4, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
      }
    }
  }

  // ====== 外部控制 ======
  togglePause(): void {
    if (this.gameOver || this.showUpgradeChoice) return;
    this.paused = !this.paused;
    this.emitState();
  }

  restart(): void {
    this.init();
    this.emitState();
  }

  handleKeyDown(key: string): void {
    if (key in this.keys) {
      (this.keys as unknown as Record<string, boolean>)[key] = true;
    }
    if (key === 'Enter') this.togglePause();
    if ((key === 'r' || key === 'R') && this.gameOver) this.restart();
  }

  handleKeyUp(key: string): void {
    if (key in this.keys) {
      (this.keys as unknown as Record<string, boolean>)[key] = false;
    }
  }
}
