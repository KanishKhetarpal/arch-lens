export interface D3Node {
  id: string;
  label: string;
  layer: number;
  cycleId: number | null;
  fanIn: number;
  fanOut: number;
  instability: number;
}

export interface D3Link {
  /** D3's force/link layouts expect `source`/`target`, not `from`/`to`. */
  source: string;
  target: string;
  dataTypes: string[];
  cyclic: boolean;
}

/** Plain-JSON shape consumable by D3 force/hierarchy layouts client-side. */
export interface D3Graph {
  nodes: D3Node[];
  links: D3Link[];
}
