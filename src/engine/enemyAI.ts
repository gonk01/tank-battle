// ============================================================
//  坦克大战 — 敌人 AI（近战）
// ============================================================

import { Tank } from './Tank';
import { Direction } from './types';
import type { GameMap } from './types';
import { CELL, TANK_SIZE } from './constants';
import { collidesWithMap } from './collision';

/** 敌人 AI：移动 + 近战攻击 */
export function updateEnemyAI(
  enemy: Tank,
  map: GameMap,
  allTanks: Tank[],
  player: Tank
): number {
  if (!enemy.alive) return 0;

  enemy.aiTimer--;

  if (enemy.aiTimer <= 0) {
    // 60% 朝玩家方向
    if (Math.random() < 0.6 && player.alive) {
      const dx = player.cx - enemy.cx;
      const dy = player.cy - enemy.cy;
      if (Math.abs(dx) > Math.abs(dy)) {
        enemy.dir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        enemy.dir = dy > 0 ? Direction.DOWN : Direction.UP;
      }
    } else {
      const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
      enemy.dir = dirs[Math.floor(Math.random() * dirs.length)];
    }
    enemy.aiTimer = 30 + Math.floor(Math.random() * 40); // 更活跃
  }

  const moved = enemy.move(enemy.dir, map, allTanks);
  if (!moved) {
    const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]
      .filter(d => d !== enemy.dir);
    enemy.dir = dirs[Math.floor(Math.random() * dirs.length)];
  }

  return 0;
}

/** 检测敌人近战攻击，返回伤害值（0=无攻击） */
export function checkMeleeAttack(enemy: Tank, player: Tank, difficultyDamage: number): number {
  if (!enemy.alive || !player.alive) return 0;
  if (enemy.meleeCooldown > 0) return 0;

  // 距离检测 ≤ 48px
  const dist = Math.hypot(enemy.cx - player.cx, enemy.cy - player.cy);
  if (dist > 48) return 0;

  enemy.meleeCooldown = 60; // 1 秒冷却
  return difficultyDamage;
}

/** 敌人出生点（四边随机） */
export const ENEMY_SPAWN_POSITIONS = (() => {
  return Array.from({ length: 40 }, (_, i) => {
    // 每边 10 个位置
    if (i < 10) return { col: 2 + i * 3, row: 0 };           // 上
    if (i < 20) return { col: 2 + (i - 10) * 3, row: 23 };   // 下
    if (i < 30) return { col: 0, row: 2 + (i - 20) * 2 };    // 左
    return { col: 31, row: 2 + (i - 30) * 2 };                // 右
  });
})();

/** 尝试生成新敌人 */
export function trySpawnEnemy(
  map: GameMap,
  allTanks: Tank[],
  kills: number,
  getEnemyHpFn: (kills: number) => number,
  _getEnemySpeedFn: (kills: number) => number,
  _getEnemyDamageFn: (kills: number) => number,
): Tank | null {
  const shuffled = [...ENEMY_SPAWN_POSITIONS].sort(() => Math.random() - 0.5);

  for (const pos of shuffled) {
    const sx = pos.col * CELL + (CELL - TANK_SIZE) / 2;
    const sy = pos.row * CELL + (CELL - TANK_SIZE) / 2;

    const blocked = allTanks.some(
      t => t.alive && Math.abs(t.x - sx) < TANK_SIZE && Math.abs(t.y - sy) < TANK_SIZE
    );
    if (blocked) continue;

    if (collidesWithMap({ x: sx, y: sy, w: TANK_SIZE, h: TANK_SIZE }, map)) continue;

    const enemy = new Tank(sx, sy, Direction.DOWN, false);
    enemy.flash = 30;
    enemy.maxHp = getEnemyHpFn(kills);
    enemy.hp = enemy.maxHp;
    // 速度通过外部乘数调整
    // 伤害固定为 1（近战）
    return enemy;
  }

  return null;
}
