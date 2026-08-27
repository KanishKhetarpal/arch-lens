export interface LayoutOptions {
  /** Axis layers are stacked along. 'vertical' = top-down, 'horizontal' = left-right. Defaults to 'vertical'. */
  direction?: 'vertical' | 'horizontal';
  /** Pixel gap between nodes within the same layer. Defaults to 200. */
  nodeSpacing?: number;
  /** Pixel gap between successive layers. Defaults to 140. */
  layerSpacing?: number;
}
