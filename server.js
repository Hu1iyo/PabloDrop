// PABLOdrop — статический сервер на чистом Node.js (без зависимостей)
// Запуск: node server.js  (или npm start)

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

// Запуск: node server.js [порт]  (или npm start, или npm start -- 8080)
// Порт можно задать третьим аргументом командной строки или переменной PORT.
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const USERS_FILE = path.join(ROOT, 'data', 'users.json');
const scrypt = promisify(crypto.scrypt);
let registrationQueue = Promise.resolve();
const SKIN_CATALOG_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';
const SKINPORT_PRICES_URL = 'https://api.skinport.com/v1/items?app_id=730&currency=RUB';
const SKIN_MARKET_CACHE_MS = 5 * 60 * 1000;
let skinMarketCache = null;
let skinMarketCacheExpiresAt = 0;
let skinMarketRequest = null;

function parseRequestedSkinName(name) {
    const wearAliases = new Map([
        ['factory new', 'Factory New'],
        ['minimal wear', 'Minimal Wear'],
        ['field-tested', 'Field-Tested'],
        ['well-worn', 'Well-Worn'],
        ['battle-scarred', 'Battle-Scarred'],
        ['fn', 'Factory New'],
        ['mw', 'Minimal Wear'],
        ['ft', 'Field-Tested'],
        ['ww', 'Well-Worn'],
        ['bs', 'Battle-Scarred'],
    ]);
    const wearPattern = /\s+(Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|FN|MW|FT|WW|BS)$/i;
    const match = name.match(wearPattern);
    const wear = match ? wearAliases.get(match[1].toLocaleLowerCase()) : null;
    const baseName = match ? name.slice(0, match.index).trim() : name;
    return { baseName, wear };
}

async function readUsers() {
    await fs.promises.mkdir(path.dirname(USERS_FILE), { recursive: true });
    try {
        return JSON.parse(await fs.promises.readFile(USERS_FILE, 'utf8'));
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        const emptyDatabase = { users: [] };
        await fs.promises.writeFile(USERS_FILE, JSON.stringify(emptyDatabase, null, 2));
        return emptyDatabase;
    }
}

async function writeUsers(database) {
    const temporaryFile = `${USERS_FILE}.${crypto.randomUUID()}.tmp`;
    await fs.promises.writeFile(temporaryFile, JSON.stringify(database, null, 2));
    await fs.promises.rename(temporaryFile, USERS_FILE);
}

function sendJson(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
}

async function readRequestBody(req, maxBytes = 16 * 1024) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        size += chunk.length;
        if (size > maxBytes) {
            const error = new Error('Слишком большой запрос');
            error.status = 413;
            throw error;
        }
        chunks.push(chunk);
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        const error = new Error('Некорректный JSON');
        error.status = 400;
        throw error;
    }
}

async function loadSkinMarketSources() {
    const [catalogResponse, prices] = await Promise.all([
        fetch(SKIN_CATALOG_URL, { signal: AbortSignal.timeout(30000) }),
        fetch(SKINPORT_PRICES_URL, { signal: AbortSignal.timeout(30000) })
            .then(async response => {
                if (!response.ok) throw new Error(`Skinport returned ${response.status}`);
                const items = await response.json();
                if (!Array.isArray(items)) throw new Error('Skinport returned an invalid price list');
                return items;
            }),
    ]);
    if (!catalogResponse.ok) {
        throw new Error(`Skin catalog returned ${catalogResponse.status}`);
    }

    const catalog = await catalogResponse.json();
    const skinsByName = new Map();
    const skinsByWeapon = new Map();
    for (const skin of catalog) {
        const name = skin.name.replace(/^★\s*/, '').trim().toLocaleLowerCase();
        if (!skinsByName.has(name)) skinsByName.set(name, skin);

        const weaponName = skin.weapon?.name?.trim().toLocaleLowerCase();
        if (weaponName && skin.image && !skinsByWeapon.has(weaponName)) {
            skinsByWeapon.set(weaponName, skin);
        }
    }

    const pricesByName = new Map(prices.map(item => [item.market_hash_name, item]));
    return {
        skinsByName,
        skinsByWeapon,
        pricesByName,
        pricesAvailable: prices.length > 0,
        updatedAt: new Date().toISOString(),
    };
}

