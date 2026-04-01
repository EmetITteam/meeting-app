// ══════════════════════════════════════════════
// ORDERS MODULE
// Depends on: utils.js, mock-data.js
// ══════════════════════════════════════════════

let orderCart = [];
let activeOrderFilter = 'all';

function renderOrders(filter) {
    activeOrderFilter = filter || activeOrderFilter;
    const container = document.getElementById('orders-list');
    if (!container) return;

    const isKyiv = (typeof currentUserRegion !== 'undefined') &&
        (currentUserRegion === 'kyiv' || currentUserRegion === 'київ');
    let orders = isKyiv ? MOCK_ORDERS.filter(o => o.docType !== 'realization') : MOCK_ORDERS;
    if (activeOrderFilter === 'draft')       orders = orders.filter(o => o.docType === 'order' && !o.posted);
    if (activeOrderFilter === 'formed')      orders = orders.filter(o => o.docType === 'order' && o.posted);
    if (activeOrderFilter === 'realization') orders = orders.filter(o => o.docType === 'realization');

    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:48px 0;color:var(--text3);">
                <i class="bi bi-bag" style="font-size:48px;display:block;margin-bottom:12px;"></i>
                <div style="font-size:15px;font-weight:700;">Замовлень не знайдено</div>
            </div>`;
        return;
    }

    const stripeMap    = { order_draft: 'gray', order_formed: 'blue', realization: 'orange' };
    const deliveryLbls = { courier: 'Кур\u2019єр', pickup: 'Самовивіз', nova_poshta: 'Нова Пошта', manager: 'Менеджер' };
    const payLbls      = { cash: 'нал', cashless: 'безнал', deferred: 'відстрочка' };

    container.innerHTML = orders.map(o => {
        const key  = o.docType === 'realization' ? 'realization' : (o.posted ? 'order_formed' : 'order_draft');
        const stripe = stripeMap[key];

        let badgeHtml = '';
        if (o.docType === 'order' && o.posted)  badgeHtml = `<span class="badge badge-formed">Сформовано</span>`;
        if (o.docType === 'order' && !o.posted) badgeHtml = `<span class="badge badge-draft">Чернетка</span>`;
        if (o.docType === 'realization')         badgeHtml = `<span class="badge badge-realization">Реалізація</span>`;

        const itemsHtml = o.items.map(it =>
            it.isGift
                ? `<span class="item-tag-gift"><i class="bi bi-gift" style="margin-right:3px;font-size:10px;"></i>${it.name}</span>`
                : `<span class="item-tag">${it.name} × ${it.qty}</span>`
        ).join('');

        const totalUAH = Math.round(o.totalAmountUSD * TODAY_RATE_USD);
        const editBtn  = (!o.posted)
            ? `<button class="card-btn js-order-edit" data-id="${o.id}"><i class="bi bi-pencil"></i> Редагувати</button>`
            : '';

        return `
        <div class="order-card">
            <div class="order-stripe stripe-${stripe}"></div>
            <div class="order-body">
                <div class="order-head">
                    <div>
                        <div class="order-num">${o.number}</div>
                        <div class="order-date">${o.date} · ${o.time}${o.docType === 'realization' ? ' · Реалізація' : ''}</div>
                    </div>
                    ${badgeHtml}
                </div>
                <div class="order-client"><i class="bi bi-person"></i>${o.clientName}</div>
                <div class="order-items-preview">${itemsHtml}</div>
                <div class="order-meta-row">
                    <span class="order-meta"><i class="bi bi-truck"></i> ${deliveryLbls[o.deliveryType] || o.deliveryType}</span>
                    ${o.deliveryAddress ? `<span class="order-meta"><i class="bi bi-geo-alt"></i> ${o.deliveryAddress}</span>` : ''}
                </div>
                <div class="order-amount">
                    <span style="font-size:17px;font-weight:800;">$\u202f${o.totalAmountUSD % 1 === 0 ? o.totalAmountUSD : o.totalAmountUSD.toFixed(2)}</span>
                    <span style="font-size:12px;font-weight:600;color:var(--text3);margin-left:6px;">${totalUAH.toLocaleString('uk-UA')}\u202fгрн · ${payLbls[o.paymentType] || o.paymentType}</span>
                </div>
                <div class="order-actions">
                    <button class="card-btn js-order-view" data-id="${o.id}"><i class="bi bi-eye"></i> Деталі</button>
                    ${editBtn}
                </div>
            </div>
        </div>`;
    }).join('');
}

function initOrdersPage() {
    // Filter chips
    document.getElementById('order-status-chips')?.addEventListener('click', e => {
        const chip = e.target.closest('.osc');
        if (!chip) return;
        document.querySelectorAll('.osc').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderOrders(chip.dataset.filter);
    });

    // Search
    document.getElementById('orders-search')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.order-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });

    // Delegated: view / edit
    document.getElementById('orders-list')?.addEventListener('click', e => {
        const viewBtn = e.target.closest('.js-order-view');
        const editBtn = e.target.closest('.js-order-edit');
        if (viewBtn) {
            const order = MOCK_ORDERS.find(o => o.id === viewBtn.dataset.id);
            if (order) showOrderDetail(order);
        }
        if (editBtn) {
            const order = MOCK_ORDERS.find(o => o.id === editBtn.dataset.id);
            if (order) openOrderEdit(order);
        }
    });

    // Detail back
    document.getElementById('order-detail-back-btn')?.addEventListener('click', () => {
        switchPageById('orders');
    });

    // Add-order back
    document.getElementById('add-order-back-btn')?.addEventListener('click', () => {
        switchPageById('orders');
        resetOrderForm();
    });
}

function showOrderDetail(order) {
    const deliveryLbls = { courier: 'Кур\u2019єр', pickup: 'Самовивіз', nova_poshta: 'Нова Пошта', manager: 'Менеджер' };
    const payLbls      = { cash: 'Готівка', cashless: 'Безнал', deferred: 'Відстрочка' };

    let badgeHtml = '';
    if (order.docType === 'order' && order.posted)  badgeHtml = `<span class="badge badge-formed">Сформовано</span>`;
    if (order.docType === 'order' && !order.posted) badgeHtml = `<span class="badge badge-draft">Чернетка</span>`;
    if (order.docType === 'realization')            badgeHtml = `<span class="badge badge-realization">Реалізація</span>`;

    const itemsHtml = order.items.map(it => {
        const lineUSD = (it.priceUSD || 0) * it.qty;
        const lineUAH = Math.round(lineUSD * TODAY_RATE_USD);
        return `
        <div class="d-flex justify-content-between align-items-start py-2" style="border-bottom:1px solid var(--border);gap:10px;">
            <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:var(--text);">
                    ${it.isGift ? '<span class="item-tag-gift"><i class="bi bi-gift"></i> Подарунок</span> ' : ''}${it.name}
                </div>
                ${!it.isGift ? `<div style="font-size:12px;color:var(--text3);">× ${it.qty} · $\u202f${it.priceUSD % 1 === 0 ? it.priceUSD : it.priceUSD.toFixed(2)} / шт</div>` : ''}
            </div>
            ${!it.isGift ? `<div style="text-align:right;flex-shrink:0;">
                <div style="font-size:14px;font-weight:800;color:var(--primary);">$\u202f${lineUSD % 1 === 0 ? lineUSD : lineUSD.toFixed(2)}</div>
                <div style="font-size:11px;font-weight:600;color:var(--text3);">${lineUAH.toLocaleString('uk-UA')}\u202fгрн</div>
            </div>` : ''}
        </div>`;
    }).join('');

    document.getElementById('order-detail-title').textContent = order.number;
    document.getElementById('order-detail-content').innerHTML = `
        <div class="form-section-wrap mb-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div style="font-size:11px;font-weight:700;color:var(--text3);">${order.date} · ${order.time}</div>
                ${badgeHtml}
            </div>
            <div class="mb-2">
                <span style="font-size:12px;font-weight:700;color:var(--text3);">Клієнт:</span>
                <div style="font-size:14px;font-weight:700;">${order.clientName}</div>
            </div>
            <div>
                <span style="font-size:12px;font-weight:700;color:var(--text3);">Договір:</span>
                <div style="font-size:13px;font-weight:600;">${order.contractName}</div>
            </div>
        </div>

        <div class="form-section-wrap mb-3">
            <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">Товари</div>
            ${itemsHtml}
            <div class="d-flex justify-content-between align-items-center pt-3">
                <div style="font-size:13px;font-weight:700;color:var(--text2);">Разом:</div>
                <div style="text-align:right;">
                    <div style="font-size:20px;font-weight:800;letter-spacing:-0.5px;">$\u202f${order.totalAmountUSD % 1 === 0 ? order.totalAmountUSD : order.totalAmountUSD.toFixed(2)}</div>
                    <div style="font-size:13px;font-weight:700;color:var(--text3);">${Math.round(order.totalAmountUSD * TODAY_RATE_USD).toLocaleString('uk-UA')}\u202fгрн</div>
                </div>
            </div>
        </div>

        <div class="form-section-wrap mb-3">
            <div class="mb-2">
                <span style="font-size:12px;font-weight:700;color:var(--text3);">Доставка:</span>
                <div style="font-size:13px;font-weight:700;">${deliveryLbls[order.deliveryType] || order.deliveryType}${order.deliveryAddress ? ' · ' + order.deliveryAddress : ''}</div>
            </div>
            <div>
                <span style="font-size:12px;font-weight:700;color:var(--text3);">Оплата:</span>
                <div style="font-size:13px;font-weight:700;">${payLbls[order.paymentType] || order.paymentType}</div>
            </div>
            ${order.comment ? `<div class="mt-2">
                <span style="font-size:12px;font-weight:700;color:var(--text3);">Коментар:</span>
                <div style="font-size:13px;">${order.comment}</div>
            </div>` : ''}
        </div>
    `;

    switchPageById('order-detail');
}

function openOrderEdit(order) {
    const titleEl = document.getElementById('add-order-title');
    if (titleEl) titleEl.textContent = 'Редагувати ' + order.number;

    const clientInput   = document.getElementById('order-client-name');
    const clientIdInput = document.getElementById('order-client-id');
    if (clientInput)   clientInput.value   = order.clientName;
    if (clientIdInput) clientIdInput.value = order.clientID;

    const client = MOCK_ORDER_CLIENTS.find(c => c.id === order.clientID);
    fillContractDropdown(client, order.contractName);

    orderCart = order.items
        .filter(it => !it.isGift)
        .map(it => {
            const product = MOCK_CATALOG.find(p => p.name === it.name) ||
                { id: it.name, name: it.name, brand: '', priceUSD: it.priceUSD || 0, stock: 99 };
            return { product, qty: it.qty };
        });
    renderOrderCart();
    switchPageById('add-order');
}

function fillContractDropdown(client, selectedName) {
    const sel = document.getElementById('order-contract');
    if (!sel) return;
    if (!client) { sel.innerHTML = '<option value="">— оберіть клієнта —</option>'; return; }
    sel.innerHTML = client.contracts.map(ct =>
        `<option value="${ct.id}" data-currency="${ct.currency}" ${ct.isPrimary || ct.name === selectedName ? 'selected' : ''}>${ct.name}</option>`
    ).join('');
}

function initAddOrderForm() {
    // Client autocomplete
    const clientInput    = document.getElementById('order-client-name');
    const clientDropdown = document.getElementById('order-client-autocomplete');

    clientInput?.addEventListener('input', () => {
        const q = clientInput.value.toLowerCase();
        clientDropdown.innerHTML = '';
        if (q.length < 1) return;
        const matches = MOCK_ORDER_CLIENTS.filter(c => c.name.toLowerCase().includes(q));
        if (!matches.length) return;
        clientDropdown.innerHTML = matches.map(c =>
            `<button type="button" class="list-group-item list-group-item-action py-2" data-client-id="${c.id}" style="font-size:13px;font-weight:600;">${c.name}</button>`
        ).join('');
    });

    clientDropdown?.addEventListener('click', e => {
        const btn = e.target.closest('[data-client-id]');
        if (!btn) return;
        const client = MOCK_ORDER_CLIENTS.find(c => c.id === btn.dataset.clientId);
        if (!client) return;
        clientInput.value = client.name;
        document.getElementById('order-client-id').value = client.id;
        clientDropdown.innerHTML = '';
        fillContractDropdown(client, null);
    });

    document.addEventListener('click', e => {
        if (!clientInput?.contains(e.target) && !clientDropdown?.contains(e.target)) {
            if (clientDropdown) clientDropdown.innerHTML = '';
        }
    });

    // Product search
    document.getElementById('order-product-search')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        const results = document.getElementById('order-product-results');
        if (q.length < 2) { results.innerHTML = ''; return; }
        const matches = MOCK_CATALOG.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
        if (!matches.length) { results.innerHTML = `<div style="font-size:13px;color:var(--text3);padding:6px 0;">Нічого не знайдено</div>`; return; }
        results.innerHTML = matches.map(p => `
            <div class="cart-item js-add-to-cart" data-id="${p.id}" style="cursor:pointer;${p.restricted ? 'opacity:.6;' : ''}">
                <div style="flex:1;min-width:0;">
                    <div class="cart-item-name">${p.name}</div>
                    <div class="cart-item-meta">${p.brand} · ${p.code} · залишок: ${p.stock}</div>
                    ${p.restricted ? `<div style="font-size:11px;color:var(--red);font-weight:600;margin-top:2px;"><i class="bi bi-shield-exclamation"></i> ${p.restrictionReason}</div>` : ''}
                </div>
                <div class="cart-item-right">
                    <div class="cart-item-price" style="text-align:right;">
                        <div>$\u202f${p.priceUSD % 1 === 0 ? p.priceUSD : p.priceUSD.toFixed(2)}</div>
                        <div style="font-size:11px;font-weight:600;color:var(--text3);">${Math.round(p.priceUSD * TODAY_RATE_USD).toLocaleString('uk-UA')}\u202fгрн</div>
                    </div>
                    ${!p.restricted
                        ? `<button class="card-btn card-btn-primary" style="pointer-events:none;white-space:nowrap;">+ Додати</button>`
                        : `<span style="font-size:11px;color:var(--red);font-weight:700;">Заборонено</span>`}
                </div>
            </div>`).join('');
    });

    // Add to cart
    document.getElementById('order-product-results')?.addEventListener('click', e => {
        const row = e.target.closest('.js-add-to-cart');
        if (!row) return;
        const product = MOCK_CATALOG.find(p => p.id === row.dataset.id);
        if (!product || product.restricted) return;
        const existing = orderCart.find(c => c.product.id === product.id);
        if (existing) { existing.qty++; } else { orderCart.push({ product, qty: 1 }); }
        document.getElementById('order-product-search').value = '';
        document.getElementById('order-product-results').innerHTML = '';
        renderOrderCart();
    });

    // Delivery options
    document.getElementById('delivery-grid')?.addEventListener('click', e => {
        const opt = e.target.closest('.delivery-opt');
        if (!opt) return;
        document.querySelectorAll('.delivery-opt').forEach(d => d.classList.remove('active'));
        opt.classList.add('active');
    });

    // Payment chips
    document.getElementById('payment-chips')?.addEventListener('click', e => {
        const chip = e.target.closest('.pay-chip');
        if (!chip) return;
        document.querySelectorAll('.pay-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });

    // Save / Post
    document.getElementById('order-save-draft-btn')?.addEventListener('click', () => {
        showToast('Замовлення записано як чернетку');
        switchPageById('orders');
        resetOrderForm();
        renderOrders('all');
    });
    document.getElementById('order-post-btn')?.addEventListener('click', () => {
        if (orderCart.length === 0) { showToast('Додайте хоча б один товар'); return; }
        showToast('Замовлення проведено — статус: Сформовано');
        switchPageById('orders');
        resetOrderForm();
        renderOrders('all');
    });
}

function renderOrderCart() {
    const container = document.getElementById('order-cart');
    const totalRow  = document.getElementById('order-total-row');
    const totalVal  = document.getElementById('order-total-val');
    if (!container) return;

    if (orderCart.length === 0) {
        container.innerHTML = '';
        if (totalRow) totalRow.style.display = 'none';
        return;
    }

    let totalUSD = 0;
    container.innerHTML = orderCart.map(({ product, qty }) => {
        const lineUSD = (product.priceUSD || 0) * qty;
        totalUSD += lineUSD;
        const lineUAH = Math.round(lineUSD * TODAY_RATE_USD);
        return `
        <div class="cart-item">
            <div style="flex:1;min-width:0;">
                <div class="cart-item-name">${product.name}</div>
                <div class="cart-item-meta">${product.brand} · $\u202f${product.priceUSD % 1 === 0 ? product.priceUSD : (product.priceUSD?.toFixed(2) || '—')} / шт</div>
            </div>
            <div class="cart-item-right">
                <div class="cart-item-price" style="text-align:right;">
                    <div>$\u202f${lineUSD % 1 === 0 ? lineUSD : lineUSD.toFixed(2)}</div>
                    <div style="font-size:11px;font-weight:600;color:var(--text3);">${lineUAH.toLocaleString('uk-UA')}\u202fгрн</div>
                </div>
                <div class="cart-qty">
                    <button class="qty-btn js-cart-minus" data-id="${product.id}">−</button>
                    <span class="qty-val">${qty}</span>
                    <button class="qty-btn js-cart-plus" data-id="${product.id}">+</button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Gift banner (mock rule: Vitaran qty >= 4)
    const vitaran    = orderCart.find(c => c.product.brand === 'Vitaran');
    const giftBanner = document.getElementById('order-gift-banner');
    const giftText   = document.getElementById('order-gift-text');
    if (vitaran && vitaran.qty >= 4 && giftBanner) {
        giftBanner.style.display = 'flex';
        if (giftText) giftText.textContent = 'Акція «Vitaran 4+» — оберіть подарунок';
    } else if (giftBanner) {
        giftBanner.style.display = 'none';
    }

    if (totalRow) totalRow.style.display = 'flex';
    const totalUAH = Math.round(totalUSD * TODAY_RATE_USD);
    if (totalVal) totalVal.innerHTML = `$\u202f${totalUSD % 1 === 0 ? totalUSD : totalUSD.toFixed(2)}<br><span style="font-size:13px;font-weight:600;color:var(--text3);">${totalUAH.toLocaleString('uk-UA')}\u202fгрн</span>`;

    // Qty buttons
    container.querySelectorAll('.js-cart-minus').forEach(btn => btn.addEventListener('click', () => {
        const item = orderCart.find(c => c.product.id === btn.dataset.id);
        if (!item) return;
        if (item.qty > 1) { item.qty--; } else { orderCart = orderCart.filter(c => c.product.id !== btn.dataset.id); }
        renderOrderCart();
    }));
    container.querySelectorAll('.js-cart-plus').forEach(btn => btn.addEventListener('click', () => {
        const item = orderCart.find(c => c.product.id === btn.dataset.id);
        if (item) { item.qty++; renderOrderCart(); }
    }));
}

