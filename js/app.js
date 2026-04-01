    // app.js — meetings, clients, auth, dashboard, reports
    // utils.js — API, formatters, router
    // mock-data.js — MOCK_ constants
    // orders.js — orders module
    // debtors.js — debtors module

    const HIDDEN_CLASS = 'd-none';

    let currentUser = null, allMeetings = [], allClients = [], currentEditingMeeting = null;
    let meetingToReschedule = null, activeMeetingId = null;
    let questions = [], potentialCategories = [];
    let adminCharts = {};
    let searchTimeout = null;
    let isSearchMode = false;
    let meetingToCompleteId = null;
    let completeConfirmModal;
       let newClientPhoneMask;
       let reportCharts = [];
       let reportChart = null;
       
       

    // Глобальные экземпляры, которые будут инициализированы позже
    let meetingsList, rescheduleModal, cancelConfirmModal, outcomeModal, reportModal, clientSearchModal, clientHistorySearchModal, appToast;
    let datePicker, adminDatePicker, phoneMask, searchMask, clientListMask;
       
    // --- ОСНОВНОЙ БЛОК ИНИЦИАЛИЗАЦИИ ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ ---
    document.addEventListener('DOMContentLoaded', () => {
        // --- Сначала находим все нужные элементы DOM ---
        meetingsList = document.getElementById('meetings-list');
        const navButtons = document.querySelectorAll('.nav-button');
        const pages = document.querySelectorAll('.app-page');
        const headerTitle = document.getElementById('header-title');
        const header = document.querySelector('.app-header');
        const main = document.querySelector('.app-main');
        const bottomNav = document.querySelector('.app-bottom-nav');
        const loginContainer = document.getElementById('login-container');
        const bodyEl = document.querySelector('body');
        // ВСТАВЬТЕ ЭТОТ БЛОК ВНУТРЬ DOMContentLoaded
clientSearchModal = new bootstrap.Modal(document.getElementById('clientSearchModal'));

const clientSearchInputEl = document.getElementById('clientSearchInput');
searchMask = IMask(clientSearchInputEl, {
    mask: [ { mask: '+{38} (000) 000-00-00', startsWith: '38', lazy: false }, { mask: /.*/ } ]
});

document.getElementById('clientSearchBtn').addEventListener('click', handleClientSearch);
document.getElementById('clientSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleClientSearch();
});
// ВСТАВЬТЕ ЭТОТ КОД ВНУТРЬ DOMContentLoaded

// Логика для условного отображения под-вопросов в анкете
// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
const surveyForm = document.getElementById('outcome-survey-form');
if (surveyForm) {
    surveyForm.addEventListener('change', (e) => {
        // ЕДИНАЯ ЛОГИКА ДЛЯ ВСЕХ УСЛОВНЫХ БЛОКОВ
        if (e.target.classList.contains('survey-trigger')) {
            const subPanelId = e.target.dataset.controls;
            const subPanel = document.getElementById(subPanelId);
            if (subPanel) {
                subPanel.classList.toggle('d-none', !e.target.checked);
            }
        }
    });
}
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
// ВСТАВЬТЕ ЭТОТ НОВЫЙ БЛОК
const globalSearchTriggerBtn = document.getElementById('global-search-trigger-btn');
if (globalSearchTriggerBtn) {
    globalSearchTriggerBtn.addEventListener('click', () => {
        // Очищаем и показываем модальное окно для глобального поиска
        document.getElementById('clientSearchInput').value = '';
        document.getElementById('clientSearchResult').innerHTML = '';
        if (searchMask) searchMask.updateValue();
        clientSearchModal.show();
    });
}
        // ВСТАВЬТЕ ЭТОТ БЛОК ВНУТРЬ DOMContentLoaded

// --- Логика для новой формы создания клиента ---
const newClientPhoneInput = document.getElementById('new-client-phone');
newClientPhoneMask = IMask(newClientPhoneInput, { mask: '+{38} (000) 000-00-00' });

document.getElementById('show-add-client-form-btn').addEventListener('click', () => {
    document.getElementById('add-client-form').reset();
     // --- ДОБАВЬТЕ ЭТУ СТРОКУ ---
    if (newClientPhoneMask) newClientPhoneMask.updateValue(); // Синхронизируем маску
    document.querySelector('.nav-button[data-page="clients"]').click(); // Активируем кнопку "Клиенты"
    switchPage('add-client'); // Показываем страницу с формой
    headerTitle.textContent = "Новый клиент"; // Меняем заголовок
});

document.getElementById('cancel-new-client-btn').addEventListener('click', () => {
    document.querySelector('.nav-button[data-page="clients"]').click(); // Возвращаемся на страницу "Клиенты"
});

document.getElementById('add-client-form').addEventListener('submit', handleSaveNewClient);
      

// Обработчик для кликов по фильтрам категорий
const filtersContainer = document.getElementById('client-category-filters');
if (filtersContainer) {
    filtersContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            // Убираем класс 'active' со всех кнопок и добавляем на нажатую
            filtersContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active', 'btn-primary'));
            e.target.classList.add('active');

            const selectedCategory = e.target.dataset.category;
            
            let filteredClients;
            if (selectedCategory === 'all') {
                filteredClients = allClients; // Показываем всех
            } else if (selectedCategory === 'Без категории') {
                filteredClients = allClients.filter(c => !c.ClientCategory);
            } else {
                filteredClients = allClients.filter(c => c.ClientCategory === selectedCategory);
            }
            
            renderClientList(filteredClients); // Перерисовываем список
        }
    });
}

