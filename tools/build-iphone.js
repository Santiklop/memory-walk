// iPhone-targeted single-file bundler.
//
// Same shape as build.js, with these differences (each one specifically there
// because the desktop bundle was failing on iPhone Safari):
//
//   • No runtime fetch shim. iOS Safari (older versions) chokes on the
//     defineProperty(HTMLMediaElement.prototype, 'src') override, which kills
//     the boot before Phaser starts. We avoid the problem by rewriting paths
//     to embedded data URIs at build time:
//       - intro.js's `audio.src = 'assets/music/...'` lines get replaced with
//         `audio.src = window.__EMBEDDED['assets/music/...']`.
//       - At runtime, right after MainScene loads but before the game boots,
//         we mutate MainScene.PHOTO_FILES[i].path to point at the embedded
//         data URI. The existing `fetch(path)` then runs against a `data:`
//         URL, which every browser handles natively. No shim needed.
//   • No heic2any stub. The `.heic` extension check in loadOnePhoto never
//     matches a data URI, so the HEIC branch is dead code in this bundle.
//   • Visible error banner. Any uncaught exception or unhandled promise
//     rejection renders as a red strip at the top of the page, so a tester
//     on an iPhone can read what failed and tell us.
//   • Portrait-orientation overlay. Pure CSS — the game is 1024×640
//     landscape, unplayable in portrait, so we cover the canvas with a
//     "rotate to landscape" prompt when @media (orientation: portrait).
//   • Leningrad trimmed. The game only plays seconds 24–44 (20 s) of the
//     6.8 MB MP3. We decode it via Web Audio and re-encode the clip as a
//     20 s WAV (~3.5 MB), then rewrite the start/end timestamps in
//     main.js so currentTime semantics still work with the shorter file.

const SCRIPTS = [
  'src/touch.js',
  'src/milestones.js',
  'src/palette.js',
  'src/background.js',
  'src/character.js',
  'src/photoFrame.js',
  'src/jumpButton.js',
  'src/obstacles.js',
  'src/scenes/intro.js',
  'src/scenes/main.js',
  'src/config.js',
];

const PHASER_URL = 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js';
const MUSIC_FILES = [
  'assets/music/Background song.mp3',
  'assets/music/Leningrad.mp3',
];

// Trim window for Leningrad. The game plays original-time 24→44; we keep that
// audio range, re-encode as WAV starting at t=0, and rewrite main.js to seek
// to currentTime=0 and stop at currentTime >= 20.
const LENINGRAD_START = 24;
const LENINGRAD_END = 44;

const ROOT = '../';

const logEl = () => document.getElementById('log');
function log(msg, cls) {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  logEl().appendChild(line);
  logEl().scrollTop = logEl().scrollHeight;
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
  return r.text();
}

async function fetchBlob(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
  return r.blob();
}

function blobToDataURI(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

function extractPhotoFiles(src) {
  const i = src.indexOf('static PHOTO_FILES');
  if (i < 0) throw new Error('PHOTO_FILES not found in main.js');
  const start = src.indexOf('[', i);
  if (start < 0) throw new Error('PHOTO_FILES literal missing');
  let depth = 0;
  for (let j = start; j < src.length; j++) {
    if (src[j] === '[') depth++;
    else if (src[j] === ']') {
      depth--;
      if (depth === 0) {
        const literal = src.substring(start, j + 1);
        // eslint-disable-next-line no-new-func
        return Function('return ' + literal)();
      }
    }
  }
  throw new Error('PHOTO_FILES literal not terminated');
}

function rotateBitmapToCanvas(bitmap, rotateDeg, maxDim = 600) {
  const r = ((rotateDeg % 360) + 360) % 360;
  const swap = (r === 90 || r === 270);
  const finalW = swap ? bitmap.height : bitmap.width;
  const finalH = swap ? bitmap.width : bitmap.height;
  const scale = Math.min(1, maxDim / Math.max(finalW, finalH));
  const c = document.createElement('canvas');
  c.width = Math.round(finalW * scale);
  c.height = Math.round(finalH * scale);
  const ctx = c.getContext('2d');
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(r * Math.PI / 180);
  const dw = bitmap.width * scale;
  const dh = bitmap.height * scale;
  ctx.drawImage(bitmap, -dw / 2, -dh / 2, dw, dh);
  return c;
}

function canvasToJpegDataURI(canvas, quality) {
  return new Promise((res, rej) => {
    canvas.toBlob((blob) => {
      if (!blob) return rej(new Error('toBlob returned null'));
      blobToDataURI(blob).then(res, rej);
    }, 'image/jpeg', quality);
  });
}

async function decodePhoto({ path, rotate }) {
  const res = await fetch(ROOT + path);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  let blob = await res.blob();
  if (/\.heic$/i.test(path)) {
    try {
      const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.92 });
      blob = Array.isArray(converted) ? converted[0] : converted;
    } catch (e) {
      const msg = (e && (e.message || e.code)) || '';
      if (!/already browser readable/i.test(msg)) throw e;
    }
  }
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const canvas = rotateBitmapToCanvas(bitmap, rotate);
  const dataUri = await canvasToJpegDataURI(canvas, 0.85);
  return { dataUri, w: canvas.width, h: canvas.height };
}

