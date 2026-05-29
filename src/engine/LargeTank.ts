// ============================================================
//  坦克大战 — 大型远程坦克
// ============================================================

import { Direction } from './types';
import type { GameMap, ThemeConfig, Difficulty as DifficultyType } from './types';
import {
  LARGE_TANK_SIZE,
  LARGE_TANK_SPEED,
  LARGE_TANK_PURSUIT_SPEED,
  LARGE_TANK_SHOOT_INTERVAL,
  LARGE_TANK_MIN_RANGE,
  LARGE_TANK_MAX_RANGE,
  GAME_W, GAME_H,
  DIFFICULTY_CONFIGS,
} from './constants';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { collidesWithMap } from './collision';

export class LargeTank {
  x: number;
  y: number;
  w = LARGE_TANK_SIZE;
  h = LARGE_TANK_SIZE;
  dir: Direction = Direction.DOWN;
  alive = true;
  flash = 0;

  hp: number;
  maxHp: number;
  attack: number;
  shootCooldown = 0;

  hpDoubleTimer = 0;       // 存活帧数
  hpDoubleTime: number;     // 翻倍阈值（帧）
  hpDoubled = false;

  pursuitTimer = 0;         // 追击剩余帧数
  speedBoost: boolean;

  originalSpawnX: number;
  originalSpawnY: number;

  private aiTimer = 30;

  constructor(spawnX: number, spawnY: number, difficulty: DifficultyType, playerMaxHp: number) {
    this.x = spawnX;
    this.y = spawnY;
    this.originalSpawnX = spawnX;
    this.originalSpawnY = spawnY;

    const cfg = DIFFICULTY_CONFIGS[difficulty];
    this.maxHp = Math.max(3, Math.floor(playerMaxHp * cfg.largeTankHpMultiplier));
    this.hp = this.maxHp;
    this.attack = Math.max(2, Math.floor(playerMaxHp * 0.3));
    this.hpDoubleTime = cfg.largeTankHpDoubleTime * 60;
    this.speedBoost = cfg.largeTankSpeedBoost;
  }

  get cx(): number { return this.x + this.w / 2; }
  get cy(): number { return this.y + this.h / 2; }

  update(
    map: GameMap,
    tanks: Tank[],
    player: Tank,
    bullets: Bullet[],
  ): void {
    if (!this.alive) return;

    // 更新计时器
    this.shootCooldown--;
    if (this.flash > 0) this.flash--;
    this.aiTimer--;
    this.hpDoubleTimer++;

    // HP 翻倍检查
    if (!this.hpDoubled && this.hpDoubleTimer >= this.hpDoubleTime) {
      this.hpDoubled = true;
      this.maxHp *= 2;
      this.hp = this.maxHp;
    }

    if (!player.alive) return;

    const dist = Math.hypot(this.cx - player.cx, this.cy - player.cy);
    const pursuit = this.pursuitTimer > 0;

    // 移动 AI
    if (this.aiTimer <= 0) {
      this.aiTimer = 20 + Math.floor(Math.random() * 30);

      if (pursuit) {
        // 追击模式：直接朝玩家移动
        this.moveToward(player.cx, player.cy);
      } else if (dist < LARGE_TANK_MIN_RANGE) {
        // 太近：后退
        this.moveAway(player.cx, player.cy);
      } else if (dist > LARGE_TANK_MAX_RANGE) {
        // 太远：靠近
        this.moveToward(player.cx, player.cy);
      } else {
        // 理想距离：侧移
        const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        const perpDirs = dirs.filter(d => {
          const dx = player.cx - this.cx;
          const dy = player.cy - this.cy;
          if (Math.abs(dx) > Math.abs(dy)) {
            return d === Direction.UP || d === Direction.DOWN;
          }
          return d === Direction.LEFT || d === Direction.RIGHT;
        });
        this.dir = perpDirs[Math.floor(Math.random() * perpDirs.length)];
      }
    }

    // 尝试移动
    const speed = pursuit ? (this.speedBoost ? LARGE_TANK_PURSUIT_SPEED + 0.2 : LARGE_TANK_PURSUIT_SPEED) : LARGE_TANK_SPEED;
    const moved = this.tryMove(this.dir, speed, map, tanks);
    if (!moved) {
      const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]
        .filter(d => d !== this.dir);
      this.dir = dirs[Math.floor(Math.random() * dirs.length)];
    }

    // 射击
    if (this.shootCooldown <= 0 && dist <= LARGE_TANK_MAX_RANGE + 50) {
      this.fireAtPlayer(player, bullets);
      this.shootCooldown = LARGE_TANK_SHOOT_INTERVAL;
    }