// Логика для условных полей в анкете
const outcomeModalEl = document.getElementById('outcomeModal');
outcomeModalEl.addEventListener('change', (e) => {
    // Показываем/скрываем поле "Кількість спеціалістів"
    if (e.target.id === 'workTypeOwner') {
        document.getElementById('specialistCountContainer').classList.remove('d-none');
    } else if (e.target.name === 'workType' && e.target.id !== 'workTypeOwner') {
        document.getElementById('specialistCountContainer').classList.add('d-none');
    }

    // Показываем/скрываем поля для комментариев (для екзосом, PLLA, волосся)
    if (e.target.name === 'usesExosomes' || e.target.name === 'usesPLLA' || e.target.name === 'usesHair') {
        const commentField = e.target.closest('.p-2.border.rounded').querySelector('textarea');
        if (e.target.value === 'Так') {
            commentField.classList.remove('d-none');
        } else {
            commentField.classList.add('d-none');
        }
    }
});
        /// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
const clientListFilterInput = document.getElementById('client-list-filter');
clientListMask = IMask(clientListFilterInput, {
    mask: [
        {
            mask: '+{38} (000) 000-00-00',
            lazy: true // Не показывать маску сразу
        },
        {
            mask: /.*/ // Маска для любого текста (для ФИО)
        }
    ],
    // Эта функция решает, какую маску применить
    dispatch: function (appended, dynamicMasked) {
        const value = dynamicMasked.value + appended;
        // Если в строке появляется хотя бы одна цифра, переключаемся на маску телефона
        if (/\d/.test(value)) {
            return dynamicMasked.compiledMasks[0]; // Выбираем маску телефона
        }
        // Иначе, используем маску для обычного текста
        return dynamicMasked.compiledMasks[1]; // Выбираем текстовую маску
    }
});
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---

        // --- Затем определяем функции, которые с ними работают ---
        function showMainApp(show) {
            if (!header || !main || !bottomNav || !loginContainer || !bodyEl) {
                console.error('Ошибка: Один из ключевых элементов макета не найден!');
                return;
            }
            if (show) {
                header.classList.remove('d-none');
                main.classList.remove('d-none');
                bottomNav.classList.remove('d-none');
                loginContainer.classList.add('d-none');
            } else {
                header.classList.add('d-none');
                main.classList.add('d-none');
                bottomNav.classList.add('d-none');
                loginContainer.classList.remove('d-none');
            }
            bodyEl.classList.remove('d-none');
        }
        window.showMainApp = showMainApp;

        function switchPage(pageId) {
            pages.forEach(page => page.classList.toggle('active', page.id === `page-${pageId}`));
            navButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.page === pageId);
                if (button.dataset.page === pageId) {
                    const buttonText = button.querySelector('span').textContent;
                    headerTitle.textContent = buttonText;
                }
            });
        }

        // --- Инициализация Bootstrap компонентов ---
        rescheduleModal = new bootstrap.Modal(document.getElementById('rescheduleModal'));
        cancelConfirmModal = new bootstrap.Modal(document.getElementById('cancelConfirmModal'));
        outcomeModal = new bootstrap.Modal(document.getElementById('outcomeModal'));
        reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
 
        clientHistorySearchModal = new bootstrap.Modal(document.getElementById('clientHistorySearchModal'));
        completeConfirmModal = new bootstrap.Modal(document.getElementById('completeConfirmModal'));
        appToast = new bootstrap.Toast(document.getElementById('appToast'));
        
        // --- Инициализация плагинов ---
        datePicker = new Litepicker({
            element: document.getElementById('dateRangeFilter'),
            singleMode: false, format: 'DD.MM.YYYY', lang: 'ru-RU',
            setup: (picker) => {
                picker.on('selected', (date1, date2) => {
                    if (date1 && date2) loadInitialData(formatDateToYYYYMMDD(date1.toJSDate()), formatDateToYYYYMMDD(date2.toJSDate()));
                });
            }
        });
        
        const phoneInput = document.getElementById('phone');
        phoneMask = IMask(phoneInput, { mask: '+{38} (000) 000-00-00' });
        
        
        
        // --- Привязка всех обработчиков событий ---
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pageId = button.dataset.page;
                switchPage(pageId);
                if (pageId === 'clients' && allClients.length === 0) {
                    loadClientsPage();
                }
                if (pageId === 'analytics') {
                    renderDashboard(currentPeriod);
                }
            });
        });

        // Period chips for analytics
        document.getElementById('period-chips')?.addEventListener('click', (e) => {
            const chip = e.target.closest('.period-chip');
            if (!chip) return;
            document.querySelectorAll('.period-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentPeriod = chip.dataset.period;
            renderDashboard(currentPeriod);
        });

        // main-add-btn is handled by initFabSheet() — action sheet overlay

        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('meeting-form').addEventListener('submit', handleFormSubmit);
        document.getElementById('cancel-btn').addEventListener('click', handleCancelClick);
        document.getElementById('confirmCancelBtn').addEventListener('click', () => {
            cancelConfirmModal.hide();
            showForm(false);
        });

        document.getElementById('todayBtn').addEventListener('click', () => document.getElementById('meeting-date').value = getTodayDateString());
        document.getElementById('tomorrowBtn').addEventListener('click', () => document.getElementById('meeting-date').value = getTomorrowDateString());
        
        const searchInputEl = document.getElementById('searchInput1');
        searchInputEl.addEventListener('input', filterAndGroupMeetings);
        searchInputEl.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') performGlobalSearch();
        });
        
        const datePresetsContainer = document.getElementById('date-presets-container');
        if (datePresetsContainer) {
            const mainPresetBtn = datePresetsContainer.querySelector('#date-preset-btn');
            const datePresetDropdown = datePresetsContainer.querySelector('.dropdown-menu');
            if (mainPresetBtn && datePresetDropdown) {
                // Style dropdown for new design
                datePresetDropdown.style.cssText = 'display:none;position:absolute;right:0;z-index:1060;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.1);min-width:180px;padding:6px;';
                datePresetsContainer.style.position = 'relative';

                mainPresetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = datePresetDropdown.style.display === 'block';
                    datePresetDropdown.style.display = isOpen ? 'none' : 'block';
                });
                document.addEventListener('click', () => { datePresetDropdown.style.display = 'none'; });
                datePresetDropdown.addEventListener('click', (e) => {
                    if (e.target.classList.contains('dropdown-item')) {
                        e.preventDefault();
                        const range = e.target.dataset.range;
                        mainPresetBtn.innerHTML = `<i class="bi bi-calendar3"></i> ${e.target.textContent}`;
                        datePresetDropdown.style.display = 'none';
                        isSearchMode = false;
                        document.getElementById('searchInput1').value = '';
                        handleDatePresetClick(range);
                    }
                });
            }
        }
        // ДОБАВЬТЕ ЭТОТ ОБРАБОТЧИК ВНУТРЬ DOMContentLoaded
