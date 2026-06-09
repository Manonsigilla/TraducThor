// ============================================================
// ÉLÉMENTS DU DOM
// ============================================================
const inputEl   = document.getElementById('input');
const sourceEl  = document.getElementById('source');
const targetEl  = document.getElementById('target');
const btnEl     = document.getElementById('btn-translate');
const gridEl    = document.getElementById('results-grid');
const countEl   = document.getElementById('char-count');

const ENGINES   = ['Google', 'MyMemory', 'Linguee', 'Pons'];

// ============================================================
// COMPTEUR DE CARACTÈRES
// ============================================================
inputEl.addEventListener('input', () => {
  const len = inputEl.value.length;
  countEl.textContent = `${len} caractère${len !== 1 ? 's' : ''}`;
  countEl.style.color = len > 4500 ? '#FF5C6A' : '';
});

// ============================================================
// SKELETON LOADERS  — affichés pendant la requête
// ============================================================
function showSkeletons() {
  gridEl.innerHTML = '';
  ENGINES.forEach((_, i) => {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="sk-line sk-tag"></div>
      <div class="sk-line sk-l1"></div>
      <div class="sk-line sk-l2"></div>`;
    gridEl.appendChild(card);
  });
}

// ============================================================
// RENDU DES CARTES RÉSULTAT avec animation en cascade
// ============================================================
function renderResults(data) {
  gridEl.innerHTML = '';

  // Petite pause pour que le DOM soit prêt avant d'animer
  requestAnimationFrame(() => {
    Object.entries(data).forEach(([engine, text], i) => {
      const isError = text.startsWith('Erreur');
      const card    = document.createElement('div');

      card.className = `result-card${isError ? ' is-error' : ''}`;
      card.style.setProperty('--delay', `${i * 0.09}s`);
      card.innerHTML = `
        <div class="scan"></div>
        <div class="card-header">
          <span class="engine-name">${engine}</span>
          ${!isError ? `<button class="copy-btn" data-text="${escapeAttr(text)}">Copier</button>` : ''}
        </div>
        <p class="card-text">${escapeHtml(text)}</p>`;

      gridEl.appendChild(card);

      // Déclenche l'animation fadeSlideUp au prochain frame
      requestAnimationFrame(() => card.classList.add('visible'));
    });

    // Attache les listeners "Copier" après rendu
    gridEl.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', handleCopy);
    });
  });
}

// ============================================================
// COPIE PRESSE-PAPIER
// ============================================================
async function handleCopy(e) {
  const btn  = e.currentTarget;
  const text = btn.dataset.text;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = '✓ Copié';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copier';
      btn.classList.remove('copied');
    }, 2000);
  } catch {
    btn.textContent = 'Erreur';
  }
}

// ============================================================
// ÉTAT VIDE initial
// ============================================================
function showEmpty() {
  gridEl.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">⟳</span>
      <span>Les traductions apparaîtront ici</span>
    </div>`;
}

// ============================================================
// TRADUCTION
// ============================================================
async function doTranslate() {
  const text   = inputEl.value.trim();
  const source = sourceEl.value;
  const target = targetEl.value;

  if (!text) {
    inputEl.focus();
    inputEl.style.borderColor = 'rgba(255,92,106,0.5)';
    setTimeout(() => inputEl.style.borderColor = '', 800);
    return;
  }

  // UI → état chargement
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
    gridEl.innerHTML = `
      <div class="result-card is-error visible" style="opacity:1;transform:none;">
        <div class="card-header"><span class="engine-name">Erreur réseau</span></div>
        <p class="card-text">Impossible de contacter le serveur Flask. Vérifiez que <code>app.py</code> tourne.</p>
      </div>`;
  } finally {
    btnEl.classList.remove('loading');
  }
}

// ============================================================
// EVENTS
// ============================================================
btnEl.addEventListener('click', doTranslate);

// Ctrl+Entrée / Cmd+Entrée pour traduire depuis le textarea
inputEl.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') doTranslate();
});

// ============================================================
// UTILITAIRES
// ============================================================
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// INIT
// ============================================================
showEmpty();
