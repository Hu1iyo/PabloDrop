// Порядок категорий (приоритет отображения)
const CATEGORY_ORDER = [
    { key: 'cheap', title: ' Дешёвые', titleClass: '' },
    { key: 'pablo', title: '🌴 PabloDrop', titleClass: 'pablo-title' },
    { key: 'popular', title: '🔥 Популярные', titleClass: '' },
    { key: 'premium', title: '💎 Премиум', titleClass: '' },
    { key: 'knives', title: '🗡️ Ножи', titleClass: '' },
    { key: 'gloves', title: '🧤 Перчатки', titleClass: '' },
    { key: 'awp', title: '🎯 AWP', titleClass: '' },
    { key: 'pistols', title: '🔫 Пистолеты', titleClass: '' },
    { key: 'smg', title: '💨 SMG', titleClass: '' },
    { key: 'heavy', title: '💣 Тяжёлое', titleClass: '' },
    { key: 'mega', title: '💫 Мега', titleClass: '' }
];

// Отслеживание показанных кейсов (чтобы не дублировать)
const shownCaseIds = new Set();

function renderCases() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    container.innerHTML = '';
    shownCaseIds.clear();

    // Сортировка кейсов внутри каждой категории: от дешевого к дорогому
    const sortedCases = [...CASES].sort((a, b) => a.price - b.price);

    CATEGORY_ORDER.forEach(cat => {
        // Кейсы этой категории, которые ещё не показаны
        const categoryCases = sortedCases.filter(c => 
            c.categories.includes(cat.key) && !shownCaseIds.has(c.id)
        );

        if (categoryCases.length === 0) return;

        // Отмечаем как показанные
        categoryCases.forEach(c => shownCaseIds.add(c.id));

        // Создаём секцию
        const section = document.createElement('section');
        section.className = 'category-section';

        const title = document.createElement('h2');
        title.className = `category-title ${cat.titleClass}`;
        title.textContent = cat.title;
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'cases-grid';

        categoryCases.forEach(c => {
            const card = document.createElement('div');
            card.className = 'case-card';
            card.dataset.id = c.id;

            let badge = '';
            if (c.price >= 5000) badge = '<div class="case-badge badge-mega">МЕГА</div>';
            else if (c.price >= 1500) badge = '<div class="case-badge badge-premium">PREMIUM</div>';
            else if (c.categories.includes('pablo')) badge = '<div class="case-badge badge-pablo">PABLO</div>';

            card.innerHTML = `
                ${badge}
                <div class="case-image">${c.emoji}</div>
                <div class="case-name">${c.name}</div>
                <div class="case-items-count">${c.items.length} предметов</div>
                <div class="case-price-tag">${c.price.toLocaleString('ru-RU')} ₽</div>
            `;

            card.addEventListener('click', () => openCasePage(c.id));
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    });

    // Секция "Другие" для кейсов без категорий
    const otherCases = sortedCases.filter(c => !shownCaseIds.has(c.id));
    if (otherCases.length > 0) {
        otherCases.forEach(c => shownCaseIds.add(c.id));

        const section = document.createElement('section');
        section.className = 'category-section';

        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = ' Другие';
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'cases-grid';

        otherCases.forEach(c => {
            const card = document.createElement('div');
            card.className = 'case-card';
            card.dataset.id = c.id;

            card.innerHTML = `
                <div class="case-image">${c.emoji}</div>
                <div class="case-name">${c.name}</div>
                <div class="case-items-count">${c.items.length} предметов</div>
                <div class="case-price-tag">${c.price.toLocaleString('ru-RU')} ₽</div>
            `;

            card.addEventListener('click', () => openCasePage(c.id));
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }
}