document.getElementById('confirmCompleteBtn').addEventListener('click', () => {
    if (!meetingToCompleteId) return;

    const meetingIndex = allMeetings.findIndex(m => m.ID === meetingToCompleteId);
    if (meetingIndex === -1) return;

    completeConfirmModal.hide();

    const meeting = allMeetings[meetingIndex];
    const cardWrapper = document.querySelector(`.edit-btn[data-id="${meeting.ID}"]`)?.closest('.col-12');
    
    // 1. Оптимистичное обновление UI
    if (cardWrapper) {
        cardWrapper.style.opacity = '0.6';
    }
    
    const oldData = meeting;
    const newData = { ...oldData, Status: 'Завершено' };

    // 2. Фоновый запрос на сервер
    callApi('updateMeeting', { newData, oldData })
        .then(() => {
            showToast("Встреча завершена");
            // В случае успеха - просто обновляем все данные для консистентности
            loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
        })
        .catch(err => {
            onFailure(err);
            // В случае ошибки - тоже обновляем данные, чтобы вернуть карточку в исходное состояние
            loadInitialData(formatDateToYYYYMMDD(datePicker.getStartDate().toJSDate()), formatDateToYYYYMMDD(datePicker.getEndDate().toJSDate()));
        });

    meetingToCompleteId = null;
});
        
        
        document.getElementById('saveRescheduleBtn').addEventListener('click', handleSaveReschedule);
        document.getElementById('saveOutcomeBtn').addEventListener('click', handleSaveOutcome);
        document.getElementById('client-name').addEventListener('input', handleClientInput);

        // --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
const clientListFilter = document.getElementById('client-list-filter');
clientListFilter.addEventListener('input', () => {
    clearTimeout(searchTimeout); // Сбрасываем предыдущий таймер
    searchTimeout = setTimeout(() => { // Устанавливаем новый таймер
        const searchTerm = clientListFilter.value.toLowerCase();
        const searchTermDigits = searchTerm.replace(/\D/g, '');

        const filteredClients = allClients.filter(c => {
            const clientName = c.ClientName.toLowerCase();
            const clientPhone = c.Phone ? c.Phone.replace(/\D/g, '') : '';

            // Ищем или по тексту в имени, или по цифрам в телефоне
            return clientName.includes(searchTerm) || (searchTermDigits && clientPhone.includes(searchTermDigits));
        });
        
        renderClientList(filteredClients);
    }, 300); // Задержка в 300 миллисекунд
});
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---

        const logoutBtnSideMenu = document.getElementById('logout-btn-side-menu');
        if (logoutBtnSideMenu) {
            logoutBtnSideMenu.addEventListener('click', handleLogout);
        }
        const widgetsContainer = document.getElementById('dashboard-widgets');
        if (widgetsContainer) {
            widgetsContainer.addEventListener('click', (e) => {
                const overdueFilter = e.target.closest('#widget-overdue-filter');
                if (overdueFilter) {
                    e.preventDefault();
                    const now = new Date();
                    const overdueMeetings = allMeetings.filter(m => {
                        const dateParts = m.Date.split('.');
                        const timeParts = m.Time.split(':');
                        const meetingDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
                        return meetingDate < now && (m.Status === 'В работе' || m.Status === 'Запланировано');
                    });
                    
                   const originalMeetings = allMeetings;
                    allMeetings = overdueMeetings;
                    filterAndGroupMeetings();
                    allMeetings = originalMeetings;

                    isSearchMode = true; 
                    document.getElementById('date-preset-btn').textContent = 'Сбросить';
                }
            });
        }

        checkActiveSession();
    });


    // --- Единый глобальный обработчик кликов ---
    // ЗАМЕНИТЕ ВЕСЬ ВАШ ГЛОБАЛЬНЫЙ ОБРАБОТЧИК CLick НА ЭТОТ
