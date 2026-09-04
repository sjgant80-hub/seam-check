#!/usr/bin/env node
// build-page.mjs — the page inlines the REAL gated kernels VERBATIM plus the generated
// shadow. Mechanical transforms only (strip export/import, escape </script). A FIXPOINT:
// same inputs, same bytes — CI diffs the rebuild.
import { readFileSync, writeFileSync } from 'node:fs';

const strip = (src, dropImports) => src
  .split('\n')
  .filter((l) => !(dropImports && /^import /.test(l)))
  .map((l) => l.replace(/^export (const|function)/, '$1'))
  .join('\n')
  .replace(/<\/script/g, '<\\/script');

const render = strip(readFileSync('render.mjs', 'utf8'), false);
const check = strip(readFileSync('check.mjs', 'utf8'), true);
const shadow = readFileSync('shadow.json', 'utf8').trim();

const splice = (page, tag, body) => {
  const a = '/*__' + tag + '_START__*/', b = '/*__' + tag + '_END__*/';
  const i = page.indexOf(a), j = page.indexOf(b);
  if (i < 0 || j < 0) { console.error('REFUSED: marker ' + tag + ' missing'); process.exit(1); }
  return page.slice(0, i + a.length) + '\n' + body + '\n' + page.slice(j);
};

let page = readFileSync('page.template.html', 'utf8');
page = splice(page, 'RENDER', render);
page = splice(page, 'CHECK', check);
page = splice(page, 'SHADOW', 'const SHADOW = ' + shadow + ';');
writeFileSync('index.html', page);
console.log('index.html — ' + page.length + ' bytes, kernels inlined verbatim + generated shadow');
