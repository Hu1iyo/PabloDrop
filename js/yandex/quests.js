// ===== ЕЖЕДНЕВНЫЕ КВЕСТЫ =====
// Ежедневные задания сбрасываются в полночь (UTC+3).

const YandexQuests = (() => {
    const DAILY_QUESTS = [
        { id: 'open-5',    title: 'Открой 5 кейсов',     target: 5,  reward: 300, metric: 'casesOpened' },
        { id: 'upgrade-1', title: 'Сделай 1 апгрейд',    target: 1,  reward: 200, metric: 'upgrades' },
        { id: 'sell-3',    title: 'Продай 3 скина',      target: 3,  reward: 150, metric: 'sold' },
    ];

    function todayKey() {
        return YandexDaily.todayKey();
    }

    function getQuestState() {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const daily = (user && user.daily) || {};
        if (daily.questsDate !== todayKey()) {
            return {
                questsDate: todayKey(),
                progress: { casesOpened: 0, upgrades: 0, sold: 0, contracts: 0 },
                claimed: [],
            };
        }
        return daily.quests || {
            questsDate: todayKey(),
            progress: { casesOpened: 0, upgrades: 0, sold: 0, contracts: 0 },
            claimed: [],
        };
    }

    function saveQuestState(state) {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (!user) return;
        const daily = { ...(user.daily || {}), quests: state, questsDate: state.questsDate };
        if (typeof updateCurrentUser === 'function') updateCurrentUser({ daily });
    }

    /** Увеличить прогресс метрики */
    function track(metric, delta = 1) {
        const state = getQuestState();
        state.progress[metric] = (state.progress[metric] || 0) + delta;
        saveQuestState(state);
    }

    /** Список доступных сегодня квестов с прогрессом */
    function getQuests() {
        const state = getQuestState();
        return DAILY_QUESTS.map(q => {
            const progress = Math.min(state.progress[q.metric] || 0, q.target);
            const completed = progress >= q.target;
            const claimed = state.claimed.includes(q.id);
            return { ...q, progress, completed, claimed };
        });
    }

    function claim(questId) {
        const state = getQuestState();
        const quest = getQuests().find(q => q.id === questId);
        if (!quest || !quest.completed || quest.claimed) return { success: false };

        state.claimed.push(questId);
        saveQuestState(state);

        if (typeof balance !== 'undefined') {
            balance += quest.reward;
            if (typeof updateBalance === 'function') updateBalance();
        }
        return { success: true, reward: quest.reward };
    }

    return { track, getQuests, claim };
})();
