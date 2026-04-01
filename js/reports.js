// ══════════════════════════════════════════════
// REPORTS — client report modal, charts
// Depends on: utils.js
// Globals used from app.js: currentUser, reportModal, showAddForm (app.js)
// ══════════════════════════════════════════════

let reportCharts = [];
let reportChart = null;

    // ЗАМЕНИТЕ СТАРУЮ ФУНКЦИЮ НА ЭТУ
// ЗАМЕНИТЕ ВАШУ ФУНКЦИЮ НА ЭТУ
async function handleReportClick(btnElement) {
    if (!btnElement) return;

    const clientID = btnElement.dataset.clientId;
    const clientName = btnElement.dataset.clientName;

    if (!clientID) {
        showToast("Ошибка: не найден ID клиента для отчета.");
        return;
    }

    // 1. Показываем спиннер на самой кнопке, давая понять, что идет загрузка
    toggleButtonSpinner(btnElement, true);

    try {
        // 2. СНАЧАЛА полностью загружаем данные
        const data = await callApi('getClientReport', { clientID: clientID });

        const reportModalBody = document.getElementById('reportModalBody');
        document.getElementById('reportModalTitle').textContent = `Отчет по клиенту: ${clientName}`;

        // 3. ПОТОМ отрисовываем готовый отчет в (пока еще скрытом) модальном окне
        renderReport(data);

        // 4. И ТОЛЬКО ТЕПЕРЬ показываем пользователю полностью готовое окно
        reportModal.show();

    } catch (e) {
        onFailure(e);
    } finally {
        // 5. В любом случае (успех или ошибка) убираем спиннер с кнопки
        toggleButtonSpinner(btnElement, false);
    }
}
function renderReport(data) {
    const reportModalBody = document.getElementById('reportModalBody');
    let content = '';

    if (reportCharts.length > 0) {
        reportCharts.forEach(chart => chart.destroy());
        reportCharts = [];
    }

    // Блок 1: Шапка отчета
    if (data.clientInfo) {
        let phoneHtml = 'Не указан';
        if (data.clientInfo.phone) {
            const cleanPhone = data.clientInfo.phone.replace(/[^+\d]/g, '');
            phoneHtml = `<a href="tel:${cleanPhone}" class="text-decoration-none">${data.clientInfo.phone}</a>`;
        }
        let documentsStatusHtml = `<span class="text-danger"><i class="bi bi-x-circle-fill me-2"></i>Нет</span>`;
        if (data.clientInfo.documents === true) {
            documentsStatusHtml = `<span class="text-success"><i class="bi bi-check-circle-fill me-2"></i>Есть</span>`;
        }
        content += `<div class="d-flex justify-content-between align-items-center mb-2"><h3 class="mb-0">${data.clientInfo.name || 'Имя не указано'}</h3><button class="btn btn-primary btn-sm js-create-meeting-from-report" data-client-id="${data.clientInfo.id || ''}" data-client-name="${data.clientInfo.name || ''}" data-client-address="${data.clientInfo.address || ''}" data-client-category="${data.clientInfo.category || ''}" data-client-phone="${data.clientInfo.phone || ''}"><i class="bi bi-calendar-plus me-1"></i> Новая встреча</button></div><hr class="mt-0 mb-3"><div class="mb-3"><div class="row"><div class="col-md-6"><p class="mb-1"><strong><i class="bi bi-telephone-fill me-2"></i>Телефон:</strong> ${phoneHtml}</p></div><div class="col-md-6"><p class="mb-1"><strong><i class="bi bi-star-fill me-2"></i>Категория:</strong> ${data.clientInfo.category || 'Не указана'}</p></div></div><div class="row mt-2"><div class="col-md-6"><p class="mb-1"><strong><i class="bi bi-mortarboard-fill me-2"></i>Образование:</strong> ${data.clientInfo.education || 'Не указано'}</p></div><div class="col-md-6"><p class="mb-1"><strong><i class="bi bi-file-earmark-text-fill me-2"></i>Документы:</strong> ${documentsStatusHtml}</p></div></div></div>`;
    }

    // Блок 2: Навигация по вкладкам
    content += `<nav><div class="nav nav-tabs" id="report-tab" role="tablist"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#sales-content" type="button">Продажи (3 мес)</button><button class="nav-link" data-bs-toggle="tab" data-bs-target="#yearly-sales-content" type="button">Продажи (Год)</button><button class="nav-link" data-bs-toggle="tab" data-bs-target="#meetings-content" type="button">Встречи</button><button class="nav-link" data-bs-toggle="tab" data-bs-target="#calls-content" type="button">Звонки</button><button class="nav-link" data-bs-toggle="tab" data-bs-target="#seminars-content" type="button">Семинары</button></div></nav>`;

    // Блок 3: Содержимое всех вкладок
    content += `<div class="tab-content p-3 border border-top-0 rounded-bottom" id="report-tab-content">`;

    // Вкладки: Продажи (3 мес), Встречи, Звонки, Семинары (без изменений)
    let salesContent = '';
    if (data.salesReport && data.salesReport.brands && data.salesReport.brands.length > 0) {
        salesContent += `<h5 class="mb-3">Продажи по брендам (c ${data.salesReport.periodStart} по ${data.salesReport.periodEnd})</h5><div class="row g-3">`;
        data.salesReport.brands.forEach(brand => {
            const salesRows = brand.salesByMonth.map(sale =>  `<li class="list-group-item d-flex justify-content-between"><span>${sale.month}</span> <span>${new Intl.NumberFormat('ru-RU').format(sale.amount)} usd</span></li>`).join('');
            salesContent += `<div class="col-md-6"><div class="card h-100"><div class="card-header bg-light"><strong>${brand.brandName}</strong></div><ul class="list-group list-group-flush">${salesRows}<li class="list-group-item d-flex justify-content-between fw-bold"><span>Итого:</span> <span>${new Intl.NumberFormat('ru-RU').format(brand.totalAmount)} usd</span></li></ul></div></div>`;
        });
        salesContent += '</div>';
    } else {
        salesContent += '<p class="text-muted mt-2">Нет данных о продажах за последние 3 месяца.</p>';
    }
    content += `<div class="tab-pane fade show active" id="sales-content" role="tabpanel">${salesContent}</div>`;

    // Вкладка "Встречи"
    let meetingsContent = '';
    if (data.lastMeetings && data.lastMeetings.length > 0) {
        meetingsContent += '<ul class="list-unstyled mt-2">';
        data.lastMeetings.forEach(meeting => { meetingsContent += `<li class="mb-3"><p class="mb-0"><strong>${meeting.date}:</strong></p><p class="mb-0 text-muted fst-italic">"${meeting.comment || 'Без комментария'}"</p></li>`; });
        meetingsContent += '</ul>';
    } else {
        meetingsContent += '<p class="text-muted mt-2">Нет данных о последних встречах.</p>';
    }
    content += `<div class="tab-pane fade" id="meetings-content" role="tabpanel">${meetingsContent}</div>`;

    // Вкладка "Звонки"
    let callsContent = '';
    if (data.lastCalls && data.lastCalls.length > 0) {
        const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
        const callsByMonth = {};
        data.lastCalls.forEach(call => {
            const date = new Date(call.date);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!callsByMonth[monthKey]) { callsByMonth[monthKey] = []; }
            callsByMonth[monthKey].push(call);
        });
        callsContent += '<div class="mt-2">';
        const sortedMonths = Object.keys(callsByMonth).sort((a, b) => new Date(b.split(' ')[1], monthNames.indexOf(b.split(' ')[0])) - new Date(a.split(' ')[1], monthNames.indexOf(a.split(' ')[0])));
        sortedMonths.forEach(month => {
            callsContent += `<h6 class="mt-3">${month}</h6>`;
            const incomingCalls = callsByMonth[month].filter(c => c.comment && c.comment.toLowerCase().startsWith('входящее'));
            const outgoingCalls = callsByMonth[month].filter(c => c.comment && c.comment.toLowerCase().startsWith('исходящее'));
            const otherCalls = callsByMonth[month].filter(c => !c.comment || (!c.comment.toLowerCase().startsWith('входящее') && !c.comment.toLowerCase().startsWith('исходящее')));
            if (incomingCalls.length > 0) {
                callsContent += '<p class="text-muted mb-1 small"><em>Входящие:</em></p><ul class="list-unstyled ps-3">';
                incomingCalls.forEach(call => { const commentText = call.comment.replace(/входящее:?/i, '').trim(); callsContent += `<li><i class="bi bi-telephone-inbound me-2 text-success"></i><strong>${call.date}:</strong> ${commentText || 'Без комментария'}</li>`; });
                callsContent += '</ul>';
            }
            if (outgoingCalls.length > 0) {
                callsContent += '<p class="text-muted mb-1 small"><em>Исходящие:</em></p><ul class="list-unstyled ps-3">';
                outgoingCalls.forEach(call => { const commentText = call.comment.replace(/исходящее:?/i, '').trim(); callsContent += `<li><i class="bi bi-telephone-outbound me-2 text-primary"></i><strong>${call.date}:</strong> ${commentText || 'Без комментария'}</li>`; });
                callsContent += '</ul>';
            }
            if (otherCalls.length > 0) {
                callsContent += '<p class="text-muted mb-1 small"><em>Прочие:</em></p><ul class="list-unstyled ps-3">';
                otherCalls.forEach(call => { callsContent += `<li><i class="bi bi-telephone me-2 text-secondary"></i><strong>${call.date}:</strong> ${call.comment || 'Без комментария'}</li>`; });
                callsContent += '</ul>';
            }
        });
        callsContent += '</div>';
    } else {
        callsContent += '<p class="text-muted mt-2">Нет данных о звонках.</p>';
    }
    content += `<div class="tab-pane fade" id="calls-content" role="tabpanel">${callsContent}</div>`;

    // Вкладка "Семинары"
    let seminarsContent = '';
    if (data.seminars && data.seminars.length > 0) {
        seminarsContent += '<ul class="list-group list-group-flush mt-2">';
        data.seminars.forEach(seminar => { seminarsContent += `<li class="list-group-item ps-0">${seminar.date} - ${seminar.name}</li>`; });
        seminarsContent += '</ul>';
    } else {
        seminarsContent += '<p class="text-muted mt-2">Нет данных о посещении семинаров.</p>';
    }
    content += `<div class="tab-pane fade" id="seminars-content" role="tabpanel">${seminarsContent}</div>`;

    // Вкладка "Продажи (Год)" - ПОЛНОСТЬЮ НОВАЯ ЛОГИКА
    // Вкладка "Продажи (Год)" - ИЗМЕНЕННАЯ ЛОГИКА
    let yearlySalesContent = '';
    const yearlyData = processYearlySalesData(data.yearlySalesReport);
    if (yearlyData) {
        yearlySalesContent += `<h5 class="mb-3">Общая динамика продаж за год</h5>`;
        yearlySalesContent += `<p><strong>Общая сумма: ${new Intl.NumberFormat('ru-RU').format(yearlyData.grandTotal)} usd</strong></p>`;
        yearlySalesContent += '<canvas id="yearlySalesChart" height="200"></canvas>';
        yearlySalesContent += '<hr><h5 class="mt-4 mb-3">Детализация по брендам</h5>';

        yearlyData.brandsData.forEach((brand, index) => {
            const salesCount = brand.monthlySales.filter(amount => amount > 0).length;

            // Если продаж мало (1 месяц) - рисуем компактный блок
            if (salesCount <= 1) {
                yearlySalesContent += `
                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <h6 class="card-title mb-0 fw-normal">${brand.brandName}</h6>
                        <span class="fs-6 fw-bold text-primary">${new Intl.NumberFormat('ru-RU').format(brand.total)} usd</span>
                    </div>`;
            } else { // Иначе рисуем полноценную карточку с графиком
                yearlySalesContent += `
                    <div class="card mb-3">
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="card-title mb-0">${brand.brandName}</h6>
                                <span class="fs-5 fw-bold text-primary">${new Intl.NumberFormat('ru-RU').format(brand.total)} usd</span>
                            </div>
                            <hr class="my-2">
                            <canvas id="mini-chart-brand-${index}" height="120"></canvas>
                        </div>
                    </div>
                `;
            }
        });
    } else {
        yearlySalesContent += '<p class="text-muted mt-2">Нет данных о продажах за год.</p>';
    }
    content += `<div class="tab-pane fade" id="yearly-sales-content" role="tabpanel">${yearlySalesContent}</div>`;

    content += `</div>`;
    reportModalBody.innerHTML = content;

    // Инициализация графиков
    if (yearlyData) {
        const brandColors = ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(153, 102, 255, 0.6)'];

        const mainCtx = document.getElementById('yearlySalesChart')?.getContext('2d');
        if(mainCtx) {
             const mainChart = new Chart(mainCtx, {
                type: 'line',
                data: {
                    labels: yearlyData.months,
                    datasets: [{
                        label: 'Все продажи, usd',
                        data: yearlyData.monthlyTotals,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
            reportCharts.push(mainChart);
        }

        yearlyData.brandsData.forEach((brand, index) => {
            const salesCount = brand.monthlySales.filter(amount => amount > 0).length;
            if(salesCount < 2) return;

            const miniCtx = document.getElementById(`mini-chart-brand-${index}`)?.getContext('2d');
            if (miniCtx) {
                const miniChart = new Chart(miniCtx, {
                    type: 'bar',
                    data: {
                        labels: yearlyData.months,
                        datasets: [{
                            label: 'Продажи, usd',
                            data: brand.monthlySales,
                            backgroundColor: brandColors[index % brandColors.length]
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
                reportCharts.push(miniChart);
            }
        });
    }
}
       // --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---Новый блок для отчета за год
function processYearlySalesData(yearlyReport) {
    if (!yearlyReport || !yearlyReport.brands || yearlyReport.brands.length === 0) return null;

    const salesByBrandMonth = {};
    const allMonths = new Set();

    yearlyReport.brands.forEach(brand => {
        salesByBrandMonth[brand.brandName] = {};
        brand.salesByMonth.forEach(sale => {
            allMonths.add(sale.month);
            salesByBrandMonth[brand.brandName][sale.month] = sale.amount;
        });
    });

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
        const [aMonth, aYear] = a.split(' ');
        const [bMonth, bYear] = b.split(' ');
        return new Date(aYear, monthNames.indexOf(aMonth)) - new Date(bYear, monthNames.indexOf(bMonth));
    });

    let brandsData = Object.keys(salesByBrandMonth).map(brandName => {
        const monthlySales = sortedMonths.map(monthKey => salesByBrandMonth[brandName][monthKey] || 0);
        return {
            brandName,
            monthlySales,
            total: monthlySales.reduce((sum, val) => sum + val, 0)
        };
    });

    // --- ДОБАВЛЕНА СОРТИРОВКА БРЕНДОВ ---
    brandsData.sort((a, b) => b.total - a.total);

    const monthlyTotals = sortedMonths.map((monthKey, index) => {
        return brandsData.reduce((sum, brand) => sum + brand.monthlySales[index], 0);
    });

    return {
        months: sortedMonths,
        brandsData: brandsData,
        monthlyTotals: monthlyTotals,
        grandTotal: yearlyReport.grandTotal
    };
}
