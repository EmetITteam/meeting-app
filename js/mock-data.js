// ══════════════════════════════════════════════
// MOCK DATA — замінити реальними API-викликами
// після підключення 1С
// ══════════════════════════════════════════════

// Mock clients with contracts (isPrimary → auto-selected)
const MOCK_ORDER_CLIENTS = [
    { id: 'c1', name: 'Шаламова Аліна Вадимівна', contracts: [
        { id: 'ct1', name: 'Основний з 2020, грн.', currency: 'UAH', isPrimary: true },
        { id: 'ct2', name: 'Договір агентський, грн.', currency: 'UAH', isPrimary: false },
    ]},
    { id: 'c2', name: 'Петренко Валентина Іванівна', contracts: [
        { id: 'ct3', name: 'Основний з 2020, грн.', currency: 'UAH', isPrimary: true },
    ]},
    { id: 'c3', name: 'Сирих Людмила (МЦ Дніпро)', contracts: [
        { id: 'ct4', name: 'Співробітник, грн.', currency: 'UAH', isPrimary: true },
    ]},
    { id: 'c4', name: 'Коваль Олена Миколаївна', contracts: [
        { id: 'ct5', name: 'Основний USD 2023', currency: 'USD', isPrimary: true },
        { id: 'ct6', name: 'Готівка, грн.', currency: 'UAH', isPrimary: false },
    ]},
    { id: 'c5', name: 'Клініка Естет, ТОВ', contracts: [
        { id: 'ct7', name: 'Основний з 2022, грн.', currency: 'UAH', isPrimary: true },
    ]},
];

const MOCK_ORDERS = [
    {
        id: 'ord-1', number: 'ЗИН00003082', docType: 'order', posted: true,
        date: '12.03.2026', time: '10:54',
        clientID: 'c1', clientName: 'Шаламова Аліна Вадимівна',
        contractName: 'Основний з 2020, грн.', contractCurrency: 'UAH',
        totalAmountUSD: 470,
        deliveryType: 'courier', deliveryAddress: 'Київ, А. Ахматової, 45',
        paymentType: 'cash', comment: 'ЖК Рів\u2019єра',
        items: [
            { name: 'HP CELL VITARAN I II (PN 20 мг/мл)', qty: 4, priceUSD: 117.5, isGift: false },
            { name: 'Пакет Emet п/е, 30×40 см',           qty: 1, priceUSD: 0,     isGift: true  },
        ]
    },
    {
        id: 'ord-2', number: 'ЗИН00003075', docType: 'order', posted: false,
        date: '11.03.2026', time: '14:22',
        clientID: 'c2', clientName: 'Петренко Валентина Іванівна',
        contractName: 'Основний з 2020, грн.', contractCurrency: 'UAH',
        totalAmountUSD: 201,
        deliveryType: 'pickup', deliveryAddress: '',
        paymentType: 'cash', comment: '',
        items: [
            { name: 'Neuramis Deep Lidocaine', qty: 2, priceUSD: 67.5, isGift: false },
            { name: 'Neuronox 100u',           qty: 1, priceUSD: 66.0, isGift: false },
        ]
    },
    {
        id: 'rlz-1', number: 'РЛЗ00006744', docType: 'realization', posted: true,
        date: '10.03.2026', time: '09:18',
        clientID: 'c3', clientName: 'Сирих Людмила (МЦ Дніпро)',
        contractName: 'Співробітник, грн.', contractCurrency: 'UAH',
        totalAmountUSD: 34.6,
        deliveryType: 'nova_poshta', deliveryAddress: 'Дніпро, відд. №12',
        paymentType: 'cashless', comment: '',
        items: [
            { name: 'MAGNOX 520 / 60 капсул', qty: 2, priceUSD: 17.3, isGift: false },
            { name: 'Пакет Emet п/е, 30×40 см', qty: 1, priceUSD: 0,  isGift: true  },
        ]
    },
    {
        id: 'ord-3', number: 'ЗИН00003060', docType: 'order', posted: true,
        date: '05.03.2026', time: '16:10',
        clientID: 'c4', clientName: 'Коваль Олена Миколаївна',
        contractName: 'Основний USD 2023', contractCurrency: 'USD',
        totalAmountUSD: 321.7,
        deliveryType: 'courier', deliveryAddress: 'Київ, Хрещатик 22',
        paymentType: 'cashless', comment: '',
        items: [
            { name: 'Petaran 2ml', qty: 3, priceUSD: 74.7, isGift: false },
            { name: 'Vitaran 1ml', qty: 2, priceUSD: 48.8, isGift: false },
        ]
    },
];

// Каталог — ціни в USD
const MOCK_CATALOG = [
    { id: 'p1', name: 'HP CELL VITARAN I II (PN 20 мг/мл)', code: 'VIT-001', brand: 'Vitaran',  priceUSD: 117.5, stock: 24, restricted: false },
    { id: 'p2', name: 'Neuramis Deep Lidocaine',             code: 'NEU-002', brand: 'Neuramis', priceUSD: 67.5,  stock: 15, restricted: false },
    { id: 'p3', name: 'Neuronox 100u',                       code: 'NRX-003', brand: 'Neuronox', priceUSD: 66.0,  stock: 8,  restricted: false },
    { id: 'p4', name: 'Petaran 2ml',                         code: 'PET-004', brand: 'Petaran',  priceUSD: 74.7,  stock: 6,  restricted: true, restrictionReason: 'Необхідно: пройдено навчання Petaran' },
    { id: 'p5', name: 'Vitaran 1ml',                         code: 'VIT-005', brand: 'Vitaran',  priceUSD: 48.8,  stock: 20, restricted: false },
    { id: 'p6', name: 'MAGNOX 520 / 60 капсул',              code: 'MAG-006', brand: 'Magnox',   priceUSD: 17.3,  stock: 40, restricted: false },
];

const MOCK_DEBTORS = [
    { id: 1, client: 'Клініка Естет, ТОВ',            contract: 'Договір №112 від 01.02.2024', total: 84500,  overdue: 84500, overdueDays: 45, dueDate: '2025-01-26' },
    { id: 2, client: 'Бьюті Лаб, ФОП',                contract: 'Договір №88 від 15.03.2024',  total: 32000,  overdue: 32000, overdueDays: 12, dueDate: '2025-02-28' },
    { id: 3, client: 'МедЕстетік Центр, ТОВ',         contract: 'Договір №201 від 10.01.2024', total: 115000, overdue: 0,     overdueDays: 0,  dueDate: '2025-03-20' },
    { id: 4, client: 'SkinLab Studio, ФОП',            contract: 'Договір №55 від 20.11.2023',  total: 27600,  overdue: 0,     overdueDays: 0,  dueDate: '2025-03-25' },
    { id: 5, client: 'Клініка Краса та Здоров\u2019я', contract: 'Договір №173 від 05.06.2024', total: 58000,  overdue: 58000, overdueDays: 8,  dueDate: '2025-03-04' },
    { id: 6, client: 'Aesthetica Clinic, ТОВ',         contract: 'Договір №99 від 22.04.2024',  total: 44000,  overdue: 0,     overdueDays: 0,  dueDate: '2025-04-01' },
    { id: 7, client: 'ФОП Шевченко А.В.',              contract: 'Договір №144 від 09.07.2024', total: 19800,  overdue: 19800, overdueDays: 3,  dueDate: '2025-03-09' },
    { id: 8, client: 'Wellness Pro, ТОВ',              contract: 'Договір №61 від 30.08.2024',  total: 73500,  overdue: 0,     overdueDays: 0,  dueDate: '2025-03-30' },
];
