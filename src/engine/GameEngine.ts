// ============================================================
//  坦克大战 — 游戏引擎（无尽模式）
// ============================================================

import type { GameState, KeysPressed, Difficulty as DifficultyType } from './types';
import { Direction, Difficulty, SpecialSkillType } from './types';
import type { SkillType, ThemeConfig, SpecialSkillType as SpecialSkillTypeType } from './types';
import {
  CELL, COLS, ROWS, TANK_SIZE,
  GAME_W, GAME_H,
  PLAYER_SPAWN_COL, PLAYER_SPAWN_ROW,
  getSpawnInterval, getMaxAliveEnemies,
  getKillExpProgress, getKillExpNeeded, getLevelFromKills,
  createDefaultSkills,
  getEnemyHp, getEnemySpeedMultiplier, getEnemyDamage,
  getRegenHeal,
  DIFFICULTY_CONFIGS,
  PLAYER_INITIAL_HP, PLAYER_INITIAL_ATTACK,
  LARGE_TANK_WARNING_DURATION,
  LARGE_TANK_RESPAWN_LEVEL_INTERVAL,
} from './constants';
import { createMap } from './map';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { Explosion, MeleeEffect, ExplosiveEffect } from './Explosion';
import { updateEnemyAI, trySpawnEnemy, checkMeleeAttack, updateCloneAI } from './enemyAI';
import { SoundManager } from './SoundManager';
import { LargeTank } from './LargeTank';
import { SpecialSkillManager } from './SpecialSkillManager';

