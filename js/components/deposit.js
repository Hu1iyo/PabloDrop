// ===== ПОЛУЧЕНИЕ МОНЕТ ЗА РЕКЛАМУ =====
// Реальные платёжные методы удалены: только rewarded-видео Yandex.

const depositBtn = document.querySelector('.btn-deposit');
const depositModal = document.getElementById('deposit-modal');
const depositClose = document.getElementById('deposit-close');
const depositTotal = document.getElementById('deposit-total');
const depositConfirm = document.getElementById('deposit-confirm');
let selectedDepositAmount = 1000;
let isProcessingAd = false;

function openDepositModal() {
    depositModal.style.display = 'flex';
    selectedDepositAmount = 1000;
    updateDepositTotal();
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    const first = document.querySelector('.amount-btn[data-amount="1000"]');
    if (first) first.classList.add('active');
}

function closeDepositModal() {
    depositModal.style.display = 'none';
}

function updateDepositTotal() {
    const total = selectedDepositAmount;
    depositTotal.textContent = formatCurrency(total);
    depositConfirm.disabled = total <= 0 || isProcessingAd;
}

if (depositBtn) depositBtn.addEventListener('click', openDepositModal);
if (depositClose) depositClose.addEventListener('click', closeDepositModal);
if (depositModal) {
    depositModal.querySelector('.modal-backdrop').addEventListener('click', closeDepositModal);
}

document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDepositAmount = parseInt(btn.dataset.amount);
        updateDepositTotal();
    });
});

depositConfirm.addEventListener('click', async () => {
    if (isProcessingAd || selectedDepositAmount <= 0) return;

    isProcessingAd = true;
    depositConfirm.textContent = 'Загрузка рекламы...';
    depositConfirm.disabled = true;

    const result = await YandexAds.showRewarded();

    isProcessingAd = false;
    depositConfirm.textContent = 'Смотреть рекламу';
    updateDepositTotal();

    if (!result.rewarded) {
        showRewardedFailure(result.reason);
        return;
    }

    balance += selectedDepositAmount;
    updateBalance();
    YandexPlayer.saveToCloud();
    closeDepositModal();

    balanceEl.style.transition = 'transform 0.3s, color 0.3s';
    balanceEl.style.color = '#00e676';
    balanceEl.style.transform = 'scale(1.2)';
    setTimeout(() => {
        balanceEl.style.color = '';
        balanceEl.style.transform = '';
    }, 600);

    showToast(`+${formatCurrency(selectedDepositAmount)} за просмотр рекламы 🎬`);
});