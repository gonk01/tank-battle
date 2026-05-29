// ============================================================
//  坦克大战 — 游戏容器
// ============================================================

import React from 'react';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { UpgradeChoiceModal } from './UpgradeChoiceModal';
import { SpecialSkillModal } from './SpecialSkillModal';
import { IceSlowChoiceModal } from './IceSlowChoiceModal';
import { GameOverOverlay } from './GameOverOverlay';
import { useGameEngine } from '../hooks/useGameEngine';
import type { ThemeConfig, Difficulty as DifficultyType } from '../engine/types';

interface GameContainerProps {
  theme: ThemeConfig;
  difficulty: DifficultyType;
  onBackToMenu: () => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({ theme, difficulty, onBackToMenu }) => {
  const {
    canvasRef, state, restart, chooseUpgrade,
    selectSpecialSkillChoice, applySpecialSkill, applyIceSlowChoice, toggleSound,
  } = useGameEngine(theme, difficulty);

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBackToMenu}>← 返回选择</button>
        <div style={styles.topRight}>
          <button style={styles.soundBtn} onClick={toggleSound} title={state.soundMuted ? '开启音效' : '静音'}>
            {state.soundMuted ? '🔇' : '🔊'}
          </button>
          <button style={styles.restartBtn} onClick={restart}>🔄 重新开始</button>
        </div>
      </div>

      <HUD state={state} />

      <div style={styles.gameArea}>
        <GameCanvas canvasRef={canvasRef} />

        {/* 一级升级弹窗 */}
        {state.showUpgradeChoice && !state.showSpecialSkillChoice && (
          <UpgradeChoiceModal
            level={state.level}
            hp={state.hp}
            maxHp={state.maxHp}
            attack={state.attack}
            hpChoiceCount={0}
            skills={state.skills}
            onChoose={chooseUpgrade}
            onSpecialSkillClick={selectSpecialSkillChoice}
          />
        )}

        {/* 二级特殊技能弹窗 */}
        {state.showSpecialSkillChoice && (
          <SpecialSkillModal
            choices={state.specialSkillChoices}
            level={state.level}
            skills={state.specialSkills}
            onChoose={applySpecialSkill}
          />
        )}

        {/* 冰封子选择弹窗 */}
        {state.pendingIceSlowChoice && (
          <IceSlowChoiceModal onChoose={applyIceSlowChoice} />
        )}

        {/* 游戏结束弹窗 */}
        <GameOverOverlay
          gameOver={state.gameOver}
          score={state.score}
          kills={state.kills}
          timeSurvived={state.timeSurvived}
          level={state.level}
          difficulty={state.difficulty}
          specialSkills={state.specialSkills}
          onRestart={restart}
          onBackToMenu={onBackToMenu}
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
  topRight: {
    display: 'flex',
    gap: 8,
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
  soundBtn: {
    background: 'transparent',
    border: '1px solid #0f3460',
    color: '#888',
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 16,
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
