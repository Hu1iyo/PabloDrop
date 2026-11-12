function formatMoney(n) {
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatCurrency(n) {
    return `${formatMoney(n)} PC`;
}