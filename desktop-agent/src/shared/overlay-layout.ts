/** Overlay 窗口尺寸（与 renderer 布局一致） */
export const OVERLAY_LAYOUT = {
  /** 单侧输入/对话面板宽度（展开窗 = 左右各一块 + 球 + 双间距） */
  panelContentWidth: 454,
  /** @deprecated 使用 overlayExpandedCanvasWidth() */
  width: 640,
  inputHeight: 56,
  /** 对话区内容过少时的最小面板高度（px） */
  conversationMinPanelHeight: 72,
  /** 对话窗口相对工作区高度的上限比例 */
  conversationMaxHeightRatio: 0.5,
  /** overlay-shell 上下 padding 合计（p-1） */
  shellVerticalPadding: 8,
  /** overlay-shell 单侧水平 padding（p-1） */
  shellHorizontalPadding: 4,
  /** 悬浮球与输入/对话区之间的间距（px） */
  panelGap: 16,
  /** 球侧留白，避免贴边时误判为「右侧仍够宽」 */
  panelSideMargin: 12,
  /** 收起态宽度（与 input 同高，仅改宽不改高，避免球上下跳） */
  collapsedWidth: 56,
  /** 与 inputHeight 一致，收起/输入/菜单展开时共用 */
  collapsedHeight: 56,
  /** 与输入行内容区同高（inputHeight - shellVerticalPadding） */
  orbSize: 48,
  /** 径向菜单卫星按钮直径 */
  radialSatelliteSize: 44,
  /** 卫星按钮间距（中心距 = 直径 + 该值） */
  radialSatelliteGap: 14,
  /** 输入条内会话下拉菜单向下展开所需的底部透明预留 */
  sessionDropdownBottomReserve: 116,
} as const

export type RadialMenuActionId =
  | 'text'
  | 'voice'
  | 'settings'
  | 'theme'
  | 'history'
  | 'new-chat'

/** 围绕悬浮球环形排布（6 项，顺时针） */
export function overlayRadialMenuLayout(): {
  width: number
  height: number
  items: { id: RadialMenuActionId; x: number; y: number }[]
} {
  const sat = OVERLAY_LAYOUT.radialSatelliteSize
  const satR = sat / 2
  const orbR = OVERLAY_LAYOUT.orbSize / 2
  const gap = OVERLAY_LAYOUT.radialSatelliteGap
  /** 球心到卫星按钮中心的轨道半径 */
  const orbitR = orbR + satR + gap
  const extent = orbitR + satR
  const size = Math.ceil(extent * 2 + OVERLAY_LAYOUT.shellVerticalPadding)

  const ring: { id: RadialMenuActionId; deg: number }[] = [
    { id: 'text', deg: -90 },
    { id: 'voice', deg: -30 },
    { id: 'settings', deg: 30 },
    { id: 'theme', deg: 90 },
    { id: 'history', deg: 150 },
    { id: 'new-chat', deg: 210 },
  ]

  const items = ring.map(({ id, deg }) => {
    const rad = (deg * Math.PI) / 180
    return {
      id,
      x: Math.round(Math.cos(rad) * orbitR),
      y: Math.round(Math.sin(rad) * orbitR),
    }
  })

  return { width: size, height: size, items }
}

export function overlayRadialMenuWidth(): number {
  return overlayRadialMenuLayout().width
}

export function overlayRadialMenuHeight(): number {
  return overlayRadialMenuLayout().height
}

export type OverlayDisplayLimits = {
  workAreaHeight: number
  /** 整个 overlay 窗口允许的最大高度（≈ 半屏） */
  maxWindowHeight: number
  workArea: {
    x: number
    y: number
    width: number
    height: number
  }
}

/** 输入/对话面板在悬浮球左侧或右侧 */
export type OverlayPanelSide = 'right' | 'left'

/**
 * 面板在球右侧时，球右缘到屏幕右缘须能放下整块输入/对话区；
 * 面板在球左侧时，对称地看球左缘到屏幕左缘。
 * 窗口已贴住工作区右缘且球在窗左侧时，优先改到左侧展开（避免贴右 clamp 后误判为右侧仍可用）。
 */
