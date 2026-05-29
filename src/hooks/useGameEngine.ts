// ============================================================
//  坦克大战 — React Hook：连接引擎与 React 状态
// ============================================================

import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { GameState, ThemeConfig } from '../engine/types';
import { SkillType } from '../engine/types';
import { createDefaultSkills } from '../engine/constants';

const INITIAL_STATE: GameState = {
  score: 0,
  hp: 3,
  maxHp: 3,
  attack: 1,
  level: 0,
  expProgress: 0,
  expNeeded: 5,
  kills: 0,
  timeSurvived: 0,
  gameOver: false,
  paused: false,
  upgrading: false,
  showUpgradeChoice: false,
  themeId: 'forest',
  skills: createDefaultSkills(),
};

export function useGameEngine(theme: ThemeConfig) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [state, setState] = useState<GameState>({
    ...INITIAL_STATE,
    themeId: theme.id,
  });

  // 升级回调
  const [pendingUpgrade, setPendingUpgrade] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current) return;

    const engine = new GameEngine(canvas, theme);
    engineRef.current = engine;

    engine.onStateChange = (newState: GameState) => {
      setState(newState);
      if (newState.showUpgradeChoice) {
        setPendingUpgrade(true);
      }
    };

    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      engine.handleKeyDown(e.key);
      if (e.key === ' ') e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engineRef.current = null;
    };
  }, [theme]);

  const restart = useCallback(() => {
    engineRef.current?.restart();
    setPendingUpgrade(false);
  }, []);

  const chooseUpgrade = useCallback(
    (type: 'hp' | 'attack' | 'skill', skillType?: SkillType) => {
      engineRef.current?.applyUpgrade(type, skillType);
      setPendingUpgrade(false);
    },
    []
  );

  return {
    canvasRef,
    state,
    restart,
    pendingUpgrade,
    chooseUpgrade,
  };
}
