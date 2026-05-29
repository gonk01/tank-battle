// ============================================================
//  坦克大战 — 地图选择界面
// ============================================================

import React from 'react';
import { getAllThemes } from '../engine/themes';
import type { ThemeConfig } from '../engine/types';

interface MapSelectScreenProps {
  onSelect: (theme: ThemeConfig) => void;
}

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({ onSelect }) => {
  const themes = getAllThemes();

  return (
    <div style={styles.container}>
      <div style={styles.titleSection}>
        <h1 style={styles.title}>⚔ 坦克大战</h1>
        <p style={styles.subtitle}>选择你的战场</p>
      </div>

      <div style={styles.cardsRow}>
        {themes.map((theme) => (
          <div
            key={theme.id}
            style={styles.card}
            onClick={() => onSelect(theme)}
          >
            <div style={styles.cardIcon}>{theme.icon}</div>
            <h2 style={styles.cardTitle}>{theme.name}</h2>
            <p style={styles.cardDesc}>{theme.description}</p>

            {/* 主题预览 */}
            <div style={styles.preview}>
              {/* 地面色块 */}
              <div style={{
                ...styles.previewRow,
                background: theme.groundColor,
              }}>
                <span style={styles.previewLabel}>地面</span>
              </div>
              {/* 可破坏墙 */}
              <div style={{
                ...styles.previewRow,
                background: `linear-gradient(135deg, ${theme.brickColor}, ${theme.brickStroke})`,
              }}>
                <span style={styles.previewLabel}>可破坏</span>
              </div>
              {/* 不可破坏墙 */}
              <div style={{
                ...styles.previewRow,
                background: `linear-gradient(135deg, ${theme.steelGradient[0]}, ${theme.steelGradient[1]}, ${theme.steelGradient[2]})`,
              }}>
                <span style={styles.previewLabel}>不可破坏</span>
              </div>
              {/* 玩家坦克 */}
              <div style={{
                ...styles.previewRow,
                background: theme.playerBody,
              }}>
                <span style={{
                  ...styles.previewLabel,
                  color: theme.id === 'hell' ? '#ff8800' : '#fff',
                }}>玩家</span>
              </div>
              {/* 敌方坦克 */}
              <div style={{
                ...styles.previewRow,
                background: theme.enemyBody,
              }}>
                <span style={styles.previewLabel}>敌人</span>
              </div>
            </div>

            <button style={styles.selectBtn}>
              选择 {theme.icon}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    justifyContent: 'center',
    padding: 20,
    gap: 40,
  },
  titleSection: {
    textAlign: 'center',
  },
  title: {
    color: '#ffd700',
    fontSize: 42,
    margin: 0,
    textShadow: '0 0 20px rgba(255,215,0,0.3)',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 8,
  },
  cardsRow: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    background: '#16213e',
    border: '2px solid #0f3460',
    borderRadius: 16,
    padding: '20px 24px',
    width: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  cardIcon: {
    fontSize: 48,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    margin: 0,
  },
  cardDesc: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    margin: 0,
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    width: '100%',
    padding: '8px 0',
  },
  previewRow: {
    height: 20,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  previewLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
  },
  selectBtn: {
    marginTop: 6,
    padding: '10px 24px',
    fontSize: 14,
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    width: '100%',
  },
};
