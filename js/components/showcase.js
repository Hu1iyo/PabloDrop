function renderShowcase() {
    const allItems = [];
    CASES.forEach(c => c.items.forEach(item => allItems.push({ ...item })));
    allItems.sort(() => Math.random() - 0.5);

    const createItem = (item) => {
        const div = document.createElement('div');
        div.className = 'showcase-item';
        div.style.borderTop = `3px solid ${RARITY_COLORS[item.rarity]}`;
        div.innerHTML = `
            <div class="showcase-item-name">${item.name}</div>
            <div class="showcase-item-price">${item.price} ₽</div>
        `;
        return div;
    };

    const fragment = document.createDocumentFragment();
    for (let copy = 0; copy < 2; copy++) {
        allItems.forEach(item => fragment.appendChild(createItem(item)));
    }
    showcaseTrack.appendChild(fragment);
}