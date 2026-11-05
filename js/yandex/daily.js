// ===== ЕЖЕДНЕВНЫЙ БОНУС, STREAK, БЕСПЛАТНЫЙ КЕЙС =====
// Данные хранятся в user.daily и синхронизируются через YandexPlayer.

const YandexDaily = (() => {
    const REWARDS = [100, 150, 250, 400, 600, 1000, 2500]; // 7 дней, растёт
    const FREE_CASE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

    function todayKey(date = new Date()) {
        // Ключ дня в UTC+3 (Москва) — стабильно для Яндекса
        const msk = new Date(date.getTime() + 3 * 60 * 60 * 1000);
        return msk.toISOString().slice(0, 10);
    }

    function getDailyState() {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        return (user && user.daily) || {
            streak: 0,
            lastClaimDate: null,
            lastFreeCaseAt: null,
            totalRewards: 0,
        };
    }

    function saveDailyState(state) {
        if (typeof updateCurrentUser === 'function') {
            updateCurrentUser({ daily: state });
        }
    }

    /** Сколько дней подряд (с учётом пропусков) */
    function computeStreak(state) {
        if (!state.lastClaimDate) return 0;
        const today = todayKey();
        const last = state.lastClaimDate;
        if (last === today) return state.streak;
        const yesterday = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
        if (last === yesterday) return state.streak;
        return 0;
    }

    function canClaim() {
        const state = getDailyState();
        return state.lastClaimDate !== todayKey();
    }

    function nextDayNumber() {
        const state = getDailyState();
        const streak = computeStreak(state);
        return (streak % REWARDS.length) + 1;
    }

    function claim() {
        const state = getDailyState();
        const today = todayKey();
        if (state.lastClaimDate === today) return { success: false, reason: 'already-claimed' };

        const streak = computeStreak(state) + 1;
        const dayIndex = (streak - 1) % REWARDS.length;
        const reward = REWARDS[dayIndex];

        const nextState = {
            ...state,
            streak,
            lastClaimDate: today,
            totalRewards: (state.totalRewards || 0) + reward,
        };
        saveDailyState(nextState);

        if (typeof balance !== 'undefined') {
            balance += reward;
            if (typeof updateBalance === 'function') updateBalance();
        }

        return { success: true, reward, streak, dayIndex };
    }

    function canGetFreeCase() {
        const state = getDailyState();
        if (!state.lastFreeCaseAt) return true;
        return Date.now() - state.lastFreeCaseAt >= FREE_CASE_COOLDOWN_MS;
    }

    function markFreeCaseUsed() {
        const state = getDailyState();
        saveDailyState({ ...state, lastFreeCaseAt: Date.now() });
    }

    function freeCaseRemainingMs() {
        const state = getDailyState();
        if (!state.lastFreeCaseAt) return 0;
        return Math.max(0, FREE_CASE_COOLDOWN_MS - (Date.now() - state.lastFreeCaseAt));
    }

    return {
        REWARDS,
        todayKey,
        getDailyState,
        computeStreak,
        canClaim,
        nextDayNumber,
        claim,
        canGetFreeCase,
        markFreeCaseUsed,
        freeCaseRemainingMs,
    };
})();
