function getPlayerStats() {
    const user = getCurrentUser();
    if (!user) return { totalSpent: 0, totalWon: 0, casesOpened: 0 };
    return user.stats || { totalSpent: 0, totalWon: 0, casesOpened: 0 };
}

function updatePlayerStats(spent, won, openedCases = 1) {
    const user = getCurrentUser();
    if (!user) return;
    
    const stats = user.stats || { totalSpent: 0, totalWon: 0, casesOpened: 0 };
    stats.totalSpent += spent;
    stats.totalWon += won;
    stats.casesOpened += openedCases;
    
    updateCurrentUser({ stats });
}

function getHouseProfit() {
    const stats = getPlayerStats();
    return stats.totalSpent - stats.totalWon;
}