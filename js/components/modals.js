function openSellModal(itemId) {
    const inv = getInventory().map(getMarketSkin);
    const item = inv.find(i => i.id === itemId);
    if (!item || !isMarketPriceAvailable(item)) return;
    pendingSellItem = item;
    modalItem.textContent = getDisplaySkinName(item.name);
    modalItem.style.color = RARITY_COLORS[item.rarity];
    modalPrice.textContent = formatMoney(item.price);
    sellModal.style.display = 'flex';
}

function closeSellModal() {
    sellModal.style.display = 'none';
    pendingSellItem = null;
}

modalClose.addEventListener('click', closeSellModal);
modalCancel.addEventListener('click', closeSellModal);
sellModal.querySelector('.modal-backdrop').addEventListener('click', closeSellModal);

modalConfirm.addEventListener('click', () => {
    if (!pendingSellItem) return;
    const currentItem = getInventory()
        .map(getMarketSkin)
        .find(item => item.id === pendingSellItem.id);
    if (!currentItem || !isMarketPriceAvailable(currentItem)) {
        closeSellModal();
        return;
    }
    balance += currentItem.price;
    updateBalance();
    removeFromInventory(currentItem.id);
    upgradeSourceItems = upgradeSourceItems.filter(i => i.id !== currentItem.id);
    if (currentPage === 'upgrade') updateUpgradeUI();
    if (typeof YandexQuests !== 'undefined') YandexQuests.track('sold', 1);
    if (typeof YandexLeaderboards !== 'undefined') YandexLeaderboards.submitScore();
    if (typeof renderQuestsPanel === 'function') renderQuestsPanel();
    closeSellModal();
    renderInventory();
});