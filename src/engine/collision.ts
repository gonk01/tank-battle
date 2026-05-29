// ============================================================
//  坦克大战 — 碰撞检测工具
// ============================================================

import type { Rect } from './types';
import { CELL, COLS, ROWS } from './constants';

/** 矩形碰撞检测 */
export function rectCollide(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * 检测矩形是否与地图中的非空单元格碰撞
 */
export function collidesWithMap(rect: Rect, map: number[][]): boolean {
  const margin = 1;
  const r: Rect = {
    x: rect.x + margin,
    y: rect.y + margin,
    w: rect.w - margin * 2,
    h: rect.h - margin * 2,
  };

  const startCol = Math.max(0, Math.floor(r.x / CELL));
  const endCol = Math.min(COLS - 1, Math.floor((r.x + r.w - 0.01) / CELL));
  const startRow = Math.max(0, Math.floor(r.y / CELL));
  const endRow = Math.min(ROWS - 1, Math.floor((r.y + r.h - 0.01) / CELL));

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (map[row][col] !== 0) return true;
    }
  }
  return false;
}

/** 检查一个矩形区域内是否有任何非空单元格 */
export function isAreaClear(
  cx: number,
  cy: number,
  halfSize: number,
  map: number[][]
): boolean {
  const r: Rect = {
    x: cx - halfSize,
    y: cy - halfSize,
    w: halfSize * 2,
    h: halfSize * 2,
  };
  return !collidesWithMap(r, map);
}
