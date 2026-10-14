// ===== АВТОРИЗАЦИЯ (JSON-хранилище) =====
const AUTH_KEY = 'pabloUsersDB';

// Получить базу пользователей (JSON)
function getUsersDB() {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) {
        const empty = { users: [], currentUserId: null };
        localStorage.setItem(AUTH_KEY, JSON.stringify(empty));
        return empty;
    }
    return JSON.parse(data);
}

// Сохранить базу
function saveUsersDB(db) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(db));
}

async function requestAuth(endpoint, payload) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) return { success: false, error: result.error || 'Ошибка авторизации' };
        return { success: true, user: result.user };
    } catch {
        return { success: false, error: 'Не удалось подключиться к серверу' };
    }
}

function saveAuthenticatedUser(account) {
    const db = getUsersDB();
    let user = db.users.find(item => item.id === account.id);
    if (!user) {
        user = {
            id: account.id,
            username: account.username,
            email: account.email,
            balance: 5000,
            inventory: [],
            stats: { totalSpent: 0, totalWon: 0, casesOpened: 0 },
            createdAt: new Date().toISOString(),
        };
        db.users.push(user);
    } else {
        user.username = account.username;
        user.email = account.email;
        delete user.password;
    }
    db.currentUserId = account.id;
    saveUsersDB(db);
    return user;
}

// Получить текущего пользователя
function getCurrentUser() {
    const db = getUsersDB();
    if (!db.currentUserId) return null;
    return db.users.find(u => u.id === db.currentUserId) || null;
}

// Регистрация
async function registerUser(username, email, password) {
    const result = await requestAuth('/api/register', { username, email, password });
    if (!result.success) return result;
    return { success: true, user: saveAuthenticatedUser(result.user) };
}

// Вход
async function loginUser(username, password) {
    const result = await requestAuth('/api/login', { username, password });
    if (!result.success) return result;
    return { success: true, user: saveAuthenticatedUser(result.user) };
}

// Выход
function logoutUser() {
    const db = getUsersDB();
    db.currentUserId = null;
    saveUsersDB(db);
}

// Обновить данные текущего пользователя
function updateCurrentUser(updates) {
    const db = getUsersDB();
    const user = db.users.find(u => u.id === db.currentUserId);
    if (!user) return false;

    Object.assign(user, updates);
    saveUsersDB(db);
    return true;
}