function resetOrderForm() {
    orderCart = [];
    renderOrderCart();
    ['order-client-name','order-client-id','order-delivery-address','order-date-assembly','order-date-delivery','order-comment','order-event']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    fillContractDropdown(null, null);
    document.querySelectorAll('.delivery-opt').forEach((d, i) => d.classList.toggle('active', i === 0));
    document.querySelectorAll('.pay-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    const giftBanner = document.getElementById('order-gift-banner');
    if (giftBanner) giftBanner.style.display = 'none';
    const titleEl = document.getElementById('add-order-title');
    if (titleEl) titleEl.textContent = 'Нове замовлення';
}

// ── FAB ACTION SHEET ──
function initFabSheet() {
    const mainAddBtn = document.getElementById('main-add-btn');
    const overlay    = document.getElementById('fab-overlay');
    const sheet      = document.getElementById('fab-sheet');
    const btnMeeting = document.getElementById('sheet-btn-meeting');
    const btnOrder   = document.getElementById('sheet-btn-order');
    if (!mainAddBtn || !sheet) return;

    function openSheet()  { overlay.classList.add('open'); sheet.classList.add('open'); }
    function closeSheet() { overlay.classList.remove('open'); sheet.classList.remove('open'); }

    mainAddBtn.addEventListener('click', e => { e.preventDefault(); openSheet(); });
    overlay.addEventListener('click', closeSheet);

    btnMeeting?.addEventListener('click', () => {
        closeSheet();
        document.querySelector('.nav-button[data-page="dashboard"]')?.click();
        setTimeout(() => window.showAddForm?.(), 50);
    });

    btnOrder?.addEventListener('click', () => {
        closeSheet();
        switchPageById('add-order');
        resetOrderForm();
    });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    renderOrders('all');
    initOrdersPage();
    initAddOrderForm();
    initFabSheet();

    document.getElementById('nav-orders')?.addEventListener('click', () => {
        switchPageById('orders');
        renderOrders(activeOrderFilter);
    });
});
