import { useState } from 'react';
import type { ThemeConfig } from './engine/types';
import { MapSelectScreen } from './components/MapSelectScreen';
import { GameContainer } from './components/GameContainer';
import './App.css';

type Screen = 'menu' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);

  const handleSelectTheme = (theme: ThemeConfig) => {
    setSelectedTheme(theme);
    setScreen('game');
  };

  const handleBackToMenu = () => {
    setScreen('menu');
    setSelectedTheme(null);
  };

  if (screen === 'menu' || !selectedTheme) {
    return <MapSelectScreen onSelect={handleSelectTheme} />;
  }

  return (
    <div className="app">
      <GameContainer theme={selectedTheme} onBackToMenu={handleBackToMenu} />
    </div>
  );
}

export default App;
