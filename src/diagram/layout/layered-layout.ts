import { Injectable } from '@nestjs/common';
import { DiagramModel } from '../interfaces/diagram-model.interface';
import { LayoutOptions } from '../interfaces/layout-options.interface';

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

const DEFAULT_NODE_SPACING = 200;
const DEFAULT_LAYER_SPACING = 140;

@Injectable()
export class LayeredLayout {
  /** Places each node along its layer axis, spread out within the layer, reusing GraphLayering's depths. */
  compute(model: DiagramModel, options: LayoutOptions = {}): NodePosition[] {
    const direction = options.direction ?? 'vertical';
    const nodeSpacing = options.nodeSpacing ?? DEFAULT_NODE_SPACING;
    const layerSpacing = options.layerSpacing ?? DEFAULT_LAYER_SPACING;

    const positions: NodePosition[] = [];
    for (const layer of model.layers) {
      const sortedIds = [...layer.nodeIds].sort();
      sortedIds.forEach((id, index) => {
        const across = index * nodeSpacing;
        const along = layer.depth * layerSpacing;
        positions.push(
          direction === 'vertical' ? { id, x: across, y: along } : { id, x: along, y: across },
        );
      });
    }
    return positions;
  }
}
