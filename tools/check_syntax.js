// Extracts every <script id="js-..."> block from app/raiz_dst.html and
// syntax-checks each with `node --check`, plus app/sw.js.
// Usage:  node tools/check_syntax.js
// Exit code 0 = all blocks parse; 1 = at least one syntax error.
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const appPath = path.join(__dirname, '..', 'app', 'raiz_dst.html');
const html = fs.readFileSync(appPath, 'utf8');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'raiz-blocks-'));
const re = /<script id="(js-[\w-]+)">([\s\S]*?)<\/script>/g;

let n = 0, fails = 0, m;
function check(name, code) {
  n++;
  const f = path.join(tmp, name + '.js');
  fs.writeFileSync(f, code);
  const r = cp.spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    fails++;
    console.error(`SYNTAX FAIL in block "${name}":\n${r.stderr}`);
  }
}

while ((m = re.exec(html)) !== null) check(m[1], m[2]);
check('sw', fs.readFileSync(path.join(__dirname, '..', 'app', 'sw.js'), 'utf8'));

console.log(`${n} script blocks checked — ${fails ? fails + ' FAILURE(S)' : 'all OK'}`);
process.exit(fails ? 1 : 0);
