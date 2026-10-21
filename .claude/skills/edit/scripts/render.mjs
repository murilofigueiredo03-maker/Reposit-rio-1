#!/usr/bin/env node
// Renderiza uma cena HTML (timeline GSAP pausada) quadro a quadro para MP4.
//
// Uso:
//   node render.mjs cena.html saida.mp4 [--fps 30] [--width 1920] [--height 1080]
//                   [--audio narracao.wav] [--audio-offset 4.2] [--duration 12.5] [--crf 18] [--jpeg]
//   --alpha: fundo transparente → saída .mov ProRes 4444 (para sobrepor em outro vídeo)
//   --audio-offset: segundo da cena em que o áudio começa (use o mesmo --offset do lipsync.py)
//   node render.mjs cena.html --frames 0,1.5,3 [--outdir previews]   (só PNGs de prévia)
//
// A página precisa expor:
//   window.__duration  (segundos)   e   window.__seek(t)  (posiciona tudo no tempo t)
// ou simplesmente window.__timeline (timeline GSAP) — o script usa .duration()/.seek().

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function loadPlaywright() {
  const tries = [path.join(here, '..', 'package.json'), path.join(process.cwd(), 'package.json')];
  for (const p of tries) {
    try { return createRequire(p)('playwright'); } catch {}
  }
  try {
    const globalRoot = execSync('npm root -g').toString().trim();
    return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
  } catch {}
  console.error('Playwright não encontrado. Rode: npm install --prefix ' + path.join(here, '..'));
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { fps: 30, width: 1920, height: 1080, crf: 18, jpeg: false, outdir: 'previews' };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const key = a.slice(2);
    if (key === 'jpeg' || key === 'alpha') { opts[key] = true; continue; }
    opts[key] = argv[++i];
  }
  ['fps', 'width', 'height', 'crf'].forEach(k => (opts[k] = Number(opts[k])));
  if (opts.duration) opts.duration = Number(opts.duration);
  opts.html = pos[0];
  opts.out = pos[1];
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.html || (!opts.out && !opts.frames)) {
  console.error('Uso: node render.mjs cena.html saida.mp4 [--fps 30] [--audio a.wav] | --frames 0,1.5');
  process.exit(1);
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ args: ['--disable-web-security', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[página] erro:', e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_FILE_NOT_FOUND')) console.error('[página]', m.text()); });
page.on('requestfailed', r => { if (!r.url().endsWith('lipsync.js')) console.error('[página] arquivo não carregou:', r.url()); });

await page.goto(pathToFileURL(path.resolve(opts.html)).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForFunction(() => window.__seek || window.__timeline, null, { timeout: 15000 });

// Desliga o relógio do GSAP para que nada avance sozinho entre quadros.
await page.evaluate(() => {
  if (window.gsap) { gsap.ticker.lagSmoothing(0); gsap.globalTimeline.pause(); }
  if (!window.__seek) window.__seek = t => window.__timeline.seek(t, false);
  if (window.__duration == null && window.__timeline) window.__duration = window.__timeline.duration();
  document.getAnimations?.().forEach(a => a.pause());
});

const seek = t => page.evaluate(t => {
  window.__seek(t);
  document.getAnimations?.().forEach(a => (a.currentTime = t * 1000));
}, t);

if (opts.frames) {
  fs.mkdirSync(opts.outdir, { recursive: true });
  for (const t of String(opts.frames).split(',').map(Number)) {
    await seek(t);
    const file = path.join(opts.outdir, `frame_${t.toFixed(2)}s.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
  process.exit(0);
}

const duration = opts.duration ?? (await page.evaluate(() => window.__duration));
if (!duration || !isFinite(duration)) {
  console.error('Duração inválida (' + duration + '). Defina window.__duration ou use --duration. Repetições infinitas (repeat:-1) não são permitidas.');
  process.exit(1);
}
const total = Math.round(duration * opts.fps);
console.log(`Renderizando ${total} quadros (${duration.toFixed(2)}s @ ${opts.fps}fps, ${opts.width}x${opts.height})`);

const ffArgs = ['-y', '-f', 'image2pipe', '-framerate', String(opts.fps), '-i', '-'];
if (opts.audio) ffArgs.push('-i', opts.audio);
if (opts.audio) {
  // atrasa o áudio até o offset e completa com silêncio até o fim do vídeo
  const ms = Math.round(Number(opts['audio-offset'] || 0) * 1000);
  ffArgs.push('-filter_complex', `[1:a]adelay=${ms}:all=1,apad[a]`, '-map', '0:v', '-map', '[a]',
    '-c:a', 'aac', '-b:a', '192k');
} else ffArgs.push('-map', '0:v');
ffArgs.push('-t', String(total / opts.fps));
if (opts.alpha) ffArgs.push('-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', opts.out);
else ffArgs.push('-c:v', 'libx264', '-preset', 'medium', '-crf', String(opts.crf),
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', opts.out);

const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
let ffErr = '';
ff.stderr.on('data', d => (ffErr += d));
let ffClosed = false;
const done = new Promise(res => ff.on('close', c => { ffClosed = true; res(c); }));
ff.stdin.on('error', () => {});

const t0 = Date.now();
for (let i = 0; i < total; i++) {
  await seek(i / opts.fps);
  const buf = await page.screenshot(opts.alpha ? { type: 'png', omitBackground: true }
    : opts.jpeg ? { type: 'jpeg', quality: 95 } : { type: 'png' });
  if (ffClosed) break;
  if (!ff.stdin.write(buf)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), done]);
  if (i % opts.fps === 0) process.stdout.write(`\r  ${i}/${total} quadros`);
}
ff.stdin.end();
const code = await done;
await browser.close();
if (code !== 0) { console.error('\nffmpeg falhou:\n' + ffErr.slice(-2000)); process.exit(1); }
console.log(`\r  ${total}/${total} quadros — pronto em ${((Date.now() - t0) / 1000).toFixed(1)}s → ${opts.out}`);
