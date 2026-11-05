// ===== YANDEX GAMES SDK =====
// Обёртка над Yandex Games SDK v2 с graceful fallback для локальной разработки.
// Если SDK не загружен (локально) — игра работает как раньше на localStorage.

const YandexSDK = (() => {
    let ysdk = null;
    let player = null;
    let initPromise = null;
    let isReady = false;
    let isAvailable = false;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    async function init() {
        if (initPromise) return initPromise;
        initPromise = (async () => {
            if (!/(^|\.)yandex\.(ru|net|com)$/i.test(location.hostname)) {
                console.info('[YandexSDK] Локальный режим — SDK не подключён');
                isAvailable = false;
                isReady = true;
                return null;
            }

            try {
                if (typeof YaGames === 'undefined') {
                    await loadScript('https://yandex.ru/games/sdk/v2');
                }
                ysdk = await YaGames.init();
                isAvailable = true;

                try {
                    const locale = ysdk.environment.i18n.lang;
                    document.documentElement.lang = locale || 'ru';
                } catch {}

                try {
                    player = await ysdk.getPlayer();
                } catch (error) {
                    console.warn('[YandexSDK] getPlayer failed', error);
                }

                try { ysdk.features.LoadingAPI?.ready(); } catch {}

                isReady = true;
                console.info('[YandexSDK] SDK инициализирован');
                return ysdk;
            } catch (error) {
                console.warn('[YandexSDK] Ошибка инициализации, fallback на localStorage:', error);
                isAvailable = false;
                isReady = true;
                return null;
            }
        })();
        return initPromise;
    }

    return {
        init,
        get sdk() { return ysdk; },
        get player() { return player; },
        get isAvailable() { return isAvailable; },
        get isReady() { return isReady; },
        get isPlayerAuthorized() {
            return Boolean(player && typeof player.isAuthorized === 'function' && player.isAuthorized());
        },
        async authorize() {
            if (!ysdk || !player) return false;
            if (this.isPlayerAuthorized) return true;
            try {
                await ysdk.auth.openAuthDialog();
                player = await ysdk.getPlayer();
                return this.isPlayerAuthorized;
            } catch (error) {
                console.warn('[YandexSDK] Player authorization failed', error);
                return false;
            }
        },
        gameplayStart() {
            try { ysdk?.features.GameplayAPI?.start(); } catch {}
        },
        gameplayStop() {
            try { ysdk?.features.GameplayAPI?.stop(); } catch {}
        },
    };
})();
