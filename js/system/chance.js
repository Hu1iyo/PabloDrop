const HOUSE_EDGE = 0.10;
const UPGRADE_HIDDEN_EDGE = 0.07;

const BASE_CHANCES = {
    white: 0.75,
    lightblue: 0.15,
    blue: 0.05,
    purple: 0.035,
    pink: 0.012,
    red: 0.0025,
    gold: 0.0005
};

function calculateExpectedValue(items) {
    let ev = 0;
    items.forEach(item => {
        const chance = BASE_CHANCES[item.rarity] || 0.01;
        ev += item.price * chance;
    });
    return ev;
}

function adjustChances(items, casePrice) {
    const targetEV = casePrice * (1 - HOUSE_EDGE);
    const currentEV = calculateExpectedValue(items);

    if (currentEV <= targetEV) {
        return items.map(item => ({
            ...item,
            chance: BASE_CHANCES[item.rarity] || 0.01
        }));
    }

    const multiplier = targetEV / currentEV;

    return items.map(item => {
        const baseChance = BASE_CHANCES[item.rarity] || 0.01;
        const priceFactor = item.price / casePrice;
        const adjustment = Math.pow(multiplier, priceFactor);
        return {
            ...item,
            chance: Math.max(baseChance * adjustment, 0.001)
        };
    });
}

function normalizeChances(items) {
    const total = items.reduce((sum, item) => sum + item.chance, 0);
    return items.map(item => ({
        ...item,
        chance: item.chance / total
    }));
}

function getRandomItemAdjusted(items, casePrice) {
    const adjustedItems = normalizeChances(adjustChances(items, casePrice));
    const rand = Math.random();
    let cumulative = 0;
    for (const item of adjustedItems) {
        cumulative += item.chance;
        if (rand <= cumulative) return item;
    }
    return adjustedItems[0];
}

function calculateUpgradeChance(sourceTotal, targetPrice) {
    if (!targetPrice || targetPrice <= 0) return 0;
    let raw = (sourceTotal / targetPrice) * 100;
    raw = raw * (1 - HOUSE_EDGE);
    return Math.min(raw, 95);
}

function getRealChance(displayedChance) {
    const real = displayedChance * (1 - UPGRADE_HIDDEN_EDGE);
    return Math.max(real, 0);
}