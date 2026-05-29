// ============================================================
//  坦克大战 — 升级选择弹窗（HP / ATK / 特殊技能）
// ============================================================

import React from 'react';
import type { PlayerSkills } from '../engine/types';

interface UpgradeChoiceModalProps {
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  hpChoiceCount: number;
  skills: PlayerSkills;
  onChoose: (type: 'hp' | 'attack') => void;
  onSpecialSkillClick: () => void;
}

export const UpgradeChoiceModal: React.FC<UpgradeChoiceModalProps> = ({
  level, hp, maxHp, attack, hpChoiceCount, skills, onChoose, onSpecialSkillClick,
}) => {
  const hpBonus = 2 + Math.floor(hpChoiceCount * 0.5);
  const specialCount = Object.values(skills.special).filter((s: { level: number }) => s.level > 0).length;

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

          {/* 特殊技能 */}
          <div style={{ ...styles.card, ...styles.specialCard }} onClick={onSpecialSkillClick}>
            <div style={styles.cardIcon}>✨</div>
            <h3 style={styles.cardTitle}>特殊技能</h3>
            <p style={styles.desc}>随机三选一特殊技能</p>
            <div style={styles.specialBadge}>
              {specialCount > 0 ? `已解锁 ${specialCount} 项` : '点击解锁'}
            </div>
          </div>
        </div>

        <p style={styles.footer}>点击卡片选择强化方向</p>
      </div>
    </div>
  );
};

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
    maxWidth: 650,
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
    minWidth: 160,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  specialCard: {
    border: '1px solid #7b2d8e',
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
  desc: {
    color: '#c97dff',
    fontSize: 12,
    margin: 0,
    textAlign: 'center',
  },
  specialBadge: {
    background: 'rgba(123,45,142,0.3)',
    color: '#c97dff',
    padding: '2px 10px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 'bold',
  },
  hint: { color: '#666', fontSize: 11, margin: 0 },
  footer: {
    color: '#555',
    fontSize: 12,
    margin: 0,
    marginTop: 4,
  },
};
