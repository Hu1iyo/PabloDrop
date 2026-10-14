function getInventory() {
    const user = getCurrentUser();
    if (!user) return [];
    return user.inventory || [];
}

function saveInventory(inv) {
    updateCurrentUser({ inventory: inv });
}

function addToInventory(item) {
    const inv = getInventory();
    inv.push({
        id: Date.now() + Math.random(),
        name: item.name,
        price: item.price,
        rarity: item.rarity,
        image: item.image || null,
        imageIsExact: item.imageIsExact !== false,
        imageSourceName: item.imageSourceName || null,
        marketWear: item.marketWear || null,
        marketName: item.marketName || null,
        marketUrl: item.marketUrl || null,
        marketPriceUpdatedAt: item.marketPriceUpdatedAt || null,
        marketPriceAvailable: item.marketPriceAvailable === true,
        date: Date.now()
    });
    saveInventory(inv);
}

function removeFromInventory(itemId) {
    const inv = getInventory().filter(i => i.id !== itemId);
    saveInventory(inv);
    return inv;
}

function sortInventory(inv, sortBy) {
    const sorted = [...inv];
    switch (sortBy) {
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'rarity':
            sorted.sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
            break;
        case 'date':
        default:
            sorted.sort((a, b) => b.date - a.date);
    }
    return sorted;
}