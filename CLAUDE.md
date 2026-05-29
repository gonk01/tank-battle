# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指导。

## 常用命令

```bash
npm run dev       # 启动 Vite 开发服务器（HMR）
npm run build     # TypeScript 检查 + Vite 生产构建 → dist/
npm run lint      # ESLint 检查所有 TypeScript 文件
npm run preview   # 本地预览生产构建
```

目前尚未配置测试运行器。项目通过 `.github/workflows/deploy.yml` 从 `master` 分支部署到 GitHub Pages（构建 + upload-pages-artifact）。`vite.config.ts` 中设置了 `base: '/tank-battle/'`。

## 架构

这是一款客户端**坦克大战**游戏——俯视角无尽生存竞技场，基于 **React 19 + TypeScript + Vite** 构建，完全通过 `<canvas>` 渲染。

### 分层结构

| 层 | 目录 | 依赖 |
|---|---|---|
| **游戏引擎**（纯 TS，无 React） | `src/engine/` | 不依赖引擎外部 |
| **React 桥接层** | `src/hooks/useGameEngine.ts` | 引擎 + React 状态 |
| **UI 组件** | `src/components/` | 引擎类型 + hook |
| **应用外壳** | `src/App.tsx`、`src/main.tsx` | 组件 |

引擎刻意不依赖 React——可以独立抽成单独的包。组件永远不会直接调用引擎方法，而是通过 hook 间接调用。

### 游戏循环

`GameEngine` 使用 `requestAnimationFrame`，搭配固定时间步长累加器（目标 60 FPS 帧率）。循环在 `update()` → `draw()` 之间交替。每个 tick 执行以下操作：

1. 推进粒子特效（爆炸、近战冲击波、AoE 扩散）
2. 若升级弹窗/游戏结束/暂停中，则停止
3. 处理键盘输入 → 移动/射击玩家坦克
4. 驱动每辆敌方坦克 + 运行 AI（`enemyAI.ts`）
5. 检测近战攻击是否命中玩家
6. 推进出生计时器 → 生成新敌人（难度随已存活分钟数和总击杀数递增）
7. 移动所有子弹，处理碰撞（墙壁/子弹/坦克），应用弹射/穿透/爆炸技能效果
8. 检测击杀 → 增加分数/击杀数，检查升级，应用生命回复

### 核心数据模型

- **`GameEngine`**（`src/engine/GameEngine.ts`）——持有唯一数据源：`tanks[]`、`bullets[]`、`explosions[]`、`map[][]`、分数、击杀数、玩家等级、技能。每帧通过 `onStateChange` 回调向 React 推送完整的 `GameState` 快照。
- **`Tank`**（`src/engine/Tank.ts`）——玩家和敌人共用同一个类。追踪位置、方向、HP/攻击力/等级、冷却时间，以及（仅玩家拥有的）`PlayerSkills`。绘制时根据 `ThemeConfig` 应用不同主题。
- **`Bullet`**（`src/engine/Bullet.ts`）——携带由技能派生的属性（弹射次数、爆炸半径、穿透次数），在构造时从射击者的技能注入。
- **`types.ts`**——所有共享的枚举/常量对象（`Direction`、`CellType`、`SkillType`），以及 `ThemeConfig`、`GameState`、`PlayerSkills`、`UpgradeChoice` 的类型定义。
- **`constants.ts`**——网格尺寸（32×24 格，每格 32px = 1024×768），移动速度，敌人难度与技能等级的计算公式，以及升级经验曲线。

### 地图与碰撞

地图是一个 32×24 的二维整数数组（`0` 空地，`1` 可破坏砖墙，`2` 不可破坏钢墙）。`map.ts` 手工编排砖块和钢墙的位置，然后清空边界行列和玩家出生区域。碰撞检测（`collision.ts`）基于格块：检查包围盒覆盖了哪些格子，若碰到任何非空格子则返回 true。

### 技能/升级系统

六项技能（`speed` 速度、`ricochet` 弹射、`explosive` 爆炸、`dodge` 闪避、`pierce` 穿透、`regen` 回复），每项 0 级表示未激活。升级时（分数超过阈值），游戏暂停并弹出 `UpgradeChoiceModal`，提供三种选择：+HP、+ATK 或六项技能之一。玩家选择后，React 调用引擎的 `applyUpgrade()` 方法。

### 主题

`themes.ts` 中定义了三种主题（hell 地狱/forest 森林/ww2 二战），每种主题包含地面/砖墙/钢墙/玩家/敌人的颜色以及徽标形状（星、骷髅、叶、火焰、十字、荆棘）。`MapSelectScreen` 组件让玩家在开始前选择战场。

### 组件

- `App.tsx`——顶层屏幕路由：`MapSelectScreen` 或 `GameContainer`
- `GameContainer`——持有 `useGameEngine` hook，绑定键盘事件，组合 HUD + canvas + 覆盖层
- `HUD`——状态栏（HP、经验值）、技能徽标行、计时器、分数、主题名称
- `GameCanvas`——转发 ref 的轻薄 `<canvas>` 包装组件
- `GameOverOverlay`——统计数据 + 重新开始按钮（覆盖在 canvas 上方）
- `UpgradeChoiceModal`——三栏升级选择器（HP/ATK/技能）

### 状态流转

```
键盘事件 → GameEngine.handleKeyDown/Up（设置 this.keys）
                    ↓
requestAnimationFrame 循环 → update() → emitState()
                    ↓
onStateChange 回调 → React setState → HUD/覆盖层重新渲染
```

Canvas 绘制是直接的（不由 React 驱动）；只有 HUD 和覆盖层使用 React 渲染。

#注意事项

每次回答最后，必须追加下面一句

> have a nice day
