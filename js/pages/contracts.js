const CONTRACT_MIN_ITEMS = 3;
const CONTRACT_MAX_ITEMS = 10;
const CONTRACT_MIN_VALUE_FACTOR = 0.7;
const CONTRACT_MAX_VALUE_FACTOR = 1.3;
const CONTRACT_TARGET_PATTERNS = {
    rifle: /^(?:StatTrak™\s+)?(?:AK-47|M4A4|M4A1-S|FAMAS|Galil AR|AUG|SG 553)\s*\|/i,
    pistol: /^(?:StatTrak™\s+)?(?:Glock-18|USP-S|P250|Desert Eagle|Five-SeveN|Tec-9|CZ75-Auto|Dual Berettas|P2000|R8 Revolver)\s*\|/i,
    sniper: /^(?:StatTrak™\s+)?(?:AWP|SSG 08|SCAR-20|G3SG1)\s*\|/i,
    smg: /^(?:StatTrak™\s+)?(?:MAC-10|MP9|MP7|MP5-SD|UMP-45|P90|PP-Bizon)\s*\|/i,
    shotgun: /^(?:StatTrak™\s+)?(?:Nova|XM1014|MAG-7|Sawed-Off)\s*\|/i,
    machinegun: /^(?:StatTrak™\s+)?(?:M249|Negev)\s*\|/i,
    knife: /(?:Knife|Bayonet|Karambit|Butterfly|M9 Bayonet|Нож|Штык|Керамбит)/i,
    glove: /(?:Gloves|Перчатки)/i,
};
let contractSelectedIds = new Set();
let contractIsSigned = false;
let contractIsRunning = false;

function getContractInventory() {
    return getInventory().map(getMarketSkin);
}

function getContractTotal(items = getContractInventory()) {
    return items
        .filter(item => contractSelectedIds.has(String(item.id)))
        .reduce((total, item) => total + (isMarketPriceAvailable(item) ? item.price : 0), 0);
}

function getContractBalanceContribution() {
    if (!contractUseBalance.checked) return 0;
    const availableBalance = Math.max(0, Number(balance) || 0);
    const requestedBalance = Math.max(0, Number(contractBalanceAmount.value) || 0);
    return Math.min(availableBalance, requestedBalance);
}

function getContractCandidates(total, target = contractTarget.value) {
    if (!total) return [];
    const minPrice = total * CONTRACT_MIN_VALUE_FACTOR;
    const maxPrice = total * CONTRACT_MAX_VALUE_FACTOR;
    const seen = new Set();
    return getShopSkins()
        .map(getMarketSkin)
        .filter(item => {
            if (!isMarketPriceAvailable(item) || seen.has(item.name)) return false;
            seen.add(item.name);
            const matchesTarget = target === 'random' || CONTRACT_TARGET_PATTERNS[target]?.test(item.name);
            return matchesTarget && item.price >= minPrice && item.price <= maxPrice;
        });
}

function updateContractSummary(items = getContractInventory()) {
    const selected = items.filter(item => contractSelectedIds.has(String(item.id)));
    const total = getContractTotal(items);
    const availableBalance = Math.max(0, Number(balance) || 0);
    const balanceContribution = getContractBalanceContribution();
    const effectiveTotal = total + balanceContribution;
    contractCount.textContent = `${selected.length} / ${CONTRACT_MAX_ITEMS}`;
    contractTotal.textContent = `≈ ${formatCurrency(total)}`;
    contractEffectiveTotal.textContent = `≈ ${formatCurrency(effectiveTotal)}`;
    contractRange.textContent = effectiveTotal > 0
        ? `≈ ${formatCurrency(effectiveTotal * CONTRACT_MIN_VALUE_FACTOR)}–${formatCurrency(effectiveTotal * CONTRACT_MAX_VALUE_FACTOR)}`
        : '—';
    contractBalanceAmount.max = availableBalance;
    contractBalanceAvailable.textContent = formatCurrency(availableBalance);

    const hasUnavailablePrice = selected.some(item => !isMarketPriceAvailable(item));
    const hasEnoughItems = selected.length >= CONTRACT_MIN_ITEMS && selected.length <= CONTRACT_MAX_ITEMS;
    const hasCandidates = hasEnoughItems && !hasUnavailablePrice && getContractCandidates(effectiveTotal).length > 0;
    contractStatus.textContent = !hasEnoughItems
        ? `Добавьте ещё ${Math.max(0, CONTRACT_MIN_ITEMS - selected.length)} предмета`
        : hasUnavailablePrice
            ? 'Для выбранных предметов нет примерных цен'
            : !hasCandidates
                ? 'Для этой суммы и цели нет доступной награды'
                : 'Подпись подтвердит обмен предметов и указанного баланса';
    contractSubmit.disabled = contractIsRunning
        || !contractIsSigned
        || !hasCandidates
        || (contractUseBalance.checked && balanceContribution <= 0);
}

