// ══════════════════════════════════════════════
// MEETINGS — meeting list, actions, forms, timers
// Depends on: utils.js, dashboard.js (currentPeriod)
// Globals used from app.js: currentUser, allMeetings, currentEditingMeeting,
//   activeMeetingId, datePicker, phoneMask, meetingsList, isSearchMode,
//   outcomeModal, rescheduleModal, completeConfirmModal, HIDDEN_CLASS,
//   loadInitialData (self), showAddForm (app.js)
// ══════════════════════════════════════════════

    function handleDatePresetClick(preset) {
        if (preset === 'today') {
            isSearchMode = false;
            document.getElementById('searchInput1').value = '';
        }
        const today = new Date();
        let startDate, endDate;
        switch (preset) {
            case 'today': startDate = endDate = today; break;
            case 'tomorrow':
                const tomorrow = new Date();
                tomorrow.setDate(today.getDate() + 1);
                startDate = endDate = tomorrow;
                break;
            case 'this-week':
                const firstDayOfWeek = new Date(today);
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                firstDayOfWeek.setDate(diff);
                startDate = firstDayOfWeek;
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'last-week':
                const lastWeekStart = new Date(today);
                const dayLW = today.getDay();
                const diffLW = today.getDate() - dayLW - 6;
                lastWeekStart.setDate(diffLW);
                startDate = lastWeekStart;
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'this-month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'last-month':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
        }
        if (startDate && endDate) {
            datePicker.setDateRange(startDate, endDate);
            document.getElementById('date-preset-btn').textContent = document.querySelector(`.dropdown-item[data-range="${preset}"]`).textContent;
        }
    }

    function loadInitialData(startDateString, endDateString) {
        isSearchMode = false;
        document.getElementById('searchInput1').value = '';
        document.getElementById('date-preset-btn').textContent = 'Сегодня';
        let skeletonHTML = '';
        for (let i = 0; i < 4; i++) {
            skeletonHTML += '<div class="col-12 col-md-6"><div class="skeleton-card"></div></div>';
        }
        meetingsList.innerHTML = skeletonHTML;
        const payload = { login: currentUser, startDateString, endDateString };
        callApi('getInitialData', payload)
            .then(onDataLoaded)
            .catch(err => {
                onFailure(err);
                meetingsList.innerHTML = `<div class="col-12 text-center p-5 bg-light rounded-3"><h4>Не удалось загрузить встречи</h4><p class="text-muted">${err.message}</p><button class="btn btn-primary btn-sm" onclick="loadInitialData('${startDateString}', '${endDateString}')">Попробовать снова</button></div>`;
            });
    }
    function onDataLoaded(data) {
        allMeetings = data.meetings || [];
        questions = data.questions || [];
        potentialCategories = data.potentialCategories || [];
        populatePurposes(data.purposes);
        updateDashboardWidgets();
        filterAndGroupMeetings();
    }
    async function performGlobalSearch() {
        const searchInput = document.getElementById('searchInput1');
        const searchTerm = searchInput.value;
        if (searchTerm.length < 3) {
            if (searchTerm.length === 0) {
                document.getElementById('date-preset-btn').click();
            } else {
                showToast("Введите минимум 3 символа для поиска.");
            }
            return;
        }
        const resultsContainer = document.getElementById('clientHistorySearchResult');
        resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div></div>';
        clientHistorySearchModal.show();
        try {
            const result = await callApi('findClient', { searchTerm: searchTerm, managerLogin: currentUser });
            if (result && result.found && result.clients && result.clients.length > 0) {
                const clientsHtml = result.clients.map(client => {
                    const isForeignClient = !client.isMine;
                    const disabledClass = isForeignClient ? 'disabled list-group-item-light' : '';
                    const titleText = isForeignClient ? `Закреплен за: ${client.managerName || 'другой менеджер'}` : 'Посмотреть историю встреч';
                    return `<a href="#" class="list-group-item list-group-item-action js-select-client-for-history ${disabledClass}" data-client-id="${client.ClientID}" data-client-name="${client.clientName}" title="${titleText}"><strong>${client.clientName}</strong><small class="text-muted d-block">Менеджер: ${client.managerName || 'Не назначен'}</small></a>`;
                }).join('');
                resultsContainer.innerHTML = `<div class="list-group">${clientsHtml}</div>`;
            } else {
                resultsContainer.innerHTML = `<div class="alert alert-warning">Клиенты не найдены.</div>`;
            }
        } catch (e) {
            onFailure(e);
            resultsContainer.innerHTML = `<div class="alert alert-danger">Ошибка поиска: ${e.message}</div>`;
        }
    }
    function populatePurposes(purposes) {
        const purposeSelect = document.getElementById('purpose');
        purposeSelect.innerHTML = '<option value="">-- Выберите цель --</option>';
        if (purposes && Array.isArray(purposes)) {
            purposes.forEach(p => {
                purposeSelect.innerHTML += `<option value="${p.Purpose}">${p.Purpose}</option>`;
            });
        }
    }
