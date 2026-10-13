function updateBalance() {
    balanceEl.textContent = formatMoney(balance);
    // Сохраняем в профиль текущего пользователя
    const user = getCurrentUser();
    if (user) {
        updateCurrentUser({ balance: balance });
    }
}