document.addEventListener('click', function(e) {
    const target = e.target;

    // --- Обработчик для ВСЕХ кнопок "Отчет" ---
    const reportBtn = target.closest('.report-btn-icon, .js-report-from-client-list');
    if (reportBtn && !reportBtn.disabled) {
         e.preventDefault();
         if (reportBtn.closest('#clientSearchModal')) {
             clientSearchModal.hide();
         }
         handleReportClick(reportBtn); // Передаем саму кнопку
         return;
    }

    // --- Остальные обработчики ---
    const selectClientBtn = target.closest('.js-select-client-for-history');
    if (selectClientBtn && !selectClientBtn.classList.contains('disabled')) {
         e.preventDefault();
         const clientID = selectClientBtn.dataset.clientId;
         const clientName = selectClientBtn.dataset.clientName;
         clientHistorySearchModal.hide();
         isSearchMode = true;
         meetingsList.innerHTML = '<div class="col-12 text-center p-5"><div class="spinner-border text-primary"></div><p class="mt-2">Загружаем историю встреч...</p></div>';
         document.getElementById('date-preset-btn').textContent = 'Сбросить';
         callApi('getAllMeetingsForClient', { login: currentUser, clientID: clientID })
             .then(result => {
                 allMeetings = result.meetings || [];
                 filterAndGroupMeetings();
                 const searchResultTitle = document.createElement('h3');
                 searchResultTitle.className = 'col-12 date-header';
                 searchResultTitle.innerHTML = `История встреч по клиенту: <mark>${clientName}</mark>`;
                 meetingsList.prepend(searchResultTitle);
             })
             .catch(err => {
                 onFailure(err);
                 meetingsList.innerHTML = `<div class="col-12 text-center p-5"><h4>Ошибка загрузки истории</h4><p class="text-muted">${err.message}</p></div>`;
             });
         return;
    }

    const createFromReportBtn = target.closest('.js-create-meeting-from-report');
    if (createFromReportBtn) {
         reportModal.hide();
         const btnTarget = createFromReportBtn;
         document.querySelector('.nav-button[data-page="dashboard"]').click();
         showAddForm();
         document.getElementById('client-name').value = btnTarget.dataset.clientName;
         document.getElementById('location').value = btnTarget.dataset.clientAddress;
         document.getElementById('client-id').value = btnTarget.dataset.clientId;
         document.getElementById('client-category').value = btnTarget.dataset.clientCategory;
         document.getElementById('phone').value = btnTarget.dataset.clientPhone;
         if (phoneMask) phoneMask.updateValue();
         return;
    }

    const autocompleteLink = target.closest('#client-autocomplete-results a');
    if (autocompleteLink) {
         e.preventDefault();
         const linkTarget = autocompleteLink;
         document.getElementById('client-name').value = linkTarget.dataset.clientName;
         document.getElementById('client-id').value = linkTarget.dataset.clientId;
         document.getElementById('client-category').value = linkTarget.dataset.clientCategory;
         document.getElementById('location').value = linkTarget.dataset.clientAddress;
         document.getElementById('phone').value = linkTarget.dataset.clientPhone;
         if (phoneMask) phoneMask.updateValue();
         document.getElementById('client-autocomplete-results').innerHTML = '';
         return;
    }

    const createMeetingBtnFromList = target.closest('.js-create-meeting-from-client-list');
    if (createMeetingBtnFromList) {
        e.preventDefault();
        document.querySelector('.nav-button[data-page="dashboard"]').click();
        showAddForm();
        document.getElementById('client-name').value = createMeetingBtnFromList.dataset.clientName;
        document.getElementById('location').value = createMeetingBtnFromList.dataset.clientAddress;
        document.getElementById('client-id').value = createMeetingBtnFromList.dataset.clientId;
        document.getElementById('client-category').value = createMeetingBtnFromList.dataset.clientCategory;
        document.getElementById('phone').value = createMeetingBtnFromList.dataset.clientPhone;
        if (phoneMask) phoneMask.updateValue();
        return;
    }

    const resultsContainer = document.getElementById('client-autocomplete-results');
    if (resultsContainer && !target.closest('#client-name') && resultsContainer.innerHTML !== '') {
         resultsContainer.innerHTML = '';
    }
});
    
    // --- ВСЕ ОСТАЛЬНЫЕ ФУНКЦИИ ---
    
    // ЗАМЕНИТЕ ЭТУ ФУНКЦИЮ
async function loadClientsPage() {
    const container = document.getElementById('client-list-container');
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const result = await callApi('getManagerClients', { login: currentUser });
        allClients = result.clients || [];
        
        // --- ДОБАВЛЕНО ---
        renderCategoryFilters(); // Создаем кнопки фильтров
        
        renderClientList(allClients); // Отрисовываем полный список
    } catch (e) {
        onFailure(e);
        container.innerHTML = '<div class="alert alert-danger">Не удалось загрузить список клиентов.</div>';
    }
}
     // --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
