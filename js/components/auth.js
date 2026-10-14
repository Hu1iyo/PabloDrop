// ===== UI АВТОРИЗАЦИИ =====
const authModal = document.getElementById('auth-modal');
const authClose = document.getElementById('auth-close');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const regError = document.getElementById('reg-error');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const balanceBox = document.getElementById('balance-box');
const btnDeposit = document.getElementById('btn-deposit');

function openAuthModal(tab = 'login') {
    authModal.style.display = 'flex';
    authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    loginForm.style.display = tab === 'login' ? 'flex' : 'none';
    registerForm.style.display = tab === 'register' ? 'flex' : 'none';
    loginError.textContent = '';
    regError.textContent = '';
}

function closeAuthModal() {
    authModal.style.display = 'none';
    loginForm.reset();
    registerForm.reset();
}

function updateAuthUI() {
    const user = getCurrentUser();
    
    if (user) {
        btnLogin.style.display = 'none';
        userProfile.style.display = 'flex';
        balanceBox.style.display = 'flex';
        btnDeposit.style.display = 'block';
        
        userName.textContent = user.username;
        userAvatar.textContent = user.username.charAt(0).toUpperCase();
        
        // Загружаем данные пользователя
        balance = user.balance;
        updateBalance();
    } else {
        btnLogin.style.display = 'block';
        userProfile.style.display = 'none';
        balanceBox.style.display = 'none';
        btnDeposit.style.display = 'none';
        balance = 0;
        updateBalance();
    }
}

// Обработчики
btnLogin.addEventListener('click', () => openAuthModal('login'));
authClose.addEventListener('click', closeAuthModal);
authModal.querySelector('.modal-backdrop').addEventListener('click', closeAuthModal);

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        loginForm.style.display = isLogin ? 'flex' : 'none';
        registerForm.style.display = isLogin ? 'none' : 'flex';
        loginError.textContent = '';
        regError.textContent = '';
    });
});

// Вход
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        loginError.textContent = 'Заполните все поля';
        return;
    }

    const result = await loginUser(username, password);
    if (result.success) {
        closeAuthModal();
        updateAuthUI();
    } else {
        loginError.textContent = result.error;
    }
});

// Регистрация
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;

    if (!username || !email || !password || !password2) {
        regError.textContent = 'Заполните все поля';
        return;
    }

    if (username.length < 3) {
        regError.textContent = 'Логин должен быть не короче 3 символов';
        return;
    }

    if (password.length < 8) {
        regError.textContent = 'Пароль должен быть не короче 8 символов';
        return;
    }

    if (password !== password2) {
        regError.textContent = 'Пароли не совпадают';
        return;
    }

    const result = await registerUser(username, email, password);
    if (result.success) {
        closeAuthModal();
        updateAuthUI();
    } else {
        regError.textContent = result.error;
    }
});

// Выход
btnLogout.addEventListener('click', () => {
    // Сохраняем текущее состояние перед выходом
    const user = getCurrentUser();
    if (user) {
        updateCurrentUser({
            balance: balance,
            inventory: getInventory()
        });
    }
    logoutUser();
    updateAuthUI();
});