function updateDashboardWidgets() {
    const widgetsContainer = document.getElementById('dashboard-widgets');
    if (!widgetsContainer) return;
    const startDate = datePicker.getStartDate()?.toJSDate();
    const endDate = datePicker.getEndDate()?.toJSDate();
    if (!startDate || !endDate) return;

    // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Вся логика теперь использует ЕДИНЫЙ источник данных `meetingsForPeriod` ---

    // 1. Сначала фильтруем ВСЕ встречи, которые попадают в выбранный диапазон дат.
    const meetingsForPeriod = allMeetings.filter(m => {
        const dateParts = m.Date.split('.');
        const meetingDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        const startDateWithoutTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateWithoutTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return meetingDate >= startDateWithoutTime && meetingDate <= endDateWithoutTime;
    });

    // 2. Теперь считаем все виджеты на основе этого отфильтрованного списка `meetingsForPeriod`.
    const totalValue = meetingsForPeriod.length;

    const completedForPeriod = meetingsForPeriod.filter(m => m.Status === 'Завершена' || m.Status === 'Завершено').length;

    const now = new Date();
    const overdueForPeriod = meetingsForPeriod.filter(m => {
        const dateParts = m.Date.split('.');
        const timeParts = m.Time.split(':');
        const meetingDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
        return meetingDate < now && (m.Status === 'В работе' || m.Status === 'Запланировано');
    }).length;

    // 3. Определяем подпись для виджета "Всего"
    const today = new Date();
    const isTodayView = startDate.toDateString() === today.toDateString() && endDate.toDateString() === today.toDateString();
    const totalLabel = isTodayView ? "Сегодня" : "Всего";

    // 4. Отображаем результат
    widgetsContainer.innerHTML = `
        <div class="col-4">
            <div class="stat-widget s-all">
                <div class="stat-val">${totalValue}</div>
                <div class="stat-lbl">${totalLabel}</div>
            </div>
        </div>
        <div class="col-4">
            <div class="stat-widget s-done">
                <div class="stat-val">${completedForPeriod}</div>
                <div class="stat-lbl">Завершено</div>
            </div>
        </div>
        <div class="col-4">
            <a href="#" id="widget-overdue-filter" class="stat-widget s-over" style="display:block;text-decoration:none;color:inherit;">
                <div class="stat-val">${overdueForPeriod}</div>
                <div class="stat-lbl">Прострочено</div>
            </a>
        </div>`;
}

