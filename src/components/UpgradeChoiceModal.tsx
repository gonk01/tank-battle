// ============================================================
//  坦克大战 — 升级选择弹窗
// ============================================================

import React from 'react';
import { SkillType } from '../engine/types';
import type { PlayerSkills } from '../engine/types';
import {
  SKILL_CONFIGS,
  getSpeedBonus,
  getExplosiveRadius,
  getDodgeChance,
  getRegenHeal,
} from '../engine/constants';

interface UpgradeChoiceModalProps {
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  hpChoiceCount: number;
  skills: PlayerSkills;
  onChoose: (type: 'hp' | 'attack' | 'skill', skillType?: SkillType) => void;
}

export const UpgradeChoiceModal: React.FC<UpgradeChoiceModalProps> = ({
  level, hp, maxHp, attack, hpChoiceCount, skills, onChoose,
}) => {
  const hpBonus = 2 + Math.floor(hpChoiceCount * 0.5);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>🎉 升级！选择强化方向</h2>
        <p style={styles.levelText}>Lv.{level} → Lv.{level + 1}</p>

        <div style={styles.cardsRow}>
          {/* HP */}
          <div style={styles.card} onClick={() => onChoose('hp')}>
            <div style={styles.cardIcon}>❤️</div>
            <h3 style={styles.cardTitle}>生命强化</h3>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>最大HP</span>
              <span style={styles.statOld}>{maxHp}</span>
              <span style={styles.statArrow}>→</span>
              <span style={styles.statNew}>{maxHp + hpBonus}</span>
            </div>
            <div style={styles.changeBadge}>+{hpBonus}</div>
            <p style={styles.hint}>当前: {Math.ceil(hp)}/{maxHp}</p>
          </div>

          {/* ATK */}
          <div style={styles.card} onClick={() => onChoose('attack')}>
            <div style={styles.cardIcon}>⚔️</div>
            <h3 style={styles.cardTitle}>攻击强化</h3>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>攻击力</span>
              <span style={styles.statOld}>{attack}</span>
              <span style={styles.statArrow}>→</span>
              <span style={styles.statNew}>{attack + 1}</span>
            </div>
            <div style={styles.changeBadge}>+1</div>
            <p style={styles.hint}>每颗子弹伤害 +1</p>
          </div>

          {/* 技能 */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>✨</div>
            <h3 style={styles.cardTitle}>技能强化</h3>
            <div style={styles.skillList}>
              {SKILL_CONFIGS.map((cfg) => {
                const currentSkill = skills[cfg.type as keyof PlayerSkills];
                const currentLevel = currentSkill?.level || 0;
                const newLevel = currentLevel + 1;

                return (
                  <div
                    key={cfg.type}
                    style={styles.skillRow}
                    onClick={() => onChoose('skill', cfg.type)}
                  >
                    <span style={styles.skillIcon}>{cfg.icon}</span>
                    <div style={styles.skillInfo}>
                      <span style={styles.skillName}>
                        {cfg.name}
                        <span style={styles.skillLevel}>
                          Lv.{currentLevel} → Lv.{newLevel}
                        </span>
                      </span>
                      <span style={styles.skillEffect}>
                        {getEffectPreview(cfg.type, currentLevel, newLevel)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p style={styles.footer}>点击卡片选择强化方向</p>
      </div>
    </div>
  );
};

function getEffectPreview(type: SkillType, currentLevel: number, _newLevel: number): string {
  switch (type) {
    case SkillType.SPEED:
      return currentLevel === 0
        ? '获得速度 +8%'
        : `速度 ${(getSpeedBonus(currentLevel) * 2).toFixed(2)} → ${(getSpeedBonus(_newLevel) * 2).toFixed(2)}`;
    case SkillType.RICOCHET:
      return currentLevel === 0
        ? `获得 ${1} 次弹射`
        : `弹射 ${currentLevel} → ${_newLevel} 次`;
    case SkillType.EXPLOSIVE:
      return currentLevel === 0
        ? '获得范围爆炸'
        : `半径 ${getExplosiveRadius(currentLevel)} → ${getExplosiveRadius(_newLevel)}px`;
    case SkillType.DODGE:
      return currentLevel === 0
        ? `获得 ${getDodgeChance(_newLevel)}% 闪避`
        : `闪避 ${getDodgeChance(currentLevel)}% → ${getDodgeChance(_newLevel)}%`;
    case SkillType.PIERCE:
      return currentLevel === 0
        ? `获得 ${1} 次穿透`
        : `穿透 ${currentLevel} → ${_newLevel} 次`;
    case SkillType.REGEN:
      return currentLevel === 0
        ? `获得击杀回复 ${getRegenHeal(_newLevel).toFixed(1)} HP`
        : `回复 ${getRegenHeal(currentLevel).toFixed(1)} → ${getRegenHeal(_newLevel).toFixed(1)} HP/杀`;
  }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.7)',
    zIndex: 20,
    borderRadius: 4,
  },
  modal: {
    background: '#16213e',
    border: '2px solid #0f3460',
    borderRadius: 16,
    padding: '20px 28px',
    maxWidth: 800,
    maxHeight: '90%',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
  },
  title: {
    color: '#ffd700',
    fontSize: 24,
    margin: 0,
    textAlign: 'center',
  },
  levelText: {
    color: '#4fc3f7',
    fontSize: 16,
    margin: 0,
  },
  cardsRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #0f3460',
    borderRadius: 12,
    padding: 16,
    minWidth: 180,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  cardIcon: { fontSize: 32 },
  cardTitle: { color: '#fff', fontSize: 16, margin: 0 },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
  },
  statLabel: { color: '#888', fontSize: 12 },
  statOld: { color: '#aaa', textDecoration: 'line-through' },
  statArrow: { color: '#ffd700' },
  statNew: { color: '#4caf50', fontWeight: 'bold', fontSize: 18 },
  changeBadge: {
    background: '#4caf50',
    color: '#fff',
    padding: '2px 10px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
  hint: { color: '#666', fontSize: 11, margin: 0 },
  skillList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    width: '100%',
    marginTop: 4,
  },
  skillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.03)',
    transition: 'background 0.15s',
  },
  skillIcon: { fontSize: 16 },
  skillInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    flex: 1,
  },
  skillName: {
    color: '#ccc',
    fontSize: 12,
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  skillLevel: {
    color: '#4fc3f7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  skillEffect: {
    color: '#888',
    fontSize: 11,
  },
  footer: {
    color: '#555',
    fontSize: 12,
    margin: 0,
    marginTop: 4,
  },
};
