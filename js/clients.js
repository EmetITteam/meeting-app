// ══════════════════════════════════════════════
// CLIENTS — client list, search, filters, new client
// Depends on: utils.js
// Globals used from app.js: currentUser, allClients, searchMask,
//   newClientPhoneMask, clientSearchModal, phoneMask, showAddForm (app.js)
// ══════════════════════════════════════════════

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
