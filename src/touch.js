// Global touch input state — read by MainScene alongside keyboard.
// Installed on DOM ready so buttons exist when we query them.

window.touchKeys = { left: false, right: false, jump: false };

(function setupTouchControls() {
  const bindButton = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;

    const press = (e) => {
      if (e) e.preventDefault();
      window.touchKeys[key] = true;
      el.classList.add('is-down');
    };
    const release = (e) => {
      if (e) e.preventDefault();
      window.touchKeys[key] = false;
      el.classList.remove('is-down');
    };

    // touch
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });

    // mouse (so desktop debug works too)
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);

    // safety — if page loses focus while button held
    el.addEventListener('blur', release);
  };

  const install = () => {
    bindButton('btn-left', 'left');
    bindButton('btn-right', 'right');
    bindButton('btn-jump', 'jump');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }

  // Release everything on window blur / visibility change — prevents stuck keys.
  const releaseAll = () => {
    window.touchKeys.left = false;
    window.touchKeys.right = false;
    window.touchKeys.jump = false;
    document.querySelectorAll('.tbtn').forEach(el => el.classList.remove('is-down'));
  };
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAll();
  });
})();
