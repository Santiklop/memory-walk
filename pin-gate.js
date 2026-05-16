// PIN gate for the hosted GitHub Pages build.
//
// Cosmetic protection — the hash below is in plain page source, so anyone who
// reads the JS could brute-force a 4-digit PIN in milliseconds. Sufficient
// for "don't show Katya's photos to a stranger who stumbles on the URL";
// not sufficient against a determined attacker. See docs in this repo for
// the encryption alternative if you ever need real security.
//
// On unlock: remembers via localStorage, fades out the overlay, then
// injects src/config.js (which boots Phaser). The game and its photos
// never start loading until the gate clears.

(function () {
  // SHA-256 hex of the PIN. Comparing hashes rather than literal strings
  // means a casual viewer of source can't read the PIN at a glance.
  const PIN_HASH = '9c93522c01b6a1b55b7c5266b2a30f370ab84c4c53c39bdff5732fc565413494';
  const STORAGE_KEY = '__memwalk_unlocked_v1';

  async function sha256Hex(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function bootGame() {
    // Belt-and-braces: if we somehow get called twice, only inject once.
    if (window.__memwalkBooting) return;
    window.__memwalkBooting = true;
    const s = document.createElement('script');
    s.src = 'src/config.js';
    document.body.appendChild(s);
  }

  function unlock() {
    const gate = document.getElementById('pin-gate');
    if (gate) {
      gate.classList.add('is-unlocked');
      // Match the CSS transition duration. After this, the overlay is
      // removed so it can't interfere with input on the game canvas.
      setTimeout(() => { if (gate.parentNode) gate.parentNode.removeChild(gate); }, 600);
    }
    bootGame();
  }

  function shake() {
    const card = document.querySelector('.pin-card');
    const hint = document.getElementById('pin-hint');
    const input = document.getElementById('pin-input');
    if (!card || !input) return;
    card.classList.add('is-wrong');
    if (hint) hint.textContent = 'try again';
    setTimeout(() => {
      card.classList.remove('is-wrong');
      if (hint) hint.textContent = ' ';
      input.value = '';
      input.focus();
    }, 700);
  }

  function init() {
    let alreadyUnlocked = false;
    try {
      alreadyUnlocked = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (_) {
      // Some iOS contexts (private browsing) throw on localStorage access.
      // The PIN gate will work, just won't remember the unlock next visit.
    }
    if (alreadyUnlocked) {
      unlock();
      return;
    }

    const input = document.getElementById('pin-input');
    if (!input) {
      // No gate markup found — fall through and boot rather than locking
      // the user out of their own game.
      bootGame();
      return;
    }

    // Autofocus on desktop. iOS Safari ignores programmatic focus unless
    // it happens inside a user gesture, so this is a no-op there — the
    // user taps the input themselves.
    setTimeout(() => { try { input.focus(); } catch (_) {} }, 50);

    let busy = false;
    input.addEventListener('input', async () => {
      // Strip anything that isn't a digit — iOS predictive keyboards
      // occasionally insert characters from autocorrect.
      const digits = input.value.replace(/\D/g, '');
      if (digits !== input.value) input.value = digits;
      if (digits.length < 4 || busy) return;
      busy = true;
      try {
        const h = await sha256Hex(digits);
        if (h === PIN_HASH) {
          try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
          unlock();
        } else {
          shake();
        }
      } finally {
        busy = false;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
