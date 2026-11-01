// Reshapes rendered Markdown into the HTML structure the Chirpy stylesheet expects.

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });
const icon = (className) => el('i', { className });

const LANGUAGE_LABELS = {
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  ts: 'TypeScript',
  js: 'JavaScript',
  scss: 'SCSS',
  yaml: 'YAML',
  plaintext: 'Plaintext',
};

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

function codeBlock(pre) {
  const language = pre.properties.dataLanguage ?? 'plaintext';
  const code = pre.children.find((child) => child.tagName === 'code') ?? pre;
  const lineCount = textOf(code).replace(/\n$/, '').split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => `${i + 1}\n`).join('');
  const label = LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);

  return el('div', { className: [`language-${language}`, 'highlighter-rouge'] }, [
    el('div', { className: ['code-header'] }, [
      el('span', { dataLabelText: label }, [icon(['fas', 'fa-code', 'fa-fw', 'small'])]),
      el('button', { ariaLabel: 'copy', dataTitleSucceed: 'Copied!' }, [icon(['far', 'fa-clipboard'])]),
    ]),
    el('div', { className: ['highlight'] }, [
      el('code', {}, [
        el('table', { className: ['rouge-table'] }, [
          el('tbody', {}, [
            el('tr', {}, [
              el('td', { className: ['rouge-gutter', 'gl'] }, [el('pre', { className: ['lineno'] }, [text(lineNumbers)])]),
              el('td', { className: ['rouge-code'] }, [el('pre', {}, code.children)]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]);
}

function transform(parent) {
  parent.children = (parent.children ?? []).map((node) => {
    if (node.type !== 'element') return node;

    if (node.tagName === 'pre') return codeBlock(node);

    if (node.tagName === 'code') {
      node.properties.className = ['language-plaintext', 'highlighter-rouge'];
      return node;
    }

    if (node.tagName === 'img') {
      node.properties.loading = 'lazy';
      return el('a', { href: node.properties.src, className: ['popup', 'img-link'] }, [node]);
    }

    transform(node);

    if (/^h[2-5]$/.test(node.tagName) && node.properties.id) {
      node.children = [
        el('span', { className: ['me-2'] }, node.children),
        el('a', { href: `#${node.properties.id}`, className: ['anchor', 'text-muted'] }, [icon(['fas', 'fa-hashtag'])]),
      ];
    }

    if (node.tagName === 'table') return el('div', { className: ['table-wrapper'] }, [node]);

    return node;
  });
}

export default function rehypeChirpy() {
  return (tree) => transform(tree);
}