// Decode an MP3 blob, slice [startSec, endSec), re-encode as 16-bit PCM WAV.
// Pure Web Audio + DataView — no library deps.
async function trimAudioToWav(blob, startSec, endSec) {
  const arrayBuf = await blob.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ac = new Ctx();
  // decodeAudioData in older Safari only supports callback-style. Try both.
  const audioBuf = await new Promise((res, rej) => {
    try {
      const p = ac.decodeAudioData(arrayBuf.slice(0), res, rej);
      if (p && p.then) p.then(res, rej);
    } catch (e) { rej(e); }
  });
  try { ac.close(); } catch (e) {}

  const sampleRate = audioBuf.sampleRate;
  const numChannels = audioBuf.numberOfChannels;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(audioBuf.length, Math.floor(endSec * sampleRate));
  const numSamples = endSample - startSample;

  // Per-channel float views into the trimmed window.
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuf.getChannelData(c).subarray(startSample, endSample));
  }

  // 16-bit PCM WAV.
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numSamples * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  let p = 0;
  const writeStr = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); };
  const writeU32 = (v) => { view.setUint32(p, v, true); p += 4; };
  const writeU16 = (v) => { view.setUint16(p, v, true); p += 2; };
  writeStr('RIFF');
  writeU32(36 + dataSize);
  writeStr('WAVE');
  writeStr('fmt ');
  writeU32(16);                          // fmt chunk size
  writeU16(1);                           // PCM
  writeU16(numChannels);
  writeU32(sampleRate);
  writeU32(sampleRate * blockAlign);     // byte rate
  writeU16(blockAlign);
  writeU16(16);                          // bits/sample
  writeStr('data');
  writeU32(dataSize);
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = channels[c][i];
      if (s > 1) s = 1; else if (s < -1) s = -1;
      view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      p += 2;
    }
  }
  return new Blob([buf], { type: 'audio/wav' });
}

// --- source rewriters ---

// In intro.js: audio.src = 'assets/music/Background%20song.mp3';  →
//              audio.src = window.__EMBEDDED["assets/music/Background song.mp3"];
function rewriteIntroAudioSrc(src) {
  return src.replace(
    /(audio|len)\.src\s*=\s*'(assets\/music\/[^']+)'\s*;/g,
    (_m, lhs, encoded) => {
      const decoded = decodeURIComponent(encoded);
      return `${lhs}.src = window.__EMBEDDED[${JSON.stringify(decoded)}];`;
    }
  );
}

// In main.js: rewrite the two Leningrad timestamps to match the trimmed clip.
//   len.currentTime = 24       →  len.currentTime = 0
//   if (len.currentTime >= 44) →  if (len.currentTime >= (44 - 24))
function rewriteMainLeningradTimes(src) {
  const seekFrom = `len.currentTime = ${LENINGRAD_START};`;
  const seekTo = `len.currentTime = 0;`;
  const stopFrom = `if (len.currentTime >= ${LENINGRAD_END})`;
  const stopTo = `if (len.currentTime >= ${LENINGRAD_END - LENINGRAD_START})`;
  if (!src.includes(seekFrom)) throw new Error('Could not find Leningrad seek line in main.js: ' + seekFrom);
  if (!src.includes(stopFrom)) throw new Error('Could not find Leningrad stop line in main.js: ' + stopFrom);
  return src.replace(seekFrom, seekTo).replace(stopFrom, stopTo);
}

document.getElementById('build').addEventListener('click', () => build().catch((e) => {
  log('BUILD FAILED: ' + (e.message || e), 'err');
  console.error(e);
  document.getElementById('build').disabled = false;
}));

