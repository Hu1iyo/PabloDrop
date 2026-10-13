const depositBtn = document.querySelector('.btn-deposit');
const depositModal = document.getElementById('deposit-modal');
const depositClose = document.getElementById('deposit-close');
const depositInput = document.getElementById('deposit-input');
const depositTotal = document.getElementById('deposit-total');
const depositConfirm = document.getElementById('deposit-confirm');
let selectedDepositAmount = 0;
let selectedMethod = 'card';

function openDepositModal() {
    depositModal.style.display = 'flex';
    selectedDepositAmount = 0;
    depositInput.value = '';
    updateDepositTotal();
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
}

function closeDepositModal() {
    depositModal.style.display = 'none';
}

function updateDepositTotal() {
    const inputVal = parseInt(depositInput.value) || 0;
    const total = selectedDepositAmount || inputVal;
    depositTotal.textContent = formatMoney(total) + ' ₽';
    depositConfirm.disabled = total <= 0;
}

depositBtn.addEventListener('click', openDepositModal);
depositClose.addEventListener('click', closeDepositModal);
depositModal.querySelector('.modal-backdrop').addEventListener('click', closeDepositModal);

document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDepositAmount = parseInt(btn.dataset.amount);
        depositInput.value = '';
        updateDepositTotal();
    });
});

depositInput.addEventListener('input', () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    selectedDepositAmount = 0;
    updateDepositTotal();
});

document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMethod = btn.dataset.method;
    });
});

depositConfirm.addEventListener('click', () => {
    const inputVal = parseInt(depositInput.value) || 0;
    const amount = selectedDepositAmount || inputVal;
    if (amount <= 0) return;

    depositConfirm.textContent = 'Обработка...';
    depositConfirm.disabled = true;

    setTimeout(() => {
        balance += amount;
        updateBalance();
        closeDepositModal();
        depositConfirm.textContent = 'Пополнить';
        depositConfirm.disabled = false;

        balanceEl.style.transition = 'transform 0.3s, color 0.3s';
        balanceEl.style.color = '#00e676';
        balanceEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            balanceEl.style.color = '';
            balanceEl.style.transform = '';
        }, 600);

        console.log(` Пополнение: +${amount} ₽ (метод: ${selectedMethod})`);
    }, 800);
});