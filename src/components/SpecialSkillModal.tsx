// ============================================================
//  坦克大战 — 特殊技能选择弹窗（第二阶段）
// ============================================================

import React from 'react';
import type { SpecialSkillType, PlayerSpecialSkills } from '../engine/types';
import { SPECIAL_SKILL_ICONS, SPECIAL_SKILL_NAMES } from '../engine/types';

interface SpecialSkillModalProps {
  choices: SpecialSkillType[];
  level: number;
  skills: PlayerSpecialSkills;
  onChoose: (type: SpecialSkillType) => void;
}

export const SpecialSkillModal: React.FC<SpecialSkillModalProps> = ({
  choices, level, skills, onChoose,
}) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>✨ 选择特殊技能</h2>
        <p style={styles.levelText}>Lv.{level}</p>

        <div style={styles.cardsRow}>
          {choices.map((type) => {
            const skill = skills[type];
            const currentLevel = skill.level;
            const newLevel = currentLevel + 1;
            const icon = SPECIAL_SKILL_ICONS[type];
            const name = SPECIAL_SKILL_NAMES[type];

            return (
              <div
                key={type}
                style={styles.card}
                onClick={() => onChoose(type)}
              >
                <div style={styles.cardIcon}>{icon}</div>
                <h3 style={styles.cardTitle}>{name}</h3>
                <div style={styles.levelRow}>
                  <span style={styles.levelOld}>Lv.{currentLevel}</span>
                  <span style={styles.levelArrow}>→</span>
                  <span style={styles.levelNew}>Lv.{newLevel}</span>
                </div>
                <p style={styles.effect}>{getEffectDesc(type, currentLevel, newLevel)}</p>
              </div>
            );
          })}
        </div>

        <p style={styles.footer}>点击卡片选择特殊技能</p>
      </div>
    </div>
  );
};

function getEffectDesc(type: SpecialSkillType, _current: number, _next: number): string {
  switch (type) {
    case 'clone':
      return '自动生成分身，继承战力自爆攻击敌人';
    case 'teleport':
      return '受击时自动瞬移避险，冷却随等级缩短';
    case 'invisibility':
      return '定时隐身，期间敌人不会攻击你';
    case 'mine':
      return '沿路放置地雷，伤害绑定自身攻击力';
    case 'homing':
      return '自动发射追踪弹，自主锁定最近敌人';
    case 'iceSlow':
      return '定时减速全场敌人，升级可选强化方向';
    default:
      return '';
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
    zIndex: 25,
    borderRadius: 4,
  },
  modal: {
    background: '#16213e',
    border: '2px solid #7b2d8e',
    borderRadius: 16,
    padding: '20px 28px',
    maxWidth: 700,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 8px 40px rgba(123,45,142,0.4)',
  },
  title: {
    color: '#c97dff',
    fontSize: 22,
    margin: 0,
    textAlign: 'center',
  },
  levelText: {
    color: '#4fc3f7',
    fontSize: 14,
    margin: 0,
  },
  cardsRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #5a3d8e',
    borderRadius: 12,
    padding: 14,
    minWidth: 160,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  cardIcon: { fontSize: 36 },
  cardTitle: { color: '#fff', fontSize: 15, margin: 0 },
  levelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
  },
  levelOld: { color: '#888' },
  levelArrow: { color: '#c97dff' },
  levelNew: { color: '#4caf50', fontWeight: 'bold', fontSize: 16 },
  effect: {
    color: '#aaa',
    fontSize: 11,
    textAlign: 'center',
    margin: 0,
  },
  footer: {
    color: '#555',
    fontSize: 11,
    margin: 0,
  },
};
