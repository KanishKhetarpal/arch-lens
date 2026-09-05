import { GalleryIndexBuilder, GallerySampleSummary } from './gallery-index-builder';

describe('GalleryIndexBuilder', () => {
  let builder: GalleryIndexBuilder;

  beforeEach(() => {
    builder = new GalleryIndexBuilder();
  });

  const summaries: GallerySampleSummary[] = [
    {
      id: 'blog-api',
      name: 'Blog API',
      description: 'A <clean> layered app & friends',
      moduleCount: 12,
      cycleCount: 0,
    },
    {
      id: 'coupled-notifications',
      name: 'Coupled Notifications',
      description: 'Two services depend on each other',
      moduleCount: 8,
      cycleCount: 2,
    },
  ];

  it('links to each sample diagram, mermaid source, and explanation', () => {
    const html = builder.build(summaries);

    expect(html).toContain('href="./blog-api/diagram.html"');
    expect(html).toContain('href="./blog-api/diagram.mmd"');
    expect(html).toContain('href="./blog-api/explanation.md"');
    expect(html).toContain('href="./coupled-notifications/diagram.html"');
  });

  it('reports module and cycle counts per sample', () => {
    const html = builder.build(summaries);

    expect(html).toContain('12 module(s)');
    expect(html).toContain('no cycles');
    expect(html).toContain('8 module(s)');
    expect(html).toContain('2 cycles found');
  });

  it('escapes untrusted-looking description text', () => {
    const html = builder.build(summaries);

    expect(html).toContain('A &lt;clean&gt; layered app &amp; friends');
    expect(html).not.toContain('A <clean> layered app & friends');
  });

  it('renders a valid, self-contained document with no cards for an empty sample set', () => {
    const html = builder.build([]);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).not.toContain('<article');
  });
});
