// ===== АВТОРИЗАЦИЯ (JSON-хранилище) =====
const AUTH_KEY = 'pabloUsersDB';

// Простое "хеширование" (не для продакшена, но скрывает пароль от глаз)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

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

// Получить текущего пользователя
function getCurrentUser() {
    const db = getUsersDB();
    if (!db.currentUserId) return null;
    return db.users.find(u => u.id === db.currentUserId) || null;
}

// Регистрация
function registerUser(username, password) {
    const db = getUsersDB();
    
    // Проверка уникальности
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: 'Пользователь с таким логином уже существует' };
    }

    const newUser = {
        id: Date.now(),
        username: username,
        password: hashPassword(password),
        balance: 5000,
        inventory: [],
        stats: { totalSpent: 0, totalWon: 0, casesOpened: 0 },
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.currentUserId = newUser.id;
    saveUsersDB(db);

    return { success: true, user: newUser };
}

// Вход
function loginUser(username, password) {
    const db = getUsersDB();
    const hashed = hashPassword(password);
    
    const user = db.users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === hashed
    );

    if (!user) {
        return { success: false, error: 'Неверный логин или пароль' };
    }

    db.currentUserId = user.id;
    saveUsersDB(db);

    return { success: true, user };
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