async function build() {
  document.getElementById('build').disabled = true;
  logEl().textContent = '';
  const t0 = performance.now();

  log('Reading main.js to extract photo list...');
  const mainSrcRaw = await fetchText(ROOT + 'src/scenes/main.js');
  const PHOTO_FILES = extractPhotoFiles(mainSrcRaw);
  log(`  found ${PHOTO_FILES.length} photos`);

  log('Decoding & embedding photos...');
  const EMBEDDED = {};
  let done = 0;
  let photoBytes = 0;
  const queue = PHOTO_FILES.slice();
  const concurrency = 4;
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const photo = queue.shift();
      try {
        const { dataUri, w, h } = await decodePhoto(photo);
        EMBEDDED[photo.path] = dataUri;
        photoBytes += dataUri.length;
        done++;
        log(`  [${done}/${PHOTO_FILES.length}] ${photo.path}  ${w}×${h}  ${Math.round(dataUri.length / 1024)} KB`);
      } catch (e) {
        log(`  [skip] ${photo.path}: ${e.message}`, 'err');
        done++;
      }
    }
  });
  await Promise.all(workers);
  log(`Photos: ${Object.keys(EMBEDDED).length}/${PHOTO_FILES.length}  ${(photoBytes / 1024 / 1024).toFixed(2)} MB`, 'ok');

  log('Embedding background music (full track)...');
  const bgBlob = await fetchBlob(ROOT + 'assets/music/Background song.mp3');
  const bgUri = await blobToDataURI(bgBlob);
  EMBEDDED['assets/music/Background song.mp3'] = bgUri;
  log(`  Background song.mp3  ${(bgUri.length / 1024 / 1024).toFixed(2)} MB`);

  log(`Trimming Leningrad to ${LENINGRAD_START}..${LENINGRAD_END}s as WAV...`);
  const lenBlob = await fetchBlob(ROOT + 'assets/music/Leningrad.mp3');
  const lenWav = await trimAudioToWav(lenBlob, LENINGRAD_START, LENINGRAD_END);
  const lenUri = await blobToDataURI(lenWav);
  EMBEDDED['assets/music/Leningrad.mp3'] = lenUri;
  log(`  Leningrad clip  ${(lenUri.length / 1024 / 1024).toFixed(2)} MB  (originally 8.6 MB base64)`, 'ok');

  log('Reading + rewriting source files...');
  const srcContents = {};
  for (const p of SCRIPTS) {
    let text = await fetchText(ROOT + p);
    if (p === 'src/scenes/intro.js') {
      const before = text;
      text = rewriteIntroAudioSrc(text);
      if (text === before) throw new Error('intro.js audio.src rewrite produced no change');
      log('  rewrote intro.js audio paths', 'dim');
    }
    if (p === 'src/scenes/main.js') {
      text = rewriteMainLeningradTimes(text);
      log('  rewrote main.js Leningrad timestamps to 0..20', 'dim');
    }
    srcContents[p] = text;
  }
  const css = await fetchText(ROOT + 'style.css');

  log('Fetching Phaser library from CDN...');
  const phaserCode = await fetchText(PHASER_URL);
  log(`  phaser.min.js  ${(phaserCode.length / 1024).toFixed(0)} KB`);

  log('Assembling output...');
  const output = assembleHTML({ EMBEDDED, srcContents, css, phaserCode });
  const sizeMB = (output.length / 1024 / 1024).toFixed(2);
  log(`Output size: ${sizeMB} MB`, 'ok');

  const blob = new Blob([output], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'memory-walk-iphone.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  const dt = ((performance.now() - t0) / 1000).toFixed(1);
  log(`✓  Done in ${dt}s. Downloaded memory-walk-iphone.html (${sizeMB} MB)`, 'ok');
  document.getElementById('build').disabled = false;
}