function renderCategoryFilters() {
    const filtersContainer = document.getElementById('client-category-filters');
    if (!filtersContainer) return;

    const categories = [...new Set(allClients.map(client => client.ClientCategory || "Без категории"))];
    
    // Кнопка "Все" всегда основная, синяя
    let filtersHtml = '<button class="btn btn-sm btn-primary active" data-category="all">Все</button>';

    categories.forEach(category => {
        const categoryColor = getCategoryColor(category);
        // Для новой палитры белый текст будет выглядеть лучше
        const textColorClass = 'text-white'; 
        
        filtersHtml += `
            <button class="btn btn-sm ${textColorClass}" style="background-color: ${categoryColor}; border-color: ${categoryColor};" data-category="${category}">
                ${category}
            </button>
        `;
    });

    filtersContainer.innerHTML = filtersHtml;
}
       // ВСТАВЬТЕ ЭТУ ФУНКЦИЮ
async function handleClientSearch() {
    const searchInput = document.getElementById('clientSearchInput');
    const resultContainer = document.getElementById('clientSearchResult');
    const searchBtn = document.getElementById('clientSearchBtn');
    const searchTerm = searchMask.unmaskedValue || searchInput.value;
    if (!searchTerm) {
        resultContainer.innerHTML = `<p class="text-danger">Введите запрос для поиска.</p>`;
        return;
    }
    toggleButtonSpinner(searchBtn, true);
    resultContainer.innerHTML = `<div class="text-center"><div class="spinner-border spinner-border-sm"></div></div>`;
    resultContainer.replaceWith(resultContainer.cloneNode(true));
    const newResultContainer = document.getElementById('clientSearchResult');
    try {
        const payload = { searchTerm: searchTerm, managerLogin: currentUser };
        const result = await callApi('findClient', payload);
        if (result && result.found && result.clients && result.clients.length > 0) {
            const clientsHtml = result.clients.map(client => {
                const isDisabled = !client.isMine;
                const disabledClass = isDisabled ? 'disabled' : '';
                const titleText = isDisabled ? `Закреплен за: ${client.managerName || 'другой менеджер'}` : 'Создать встречу';
                return `<li class="list-group-item"><div class="row align-items-center"><div class="col"><strong>${client.clientName}</strong><small class="text-muted d-block">Категория: ${client.ClientCategory || 'Не указана'}</small><small class="text-muted d-block">Менеджер: ${client.managerName || 'Не назначен'}</small></div><div class="col-auto"><div class="btn-group"><button class="btn btn-sm btn-outline-secondary report-btn-icon" data-client-id="${client.ClientID}" data-client-name="${client.clientName}" title="Данные по клиенту" ${disabledClass}><i class="bi bi-file-text"></i></button><button class="btn btn-sm btn-success create-meeting-from-search-btn" data-client-name="${client.clientName}" data-client-address="${client.clientAddress || ''}" data-client-id="${client.ClientID}" data-client-category="${client.ClientCategory || ''}" data-client-phone="${client.Phone || ''}" title="${titleText}" ${disabledClass}>Создать</button></div></div></div></li>`;
            }).join('');
            newResultContainer.innerHTML = `<ul class="list-group">${clientsHtml}</ul>`;
        } else {
            newResultContainer.innerHTML = `<div class="alert alert-warning"><strong>Клиент не найден.</strong><br>Попробуйте изменить поисковый запрос.</div>`;
        }
    } catch (e) {
        newResultContainer.innerHTML = `<p class="text-danger">Ошибка при поиске: ${e.message}</p>`;
    } finally {
        toggleButtonSpinner(searchBtn, false);
    }
    newResultContainer.addEventListener('click', (e) => {
        const createBtn = e.target.closest('.create-meeting-from-search-btn');
        if (createBtn && !createBtn.disabled) {
            const target = createBtn;
            const clientName = target.dataset.clientName;
            const clientAddress = target.dataset.clientAddress;
            const clientID = target.dataset.clientId;
            const clientCategory = target.dataset.clientCategory;
            const clientPhone = target.dataset.clientPhone;
            clientSearchModal.hide();
            showAddForm();
            document.getElementById('client-name').value = clientName;
            document.getElementById('location').value = clientAddress;
            document.getElementById('client-id').value = clientID;
            document.getElementById('client-category').value = clientCategory;
            document.getElementById('phone').value = clientPhone;
            if (phoneMask) phoneMask.updateValue();
        }
    });
}
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
       // ДОБАВЬТЕ ЭТУ НОВУЮ ФУНКЦИЮ
// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
async function handleSaveNewClient(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-new-client-btn');
    toggleButtonSpinner(saveBtn, true);

    // 1. Собираем обычные данные из формы
    const newClientData = {
        name: document.getElementById('new-client-name').value,
        phone: newClientPhoneMask.unmaskedValue,
        address: document.getElementById('new-client-address').value,
        education: document.getElementById('new-client-education').value,
        managerLogin: currentUser,
        files: []
    };

    // 2. Асинхронно читаем и кодируем файлы
    const fileInput = document.getElementById('new-client-files');
    const filePromises = [];

    if (fileInput.files.length > 0) {
        showToast("Начинаем подготовку файлов...");
        for (const file of fileInput.files) {
            const promise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    // event.target.result содержит Base64-строку с префиксом, его нужно убрать
                    const base64Content = event.target.result.split(',')[1];
                    resolve({
                        name: file.name,
                        type: file.type,
                        contentBase64: base64Content
                    });
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
            filePromises.push(promise);
        }
    }

    try {
        // 3. Дожидаемся, пока все файлы будут закодированы
        const encodedFiles = await Promise.all(filePromises);
        newClientData.files = encodedFiles;

        // 4. Отправляем все данные (включая файлы) в 1С
        showToast("Отправка данных на сервер...");
        const result = await callApi('registerNewClient', newClientData);
        
        showToast(`Клиент "${result.ClientName}" успешно создан!`);
        document.querySelector('.nav-button[data-page="clients"]').click(); 
        loadClientsPage(); // Обновляем список клиентов, чтобы увидеть нового

    } catch (error) {
        onFailure(error);
    } finally {
        toggleButtonSpinner(saveBtn, false);
    }
}
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
    function renderClientList(clientsToRender) {
        const container = document.getElementById('client-list-container');
        if (!container) return;
        if (clientsToRender.length === 0) {
            container.innerHTML = '<p class="text-center mt-4" style="color:var(--text3);font-size:14px;font-weight:600;">Клієнтів не знайдено</p>';
            return;
        }
        const clientHtml = clientsToRender.map(client => {
            const categoryColor = getCategoryColor(client.ClientCategory);
            const cleanPhone = client.Phone ? client.Phone.replace(/[^+\d]/g, '') : '';
            return `
                <div class="client-card">
                    <div class="client-card-main">
                        <div class="client-info">
                            <div class="client-name">${client.ClientName}</div>
                            <span class="client-badge" style="background:${categoryColor}22;color:${categoryColor};border:1px solid ${categoryColor}44">${client.ClientCategory || 'Без категорії'}</span>
                            <div class="client-meta"><i class="bi bi-telephone"></i> <a href="tel:${cleanPhone}">${client.Phone || 'Не вказано'}</a></div>
                            <div class="client-meta"><i class="bi bi-clock-history"></i> ${client.LastMeetingDate || 'Немає даних'}</div>
                        </div>
                        <div class="client-actions">
                            <a href="#" class="card-btn js-report-from-client-list" title="Звіт" data-client-id="${client.ClientID}" data-client-name="${client.ClientName}"><i class="bi bi-bar-chart"></i></a>
                            <a href="#" class="card-btn card-btn-primary js-create-meeting-from-client-list" title="Нова зустріч"
                               data-client-id="${client.ClientID}" data-client-name="${client.ClientName}"
                               data-client-category="${client.ClientCategory || ''}" data-client-address="${client.ClientAddress || ''}"
                               data-client-phone="${client.Phone || ''}"><i class="bi bi-calendar-plus"></i></a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = clientHtml;
    }
    
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
    
    function checkActiveSession() {
    const savedSession = localStorage.getItem('crm_session');
    if (!savedSession) {
        window.showMainApp(false);
        return;
    };
    const session = JSON.parse(savedSession);
    const oneDay = 24 * 60 * 60 * 1000;
    const isSessionExpired = (new Date().getTime() - session.loginTime) > oneDay;
    if (isSessionExpired) {
        localStorage.removeItem('crm_session');
        window.showMainApp(false);
        return;
    }
    
    // ДОБАВЛЯЕМ ПЕРЕДАЧУ session.auth
    onLoginSuccess({ login: session.user, role: session.role, auth: session.auth });
}
    
    function onLoginSuccess(result) {
    currentUser = result.login;
    const userRole = result.role;

    // 1. ОПРЕДЕЛЯЕМ AUTH (КЛЮЧ)
    // Если нам его передали из сессии — берем его. Если нет — кодируем из поля ввода.
    let encodedAuth = result.auth; 
if (!encodedAuth) {
    const passField = document.getElementById('password'); // ID из вашего HTML
    encodedAuth = passField && passField.value ? btoa(passField.value) : '';
}

    // 2. СОХРАНЯЕМ СЕССИЮ (с учетом ключа auth)
    const session = { 
    user: currentUser, 
    role: userRole, 
    loginTime: new Date().getTime(),
    auth: encodedAuth // <--- Теперь пароль сохранится в памяти браузера
};
localStorage.setItem('crm_session', JSON.stringify(session));

    // 3. НАСТРОЙКА ИНТЕРФЕЙСА
    const userInfoElement = document.getElementById('offcanvas-user-info');
    if (userInfoElement) userInfoElement.textContent = `Менеджер: ${currentUser}`;

    window.showMainApp(true);

    const header = document.querySelector('.app-header');
    const main = document.querySelector('.app-main');
    const bottomNav = document.querySelector('.app-bottom-nav');
    const adminDashboard = document.getElementById('admin-dashboard');

    // Update avatar initials
    const avatarEl = document.getElementById('header-avatar-initials');
    if (avatarEl && currentUser) {
        const parts = currentUser.split(/[\s.@]/);
        avatarEl.textContent = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : currentUser.substring(0,2).toUpperCase();
    }

    if (userRole === 'admin') {
        if (header) header.classList.add('d-none');
        if (main) main.classList.add('d-none');
        if (bottomNav) bottomNav.classList.add('d-none');
        if (adminDashboard) adminDashboard.classList.remove('d-none');
    } else {
        if (header) header.classList.remove('d-none');
        if (main) main.classList.remove('d-none');
        if (bottomNav) bottomNav.classList.remove('d-none');
        if (adminDashboard) adminDashboard.classList.add('d-none');

        // Apply role-based navigation
        updateNavForRole(userRole);

        if (typeof datePicker !== 'undefined') {
            datePicker.setDateRange(new Date(), new Date());
        }

        // 4. ОБНОВЛЯЕМ ССЫЛКУ РЕКЛАМАЦИЙ
        if (currentUser && encodedAuth) {
            updateReclamationLink(currentUser, encodedAuth, true);
        }
    }
}

/**
 * Вспомогательная функция для обновления ссылки в бургер-меню
 * Генерирует "магическую ссылку" для системы рекламаций
 */
function updateReclamationLink(email, auth, isAlreadyEncoded = true) {
    const navLink = document.getElementById('reclamationNavLink');
    if (navLink && email && auth) {
        const finalAuth = isAlreadyEncoded ? auth : btoa(auth);
        navLink.href = `https://reclamation-app-eight.vercel.app/?email=${encodeURIComponent(email)}&auth=${finalAuth}`;
        console.log("✅ Ссылка на рекламации активна");
    }
}
    
    function handleLogout() {
    // 1. Очищаем сессию
    localStorage.removeItem('crm_session');
    
    // 2. Скрываем основные элементы приложения (ваша текущая логика)
    window.showMainApp(false);

    // --- НОВАЯ ЛОГИКА ЗАКРЫТИЯ МЕНЮ ---
    const sideMenuEl = document.getElementById('sideMenu');
    // Получаем экземпляр Bootstrap Offcanvas
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(sideMenuEl);
    
    // Если меню открыто — закрываем его
    if (bsOffcanvas) {
        bsOffcanvas.hide();
    }
}
    
    function getTodayDateString() { return formatDateToYYYYMMDD(new Date()); }
    function getTomorrowDateString() { const t = new Date(); t.setDate(t.getDate() + 1); return formatDateToYYYYMMDD(t); }
    function formatDateToYYYYMMDD(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    function toggleButtonSpinner(btn, show) {
        if (show) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>`;
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || '';
        }
    }
    function showToast(message) {
        if (appToast) {
            document.querySelector('#appToast .toast-body').textContent = message;
            appToast.show();
        }
    }
    // getCategoryColor, callApi, formatPrice, formatCatalogPrice, formatElapsedTime → js/utils.js
    // MOCK_ORDER_CLIENTS, MOCK_ORDERS, MOCK_CATALOG, MOCK_DEBTORS → js/mock-data.js

    function onFailure(error, errorElement = null) {
        console.error(error);
        if (errorElement) {
            errorElement.textContent = error.message;
            errorElement.classList.remove(HIDDEN_CLASS);
        } else {
            showToast('Ошибка: ' + error.message);
        }
    }
    function handleLogin(e) {
        e.preventDefault();
        const loginBtn = document.getElementById('login-button');
        toggleButtonSpinner(loginBtn, true);
        const loginError = document.getElementById('login-error');
        loginError.classList.add(HIDDEN_CLASS);
        const payload = { login: document.getElementById('username').value, password: document.getElementById('password').value };
        callApi('login', payload).then(onLoginSuccess).catch(err => {
            onFailure(err, loginError);
            document.getElementById('password').value = '';
        }).finally(() => {
            toggleButtonSpinner(loginBtn, false);
        });
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
    // --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---

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

// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
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

// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---

// ═══════════════════════════════════════════
//  ANALYTICS DASHBOARD
// ═══════════════════════════════════════════

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

    function handleClientInput(e) {
        const searchTerm = e.target.value;
        const resultsContainer = document.getElementById('client-autocomplete-results');
        clearTimeout(searchTimeout);
        if (searchTerm.length < 3) {
            resultsContainer.innerHTML = '';
            return;
        }
        searchTimeout = setTimeout(async () => {
            try {
                const payload = { searchTerm: searchTerm, managerLogin: currentUser };
                const result = await callApi('findClient', payload);
                if (result && result.found && result.clients && result.clients.length > 0) {
                    const clientsHtml = result.clients.map(client => {
                        if (client.isMine) {
                            return `<a href="#" class="list-group-item list-group-item-action" data-client-name="${client.clientName}" data-client-address="${client.clientAddress || ''}" data-client-id="${client.ClientID}" data-client-category="${client.ClientCategory || ''}" data-client-phone="${client.Phone || ''}"><strong>${client.clientName}</strong><small class="d-block text-muted">Категория: ${client.ClientCategory || 'Не указана'}</small></a>`;
                        } else {
                            return `<span class="list-group-item list-group-item-light text-muted pe-none"><strong>${client.clientName}</strong><small class="d-block">Закреплен за: ${client.managerName || 'другой менеджер'}</small></span>`;
                        }
                    }).join('');
                    resultsContainer.innerHTML = clientsHtml;
                } else {
                    resultsContainer.innerHTML = '<span class="list-group-item disabled">Клиенты не найдены</span>';
                }
            } catch (e) {
                console.error("Ошибка автодополнения:", e);
                resultsContainer.innerHTML = '<span class="list-group-item list-group-item-danger">Ошибка поиска</span>';
            }
        }, 500);
    }
    // --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
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
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
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
// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
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
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
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
// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---

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

// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---

// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---

// --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---

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

// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---

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

// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---



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

// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
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
  // --- НАЧАЛО БЛОКА НА ЗАМЕНУ ---
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
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---
       
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
// --- КОНЕЦ БЛОКА НА ЗАМЕНУ ---

    async function handleClientSearch() {
        const searchInput = document.getElementById('clientSearchInput');
        const resultContainer = document.getElementById('clientSearchResult');
        const searchBtn = document.getElementById('clientSearchBtn');
        const searchTerm = searchMask.unmaskedValue || searchInput.value;
        if (!searchTerm) {
            resultContainer.innerHTML = `<p class="text-danger">Введите запрос для поиска.</p>`;
            return;
        }
        toggleButtonSpinner(searchBtn, true);
        resultContainer.innerHTML = `<div class="text-center"><div class="spinner-border spinner-border-sm"></div></div>`;
        resultContainer.replaceWith(resultContainer.cloneNode(true));
        const newResultContainer = document.getElementById('clientSearchResult');
        try {
            const payload = { searchTerm: searchTerm, managerLogin: currentUser };
            const result = await callApi('findClient', payload);
            if (result && result.found && result.clients && result.clients.length > 0) {
                const clientsHtml = result.clients.map(client => {
                    const isDisabled = !client.isMine;
                    const disabledClass = isDisabled ? 'disabled' : '';
                    const titleText = isDisabled ? `Закреплен за: ${client.managerName || 'другой менеджер'}` : 'Создать встречу';
                    return `<li class="list-group-item"><div class="row align-items-center"><div class="col"><strong>${client.clientName}</strong><small class="text-muted d-block">Категория: ${client.ClientCategory || 'Не указана'}</small><small class="text-muted d-block">Менеджер: ${client.managerName || 'Не назначен'}</small></div><div class="col-auto"><div class="btn-group"><button class="btn btn-sm btn-outline-secondary report-btn-icon" data-client-id="${client.ClientID}" data-client-name="${client.clientName}" title="Данные по клиенту" ${disabledClass}><i class="bi bi-file-text"></i></button><button class="btn btn-sm btn-success create-meeting-from-search-btn" data-client-name="${client.clientName}" data-client-address="${client.clientAddress || ''}" data-client-id="${client.ClientID}" data-client-category="${client.ClientCategory || ''}" data-client-phone="${client.Phone || ''}" title="${titleText}" ${disabledClass}>Создать</button></div></div></div></li>`;
                }).join('');
                newResultContainer.innerHTML = `<ul class="list-group">${clientsHtml}</ul>`;
            } else {
                newResultContainer.innerHTML = `<div class="alert alert-warning"><strong>Клиент не найден.</strong><br>Попробуйте изменить поисковый запрос.</div>`;
            }
        } catch (e) {
            newResultContainer.innerHTML = `<p class="text-danger">Ошибка при поиске: ${e.message}</p>`;
        } finally {
            toggleButtonSpinner(searchBtn, false);
        }
        newResultContainer.addEventListener('click', (e) => {
            const createBtn = e.target.closest('.create-meeting-from-search-btn');
            if (createBtn && !createBtn.disabled) {
                const target = createBtn;
                const clientName = target.dataset.clientName;
                const clientAddress = target.dataset.clientAddress;
                const clientID = target.dataset.clientId;
                const clientCategory = target.dataset.clientCategory;
                const clientPhone = target.dataset.clientPhone;
                clientSearchModal.hide();
                showAddForm();
                document.getElementById('client-name').value = clientName;
                document.getElementById('location').value = clientAddress;
                document.getElementById('client-id').value = clientID;
                document.getElementById('client-category').value = clientCategory;
                document.getElementById('phone').value = clientPhone;
                if (phoneMask) phoneMask.updateValue();
            }
        });
    }
    function showAddForm() {
        currentEditingMeeting = null;
        document.getElementById('form-title').textContent = "Новая встреча";
        document.getElementById('meeting-form').reset();
        document.getElementById('client-autocomplete-results').innerHTML = '';
        if(phoneMask) phoneMask.updateValue();
        document.getElementById('meeting-date').value = getTodayDateString();
        document.getElementById('meeting-id').value = '';
        document.getElementById('status').value = 'В работе';
        showForm(true);
    }

    // Expose showAddForm globally so orders.js / initFabSheet can call it
    window.showAddForm = showAddForm;

    function onActionComplete() { showForm(false); }
    function handleCancelClick() { cancelConfirmModal.show(); }
    function showForm(show) {
        const viewMeetings = document.getElementById('view-meetings');
        const formSection = document.getElementById('form-section');
        if (viewMeetings && formSection) {
            viewMeetings.classList.toggle(HIDDEN_CLASS, show);
            formSection.classList.toggle(HIDDEN_CLASS, !show);
        }
    }

    // Timer for active meetings
    setInterval(() => {
        document.querySelectorAll('.timer').forEach(timerEl => {
            const startTime = parseInt(timerEl.dataset.startTime, 10);
            if (startTime) timerEl.textContent = formatElapsedTime(Date.now() - startTime);
        });
    }, 1000);

}); // end DOMContentLoaded
