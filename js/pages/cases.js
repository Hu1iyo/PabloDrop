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

const CASE_COVER_ARTWORKS = {
    1: 'photo_1_2026-10-22_10-45-19-converted.webp',
    3: 'photo_2_2026-10-22_10-45-19-converted.webp',
    4: 'photo_3_2026-10-22_10-45-19-converted.webp',
    6: 'photo_4_2026-10-22_10-45-19-converted.webp',
    5: 'photo_5_2026-10-22_10-45-19-converted.webp',
    2: 'photo_6_2026-10-22_10-45-19-converted.webp',
    7: 'photo_7_2026-10-22_10-45-19-converted.webp',
    16: 'photo_8_2026-10-22_10-45-19-converted.webp',
    15: 'photo_9_2026-10-22_10-45-19-converted.webp',
    14: 'photo_10_2026-10-22_10-45-19-converted.webp',
    8: 'photo_11_2026-10-22_10-45-19-converted.webp',
    35: 'photo_12_2026-10-22_10-45-19-converted.webp',
    117: 'photo_13_2026-10-22_10-45-19-converted.webp',
    109: 'photo_14_2026-10-22_10-45-19-converted.webp',
    55: 'photo_15_2026-10-22_10-45-19-converted.webp',
    29: 'photo_16_2026-10-22_10-45-19-converted.webp',
    38: 'photo_17_2026-10-22_10-45-19-converted.webp',
    114: 'photo_18_2026-10-22_10-45-19-converted.webp',
    42: 'photo_19_2026-10-22_10-45-19-converted.webp',
    48: 'photo_20_2026-10-22_10-45-19-converted.webp',
    115: 'photo_21_2026-10-22_10-45-19-converted.webp',
    111: 'photo_22_2026-10-22_10-45-19-converted.webp',
    56: 'photo_23_2026-10-22_10-45-19-converted.webp',
    33: 'photo_24_2026-10-22_10-45-19-converted.webp',
    43: 'photo_25_2026-10-22_10-45-19-converted.webp',
    112: 'photo_26_2026-10-22_10-45-19-converted.webp',
    9: 'photo_27_2026-10-22_10-45-19-converted.webp',
    54: 'photo_28_2026-10-22_10-45-19-converted.webp',
    118: 'photo_29_2026-10-22_10-45-19-converted.webp',
    32: 'photo_30_2026-10-22_10-45-19-converted.webp',
    64: 'photo_31_2026-10-22_10-45-19-converted.webp',
    53: 'photo_32_2026-10-22_10-45-19-converted.webp',
    50: 'photo_33_2026-10-22_10-45-19-converted.webp',
    51: 'photo_34_2026-10-22_10-45-19-converted.webp',
    44: 'photo_35_2026-10-22_10-45-19-converted.webp',
    58: 'photo_36_2026-10-22_10-45-19-converted.webp',
    116: 'photo_37_2026-10-22_10-45-19-converted.webp',
    113: 'photo_38_2026-10-22_10-45-19-converted.webp',
    110: 'photo_39_2026-10-22_10-45-19-converted.webp',
    47: 'photo_40_2026-10-22_10-45-19-converted.webp'
};

// Отслеживание показанных кейсов (чтобы не дублировать)
const shownCaseIds = new Set();

function getCaseArtTheme(caseItem) {
    const name = caseItem.name.toLowerCase();
    const categories = caseItem.categories || [];

    if (/аниме|киберпанк|80-е|космич|полноч|тень/.test(name)) return 'neon';
    if (/лед|снег|кока|сапфир/.test(name)) return 'ice';
    if (/золот|золото|эскобар|миллион|бог|импер|королев|платин|люкс|премиум|босс|джекпот|фортун|абсолют|элит|легенд|миф|патрон|драгоцен/.test(name)) return 'gold';
    if (/кариб|океан|море|берег|водител|морск/.test(name)) return 'ocean';
    if (/пустын|desert|картел|медельин|джунг|троп|нарколаборат|лаборат|крепост|контрабанд|эскобар|патрон/.test(name)) return 'jungle';
    if (categories.includes('knives') || /нож|клинок|самурай|карамбит|штык/.test(name)) return 'blade';
    if (categories.includes('gloves') || /перчат/.test(name)) return 'glove';
    if (categories.includes('awp') || /снайпер|прицел|охотник/.test(name)) return 'sniper';
    if (categories.includes('pistols') || /пистолет|глок|деагл|usp|five-seve?n|tec-9|револьвер/.test(name)) return 'pistol';
    if (categories.includes('smg') || /\bsmg\b|mp[79]|p90|ump|mac-10/.test(name)) return 'smg';
    if (categories.includes('heavy') || /тяжел|дробовик|negev|m249|mag-7|xm1014|sawed-off/.test(name)) return 'heavy';
    if (/дешево|бюджет|старт|мини|бейсик|лайт|эконом/.test(name) || categories.includes('cheap')) return 'starter';
    if (categories.includes('mega') || categories.includes('premium')) return 'gold';
    return 'tactical';
}

function caseArtworkMarkup(caseItem, variant = 'card') {
    const theme = getCaseArtTheme(caseItem);
    const coverImage = CASE_COVER_ARTWORKS[caseItem.id];
    const className = variant === 'opening'
        ? 'case-art case-art-opening'
        : 'case-image case-art';

    if (coverImage) {
        return `
            <div class="${className} case-art--${theme} case-art-photo" aria-hidden="true">
                <img class="case-art-cover" src="assets/cases/${coverImage}" alt="" loading="lazy" decoding="async">
            </div>
        `;
    }

    const featuredItem = [...caseItem.items]
        .filter(item => item.image)
        .sort((first, second) => second.price - first.price)[0];

    return `
        <div class="${className} case-art--${theme}" aria-hidden="true">
            <span class="case-art-halo"></span>
            <span class="case-art-platform"></span>
            <span class="case-art-crate" aria-hidden="true">
                <span class="case-art-crate-lid"></span>
                <span class="case-art-crate-lock"></span>
            </span>
            ${featuredItem ? skinImageMarkup(featuredItem, 'case-art-skin') : `
                <span class="case-art-weapon" aria-hidden="true">
                    <span class="case-art-weapon-barrel"></span>
                    <span class="case-art-weapon-body"></span>
                    <span class="case-art-weapon-stock"></span>
                    <span class="case-art-weapon-grip"></span>
                </span>
            `}
        </div>
    `;
}

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
                ${caseArtworkMarkup(c)}
                <div class="case-name">${c.name}</div>
                <div class="case-items-count">${c.items.length} предметов</div>
                <div class="case-price-tag">${c.price.toLocaleString('ru-RU')} PC</div>
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
                ${caseArtworkMarkup(c)}
                <div class="case-name">${c.name}</div>
                <div class="case-items-count">${c.items.length} предметов</div>
                <div class="case-price-tag">${c.price.toLocaleString('ru-RU')} PC</div>
            `;

            card.addEventListener('click', () => openCasePage(c.id));
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }
}