function assembleHTML({ EMBEDDED, srcContents, css, phaserCode }) {
  // Embedded asset map. Parsing lazily via JSON.parse is much faster on mobile
  // than evaluating a giant JS object literal.
  const embeddedJSON = JSON.stringify(EMBEDDED).replace(/<\/script/gi, '<\\/script');

  const safeTag = (p) => {
    const safe = srcContents[p].replace(/<\/script/gi, '<\\/script');
    return `<!-- ${p} -->\n<script>\n${safe}\n</script>`;
  };

  // After main.js loads but before config.js boots: zero out per-photo
  // rotation overrides (rotation is baked in) and swap each PHOTO_FILES.path
  // for its embedded data URI. The runtime's existing fetch(path) call then
  // resolves natively — no shim required.
  const postLoader = `
(function () {
  try {
    if (typeof MainScene !== 'undefined' && MainScene.PHOTO_FILES) {
      var E = window.__EMBEDDED;
      MainScene.PHOTO_FILES.forEach(function (p) {
        p.rotate = 0;
        if (E && E[p.path]) p.path = E[p.path];
      });
    }
  } catch (e) {
    var b = document.getElementById('error-banner');
    if (b) { b.style.display = 'block'; b.textContent = 'post-loader: ' + (e.message || e); }
  }
})();
`.trim();

  const scripts = SCRIPTS.slice(0, -1).map(safeTag).join('\n\n');
  const boot = safeTag('src/config.js');

  // Page chrome: error banner + portrait overlay. Both are pure CSS/HTML.
  // The error banner is wired up by a tiny inline script before anything
  // else, so even a parse error in the first source block can be surfaced.
  const pageChrome = `
<div id="error-banner"></div>
<div id="portrait-warn">Please rotate your phone<br/>to landscape</div>
`.trim();

  const errorWiring = `
(function () {
  var b = document.getElementById('error-banner');
  function show(msg) {
    if (!b) return;
    b.style.display = 'block';
    b.textContent = (b.textContent ? b.textContent + '\\n\\n' : '') + msg;
  }
  window.addEventListener('error', function (e) {
    show('ERROR: ' + (e.message || e) + '  @  ' + (e.filename || '?') + ':' + (e.lineno || '?'));
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason || {};
    show('PROMISE REJECTED: ' + (r.message || r));
  });
})();
`.trim();

  const iphoneCss = `
#error-banner {
  position: fixed; top: 0; left: 0; right: 0;
  background: #C83327; color: white;
  font-family: ui-monospace, Consolas, monospace; font-size: 12px;
  padding: 10px 14px; z-index: 10000;
  display: none; white-space: pre-wrap;
  max-height: 50vh; overflow-y: auto;
  border-bottom: 2px solid #6A1A12;
}
#portrait-warn {
  display: none;
  position: fixed; inset: 0;
  background: #2A1C3F;
  color: #FFD86B;
  font-family: Georgia, serif; font-style: italic;
  font-size: 28px; line-height: 1.4;
  text-align: center;
  align-items: center; justify-content: center;
  z-index: 9999;
  padding: 24px;
}
@media (orientation: portrait) {
  #portrait-warn { display: flex; }
}
`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
<meta name="theme-color" content="#0a0a0f" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<title>Memory Walk</title>
<style>
${css}

${iphoneCss}
</style>
</head>
<body>

${pageChrome}

<script>
${errorWiring}
</script>

<div id="game-container"></div>
<div id="hint">← → to move · SPACE to jump</div>

<div id="touch-controls">
  <div class="tc-group tc-left">
    <button id="btn-left" class="tbtn" aria-label="Move left">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M15 5 L7 12 L15 19" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button id="btn-right" class="tbtn" aria-label="Move right">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M9 5 L17 12 L9 19" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  <div class="tc-group tc-right">
    <button id="btn-jump" class="tbtn jump" aria-label="Jump">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M12 5 L12 19 M5 12 L12 5 L19 12" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div>

<!-- Embedded asset map (photos + music). Decoded via JSON.parse so the
     browser can stream the bytes without evaluating them as JS. -->
<script id="embedded-assets" type="application/json">${embeddedJSON}</script>

<script>
try {
  window.__EMBEDDED = JSON.parse(document.getElementById('embedded-assets').textContent);
} catch (e) {
  var b = document.getElementById('error-banner');
  if (b) { b.style.display = 'block'; b.textContent = 'JSON.parse: ' + (e.message || e); }
  throw e;
}
</script>

<!-- Phaser 3.80.1 (inlined from CDN at build time) -->
<script>
${phaserCode}
</script>

${scripts}

<!-- Path rewiring: swap PHOTO_FILES.path → embedded data URIs and zero out
     per-photo rotation. Audio paths in intro.js were already rewired at
     build time, so this is the only runtime mutation we do. -->
<script>
${postLoader}
</script>

${boot}

</body>
</html>`;
}
