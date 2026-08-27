import { Injectable } from '@nestjs/common';
import { LayeredLayout, NodePosition } from '../layout/layered-layout';
import { DiagramModel } from '../interfaces/diagram-model.interface';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const PADDING = 60;

interface NodeMetadata {
  label: string;
  layerDepth: number;
  cycleId: number | null;
  fanIn: number;
  fanOut: number;
  instability: number;
}

@Injectable()
export class HtmlDiagramRenderer {
  constructor(private readonly layout: LayeredLayout) {}

  /** Renders a self-contained HTML document: inline SVG + vanilla-JS pan/zoom/hover/click highlighting. */
  render(model: DiagramModel): string {
    const positions = this.layout.compute(model);
    const positionById = new Map(positions.map((position) => [position.id, position]));

    const bounds = this.computeBounds(positions);
    const width = bounds.maxX - bounds.minX + NODE_WIDTH + PADDING * 2;
    const height = bounds.maxY - bounds.minY + NODE_HEIGHT + PADDING * 2;
    const offsetX = PADDING - bounds.minX;
    const offsetY = PADDING - bounds.minY;

    const edgesMarkup = this.renderEdges(model, positionById, offsetX, offsetY);
    const nodesMarkup = this.renderNodes(model, positionById, offsetX, offsetY);
    const metadata = this.buildMetadata(model);

    return this.wrapDocument(width, height, nodesMarkup, edgesMarkup, metadata);
  }

