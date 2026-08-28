export type CouplingHotspotReason = 'fan-in-magnet' | 'fan-out-heavy' | 'balanced';

/** A non-trivial strongly connected component, surfaced as something worth explaining. */
export interface CycleHotspot {
  /** Index into DiagramModel.cycles. */
  cycleId: number;
  nodeIds: string[];
  description: string;
}

/** A module whose fan-in/fan-out coupling crosses the configured threshold. */
export interface CouplingHotspot {
  nodeId: string;
  coupling: number;
  reason: CouplingHotspotReason;
  description: string;
}

export interface HotspotReport {
  cycles: CycleHotspot[];
  coupling: CouplingHotspot[];
}