async function getSkinMarketSources() {
    if (skinMarketCache && Date.now() < skinMarketCacheExpiresAt) return skinMarketCache;
    if (!skinMarketRequest) {
        skinMarketRequest = loadSkinMarketSources()
            .then(sources => {
                skinMarketCache = sources;
                skinMarketCacheExpiresAt = Date.now() + SKIN_MARKET_CACHE_MS;
                return sources;
            })
            .finally(() => {
                skinMarketRequest = null;
            });
    }
    return skinMarketRequest;
}

async function handleSkinMarketRequest(req, res) {
    if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Метод не поддерживается' });
        return;
    }

    try {
        const body = await readRequestBody(req, 128 * 1024);
        if (!body || !Array.isArray(body.names) || body.names.length > 800) {
            sendJson(res, 400, { error: 'Ожидается список не более чем из 800 названий' });
            return;
        }

        const names = [...new Set(body.names
            .filter(name => typeof name === 'string')
            .map(name => name.trim())
            .filter(Boolean))];
        const { skinsByName, skinsByWeapon, pricesByName, pricesAvailable, updatedAt } = await getSkinMarketSources();
        const items = {};

        for (const name of names) {
            const { baseName, wear: requestedWear } = parseRequestedSkinName(name);
            const normalizedName = baseName.replace(/^★\s*/, '').toLocaleLowerCase();
            const skin = skinsByName.get(normalizedName);
            const weaponName = baseName.split('|')[0].replace(/^★\s*/, '').trim();
            const imageSkin = skin || skinsByWeapon.get(weaponName.toLocaleLowerCase());
            if (!imageSkin) continue;

            const wearOptions = [...(skin?.wears || [])].sort((a, b) => {
                if (a.name === 'Field-Tested') return -1;
                if (b.name === 'Field-Tested') return 1;
                return 0;
            });
            const listings = wearOptions
                .map(wear => ({
                    wear: wear.name,
                    listing: pricesByName.get(`${skin.name} (${wear.name})`),
                }))
                .filter(option => option.listing && Number.isFinite(option.listing.min_price) && option.listing.min_price > 0);
            const selected = requestedWear
                ? listings.find(option => option.wear === requestedWear)
                : listings.find(option => option.wear === 'Field-Tested')
                    || listings.sort((a, b) => (b.listing.quantity || 0) - (a.listing.quantity || 0))[0];

            items[name] = {
                image: imageSkin.image || null,
                imageIsExact: Boolean(skin),
                imageSourceName: imageSkin.name,
                priceFeedAvailable: pricesAvailable,
                marketName: selected?.listing.market_hash_name || null,
                wear: selected?.wear || null,
                price: selected?.listing.min_price ?? null,
                currency: selected?.listing.currency || 'RUB',
                marketUrl: selected?.listing.item_page || null,
                priceUpdatedAt: selected?.listing.updated_at
                    ? new Date(selected.listing.updated_at * 1000).toISOString()
                    : null,
            };
        }

        sendJson(res, 200, { items, pricesAvailable, updatedAt });
    } catch (error) {
        console.error('Не удалось загрузить рыночные данные скинов:', error.message);
        sendJson(res, 503, { error: 'Не удалось загрузить рыночные данные скинов' });
    }
}