  private computeBounds(positions: NodePosition[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const xs = positions.map((position) => position.x).concat(0);
    const ys = positions.map((position) => position.y).concat(0);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }

  private renderEdges(
    model: DiagramModel,
    positionById: Map<string, NodePosition>,
    offsetX: number,
    offsetY: number,
  ): string {
    return model.edges
      .map((edge) => {
        const from = positionById.get(edge.from);
        const to = positionById.get(edge.to);
        if (!from || !to) {
          return '';
        }
        const x1 = from.x + offsetX + NODE_WIDTH / 2;
        const y1 = from.y + offsetY + NODE_HEIGHT / 2;
        const x2 = to.x + offsetX + NODE_WIDTH / 2;
        const y2 = to.y + offsetY + NODE_HEIGHT / 2;
        const cls = edge.cyclic ? 'edge cyclic' : 'edge';
        return (
          `<line class="${cls}" data-from="${this.escapeAttr(edge.from)}" ` +
          `data-to="${this.escapeAttr(edge.to)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
          `marker-end="url(#arrow)"></line>`
        );
      })
      .filter((line) => line.length > 0)
      .join('\n      ');
  }

  private renderNodes(
    model: DiagramModel,
    positionById: Map<string, NodePosition>,
    offsetX: number,
    offsetY: number,
  ): string {
    return model.nodes
      .map((node) => {
        const position = positionById.get(node.id);
        if (!position) {
          return '';
        }
        const x = position.x + offsetX;
        const y = position.y + offsetY;
        const cls = node.cycleId !== null ? 'node cyclic' : 'node';
        return (
          `<g class="${cls}" data-id="${this.escapeAttr(node.id)}" transform="translate(${x}, ${y})">\n` +
          `        <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="6"></rect>\n` +
          `        <text x="${NODE_WIDTH / 2}" y="${NODE_HEIGHT / 2}" dominant-baseline="middle" ` +
          `text-anchor="middle">${this.escapeText(node.label)}</text>\n      </g>`
        );
      })
      .filter((group) => group.length > 0)
      .join('\n      ');
  }

  private buildMetadata(model: DiagramModel): Record<string, NodeMetadata> {
    const metadata: Record<string, NodeMetadata> = {};
    for (const node of model.nodes) {
      metadata[node.id] = {
        label: node.label,
        layerDepth: node.layerDepth,
        cycleId: node.cycleId,
        fanIn: node.metrics.fanIn,
        fanOut: node.metrics.fanOut,
        instability: Number(node.metrics.instability.toFixed(2)),
      };
    }
    return metadata;
  }

  private wrapDocument(
    width: number,
    height: number,
    nodesMarkup: string,
    edgesMarkup: string,
    metadata: Record<string, NodeMetadata>,
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>arch-lens diagram</title>
<style>
${this.stylesheet()}
</style>
</head>
<body>
<svg id="diagram" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z"></path>
    </marker>
  </defs>
  <g id="viewport">
    <g id="edges">
      ${edgesMarkup}
    </g>
    <g id="nodes">
      ${nodesMarkup}
    </g>
  </g>
</svg>
<div id="tooltip"></div>
<script id="graph-metadata" type="application/json">${JSON.stringify(metadata)}</script>
<script>
${this.interactionScript()}
</script>
</body>
</html>
`;
  }

  private stylesheet(): string {
    return `  html, body { margin: 0; height: 100%; font-family: sans-serif; background: #0f1115; color: #e6e6e6; }
  svg { width: 100%; height: 100%; cursor: grab; }
  svg:active { cursor: grabbing; }
  marker path { fill: #4b5263; }
  .node rect { fill: #1f2430; stroke: #4b5263; stroke-width: 1.5; }
  .node text { fill: #e6e6e6; font-size: 12px; pointer-events: none; }
  .node.cyclic rect { stroke: #e06c75; }
  .edge { stroke: #4b5263; stroke-width: 1.5; }
  .edge.cyclic { stroke: #e06c75; stroke-dasharray: 4 3; }
  .edge.dimmed, .node.dimmed { opacity: 0.15; }
  .edge.active { stroke: #61afef; stroke-width: 2.5; }
  .node.active rect { stroke: #61afef; stroke-width: 2.5; }
  #tooltip {
    position: fixed; pointer-events: none; background: #1f2430; color: #e6e6e6;
    border: 1px solid #4b5263; border-radius: 4px; padding: 6px 10px; font-size: 12px;
    display: none; white-space: pre; z-index: 10;
  }`;
  }

  /** Deliberately dependency-free: no D3/CDN, so the output works offline as a single file. */
  private interactionScript(): string {
    return `(function () {
  var svg = document.getElementById('diagram');
  var viewport = document.getElementById('viewport');
  var tooltip = document.getElementById('tooltip');
  var metadata = JSON.parse(document.getElementById('graph-metadata').textContent);

  var scale = 1, tx = 0, ty = 0;
  var panning = false, lastX = 0, lastY = 0;
  var pinnedId = null;

  function applyTransform() {
    viewport.setAttribute('transform', 'translate(' + tx + ',' + ty + ') scale(' + scale + ')');
  }

  svg.addEventListener('mousedown', function (event) {
    if (event.target.closest('.node')) return;
    panning = true;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  window.addEventListener('mousemove', function (event) {
    if (!panning) return;
    tx += event.clientX - lastX;
    ty += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    applyTransform();
  });
  window.addEventListener('mouseup', function () { panning = false; });

  svg.addEventListener('wheel', function (event) {
    event.preventDefault();
    var factor = event.deltaY < 0 ? 1.1 : 0.9;
    scale = Math.min(4, Math.max(0.2, scale * factor));
    applyTransform();
  }, { passive: false });

  function neighbors(id) {
    var ids = new Set([id]);
    document.querySelectorAll('.edge').forEach(function (edge) {
      if (edge.dataset.from === id) ids.add(edge.dataset.to);
      if (edge.dataset.to === id) ids.add(edge.dataset.from);
    });
    return ids;
  }

  function highlight(id) {
    var active = neighbors(id);
    document.querySelectorAll('.node').forEach(function (node) {
      node.classList.toggle('active', active.has(node.dataset.id));
      node.classList.toggle('dimmed', !active.has(node.dataset.id));
    });
    document.querySelectorAll('.edge').forEach(function (edge) {
      var connected = edge.dataset.from === id || edge.dataset.to === id;
      edge.classList.toggle('active', connected);
      edge.classList.toggle('dimmed', !connected);
    });
  }

  function clearHighlight() {
    document.querySelectorAll('.node, .edge').forEach(function (el) {
      el.classList.remove('active', 'dimmed');
    });
  }

  document.querySelectorAll('.node').forEach(function (node) {
    node.addEventListener('mouseenter', function () {
      if (!pinnedId) highlight(node.dataset.id);
      var info = metadata[node.dataset.id];
      if (info) {
        tooltip.textContent = node.dataset.id +
          '\\nfan-in: ' + info.fanIn + '  fan-out: ' + info.fanOut +
          '\\ninstability: ' + info.instability +
          (info.cycleId !== null ? '\\nin cycle' : '');
        tooltip.style.display = 'block';
      }
    });
    node.addEventListener('mousemove', function (event) {
      tooltip.style.left = (event.clientX + 12) + 'px';
      tooltip.style.top = (event.clientY + 12) + 'px';
    });
    node.addEventListener('mouseleave', function () {
      tooltip.style.display = 'none';
      if (!pinnedId) clearHighlight();
    });
    node.addEventListener('click', function () {
      if (pinnedId === node.dataset.id) {
        pinnedId = null;
        clearHighlight();
      } else {
        pinnedId = node.dataset.id;
        highlight(pinnedId);
      }
    });
  });
})();`;
  }

  private escapeAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  private escapeText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
