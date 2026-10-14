function renderInventory() {
    const inv = getInventory().map(getMarketSkin);
    const sorted = sortInventory(inv, invSortSelect.value);
    const pricedItems = inv.filter(isMarketPriceAvailable);

    invCountEl.textContent = inv.length;
    const total = pricedItems.reduce((sum, item) => sum + item.price, 0);
    invTotalEl.textContent = pricedItems.length
        ? `${formatMoney(total)} ₽${pricedItems.length < inv.length ? '*' : ''}`
        : 'Нет котировок';
    invTotalEl.title = pricedItems.length < inv.length
        ? `Рыночная стоимость рассчитана только для ${pricedItems.length} из ${inv.length} предметов`
        : '';

    if (inv.length === 0) {
        inventoryGrid.style.display = 'none';
        inventoryEmpty.style.display = 'block';
        sellAllBtn.style.display = 'none';
        return;
    }

    inventoryGrid.style.display = 'grid';
    inventoryEmpty.style.display = 'none';
    sellAllBtn.style.display = 'block';
    sellAllBtn.disabled = pricedItems.length === 0;
    sellAllBtn.textContent = pricedItems.length < inv.length
        ? `💸 Продать доступные (${pricedItems.length})`
        : '💸 Продать всё';

    inventoryGrid.innerHTML = sorted.map(item => `
        <div class="inventory-item" data-id="${item.id}">
            <div class="inv-item-rarity" style="color: ${RARITY_COLORS[item.rarity]}">${RARITY_NAMES[item.rarity]}</div>
            ${skinImageMarkup(item, 'skin-art')}
            <div class="inv-item-name">${getDisplaySkinName(item.name)}</div>
            ${marketPriceMarkup(item, 'inv-item-price')}
            <button class="btn-sell" data-id="${item.id}" ${isMarketPriceAvailable(item) ? '' : 'disabled title="Нет свежей рыночной котировки"'}>💸 Продать</button>
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
    const pricedItems = inv.map(getMarketSkin).filter(isMarketPriceAvailable);
    if (pricedItems.length === 0) return;
    if (!confirm(`Продать ${pricedItems.length} предметов по актуальным рыночным ценам?`)) return;

    const total = pricedItems.reduce((sum, item) => sum + item.price, 0);
    const soldIds = new Set(pricedItems.map(item => item.id));
    balance += total;
    updateBalance();
    saveInventory(inv.filter(item => !soldIds.has(item.id)));
    upgradeSourceItems = upgradeSourceItems.filter(item => !soldIds.has(item.id));
    if (currentPage === 'upgrade') updateUpgradeUI();
    renderInventory();
});

invSortSelect.addEventListener('change', renderInventory);
goToCasesBtn.addEventListener('click', () => navigateTo('cases'));