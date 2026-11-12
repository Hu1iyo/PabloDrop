let skinSelectMode = 'source';
let targetSkinOptions = [];
const MAX_UPGRADE_SOURCE_ITEMS = 6;

function openSkinSelectModal() {
    if (isUpgrading) return;
    skinSelectMode = 'source';
    skinSelectModal.style.display = 'flex';
    skinSearch.value = '';
    skinModalTitle.textContent = 'Выбери скины из инвентаря';
    renderSkinSelectGrid();
}

function openTargetSkinSelectModal() {
    if (isUpgrading || upgradeSourceItems.length === 0) return;
    skinSelectMode = 'target';
    skinSelectModal.style.display = 'flex';
    skinSearch.value = '';
    skinModalTitle.textContent = 'Выбери желаемый скин';
    renderSkinSelectGrid();
}

function renderSkinSelectGrid(filter = '') {
    const searchTerm = filter.trim().toLowerCase();
    const isTargetSelection = skinSelectMode === 'target';
    const sourceTotal = upgradeSourceItems.reduce((total, item) => total + getMarketSkin(item).price, 0);
    let skins;

    if (isTargetSelection) {
        targetSkinOptions = getShopSkins()
            .map(getMarketSkin)
            .filter(skin => isMarketPriceAvailable(skin)
                && skin.price > sourceTotal
                && !upgradeSourceItems.some(source => source.name === skin.name));
        skins = targetSkinOptions.filter(skin => getDisplaySkinName(skin.name).toLowerCase().includes(searchTerm));
    } else {
        skins = getInventory().map(i => ({ ...i, fromInventory: true }));
        if (searchTerm) {
            skins = skins.filter(s => s.name.toLowerCase().includes(searchTerm));
        }
    }

    skinSelectCount.textContent = isTargetSelection
        ? `Доступно: ${targetSkinOptions.length}`
        : `Выбрано: ${upgradeSourceItems.length} / ${MAX_UPGRADE_SOURCE_ITEMS}`;
    if (skins.length === 0) {
        skinSelectGrid.innerHTML = `
            <div style="text-align:center; color:var(--text-dim); padding:40px; grid-column:1/-1;">
                <div style="font-size:40px; margin-bottom:10px;">${searchTerm ? '🔎' : isTargetSelection ? '🎯' : '📦'}</div>
                <div style="font-size:16px; font-weight:700; margin-bottom:5px;">${searchTerm ? 'Ничего не найдено' : isTargetSelection ? 'Нет подходящих скинов' : 'Инвентарь пуст'}</div>
                <div style="font-size:13px;">${searchTerm ? 'Измени запрос поиска' : isTargetSelection ? 'Нужен скин дороже выбранных предметов' : 'Открой кейсы, чтобы получить скины'}</div>
            </div>
        `;
        return;
    }

    skinSelectGrid.innerHTML = skins.map(s => {
        if (isTargetSelection) {
            const optionIndex = targetSkinOptions.indexOf(s);
            return `
                <button type="button" class="skin-option" data-target-index="${optionIndex}">
                    ${skinImageMarkup(s, 'skin-art')}
                    <div class="skin-option-name">${getDisplaySkinName(s.name)}</div>
                    ${marketPriceMarkup(s, 'skin-option-price')}
                </button>
            `;
        }
        const isSelected = upgradeSourceItems.some(i => i.id === s.id);
        const marketSkin = getMarketSkin(s);
        const selectionLimitReached = upgradeSourceItems.length >= MAX_UPGRADE_SOURCE_ITEMS && !isSelected;
        return `
                <button type="button" class="skin-option ${isSelected ? 'selected' : ''}"
                     aria-pressed="${isSelected}"
                 data-name="${s.name}" data-price="${marketSkin.price}" data-rarity="${s.rarity}"
                     data-id="${s.id}" ${isUpgrading || selectionLimitReached || !isMarketPriceAvailable(marketSkin) ? 'disabled' : ''}>
                ${skinImageMarkup(marketSkin, 'skin-art')}
                <div class="skin-option-name">${getDisplaySkinName(s.name)}</div>
                ${marketPriceMarkup(marketSkin, 'skin-option-price')}
                </button>
        `;
    }).join('');

    skinSelectGrid.querySelectorAll('.skin-option').forEach(opt => {
        if (isTargetSelection) {
            opt.addEventListener('click', () => {
                selectedUpgradeTarget = targetSkinOptions[Number(opt.dataset.targetIndex)] || null;
                document.querySelectorAll('.mult-btn, .quick-btn').forEach(button => button.classList.remove('active'));
                selectedMultiplier = null;
                selectedChance = null;
                closeSkinSelectModal();
                updateUpgradeUI();
            });
        } else {
            opt.addEventListener('click', () => selectSkin(opt));
        }
    });
}

function selectSkin(opt) {
    const id = Number(opt.dataset.id);
    const item = getInventory().map(getMarketSkin).find(inventoryItem => inventoryItem.id === id);
    if (!item || !isMarketPriceAvailable(item)) return;

    const existing = upgradeSourceItems.find(i => i.id === id);
    if (existing) {
        upgradeSourceItems = upgradeSourceItems.filter(i => i.id !== id);
    } else {
        if (upgradeSourceItems.length >= MAX_UPGRADE_SOURCE_ITEMS) return;
        upgradeSourceItems.push(item);
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
btnSelectTarget.addEventListener('click', openTargetSkinSelectModal);
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
        selectedUpgradeTarget = null;
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
        selectedUpgradeTarget = null;
        selectedChance = parseFloat(btn.dataset.chance);
        selectedMultiplier = null;
        updateUpgradeUI();
    });
});

btnUpgrade.addEventListener('click', () => {
    if (isUpgrading) return;
    upgradeSourceItems = upgradeSourceItems.map(getMarketSkin);
    upgradeTarget = upgradeTarget ? getMarketSkin(upgradeTarget) : null;
    if (upgradeSourceItems.length === 0
        || !upgradeSourceItems.every(isMarketPriceAvailable)
        || !isMarketPriceAvailable(upgradeTarget)) return;

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

        if (typeof YandexQuests !== 'undefined') YandexQuests.track('upgrades', 1);

        if (won) {
            addToInventory({
                ...upgradeTarget
            });
            upgradeResult.style.display = 'block';
            upgradeResult.className = 'upgrade-result win';
            upgradeResult.innerHTML = `🎉 УСПЕХ! Получен: <strong>${getDisplaySkinName(upgradeTarget.name)}</strong> (${formatCurrency(upgradeTarget.price)})`;
            upgradeSourceItems = [];
        } else {
            upgradeResult.style.display = 'block';
            upgradeResult.className = 'upgrade-result lose';
            upgradeResult.innerHTML = ` НЕУДАЧА! Выпало ${roll.toFixed(2)}% при шансе ${upgradeChance.toFixed(2)}%. Скины сгорели.`;
            upgradeSourceItems = [];
        }

        if (typeof renderQuestsPanel === 'function') renderQuestsPanel();
        updateUpgradeUI();
    }, 4700);
});