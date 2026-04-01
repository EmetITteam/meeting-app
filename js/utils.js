// ══════════════════════════════════════════════
// UTILS — shared constants, API, formatters
// ══════════════════════════════════════════════

const API_URL = "/api/handler";
let APP_TOKEN = '';

// Fetch app token from /api/config on startup
async function initAppToken() {
    try {
        const res = await fetch('/api/config');
        if (res.ok) { const d = await res.json(); if (d.appToken) APP_TOKEN = d.appToken; }
    } catch (e) { /* token not set — requests work, just unprotected */ }
}
initAppToken();

// ── API CALL ──
async function callApi(action, payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : {})
            },
            body: JSON.stringify({ action, payload })
        });

        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = `Ошибка API: Статус ${response.status} для действия "${action}". Ответ: ${errorText}`;
            if (window.Sentry) Sentry.captureMessage(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        const result = await response.json();
        if (result && result.error) {
            if (window.Sentry) Sentry.captureMessage(`1C Error: ${result.error}`, 'error');
            throw new Error(result.error);
        }
        return result;
    } catch (e) {
        if (window.Sentry) Sentry.captureException(e);
        throw e;
    }
}

// ── PRICE FORMATTERS ──
let TODAY_RATE_USD = 41.50;
let TODAY_RATE_EUR = 45.20;

function formatPrice(amount, currency) {
    if (!currency || currency === 'UAH') return amount.toLocaleString('uk-UA') + '\u202fгрн';
    const sym = { USD: '$', EUR: '€' }[currency] || currency;
    const rate = currency === 'EUR' ? TODAY_RATE_EUR : TODAY_RATE_USD;
    const uah = Math.round(amount * rate);
    return `${sym}\u202f${amount % 1 === 0 ? amount.toLocaleString('uk-UA') : amount.toFixed(2)} · ${uah.toLocaleString('uk-UA')}\u202fгрн`;
}

function formatCatalogPrice(priceUSD) {
    const uah = Math.round(priceUSD * TODAY_RATE_USD);
    return `$\u202f${priceUSD % 1 === 0 ? priceUSD : priceUSD.toFixed(2)} · ${uah.toLocaleString('uk-UA')}\u202fгрн`;
}

// ── CATEGORY COLORS ──
function getCategoryColor(categoryName) {
    if (!categoryName || categoryName.toLowerCase().includes('без категории')) return '#A0AEC0';
    const lc = categoryName.toLowerCase();
    if (lc.includes('новый'))        return '#4A90E2';
    if (lc.includes('активный'))     return '#48BB78';
    if (lc.includes('спящий'))       return '#F2C94C';
    if (lc.includes('без закупок'))  return '#F2994A';
    if (lc.includes('потерянный'))   return '#EB5757';
    return '#A0AEC0';
}

// ── MISC HELPERS ──
function formatElapsedTime(ms) {
    if (ms < 0) ms = 0;
    const seconds = Math.floor((ms / 1000) % 60).toString().padStart(2, '0');
    const minutes = Math.floor((ms / (1000 * 60)) % 60).toString().padStart(2, '0');
    const hours   = Math.floor(ms / (1000 * 60 * 60)).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// ── PAGE ROUTER ──
function switchPageById(pageId) {
    document.querySelectorAll('.app-page').forEach(p => p.classList.toggle('active', p.id === `page-${pageId}`));
    document.querySelectorAll('.nav-button').forEach(b => b.classList.toggle('active', b.dataset.page === pageId));
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        const titles = {
            orders: 'Замовлення', dashboard: 'Зустрічі', clients: 'Клієнти',
            analytics: 'Дашборд', 'add-order': 'Нове замовлення',
            debtors: 'Дебіторська заборгованість', 'order-detail': 'Деталі замовлення'
        };
        headerTitle.textContent = titles[pageId] || '';
    }
}

// ── SKELETON LOADER ──
function skeletonCards(count = 4) {
    return Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-line w-60"></div>
            <div class="skeleton-line w-40 mt-2"></div>
            <div class="skeleton-line w-80 mt-2"></div>
        </div>`).join('');
}

// ── TOAST ──
// Call showToast from app.js (which has the Bootstrap instance)
// This is a global wrapper so orders.js / debtors.js can call it
function showToast(message, type = 'default') {
    const toastEl = document.getElementById('appToast');
    if (!toastEl) return;
    const body = toastEl.querySelector('.toast-body');
    if (body) body.textContent = message;
    toastEl.classList.remove('toast-error', 'toast-success', 'text-white');
    if (type === 'error')   { toastEl.classList.add('toast-error', 'text-white'); }
    if (type === 'success') { toastEl.classList.add('toast-success', 'text-white'); }
    const instance = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
    instance.show();
}

// ── PWA INSTALL PROMPT ──
let _pwaPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _pwaPrompt = e;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'flex';
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
        if (!_pwaPrompt) return;
        _pwaPrompt.prompt();
        await _pwaPrompt.userChoice;
        _pwaPrompt = null;
        document.getElementById('pwa-install-banner').style.display = 'none';
    });
    document.getElementById('pwa-install-close')?.addEventListener('click', () => {
        document.getElementById('pwa-install-banner').style.display = 'none';
    });
});

// ── REGISTER SERVICE WORKER ──
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
