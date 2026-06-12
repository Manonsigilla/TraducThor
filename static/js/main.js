// ============================================================
// DOM ELEMENTS
// ============================================================
const inputEl   = document.getElementById('input');
const sourceEl  = document.getElementById('source');
const targetEl  = document.getElementById('target');
const btnEl     = document.getElementById('btn-translate');
const gridEl    = document.getElementById('results-grid');
const countEl   = document.getElementById('char-count');
const scoreEl   = document.getElementById('thor-score');
const boltsEl   = document.getElementById('bolt-count');
const quipEl    = document.getElementById('thor-quip');

// Engine names, in the order we render their result cards.
const ENGINES   = ['Google', 'MyMemory', 'Linguee', 'Pons'];

// ============================================================
// THOR LIGHTNING SCORE ⚡
// One translation = bolts proportional to the text length
// (1 bolt per 25 characters, minimum 1). Total persists in
// localStorage so the storm survives page reloads.
// ============================================================
const BOLTS_KEY      = 'thorBolts';
const CHARS_PER_BOLT = 25;

// Humorous status phrases, by total-score tier.
const THOR_QUIPS = [
  [0,    "No lightning yet. Even Thor started somewhere."],
  [1,    "A faint spark… Loki remains unimpressed."],
  [10,   "Mjölnir twitches. It senses potential."],
  [50,   "Thunder rumbles over Asgard. Keep translating!"],
  [100,  "Almost worthy. The hammer wobbled, we all saw it."],
  [250,  "Heimdall can see your lightning from the Bifröst."],
  [500,  "Odin nods approvingly. That basically never happens."],
  [1000, "GOD OF TRANSLATION. Asgard bows before your keyboard."]
];

let totalBolts = parseInt(localStorage.getItem(BOLTS_KEY), 10) || 0;

function quipFor(score) {
  let quip = THOR_QUIPS[0][1];
  for (const [threshold, text] of THOR_QUIPS) {
    if (score >= threshold) quip = text;
  }
  return quip;
}

function renderScore() {
  boltsEl.textContent = totalBolts.toLocaleString();
  quipEl.textContent  = quipFor(totalBolts);
}

function awardBolts(charCount) {
  const gained = Math.max(1, Math.ceil(charCount / CHARS_PER_BOLT));
  totalBolts  += gained;
  localStorage.setItem(BOLTS_KEY, totalBolts);
  renderScore();

  // "+N ⚡" floating popup next to the counter.
  const pop = document.createElement('span');
  pop.className   = 'bolt-pop';
  pop.textContent = `+${gained} ⚡`;
  scoreEl.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove());

  // Flash the badge.
  scoreEl.classList.remove('zap');
  void scoreEl.offsetWidth; // restart the animation
  scoreEl.classList.add('zap');
}

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

  // Filter out errors and only display successful translations
  const successfulResults = Object.entries(data).filter(([engine, text]) => !text.startsWith('Error'));
  
  // Log errors to console for debugging
  Object.entries(data).forEach(([engine, text]) => {
    if (text.startsWith('Error')) {
      console.warn(`[${engine}] ${text}`);
    }
  });

  // If no engines succeeded, show a user-friendly message
  if (successfulResults.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <span>Translation services unavailable. Try again later.</span>
      </div>`;
    return;
  }

  // Wait one frame so the DOM is ready before we animate.
  requestAnimationFrame(() => {
    successfulResults.forEach(([engine, text], i) => {
      const card = document.createElement('div');

      card.className = 'result-card';
      card.style.setProperty('--delay', `${i * 0.09}s`);
      card.innerHTML = `
        <div class="scan"></div>
        <div class="card-header">
          <span class="engine-name">${engine}</span>
          <button class="copy-btn" data-text="${escapeAttr(text)}">Copy</button>
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

    // Award lightning only if at least one engine actually answered.
    const anySuccess = Object.values(data).some(t => !t.startsWith('Error'));
    if (anySuccess) awardBolts(text.length);

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
// THOR RESET BUTTON — clears translations & shows animation
// ============================================================
const thorResetBtn = document.getElementById('thor-reset');

if (thorResetBtn) {
  thorResetBtn.addEventListener('click', () => {
    // Clear input
    inputEl.value = '';
    countEl.textContent = '0 characters';
    
    // Show giant Thor smash animation (small screen shake effect)
    document.body.style.animation = 'thorScreenShake 0.5s ease-out';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 500);
    
    // Clear results and show empty state
    showEmpty();
    
    // Focus back on input
    inputEl.focus();
  });
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
renderScore();
