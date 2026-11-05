let casesScrollPosition = 0;
let openingIsFree = false;
let completedOpeningSessions = 0;
let caseOpeningCompleted = false;

function updateOpenButtonPrice() {
    if (!currentCase) return;
    const total = openingIsFree ? 0 : currentCase.price * openQuantity;
    openPrice.textContent = openingIsFree ? 'БЕСПЛАТНО' : formatMoney(total) + ' ₽';
    openBtn.querySelector('span').textContent = openingIsFree ? 'Открыть' : 'Открыть за';
    const hasPricedDrops = currentCase.items.some(isMarketPriceAvailable);
    openBtn.disabled = isSpinning || !hasPricedDrops;
    openBtn.title = hasPricedDrops ? '' : 'Открытие недоступно: нет свежих рыночных котировок';
}

function refreshOpeningMarketPrices() {
    if (!currentCase) return;
    contentsGrid.innerHTML = currentCase.items.map(item => `
        <div class="content-item">
            ${skinImageMarkup(item, 'skin-art')}
            <div class="content-item-name">${getDisplaySkinName(item.name)}</div>
            ${marketPriceMarkup(item, 'content-item-price')}
        </div>
    `).join('');
    document.querySelectorAll('.content-item').forEach((element, index) => {
        element.style.borderTop = `3px solid ${RARITY_COLORS[currentCase.items[index].rarity]}`;
    });
    updateOpenButtonPrice();
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

function openCasePage(caseId, options = {}) {
    currentCase = CASES.find(c => c.id === caseId);
    if (!currentCase) return;

    openingIsFree = options.free === true;
    casesScrollPosition = window.scrollY;
    caseTitle.textContent = currentCase.name;
    casePrice.textContent = openingIsFree ? 'Ежедневный бесплатный кейс' : currentCase.price + ' ₽';
    caseEmoji.innerHTML = caseArtworkMarkup(currentCase, 'opening');
    openQuantity = 1;
    document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.qty-btn[data-qty="1"]').classList.add('active');
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.disabled = openingIsFree && button.dataset.qty !== '1';
    });
    updateOpenButtonPrice();

    refreshOpeningMarketPrices();

    pageCases.style.display = 'none';
    showcaseSection.style.display = 'none';
    pageOpening.style.display = 'block';
    rouletteMulti.innerHTML = '';
    resultsContainer.innerHTML = '';
    window.scrollTo(0, 0);
}

backBtn.addEventListener('click', goHome);

function goHome() {
    if (caseOpeningCompleted) {
        completedOpeningSessions += 1;
        caseOpeningCompleted = false;
        if (completedOpeningSessions >= 3 && typeof YandexAds !== 'undefined') {
            YandexAds.showInterstitial().then(wasShown => {
                if (wasShown) completedOpeningSessions = 0;
            });
        }
    }
    pageOpening.style.display = 'none';
    pageCases.style.display = 'block';
    showcaseSection.style.display = 'block';
    currentCase = null;
    openingIsFree = false;
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.disabled = false;
    });
    rouletteMulti.innerHTML = '';
    resultsContainer.innerHTML = '';
    window.scrollTo(0, casesScrollPosition);
}

function openDailyFreeCase() {
    if (!YandexDaily.canGetFreeCase()) {
        showToast('Бесплатный кейс ещё восстанавливается');
        renderDailyPanel();
        return;
    }
    const availableCases = CASES
        .filter(caseItem => caseItem.items.some(isMarketPriceAvailable))
        .sort((first, second) => first.price - second.price);
    if (availableCases.length === 0) {
        showToast('Кейсы временно недоступны. Попробуй позже.');
        return;
    }
    openCasePage(availableCases[0].id, { free: true });
}

openBtn.addEventListener('click', () => {
    if (isSpinning) return;
    if (!currentCase) return;
    const pricedItems = currentCase.items.filter(isMarketPriceAvailable);
    if (pricedItems.length === 0) {
        resultsContainer.innerHTML = `
            <div class="result-box">
                <div class="result-item" style="color:#ff4757;">Нет свежих котировок Skinport для предметов этого кейса.</div>
            </div>
        `;
        return;
    }

    if (openingIsFree && !YandexDaily.canGetFreeCase()) {
        showToast('Бесплатный кейс уже использован');
        goHome();
        return;
    }
    const totalPrice = openingIsFree ? 0 : currentCase.price * openQuantity;

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
    if (openingIsFree) {
        YandexDaily.markFreeCaseUsed();
        YandexPlayer.saveToCloud();
        renderDailyPanel();
    }
    resultsContainer.innerHTML = '';
    rouletteMulti.innerHTML = '';

    const winningItems = [];
    for (let i = 0; i < openQuantity; i++) {
        winningItems.push(getRandomItemAdjusted(pricedItems, currentCase.price));
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
        const rouletteItems = generateRouletteItems(winningItems[i], pricedItems);
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
        updateOpenButtonPrice();

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
                    ${getDisplaySkinName(item.name)} — ${marketPriceMarkup(item, 'result-item-price')}
                </div>
            `;
            resultsContainer.appendChild(resultBox);
        });

        updatePlayerStats(totalPrice, 0, openQuantity);
        if (typeof YandexQuests !== 'undefined') YandexQuests.track('casesOpened', openQuantity);
        if (typeof YandexLeaderboards !== 'undefined') YandexLeaderboards.submitScore();
        if (typeof renderQuestsPanel === 'function') renderQuestsPanel();
        if (typeof renderLevelPanel === 'function') renderLevelPanel();
        caseOpeningCompleted = true;
        console.log(`House profit: ${getHouseProfit().toFixed(2)} ₽ (открыто ${openQuantity} кейсов)`);
    }, totalDuration);
});