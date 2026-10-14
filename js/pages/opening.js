function updateOpenButtonPrice() {
    if (!currentCase) return;
    const total = currentCase.price * openQuantity;
    openPrice.textContent = formatMoney(total) + ' ₽';
}

document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isSpinning) return;
        document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        openQuantity = parseInt(btn.dataset.qty);
        updateOpenButtonPrice();
    });
});

function openCasePage(caseId) {
    currentCase = CASES.find(c => c.id === caseId);
    if (!currentCase) return;

    caseTitle.textContent = currentCase.name;
    casePrice.textContent = currentCase.price + ' ₽';
    caseEmoji.textContent = currentCase.emoji;
    openQuantity = 1;
    document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.qty-btn[data-qty="1"]').classList.add('active');
    updateOpenButtonPrice();

    contentsGrid.innerHTML = currentCase.items.map(item => `
        <div class="content-item">
            ${skinImageMarkup(item, 'skin-art')}
            <div class="content-item-name">${item.name}</div>
            ${marketPriceMarkup(item, 'content-item-price')}
        </div>
    `).join('');

    document.querySelectorAll('.content-item').forEach((el, i) => {
        el.style.borderTop = `3px solid ${RARITY_COLORS[currentCase.items[i].rarity]}`;
    });

    pageCases.style.display = 'none';
    showcaseSection.style.display = 'none';
    pageOpening.style.display = 'block';
    rouletteMulti.innerHTML = '';
    resultsContainer.innerHTML = '';
    window.scrollTo(0, 0);
}

backBtn.addEventListener('click', goHome);

function goHome() {
    pageOpening.style.display = 'none';
    pageCases.style.display = 'block';
    showcaseSection.style.display = 'block';
    currentCase = null;
    rouletteMulti.innerHTML = '';
    resultsContainer.innerHTML = '';
}

openBtn.addEventListener('click', () => {
    if (isSpinning) return;
    if (!currentCase) return;

    const totalPrice = currentCase.price * openQuantity;

    if (balance < totalPrice) {
        resultsContainer.innerHTML = `
            <div class="result-box">
                <div class="result-item" style="color:#ff4757;">Недостаточно средств!</div>
            </div>
        `;
        return;
    }

    isSpinning = true;
    openBtn.disabled = true;
    balance -= totalPrice;
    updateBalance();
    resultsContainer.innerHTML = '';
    rouletteMulti.innerHTML = '';

    const winningItems = [];
    for (let i = 0; i < openQuantity; i++) {
        winningItems.push(getRandomItemAdjusted(currentCase.items, currentCase.price));
    }

    const roulettes = [];
    for (let i = 0; i < openQuantity; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'roulette-container';
        wrapper.innerHTML = `
            <div class="roulette-index">#${i + 1}</div>
            <div class="roulette-glow"></div>
            <div class="roulette-pointer">
                <div class="pointer-arrow"></div>
                <div class="pointer-line"></div>
            </div>
            <div class="roulette-mask">
                <div class="roulette-track"></div>
            </div>
        `;
        rouletteMulti.appendChild(wrapper);

        const track = wrapper.querySelector('.roulette-track');
        const rouletteItems = generateRouletteItems(winningItems[i], currentCase.items);
        rouletteItems.forEach(item => track.appendChild(createRouletteItem(item)));

        roulettes.push({ wrapper, track, winningItem: winningItems[i] });
    }

    roulettes.forEach((r, idx) => {
        const itemWidth = 140;
        const WINNING_INDEX = 48;
        const containerWidth = r.track.parentElement.offsetWidth;
        const targetOffset = (WINNING_INDEX * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
        const randomOffset = (Math.random() - 0.5) * 70;
        const finalOffset = targetOffset + randomOffset;

        setTimeout(() => {
            r.track.style.transition = 'transform 6s cubic-bezier(0.05, 0.7, 0.1, 1)';
            r.track.style.transform = `translateX(-${finalOffset}px)`;
        }, idx * 200);
    });

    const totalDuration = 6200 + (openQuantity - 1) * 200;
    setTimeout(() => {
        isSpinning = false;
        openBtn.disabled = false;

        winningItems.forEach(item => addToInventory(item));

        roulettes.forEach((r, idx) => {
            r.wrapper.classList.add('finished');
            const item = r.winningItem;
            const resultBox = document.createElement('div');
            resultBox.className = 'result-box compact';
            resultBox.style.animationDelay = (idx * 0.1) + 's';
            resultBox.innerHTML = `
                <div class="result-label">Кейс #${idx + 1}</div>
                <div class="result-item" style="color: ${RARITY_COLORS[item.rarity]}">
                    ${skinImageMarkup(item, 'skin-art result-item-art')}
                    ${item.name} — ${marketPriceMarkup(item, 'result-item-price')}
                </div>
            `;
            resultsContainer.appendChild(resultBox);
        });

        updatePlayerStats(totalPrice, 0);
        console.log(`House profit: ${getHouseProfit().toFixed(2)} ₽ (открыто ${openQuantity} кейсов)`);
    }, totalDuration);
});