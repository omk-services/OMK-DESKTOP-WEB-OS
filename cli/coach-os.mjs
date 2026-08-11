// cli/coach-os.mjs
// Binaire `coach-os`. Reçoit argv, délégue à l'adaptateur CLI.
//
// Lancé en local : `node cli/coach-os.mjs tools list` ou, après
// `npm install -g .`, `coach-os tools list`. Le champ `bin` du
// package.json rend les deux équivalents sur Linux/macOS ; Windows
// crée `coach-os.cmd` via npm.

import { runCli } from '../dist/tooling/adapters/cli.js';

runCli({
  argv: process.argv,
  color: Boolean(process.stdout.isTTY),
}).then((result) => {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.code);
});
