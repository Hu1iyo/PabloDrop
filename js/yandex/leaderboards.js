// ===== ЛИДЕРБОРДЫ YANDEX =====
// Отправка результата по стоимости инвентаря и загрузка топа.

const YandexLeaderboards = (() => {
    const LEADERBOARD_NAME = 'inventoryValue';
    let cachedEntries = null;
    let cachedAt = 0;
    const CACHE_MS = 60 * 1000;

    function computeInventoryValue() {
        const inv = typeof getInventory === 'function' ? getInventory() : [];
        let total = 0;
        for (const item of inv) {
            const market = typeof getMarketSkin === 'function' ? getMarketSkin(item) : item;
            if (Number.isFinite(market.price) && market.price > 0) total += market.price;
            else if (Number.isFinite(market.catalogPrice) && market.catalogPrice > 0) total += market.catalogPrice;
        }
        return Math.round(total);
    }

    /** Отправляем текущую стоимость инвентаря в лидерборд */
    async function submitScore() {
        const sdk = YandexSDK.sdk;
        const player = YandexSDK.player;
        if (!sdk || !player || !YandexSDK.isPlayerAuthorized) return false;
        const score = computeInventoryValue();
        if (score <= 0) return false;
        try {
            await sdk.leaderboards.setLeaderboardScore(LEADERBOARD_NAME, score);
            return true;
        } catch (error) {
            console.warn('[Leaderboards] setScore failed', error);
            return false;
        }
    }

    /** Получаем топ игроков (кэш 60 сек) */
    async function getTop(limit = 10, forceRefresh = false) {
        const sdk = YandexSDK.sdk;
        if (!sdk) return [];
        if (!forceRefresh && cachedEntries && Date.now() - cachedAt < CACHE_MS) {
            return cachedEntries.slice(0, limit);
        }
        try {
            const result = await sdk.leaderboards.getLeaderboardEntries(LEADERBOARD_NAME, {
                quantityTop: limit,
                includeUser: true,
                quantityAround: 3,
            });
            cachedEntries = (result?.entries || []).map(entry => ({
                rank: entry.rank,
                score: entry.score,
                name: entry.player?.getName?.() || `Игрок ${entry.rank}`,
                avatar: entry.player?.getPhoto?.('small') || null,
                isCurrentUser: entry.player?.getUniqueID?.() === YandexSDK.player?.getUniqueID?.(),
            }));
            cachedAt = Date.now();
            return cachedEntries.slice(0, limit);
        } catch (error) {
            console.warn('[Leaderboards] getTop failed', error);
            return cachedEntries ? cachedEntries.slice(0, limit) : [];
        }
    }

    return { submitScore, getTop, computeInventoryValue, LEADERBOARD_NAME };
})();