export function resolveOverlayPanelSide(
  orbScreenLeft: number,
  orbScreenRight: number,
  orbRectLeft: number,
  orbRectRight: number,
  windowLeft: number,
  windowWidth: number,
  workArea: { x: number; width: number },
): OverlayPanelSide {
  const workLeft = workArea.x
  const workRight = workArea.x + workArea.width
  const windowRight = windowLeft + windowWidth
  const margin = OVERLAY_LAYOUT.panelSideMargin

  const panelSpan =
    windowWidth - orbRectRight - OVERLAY_LAYOUT.shellHorizontalPadding

  const spaceRightOfOrb = workRight - orbScreenRight
  const spaceLeftOfOrb = orbScreenLeft - workLeft

  const roomForPanelRight = spaceRightOfOrb >= panelSpan + margin
  const roomForPanelLeft = spaceLeftOfOrb >= panelSpan + margin

  const pinnedToWorkAreaRight = windowRight >= workRight - 2
  const orbOnLeftHalfOfWindow = orbRectLeft + orbRectRight < windowWidth

  if (pinnedToWorkAreaRight && orbOnLeftHalfOfWindow && roomForPanelLeft) {
    return 'left'
  }
  if (roomForPanelRight) return 'right'
  if (roomForPanelLeft) return 'left'

  return spaceRightOfOrb >= spaceLeftOfOrb ? 'right' : 'left'
}

/** 根据球的屏幕左缘（收起/拖动后记录）判断展开方向 */
export function resolveOverlayPanelSideFromAnchor(
  orbScreenLeft: number,
  expandedWidth: number,
  workArea: { x: number; width: number },
): OverlayPanelSide {
  const pad = OVERLAY_LAYOUT.shellHorizontalPadding
  const orbSize = OVERLAY_LAYOUT.orbSize
  const orbScreenRight = orbScreenLeft + orbSize
  const panelSpan = overlayPanelWidthForCanvas(expandedWidth, false)
  const margin = OVERLAY_LAYOUT.panelSideMargin
  const workLeft = workArea.x
  const workRight = workArea.x + workArea.width

  const spaceRight = workRight - orbScreenRight
  const spaceLeft = orbScreenLeft - workLeft

  if (spaceRight >= panelSpan + margin) return 'right'
  if (spaceLeft >= panelSpan + margin) return 'left'

  const winXIfRight = orbScreenLeft - pad
  if (winXIfRight + expandedWidth >= workRight - 2 && spaceLeft >= panelSpan) {
    return 'left'
  }

  return spaceRight >= spaceLeft ? 'right' : 'left'
}

/** 保持球屏幕左缘不变时，窗口应有的 x */
/** 面板在球左侧时，用窗口右缘锚定 x，避免收起/展开与测量 anchor 不同步导致抖动 */
export function overlayWindowXAnchored(
  orbScreenLeft: number,
  panelSide: OverlayPanelSide,
  targetWidth: number,
  viewMode: OverlayViewMode,
  current?: { x: number; width: number },
): number {
  if (panelSide === 'left' && current) {
    return current.x + current.width - targetWidth
  }
  return overlayWindowXForOrbScreenLeft(
    orbScreenLeft,
    panelSide,
    targetWidth,
    viewMode,
  )
}

export function overlayWindowXForOrbScreenLeft(
  orbScreenLeft: number,
  panelSide: OverlayPanelSide,
  windowWidth: number,
  viewMode: OverlayViewMode,
): number {
  const pad = OVERLAY_LAYOUT.shellHorizontalPadding
  if (viewMode === 'collapsed') {
    if (panelSide === 'right') {
      return orbScreenLeft - pad
    }
    return (
      orbScreenLeft - (windowWidth - pad - OVERLAY_LAYOUT.orbSize)
    )
  }
  if (panelSide === 'right') {
    return orbScreenLeft - pad
  }
  return (
    orbScreenLeft -
    (windowWidth - pad - OVERLAY_LAYOUT.orbSize)
  )
}

export function overlayMaxWindowHeight(workAreaHeight: number): number {
  return Math.floor(
    workAreaHeight * OVERLAY_LAYOUT.conversationMaxHeightRatio,
  )
}

/** 平常态（输入/收起）窗口高度：环形菜单完全展开所需高度 */
export function overlayCanvasHeightBaseline(): number {
  const chrome = OVERLAY_LAYOUT.shellVerticalPadding
  const bottom = overlayCanvasBottomReserve()
  const menuH = overlayRadialMenuHeight()
  const rowH = overlayChromeRowHeight()
  return Math.max(menuH + bottom + chrome, rowH + bottom + chrome)
}

