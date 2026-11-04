import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import rehypeProse from '../../src/lib/rehype-prose.mjs';

// Shiki marks code blocks with data-language; plain remark does not, so code blocks are built by hand
const pre = (properties: Record<string, unknown>) => ({
  type: 'element',
  tagName: 'pre',
  properties,
  children: [{ type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: 'echo hi' }] }],
});

function transformTree(children: unknown[]) {
  const tree = { type: 'root', children };
  rehypeProse()(tree);
  return tree.children as any[];
}

async function render(markdown: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHeadingIds)
    .use(rehypeProse)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}

describe('code blocks', () => {
  it('wraps the block in a figure with a caption and a copy button', () => {
    const [figure] = transformTree([pre({ dataLanguage: 'js' })]);
    expect(figure.tagName).toBe('figure');
    expect(figure.properties.className).toEqual(['code-block']);

    const [caption, block] = figure.children;
    expect(caption.tagName).toBe('figcaption');
    expect(caption.children[0].children[0].value).toBe('JavaScript');
    expect(caption.children[1]).toMatchObject({ tagName: 'button', properties: { type: 'button', className: ['copy-button'] } });
    expect(block.tagName).toBe('pre');
  });

  it.each([
    ['bash', 'Shell'],
    ['sh', 'Shell'],
    ['shell', 'Shell'],
    ['ts', 'TypeScript'],
    ['scss', 'SCSS'],
    ['yaml', 'YAML'],
    ['plaintext', 'Text'],
    ['python', 'Python'],
    ['nix', 'Nix'],
  ])('labels %s as %s', (language, label) => {
    const [figure] = transformTree([pre({ dataLanguage: language })]);
    expect(figure.children[0].children[0].children[0].value).toBe(label);
  });

  it('labels a block with no language as Text', () => {
    const [figure] = transformTree([pre({})]);
    expect(figure.children[0].children[0].children[0].value).toBe('Text');
  });

  it("removes Shiki's inline style so the stylesheet sets the background", () => {
    const [figure] = transformTree([pre({ dataLanguage: 'js', style: 'background-color:#000' })]);
    expect(figure.children[1].properties.style).toBeUndefined();
  });

  it('finds code blocks nested inside other elements', () => {
    const [section] = transformTree([{ type: 'element', tagName: 'section', properties: {}, children: [pre({ dataLanguage: 'ts' })] }]);
    expect(section.children[0].tagName).toBe('figure');
  });
});

describe('headings', () => {
  it('adds a link to h1 to h4', async () => {
    const html = await render('# One\n\n## Two\n\n### Three\n\n#### Four');
    for (const [level, id] of [[1, 'one'], [2, 'two'], [3, 'three'], [4, 'four']]) {
      expect(html).toContain(`<h${level} id="${id}">`);
      expect(html).toContain(`<a href="#${id}" class="anchor" aria-label="Link to this section"></a></h${level}>`);
    }
  });

  it('leaves h5 and h6 alone', async () => {
    const html = await render('##### Five\n\n###### Six');
    expect(html).not.toContain('class="anchor"');
  });

  it('skips headings without an id', () => {
    const [heading] = transformTree([{ type: 'element', tagName: 'h2', properties: {}, children: [{ type: 'text', value: 'x' }] }]);
    expect(heading.children).toHaveLength(1);
  });
});

describe('tables', () => {
  it('wraps tables in a scroll box that can be focused with the keyboard', () => {
    const [wrapper] = transformTree([{ type: 'element', tagName: 'table', properties: {}, children: [] }]);
    expect(wrapper).toMatchObject({ tagName: 'div', properties: { className: ['table-scroll'], tabindex: '0' } });
    expect(wrapper.children[0].tagName).toBe('table');
  });
});

describe('other content', () => {
  it('leaves paragraphs and text untouched', async () => {
    expect(await render('Just *text*.')).toBe('<p>Just <em>text</em>.</p>');
  });
});
