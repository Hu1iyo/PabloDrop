// ===== РЕКЛАМА YANDEX GAMES =====
// Rewarded video (за вознаграждение) + Interstitial (между действиями).
// Кулдаун для interstitial, чтобы не нарушать правила модерации.

const YandexAds = (() => {
    const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;
    const REWARDED_COOLDOWN_MS = 30 * 1000;

    let lastInterstitialAttemptAt = 0;
    let lastRewardedAt = 0;
    let rewardedInProgress = false;

    /**
     * Показать rewarded-видео.
     * @returns {Promise<{rewarded: boolean, reason?: string}>}
     */
    async function showRewarded() {
        if (rewardedInProgress) return { rewarded: false, reason: 'busy' };
        if (Date.now() - lastRewardedAt < REWARDED_COOLDOWN_MS) {
            return { rewarded: false, reason: 'cooldown' };
        }

        const sdk = YandexSDK.sdk;
        if (!sdk) return { rewarded: false, reason: 'unavailable' };

        rewardedInProgress = true;
        try {
            return await new Promise((resolve) => {
                let rewardEarned = false;
                let settled = false;
                const finish = (result) => {
                    if (settled) return;
                    settled = true;
                    YandexSDK.gameplayStart();
                    resolve(result);
                };
                try {
                    sdk.adv.showRewardedVideo({
                        onOpen: () => {
                            lastRewardedAt = Date.now();
                            YandexSDK.gameplayStop();
                        },
                        onRewarded: () => {
                            rewardEarned = true;
                        },
                        onClose: (wasShown) => {
                            finish(rewardEarned
                                ? { rewarded: true }
                                : { rewarded: false, reason: wasShown ? 'not-rewarded' : 'unavailable' });
                        },
                        onError: (error) => {
                            console.warn('[Ads] Rewarded video error', error);
                            finish(rewardEarned
                                ? { rewarded: true }
                                : { rewarded: false, reason: 'error' });
                        },
                    });
                } catch (error) {
                    console.warn('[Ads] Rewarded video call failed', error);
                    finish({ rewarded: false, reason: 'error' });
                }
            });
        } finally {
            rewardedInProgress = false;
        }
    }

    /**
     * Показать interstitial между действиями.
     * @returns {Promise<boolean>} true, если реклама была показана
     */
    async function showInterstitial(force = false) {
         if (!force && Date.now() - lastInterstitialAttemptAt < INTERSTITIAL_COOLDOWN_MS) return false;
        const sdk = YandexSDK.sdk;
        if (!sdk) return false;

         lastInterstitialAttemptAt = Date.now();
         return new Promise((resolve) => {
             let settled = false;
             const finish = (wasShown) => {
                 if (settled) return;
                 settled = true;
                 YandexSDK.gameplayStart();
                resolve(wasShown);
            };
            try {
                sdk.adv.showFullscreenAdv({
                    onOpen: () => YandexSDK.gameplayStop(),
                    onClose: (wasShown) => finish(wasShown === true),
                    onError: (error) => {
                        console.warn('[Ads] Interstitial error', error);
                        finish(false);
                    },
                });
            } catch (error) {
                console.warn('[Ads] Interstitial call failed', error);
                finish(false);
            }
        });
    }

    return {
        showRewarded,
        showInterstitial,
        get rewardedAvailable() { return Boolean(YandexSDK.sdk); },
    };
})();
