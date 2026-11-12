// ===== ИНИЦИАЛИЗАЦИЯ =====
applyCatalogPrices();
try {
	localStorage.removeItem('pabloSkinMarketCache');
} catch (error) {
	console.warn('Не удалось очистить устаревший кеш цен:', error);
}
refreshLocalSkinImages();
updateAuthUI();
renderShowcase();
renderCases();
updateBalance();