/** 工具行 + 底部留白（对话面板叠在工具行上方、底边与输入框对齐） */
export function overlayConversationChromeBlock(): number {
  return overlayChromeRowHeight() + overlayCanvasBottomReserve()
}

/** 输入 pill 顶边距 overlay-chrome-row 顶边的距离（与输入态垂直居中一致） */
export function overlayInputPillTopInset(): number {
  return (overlayChromeRowHeight() - OVERLAY_LAYOUT.inputHeight) / 2
}

/**
 * 对话面板最大高度：输入框顶边 → 工作区底边（向下可拓展的空间），且 ≤ 50vh。
 */
export function overlayConversationPanelMaxHeightPx(
  workArea: { y: number; height: number },
  inputPillTopScreenY: number,
): number {
  const cap = overlayMaxWindowHeight(workArea.height)
  const shellBottom = OVERLAY_LAYOUT.shellVerticalPadding / 2
  const downward = Math.max(
    0,
    workArea.y + workArea.height - inputPillTopScreenY - shellBottom,
  )
  return Math.max(
    OVERLAY_LAYOUT.conversationMinPanelHeight,
    Math.min(cap, downward),
  )
}

/**
 * 对话窗高：面板在 chrome-row 内 top:0 向下长，仅「超出工具行」的部分增加窗高。
 * 底边锚定 resize，球行在屏幕上不动。
 */
export function conversationWindowSize(
  panelContentHeight: number,
  maxPanelHeightPx: number,
  stableWindowHeight: number,
): {
  windowHeight: number
  clamped: boolean
  panelHeight: number
} {
  const rowH = overlayChromeRowHeight()
  const minPanel = OVERLAY_LAYOUT.conversationMinPanelHeight
  const contentH = Math.max(panelContentHeight, minPanel)
  const panelH = Math.min(contentH, maxPanelHeightPx)
  const clamped = contentH > maxPanelHeightPx
  const overflowBelowRow = Math.max(0, panelH - rowH)

  return {
    windowHeight: stableWindowHeight + overflowBelowRow,
    clamped,
    panelHeight: panelH,
  }
}

/**
 * - input：显示输入框
 * - collapsed：用户点击悬浮球收起，仅保留球（≠ 对话态下的输入隐藏）
 * - conversation：提交后展示本轮问答，输入框自动隐藏
 */
export type OverlayViewMode = 'input' | 'collapsed' | 'conversation'

export function overlayWidthForMode(
  mode: OverlayViewMode,
  menuOpen = false,
): number {
  if (mode === 'collapsed') {
    return menuOpen ? overlayRadialMenuWidth() : OVERLAY_LAYOUT.collapsedWidth
  }
  return overlayExpandedCanvasWidth()
}

export function overlayHeightForMode(
  mode: OverlayViewMode,
  menuOpen = false,
): number {
  switch (mode) {
    case 'conversation':
      return (
        OVERLAY_LAYOUT.conversationMinPanelHeight +
        OVERLAY_LAYOUT.shellVerticalPadding
      )
    case 'collapsed':
      return overlayCanvasHeightBaseline()
    default:
      return OVERLAY_LAYOUT.inputHeight
  }
}

export function overlayOrbScreenCenter(
  orbScreenLeft: number,
  orbScreenTop: number,
): { cx: number; cy: number } {
  const half = OVERLAY_LAYOUT.orbSize / 2
  return {
    cx: orbScreenLeft + half,
    cy: orbScreenTop + half,
  }
}

/** 收起态窗口矩形（菜单开/关）：始终以球心居中，避免开/关菜单时 x/y 跳变 */
export function overlayCollapsedWindowRect(
  orbScreenLeft: number,
  orbScreenTop: number,
  _panelSide: OverlayPanelSide,
  menuOpen: boolean,
): { x: number; y: number; width: number; height: number } {
  const width = overlayWidthForMode('collapsed', menuOpen)
  const height = overlayHeightForMode('collapsed', menuOpen)
  const { cx, cy } = overlayOrbScreenCenter(orbScreenLeft, orbScreenTop)
  return {
    x: Math.round(cx - width / 2),
    y: Math.round(cy - height / 2),
    width,
    height,
  }
}