function renderContracts() {
    const items = getContractInventory();
    const existingIds = new Set(items.map(item => String(item.id)));
    contractSelectedIds = new Set([...contractSelectedIds].filter(id => existingIds.has(id)));
    const selected = items.filter(item => contractSelectedIds.has(String(item.id)));
    contractSlots.innerHTML = Array.from({ length: CONTRACT_MAX_ITEMS }, (_, index) => {
        const item = selected[index];
        return item
            ? `<button type="button" class="contract-slot-filled" data-remove-contract-id="${item.id}" aria-label="Убрать ${getDisplaySkinName(item.name)} из контракта">${skinImageMarkup(item, 'skin-art')}<span>${getDisplaySkinName(item.name)}</span><strong>≈ ${formatCurrency(item.price)}</strong><i aria-hidden="true">×</i></button>`
            : `<div class="contract-slot-empty"><span>${index + 1}</span><b>+</b></div>`;
    }).join('');
    contractEmpty.style.display = items.length ? 'none' : 'block';
    contractInventory.style.display = items.length ? 'grid' : 'none';
    contractInventory.innerHTML = items.map(item => {
        const selected = contractSelectedIds.has(String(item.id));
        const available = isMarketPriceAvailable(item);
        return `
            <button type="button" class="contract-item ${selected ? 'selected' : ''}" data-contract-id="${item.id}"
                aria-pressed="${selected}" ${!available || contractIsRunning ? 'disabled' : ''}>
                ${skinImageMarkup(item, 'skin-art')}
                <span class="contract-item-name">${getDisplaySkinName(item.name)}</span>
                <span class="contract-item-price" title="Примерная игровая цена">${available ? `≈ ${formatCurrency(item.price)}` : Number.isFinite(item.catalogPrice) && item.catalogPrice > 0 ? `≈ ${formatCurrency(item.catalogPrice)}` : 'Нет оценки'}</span>
            </button>
        `;
    }).join('');
    updateContractSummary(items);
}

function clearContractSignature() {
    const context = contractSignatureCanvas.getContext('2d');
    context.clearRect(0, 0, contractSignatureCanvas.width, contractSignatureCanvas.height);
    contractIsSigned = false;
    updateContractSummary();
}

function setupContractSignature() {
    const canvas = contractSignatureCanvas;
    const context = canvas.getContext('2d');
    context.strokeStyle = '#f7c948';
    context.lineWidth = 2.4;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    let drawing = false;
    const pointFromEvent = event => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
    };

    canvas.addEventListener('pointerdown', event => {
        event.preventDefault();
        drawing = true;
        canvas.setPointerCapture(event.pointerId);
        const point = pointFromEvent(event);
        context.beginPath();
        context.moveTo(point.x, point.y);
    });
    canvas.addEventListener('pointermove', event => {
        if (!drawing) return;
        const point = pointFromEvent(event);
        context.lineTo(point.x, point.y);
        context.stroke();
        if (!contractIsSigned) {
            contractIsSigned = true;
            updateContractSummary();
        }
    });
    const finishStroke = () => { drawing = false; };
    canvas.addEventListener('pointerup', finishStroke);
    canvas.addEventListener('pointercancel', finishStroke);
    contractSignatureClear.addEventListener('click', clearContractSignature);
}

function renderContractResult(item) {
    contractResult.innerHTML = `Контракт завершён: ${skinImageMarkup(item, 'skin-art contract-result-art')}<strong>${getDisplaySkinName(item.name)}</strong><span>≈ ${formatCurrency(item.price)}</span>`;
    contractResult.classList.add('visible');
}

contractSlots.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-remove-contract-id]');
    if (!removeButton || contractIsRunning) return;
    contractSelectedIds.delete(removeButton.dataset.removeContractId);
    renderContracts();
});

contractInventory.addEventListener('click', event => {
    const itemButton = event.target.closest('[data-contract-id]');
    if (!itemButton || contractIsRunning) return;
    const id = itemButton.dataset.contractId;
    if (contractSelectedIds.has(id)) {
        contractSelectedIds.delete(id);
    } else if (contractSelectedIds.size < CONTRACT_MAX_ITEMS) {
        contractSelectedIds.add(id);
    }
    renderContracts();
});

contractUseBalance.addEventListener('change', () => {
    contractBalanceAmount.disabled = !contractUseBalance.checked;
    if (contractUseBalance.checked && Number(contractBalanceAmount.value) <= 0) {
        contractBalanceAmount.value = Math.max(0, Number(balance) || 0);
    }
    updateContractSummary();
});
contractBalanceAmount.addEventListener('input', () => updateContractSummary());
contractTarget.addEventListener('change', () => updateContractSummary());

contractSubmit.addEventListener('click', () => {
    if (contractSubmit.disabled || contractIsRunning) return;
    const inventory = getInventory();
    const selected = inventory.filter(item => contractSelectedIds.has(String(item.id))).map(getMarketSkin);
    if (selected.length < CONTRACT_MIN_ITEMS || selected.length > CONTRACT_MAX_ITEMS
        || !selected.every(isMarketPriceAvailable)) return;

    const itemTotal = selected.reduce((sum, item) => sum + item.price, 0);
    const balanceContribution = getContractBalanceContribution();
    if (balanceContribution > (Number(balance) || 0)) return;
    const total = itemTotal + balanceContribution;
    const candidates = getContractCandidates(total);
    if (!candidates.length) return;
    const reward = candidates[Math.floor(Math.random() * candidates.length)];
    const selectedIds = new Set(selected.map(item => item.id));

    contractIsRunning = true;
    if (balanceContribution > 0) {
        balance -= balanceContribution;
        updateBalance();
    }
    saveInventory(inventory.filter(item => !selectedIds.has(item.id)));
    addToInventory(reward);
    if (typeof YandexQuests !== 'undefined') YandexQuests.track('contracts', 1);
    if (typeof YandexLeaderboards !== 'undefined') YandexLeaderboards.submitScore();
    if (typeof renderQuestsPanel === 'function') renderQuestsPanel();
    contractSelectedIds.clear();
    contractUseBalance.checked = false;
    contractBalanceAmount.disabled = true;
    contractBalanceAmount.value = '0';
    clearContractSignature();
    renderContractResult(reward);
    contractIsRunning = false;
    renderContracts();
});

setupContractSignature();
renderContracts();
renderContracts();