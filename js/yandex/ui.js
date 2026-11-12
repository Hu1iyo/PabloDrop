// ===== UI ДЛЯ ЯНДЕКС-ФИЧ =====
// Тост-уведомления, панели daily/quests/leaderboard, кнопка «получить монеты за рекламу».

function showToast(message, duration = 2500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function escapeLeaderboardName(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}

function showRewardedFailure(reason) {
    const messages = {
        busy: 'Реклама уже открывается',
        cooldown: 'Подожди немного перед следующей рекламой',
        unavailable: 'Реклама сейчас недоступна',
        'not-rewarded': 'Просмотр не завершён — награда не начислена',
        error: 'Не удалось показать рекламу. Попробуй позже',
    };
    showToast(messages[reason] || 'Реклама не завершена — награда не начислена');
}

// ===== ЕЖЕДНЕВНЫЙ БОНУС =====
function renderDailyPanel() {
    const container = document.getElementById('daily-panel');
    if (!container) return;
    const canClaim = YandexDaily.canClaim();
    const state = YandexDaily.getDailyState();
    const streak = YandexDaily.computeStreak(state);
    const dayNumber = YandexDaily.nextDayNumber();
    const reward = YandexDaily.REWARDS[dayNumber - 1];
    const canGetFreeCase = YandexDaily.canGetFreeCase();
    const remainingMs = YandexDaily.freeCaseRemainingMs();
    const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
    const remainingMinutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    const freeCaseLabel = canGetFreeCase
        ? '🎁 Бесплатный кейс'
        : `Через ${remainingHours}ч ${remainingMinutes}м`;

    container.innerHTML = `
        <div class="daily-inner">
            <div class="daily-icon">🎁</div>
            <div class="daily-text">
                <div class="daily-title">Ежедневный бонус</div>
                <div class="daily-sub">${canClaim
                    ? `День ${dayNumber}: <b>+${formatCurrency(reward)}</b>${streak > 0 ? ` · серия ${streak} 🔥` : ''}`
                    : `Серия: ${streak} дн. · возвращайся завтра`}</div>
            </div>
            <div class="daily-actions">
                <button class="daily-claim" id="daily-claim-btn" ${canClaim ? '' : 'disabled'}>
                    ${canClaim ? 'Забрать' : '✓ Получен'}
                </button>
                <button class="daily-free-case" id="daily-free-case-btn"
                    aria-label="${canGetFreeCase ? 'Открыть бесплатный кейс' : `Бесплатный кейс будет доступен через ${remainingHours} часов ${remainingMinutes} минут`}"
                    ${canGetFreeCase ? '' : 'disabled'}>${freeCaseLabel}</button>
            </div>
        </div>
    `;

    const btn = document.getElementById('daily-claim-btn');
    if (btn && canClaim) {
        btn.addEventListener('click', () => {
            const result = YandexDaily.claim();
            if (result.success) {
                showToast(`+${formatCurrency(result.reward)} · Серия ${result.streak} дн. 🔥`);
                YandexPlayer.saveToCloud();
                renderDailyPanel();
            }
        });
    }

    const freeCaseButton = document.getElementById('daily-free-case-btn');
    if (freeCaseButton && canGetFreeCase) {
        freeCaseButton.addEventListener('click', openDailyFreeCase);
    }
}

function renderLevelPanel() {
    const container = document.getElementById('level-panel');
    if (!container) return;
    const stats = getPlayerStats();
    const casesOpened = Math.max(0, Number(stats.casesOpened) || 0);
    const casesPerLevel = 10;
    const level = Math.floor(casesOpened / casesPerLevel) + 1;
    const progress = casesOpened % casesPerLevel;
    const percentage = (progress / casesPerLevel) * 100;
    const remaining = casesPerLevel - progress;
    const remainingLabel = remaining === 1 ? 'кейс' : remaining < 5 ? 'кейса' : 'кейсов';

    container.innerHTML = `
        <div class="level-card">
            <div class="level-badge" aria-label="Уровень ${level}">${level}</div>
            <div class="level-details">
                <div class="level-heading">
                    <span class="level-title">Уровень ${level}</span>
                    <span class="level-progress-text">Ещё ${remaining} ${remainingLabel} до следующего уровня · ${progress}/${casesPerLevel}</span>
                </div>
                <div class="level-bar" role="progressbar" aria-label="Прогресс до уровня ${level + 1}"
                    aria-valuemin="0" aria-valuemax="${casesPerLevel}" aria-valuenow="${progress}">
                    <div class="level-bar-fill" style="width:${percentage}%"></div>
                </div>
            </div>
        </div>
    `;
}

// ===== КВЕСТЫ =====
function renderQuestsPanel() {
    const container = document.getElementById('quests-panel');
    if (!container) return;
    const quests = YandexQuests.getQuests();
    container.innerHTML = `
        <div class="panel-header">
            <span>📋 Ежедневные задания</span>
        </div>
        <div class="quests-list">
            ${quests.map(q => {
                const pct = Math.min(100, (q.progress / q.target) * 100);
                return `
                <div class="quest ${q.claimed ? 'quest-claimed' : q.completed ? 'quest-ready' : ''}">
                    <div class="quest-info">
                        <div class="quest-title">${q.title}</div>
                        <div class="quest-progress">
                            <div class="quest-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
                            <span class="quest-count">${q.progress}/${q.target}</span>
                        </div>
                    </div>
                    <button class="quest-claim" data-quest="${q.id}" ${q.completed && !q.claimed ? '' : 'disabled'}>
                        ${q.claimed ? '✓' : `+${formatCurrency(q.reward)}`}
                    </button>
                </div>`;
            }).join('')}
        </div>
    `;
    container.querySelectorAll('.quest-claim[data-quest]').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = YandexQuests.claim(btn.dataset.quest);
            if (result.success) {
                showToast(`+${formatCurrency(result.reward)} за задание`);
                YandexPlayer.saveToCloud();
                renderQuestsPanel();
            }
        });
    });
}