/** 悬浮球/菜单簇在工具行内占用的宽度（输入态与收起态一致，避免展开时球位移） */
export function overlayOrbClusterWidth(): number {
  return overlayRadialMenuLayout().width
}

/** 单侧输入/对话面板宽度 */
export function overlayPanelContentWidth(): number {
  return OVERLAY_LAYOUT.panelContentWidth
}

/** 输入/对话面板在固定画布内的可用宽度 */
export function overlayPanelWidthForCanvas(
  _canvasWidth?: number,
  _withSideReserve = false,
): number {
  return overlayPanelContentWidth()
}

/** @deprecated 使用 overlayPanelContentWidth */
export function overlayPanelWidth(_windowWidth: number): number {
  return overlayPanelContentWidth()
}

/**
 * 展开态画布宽度：左面板 + 间距 + 球簇 + 间距 + 右面板 + shell 水平 padding。
 */
export function overlayExpandedCanvasWidth(): number {
  const padH = OVERLAY_LAYOUT.shellHorizontalPadding
  const panelW = overlayPanelContentWidth()
  const clusterW = overlayOrbClusterWidth()
  const gap = OVERLAY_LAYOUT.panelGap
  return padH * 2 + panelW + gap + clusterW + gap + panelW
}

/** 固定画布 / 窗口宽度 */
export function overlayCanvasWidth(): number {
  return overlayExpandedCanvasWidth()
}

/** 球/输入行上方留白：半个环形菜单外框高度 */
export function overlayExpandedTopReserve(): number {
  return Math.ceil(overlayRadialMenuHeight() / 2)
}

/** 创建 overlay 时窗高 = 工作区高度的 50%（创建时算一次，之后不 resize） */
export function overlayCanvasHeight(workAreaHeight: number): number {
  return overlayMaxWindowHeight(workAreaHeight)
}

/** @deprecated 展开态窗高请用 overlayCanvasHeight(workAreaHeight) */
export function overlayStableExpandedHeight(): number {
  return overlayCanvasHeightBaseline() + overlayInputExtraBottomReserve()
}

/** 半屏窗内：对话区可用的最大高度（顶留白 + 工具行以下） */
export function overlayConversationMaxHeightInCanvas(
  canvasHeight: number,
): number {
  const shell = OVERLAY_LAYOUT.shellVerticalPadding
  const top = overlayExpandedTopReserve()
  const row = overlayChromeRowHeight()
  const usable = canvasHeight - top - row - shell
  return Math.max(OVERLAY_LAYOUT.conversationMinPanelHeight, usable)
}

/** 底部工具行高度（球 + 输入/对话同一行） */
export function overlayChromeRowHeight(): number {
  return OVERLAY_LAYOUT.inputHeight
}

/** 收起态球槽（容纳整圈菜单） */
export function overlayOrbSlotSize(): number {
  return overlayRadialMenuLayout().width
}

/** 输入/对话态球槽（仅球，避免 172px 菜单容器撑开 flex 间距） */
export function overlayOrbSlotSizeCompact(): number {
  return OVERLAY_LAYOUT.orbSize
}

export function overlayOrbSlotSizeForMode(
  viewMode: OverlayViewMode,
): number {
  return viewMode === 'collapsed'
    ? overlayOrbSlotSize()
    : overlayOrbSlotSizeCompact()
}

/** 环形菜单相对球槽向两侧伸出的宽度 */
export function overlayCanvasSideReserve(): number {
  const menuR = overlayOrbClampRadius(true)
  const slotR = overlayOrbSlotSizeCompact() / 2
  return Math.max(0, menuR - slotR)
}

/** 画布底部透明留白，使环形菜单向下展开时不被窗口裁切 */
export function overlayCanvasBottomReserve(): number {
  const menuR = overlayOrbClampRadius(true)
  const slotR = overlayOrbSlotSizeCompact() / 2
  return Math.max(0, menuR - slotR)
}

/** 输入态额外给 session 下拉菜单预留底部透明区，不参与球/对话锚点计算 */
export function overlayInputCanvasBottomReserve(): number {
  return Math.max(
    overlayCanvasBottomReserve(),
    OVERLAY_LAYOUT.sessionDropdownBottomReserve,
  )
}

