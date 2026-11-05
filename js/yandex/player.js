// ===== ОБЛАЧНЫЕ СОХРАНЕНИЯ YANDEX PLAYER =====
// Пишет прогресс в облако Яндекса (player.setData) и в localStorage как резерв.
// При первом запуске мигрирует данные из localStorage в облако.

const YandexPlayer = (() => {
    const SYNC_KEY = 'playerState';
    let lastSavedAt = 0;
    let saveTimer = null;
    let pendingState = null;

    /** Собирает компактное состояние для облака из текущего пользователя */
    function buildCloudState() {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (!user) return null;
        return {
            balance: user.balance || 0,
            inventory: user.inventory || [],
            stats: user.stats || { totalSpent: 0, totalWon: 0, casesOpened: 0 },
            daily: user.daily || null,
            updatedAt: Date.now(),
        };
    }

    async function loadCloudState() {
        const player = YandexSDK.player;
        if (!player) return null;
        try {
            const data = await player.getData([SYNC_KEY]);
            const state = data?.[SYNC_KEY];
            if (!state || typeof state !== 'object') return null;
            return state;
        } catch (error) {
            console.warn('[Player] getData failed', error);
            return null;
        }
    }

    /** Применяет облачное состояние к текущему пользователю (если оно новее локального) */
    async function syncFromCloud() {
        const cloud = await loadCloudState();
        if (!cloud) return false;
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (!user) return false;
        const localUpdatedAt = user.cloudUpdatedAt || 0;
        if (cloud.updatedAt && cloud.updatedAt > localUpdatedAt) {
            if (typeof updateCurrentUser === 'function') {
                updateCurrentUser({
                    balance: cloud.balance ?? user.balance,
                    inventory: cloud.inventory || user.inventory || [],
                    stats: cloud.stats || user.stats,
                    daily: cloud.daily || user.daily || null,
                    cloudUpdatedAt: cloud.updatedAt,
                });
            }
            console.info('[Player] Прогресс загружен из облака');
            return true;
        }
        return false;
    }

    /** Сохраняет состояние в облако (с дебаунсом) */
    function saveToCloud(immediate = false) {
        const player = YandexSDK.player;
        if (!player) return;
        pendingState = buildCloudState();
        if (!pendingState) return;

        if (saveTimer) clearTimeout(saveTimer);
        const doSave = async () => {
            if (!pendingState) return;
            const state = pendingState;
            pendingState = null;
            try {
                await player.setData({ [SYNC_KEY]: state }, immediate);
                lastSavedAt = Date.now();
                const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
                if (user && typeof updateCurrentUser === 'function') {
                    updateCurrentUser({ cloudUpdatedAt: state.updatedAt });
                }
            } catch (error) {
                console.warn('[Player] setData failed', error);
            }
        };
        if (immediate) doSave();
        else saveTimer = setTimeout(doSave, 1500);
    }

    /** Инициализация: загрузка из облака, сохранение при уходе */
    async function init() {
        if (!YandexSDK.player) return;
        await syncFromCloud();
        window.addEventListener('pagehide', () => saveToCloud(true));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveToCloud(true);
        });
    }

    return {
        init,
        saveToCloud,
        syncFromCloud,
        get lastSavedAt() { return lastSavedAt; },
    };
})();
