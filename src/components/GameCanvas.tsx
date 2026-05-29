// ============================================================
//  坦克大战 — Canvas 组件
// ============================================================

import React from 'react';

interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ canvasRef }) => {
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        border: '2px solid #0f3460',
        borderRadius: 4,
        background: '#1a1a2e',
      }}
    />
  );
};