export function overlayInputExtraBottomReserve(): number {
  return overlayInputCanvasBottomReserve() - overlayCanvasBottomReserve()
}

/** 环形菜单绘制尺寸（可超出球槽，overflow: visible） */
export function overlayOrbColumnSize(): { width: number; height: number } {
  const menu = overlayRadialMenuLayout()
  return { width: menu.width, height: menu.height }
}

export type OverlayOrbCenterOptions = {
  canvasWidth?: number
}

/**
 * 球心在展开画布内的固定锚点（顶留白 + 工具行内垂直居中，不随 panelSide 变化）。
 */
export function overlayOrbAnchorInCanvas(
  _canvasHeight: number,
  _canvasWidth?: number,
): { cx: number; cy: number } {
  const rowH = overlayChromeRowHeight()
  const pad = OVERLAY_LAYOUT.shellVerticalPadding / 2
  const cy = overlayExpandedTopReserve() + pad + rowH / 2
  const cx = overlayOrbAnchorCxExpanded()
  return { cx, cy }
}

/** 展开态球心 x：左面板 + 间距 + 球簇中心 */
export function overlayOrbAnchorCxExpanded(): number {
  const padH = OVERLAY_LAYOUT.shellHorizontalPadding
  const panelW = overlayPanelContentWidth()
  const clusterW = overlayOrbClusterWidth()
  const gap = OVERLAY_LAYOUT.panelGap
  return padH + panelW + gap + clusterW / 2
}

/** 收起态（小窗菜单簇居中）球心 x */
export function overlayOrbAnchorCxCollapsed(
  canvasWidth: number = OVERLAY_LAYOUT.collapsedWidth,
): number {
  const padH = OVERLAY_LAYOUT.shellHorizontalPadding
  return padH + overlayCanvasSideReserve() + overlayOrbClusterWidth() / 2
}

/** 球簇内边距（48px 球在 172px 槽内居中时的单侧留白） */
export function overlayOrbClusterPad(): number {
  return (overlayOrbClusterWidth() - OVERLAY_LAYOUT.orbSize) / 2
}

/** 工具行内球簇左上角 x（固定，收起/展开/左右切换都不变） */
export function overlayChromeRowOrbClusterLeft(): number {
  return overlayPanelContentWidth() + OVERLAY_LAYOUT.panelGap
}

/** 工具行内：球左缘 x（相对 chrome-row，不含 shell 的 sideReserve） */
export function overlayChromeRowOrbLeft(): number {
  return (
    overlayChromeRowOrbClusterLeft() + overlayOrbClusterPad()
  )
}

/** 工具行内：球右缘 x */
export function overlayChromeRowOrbRight(): number {
  return overlayChromeRowOrbLeft() + OVERLAY_LAYOUT.orbSize
}

/** 展开态五列网格：左面板 | 间距 | 球簇 | 间距 | 右面板 */
export function overlayExpandedGridTemplateColumns(): string {
  const panelW = overlayPanelContentWidth()
  const gap = OVERLAY_LAYOUT.panelGap
  const clusterW = overlayOrbClusterWidth()
  return `${panelW}px ${gap}px ${clusterW}px ${gap}px ${panelW}px`
}

export function overlayPanelGridColumn(panelSide: OverlayPanelSide): number {
  return panelSide === 'left' ? 1 : 5
}

export function overlayOrbGridColumn(): number {
  return 3
}

/**
 * 工具行内输入/对话面板绝对定位（相对 overlay-chrome-row）。
 * 间距以 48px 球缘为准，而非 172px 菜单簇外框（否则 panelGap 会被簇内留白吃掉）。
 */
export function overlayChromeRowPanelRect(
  panelSide: OverlayPanelSide,
): { left: number; width: number } {
  const panelW = overlayPanelContentWidth()
  const gap = OVERLAY_LAYOUT.panelGap
  const orbLeft = overlayChromeRowOrbLeft()
  const orbRight = overlayChromeRowOrbRight()
  if (panelSide === 'left') {
    return { left: orbLeft - gap - panelW, width: panelW }
  }
  return { left: orbRight + gap, width: panelW }
}

