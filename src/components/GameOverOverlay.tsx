// ============================================================
//  坦克大战 — 游戏结束蒙层（双按钮：重开 / 调整难度）
// ============================================================

import React from 'react';
import { DIFFICULTY_NAMES } from '../engine/types';
import type { Difficulty as DifficultyType, PlayerSpecialSkills } from '../engine/types';
import { SPECIAL_SKILL_ICONS, SPECIAL_SKILL_NAMES, SpecialSkillType } from '../engine/types';

interface GameOverOverlayProps {
  gameOver: boolean;
  score: number;
  kills: number;
  timeSurvived: number;
  level: number;
  difficulty: DifficultyType;
  specialSkills: PlayerSpecialSkills;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  gameOver, kills, timeSurvived, level, difficulty, specialSkills, onRestart, onBackToMenu,
}) => {
  if (!gameOver) return null;

  const minutes = Math.floor(timeSurvived / 60);
  const seconds = timeSurvived % 60;

  const unlockedSpecial = Object.values(SpecialSkillType)
    .filter(t => specialSkills[t]?.level > 0);

  return (
    <div style={styles.overlay}>
      <h1 style={styles.title}>💥 游戏结束</h1>

      <div style={styles.diffBadge}>
        {DIFFICULTY_NAMES[difficulty]} 难度
      </div>

      <div style={styles.stats}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>💀 击杀数</span>
          <span style={styles.statValue}>{kills}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>⭐ 最高等级</span>
          <span style={styles.statValue}>{level}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>⏱ 存活时间</span>
          <span style={styles.statValue}>{minutes}:{seconds.toString().padStart(2, '0')}</span>
        </div>
        {unlockedSpecial.length > 0 && (
          <div style={styles.statRow}>
            <span style={styles.statLabel}>🔮 特殊技能</span>
            <span style={styles.statValue}>
              {unlockedSpecial.map(t => `${SPECIAL_SKILL_ICONS[t]}${SPECIAL_SKILL_NAMES[t]} Lv.${specialSkills[t].level}`).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div style={styles.btnRow}>
        <button style={styles.btnRestart} onClick={onRestart}>🔄 重新开始</button>
        <button style={styles.btnMenu} onClick={onBackToMenu}>⚙️ 调整难度</button>
      </div>
      <p style={styles.hint}>按 R 键重新开始 · 按 ESC 返回选择</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.82)',
    borderRadius: 4,
    zIndex: 10,
  },
  title: {
    color: '#ff4444',
    fontSize: 38,
    margin: 0,
    marginBottom: 8,
    textShadow: '0 0 20px rgba(255,0,0,0.5)',
  },
  diffBadge: {
    background: 'rgba(255,215,0,0.15)',
    color: '#ffd700',
    padding: '2px 14px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
    background: 'rgba(255,255,255,0.05)',
    padding: '12px 20px',
    borderRadius: 12,
    maxWidth: 320,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    fontSize: 14,
  },
  statLabel: { color: '#ccc' },
  statValue: { color: '#ffd700', fontWeight: 'bold', fontSize: 12, maxWidth: 180, textAlign: 'right' },
  btnRow: {
    display: 'flex',
    gap: 12,
  },
  btnRestart: {
    padding: '10px 28px',
    fontSize: 15,
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  btnMenu: {
    padding: '10px 28px',
    fontSize: 15,
    background: '#0f3460',
    color: '#fff',
    border: '1px solid #4fc3f7',
    borderRadius: 8,
    cursor: 'pointer',
  },
  hint: {
    color: '#666',
    fontSize: 11,
    marginTop: 8,
  },
};
