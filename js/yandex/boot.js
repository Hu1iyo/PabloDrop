// ===== ЗАПУСК YANDEX-СЛОЯ =====
// Инициализирует SDK, авторизует через Yandex ID, синхронизирует облако.
// Работает и без SDK (локальная разработка).

(async function bootYandex() {
    await YandexSDK.init();

    if (YandexSDK.isAvailable) {
        await ensureYandexUser();
    } else {
        ensureGuestUser();
    }

    if (YandexSDK.isAvailable) {
        await YandexPlayer.init();
    }

    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof updateBalance === 'function') updateBalance();

    initYandexUI();

    setTimeout(() => YandexLeaderboards.submitScore(), 5000);
})();

async function ensureYandexUser() {
    const player = YandexSDK.player;
    if (!player) {
        ensureGuestUser();
        return;
    }
    try {
        const yandexId = typeof player.getUniqueID === 'function' ? player.getUniqueID() : null;
        if (!yandexId) { ensureGuestUser(); return; }

        const db = getUsersDB();
        const previousUser = getCurrentUser();
        let user = db.users.find(u => u.id === yandexId);
        if (!user) {
            user = {
                id: yandexId,
                username: player.getName?.() || `Игрок${String(yandexId).slice(-4)}`,
                email: '',
                balance: previousUser?.balance ?? 5000,
                inventory: previousUser?.inventory || [],
                stats: previousUser?.stats || { totalSpent: 0, totalWon: 0, casesOpened: 0 },
                daily: previousUser?.daily || null,
                createdAt: new Date().toISOString(),
            };
            db.users.push(user);
        } else if (player.getName?.()) {
            user.username = player.getName();
        }
        db.currentUserId = yandexId;
        saveUsersDB(db);
        console.info('[Yandex] Пользователь:', user.username);
    } catch (error) {
        console.warn('[Yandex] Не удалось получить данные игрока', error);
        ensureGuestUser();
    }
}

function ensureGuestUser() {
    const db = getUsersDB();
    if (db.currentUserId) return;
    let guest = db.users.find(u => u.id === 'guest');
    if (!guest) {
        guest = {
            id: 'guest',
            username: 'Гость',
            email: '',
            balance: 5000,
            inventory: [],
            stats: { totalSpent: 0, totalWon: 0, casesOpened: 0 },
            daily: null,
            createdAt: new Date().toISOString(),
        };
        db.users.push(guest);
    }
    db.currentUserId = 'guest';
    saveUsersDB(db);
}

function initYandexUI() {
    renderLevelPanel();
    renderDailyPanel();
    renderQuestsPanel();
    renderLeaderboardPanel();
    bindDepositToAds();
    startGameplayTracking();
    setInterval(renderDailyPanel, 60 * 1000);
}