// ===== ЛИДЕРБОРД =====
async function renderLeaderboardPanel() {
    const container = document.getElementById('leaderboard-panel');
    if (!container) return;
    if (!YandexSDK.isAvailable) {
        container.innerHTML = '<div class="panel-header"><span>🏆 Топ игроков</span></div><div class="lb-note">Лидерборд доступен в Яндекс Играх</div>';
        return;
    }
    container.innerHTML = '<div class="panel-header"><span>🏆 Топ игроков</span></div><div class="lb-loading">Загрузка...</div>';
    const top = await YandexLeaderboards.getTop(10);
    if (!top.length) {
        container.innerHTML = '<div class="panel-header"><span>🏆 Топ игроков</span></div><div class="lb-note">Топ пока пуст — стань первым!</div>';
        return;
    }
    container.innerHTML = `
        <div class="panel-header"><span>🏆 Топ игроков по инвентарю</span></div>
        <div class="lb-list">
            ${top.map(e => `
                <div class="lb-row ${e.isCurrentUser ? 'lb-me' : ''}">
                    <span class="lb-rank">${e.rank}</span>
                    <span class="lb-name">${escapeLeaderboardName(e.name)}</span>
                    <span class="lb-score">${formatCurrency(e.score)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== «ПОЛУЧИТЬ МОНЕТЫ» (замена депозита) =====
function bindDepositToAds() {
    const btn = document.getElementById('btn-deposit');
    if (!btn) return;
    btn.textContent = '🎬 +1000 PC';
    btn.title = 'Посмотри рекламу и получи 1000 PC';
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('btn-deposit');
    newBtn.addEventListener('click', async () => {
        const original = newBtn.textContent;
        newBtn.disabled = true;
        newBtn.textContent = 'Загрузка...';
        const result = await YandexAds.showRewarded();
        newBtn.disabled = false;
        if (result.rewarded) {
            balance += 1000;
            updateBalance();
            YandexPlayer.saveToCloud();
            showToast('+1000 PC за просмотр рекламы 🎬');
            newBtn.textContent = original;
        } else {
            newBtn.textContent = original;
            showRewardedFailure(result.reason);
        }
    });
}

// ===== GAMEPLAY TRACKING =====
function startGameplayTracking() {
    // Сообщаем Яндексу о старте/паузе геймплея
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') YandexSDK.gameplayStart();
        else YandexSDK.gameplayStop();
    });
    YandexSDK.gameplayStart();
}
