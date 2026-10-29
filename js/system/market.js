const SKIN_MARKET_STORAGE_KEY = 'pabloSkinMarketCache';
const SKIN_MARKET_MAX_AGE_MS = 5 * 60 * 1000;
const SKIN_MARKET_DATA = {};
const CATALOG_SKIN_PRICES = CASES.flatMap(caseItem => caseItem.items).reduce((prices, item) => {
    if (!prices.has(item.name) && Number.isFinite(item.price) && item.price > 0) {
        prices.set(item.name, item.price);
    }
    return prices;
}, new Map());
let skinMarketFeedAvailable = false;

function getCatalogSkinPrice(item) {
    if (Number.isFinite(item?.catalogPrice) && item.catalogPrice > 0) return item.catalogPrice;
    if (Number.isFinite(item?.price) && item.price > 0) return item.price;
    return CATALOG_SKIN_PRICES.get(item?.name) || null;
}

function getDisplaySkinName(name) {
    return name.replace(/\s*(?:\(Factory New\)|FN)$/i, '');
}

function isMarketPriceAvailable(item) {
    return Boolean(item)
        && Number.isFinite(item.price)
        && item.price > 0
        && item.marketPriceAvailable === true;
}

function getMarketSkin(item) {
    const market = SKIN_MARKET_DATA[item.name];
    const catalogPrice = getCatalogSkinPrice(item);
    if (!market) {
        return {
            ...item,
            catalogPrice,
            price: null,
            priceFeedAvailable: skinMarketFeedAvailable,
            marketPriceAvailable: false,
        };
    }

    return {
        ...item,
        catalogPrice,
        price: Number.isFinite(market.price) && market.price > 0 ? market.price : null,
        image: market.image || item.image || null,
        imageIsExact: market.imageIsExact !== false,
        imageSourceName: market.imageSourceName || item.imageSourceName || null,
        priceFeedAvailable: market.priceFeedAvailable !== false,
        marketWear: market.wear,
        marketName: market.marketName,
        marketUrl: market.marketUrl,
        marketPriceUpdatedAt: market.priceUpdatedAt,
        marketPriceAvailable: Number.isFinite(market.price) && market.price > 0,
    };
}

function applyMarketSnapshot(snapshot) {
    Object.keys(SKIN_MARKET_DATA).forEach(name => delete SKIN_MARKET_DATA[name]);
    Object.assign(SKIN_MARKET_DATA, snapshot.items || {});
    skinMarketFeedAvailable = snapshot.pricesAvailable === true;
    CASES.forEach(caseItem => {
        caseItem.items = caseItem.items.map(getMarketSkin);
    });

    const user = getCurrentUser();
    if (user && user.inventory) {
        updateCurrentUser({ inventory: user.inventory.map(getMarketSkin) });
    }
}

function isFreshMarketSnapshot(snapshot) {
    const updatedAt = Date.parse(snapshot?.updatedAt || '');
    return Number.isFinite(updatedAt)
        && updatedAt <= Date.now()
        && Date.now() - updatedAt < SKIN_MARKET_MAX_AGE_MS
        && snapshot.items
        && typeof snapshot.items === 'object'
        && !Array.isArray(snapshot.items);
}

function applyCachedMarketData() {
    try {
        const cached = JSON.parse(localStorage.getItem(SKIN_MARKET_STORAGE_KEY));
        if (!isFreshMarketSnapshot(cached)) {
            localStorage.removeItem(SKIN_MARKET_STORAGE_KEY);
            return false;
        }
        applyMarketSnapshot(cached);
        return true;
    } catch {
        return false;
    }
}

async function refreshMarketData() {
    const names = [...new Set(CASES.flatMap(caseItem => caseItem.items.map(item => item.name)))];
    try {
        const response = await fetch('/api/market-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names }),
        });
        if (!response.ok) throw new Error(`Skinport market data unavailable (${response.status})`);

        const snapshot = await response.json();
        if (!isFreshMarketSnapshot(snapshot)) {
            throw new Error('Skinport returned an invalid or stale market snapshot');
        }
        const cache = {
            items: snapshot.items || {},
            pricesAvailable: snapshot.pricesAvailable === true,
            updatedAt: snapshot.updatedAt,
        };
        applyMarketSnapshot(cache);
        try {
            localStorage.setItem(SKIN_MARKET_STORAGE_KEY, JSON.stringify(cache));
        } catch (error) {
            console.warn('Не удалось сохранить кеш рыночных цен:', error);
        }

        return true;
    } catch (error) {
        console.warn('Не удалось обновить рыночные цены:', error);
        if (!applyCachedMarketData()) applyMarketSnapshot({ items: {} });
        return false;
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
    if (!isMarketPriceAvailable(item)) {
        if (Number.isFinite(item?.catalogPrice) && item.catalogPrice > 0) {
            const price = `${formatMoney(item.catalogPrice)} ₽`;
            return `<span class="${className} market-price-estimate" title="Ориентировочная цена по каталогу; рыночной котировки нет" aria-label="${price}, ориентировочная цена по каталогу">${price}</span>`;
        }
        const note = item.priceFeedAvailable === false ? 'цены временно недоступны' : 'нет котировки';
        return `<span class="${className} market-price-unavailable">Цена недоступна<small>${note}</small></span>`;
    }
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
    const updatedAt = item.marketPriceUpdatedAt
        ? `Котировка обновлена ${new Date(item.marketPriceUpdatedAt).toLocaleString('ru-RU')}`
        : 'Актуальная рыночная котировка';
    const wear = item.marketWear ? `<small>${escapeHtml(item.marketWear)}</small>` : '';
    const content = `${formatMoney(item.price)} ₽${wear}`;
    if (!item.marketUrl) {
        return `<span class="${className}" title="${updatedAt}">${content}</span>`;
    }
    if (!/^https:\/\/skinport\.com\//i.test(item.marketUrl)) {
        return `<span class="${className}" title="${updatedAt}">${content}</span>`;
    }
    const marketUrl = String(item.marketUrl).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
    return `<a class="${className} market-price-link" href="${marketUrl}" target="_blank" rel="noopener noreferrer" title="${updatedAt}">${content}</a>`;
}