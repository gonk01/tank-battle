// ============================================================
//  坦克大战 — 地图主题配置
// ============================================================

import type { ThemeConfig } from './types';

export const THEMES: Record<string, ThemeConfig> = {
  hell: {
    id: 'hell',
    name: '地狱暗黑',
    icon: '🔥',
    description: '岩浆与黑曜石的地狱战场',
    groundColor: '#1a1a1a',
    gridColor: 'rgba(255,0,0,0.04)',
    brickColor: '#cc4400',
    brickStroke: '#ff6600',
    brickHighlight: 'rgba(255,100,0,0.15)',
    steelGradient: ['#1a0030', '#2d0050', '#1a0030'],
    steelRivet: '#6633aa',
    playerBody: '#111111',
    playerTurret: '#cc8800',
    playerTrack: '#332200',
    playerHighlight: '#ff8800',
    playerDecal: 'flame',
    enemyBody: '#d4c5a9',
    enemyTurret: '#8b7355',
    enemyTrack: '#5c1a1a',
    enemyHighlight: '#eeeeee',
    enemyDecal: 'skull',
  },

  forest: {
    id: 'forest',
    name: '森林自然',
    icon: '🌲',
    description: '密林深处的坦克对决',
    groundColor: '#2d4a22',
    gridColor: 'rgba(100,200,50,0.04)',
    brickColor: '#6b3a2a',
    brickStroke: '#4a2a1a',
    brickHighlight: 'rgba(61,122,47,0.2)',
    steelGradient: ['#5a6b4a', '#7d8f6b', '#5a6b4a'],
    steelRivet: '#3d4a2f',
    playerBody: '#4a6b2a',
    playerTurret: '#7a5a3a',
    playerTrack: '#2a3a1a',
    playerHighlight: '#8ab86a',
    playerDecal: 'leaf',
    enemyBody: '#5c3a1e',
    enemyTurret: '#8b6914',
    enemyTrack: '#3a2210',
    enemyHighlight: '#a08050',
    enemyDecal: 'thorn',
  },

  ww2: {
    id: 'ww2',
    name: '二战写实',
    icon: '⚔️',
    description: '重返二战战场',
    groundColor: '#3d3828',
    gridColor: 'rgba(180,160,100,0.04)',
    brickColor: '#b8956a',
    brickStroke: '#8b7355',
    brickHighlight: 'rgba(180,140,80,0.15)',
    steelGradient: ['#7a7a7a', '#9a9a9a', '#6a6a6a'],
    steelRivet: '#5a5a5a',
    playerBody: '#5d6d3a',
    playerTurret: '#3d4d22',
    playerTrack: '#2a3a15',
    playerHighlight: '#8a9a5a',
    playerDecal: 'star',
    enemyBody: '#4d5256',
    enemyTurret: '#3a3d40',
    enemyTrack: '#2a2d30',
    enemyHighlight: '#7a7d80',
    enemyDecal: 'cross',
  },
};

export function getTheme(id: string): ThemeConfig {
  return THEMES[id] || THEMES.forest;
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}