function filterAndGroupMeetings() {
    const searchTerm = document.getElementById('searchInput1').value.toLowerCase();
    const filtered = allMeetings.filter(m => m.Client.toLowerCase().includes(searchTerm));
    const dateGroups = {};
    const validStatuses = ['В работе', 'Запланировано', 'Завершена', 'Завершено', 'Отмена', 'Отменено', 'Просрочено'];
    filtered.forEach(m => {
        let status = m.Status ? m.Status.trim() : '';
        if (status === 'Завершено') status = 'Завершена';
        if (status === 'Отменено') status = 'Отмена';
        if (status === 'Перенос') status = 'В работе';
        if (!validStatuses.includes(status)) status = 'В работе';
        if (!dateGroups[m.Date]) {
            dateGroups[m.Date] = { 'В работе': [], 'Запланировано': [], 'Завершена': [], 'Отмена': [], 'Просрочено': [] };
        }
        (dateGroups[m.Date][status] || dateGroups[m.Date]['В работе']).push(m);
    });

    meetingsList.innerHTML = '';
    const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(b.split('.').reverse().join('-')) - new Date(a.split('.').reverse().join('-')));
    if (sortedDates.length === 0) {
        let emptyMessage = isSearchMode ? `<h4>Встреч по этому клиенту не найдено</h4><p class="text-muted">Попробуйте другой поисковый запрос.</p>` : `<h4>Встреч не найдено</h4><p class="text-muted">На этот день встреч нет. Давайте создадим первую!</p><button class="btn btn-primary mt-2" id="emptyStateCreateBtn">Создать встречу</button>`;
        meetingsList.innerHTML = `<div class="col-12 text-center p-5"><i class="bi bi-calendar-x" style="font-size: 4rem; color: #6c757d;"></i>${emptyMessage}</div>`;
        if (!isSearchMode) {
            document.getElementById('emptyStateCreateBtn').addEventListener('click', showAddForm);
        }
        return;
    }

    sortedDates.forEach(date => {
        const totalForDate = Object.values(dateGroups[date]).flat().length;
        const dateTitle = document.createElement('div');
        dateTitle.className = 'col-12 group-header';
        dateTitle.innerHTML = `<span class="group-date">${date}</span><span class="group-count">${totalForDate}</span><div class="group-line"></div>`;
        meetingsList.appendChild(dateTitle);
        const groups = dateGroups[date];
        const groupOrder = ['Просрочено', 'В работе', 'Запланировано', 'Завершена', 'Отмена'];
        groupOrder.forEach(status => {
            if (groups[status] && groups[status].length > 0) {
                groups[status].sort((a, b) => a.Time.localeCompare(b.Time)).forEach(m => {
                    const cleanStatus = m.Status ? m.Status.trim() : '';
                    const isActive = cleanStatus !== 'Завершена' && cleanStatus !== 'Завершено' && cleanStatus !== 'Отмена' && cleanStatus !== 'Отменено' && cleanStatus !== 'Просрочено';
                    const activeTimers = JSON.parse(localStorage.getItem('activeTimers')) || {};
                    const isMeetingRunning = !!activeTimers[m.ID];

                    // — State button (new style) —
                    let stateButtonHtml = '';
                    if (isActive) {
                        if (isMeetingRunning) {
                            const initialElapsedTime = formatElapsedTime(Date.now() - activeTimers[m.ID].startTime);
                            stateButtonHtml = `<button class="card-btn card-btn-primary js-state-toggle-btn" data-id="${m.ID}" style="background:var(--red);border-color:var(--red);">
                                <i class="bi bi-stop-circle"></i> Завершити (<span class="timer" data-start-time="${activeTimers[m.ID].startTime}">${initialElapsedTime}</span>)
                            </button>`;
                        } else {
                            stateButtonHtml = `<button class="card-btn card-btn-primary js-state-toggle-btn" data-id="${m.ID}">
                                <i class="bi bi-play-circle"></i> Старт
                            </button>`;
                        }
                    }

                    // — Inline action buttons (no dropdown) —
                    let extraActions = `<a href="#" class="card-btn outcome-btn" data-id="${m.ID}"><i class="bi bi-card-checklist"></i> Підсумки</a>`;
                    if (isActive && !isMeetingRunning) {
                        extraActions += `<a href="#" class="card-btn reschedule-btn" data-id="${m.ID}"><i class="bi bi-arrow-repeat"></i> Перенести</a>`;
                    }

                    // — Status stripe & badge mapping —
                    const stripeMap = { 'В работе': 'orange', 'Запланировано': 'blue', 'Завершена': 'green', 'Отмена': 'gray', 'Просрочено': 'red' };
                    const badgeMap  = { 'В работе': 'work', 'Запланировано': 'plan', 'Завершена': 'done', 'Отмена': 'cancel', 'Просрочено': 'over' };
                    const statusLabels = { 'В работе': 'В роботі', 'Запланировано': 'Заплановано', 'Завершена': 'Завершено', 'Отмена': 'Скасовано', 'Просрочено': 'Прострочено' };
                    const stripe = stripeMap[cleanStatus] || 'gray';
                    const badgeCls = badgeMap[cleanStatus] || 'cancel';
                    const statusLabel = statusLabels[cleanStatus] || cleanStatus;

                    // — Category inline badge —
                    let catBadge = '';
                    if (m.ClientCategory) {
                        const catColor = getCategoryColor(m.ClientCategory);
                        catBadge = `<span class="card-cat-badge" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44">${m.ClientCategory}</span>`;
                    }

                    const cardWrapper = document.createElement('div');
                    cardWrapper.className = "col-12";
                    cardWrapper.innerHTML = `
                        <div class="meeting-card card-${stripe}">
                            <div class="card-stripe stripe-${stripe}"></div>
                            <div class="card-body-new">
                                <div class="card-head">
                                    <div class="card-name">${m.Time} · ${m.Client}${catBadge}</div>
                                    <span class="badge badge-${badgeCls}">${statusLabel}</span>
                                </div>
                                <div class="card-meta-row">
                                    <span class="meta-item"><i class="bi bi-telephone"></i> ${m.Phone ? `<a href="tel:+${m.Phone.replace(/\D/g,'')}" style="color:inherit;text-decoration:none;">${m.Phone}</a>` : '—'}</span>
                                    <span class="meta-item"><i class="bi bi-geo-alt"></i> ${m.StartAddress || m.PlannedAddress || '—'}</span>
                                </div>
                                <div class="card-purpose-text">${m.Purpose || 'Мета не вказана'}</div>
                                <div class="card-footer-new">
                                    ${stateButtonHtml}
                                    <a href="#" class="card-btn edit-btn" data-id="${m.ID}"><i class="bi bi-pencil"></i> Редагувати</a>
                                    <button class="card-btn report-btn-icon" data-client-id="${m.ClientID}" data-client-name="${m.Client}"><i class="bi bi-bar-chart"></i> Звіт</button>
                                    ${extraActions}
                                </div>
                            </div>
                        </div>`;
                    meetingsList.appendChild(cardWrapper);
                });
            }
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
    document.querySelectorAll('.js-state-toggle-btn').forEach(btn => btn.addEventListener('click', handleMeetingStateToggle));
    document.querySelectorAll('.reschedule-btn').forEach(btn => btn.addEventListener('click', handleRescheduleClick));
    document.querySelectorAll('.outcome-btn').forEach(btn => btn.addEventListener('click', handleOutcomeClick));
}

function handleFormSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-button');
    toggleButtonSpinner(saveBtn, true);

    const meetingId = document.getElementById('meeting-id').value;
    const isUpdating = !!meetingId;

    const meetingData = {
        ClientID: document.getElementById('client-id').value,
        Date: document.getElementById('meeting-date').value.split('-').reverse().join('.'),
        Time: document.getElementById('meeting-time').value,
        Client: document.getElementById('client-name').value,
        Purpose: document.getElementById('purpose').value,
        Phone: phoneMask.unmaskedValue,
        Status: document.getElementById('status').value,
        ManagerLogin: currentUser,
        Comment: isUpdating && currentEditingMeeting ? currentEditingMeeting.Comment : '',
        PlannedAddress: document.getElementById('planned-meeting-address').value
    };

    if (isUpdating) {
        meetingData.ID = meetingId;
        if (currentEditingMeeting) {
            meetingData.calendarEventId = currentEditingMeeting.calendarEventId;

            // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Упаковываем данные в объекты ---
            // Собираем данные о геолокации старта в объект, как этого ожидает 1С
            meetingData.locationData = {
                address: currentEditingMeeting.StartAddress || "",
                lat: currentEditingMeeting.StartLatitude || "",
                lon: currentEditingMeeting.StartLongitude || ""
            };
            // Собираем данные о геолокации завершения в объект
            meetingData.endLocationData = {
                address: currentEditingMeeting.EndAddress || "",
                lat: currentEditingMeeting.EndLatitude || "",
                lon: currentEditingMeeting.EndLongitude || ""
            };
        }
    }

    const action = isUpdating ? 'updateMeeting' : 'saveNewMeeting';
    const payload = isUpdating ? { newData: meetingData, oldData: currentEditingMeeting } : meetingData;

    callApi(action, payload).then(() => {
        showToast(`Встреча с клиентом "${meetingData.Client}" на ${meetingData.Time} успешно сохранена.`);
        loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
        onActionComplete();
    }).catch(onFailure).finally(() => {
        toggleButtonSpinner(saveBtn, false);
    });
}
    function handleEditClick(event) {
    event.preventDefault();
    const meetingId = event.currentTarget.dataset.id;
    currentEditingMeeting = allMeetings.find(m => m.ID === meetingId);
    if (!currentEditingMeeting) return;

    document.getElementById('form-title').textContent = "Редактирование встречи";
    document.getElementById('meeting-id').value = currentEditingMeeting.ID;
    document.getElementById('client-id').value = currentEditingMeeting.ClientID;
    document.getElementById('client-category').value = currentEditingMeeting.ClientCategory || '';
    document.getElementById('client-autocomplete-results').innerHTML = '';
    const dateParts = currentEditingMeeting.Date.split('.');
    document.getElementById('meeting-date').value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    document.getElementById('meeting-time').value = currentEditingMeeting.Time;
    document.getElementById('client-name').value = currentEditingMeeting.Client;
    document.getElementById('purpose').value = currentEditingMeeting.Purpose;
    document.getElementById('phone').value = currentEditingMeeting.Phone;
    if (phoneMask) phoneMask.updateValue();
    document.getElementById('location').value = currentEditingMeeting.ClientAddress || '';
    document.getElementById('planned-meeting-address').value = currentEditingMeeting.PlannedAddress || ''; // <-- ДОБАВЛЕНА ЭТА СТРОКА
    document.getElementById('meeting-location').value = currentEditingMeeting.StartAddress || currentEditingMeeting.Location || '';
    document.getElementById('meeting-lat').value = currentEditingMeeting.StartLatitude || currentEditingMeeting.LocationLat || '';
    document.getElementById('meeting-lon').value = currentEditingMeeting.StartLongitude || currentEditingMeeting.LocationLon || '';
    document.getElementById('status').value = currentEditingMeeting.Status || 'В работе';
        //Кнопка определения гео
        //const geoButton = document.getElementById('get-meeting-location-btn');
        //const status = currentEditingMeeting.Status ? currentEditingMeeting.Status.trim() : '';
        //if (status === 'Завершена' || status === 'Завершено' || status === 'Отмена' || status === 'Отменено') {
            //geoButton.classList.add('d-none');
        //} else {
            //geoButton.classList.remove('d-none');

        showForm(true);
    }

// НОВАЯ ФУНКЦИЯ ВМЕСТО handleCompleteClick
async function handleMeetingStateToggle(event) {
    const btn = event.target.closest('.js-state-toggle-btn');
    if (!btn) return;

    toggleButtonSpinner(btn, true);
    const meetingId = btn.dataset.id;
    const meeting = allMeetings.find(m => m.ID === meetingId);
    if (!meeting) {
        toggleButtonSpinner(btn, false);
        return;
    }

    const activeTimers = JSON.parse(localStorage.getItem('activeTimers')) || {};
    const isMeetingRunning = !!activeTimers[meetingId];

    try {
        if (isMeetingRunning) {
            // --- Логика ЗАВЕРШЕНИЯ встречи ---
            showToast("Фиксируем геолокацию завершения...");
            const locationData = await getAddressFromGeolocation();

            const oldData = meeting;
            const newData = { ...oldData, Status: 'Завершено', endLocationData: locationData };
            await callApi('updateMeeting', { newData, oldData });

            delete activeTimers[meetingId];
            localStorage.setItem('activeTimers', JSON.stringify(activeTimers));

            showToast("Встреча успешно завершена");
            loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));

        } else {
            // --- Логика СТАРТА встречи ---
            showToast("Фиксируем геолокацию старта...");
            const locationData = await getAddressFromGeolocation();

            await callApi('startMeeting', { meetingId: meetingId, locationData: locationData });

            activeTimers[meetingId] = { startTime: Date.now() };
            localStorage.setItem('activeTimers', JSON.stringify(activeTimers));

            showToast("Встреча начата");
            loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
        }
    } catch (e) {
        // --- БЛОК ОБРАБОТКИ ОШИБКИ ГЕОЛОКАЦИИ ---
        if (confirm(`Не удалось получить геолокацию. Ошибка: ${e.message}\n\nПродолжить без фиксации координат?`)) {
            try {
                if (isMeetingRunning) {
                    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
                    const newData = { ...meeting, Status: 'Завершено', endLocationData: null }; // Добавляем endLocationData: null
                    await callApi('updateMeeting', { newData: newData, oldData: meeting });
                    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

                    delete activeTimers[meetingId];
                    localStorage.setItem('activeTimers', JSON.stringify(activeTimers));
                    showToast("Встреча завершена (без Geo)");
                } else {
                    await callApi('startMeeting', { meetingId: meetingId, locationData: null }); // Отправляем startMeeting с null
                    activeTimers[meetingId] = { startTime: Date.now() };
                    localStorage.setItem('activeTimers', JSON.stringify(activeTimers));
                    showToast("Встреча начата (без Geo)");
                }
                loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
            } catch (apiError) {
                onFailure(apiError);
                toggleButtonSpinner(btn, false);
            }
        } else {
            toggleButtonSpinner(btn, false);
        }
    }
}
    function handleRescheduleClick(event) {
        const meetingId = event.target.dataset.id;
        const meetingData = allMeetings.find(m => m.ID === meetingId);
        if (!meetingData) return;
        currentEditingMeeting = meetingData;
        rescheduleModal.show();
    }
    async function handleSaveReschedule() {
        const newDate = document.getElementById('newMeetingDate').value;
        const newTime = document.getElementById('newMeetingTime').value;
        const errorDiv = document.getElementById('rescheduleError');
        if (!newDate || !newTime) {
            errorDiv.textContent = 'Пожалуйста, укажите дату и время.';
            errorDiv.classList.remove('d-none');
            return;
        }
        errorDiv.classList.add('d-none');
        const saveBtn = document.getElementById('saveRescheduleBtn');
        toggleButtonSpinner(saveBtn, true);
        try {
            const oldData = currentEditingMeeting;
            const newData = { ...currentEditingMeeting };
            newData.Comment = `Перенесена со старой даты ${oldData.Date}`;
            newData.Date = newDate.split('-').reverse().join('.');
            newData.Time = newTime;
            newData.Status = 'В работе';
            await callApi('updateMeeting', { newData, oldData });
            showToast("Встреча успешно перенесена");
            rescheduleModal.hide();
            onActionComplete();
            loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
        } catch (error) {
            onFailure(error);
        } finally {
            toggleButtonSpinner(saveBtn, false);
        }
    }
    // ЗАМЕНИТЕ СТАРЫЕ ФУНКЦИИ НА ЭТИ ДВЕ

