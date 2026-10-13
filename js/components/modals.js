function openSellModal(itemId) {
    const inv = getInventory();
    const item = inv.find(i => i.id === itemId);
    if (!item) return;
    pendingSellItem = item;
    modalItem.textContent = item.name;
    modalItem.style.color = RARITY_COLORS[item.rarity];
    modalPrice.textContent = item.price;
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
    balance += pendingSellItem.price;
    updateBalance();
    removeFromInventory(pendingSellItem.id);
    upgradeSourceItems = upgradeSourceItems.filter(i => i.id !== pendingSellItem.id);
    if (currentPage === 'upgrade') updateUpgradeUI();
    closeSellModal();
    renderInventory();
});