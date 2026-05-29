// ============================================================
//  坦克大战 — 游戏结束蒙层
// ============================================================

import React from 'react';

interface GameOverOverlayProps {
  gameOver: boolean;
  score: number;
  kills: number;
  timeSurvived: number;
  level: number;
  onRestart: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  gameOver, score, kills, timeSurvived, level, onRestart,
}) => {
  if (!gameOver) return null;

  const minutes = Math.floor(timeSurvived / 60);
  const seconds = timeSurvived % 60;

  return (
    <div style={styles.overlay}>
      <h1 style={styles.title}>💥 游戏结束</h1>
      <div style={styles.stats}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>🏆 最终得分</span>
          <span style={styles.statValue}>{score}</span>
        </div>
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
      </div>
      <button style={styles.btn} onClick={onRestart}>🔄 重新开始</button>
      <p style={styles.hint}>或按 R 键重新开始</p>
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
    background: 'rgba(0,0,0,0.8)',
    borderRadius: 4,
    zIndex: 10,
  },
  title: {
    color: '#ff4444',
    fontSize: 42,
    margin: 0,
    marginBottom: 16,
    textShadow: '0 0 20px rgba(255,0,0,0.5)',
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20,
    background: 'rgba(255,255,255,0.05)',
    padding: '16px 24px',
    borderRadius: 12,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    fontSize: 16,
  },
  statLabel: { color: '#ccc' },
  statValue: { color: '#ffd700', fontWeight: 'bold' },
  btn: {
    padding: '10px 32px',
    fontSize: 16,
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
};
