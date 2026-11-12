const CATALOG_SKIN_PRICES = CASES.flatMap(caseItem => caseItem.items).reduce((prices, item) => {
    if (!prices.has(item.name) && Number.isFinite(item.price) && item.price > 0) {
        prices.set(item.name, item.price);
    }
    return prices;
}, new Map());

function getCatalogSkinPrice(item) {
    if (Number.isFinite(item?.catalogPrice) && item.catalogPrice > 0) return item.catalogPrice;
    return CATALOG_SKIN_PRICES.get(item?.name)
        || (Number.isFinite(item?.price) && item.price > 0 ? item.price : null);
}

function getDisplaySkinName(name) {
    return name.replace(/\s*(?:\(Factory New\)|FN)$/i, '');
}

function isMarketPriceAvailable(item) {
    const price = getCatalogSkinPrice(item);
    return Number.isFinite(price) && price > 0;
}

function getMarketSkin(item) {
    const catalogPrice = getCatalogSkinPrice(item);
    return {
        ...item,
        catalogPrice,
        price: catalogPrice,
        marketPriceAvailable: Boolean(catalogPrice),
        marketPriceSource: catalogPrice ? 'catalog' : null,
    };
}

function applyCatalogPrices() {
    CASES.forEach(caseItem => {
        caseItem.items = caseItem.items.map(getMarketSkin);
    });

    const user = getCurrentUser();
    if (user && user.inventory) {
        updateCurrentUser({ inventory: user.inventory.map(getMarketSkin) });
    }
}

function applyLocalSkinImages(items) {
    CASES.forEach(caseItem => {
        caseItem.items = caseItem.items.map(item => (
            Object.prototype.hasOwnProperty.call(items, item.name)
                ? { ...item, ...items[item.name] }
                : item
        ));
    });

    const user = getCurrentUser();
    if (user && user.inventory) {
        updateCurrentUser({
            inventory: user.inventory.map(item => (
                Object.prototype.hasOwnProperty.call(items, item.name)
                    ? { ...item, ...items[item.name] }
                    : item
            )),
        });
    }
}

async function refreshLocalSkinImages() {
    const names = [...new Set(CASES.flatMap(caseItem => caseItem.items.map(item => item.name)))];
    try {
        const response = await fetch('/api/skin-images/map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names }),
        });
        if (!response.ok) throw new Error(`Local skin images unavailable (${response.status})`);

        const snapshot = await response.json();
        if (!snapshot.items || typeof snapshot.items !== 'object' || Array.isArray(snapshot.items)) {
            throw new Error('Local skin image map is invalid');
        }
        applyLocalSkinImages(snapshot.items);
        renderShowcase();
        renderCases();
        if (currentPage === 'inventory') renderInventory();
        if (currentPage === 'upgrade') updateUpgradeUI();
        if (currentPage === 'contracts') renderContracts();
        if (currentCase) refreshOpeningMarketPrices();
    } catch (error) {
        console.error('Не удалось загрузить локальные изображения скинов:', error);
    }
}

function skinImageMarkup(item, className = 'skin-art') {
    if (!item.image) return `<div class="${className} skin-art-placeholder" aria-hidden="true">CS2</div>`;
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
    const imageUrl = escapeHtml(item.image);
    const image = `<img class="skin-art-image" src="${imageUrl}" alt="" loading="lazy" decoding="async">`;
    if (item.imageIsExact === false) {
        const sourceName = escapeHtml(item.imageSourceName || item.name.split('|')[0].trim());
        return `<span class="${className} skin-art-fallback" title="Точного изображения нет; показано оружие: ${sourceName}">${image}</span>`;
    }
    return `<img class="${className} skin-art-image" src="${imageUrl}" alt="" loading="lazy" decoding="async">`;
}

function marketPriceMarkup(item, className = 'skin-market-price') {
    const price = getCatalogSkinPrice(item);
    if (!Number.isFinite(price) || price <= 0) {
        return `<span class="${className} market-price-unavailable">Оценка недоступна</span>`;
    }
    return `<span class="${className} market-price-estimate" aria-label="${formatCurrency(price)}, примерная игровая цена">≈ ${formatCurrency(price)}</span>`;
}