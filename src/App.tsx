// ============================================================
//  坦克大战 — App 入口
// ============================================================

import { useState } from 'react';
import type { ThemeConfig } from './engine/types';
import { Difficulty } from './engine/types';
import type { Difficulty as DifficultyType } from './engine/types';
import { MapSelectScreen } from './components/MapSelectScreen';
import { GameContainer } from './components/GameContainer';
import './App.css';

type Screen = 'menu' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyType>(Difficulty.NORMAL);

  const handleSelect = (theme: ThemeConfig, difficulty: DifficultyType) => {
    setSelectedTheme(theme);
    setSelectedDifficulty(difficulty);
    setScreen('game');
  };

  const handleBackToMenu = () => {
    setScreen('menu');
    setSelectedTheme(null);
  };

  if (screen === 'menu' || !selectedTheme) {
    return (
      <MapSelectScreen
        onSelect={handleSelect}
        defaultDifficulty={selectedDifficulty}
      />
    );
  }

  return (
    <div className="app">
      <GameContainer
        theme={selectedTheme}
        difficulty={selectedDifficulty}
        onBackToMenu={handleBackToMenu}
      />
    </div>
  );
}

export default App;
