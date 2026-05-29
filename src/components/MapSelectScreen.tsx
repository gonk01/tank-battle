// ============================================================
//  坦克大战 — 地图/难度选择界面
// ============================================================

import React, { useState } from 'react';
import { getAllThemes } from '../engine/themes';
import type { ThemeConfig } from '../engine/types';
import { Difficulty, DIFFICULTY_NAMES, DIFFICULTY_ICONS, DIFFICULTY_DESCRIPTIONS } from '../engine/types';
import type { Difficulty as DifficultyType } from '../engine/types';
import { DIFFICULTY_CONFIGS } from '../engine/constants';

interface MapSelectScreenProps {
  onSelect: (theme: ThemeConfig, difficulty: DifficultyType) => void;
  defaultDifficulty: DifficultyType;
}

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({ onSelect, defaultDifficulty }) => {
  const themes = getAllThemes();
  const difficulties = Object.values(Difficulty) as DifficultyType[];
  const [difficulty, setDifficulty] = useState<DifficultyType>(defaultDifficulty);

  return (
    <div style={styles.container}>
      <div style={styles.titleSection}>
        <h1 style={styles.title}>⚔ 坦克大战</h1>
        <p style={styles.subtitle}>选择战场与难度</p>
      </div>

      {/* 难度选择 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎚️ 选择难度</h2>
        <div style={styles.cardsRow}>
          {difficulties.map((diff) => {
            const cfg = DIFFICULTY_CONFIGS[diff];
            const selected = difficulty === diff;
            return (
              <div
                key={diff}
                style={{
                  ...styles.card,
                  ...styles.diffCard,
                  borderColor: selected ? '#ffd700' : '#0f3460',
                  boxShadow: selected ? '0 0 16px rgba(255,215,0,0.4)' : '0 4px 16px rgba(0,0,0,0.3)',
                }}
                onClick={() => setDifficulty(diff)}
              >
                <div style={styles.cardIcon}>{DIFFICULTY_ICONS[diff]}</div>
                <h2 style={styles.cardTitle}>{DIFFICULTY_NAMES[diff]}</h2>
                <p style={styles.cardDesc}>{DIFFICULTY_DESCRIPTIONS[diff]}</p>
                <div style={styles.diffStats}>
                  <span style={styles.diffStat}>初始敌人: {cfg.initialEnemyCount}</span>
                  <span style={styles.diffStat}>升级门槛: {cfg.killLevelBase} 杀/级</span>
                  <span style={styles.diffStat}>大型坦克: HP×{cfg.largeTankHpMultiplier}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 主题选择 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🗺️ 选择战场</h2>
        <div style={styles.cardsRow}>
          {themes.map((theme) => (
            <div
              key={theme.id}
              style={styles.card}
              onClick={() => onSelect(theme, difficulty)}
            >
              <div style={styles.cardIcon}>{theme.icon}</div>
              <h2 style={styles.cardTitle}>{theme.name}</h2>
              <p style={styles.cardDesc}>{theme.description}</p>

              <div style={styles.preview}>
                <div style={{ ...styles.previewRow, background: theme.groundColor }}>
                  <span style={styles.previewLabel}>地面</span>
                </div>
                <div style={{ ...styles.previewRow, background: `linear-gradient(135deg, ${theme.brickColor}, ${theme.brickStroke})` }}>
                  <span style={styles.previewLabel}>可破坏</span>
                </div>
                <div style={{ ...styles.previewRow, background: `linear-gradient(135deg, ${theme.steelGradient[0]}, ${theme.steelGradient[1]}, ${theme.steelGradient[2]})` }}>
                  <span style={styles.previewLabel}>不可破坏</span>
                </div>
                <div style={{ ...styles.previewRow, background: theme.playerBody }}>
                  <span style={{ ...styles.previewLabel, color: theme.id === 'hell' ? '#ff8800' : '#fff' }}>玩家</span>
                </div>
                <div style={{ ...styles.previewRow, background: theme.enemyBody }}>
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
    gap: 30,
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: '#ccc',
    fontSize: 18,
    margin: 0,
  },
  cardsRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    background: '#16213e',
    border: '2px solid #0f3460',
    borderRadius: 16,
    padding: '16px 20px',
    width: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  diffCard: {
    width: 220,
  },
  cardIcon: {
    fontSize: 40,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    margin: 0,
  },
  cardDesc: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    margin: 0,
  },
  diffStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    padding: '4px 0',
  },
  diffStat: {
    color: '#aaa',
    fontSize: 11,
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    padding: '6px 0',
  },
  previewRow: {
    height: 16,
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  previewLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
  },
  selectBtn: {
    marginTop: 4,
    padding: '8px 20px',
    fontSize: 13,
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    width: '100%',
  },
};
