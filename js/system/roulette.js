function generateRouletteItems(winningItem, allItems) {
    const ITEMS_COUNT = 60;
    const WINNING_INDEX = 48;
    const rouletteItems = [];

    const byRarity = {
        white: allItems.filter(i => i.rarity === 'white'),
        lightblue: allItems.filter(i => i.rarity === 'lightblue'),
        blue: allItems.filter(i => i.rarity === 'blue'),
        purple: allItems.filter(i => i.rarity === 'purple'),
        pink: allItems.filter(i => i.rarity === 'pink'),
        red: allItems.filter(i => i.rarity === 'red'),
        gold: allItems.filter(i => i.rarity === 'gold')
    };

    const pickFrom = (rarity) => {
        const pool = byRarity[rarity];
        if (!pool || pool.length === 0) return allItems[Math.floor(Math.random() * allItems.length)];
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const winIdx = RARITY_ORDER.indexOf(winningItem.rarity);
    const nearbyRarities = [
        RARITY_ORDER[Math.max(0, winIdx - 1)],
        winningItem.rarity,
        RARITY_ORDER[Math.min(6, winIdx + 1)]
    ];

    for (let i = 0; i < ITEMS_COUNT; i++) {
        if (i === WINNING_INDEX) {
            rouletteItems.push(winningItem);
            continue;
        }

        const distance = Math.abs(i - WINNING_INDEX);
        let item;

        if (distance <= 3) {
            const rarity = nearbyRarities[Math.floor(Math.random() * nearbyRarities.length)];
            item = pickFrom(rarity);
        } else if (distance <= 10) {
            const rand = Math.random();
            if (rand > 0.7) item = pickFrom('pink');
            else if (rand > 0.4) item = pickFrom('purple');
            else if (rand > 0.15) item = pickFrom('red');
            else item = pickFrom('blue');
        } else {
            const rand = Math.random();
            if (rand > 0.92) item = pickFrom('gold');
            else if (rand > 0.80) item = pickFrom('red');
            else if (rand > 0.55) item = pickFrom('pink');
            else if (rand > 0.25) item = pickFrom('purple');
            else item = pickFrom('blue');
        }

        rouletteItems.push(item);
    }

    return rouletteItems;
}

function createRouletteItem(item) {
    const div = document.createElement('div');
    div.className = 'roulette-item';
    div.style.borderTop = `3px solid ${RARITY_COLORS[item.rarity]}`;
    div.innerHTML = `
        ${skinImageMarkup(item, 'skin-art')}
        <div class="roulette-item-name">${item.name}</div>
        ${marketPriceMarkup(item, 'roulette-item-price')}
    `;
    return div;
}