async function createAccount({ username, email, password }) {
    username = typeof username === 'string' ? username.trim() : '';
    email = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (typeof password !== 'string') password = '';

    if (username.length < 3 || username.length > 24) {
        return { status: 400, error: 'Ник должен содержать от 3 до 24 символов' };
    }
    if (!/^[\p{L}\p{N}_-]+$/u.test(username)) {
        return { status: 400, error: 'В нике допустимы буквы, цифры, дефис и подчёркивание' };
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { status: 400, error: 'Введите корректную почту' };
    }
    if (password.length < 8 || password.length > 128) {
        return { status: 400, error: 'Пароль должен содержать от 8 до 128 символов' };
    }

    const database = await readUsers();
    const normalizedUsername = username.toLocaleLowerCase();
    if (database.users.some(user => user.username.toLocaleLowerCase() === normalizedUsername)) {
        return { status: 409, error: 'Этот ник уже занят' };
    }
    if (database.users.some(user => user.email.toLowerCase() === email)) {
        return { status: 409, error: 'Эта почта уже зарегистрирована' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
    const user = {
        id: crypto.randomUUID(),
        username,
        email,
        passwordSalt: salt,
        passwordHash,
        createdAt: new Date().toISOString(),
    };
    database.users.push(user);
    await writeUsers(database);
    return { status: 201, user: { id: user.id, username: user.username, email: user.email } };
}

async function handleAuthRequest(req, res) {
    const route = req.url.split('?')[0];
    if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Метод не поддерживается' });
        return;
    }

    try {
        const body = await readRequestBody(req);
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            sendJson(res, 400, { error: 'Ожидается JSON-объект' });
            return;
        }
        let result;
        if (route === '/api/register') {
            const task = registrationQueue.then(() => createAccount(body));
            registrationQueue = task.catch(() => {});
            result = await task;
        } else if (route === '/api/login') {
            const username = typeof body.username === 'string' ? body.username.trim() : '';
            const password = typeof body.password === 'string' ? body.password : '';
            const database = await readUsers();
            const user = database.users.find(account => account.username.toLocaleLowerCase() === username.toLocaleLowerCase());
            if (!user || !password) {
                result = { status: 401, error: 'Неверный ник или пароль' };
            } else {
                const candidate = await scrypt(password, user.passwordSalt, 64);
                const actual = Buffer.from(user.passwordHash, 'hex');
                const matches = candidate.length === actual.length && crypto.timingSafeEqual(candidate, actual);
                result = matches
                    ? { status: 200, user: { id: user.id, username: user.username, email: user.email } }
                    : { status: 401, error: 'Неверный ник или пароль' };
            }
        } else {
            sendJson(res, 404, { error: 'Маршрут не найден' });
            return;
        }
        const { status, ...responseBody } = result;
        sendJson(res, status, responseBody);
    } catch (error) {
        sendJson(res, error.status || 500, { error: error.status ? error.message : 'Ошибка сервера' });
    }
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] === '/api/market-data') {
        handleSkinMarketRequest(req, res);
        return;
    }

    if (req.url.startsWith('/api/')) {
        handleAuthRequest(req, res);
        return;
    }

    // Декодируем путь и убираём query-строку
    let urlPath;
    try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Bad request');
    }

    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.normalize(path.join(ROOT, urlPath));
    const normalizedFilePath = filePath.toLowerCase();
    const normalizedUsersFile = USERS_FILE.toLowerCase();
    if (normalizedFilePath === normalizedUsersFile || normalizedFilePath.startsWith(`${normalizedUsersFile}.`)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 — Не найдено');
    }

    // Защита от выхода за пределы директории проекта (path traversal)
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 — Не найдено: ' + urlPath);
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': type,
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache',
        });

        const stream = fs.createReadStream(filePath);
        stream.on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Server error');
        });
        stream.pipe(res);
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Порт ${PORT} уже занят. Закройте другое приложение или запустите с другим портом:`);
        console.error(`  node server.js 8080`);
    } else {
        console.error('Ошибка сервера:', err.message);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`PABLOdrop запущен: http://localhost:${PORT}`);
});
