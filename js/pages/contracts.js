const CONTRACT_MIN_ITEMS = 3;
const CONTRACT_MAX_ITEMS = 10;
const CONTRACT_MIN_VALUE_FACTOR = 0.7;
const CONTRACT_MAX_VALUE_FACTOR = 1.3;
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

function getContractCandidates(total) {
    if (!total) return [];
    const minPrice = total * CONTRACT_MIN_VALUE_FACTOR;
    const maxPrice = total * CONTRACT_MAX_VALUE_FACTOR;
    const seen = new Set();
    return getShopSkins()
        .map(getMarketSkin)
        .filter(item => {
            if (!isMarketPriceAvailable(item) || seen.has(item.name)) return false;
            seen.add(item.name);
            return item.price >= minPrice && item.price <= maxPrice;
        });
}

function updateContractSummary(items = getContractInventory()) {
    const selected = items.filter(item => contractSelectedIds.has(String(item.id)));
    const total = getContractTotal(items);
    contractCount.textContent = `${selected.length} / ${CONTRACT_MAX_ITEMS}`;
    contractTotal.textContent = `${formatMoney(total)} ₽`;
    contractRange.textContent = total > 0
        ? `${formatMoney(total * CONTRACT_MIN_VALUE_FACTOR)}–${formatMoney(total * CONTRACT_MAX_VALUE_FACTOR)} ₽`
        : '—';

    const hasUnavailablePrice = selected.some(item => !isMarketPriceAvailable(item));
    contractSubmit.disabled = contractIsRunning
        || !contractIsSigned
        || selected.length < CONTRACT_MIN_ITEMS
        || selected.length > CONTRACT_MAX_ITEMS
        || hasUnavailablePrice
        || !getContractCandidates(total).length;
}

function renderContracts() {
    const items = getContractInventory();
    const existingIds = new Set(items.map(item => String(item.id)));
    contractSelectedIds = new Set([...contractSelectedIds].filter(id => existingIds.has(id)));
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
                <span class="contract-item-price">${available ? `${formatMoney(item.price)} ₽` : 'Цена недоступна'}</span>
            </button>
        `;
    }).join('');
    updateContractSummary(items);
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
    contractSignatureClear.addEventListener('click', () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        contractIsSigned = false;
        updateContractSummary();
    });
}

function renderContractResult(item) {
    contractResult.innerHTML = `Контракт завершён: ${skinImageMarkup(item, 'skin-art contract-result-art')}<strong>${getDisplaySkinName(item.name)}</strong><span>${formatMoney(item.price)} ₽</span>`;
    contractResult.classList.add('visible');
}

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

contractSubmit.addEventListener('click', () => {
    if (contractSubmit.disabled || contractIsRunning) return;
    const inventory = getInventory();
    const selected = inventory.filter(item => contractSelectedIds.has(String(item.id))).map(getMarketSkin);
    if (selected.length < CONTRACT_MIN_ITEMS || selected.length > CONTRACT_MAX_ITEMS
        || !selected.every(isMarketPriceAvailable)) return;

    const total = selected.reduce((sum, item) => sum + item.price, 0);
    const candidates = getContractCandidates(total);
    if (!candidates.length) return;
    const reward = candidates[Math.floor(Math.random() * candidates.length)];
    const selectedIds = new Set(selected.map(item => item.id));

    contractIsRunning = true;
    saveInventory(inventory.filter(item => !selectedIds.has(item.id)));
    addToInventory(reward);
    contractSelectedIds.clear();
    renderContractResult(reward);
    contractIsRunning = false;
    renderContracts();
});

setupContractSignature();
renderContracts();