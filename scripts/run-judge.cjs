'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const judgeRoot = process.env.CISUS_JUDGE_ROOT
  ? path.resolve(process.env.CISUS_JUDGE_ROOT)
  : path.resolve(root, '..', 'Juez');
const runner = path.join(judgeRoot, 'scripts', 'portable-juez.cjs');
const args = process.argv.slice(2);
let validArgs = true;
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--no-write') continue;
  if (args[index] === '--profile' && args[index + 1] && !args[index + 1].startsWith('--')) {
    index += 1;
    continue;
  }
  validArgs = false;
  break;
}

if (!validArgs) {
  console.error('Uso: npm run verify -- [--profile nombre] [--no-write]. La raíz está fijada a Cisus.');
  process.exitCode = 1;
} else if (!fs.existsSync(runner)) {
  console.error('No se encontró Juez. Define CISUS_JUDGE_ROOT con la ruta del motor instalado (ver quality/README.md).');
  process.exitCode = 1;
} else {
  process.exitCode = require(runner).main(['--root', root, ...args]);
}
