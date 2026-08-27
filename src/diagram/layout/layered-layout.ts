import { Injectable } from '@nestjs/common';
import { DiagramModel } from '../interfaces/diagram-model.interface';

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

const NODE_SPACING = 200;
const LAYER_SPACING = 140;

@Injectable()
export class LayeredLayout {
  /** Places each node along its layer axis, spread out within the layer, reusing GraphLayering's depths. */
  compute(model: DiagramModel): NodePosition[] {
    const positions: NodePosition[] = [];
    for (const layer of model.layers) {
      const sortedIds = [...layer.nodeIds].sort();
      sortedIds.forEach((id, index) => {
        positions.push({
          id,
          x: index * NODE_SPACING,
          y: layer.depth * LAYER_SPACING,
        });
      });
    }
    return positions;
  }
}
