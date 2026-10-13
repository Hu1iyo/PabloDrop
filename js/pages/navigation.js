function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');

    pageCases.style.display = 'none';
    pageOpening.style.display = 'none';
    pageInventory.style.display = 'none';
    pageUpgrade.style.display = 'none';
    showcaseSection.style.display = 'none';

    if (page === 'cases') {
        pageCases.style.display = 'block';
        showcaseSection.style.display = 'block';
    } else if (page === 'inventory') {
        pageInventory.style.display = 'block';
        renderInventory();
    } else if (page === 'upgrade') {
        pageUpgrade.style.display = 'block';
        upgradeResult.style.display = 'none';
        renderUpgradeSlots();
    }
}

document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

logoHome.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('cases');
});