// ЗАМЕНИТЕ ВАШУ ФУНКЦИЮ НА ЭТУ
// Новая логика для модального окна "Итоги встречи"
function handleOutcomeClick(event) {
    activeMeetingId = event.target.closest('[data-id]').dataset.id;
    const meeting = allMeetings.find(m => m.ID === activeMeetingId);
    if (!meeting) return;

    // Сбрасываем форму перед открытием
    const form = document.getElementById('outcome-survey-form');
    form.reset();
    form.querySelectorAll('.survey-details').forEach(el => el.classList.add('d-none'));

    // Заполняем общий комментарий
    document.getElementById('meetingComment').value = meeting.Comment || '';

    // Заполняем анкету из данных КЛИЕНТА (AnketaDataJSON), а не встречи
    if (meeting.AnketaDataJSON) {
        try {
            const surveyData = JSON.parse(meeting.AnketaDataJSON);
            populateSurveyForm(surveyData);
        } catch(e) { console.error("Ошибка чтения данных анкеты:", e); }
    }

    outcomeModal.show();
}

function handleSaveOutcome() {
    const btn = document.getElementById('saveOutcomeBtn');
    toggleButtonSpinner(btn, true);

    const meeting = allMeetings.find(m => m.ID === activeMeetingId);
    if (!meeting) {
        onFailure(new Error("Не удалось найти активную встречу для сохранения."));
        toggleButtonSpinner(btn, false);
        return;
    }

    // --- Действие 1: Подготовка данных АНКЕТЫ ---
    const surveyData = {};
    const form = document.getElementById('outcome-survey-form');
    form.querySelectorAll('[data-question]').forEach(el => {
        const path = el.dataset.question.split('.');
        let currentLevel = surveyData;
        path.forEach((key, index) => {
            if (index === path.length - 1) {
                if (el.type === 'checkbox') {
                    if (!currentLevel[key]) currentLevel[key] = [];
                    if (el.checked) currentLevel[key].push(el.value);
                } else if (el.type === 'radio') {
                    if (el.checked) currentLevel[key] = el.value;
                } else {
                    if (el.value) currentLevel[key] = el.value;
                }
            } else {
                if (!currentLevel[key]) currentLevel[key] = {};
                currentLevel = currentLevel[key];
            }
        });
    });
    const surveyPayload = {
        clientID: meeting.ClientID,
        surveyData: JSON.stringify(surveyData)
    };
    const saveSurveyPromise = callApi('saveClientSurvey', surveyPayload);


    // --- Действие 2: Подготовка данных КОММЕНТАРИЯ встречи ---
    const comment = document.getElementById('meetingComment').value;
    let saveCommentPromise = Promise.resolve();

    if (comment !== meeting.Comment) {
        const oldData = meeting;

        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Собираем ПОЛНЫЙ объект newData ---
        const newData = { ...meeting, Comment: comment };

        // Явно добавляем недостающие вложенные объекты, которые ожидает сервер
        newData.locationData = {
            address: meeting.StartAddress || "",
            lat: meeting.StartLatitude || "",
            lon: meeting.StartLongitude || ""
        };
        newData.endLocationData = {
            address: meeting.EndAddress || "",
            lat: meeting.EndLatitude || "",
            lon: meeting.EndLongitude || ""
        };
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        const commentPayload = { newData, oldData };
        saveCommentPromise = callApi('updateMeeting', commentPayload);
    }

    // --- Выполняем оба запроса параллельно ---
    Promise.all([saveSurveyPromise, saveCommentPromise])
        .then(() => {
            showToast("Итоги встречи успешно сохранены");
            loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
        })
        .catch(onFailure)
        .finally(() => {
            toggleButtonSpinner(btn, false);
            outcomeModal.hide();
        });
}

