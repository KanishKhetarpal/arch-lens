export interface DiagramTheme {
  name: string;
  background: string;
  text: string;
  nodeFill: string;
  nodeStroke: string;
  cyclicStroke: string;
  edgeStroke: string;
  activeStroke: string;
  tooltipBackground: string;
}

export const DARK_THEME: DiagramTheme = {
  name: 'dark',
  background: '#0f1115',
  text: '#e6e6e6',
  nodeFill: '#1f2430',
  nodeStroke: '#4b5263',
  cyclicStroke: '#e06c75',
  edgeStroke: '#4b5263',
  activeStroke: '#61afef',
  tooltipBackground: '#1f2430',
};

export const LIGHT_THEME: DiagramTheme = {
  name: 'light',
  background: '#ffffff',
  text: '#1f2430',
  nodeFill: '#f5f6f8',
  nodeStroke: '#b0b8c4',
  cyclicStroke: '#c0392b',
  edgeStroke: '#9aa4b2',
  activeStroke: '#1a73e8',
  tooltipBackground: '#f5f6f8',
};
