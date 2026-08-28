import { Injectable } from '@nestjs/common';
import { DiagramModel } from '../../diagram/interfaces/diagram-model.interface';
import {
  CouplingHotspot,
  CouplingHotspotReason,
  CycleHotspot,
  HotspotReport,
} from '../interfaces/hotspot.interface';

export interface HotspotOptions {
  /** Minimum fanIn + fanOut for a node to be flagged as a coupling hotspot. */
  minCoupling?: number;
}

const DEFAULT_MIN_COUPLING = 3;

@Injectable()
export class HotspotDetector {
  /**
   * Surfaces the two kinds of structural risk worth calling out in an
   * explanation: real dependency cycles (Phase 4's non-trivial SCCs,
   * already resolved onto DiagramModel.cycles) and modules whose coupling
   * crosses `minCoupling`, labelled by whether fan-in or fan-out dominates.
   */
  detect(model: DiagramModel, options: HotspotOptions = {}): HotspotReport {
    const minCoupling = options.minCoupling ?? DEFAULT_MIN_COUPLING;

    const cycles: CycleHotspot[] = model.cycles.map((cycle, cycleId) => ({
      cycleId,
      nodeIds: cycle.nodeIds,
      description: `${cycle.nodeIds.length} modules form a dependency cycle: ${cycle.nodeIds.join(' -> ')}.`,
    }));

    const coupling: CouplingHotspot[] = model.nodes
      .filter((node) => node.metrics.coupling >= minCoupling)
      .sort((a, b) => b.metrics.coupling - a.metrics.coupling)
      .map((node) => {
        const reason = this.classify(node.metrics.fanIn, node.metrics.fanOut);
        return {
          nodeId: node.id,
          coupling: node.metrics.coupling,
          reason,
          description: this.describe(node.label, node.metrics.fanIn, node.metrics.fanOut, reason),
        };
      });

    return { cycles, coupling };
  }

  private classify(fanIn: number, fanOut: number): CouplingHotspotReason {
    if (fanIn > fanOut) {
      return 'fan-in-magnet';
    }
    if (fanOut > fanIn) {
      return 'fan-out-heavy';
    }
    return 'balanced';
  }

  private describe(
    label: string,
    fanIn: number,
    fanOut: number,
    reason: CouplingHotspotReason,
  ): string {
    switch (reason) {
      case 'fan-in-magnet':
        return `${label} is depended on by ${fanIn} modules, making it a change-risk hotspot.`;
      case 'fan-out-heavy':
        return `${label} depends on ${fanOut} modules, making it fragile to upstream changes.`;
      default:
        return `${label} has balanced fan-in/fan-out (${fanIn}/${fanOut}) but high overall coupling.`;
    }
  }
}
