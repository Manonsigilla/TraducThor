// ============================================================
// DOM ELEMENTS
// ============================================================
const inputEl   = document.getElementById('input');
const sourceEl  = document.getElementById('source');
const targetEl  = document.getElementById('target');
const btnEl     = document.getElementById('btn-translate');
const gridEl    = document.getElementById('results-grid');
const countEl   = document.getElementById('char-count');

// Engine names, in the order we render their result cards.
const ENGINES   = ['Google', 'MyMemory', 'Linguee', 'Pons'];

// ============================================================
// CHARACTER COUNTER
// ============================================================
inputEl.addEventListener('input', () => {
  const len = inputEl.value.length;
  countEl.textContent = `${len} character${len !== 1 ? 's' : ''}`;
  // Warn (red) when approaching the 5000-char maxlength limit.
  countEl.style.color = len > 4500 ? '#FF5C6A' : '';
});

// ============================================================
// SKELETON LOADERS — shown while the request is in flight
// ============================================================
function showSkeletons() {
  gridEl.innerHTML = '';
  ENGINES.forEach((_, i) => {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    // Stagger each skeleton so they ripple in one after another.
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="sk-line sk-tag"></div>
      <div class="sk-line sk-l1"></div>
      <div class="sk-line sk-l2"></div>`;
    gridEl.appendChild(card);
  });
}

// ============================================================
// RENDER RESULT CARDS with a staggered cascade animation
// ============================================================
function renderResults(data) {
  gridEl.innerHTML = '';

  // Wait one frame so the DOM is ready before we animate.
  requestAnimationFrame(() => {
    Object.entries(data).forEach(([engine, text], i) => {
      // The server prefixes failed engines with "Error:" (see app.py).
      const isError = text.startsWith('Error');
      const card    = document.createElement('div');

      card.className = `result-card${isError ? ' is-error' : ''}`;
      card.style.setProperty('--delay', `${i * 0.09}s`);
      card.innerHTML = `
        <div class="scan"></div>
        <div class="card-header">
          <span class="engine-name">${engine}</span>
          ${!isError ? `<button class="copy-btn" data-text="${escapeAttr(text)}">Copy</button>` : ''}
        </div>
        <p class="card-text">${escapeHtml(text)}</p>`;

      gridEl.appendChild(card);

      // Trigger the fadeSlideUp animation on the next frame.
      requestAnimationFrame(() => card.classList.add('visible'));
    });

    // Attach the copy-button listeners after the cards are rendered.
    gridEl.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', handleCopy);
    });
  });
}

// ============================================================
// CLIPBOARD COPY
// ============================================================
async function handleCopy(e) {
  const btn  = e.currentTarget;
  const text = btn.dataset.text;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    // Reset the button label after a short confirmation delay.
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  } catch {
    btn.textContent = 'Error';
  }
}

// ============================================================
// INITIAL EMPTY STATE
// ============================================================
function showEmpty() {
  gridEl.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">⟳</span>
      <span>Translations will appear here</span>
    </div>`;
}

// ============================================================
// TRANSLATION
// ============================================================
async function doTranslate() {
  const text   = inputEl.value.trim();
  const source = sourceEl.value;
  const target = targetEl.value;

  // Nothing to translate: nudge the textarea with a brief red border.
  if (!text) {
    inputEl.focus();
    inputEl.style.borderColor = 'rgba(255,92,106,0.5)';
    setTimeout(() => inputEl.style.borderColor = '', 800);
    return;
  }

  // UI → loading state
  btnEl.classList.add('loading');
  showSkeletons();

  try {
    const res  = await fetch('/translate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, source, target })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    renderResults(data);

  } catch (err) {
    // Network/server failure (Flask down, etc.) — show a single error card.
    gridEl.innerHTML = `
      <div class="result-card is-error visible" style="opacity:1;transform:none;">
        <div class="card-header"><span class="engine-name">Network error</span></div>
        <p class="card-text">Could not reach the Flask server. Make sure <code>app.py</code> is running.</p>
      </div>`;
  } finally {
    btnEl.classList.remove('loading');
  }
}

// ============================================================
// EVENTS
// ============================================================
btnEl.addEventListener('click', doTranslate);

// Ctrl+Enter / Cmd+Enter translates straight from the textarea.
inputEl.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') doTranslate();
});

// ============================================================
// UTILITIES
// ============================================================
// Escape text before injecting it as element content.
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
// Escape text before injecting it into an HTML attribute (data-text).
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// INIT
// ============================================================
showEmpty();
