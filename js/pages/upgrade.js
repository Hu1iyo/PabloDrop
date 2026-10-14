function openSkinSelectModal() {
    if (isUpgrading) return;
    skinSelectModal.style.display = 'flex';
    skinSearch.value = '';
    skinModalTitle.textContent = 'Выбери скины из инвентаря';
    renderSkinSelectGrid();
}

function renderSkinSelectGrid(filter = '') {
    let skins = getInventory().map(i => ({ ...i, fromInventory: true }));
    const searchTerm = filter.trim().toLowerCase();

    if (searchTerm) {
        skins = skins.filter(s => s.name.toLowerCase().includes(searchTerm));
    }

    skinSelectCount.textContent = `Выбрано: ${upgradeSourceItems.length}`;
    if (skins.length === 0) {
        skinSelectGrid.innerHTML = `
            <div style="text-align:center; color:var(--text-dim); padding:40px; grid-column:1/-1;">
                <div style="font-size:40px; margin-bottom:10px;">${searchTerm ? '🔎' : '📦'}</div>
                <div style="font-size:16px; font-weight:700; margin-bottom:5px;">${searchTerm ? 'Ничего не найдено' : 'Инвентарь пуст'}</div>
                <div style="font-size:13px;">${searchTerm ? 'Измени запрос поиска' : 'Открой кейсы, чтобы получить скины'}</div>
            </div>
        `;
        return;
    }

    skinSelectGrid.innerHTML = skins.map(s => {
        const isSelected = upgradeSourceItems.some(i => i.id === s.id);
        const marketSkin = getMarketSkin(s);
        return `
                <button type="button" class="skin-option ${isSelected ? 'selected' : ''}"
                     aria-pressed="${isSelected}"
                 data-name="${s.name}" data-price="${marketSkin.price}" data-rarity="${s.rarity}"
                     data-id="${s.id}" ${isUpgrading ? 'disabled' : ''}>
                ${skinImageMarkup(marketSkin, 'skin-art')}
                <div class="skin-option-name">${s.name}</div>
                ${marketPriceMarkup(marketSkin, 'skin-option-price')}
                <div class="skin-option-rarity">${RARITY_NAMES[s.rarity]}</div>
                </button>
        `;
    }).join('');

    skinSelectGrid.querySelectorAll('.skin-option').forEach(opt => {
            opt.addEventListener('click', () => selectSkin(opt));
    });
}

function selectSkin(opt) {
    const name = opt.dataset.name;
    const price = parseFloat(opt.dataset.price);
    const rarity = opt.dataset.rarity;
    const id = Number(opt.dataset.id);

    const existing = upgradeSourceItems.find(i => i.id === id);
    if (existing) {
        upgradeSourceItems = upgradeSourceItems.filter(i => i.id !== id);
    } else {
        upgradeSourceItems.push(getMarketSkin({ name, price, rarity, id }));
    }

    updateUpgradeUI();
    renderSkinSelectGrid(skinSearch.value);
}

function closeSkinSelectModal() {
    skinSelectModal.style.display = 'none';
}

slotSourceContent.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-source]');
    if (!removeButton || isUpgrading) return;
    const itemId = removeButton.dataset.removeSource;
    upgradeSourceItems = upgradeSourceItems.filter(item => String(item.id) !== itemId);
    updateUpgradeUI();
    if (skinSelectModal.style.display === 'flex') renderSkinSelectGrid(skinSearch.value);
});

btnSelectSource.addEventListener('click', openSkinSelectModal);
skinModalClose.addEventListener('click', closeSkinSelectModal);
skinSelectDone.addEventListener('click', closeSkinSelectModal);
skinSelectModal.querySelector('.modal-backdrop').addEventListener('click', closeSkinSelectModal);
skinSearch.addEventListener('input', (e) => renderSkinSelectGrid(e.target.value));

document.querySelectorAll('.mult-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isUpgrading) return;
        document.querySelectorAll('.mult-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMultiplier = parseInt(btn.dataset.mult);
        selectedChance = null;
        updateUpgradeUI();
    });
});

document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isUpgrading) return;
        document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.mult-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedChance = parseFloat(btn.dataset.chance);
        selectedMultiplier = null;
        updateUpgradeUI();
    });
});

btnUpgrade.addEventListener('click', () => {
    if (isUpgrading) return;
    if (upgradeSourceItems.length === 0 || !upgradeTarget) return;

    const inv = getInventory();
    upgradeSourceItems.forEach(src => {
        const idx = inv.findIndex(i => i.id === src.id);
        if (idx !== -1) inv.splice(idx, 1);
    });
    saveInventory(inv);

    isUpgrading = true;
    btnUpgrade.disabled = true;
    btnSelectSource.disabled = true;
    document.querySelectorAll('.mult-btn, .quick-btn, .slot-remove-item').forEach(button => {
        button.disabled = true;
    });
    btnUpgrade.classList.add('spinning');
    upgradeResult.style.display = 'none';

    const realChance = getRealChance(upgradeChance);
    const roll = Math.random() * 100;
    const won = roll <= realChance;

    console.log(`[Upgrade] Displayed: ${upgradeChance.toFixed(2)}% | Real: ${realChance.toFixed(2)}% | Roll: ${roll.toFixed(2)}% | Won: ${won}`);

    animatePointer(won);

    setTimeout(() => {
        isUpgrading = false;
        btnUpgrade.classList.remove('spinning');

        if (won) {
            addToInventory({
                name: upgradeTarget.name,
                price: upgradeTarget.price,
                rarity: upgradeTarget.rarity
            });
            upgradeResult.style.display = 'block';
            upgradeResult.className = 'upgrade-result win';
            upgradeResult.innerHTML = `🎉 УСПЕХ! Получен: <strong>${upgradeTarget.name}</strong> (${upgradeTarget.price} ₽)`;
            upgradeSourceItems = [];
        } else {
            upgradeResult.style.display = 'block';
            upgradeResult.className = 'upgrade-result lose';
            upgradeResult.innerHTML = ` НЕУДАЧА! Выпало ${roll.toFixed(2)}% при шансе ${upgradeChance.toFixed(2)}%. Скины сгорели.`;
            upgradeSourceItems = [];
        }

        updateUpgradeUI();
    }, 4700);
});