/** @deprecated 球心位置与 panelSide 无关，请用 overlayOrbAnchorInCanvas */
export function overlayOrbCenterInCanvas(
  panelSide: OverlayPanelSide,
  canvasHeight: number,
  options: OverlayOrbCenterOptions = {},
): { cx: number; cy: number } {
  return overlayOrbAnchorInCanvas(canvasHeight, options.canvasWidth)
}


/** 根据球心屏幕坐标计算窗口左上角（拖动后仅改 x/y） */
export function overlayWindowOriginForOrbCenter(
  screenCx: number,
  screenCy: number,
  panelSide: OverlayPanelSide,
  canvasWidth: number,
  canvasHeight: number,
  orbCenterOptions?: OverlayOrbCenterOptions,
): { x: number; y: number } {
  const { cx, cy } = overlayOrbAnchorInCanvas(canvasHeight, canvasWidth)
  return {
    x: Math.round(screenCx - cx),
    y: Math.round(screenCy - cy),
  }
}

/** 贴边限制时计入的半径：菜单展开按整圈菜单，收起按球半径 */
export function overlayOrbClampRadius(menuOpen: boolean): number {
  if (!menuOpen) {
    return OVERLAY_LAYOUT.orbSize / 2
  }
  const menu = overlayRadialMenuLayout()
  return Math.ceil(menu.width / 2)
}

/**
 * 按悬浮球（非整窗）限制窗口原点，避免大透明窗导致球离屏幕边缘差一截。
 * 透明区域允许超出工作区。
 */
export function clampOverlayWindowOrigin(
  winX: number,
  winY: number,
  panelSide: OverlayPanelSide,
  canvasHeight: number,
  workArea: { x: number; y: number; width: number; height: number },
  menuOpen = false,
  canvasWidth = overlayCanvasWidth(),
): { x: number; y: number } {
  const { cx, cy } = overlayOrbAnchorInCanvas(canvasHeight, canvasWidth)
  const orbR = overlayOrbClampRadius(menuOpen)
  const edge = OVERLAY_LAYOUT.shellHorizontalPadding

  const workLeft = workArea.x
  const workTop = workArea.y
  const workRight = workArea.x + workArea.width
  const workBottom = workArea.y + workArea.height

  const minCx = workLeft + edge + orbR
  const maxCx = workRight - edge - orbR
  const minCy = workTop + edge + orbR
  const maxCy = workBottom - edge - orbR

  let screenCx =
    minCx <= maxCx
      ? Math.max(minCx, Math.min(winX + cx, maxCx))
      : workLeft + workArea.width / 2
  let screenCy =
    minCy <= maxCy
      ? Math.max(minCy, Math.min(winY + cy, maxCy))
      : workTop + workArea.height / 2

  let outX = Math.round(screenCx - cx)
  let outY = Math.round(screenCy - cy)

  return { x: outX, y: outY }
}

/** 拖动时按实测球心相对窗口左上角的偏移做贴边（与 DOM 一致，不依赖 panelSide） */
export function clampOverlayWindowOriginByOrbOffset(
  winX: number,
  winY: number,
  orbOffsetX: number,
  orbOffsetY: number,
  workArea: { x: number; y: number; width: number; height: number },
  menuOpen = false,
  _canvasWidth = overlayCanvasWidth(),
  _canvasHeight: number,
): { x: number; y: number } {
  const orbR = overlayOrbClampRadius(menuOpen)
  const edge = OVERLAY_LAYOUT.shellHorizontalPadding

  const workLeft = workArea.x
  const workTop = workArea.y
  const workRight = workArea.x + workArea.width
  const workBottom = workArea.y + workArea.height

  const minCx = workLeft + edge + orbR
  const maxCx = workRight - edge - orbR
  const minCy = workTop + edge + orbR
  const maxCy = workBottom - edge - orbR

  const rawCx = winX + orbOffsetX
  const rawCy = winY + orbOffsetY

  let screenCx =
    minCx <= maxCx
      ? Math.max(minCx, Math.min(rawCx, maxCx))
      : workLeft + workArea.width / 2
  let screenCy =
    minCy <= maxCy
      ? Math.max(minCy, Math.min(rawCy, maxCy))
      : workTop + workArea.height / 2

  let outX = Math.round(screenCx - orbOffsetX)
  let outY = Math.round(screenCy - orbOffsetY)

  return { x: outX, y: outY }
}
