const SKIN_MARKET_STORAGE_KEY = 'pabloSkinMarketCache';
const SKIN_MARKET_DATA = {};

function getMarketSkin(item) {
    const market = SKIN_MARKET_DATA[item.name];
    if (!market) return { ...item, marketPriceAvailable: false };

    return {
        ...item,
        price: Number.isFinite(market.price) ? market.price : item.catalogPrice ?? item.price,
        catalogPrice: item.catalogPrice ?? item.price,
        image: market.image || item.image || null,
        imageIsExact: market.imageIsExact !== false,
        imageSourceName: market.imageSourceName || item.imageSourceName || null,
        priceFeedAvailable: market.priceFeedAvailable !== false,
        marketWear: market.wear,
        marketName: market.marketName,
        marketUrl: market.marketUrl,
        marketPriceUpdatedAt: market.priceUpdatedAt,
        marketPriceAvailable: Number.isFinite(market.price),
    };
}

function applyMarketSnapshot(snapshot) {
    Object.assign(SKIN_MARKET_DATA, snapshot.items || {});
    CASES.forEach(caseItem => {
        caseItem.items = caseItem.items.map(getMarketSkin);
    });

    const user = getCurrentUser();
    if (user && user.inventory) {
        updateCurrentUser({ inventory: user.inventory.map(getMarketSkin) });
    }
}

function setMarketStatus(message, state = '') {
    const status = document.getElementById('market-status');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
}

function applyCachedMarketData() {
    try {
        const cached = JSON.parse(localStorage.getItem(SKIN_MARKET_STORAGE_KEY));
        if (!cached || !cached.items) return false;
        applyMarketSnapshot(cached);
        setMarketStatus(
            `Рынок Skinport · ₽ · обновлено ${new Date(cached.updatedAt).toLocaleString('ru-RU')}`,
            'cached'
        );
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
        if (!response.ok) throw new Error('Market data unavailable');

        const snapshot = await response.json();
        const cache = {
            items: snapshot.items || {},
            updatedAt: snapshot.updatedAt,
            pricesAvailable: snapshot.items && Object.values(snapshot.items).some(item => item.priceFeedAvailable),
        };
        localStorage.setItem(SKIN_MARKET_STORAGE_KEY, JSON.stringify(cache));
        applyMarketSnapshot(cache);

        const pricedCount = Object.values(cache.items).filter(item => Number.isFinite(item.price)).length;
        const statusText = cache.pricesAvailable
            ? `Рынок Skinport · ₽ · цены доступны для ${pricedCount} из ${names.length} скинов`
            : `Каталог изображений · картинки доступны для ${Object.values(cache.items).filter(item => item.image).length} из ${names.length} скинов · цены Skinport временно недоступны`;
        setMarketStatus(
            `${statusText} · обновлено ${new Date(cache.updatedAt).toLocaleString('ru-RU')}`,
            cache.pricesAvailable && pricedCount === names.length ? 'ready' : 'partial'
        );
        return true;
    } catch {
        const hasCache = applyCachedMarketData();
        setMarketStatus(
            hasCache ? 'Skinport временно недоступен · показаны сохранённые рыночные данные' : 'Skinport временно недоступен · показаны цены каталога',
            'offline'
        );
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
        return `<span class="${className} skin-art-fallback" title="Точного изображения нет; показано оружие: ${sourceName}">${image}<small class="skin-art-note">Изображение оружия</small></span>`;
    }
    return `<img class="${className} skin-art-image" src="${imageUrl}" alt="" loading="lazy" decoding="async">`;
}

function marketPriceMarkup(item, className = 'skin-market-price') {
    const price = Number(item.price) || 0;
    if (!item.marketPriceAvailable) {
        const note = item.priceFeedAvailable === false ? 'рынок недоступен' : 'нет листинга';
        return `<span class="${className} market-price-estimate">≈ ${formatMoney(price)} ₽<small>${note}</small></span>`;
    }
    const wear = item.marketWear ? `<small>${item.marketWear}</small>` : '';
    return `<span class="${className}">${formatMoney(price)} ₽${wear}</span>`;
}