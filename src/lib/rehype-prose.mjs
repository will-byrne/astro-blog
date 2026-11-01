// Adds the extras rendered Markdown needs: labelled code blocks, heading anchors and scrollable tables.

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

const LANGUAGE_LABELS = {
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  ts: 'TypeScript',
  js: 'JavaScript',
  scss: 'SCSS',
  yaml: 'YAML',
  plaintext: 'Text',
};

function codeBlock(pre) {
  const language = pre.properties.dataLanguage ?? 'plaintext';
  const label = LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);
  // The stylesheet sets the code block background
  delete pre.properties.style;

  return el('figure', { className: ['code-block'] }, [
    el('figcaption', {}, [
      el('span', {}, [text(label)]),
      el('button', { type: 'button', className: ['copy-button'] }, [text('Copy')]),
    ]),
    pre,
  ]);
}

function transform(parent) {
  parent.children = (parent.children ?? []).map((node) => {
    if (node.type !== 'element') return node;

    if (node.tagName === 'pre') return codeBlock(node);

    transform(node);

    if (/^h[1-4]$/.test(node.tagName) && node.properties.id) {
      node.children.push(el('a', { href: `#${node.properties.id}`, className: ['anchor'], ariaLabel: 'Link to this section' }));
    }

    if (node.tagName === 'table') return el('div', { className: ['table-scroll'], tabindex: '0' }, [node]);

    return node;
  });
}

export default function rehypeProse() {
  return (tree) => transform(tree);
}
