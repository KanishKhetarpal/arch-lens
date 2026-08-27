import { LayeredLayout } from '../layout/layered-layout';
import { LIGHT_THEME } from '../interfaces/diagram-theme.interface';
import { DiagramModel } from '../interfaces/diagram-model.interface';
import { HtmlDiagramRenderer } from './html-diagram-renderer';

describe('HtmlDiagramRenderer', () => {
  let renderer: HtmlDiagramRenderer;

  const model: DiagramModel = {
    nodes: [
      {
        id: 'a.ts',
        label: 'a.ts',
        layerDepth: 0,
        cycleId: 0,
        metrics: { nodeId: 'a.ts', fanIn: 1, fanOut: 1, coupling: 2, instability: 0.5 },
      },
      {
        id: 'b.ts',
        label: 'b <cats> & "co"',
        layerDepth: 0,
        cycleId: 0,
        metrics: { nodeId: 'b.ts', fanIn: 1, fanOut: 1, coupling: 2, instability: 0.5 },
      },
    ],
    edges: [{ from: 'a.ts', to: 'b.ts', dataTypes: ['CreateCatDto'], cyclic: true }],
    layers: [{ depth: 0, nodeIds: ['a.ts', 'b.ts'] }],
    cycles: [{ nodeIds: ['a.ts', 'b.ts'] }],
  };

  beforeEach(() => {
    renderer = new HtmlDiagramRenderer(new LayeredLayout());
  });

  it('renders a self-contained HTML document with an SVG node per DiagramNode', () => {
    const html = renderer.render(model);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<svg id="diagram"');
    expect(html).toContain('<g class="node cyclic" data-id="a.ts"');
    expect(html).toContain('<g class="node cyclic" data-id="b.ts"');
  });

  it('renders an edge line wired to its endpoints via data-from/data-to, styled cyclic', () => {
    const html = renderer.render(model);

    expect(html).toContain('<line class="edge cyclic" data-from="a.ts" data-to="b.ts"');
  });

  it('escapes special characters in node labels and attributes', () => {
    const html = renderer.render(model);

    expect(html).toContain('b &lt;cats&gt; &amp; "co"');
    expect(html).not.toContain('<cats>');
  });

  it('embeds per-node metrics as JSON for the hover tooltip script to read', () => {
    const html = renderer.render(model);

    expect(html).toContain('id="graph-metadata"');
    const jsonMatch = html.match(/<script id="graph-metadata"[^>]*>([\s\S]*?)<\/script>/);
    expect(jsonMatch).not.toBeNull();
    const metadata = JSON.parse((jsonMatch as RegExpMatchArray)[1]);
    expect(metadata['a.ts']).toEqual({
      label: 'a.ts',
      layerDepth: 0,
      cycleId: 0,
      fanIn: 1,
      fanOut: 1,
      instability: 0.5,
    });
  });

  it('applies the given theme to the generated stylesheet, defaulting to the dark theme', () => {
    const dark = renderer.render(model);
    expect(dark).toContain('background: #0f1115');

    const light = renderer.render(model, { theme: LIGHT_THEME });
    expect(light).toContain('background: #ffffff');
  });

  it('forwards layout options through to the layout engine', () => {
    const vertical = renderer.render(model);
    const horizontal = renderer.render(model, { layout: { direction: 'horizontal' } });

    expect(vertical).not.toBe(horizontal);
  });
});
