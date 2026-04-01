// ══════════════════════════════════════════════
// DASHBOARD — analytics, mock data, role nav
// Depends on: utils.js globals (callApi, formatPrice...)
// Globals used from app.js: currentUser
// ══════════════════════════════════════════════

// ─── Базові mock-дані (місяць) ───────────────────────────────────────────────
// Директор бачить: всі регіони, всі менеджери
// Регіональний менеджер бачить: свій регіон, свої менеджери
// Менеджер бачить: тільки себе

const _MOCK_BASE = {
    workingDaysTotal: 22, workingDaysPassed: 14,
    brands: [
        { name: 'Neuramis', plan: 450000, fact: 312000, clients: [
            { name: 'Клініка Estet', amount: 98000, products: 'Neuramis Deep, Light' },
            { name: 'ПП Коваль О.М.', amount: 74000, products: 'Neuramis Filler' },
            { name: 'МЦ Belleza', amount: 140000, products: 'Neuramis Deep Lidocaine' },
        ]},
        { name: 'Neuronox', plan: 380000, fact: 340000, clients: [
            { name: 'Лікар Петренко В.', amount: 120000, products: 'Neuronox 100u' },
            { name: 'Клініка Skin Lab', amount: 220000, products: 'Neuronox 50u, 100u' },
        ]},
        { name: 'Vitaran', plan: 300000, fact: 165000, clients: [
            { name: 'Клініка Estet', amount: 85000, products: 'Vitaran 2ml' },
            { name: 'ПП Мороз Н.В.', amount: 80000, products: 'Vitaran 1ml, 2ml' },
        ]},
        { name: 'Petaran', plan: 280000, fact: 215000, clients: [
            { name: 'Лікар Ткач І.О.', amount: 95000, products: 'Petaran 2ml' },
            { name: 'МЦ BeautyPro', amount: 120000, products: 'Petaran 1.5ml' },
        ]},
        { name: 'IUSE', plan: 230000, fact: 108000, clients: [
            { name: 'Клініка White', amount: 58000, products: 'IUSE Skin Booster' },
            { name: 'ПП Савченко Л.', amount: 50000, products: 'IUSE Hair' },
        ]},
        { name: 'Інші бренди', plan: 360000, fact: 108000, clients: [
            { name: 'Різні клієнти', amount: 108000, products: 'Асорті' },
        ]},
    ],
    training: [
        { brand: 'Neuramis', Київ: [3,45], Харків: [2,28], Дніпро: [1,14], Одеса: [2,22] },
        { brand: 'Neuronox', Київ: [2,30], Харків: [1,12], Дніпро: [2,18], Одеса: [1,10] },
        { brand: 'Vitaran',  Київ: [1,15], Харків: [1,8],  Дніпро: [0,0],  Одеса: [1,9]  },
        { brand: 'Petaran',  Київ: [2,22], Харків: [0,0],  Дніпро: [1,11], Одеса: [0,0]  },
    ],
};

// Дані по ролях (місяць)
const MOCK_BY_ROLE = {
    // Директор/CEO/Овнер — вся компанія
    director: {
        scopeLabel: 'Вся команда · всі регіони',
        plan: 2000000, fact: 1248500,
        regions: [
            { name: 'Київ',   plan: 800000, fact: 520000 },
            { name: 'Харків', plan: 450000, fact: 298000 },
            { name: 'Дніпро', plan: 400000, fact: 245000 },
            { name: 'Одеса',  plan: 350000, fact: 185500 },
        ],
        clients: { total: 347, bought: 128, totalTrend: +12, boughtTrend: -5 },
        clientCategories: [
            { name: 'Активні',     total: 142, bought: 98 },
            { name: 'Потенційні',  total: 85,  bought: 18 },
            { name: 'Сплячі',      total: 67,  bought: 7  },
            { name: 'Нові',        total: 53,  bought: 5  },
        ],
        meetings: { conducted: 219, converted: 128 },
    },
    // Регіональний менеджер — свій регіон (приклад: Київ)
    regional_manager: {
        scopeLabel: 'Київський регіон',
        plan: 800000, fact: 520000,
        regions: [
            { name: 'Оболонь',    plan: 200000, fact: 138000 },
            { name: 'Подол',      plan: 180000, fact: 124000 },
            { name: 'Лівий берег',plan: 220000, fact: 152000 },
            { name: 'Правий берег',plan:200000, fact: 106000 },
        ],
        clients: { total: 98, bought: 41, totalTrend: +4, boughtTrend: +2 },
        clientCategories: [
            { name: 'Активні',    total: 38, bought: 28 },
            { name: 'Потенційні', total: 24, bought: 8  },
            { name: 'Сплячі',     total: 21, bought: 3  },
            { name: 'Нові',       total: 15, bought: 2  },
        ],
        meetings: { conducted: 67, converted: 41 },
    },
    // Менеджер — тільки свої показники
    manager: {
        scopeLabel: 'Мої показники',
        plan: 180000, fact: 112000,
        regions: null, // менеджер не бачить розбивку по регіонах
        clients: { total: 28, bought: 14, totalTrend: +2, boughtTrend: +1 },
        clientCategories: [
            { name: 'Активні',    total: 12, bought: 9 },
            { name: 'Потенційні', total: 8,  bought: 3 },
            { name: 'Сплячі',     total: 5,  bought: 1 },
            { name: 'Нові',       total: 3,  bought: 1 },
        ],
        meetings: { conducted: 22, converted: 14 },
    },
};
// Admin = той самий вигляд що директор
MOCK_BY_ROLE.admin = MOCK_BY_ROLE.director;
MOCK_BY_ROLE.owner = MOCK_BY_ROLE.director;
MOCK_BY_ROLE.ceo   = MOCK_BY_ROLE.director;
MOCK_BY_ROLE.керівник  = MOCK_BY_ROLE.director;
MOCK_BY_ROLE.директор  = MOCK_BY_ROLE.director;
MOCK_BY_ROLE.рег_менеджер = MOCK_BY_ROLE.regional_manager;
MOCK_BY_ROLE.regional     = MOCK_BY_ROLE.regional_manager;

