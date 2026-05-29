// ============================================================
//  坦克大战 — 冰封减速子选择弹窗
// ============================================================

import React from 'react';

interface IceSlowChoiceModalProps {
  onChoose: (choice: 'cooldown' | 'slow') => void;
}

export const IceSlowChoiceModal: React.FC<IceSlowChoiceModalProps> = ({ onChoose }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>❄️ 冰封减速强化方向</h2>

        <div style={styles.cardsRow}>
          <div style={styles.card} onClick={() => onChoose('cooldown')}>
            <div style={styles.cardIcon}>⏱️</div>
            <h3 style={styles.cardTitle}>缩减冷却</h3>
            <p style={styles.desc}>触发间隔进一步缩短，更高频率减速</p>
          </div>

          <div style={styles.card} onClick={() => onChoose('slow')}>
            <div style={styles.cardIcon}>🧊</div>
            <h3 style={styles.cardTitle}>增强减速</h3>
            <p style={styles.desc}>减速幅度持续增加，敌人行动更缓慢</p>
          </div>
        </div>

        <p style={styles.footer}>选择冰封减速的强化方向</p>
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
    background: 'rgba(0,0,0,0.75)',
    zIndex: 30,
    borderRadius: 4,
  },
  modal: {
    background: '#16213e',
    border: '2px solid #4fc3f7',
    borderRadius: 16,
    padding: '20px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 8px 40px rgba(79,195,247,0.3)',
  },
  title: {
    color: '#4fc3f7',
    fontSize: 20,
    margin: 0,
  },
  cardsRow: {
    display: 'flex',
    gap: 16,
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #0f5670',
    borderRadius: 12,
    padding: 16,
    width: 180,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  cardIcon: { fontSize: 32 },
  cardTitle: { color: '#fff', fontSize: 15, margin: 0 },
  desc: {
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