type StateCallback = (state: GameState) => void;

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  theme: ThemeConfig;
  difficulty: DifficultyType;
  sound: SoundManager;

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
  showSpecialSkillChoice = false;
  specialSkillChoices: SpecialSkillTypeType[] = [];
  pendingIceSlowChoice = false;
  gameTime = 0;

  // 大型坦克
  largeTank: LargeTank | null = null;
  largeTankSpawnTimer = 0;
  largeTankWarningTimer = 0;
  largeTankWarningVisible = false;
  largeTankWarningX = 0;
  largeTankWarningY = 0;
  lastPlayerLevelForRespawn = 0;

  // 特殊技能管理器
  skillManager: SpecialSkillManager;

  // 地雷
  mines: { x: number; y: number; size: number; alive: boolean; pulseTimer: number }[] = [];

  frameCount = 0;
  lastTime = 0;
  accumulator = 0;
  readonly tickRate = 1000 / 60;
  running = false;
  rafId = 0;

  onStateChange: StateCallback | null = null;
  onUpgradeChoice: ((choices: any) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, theme: ThemeConfig, difficulty: DifficultyType = Difficulty.NORMAL) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = GAME_W;
    this.canvas.height = GAME_H;
    this.theme = theme;
    this.difficulty = difficulty;
    this.sound = new SoundManager();
    this.skillManager = new SpecialSkillManager(
      null as any, this.tanks, this.bullets, this.map, this.sound
    );

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
    t.maxHp = PLAYER_INITIAL_HP;
    t.hp = PLAYER_INITIAL_HP;
    t.attack = PLAYER_INITIAL_ATTACK;
    return t;
  }

  init(): void {
    this.map = createMap();
    this.tanks = [];
    this.bullets = [];
    this.explosions = [];
    this.meleeEffects = [];
    this.explosiveEffects = [];
    this.mines = [];
    this.score = 0;
    this.kills = 0;
    this.playerLevel = 0;
    this.hpChoiceCount = 0;
    this.enemiesSpawned = 0;
    this.spawnTimer = 60;
    this.gameOver = false;
    this.upgrading = false;
    this.showUpgradeChoice = false;
    this.showSpecialSkillChoice = false;
    this.specialSkillChoices = [];
    this.pendingIceSlowChoice = false;
    this.paused = false;
    this.gameTime = 0;
    this.frameCount = 0;
    this.lastTime = 0;
    this.accumulator = 0;

    // 大型坦克重置
    this.largeTank = null;
    this.largeTankSpawnTimer = DIFFICULTY_CONFIGS[this.difficulty].largeTankSpawnInterval * 60;
    this.largeTankWarningVisible = false;
    this.largeTankWarningTimer = 0;
    this.lastPlayerLevelForRespawn = 0;

    this.player = this.createPlayer();
    this.tanks.push(this.player);

    // 重新初始化 skillManager
    this.skillManager.setPlayer(this.player);
    this.skillManager.setTanks(this.tanks);
    this.mines = this.skillManager.mines;

    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    for (let i = 0; i < cfg.initialEnemyCount; i++) {
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

    // 地雷脉冲动画
    for (const m of this.mines) {
      if (m.alive) m.pulseTimer++;
    }

    // 特殊技能管理器更新
    this.skillManager.update(this.frameCount);
    this.mines = this.skillManager.mines;

    // 升级选择弹窗暂停
    if (this.showUpgradeChoice || this.upgrading) return;
    if (this.gameOver || this.paused) return;

    // 计时
    this.gameTime += 1 / 60;

    // 输入
    this.handleInput();
    this.player.update();

    // 敌人 AI + 近战
    const enemies = this.tanks.filter(t => !t.isPlayer && t.alive && !(t as any).isClone);
    const clones = this.tanks.filter(t => (t as any).isClone && t.alive);
    const isPlayerInvisible = this.skillManager.isPlayerInvisibleNow();
    const difficultyDamage = getEnemyDamage(this.kills, this.difficulty);

    for (const enemy of enemies) {
      enemy.update();
      updateEnemyAI(enemy, this.map, this.tanks, this.player, isPlayerInvisible);

      const meleeDmg = checkMeleeAttack(enemy, this.player, difficultyDamage);
      if (meleeDmg > 0) {
        this.meleeEffects.push(new MeleeEffect(enemy.cx, enemy.cy));
        // 瞬移检查
        let teleported = false;
        teleported = this.skillManager.onPlayerDamage();
        if (!teleported) {
          this.sound.playPlayerHit();
          const killed = this.player.takeDamage(meleeDmg);
          if (killed) {
            this.gameOver = true;
            this.sound.playExplosion();
            this.emitState();
            return;
          }
        } else {
          this.sound.playTeleport();
        }
        this.emitState();
      }
    }

    // 分身 AI
    for (const clone of clones) {
      clone.update();
      updateCloneAI(clone, this.map, this.tanks, this.player);
      // 分身碰撞自爆
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = clone.cx - enemy.cx;
        const dy = clone.cy - enemy.cy;
        if (Math.abs(dx) < TANK_SIZE && Math.abs(dy) < TANK_SIZE) {
          const dmg = this.player.attack * 2;
          const killed = enemy.takeDamage(dmg);
          this.explosions.push(new Explosion(clone.cx, clone.cy, true));
          this.sound.playExplosion();
          clone.alive = false;
          if (killed) {
            this.kills++;
            this.score++;
            this.playerLevel = getLevelFromKills(this.kills, this.difficulty);
            this.applyRegen();
            this.checkUpgrade();
          }
          break;
        }
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

    // 大型坦克逻辑（仅当玩家有特殊技能时）
    if (this.playerHasAnySpecialSkill()) {
      // 预警阶段
      if (this.largeTankWarningVisible) {
        this.largeTankWarningTimer--;
        if (this.largeTankWarningTimer % 60 === 0) {
          this.sound.playLargeTankWarning();
        }
        if (this.largeTankWarningTimer <= 0) {
          this.largeTankWarningVisible = false;
          this.spawnLargeTank();
        }
      } else if (!this.largeTank || !this.largeTank.alive) {
        this.largeTankSpawnTimer--;
        if (this.largeTankSpawnTimer <= 0) {
          // 显示预警
          this.startLargeTankWarning();
        }
      }

      // 大型坦克更新
      if (this.largeTank && this.largeTank.alive) {
        this.largeTank.update(this.map, this.tanks, this.player, this.bullets);
      }
    }

    // 地雷碰撞检测
    const allEnemies = this.tanks.filter(t => !t.isPlayer && t.alive && !(t as any).isClone);
    for (const m of this.mines) {
      if (!m.alive) continue;
      for (const enemy of allEnemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(m.x - enemy.cx, m.y - enemy.cy);
        if (dist < m.size + TANK_SIZE / 2) {
          const dmg = Math.ceil(this.player.attack * 1.5);
          const killed = enemy.takeDamage(dmg);
          m.alive = false;
          this.explosions.push(new Explosion(m.x, m.y));
          this.sound.playExplosion();
          if (killed) {
            this.kills++;
            this.score = this.kills;
            this.playerLevel = getLevelFromKills(this.kills, this.difficulty);
            this.applyRegen();
            this.checkUpgrade();
          }
          break;
        }
      }
    }

    // 子弹 & 碰撞
    this.updateBullets();
    this.emitState();
  }

  /** 检查玩家是否解锁了任意特殊技能 */
  private playerHasAnySpecialSkill(): boolean {
    if (!this.player.skills) return false;
    const special = this.player.skills.special;
    return Object.values(special).some((s: any) => s.level > 0);
  }

  /** 开始大型坦克预警 */
  private startLargeTankWarning(): void {
    const spawnCol = Math.floor(COLS / 2);
    const spawnRow = 2;
    this.largeTankWarningX = spawnCol * CELL + (CELL - 56) / 2;
    this.largeTankWarningY = spawnRow * CELL + (CELL - 56) / 2;
    this.largeTankWarningTimer = LARGE_TANK_WARNING_DURATION;
    this.largeTankWarningVisible = true;
    this.sound.playLargeTankWarning();
  }

  /** 生成大型坦克 */
  private spawnLargeTank(): void {
    const spawnCol = Math.floor(COLS / 2);
    const spawnRow = 2;
    const sx = spawnCol * CELL + (CELL - 56) / 2;
    const sy = spawnRow * CELL + (CELL - 56) / 2;
    this.largeTank = new LargeTank(sx, sy, this.difficulty, this.player.maxHp);
    this.sound.playLargeTankSpawn();
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
      this.sound.playShoot();
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
        // 追踪弹不伤害分身
        if ((b as any).homingTarget && (t as any).isClone) continue;
        if (
          b.x < t.x + t.w && b.x + b.w > t.x &&
          b.y < t.y + t.h && b.y + b.h > t.y
        ) {
          const killed = t.takeDamage(b.damage);

          this.handleBulletExplosion(b);

          if (killed) {
            this.explosions.push(new Explosion(t.cx, t.cy, true));
            this.sound.playEnemyDeath();
            if (!t.isPlayer) {
              this.kills++;
              this.score = this.kills;
              this.playerLevel = getLevelFromKills(this.kills, this.difficulty);

              this.applyRegen();
              this.checkUpgrade();
            } else {
              this.gameOver = true;
              this.sound.playExplosion();
            }
          } else {
            this.explosions.push(new Explosion(b.x + b.w / 2, b.y + b.h / 2));
          }

          // 穿透
          if (b.owner === 'player' && !t.isPlayer && b.pierceMax > 0) {
            b.applyPierceDamage();
            if (!b.alive) break;
            continue;
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
      this.sound.playExplosion();
      const dmgPct = this.player.skills
        ? Math.min(100, 40 + (this.player.skills.explosive.level - 1) * 10)
        : 100;
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
              this.score = this.kills;
              this.playerLevel = getLevelFromKills(this.kills, this.difficulty);
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

  private checkUpgrade(): void {
    if (this.playerLevel > this.player.level) {
      this.player.level = this.playerLevel;
      this.upgrading = true;
      this.showUpgradeChoice = true;
      this.paused = true;
      this.sound.playLevelUp();
      this.emitState();

      // 大型坦克追击
      if (this.largeTank && this.largeTank.alive && this.largeTank.pursuitTimer !== undefined) {
        this.largeTank.pursuitTimer = 300; // 5 秒追击
      }

      // 每 5 级复活大型坦克
      if (this.playerLevel > 0 && this.playerLevel % LARGE_TANK_RESPAWN_LEVEL_INTERVAL === 0) {
        if (this.playerLevel !== this.lastPlayerLevelForRespawn && this.playerHasAnySpecialSkill()) {
          this.lastPlayerLevelForRespawn = this.playerLevel;
          if (!this.largeTank || !this.largeTank.alive) {
            this.startLargeTankWarning();
          }
        }
      }
    }
  }

  /** 玩家已选择升级（HP/ATK） */
  applyUpgrade(type: 'hp' | 'attack', _skillType?: SkillType): void {
    if (type === 'hp') {
      this.hpChoiceCount++;
      const bonus = 2 + Math.floor(this.hpChoiceCount * 0.5);
      this.player.maxHp += bonus;
      this.player.hp = this.player.maxHp;
    } else if (type === 'attack') {
      this.player.attack += 1;
    }

    this.upgrading = false;
    this.showUpgradeChoice = false;
    this.paused = false;
    this.emitState();
  }

  /** 选择特殊技能（触发二阶段） */
  selectSpecialSkillChoice(): void {
    if (!this.player.skills) return;
    const allTypes = Object.values(SpecialSkillType) as SpecialSkillTypeType[];
    // 随机抽 3 个（排除已达上限的：分身和追踪弹上限 5，其他无限）
    const available = allTypes.filter(t => {
      const s = this.player.skills!.special[t];
      if (t === SpecialSkillType.CLONE || t === SpecialSkillType.HOMING) {
        return s.level < 5;
      }
      return true;
    });
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    this.specialSkillChoices = shuffled.slice(0, 3);
    this.showSpecialSkillChoice = true;
    this.showUpgradeChoice = false;
    this.emitState();
  }

  /** 应用特殊技能选择 */
  applySpecialSkill(type: SpecialSkillTypeType): void {
    if (!this.player.skills) return;
    const skill = this.player.skills.special[type];
    if (skill) {
      skill.level += 1;
    }
    // 通知 skillManager
    this.skillManager.onSkillChosen(type);
    this.sound.playSpecialSkillActivate();

    // 冰封子选择
    if (type === SpecialSkillType.ICE_SLOW && skill && skill.level > 1) {
      this.pendingIceSlowChoice = true;
      this.showSpecialSkillChoice = false;
      this.emitState();
      return;
    }

    this.showSpecialSkillChoice = false;
    this.upgrading = false;
    this.paused = false;
    this.emitState();
  }

  /** 冰封子选择 */
  applyIceSlowChoice(choice: 'cooldown' | 'slow'): void {
    if (choice === 'cooldown') {
      this.skillManager.onIceSlowCooldownBoost();
    } else {
      this.skillManager.onIceSlowSlowBoost();
    }
    this.pendingIceSlowChoice = false;
    this.upgrading = false;
    this.paused = false;
    this.emitState();
  }

  /** 切换音效 */
  toggleSound(): void {
    this.sound.toggleMute();
    this.emitState();
  }

  private spawnEnemy(): void {
    const enemy = trySpawnEnemy(
      this.map, this.tanks, this.kills,
      (k: number) => getEnemyHp(k, this.difficulty),
      getEnemySpeedMultiplier,
      (k: number) => getEnemyDamage(k, this.difficulty),
    );

    if (enemy) {
      this.tanks.push(enemy);
      this.enemiesSpawned++;
    }
  }

  private emitState(): void {
    if (!this.onStateChange) return;

    this.onStateChange({
      score: this.score,
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      attack: this.player.attack,
      level: this.player.level,
      expProgress: getKillExpProgress(this.kills, this.player.level, this.difficulty),
      expNeeded: getKillExpNeeded(this.player.level, this.difficulty),
      kills: this.kills,
      timeSurvived: Math.floor(this.gameTime),
      gameOver: this.gameOver,
      paused: this.paused,
      upgrading: this.upgrading,
      showUpgradeChoice: this.showUpgradeChoice,
      themeId: this.theme.id,
      difficulty: this.difficulty,
      skills: this.player.skills || createDefaultSkills(),
      specialSkills: this.player.skills?.special || createDefaultSkills().special,
      showSpecialSkillChoice: this.showSpecialSkillChoice,
      specialSkillChoices: this.specialSkillChoices,
      pendingIceSlowChoice: this.pendingIceSlowChoice,
      hasLargeTankWarning: this.largeTankWarningVisible,
      soundMuted: this.sound.isMuted,
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

    // 大型坦克预警
    if (this.largeTankWarningVisible) {
      this.drawLargeTankWarning(ctx);
    }

    // 坦克
    for (const t of this.tanks) {
      t.draw(ctx, this.frameCount, this.theme);
    }

    // 大型坦克
    if (this.largeTank && this.largeTank.alive) {
      this.largeTank.draw(ctx, this.frameCount, this.theme);
    }

    // 子弹
    for (const b of this.bullets) {
      b.draw(ctx);
    }

    // 地雷
    for (const m of this.mines) {
      if (!m.alive) continue;
      const pulse = 1 + 0.3 * Math.sin(m.pulseTimer * 0.1);
      ctx.fillStyle = 'rgba(255,50,0,0.6)';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 1;
      ctx.stroke();
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

  private drawLargeTankWarning(ctx: CanvasRenderingContext2D): void {
    const progress = 1 - this.largeTankWarningTimer / LARGE_TANK_WARNING_DURATION;
    const pulseSize = 20 + 40 * Math.sin(progress * Math.PI * 6);
    const alpha = 0.3 + 0.3 * Math.sin(progress * Math.PI * 6);

    ctx.fillStyle = `rgba(255,0,0,${alpha})`;
    ctx.beginPath();
    ctx.arc(
      this.largeTankWarningX + 28,
      this.largeTankWarningY + 28,
      pulseSize,
      0, Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = `rgba(255,50,0,${alpha + 0.2})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 中心十字标记
    const cx = this.largeTankWarningX + 28;
    const cy = this.largeTankWarningY + 28;
    ctx.strokeStyle = `rgba(255,0,0,${alpha + 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();
  }

  private drawMap(ctx: CanvasRenderingContext2D): void {
    const t = this.theme;
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
