// app.js — core init, auth, session
// meetings.js — meeting list, forms, actions
// clients.js — client list, search, new client
// dashboard.js — analytics, mock data, role nav
// reports.js — client report modal
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
clientSearchModal = new bootstrap.Modal(document.getElementById('clientSearchModal'));

const clientSearchInputEl = document.getElementById('clientSearchInput');
searchMask = IMask(clientSearchInputEl, {
    mask: [ { mask: '+{38} (000) 000-00-00', startsWith: '38', lazy: false }, { mask: /.*/ } ]
});

document.getElementById('clientSearchBtn').addEventListener('click', handleClientSearch);
document.getElementById('clientSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleClientSearch();
});
// Логика для условного отображения под-вопросов в анкете
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

    function checkActiveSession() {
    const savedSession = localStorage.getItem('crm_session');
    if (!savedSession) { window.showMainApp(false); return; }

    let session;
    try { session = JSON.parse(savedSession); } catch(e) { session = null; }

    // Validate session has required fields — clear corrupted session
    if (!session || !session.user || !session.role) {
        localStorage.removeItem('crm_session');
        window.showMainApp(false);
        return;
    }

    const oneDay = 24 * 60 * 60 * 1000;
    if ((new Date().getTime() - session.loginTime) > oneDay) {
        localStorage.removeItem('crm_session');
        window.showMainApp(false);
        return;
    }

    onLoginSuccess({ login: session.user, role: session.role, auth: session.auth });
}

    function onLoginSuccess(result) {
    // Handle both { login, role } and wrapped { status, data: { login, role } }
    const data = (result && result.data) ? result.data : result;
    currentUser = data.login;
    const userRole = data.role;

    // 1. ОПРЕДЕЛЯЕМ AUTH (КЛЮЧ)
    // Если нам его передали из сессии — берем его. Если нет — кодируем из поля ввода.
    let encodedAuth = data.auth;
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

// showAddForm is global — expose on window for cross-module access (orders.js / initFabSheet)
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
