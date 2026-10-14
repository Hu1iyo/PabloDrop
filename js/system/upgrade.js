function getShopSkins() {
    const all = [];
    const seen = new Set();
    CASES.forEach(c => {
        c.items.forEach(item => {
            if (!seen.has(item.name)) {
                seen.add(item.name);
                all.push({ ...item });
            }
        });
    });
    return all;
}

function findBestSkin(targetPrice) {
    const shop = getShopSkins();
    const sourceTotal = upgradeSourceItems.reduce((s, i) => s + i.price, 0);
    const candidates = shop.filter(s => s.price > sourceTotal);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => Math.abs(a.price - targetPrice) - Math.abs(b.price - targetPrice));
    return candidates[0];
}

function updateUpgradeUI() {
    const sourceTotal = upgradeSourceItems.reduce((s, i) => s + i.price, 0);

    if (upgradeSourceItems.length === 0) {
        slotSourceContent.innerHTML = `
            <div class="slot-placeholder">
                <div class="slot-icon">🎒</div>
                <div class="slot-title">Выбери скины из инвентаря</div>
                <div class="slot-subtitle">Можно несколько</div>
            </div>
        `;
        slotSource.classList.remove('has-item');
        infoSource.textContent = '—';
    } else {
        slotSourceContent.innerHTML = `
            <div class="slot-selection">
                <div class="slot-selection-heading">Выбрано: ${upgradeSourceItems.length}</div>
                <div class="slot-selected-list">
                    ${upgradeSourceItems.map(item => `
                        <div class="slot-selected-item">
                            ${skinImageMarkup(item, 'skin-art slot-selected-art')}
                            <span class="slot-selected-name" title="${item.name}">${item.name}</span>
                            ${marketPriceMarkup(item, 'slot-selected-price')}
                            <button type="button" class="slot-remove-item" data-remove-source="${item.id}"
                                aria-label="Убрать скин из апгрейда" title="Убрать скин" ${isUpgrading ? 'disabled' : ''}>×</button>
                        </div>
                    `).join('')}
                </div>
                <div class="slot-selection-total">Итого: ${sourceTotal} ₽</div>
            </div>
        `;
        slotSource.classList.add('has-item');
        infoSource.textContent = `${sourceTotal} ₽ (${upgradeSourceItems.length} шт.)`;
    }

    if (sourceTotal > 0) {
        let targetPrice;
        if (selectedChance) {
            targetPrice = sourceTotal / ((selectedChance / 100) / (1 - HOUSE_EDGE));
        } else {
            targetPrice = sourceTotal * selectedMultiplier;
        }

        upgradeTarget = findBestSkin(targetPrice);

        if (upgradeTarget) {
            upgradeChance = calculateUpgradeChance(sourceTotal, upgradeTarget.price);
            slotTargetContent.innerHTML = `
                <div class="slot-item-display">
                    ${skinImageMarkup(upgradeTarget, 'skin-art slot-target-art')}
                    <div class="slot-item-rarity" style="color: ${RARITY_COLORS[upgradeTarget.rarity]}">${RARITY_NAMES[upgradeTarget.rarity]}</div>
                    <div class="slot-item-name">${upgradeTarget.name}</div>
                    ${marketPriceMarkup(upgradeTarget, 'slot-item-price')}
                </div>
            `;
            slotTarget.classList.add('has-item');
            infoTarget.textContent = `${upgradeTarget.name} — ${formatMoney(upgradeTarget.price)} ₽${upgradeTarget.marketWear ? ` · ${upgradeTarget.marketWear}` : ''}`;
        } else {
            upgradeTarget = null;
            upgradeChance = 0;
            slotTargetContent.innerHTML = `
                <div class="slot-placeholder">
                    <div class="slot-icon"></div>
                    <div class="slot-title">Нет подходящих скинов</div>
                    <div class="slot-subtitle">Выбери больше скинов</div>
                </div>
            `;
            slotTarget.classList.remove('has-item');
            infoTarget.textContent = '—';
        }
    } else {
        upgradeTarget = null;
        upgradeChance = 0;
        slotTargetContent.innerHTML = `
            <div class="slot-placeholder">
                <div class="slot-icon">🎯</div>
                <div class="slot-title">Выбери скины из инвентаря</div>
                <div class="slot-subtitle">Цель подберётся автоматически</div>
            </div>
        `;
        slotTarget.classList.remove('has-item');
        infoTarget.textContent = '—';
    }

    chanceValue.textContent = upgradeChance.toFixed(2) + '%';
    const winArc = (upgradeChance / 100) * CIRCUMFERENCE;
    const loseArc = CIRCUMFERENCE - winArc;
    chanceFillWin.style.strokeDasharray = `${winArc} ${CIRCUMFERENCE}`;
    chanceFillLose.style.strokeDasharray = `${loseArc} ${CIRCUMFERENCE}`;
    chanceFillLose.style.strokeDashoffset = `-${winArc}`;

    chancePointer.style.transition = 'none';
    chancePointer.style.transform = 'rotate(0deg)';
    void chancePointer.offsetWidth;

    btnSelectSource.disabled = isUpgrading;
    document.querySelectorAll('.mult-btn, .quick-btn').forEach(button => {
        button.disabled = isUpgrading;
    });
    btnUpgrade.disabled = isUpgrading || !upgradeTarget || upgradeSourceItems.length === 0;
}

function renderUpgradeSlots() {
    if (!document.querySelector('.mult-btn.active') && !document.querySelector('.quick-btn.active')) {
        document.querySelectorAll('.mult-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
        const defaultBtn = document.querySelector('.mult-btn[data-mult="2"]');
        if (defaultBtn) defaultBtn.classList.add('active');
        selectedMultiplier = 2;
        selectedChance = null;
    }
    updateUpgradeUI();
}

function animatePointer(won) {
    const fullRotations = 5;
    let targetAnglePercent;

    if (won) {
        const safeMargin = Math.max(upgradeChance * 0.1, 2);
        const minAngle = safeMargin;
        const maxAngle = upgradeChance - safeMargin;
        targetAnglePercent = minAngle + Math.random() * (maxAngle - minAngle);
    } else {
        const safeMargin = Math.max((100 - upgradeChance) * 0.1, 2);
        const minAngle = upgradeChance + safeMargin;
        const maxAngle = 100 - safeMargin;
        targetAnglePercent = minAngle + Math.random() * (maxAngle - minAngle);
    }

    const targetAngleDeg = targetAnglePercent * 3.6;
    const finalRotation = fullRotations * 360 + targetAngleDeg;

    requestAnimationFrame(() => {
        chancePointer.style.transition = 'transform 4.5s cubic-bezier(0.15, 0.85, 0.25, 1)';
        chancePointer.style.transform = `rotate(${finalRotation}deg)`;
    });
}