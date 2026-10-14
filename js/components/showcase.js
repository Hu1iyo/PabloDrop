function renderShowcase() {
    const allItems = [];
    CASES.forEach(c => c.items.forEach(item => allItems.push({ ...item })));
    allItems.sort(() => Math.random() - 0.5);
    showcaseTrack.innerHTML = '';

    const createItem = (item) => {
        const div = document.createElement('div');
        div.className = 'showcase-item';
        div.style.borderTop = `3px solid ${RARITY_COLORS[item.rarity]}`;
        div.innerHTML = `
            ${skinImageMarkup(item, 'skin-art')}
            <div class="showcase-item-name">${item.name}</div>
            ${marketPriceMarkup(item, 'showcase-item-price')}
        `;
        return div;
    };

    const fragment = document.createDocumentFragment();
    for (let copy = 0; copy < 2; copy++) {
        allItems.forEach(item => fragment.appendChild(createItem(item)));
    }
    showcaseTrack.appendChild(fragment);
}