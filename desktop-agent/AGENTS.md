# desktop-agent — Agent 指南

本文档供 AI 在修改 **悬浮窗（overlay）布局与定位** 时必读。人类维护者可与 `README.md`「悬浮窗布局」、`resolve.md` 对照阅读。

---

## 架构选择（不要改方向）

采用 **`resolve.md` 方案一变体**：

| 维度 | 规则 |
|------|------|
| **窗宽** | `overlayExpandedCanvasWidth()` = 双面板 + 双 `panelGap` + 球簇 + shell 水平 padding（**不含**左右 menu side 加宽） |
| **窗高** | 创建时 = 工作区高度 × `conversationMaxHeightRatio`（**0.5，半屏**），之后 **禁止** `resizeOverlay` 改高 |
| **顶留白** | `overlayExpandedTopReserve()` = `ceil(环形菜单外框高 / 2)`，球/输入在留白下方 |
| **交互** | 透明区 `pointer-events: none`，仅 `.overlay-hit-target` 可点 |

历史备选（~296px 基线窗高、对话时底边锚定 resize、收起球 `left:0`）已弃用 — **禁止回退**。

---

## 定位铁律（违反即 bug）

### 1. 悬浮球在窗内的水平位置固定

- 球簇 `left` **始终** `overlayChromeRowOrbClusterLeft()`（= `panelContentWidth + panelGap`）。
- **禁止** 收起时 `left:0` 或随 `viewMode` 换一套 left。

### 2. 左右展开只动面板，不动球、不动窗宽

- `panelSide` 只改 `overlayChromeRowPanelRect(panelSide)` 的 `left/width`。
- **禁止** 因 `panelSide` 平移窗口或改球簇 `left`。

### 3. 间距按 48px 球缘

- 用 `overlayChromeRowOrbLeft()` / `Right()`，不用 172px 簇外框。

### 4. 输入/对话双挂载

- 两面板同时挂载，`invisible` + `pointer-events-none` 切换，**禁止** 条件卸载。

### 5. 窗高：半屏固定，禁止运行期 resize

| 场景 | 行为 |
|------|------|
| 创建 overlay | `height = overlayCanvasHeight(workAreaHeight)` |
| 输入 ↔ 对话 ↔ 流式 | **不** 调用 `resizeOverlay` |
| 对话过长 | `maxHeight = overlayConversationMaxHeightInCanvas(canvasH)`，内部滚动 `clamped` |

**禁止** `conversationWindowSize` + 底边锚定增高；**禁止** 对话→输入缩窗。

### 6. 布局：顶对齐，非 `justify-end`

- `overlay-expanded-root`：`paddingTop: overlayExpandedTopReserve()`，**不要** `justify-end` 把工具行钉在窗底。
- 球心 y：`overlayExpandedTopReserve() + shellPad + rowH/2`（`overlayOrbAnchorInCanvas`）。

### 7. 对话区

- 挂在 `overlay-chrome-row` 内，`top: 0`，向下长；`maxHeight` = 半屏内可用高度。
- **禁止** `bottom: chromeRowHeight` 挂在外层。

### 8. 拖动与穿透

- 贴边用实测 `orbCenterOffset`；仅 `.overlay-hit-target` 接收点击。

---

## 默认尺寸（公式）

```
窗宽 ≈ 8 + 454 + 16 + 172 + 16 + 454 = 1120 px（随 OVERLAY_LAYOUT 常量）
窗高 = floor(工作区高度 × 0.5)   // 例：1080p 工作区 ≈ 520px
顶留白 ≈ ceil(172 / 2) = 86 px
```

---

## 关键 API

| 函数 | 用途 |
|------|------|
| `overlayExpandedCanvasWidth()` | 固定窗宽 |
| `overlayCanvasHeight(workAreaHeight)` | 半屏窗高 |
| `overlayExpandedTopReserve()` | 顶留白 |
| `overlayConversationMaxHeightInCanvas(canvasH)` | 对话 maxHeight |
| `overlayChromeRowOrbClusterLeft()` | 球簇 left |
| `overlayChromeRowPanelRect(side)` | 面板 left/width |
| `overlayOrbAnchorInCanvas()` | 球心（顶对齐布局） |

渲染：`OverlayApp.tsx`、`useOverlayViewSize.ts`（仅 clamp，无 resize）。

---

## 修改前自检

- [ ] 是否引入 `resizeOverlay` / 底边锚定增高？
- [ ] 球 `left` 是否全模式一致？
- [ ] 是否 `justify-end` 把行钉到底？
- [ ] 输入/对话是否双挂载？
