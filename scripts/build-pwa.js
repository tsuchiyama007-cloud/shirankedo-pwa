/**
 * PWA（ブラウザ版）を dist/ に書き出す。
 *  1. expo export --platform web
 *  2. public/ の PWA 用ファイル（manifest・Service Worker・アイコン）を dist/ にコピー
 *  3. Service Worker のキャッシュ名に今回のビルドの識別子を入れる（更新を確実に反映させるため）
 * 使い方：npm run build:pwa   （GitHub Pages 用は EXPO_BASE_URL=/リポジトリ名 を付ける）
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const pub = path.join(root, 'public');

fs.rmSync(dist, { recursive: true, force: true });
execSync('npx expo export --platform web', { cwd: root, stdio: 'inherit', env: { ...process.env, CI: '1' } });

for (const entry of fs.readdirSync(pub, { withFileTypes: true })) {
  if (entry.name === 'index.html') continue; // テンプレートは expo export が使う
  fs.cpSync(path.join(pub, entry.name), path.join(dist, entry.name), { recursive: true });
}

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const buildId = crypto.createHash('sha256').update(html).digest('hex').slice(0, 10);
const swPath = path.join(dist, 'sw.js');
fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace("const CACHE = 'shirankedo-v1';", `const CACHE = 'shirankedo-${buildId}';`));
// GitHub Pages で「_」から始まるフォルダ（_expo）を配信させるため
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log(`PWA を dist/ に書き出しました（キャッシュ: shirankedo-${buildId}）`);
