// ===== АВТОРИЗАЦИЯ (Yandex ID + локальный fallback) =====
// Пользователи хранятся локально в pabloUsersDB.
// На проде текущий пользователь создаётся в js/yandex/boot.js из Yandex ID.
// Локально — гость, чтобы игра работала без SDK.

const AUTH_KEY = 'pabloUsersDB';

function getUsersDB() {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) {
        const empty = { users: [], currentUserId: null };
        localStorage.setItem(AUTH_KEY, JSON.stringify(empty));
        return empty;
    }
    try {
        const parsed = JSON.parse(data);
        if (!parsed || !Array.isArray(parsed.users)) {
            const empty = { users: [], currentUserId: null };
            localStorage.setItem(AUTH_KEY, JSON.stringify(empty));
            return empty;
        }
        return parsed;
    } catch {
        const empty = { users: [], currentUserId: null };
        localStorage.setItem(AUTH_KEY, JSON.stringify(empty));
        return empty;
    }
}

function saveUsersDB(db) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(db));
}

function getCurrentUser() {
    const db = getUsersDB();
    if (!db.currentUserId) return null;
    return db.users.find(u => u.id === db.currentUserId) || null;
}

function updateCurrentUser(updates) {
    const db = getUsersDB();
    const user = db.users.find(u => u.id === db.currentUserId);
    if (!user) return false;

    Object.assign(user, updates);
    saveUsersDB(db);

    // Обновление одной метки синхронизации не должно запускать новую запись в облако.
    const hasCloudStateUpdate = ['balance', 'inventory', 'stats', 'daily']
        .some(key => Object.prototype.hasOwnProperty.call(updates, key));
    if (hasCloudStateUpdate && typeof YandexPlayer !== 'undefined') {
        YandexPlayer.saveToCloud();
    }
    return true;
}