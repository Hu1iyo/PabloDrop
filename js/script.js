// ===== ИНИЦИАЛИЗАЦИЯ =====
applyCachedMarketData();
updateAuthUI();
renderShowcase();
renderCases();
updateBalance();

async function refreshMarketViews() {
	await refreshMarketData();
	renderShowcase();
	renderCases();
	if (currentPage === 'inventory') renderInventory();
	if (currentPage === 'upgrade') updateUpgradeUI();
	if (currentPage === 'contracts') renderContracts();
	if (currentCase) refreshOpeningMarketPrices();
}

refreshMarketViews();
setInterval(refreshMarketViews, 5 * 60 * 1000);