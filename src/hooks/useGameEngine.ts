// ============================================================
//  坦克大战 — React Hook：连接引擎与 React 状态
// ============================================================

import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { GameState, ThemeConfig, Difficulty as DifficultyType } from '../engine/types';
import { Difficulty } from '../engine/types';
import type { SpecialSkillType } from '../engine/types';
import { createDefaultSkills } from '../engine/constants';

const INITIAL_STATE: GameState = {
  score: 0,
  hp: 5,
  maxHp: 5,
  attack: 2,
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
  difficulty: Difficulty.NORMAL,
  skills: createDefaultSkills(),
  specialSkills: createDefaultSkills().special,
  showSpecialSkillChoice: false,
  specialSkillChoices: [],
  pendingIceSlowChoice: false,
  hasLargeTankWarning: false,
  soundMuted: false,
};

export function useGameEngine(theme: ThemeConfig, difficulty: DifficultyType) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [state, setState] = useState<GameState>({
    ...INITIAL_STATE,
    themeId: theme.id,
    difficulty,
  });

  const [pendingUpgrade, setPendingUpgrade] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current) return;

    const engine = new GameEngine(canvas, theme, difficulty);
    engineRef.current = engine;

    engine.onStateChange = (newState: GameState) => {
      setState(newState);
      if (newState.showUpgradeChoice || newState.showSpecialSkillChoice) {
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
  }, [theme, difficulty]);

  const restart = useCallback(() => {
    engineRef.current?.restart();
    setPendingUpgrade(false);
  }, []);

  const chooseUpgrade = useCallback(
    (type: 'hp' | 'attack') => {
      engineRef.current?.applyUpgrade(type);
      setPendingUpgrade(false);
    },
    []
  );

  const selectSpecialSkillChoice = useCallback(() => {
    engineRef.current?.selectSpecialSkillChoice();
  }, []);

  const applySpecialSkill = useCallback(
    (type: SpecialSkillType) => {
      engineRef.current?.applySpecialSkill(type);
      setPendingUpgrade(false);
    },
    []
  );

  const applyIceSlowChoice = useCallback(
    (choice: 'cooldown' | 'slow') => {
      engineRef.current?.applyIceSlowChoice(choice);
      setPendingUpgrade(false);
    },
    []
  );

  const toggleSound = useCallback(() => {
    engineRef.current?.toggleSound();
  }, []);

  return {
    canvasRef,
    state,
    restart,
    pendingUpgrade,
    chooseUpgrade,
    selectSpecialSkillChoice,
    applySpecialSkill,
    applyIceSlowChoice,
    toggleSound,
  };
}
