// Single-file bundler for Memory Walk.
//
// Runs in the browser, served by the same dev server as the game. Reads the
// existing source files, decodes & rotates every photo through the same
// pipeline the runtime uses, then assembles one self-contained HTML file:
//
//   - Phaser library inlined (no CDN needed at view time)
//   - All src/*.js + style.css inlined
//   - All photos pre-rotated + downscaled to JPEG data URIs
//   - Both MP3s as audio/mpeg data URIs
//   - Tiny shim that redirects fetch('assets/...') and Audio.src to lookups
//     in window.__EMBEDDED. heic2any becomes a stub that throws the
//     "already browser readable" error the existing code knows to fall back
//     on, so .HEIC paths transparently use the pre-decoded JPEG bytes.
//   - One line zeroes the per-photo rotation overrides because rotation is
//     already baked in.

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

// Build artifacts live at ../ relative to tools/build.html.
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

async function fetchAsDataURI(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
  const blob = await r.blob();
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

// Find a top-level array literal that follows `static PHOTO_FILES =`.
// Bracket-counts, so it tolerates commas inside the entries without needing
// a full JS parser. Source is trusted (our own repo).
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

// Mirror of MainScene.rotateBitmapToCanvas — duplicated here so the build
// script does not require Phaser to load.
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

// Promise wrapper around canvas.toBlob → data URI. .toDataURL works too but
// is reportedly slower & more memory-hungry for large canvases.
function canvasToJpegDataURI(canvas, quality) {
  return new Promise((res, rej) => {
    canvas.toBlob((blob) => {
      if (!blob) return rej(new Error('toBlob returned null'));
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
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
      // fall through with original blob — file was already a JPEG misnamed .HEIC
    }
  }
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const canvas = rotateBitmapToCanvas(bitmap, rotate);
  const dataUri = await canvasToJpegDataURI(canvas, 0.85);
  // bitmap and canvas are GC'd; nothing else to release.
  return { dataUri, w: canvas.width, h: canvas.height };
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
  const mainSrc = await fetchText(ROOT + 'src/scenes/main.js');
  const PHOTO_FILES = extractPhotoFiles(mainSrc);
  log(`  found ${PHOTO_FILES.length} photos`);

  log('Decoding & embedding photos...');
  const EMBEDDED = {};
  let done = 0;
  let bytes = 0;
  const queue = PHOTO_FILES.slice();
  const concurrency = 4;
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const photo = queue.shift();
      try {
        const { dataUri, w, h } = await decodePhoto(photo);
        EMBEDDED[photo.path] = dataUri;
        bytes += dataUri.length;
        done++;
        log(`  [${done}/${PHOTO_FILES.length}] ${photo.path}  ${w}×${h}  ${Math.round(dataUri.length / 1024)} KB`);
      } catch (e) {
        log(`  [skip] ${photo.path}: ${e.message}`, 'err');
        done++;
      }
    }
  });
  await Promise.all(workers);
  log(`Photos: ${Object.keys(EMBEDDED).length}/${PHOTO_FILES.length}  ${(bytes / 1024 / 1024).toFixed(2)} MB`, 'ok');

  log('Embedding music...');
  for (const path of MUSIC_FILES) {
    const dataUri = await fetchAsDataURI(ROOT + path);
    EMBEDDED[path] = dataUri;
    log(`  ${path}  ${(dataUri.length / 1024 / 1024).toFixed(2)} MB`);
  }

  log('Reading source files...');
  const srcContents = {};
  for (const p of SCRIPTS) {
    srcContents[p] = await fetchText(ROOT + p);
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
  a.download = 'memory-walk.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  const dt = ((performance.now() - t0) / 1000).toFixed(1);
  log(`✓  Done in ${dt}s. Downloaded memory-walk.html (${sizeMB} MB)`, 'ok');
  document.getElementById('build').disabled = false;
}

function assembleHTML({ EMBEDDED, srcContents, css, phaserCode }) {
  // Runtime shim: redirects fetch + Audio.src for assets/*, stubs out
  // heic2any so the existing runtime fallback ("already browser readable")
  // kicks in for what are now actually JPEG bytes.
  const shim = String.raw`
(function () {
  const E = window.__EMBEDDED;
  const resolve = (p) => {
    if (typeof p !== 'string') return p;
    if (E[p]) return E[p];
    try {
      const dec = decodeURIComponent(p);
      if (E[dec]) return E[dec];
    } catch (e) {}
    return p;
  };
  const origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.indexOf('assets/') === 0) {
      return origFetch(resolve(input), init);
    }
    return origFetch(input, init);
  };
  const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  Object.defineProperty(HTMLMediaElement.prototype, 'src', {
    configurable: true,
    get() { return desc.get.call(this); },
    set(v) { desc.set.call(this, typeof v === 'string' ? resolve(v) : v); },
  });
  // Stub: every .HEIC path is now backed by a pre-decoded JPEG. The runtime's
  // existing catch handler recognises the message and falls back to the
  // blob it already has, which is exactly what we want.
  window.heic2any = async () => {
    const err = new Error('ERR_USER Image is already browser readable');
    err.code = 1;
    throw err;
  };
})();
`.trim();

  // Embedded asset map. Keys are paths, values are data URIs. Stored inside
  // a <script type="application/json"> tag because JSON.parse handles a
  // 20-MB blob orders of magnitude faster than a giant JS object literal.
  const embeddedJSON = JSON.stringify(EMBEDDED).replace(/<\/script/gi, '<\\/script');

  // Defang any "</script" inside the JS itself. Defensive — none of these
  // files contain it today, but it's cheap insurance against future strings
  // that would break the closing-tag boundary.
  const safeTag = (p) => {
    const safe = srcContents[p].replace(/<\/script/gi, '<\\/script');
    return `<!-- ${p} -->\n<script>\n${safe}\n</script>`;
  };

  // Tiny post-loader runs after main.js defines MainScene, before config.js
  // boots the game. Zeroes the per-photo rotation overrides because rotation
  // is already baked into the embedded JPEGs.
  const rotateReset = `
(function () {
  if (typeof MainScene !== 'undefined' && MainScene.PHOTO_FILES) {
    MainScene.PHOTO_FILES.forEach((p) => { p.rotate = 0; });
  }
})();
`.trim();

  // Order matters: everything except config.js, then rotateReset, then config.js
  // (which boots the game).
  const scripts = SCRIPTS.slice(0, -1).map(safeTag).join('\n\n');
  const boot = safeTag('src/config.js');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
<meta name="theme-color" content="#0a0a0f" />
<title>Memory Walk</title>
<style>
${css}
</style>
</head>
<body>
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

<!-- Embedded asset map (photos + music) -->
<script id="embedded-assets" type="application/json">${embeddedJSON}</script>

<!-- Runtime shim: redirect assets/* fetches + Audio.src to the embedded map -->
<script>
window.__EMBEDDED = JSON.parse(document.getElementById('embedded-assets').textContent);
${shim}
</script>

<!-- Phaser 3.80.1 (inlined from CDN at build time) -->
<script>
${phaserCode}
</script>

${scripts}

<!-- Rotation reset: photos are pre-rotated, so the runtime should not rotate them again. -->
<script>
${rotateReset}
</script>

${boot}

</body>
</html>`;
}
