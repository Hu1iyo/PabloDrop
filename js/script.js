// ===== ИНИЦИАЛИЗАЦИЯ =====
applyCachedMarketData();
updateAuthUI();
renderShowcase();
renderCases();
updateBalance();

refreshMarketData().then(updated => {
	if (!updated) return;
	renderShowcase();
	renderCases();
	if (currentPage === 'inventory') renderInventory();
	if (currentPage === 'upgrade') updateUpgradeUI();
}).catch(() => {});