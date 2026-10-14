function renderInventory() {
    const inv = getInventory().map(getMarketSkin);
    const sorted = sortInventory(inv, invSortSelect.value);

    invCountEl.textContent = inv.length;
    const total = inv.reduce((sum, i) => sum + i.price, 0);
    invTotalEl.textContent = formatMoney(total) + ' ₽';

    if (inv.length === 0) {
        inventoryGrid.style.display = 'none';
        inventoryEmpty.style.display = 'block';
        sellAllBtn.style.display = 'none';
        return;
    }

    inventoryGrid.style.display = 'grid';
    inventoryEmpty.style.display = 'none';
    sellAllBtn.style.display = 'block';

    inventoryGrid.innerHTML = sorted.map(item => `
        <div class="inventory-item" data-id="${item.id}">
            <div class="inv-item-rarity" style="color: ${RARITY_COLORS[item.rarity]}">${RARITY_NAMES[item.rarity]}</div>
            ${skinImageMarkup(item, 'skin-art')}
            <div class="inv-item-name">${item.name}</div>
            ${marketPriceMarkup(item, 'inv-item-price')}
            <button class="btn-sell" data-id="${item.id}">💸 Продать</button>
        </div>
    `).join('');

    document.querySelectorAll('.inventory-item').forEach(el => {
        const id = parseFloat(el.dataset.id);
        const item = inv.find(i => i.id === id);
        if (item) el.style.borderTop = `3px solid ${RARITY_COLORS[item.rarity]}`;
    });

    document.querySelectorAll('.btn-sell').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSellModal(parseFloat(btn.dataset.id));
        });
    });
}

sellAllBtn.addEventListener('click', () => {
    const inv = getInventory();
    if (inv.length === 0) return;
    if (!confirm(`Продать все ${inv.length} предметов?`)) return;

    const total = inv.reduce((sum, i) => sum + i.price, 0);
    balance += total;
    updateBalance();
    saveInventory([]);
    upgradeSourceItems = [];
    if (currentPage === 'upgrade') updateUpgradeUI();
    renderInventory();
});

invSortSelect.addEventListener('change', renderInventory);
goToCasesBtn.addEventListener('click', () => navigateTo('cases'));