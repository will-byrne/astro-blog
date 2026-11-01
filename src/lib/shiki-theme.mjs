// Shiki version of the Rouge colours the old site used for code, from its _sass/colors/syntax-dark.scss.
const TEXT = '#cdd6f4';
const MUTED = '#a6adc8';
const PURPLE = '#cba6f7';
const SKY = '#89dceb';
const YELLOW = '#f9e2af';
const PINK = '#eba0ac';
const GREEN = '#a6e3a1';
const PEACH = '#fab387';
const BLUE = '#89b4fa';

export default {
  name: 'chirpy-catppuccin',
  type: 'dark',
  colors: { 'editor.foreground': TEXT, 'editor.background': '#1e1e2e' },
  settings: [
    { settings: { foreground: TEXT } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: MUTED, fontStyle: 'italic' } },
    {
      scope: ['keyword', 'storage', 'support.type.primitive', 'keyword.operator.expression', 'keyword.operator.new'],
      settings: { foreground: PURPLE, fontStyle: 'bold' },
    },
    {
      scope: ['keyword.operator', 'storage.type.function.arrow', 'punctuation.definition.typeparameters'],
      settings: { foreground: SKY, fontStyle: 'bold' },
    },
    {
      scope: ['keyword.operator.expression', 'keyword.operator.new', 'keyword.operator.expression.keyof'],
      settings: { foreground: PURPLE, fontStyle: 'bold' },
    },
    { scope: ['constant.language', 'variable.language'], settings: { foreground: YELLOW, fontStyle: 'bold' } },
    { scope: ['constant.numeric'], settings: { foreground: PEACH, fontStyle: 'bold' } },
    { scope: ['string', 'punctuation.definition.string'], settings: { foreground: GREEN, fontStyle: 'bold' } },
    { scope: ['constant.character.escape'], settings: { foreground: '#f5c2e7', fontStyle: 'bold' } },
    {
      scope: ['variable', 'entity.name.type', 'meta.object-literal.key', 'support.variable', 'meta.definition.function entity.name.function'],
      settings: { foreground: PINK },
    },
    { scope: ['support.class', 'entity.name.class', 'support.type.builtin'], settings: { foreground: PINK, fontStyle: 'bold' } },
    { scope: ['entity.name.function', 'support.function', 'variable.function'], settings: { foreground: BLUE } },
    { scope: ['entity.name.tag'], settings: { foreground: TEXT, fontStyle: 'bold' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: TEXT } },
  ],
};