// Новая функция для заполнения формы из сохраненных данных
function populateSurveyForm(data) {
    const form = document.getElementById('outcome-survey-form');
    // Обходим все ключи верхнего уровня (например, "Общая информация", "Портфель")
    Object.keys(data).forEach(mainKey => {
        const mainValue = data[mainKey];
        // Обходим все под-ключи (например, "Стаж работы", "Процедуры")
        Object.keys(mainValue).forEach(subKey => {
            const nestedValue = mainValue[subKey];
            const questionPath = `${mainKey}.${subKey}`;

            // Обрабатываем вложенные объекты (как в "Портфеле")
            if (typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
                Object.keys(nestedValue).forEach(brandKey => {
                    const brandValue = nestedValue[brandKey];
                    const brandPath = `${questionPath}.${brandKey}`;
                    form.querySelectorAll(`[data-question="${brandPath}"]`).forEach(el => setFieldValue(el, brandValue));
                });
            } else {
                // Обрабатываем простые значения и массивы
                form.querySelectorAll(`[data-question="${questionPath}"]`).forEach(el => setFieldValue(el, nestedValue));
            }
        });
    });

    // Вспомогательная функция для установки значений
    function setFieldValue(el, value) {
        if (el.type === 'checkbox' || el.type === 'radio') {
            if (Array.isArray(value) ? value.includes(el.value) : value === el.value) {
                el.checked = true;
                // Триггерим событие, чтобы показать условные поля
                if (el.classList.contains('survey-trigger') || el.classList.contains('survey-trigger-next-steps')) {
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        } else {
            el.value = value;
        }
    }
}

    async function handleGetLocationClick() {
        const btn = document.getElementById('get-meeting-location-btn');
        toggleButtonSpinner(btn, true);
        try {
            const { address, lat, lon } = await getAddressFromGeolocation();
            document.getElementById('meeting-location').value = address;
            document.getElementById('meeting-lat').value = lat;
            document.getElementById('meeting-lon').value = lon;
            showToast("Геолокация определена");
        } catch (error) {
            alert(error.message);
        } finally {
            toggleButtonSpinner(btn, false);
        }
    }
    async function handleGeoClick(event) {
        const btn = event.target;
        toggleButtonSpinner(btn, true);
        const meetingId = btn.dataset.id;
        const oldData = allMeetings.find(m => m.ID === meetingId);
        if (!oldData) return;
        try {
            const { address, lat, lon } = await getAddressFromGeolocation();
            const newData = { ...oldData, Location: address, LocationLat: lat, LocationLon: lon };
            await callApi('updateMeeting', { newData, oldData });
            showToast("Геолокация сохранена");
            loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
        } catch (error) {
            alert(error.message);
        } finally {
            toggleButtonSpinner(btn, false);
        }
    }
    async function getAddressFromGeolocation() {
        if (!navigator.geolocation) throw new Error("Геолокация не поддерживается");
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    if (!response.ok) return reject(new Error('Ошибка сети'));
                    const data = await response.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const address = [addr.road, addr.house_number, addr.city || addr.town].filter(Boolean).join(', ');
                        resolve({ address, lat, lon });
                    } else {
                        reject(new Error("Адрес не найден"));
                    }
                } catch (e) {
                    reject(new Error("Не удалось получить адрес"));
                }
            }, () => reject(new Error("Нет доступа к геолокации")), { timeout: 10000 });
        });
    }
