// ══════════════════════════════════════════════
// DEBTORS MODULE
// Depends on: utils.js, mock-data.js
// ══════════════════════════════════════════════

let activeDebtorFilter = 'all';

function renderDebtors(filter = 'all', search = '') {
    activeDebtorFilter = filter;
    const list = document.getElementById('debtors-list');
    if (!list) return;

    let data = [...MOCK_DEBTORS];
    if (filter === 'overdue') data = data.filter(d => d.overdueDays > 0);
    if (filter === 'ok')      data = data.filter(d => d.overdueDays === 0);
    if (search) {
        const q = search.toLowerCase();
        data = data.filter(d => d.client.toLowerCase().includes(q));
    }

    // Summary totals (always from full dataset)
    const totalAll   = MOCK_DEBTORS.reduce((s, d) => s + d.total, 0);
    const overdueAll = MOCK_DEBTORS.reduce((s, d) => s + d.overdue, 0);
    const totalEl   = document.getElementById('debtors-total');
    const overdueEl = document.getElementById('debtors-overdue-total');
    if (totalEl)   totalEl.textContent   = totalAll.toLocaleString('uk-UA') + '\u202fгрн';
    if (overdueEl) overdueEl.textContent = 'з них прострочено: ' + overdueAll.toLocaleString('uk-UA') + '\u202fгрн';

    if (!data.length) {
        list.innerHTML = `<div class="text-center text-muted py-5" style="font-size:14px;">Немає записів</div>`;
        return;
    }

    list.innerHTML = data.map(d => {
        const isOverdue = d.overdueDays > 0;
        const badgeText = isOverdue ? `Прострочено ${d.overdueDays}\u202fдн.` : 'Поточна';
        const dueFmt    = d.dueDate
            ? new Date(d.dueDate).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
        return `
        <div class="debtor-card">
            <div class="debtor-stripe ${isOverdue ? 'debtor-stripe-danger' : 'debtor-stripe-ok'}"></div>
            <div class="debtor-body">
                <div class="debtor-head">
                    <div class="debtor-client">${d.client}</div>
                    <span class="${isOverdue ? 'badge-overdue' : 'badge-current'}">${badgeText}</span>
                </div>
                <div class="debtor-contract">${d.contract}</div>
                <div class="debtor-footer">
                    <div>
                        <div class="debtor-amount ${isOverdue ? 'debtor-amount-overdue' : 'debtor-amount-ok'}">${d.total.toLocaleString('uk-UA')}\u202fгрн</div>
                        ${isOverdue && d.overdue < d.total
                            ? `<div style="font-size:11px;color:var(--text3);margin-top:1px;">прострочено: ${d.overdue.toLocaleString('uk-UA')}\u202fгрн</div>`
                            : ''}
                    </div>
                    <div>
                        <div class="debtor-date-label">Дата оплати</div>
                        <div class="debtor-date-val">${dueFmt}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function initDebtorsPage() {
    const backBtn    = document.getElementById('debtors-back-btn');
    const searchEl   = document.getElementById('debtors-search');
    const filterWrap = document.getElementById('debtors-filter-chips');

    backBtn?.addEventListener('click', () => switchPageById('dashboard'));

    searchEl?.addEventListener('input', () => {
        renderDebtors(activeDebtorFilter, searchEl.value);
    });

    filterWrap?.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        filterWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderDebtors(chip.dataset.filter, searchEl?.value || '');
    });

    // Side menu link
    document.getElementById('nav-debtors-link')?.addEventListener('click', e => {
        e.preventDefault();
        const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('sideMenu'));
        if (offcanvas) offcanvas.hide();
        switchPageById('debtors');
        renderDebtors('all');
        document.querySelectorAll('#debtors-filter-chips .chip').forEach(c =>
            c.classList.toggle('active', c.dataset.filter === 'all')
        );
        if (searchEl) searchEl.value = '';
    });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    initDebtorsPage();
});