const MOCK_DASHBOARD = { month: _MOCK_BASE, week: _MOCK_BASE, today: _MOCK_BASE, quarter: _MOCK_BASE };

let donutChartInstance = null;
let currentPeriod = 'month';

function renderDashboard(period) {
    const base = MOCK_DASHBOARD[period] || MOCK_DASHBOARD.month;
    // Вибираємо дані по ролі (fallback → manager)
    const roleData = MOCK_BY_ROLE[currentUserRole] || MOCK_BY_ROLE.manager;
    const { plan, fact, regions, clients, clientCategories, meetings, scopeLabel } = roleData;
    const { workingDaysTotal, workingDaysPassed, brands, training } = base;

    // — Заголовок з масштабом даних —
    const el = (id) => document.getElementById(id);
    const periodLabels = { month: 'місяць', week: 'тиждень', today: 'сьогодні', quarter: 'квартал' };
    const now = new Date();
    const monthNames = ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень'];
    const titleSuffix = period === 'month' ? ` — ${monthNames[now.getMonth()]} ${now.getFullYear()}` : ` — ${periodLabels[period] || ''}`;
    if (el('plan-section-title')) el('plan-section-title').textContent = 'План продажів' + titleSuffix;

    // Підпис масштабу під заголовком
    const scopeEl = document.getElementById('analytics-scope-badge');
    if (scopeEl) scopeEl.textContent = scopeLabel;

    // — Plan card —
    const pct = Math.round(fact / plan * 100);
    const expectedPct = Math.round(workingDaysPassed / workingDaysTotal * 100);
    const diff = pct - expectedPct;
    const left = plan - fact;
    const daysLeft = workingDaysTotal - workingDaysPassed;
    const perDay = daysLeft > 0 ? Math.round(left / daysLeft) : 0;

    const pctClass = pct >= expectedPct ? 'pct-ok' : (pct >= expectedPct - 10 ? 'pct-warn' : 'pct-bad');
    const devClass = diff >= 0 ? 'dev-ahead' : 'dev-behind';
    const devText = diff >= 0 ? `Випереджаємо: +${diff}%` : `Відставання: ${diff}%`;
    const fillColor = pct >= 80 ? 'var(--green)' : (pct >= 50 ? 'var(--orange)' : 'var(--red)');

    if (el('plan-fact-amount')) el('plan-fact-amount').textContent = '₴ ' + fact.toLocaleString('uk-UA');
    if (el('plan-sub-text')) el('plan-sub-text').textContent = 'з ₴ ' + plan.toLocaleString('uk-UA') + ' план';
    if (el('plan-pct-badge')) { el('plan-pct-badge').textContent = pct + '%'; el('plan-pct-badge').className = 'plan-pct-badge ' + pctClass; }
    if (el('plan-progress-fill')) { el('plan-progress-fill').style.width = pct + '%'; el('plan-progress-fill').style.background = fillColor; }
    if (el('plan-progress-label')) { el('plan-progress-label').textContent = pct + '% виконано'; el('plan-progress-label').style.color = fillColor; }
    if (el('dev-expected')) el('dev-expected').textContent = expectedPct + '%';
    if (el('dev-fact')) el('dev-fact').textContent = pct + '%';
    if (el('dev-badge')) { el('dev-badge').textContent = devText; el('dev-badge').className = 'dev-badge ' + devClass; }
    if (el('pm-left')) el('pm-left').textContent = '₴ ' + Math.round(left/1000) + 'K';
    if (el('pm-days')) el('pm-days').textContent = daysLeft;
    if (el('pm-perday')) el('pm-perday').textContent = '₴ ' + Math.round(perDay/1000) + 'K';

    // — Brands (однакові для всіх — дані по брендах загальні, клієнти скороченого менеджера) —
    const brandsList = document.getElementById('brands-list');
    if (brandsList) {
        // Масштабуємо план/факт бренду до ролі
        const scale = plan / 2000000; // коеф. масштабу відносно директорського плану
        brandsList.innerHTML = brands.map(b => {
            const scaledFact = Math.round(b.fact * scale);
            const scaledPlan = Math.round(b.plan * scale);
            const bPct = Math.round(scaledFact / scaledPlan * 100);
            const bCls = bPct >= 80 ? 'good' : (bPct >= 50 ? 'mid' : 'low');
            const clientsHtml = b.clients.map(c => `
                <div class="brand-client-row">
                    <div>
                        <div class="bcr-name">${c.name}</div>
                        <div class="bcr-products">${c.products}</div>
                    </div>
                    <div class="bcr-amount">₴ ${Math.round(c.amount * scale).toLocaleString('uk-UA')}</div>
                </div>`).join('');
            return `
                <div class="brand-item" onclick="this.classList.toggle('open')">
                    <div class="brand-row1">
                        <div class="brand-name-text">${b.name}</div>
                        <div class="brand-right">
                            <span class="brand-pct pct-${bCls}">${bPct}%</span>
                            <i class="bi bi-chevron-down brand-chevron"></i>
                        </div>
                    </div>
                    <div class="brand-row2">
                        <div class="brand-track"><div class="brand-fill fill-${bCls}" style="width:${Math.min(bPct,100)}%"></div></div>
                        <span class="brand-nums">₴${Math.round(scaledFact/1000)}K / ₴${Math.round(scaledPlan/1000)}K</span>
                    </div>
                    <div class="brand-clients">${clientsHtml}</div>
                </div>`;
        }).join('');
    }

    // — Regions (менеджер не бачить цей блок) —
    const regionsSection = document.getElementById('regions-section');
    const regionsGrid = document.getElementById('regions-grid');
    if (regionsSection) regionsSection.style.display = regions ? '' : 'none';
    if (regionsGrid && regions) {
        regionsGrid.innerHTML = regions.map(r => {
            const rPct = Math.round(r.fact / r.plan * 100);
            return `
                <div class="region-card">
                    <div class="region-name">${r.name}</div>
                    <div class="region-val">₴ ${Math.round(r.fact/1000)}K</div>
                    <div class="region-sub">${rPct}% від плану</div>
                    <div class="region-bar"><div class="region-bar-fill" style="width:${Math.min(rPct,100)}%"></div></div>
                </div>`;
        }).join('');
    }

    // — Client totals —
    if (el('cl-total')) el('cl-total').textContent = clients.total;
    if (el('cl-bought')) el('cl-bought').textContent = clients.bought;

    // — Donut chart + legend —
    const donutLegend = document.getElementById('donut-legend');
    const colors = ['#066aab', '#2a9fd6', '#00b37e', '#f59e0b'];
    if (donutLegend) {
        donutLegend.innerHTML = clientCategories.map((c, i) => {
            const buyPct = Math.round(c.bought / c.total * 100);
            return `<div class="legend-row">
                <div class="legend-dot" style="background:${colors[i]}"></div>
                <div class="legend-name">${c.name}</div>
                <div><div class="legend-stat">${c.total}</div><div class="legend-bought">${c.bought} купили (${buyPct}%)</div></div>
            </div>`;
        }).join('');
    }
    const donutCanvas = document.getElementById('donutChart');
    if (donutCanvas) {
        if (donutChartInstance) donutChartInstance.destroy();
        donutChartInstance = new Chart(donutCanvas, {
            type: 'doughnut',
            data: {
                labels: clientCategories.map(c => c.name),
                datasets: [{ data: clientCategories.map(c => c.total), backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }]
            },
            options: { cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } } } }
        });
    }

    // — Buyers row —
    if (el('bv-orders')) el('bv-orders').textContent = clients.bought;
    if (el('bv-meetings')) el('bv-meetings').textContent = meetings.conducted;
    if (el('bv-conv')) el('bv-conv').textContent = Math.round(meetings.converted / meetings.conducted * 100) + '%';

    // — Training (director only) —
    const trainingTbody = document.getElementById('training-tbody');
    if (trainingTbody) {
        const regionNames = ['Київ', 'Харків', 'Дніпро', 'Одеса'];
        const totals = [0, 0, 0, 0, 0, 0]; // [kyiv_ev, kyiv_ppl, kh_ev, kh_ppl, ...]
        trainingTbody.innerHTML = training.map(row => {
            let total_ev = 0, total_ppl = 0;
            const cells = regionNames.map((r, i) => {
                const [ev, ppl] = row[r] || [0,0];
                total_ev += ev; total_ppl += ppl;
                totals[i*2] = (totals[i*2]||0) + ev;
                totals[i*2+1] = (totals[i*2+1]||0) + ppl;
                return `<td><div class="training-cell-top">${ev}</div><div class="training-cell-sub">${ppl} ос.</div></td>`;
            }).join('');
            return `<tr><td>${row.brand}</td>${cells}<td><div class="training-cell-top">${total_ev}</div><div class="training-cell-sub">${total_ppl} ос.</div></td></tr>`;
        }).join('');
        // totals row
        const totalCells = regionNames.map((r, i) => `<td><div class="training-cell-top">${totals[i*2]||0}</div><div class="training-cell-sub">${totals[i*2+1]||0} ос.</div></td>`).join('');
        const totalEv = training.reduce((s,r) => s + regionNames.reduce((a,rn) => a + (r[rn]?r[rn][0]:0), 0), 0);
        const totalPpl = training.reduce((s,r) => s + regionNames.reduce((a,rn) => a + (r[rn]?r[rn][1]:0), 0), 0);
        trainingTbody.innerHTML += `<tr class="total-row"><td>Разом</td>${totalCells}<td><div class="training-cell-top">${totalEv}</div><div class="training-cell-sub">${totalPpl} ос.</div></td></tr>`;
    }
}

