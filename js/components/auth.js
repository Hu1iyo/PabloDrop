// ===== UI АВТОРИЗАЦИИ (Yandex ID) =====
// Формы логина/регистрации удалены. На проде пользователь определяется Yandex ID
// в js/yandex/boot.js, локально — гость.

const btnLogin = document.getElementById('btn-login');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const balanceBox = document.getElementById('balance-box');
const btnDeposit = document.getElementById('btn-deposit');

function updateAuthUI() {
    const user = getCurrentUser();
    const needsYandexAuthorization = typeof YandexSDK !== 'undefined'
        && YandexSDK.isAvailable
        && !YandexSDK.isPlayerAuthorized;

    if (user) {
        if (btnLogin) {
            btnLogin.style.display = needsYandexAuthorization ? 'block' : 'none';
            btnLogin.textContent = 'Сохранить прогресс';
            btnLogin.title = 'Войдите через Яндекс, чтобы продолжить игру на других устройствах';
        }
        if (userProfile) userProfile.style.display = 'flex';
        if (balanceBox) balanceBox.style.display = 'flex';
        if (btnDeposit) btnDeposit.style.display = 'block';

        if (userName) userName.textContent = user.username;
        if (userAvatar) userAvatar.textContent = (user.username || 'U').charAt(0).toUpperCase();

        balance = user.balance || 0;
        updateBalance();
    } else {
        if (btnLogin) btnLogin.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        if (balanceBox) balanceBox.style.display = 'none';
        if (btnDeposit) btnDeposit.style.display = 'none';
        balance = 0;
        updateBalance();
    }
}

if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        if (typeof YandexSDK === 'undefined' || !YandexSDK.isAvailable) {
            showToast('Локальный режим: вы играете как гость');
            return;
        }

        btnLogin.disabled = true;
        try {
            const authorized = await YandexSDK.authorize();
            if (authorized) {
                await ensureYandexUser();
                await YandexPlayer.syncFromCloud();
                updateAuthUI();
                renderDailyPanel();
                renderQuestsPanel();
                showToast('Прогресс синхронизируется с Яндексом');
            } else {
                showToast('Не удалось подключить Яндекс ID. Попробуй ещё раз.');
            }
        } catch (error) {
            console.error('[Yandex] Не удалось синхронизировать игрока:', error);
            showToast('Не удалось сохранить прогресс. Попробуй ещё раз.');
        } finally {
            btnLogin.disabled = false;
        }
    });
}