// ============================================================
//  坦克大战 — 游戏容器
// ============================================================

import React from 'react';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { UpgradeChoiceModal } from './UpgradeChoiceModal';
import { GameOverOverlay } from './GameOverOverlay';
import { useGameEngine } from '../hooks/useGameEngine';
import type { ThemeConfig } from '../engine/types';

interface GameContainerProps {
  theme: ThemeConfig;
  onBackToMenu: () => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({ theme, onBackToMenu }) => {
  const { canvasRef, state, restart, chooseUpgrade } = useGameEngine(theme);

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBackToMenu}>← 返回选图</button>
        <button style={styles.restartBtn} onClick={restart}>🔄 重新开始</button>
      </div>

      <HUD state={state} />

      <div style={styles.gameArea}>
        <GameCanvas canvasRef={canvasRef} />

        {state.showUpgradeChoice && (
          <UpgradeChoiceModal
            level={state.level}
            hp={state.hp}
            maxHp={state.maxHp}
            attack={state.attack}
            hpChoiceCount={0}
            skills={state.skills}
            onChoose={chooseUpgrade}
          />
        )}

        <GameOverOverlay
          gameOver={state.gameOver}
          score={state.score}
          kills={state.kills}
          timeSurvived={state.timeSurvived}
          level={state.level}
          onRestart={restart}
        />
      </div>

      <div style={styles.controls}>
        <span><kbd>↑↓←→</kbd>/<kbd>WASD</kbd> 移动</span>
        <span><kbd>Space</kbd> 射击</span>
        <span><kbd>Enter</kbd> 暂停</span>
        <span><kbd>R</kbd> 重开</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#16213e',
    padding: '12px 20px',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    border: '2px solid #0f3460',
    maxWidth: '90vw',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #0f3460',
    color: '#888',
    padding: '4px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
  restartBtn: {
    background: 'transparent',
    border: '1px solid #0f3460',
    color: '#888',
    padding: '4px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
  gameArea: {
    position: 'relative',
    display: 'inline-block',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    color: '#666',
    fontSize: 12,
    paddingTop: 8,
    flexWrap: 'wrap',
  },
};