// Глобальна змінна для поточної ролі (використовується в renderDashboard)
let currentUserRole = 'manager';
let currentUserRegion = ''; // 'kyiv' | '' (other regions)

function updateNavForRole(role, region) {
    currentUserRole = role || 'manager';
    if (region !== undefined) currentUserRegion = (region || '').toLowerCase();

    const navAnalytics  = document.getElementById('nav-analytics');
    const navMeetings   = document.getElementById('nav-meetings');
    const navClients    = document.getElementById('nav-clients');
    const navOrders     = document.getElementById('nav-orders');
    const navFabWrap    = document.getElementById('nav-fab-wrap');
    const trainingBlock = document.getElementById('training-block');

    const isDirector   = ['director', 'owner', 'ceo', 'admin', 'керівник', 'директор'].includes(role);
    const isRegManager = ['regional_manager', 'рег_менеджер', 'regional'].includes(role);
    // Manager = all other roles

    // Аналітика видима ВСІМ
    if (navAnalytics) navAnalytics.classList.remove('d-none');

    if (isDirector) {
        // Директор: тільки Дашборд, без Зустрічей/Клієнтів/FAB/Замовлень
        if (navMeetings)   navMeetings.classList.add('d-none');
        if (navClients)    navClients.classList.add('d-none');
        if (navOrders)     navOrders.classList.add('d-none');
        if (navFabWrap)    navFabWrap.classList.add('d-none');
        if (trainingBlock) trainingBlock.classList.remove('d-none');
        // Відкриваємо одразу аналітику
        document.querySelector('.nav-button[data-page="analytics"]')?.click();
    } else {
        // Регіональний менеджер і звичайний менеджер: всі вкладки
        if (navMeetings)   navMeetings.classList.remove('d-none');
        if (navClients)    navClients.classList.remove('d-none');
        if (navOrders)     navOrders.classList.remove('d-none');
        if (navFabWrap)    navFabWrap.classList.remove('d-none');
        // Навчання — тільки для рег.менеджера і вище
        if (trainingBlock) trainingBlock.classList.toggle('d-none', !isRegManager);
    }

    // Оновлюємо заголовок блоку фільтрів на дашборді
    const filterLabel = document.getElementById('dashboard-scope-label');
    if (filterLabel) {
        if (isDirector) filterLabel.textContent = 'Вся команда';
        else if (isRegManager) filterLabel.textContent = 'Мій регіон';
        else filterLabel.textContent = 'Мої показники';
    }

    applyRegionRules();
    console.log(`[CRM] Role: "${role}" | Region: "${currentUserRegion}" | isDirector:${isDirector} | isRegManager:${isRegManager}`);
}

function applyRegionRules() {
    const isKyiv = currentUserRegion === 'kyiv' || currentUserRegion === 'київ';
    // Kyiv: no реалізація documents — hide chip and filter them out
    const rlzChip = document.querySelector('.osc[data-filter="realization"]');
    if (rlzChip) rlzChip.classList.toggle('d-none', isKyiv);
    // If currently on realization filter, reset to 'all'
    if (isKyiv && activeOrderFilter === 'realization') {
        activeOrderFilter = 'all';
        document.querySelector('.osc[data-filter="all"]')?.click();
    }
}