    // 追击计时器
    if (this.pursuitTimer > 0) {
      this.pursuitTimer--;
    }
  }

  private moveToward(tx: number, ty: number): void {
    const dx = tx - this.cx;
    const dy = ty - this.cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      this.dir = dy > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  private moveAway(tx: number, ty: number): void {
    const dx = tx - this.cx;
    const dy = ty - this.cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dir = dx > 0 ? Direction.LEFT : Direction.RIGHT;
    } else {
      this.dir = dy > 0 ? Direction.UP : Direction.DOWN;
    }
  }

  private tryMove(dir: Direction, speed: number, map: GameMap, tanks: Tank[]): boolean {
    const dx = [0, 1, 0, -1][dir];
    const dy = [-1, 0, 1, 0][dir];
    const newX = this.x + dx * speed;
    const newY = this.y + dy * speed;

    if (newX < 0 || newX > GAME_W - this.w || newY < 0 || newY > GAME_H - this.h)
      return false;

    if (collidesWithMap({ x: newX, y: newY, w: this.w, h: this.h }, map))
      return false;

    // 与其他坦克碰撞
    for (const t of tanks) {
      if (!t.alive) continue;
      if (
        newX < t.x + t.w && newX + this.w > t.x &&
        newY < t.y + t.h && newY + this.h > t.y
      ) return false;
    }

    this.x = newX;
    this.y = newY;
    return true;
  }

  private fireAtPlayer(player: Tank, bullets: Bullet[]): void {
    // 朝玩家方向射击
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    let dir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      dir = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    const offset = this.w / 2 + 4;
    const pdx = [0, 1, 0, -1][dir];
    const pdy = [-1, 0, 1, 0][dir];
    const bx = this.cx + pdx * offset;
    const by = this.cy + pdy * offset;

    const bullet = new Bullet(bx, by, dir, 'enemy', this.attack);
    // 覆盖子弹速度为大型坦克专用速度
    bullets.push(bullet);
  }

  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    this.flash = 10;
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, frameCount: number, theme: ThemeConfig): void {
    if (!this.alive) return;
    if (this.flash > 0 && Math.floor(this.flash / 3) % 2 === 0) return;

    const cx = this.cx;
    const cy = this.cy;
    const hw = this.w / 2;
    const hh = this.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.dir * (Math.PI / 2));

    // 脉冲红光（hpDoubled 时更强）
    const pulseAlpha = this.hpDoubled
      ? 0.15 + 0.08 * Math.sin(frameCount * 0.1)
      : 0.06 + 0.03 * Math.sin(frameCount * 0.05);
    const pulseGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, hw + 10);
    pulseGrad.addColorStop(0, `rgba(255,30,0,${pulseAlpha})`);
    pulseGrad.addColorStop(1, 'rgba(255,30,0,0)');
    ctx.fillStyle = pulseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hw + 10, 0, Math.PI * 2);
    ctx.fill();

    // 履带（双倍宽度）
    ctx.fillStyle = theme.enemyTrack;
    ctx.fillRect(-hw, -hh, this.w, 8);
    ctx.fillRect(-hw, hh - 8, this.w, 8);

    // 履带纹路
    ctx.strokeStyle = '#3a1a1a';
    ctx.lineWidth = 1.5;
    for (let i = -hw + 5; i < hw - 4; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, -hh + 2);
      ctx.lineTo(i, -hh + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, hh - 7);
      ctx.lineTo(i, hh - 2);
      ctx.stroke();
    }

    // 主体
    const bodyW = this.w - 12;
    const bodyH = this.h - 16;
    ctx.fillStyle = this.hpDoubled ? '#6a2020' : theme.enemyBody;
    ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

    // 高光
    ctx.fillStyle = theme.enemyHighlight;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-bodyW / 2 + 4, -bodyH / 2 + 4, bodyW - 8, 4);
    if (this.hpDoubled) {
      ctx.fillStyle = 'rgba(255,50,0,0.4)';
      ctx.fillRect(-bodyW / 2 + 2, bodyH / 2 - 6, bodyW - 4, 3);
    }
    ctx.globalAlpha = 1;

    // 骷髅标识
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-4, -6, 3, 3);
    ctx.fillRect(2, -6, 3, 3);

    // 大型炮塔
    ctx.fillStyle = theme.enemyTurret;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.enemyHighlight;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // 大型炮管
    ctx.fillStyle = theme.enemyTurret;
    ctx.fillRect(-5, -hh + 4, 10, hh - 8);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-4, -hh + 2, 8, 4);

    ctx.restore();

    // HP 条（绘制在坦克上方）
    const barW = this.w + 8;
    const barH = 6;
    const barX = this.x - 4;
    const barY = this.y - 10;
    const hpRatio = this.hp / this.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = this.hpDoubled ? '#ff4444' : '#ff6600';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // 等级标识（hpDoubled 时显示 ⚡）
    if (this.hpDoubled) {
      ctx.fillStyle = '#ff0';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', this.cx, barY - 4);
    }
  }
}
