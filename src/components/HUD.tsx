// ============================================================
//  坦克大战 — 顶部信息栏（含特殊技能徽章）
// ============================================================

import React from 'react';
import type { GameState } from '../engine/types';
import { SkillType, SKILL_ICONS } from '../engine/types';
import { SpecialSkillType, SPECIAL_SKILL_ICONS, SPECIAL_SKILL_NAMES, DIFFICULTY_NAMES } from '../engine/types';
import { getTheme } from '../engine/themes';

interface HUDProps {
  state: GameState;
}

export const HUD: React.FC<HUDProps> = ({ state }) => {
  const {
    hp, maxHp, attack, level,
    expProgress, expNeeded, kills, timeSurvived,
    skills, specialSkills, themeId, difficulty, gameOver,
  } = state;

  const theme = getTheme(themeId);
  const minutes = Math.floor(timeSurvived / 60);
  const seconds = timeSurvived % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const expPct = Math.min(1, Math.max(0, expProgress));

  if (gameOver) return null;

  return (
    <div style={styles.container}>
      {/* 第一行 */}
      <div style={styles.row1}>
        <div style={styles.section}>
          <span style={styles.label}>🏆</span>
          <span style={styles.score}>{kills}</span>
        </div>
        <div style={styles.section}>
          <span style={styles.label}>💀</span>
          <span style={styles.kills}>{kills}</span>
        </div>

        <div style={styles.section}>
          <span style={styles.label}>❤️</span>
          <div style={styles.hpBarOuter}>
            <div style={{
              ...styles.hpBarInner,
              width: `${hpPct}%`,
              background: hpPct > 60 ? '#4caf50' : hpPct > 30 ? '#ff9800' : '#f44336',
            }} />
          </div>
          <span style={styles.hpText}>{Math.ceil(hp)}/{maxHp}</span>
        </div>

        <div style={styles.section}>
          <span style={styles.label}>⚔️</span>
          <span style={styles.atk}>{attack}</span>
        </div>

        <div style={styles.section}>
          <span style={styles.label}>⭐</span>
          <span style={styles.level}>{level}</span>
          <div style={styles.expBarOuter}>
            <div style={{
              ...styles.expBarInner,
              width: `${expPct * 100}%`,
            }} />
          </div>
          <span style={styles.expText}>{expNeeded > 0 ? `-${expNeeded}杀` : 'MAX'}</span>
        </div>

        <div style={styles.section}>
          <span style={styles.mapName}>
            🎚️ {DIFFICULTY_NAMES[difficulty]}
          </span>
        </div>

        <div style={styles.mapName}>
          {theme.icon} {theme.name}
        </div>

        <div style={styles.section}>
          <span style={styles.label}>⏱</span>
          <span style={styles.timer}>{timeStr}</span>
        </div>
      </div>

      {/* 第二行：被动技能 */}
      <div style={styles.row2}>
        {(Object.values(SkillType) as SkillType[]).map((st) => {
          const s = skills[st];
          const lv = s?.level || 0;
          return (
            <div
              key={st}
              style={{
                ...styles.skillBadge,
                opacity: lv > 0 ? 1 : 0.4,
              }}
            >
              <span>{SKILL_ICONS[st]}</span>
              <span style={styles.skillLevelText}>{lv}</span>
            </div>
          );
        })}
      </div>

      {/* 第三行：特殊技能 */}
      <div style={styles.row2}>
        {(Object.values(SpecialSkillType) as SpecialSkillType[]).map((st) => {
          const s = specialSkills[st];
          const lv = s?.level || 0;
          return (
            <div
              key={st}
              title={SPECIAL_SKILL_NAMES[st]}
              style={{
                ...styles.specialBadge,
                opacity: lv > 0 ? 1 : 0.35,
                background: lv > 0 ? 'rgba(123,45,142,0.3)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <span>{SPECIAL_SKILL_ICONS[st]}</span>
              <span style={styles.skillLevelText}>{lv}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '6px 8px 8px 8px',
    color: '#e0e0e0',
    fontSize: 13,
  },
  row1: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  row2: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  label: { color: '#888', fontSize: 13 },
  score: { color: '#ffd700', fontWeight: 'bold', fontSize: 17 },
  kills: { color: '#ff8a65', fontWeight: 'bold', fontSize: 15 },
  atk: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  level: { color: '#4fc3f7', fontWeight: 'bold', fontSize: 15 },
  timer: { color: '#aaa', fontWeight: 'bold', fontSize: 14 },
  hpBarOuter: {
    width: 70,
    height: 10,
    background: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    border: '1px solid #555',
  },
  hpBarInner: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.15s',
  },
  hpText: { color: '#fff', fontSize: 11, fontWeight: 'bold', minWidth: 28 },
  expBarOuter: {
    width: 50,
    height: 8,
    background: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid #444',
  },
  expBarInner: {
    height: '100%',
    background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
    borderRadius: 3,
    transition: 'width 0.2s',
  },
  expText: { color: '#ffd700', fontSize: 10, fontWeight: 'bold', minWidth: 20 },
  mapName: { color: '#888', fontSize: 12 },
  skillBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'rgba(255,255,255,0.05)',
    padding: '1px 6px',
    borderRadius: 8,
    fontSize: 12,
    transition: 'opacity 0.2s',
  },
  specialBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '1px 6px',
    borderRadius: 8,
    border: '1px solid rgba(123,45,142,0.3)',
    fontSize: 12,
    transition: 'opacity 0.2s',
  },
  skillLevelText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
  },
};
