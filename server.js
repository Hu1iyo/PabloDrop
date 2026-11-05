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
const SKIN_IMAGES_DIR = path.join(ROOT, 'data', 'skin-images');
const SKIN_IMAGES_MANIFEST_FILE = path.join(ROOT, 'data', 'skin-images.json');
const SKIN_IMAGE_MAP_FILE = path.join(ROOT, 'data', 'skin-image-map.json');
const scrypt = promisify(crypto.scrypt);
let registrationQueue = Promise.resolve();
const SKINPORT_PRICES_URL = 'https://api.skinport.com/v1/items?app_id=730&currency=RUB';
const SKIN_MARKET_CACHE_MS = 5 * 60 * 1000;
const SKIN_IMAGE_CONTENT_TYPES = {
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
};
let skinMarketCache = null;
let skinMarketCacheExpiresAt = 0;
let skinMarketRequest = null;
let skinImageManifest = null;
let skinImageManifestRequest = null;

function isAllowedSkinImageUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === 'community.akamai.steamstatic.com';
    } catch {
        return false;
    }
}

function getSkinImageHash(sourceUrl) {
    return crypto.createHash('sha256').update(sourceUrl).digest('hex');
}

async function loadSkinImageManifest() {
    if (skinImageManifest) return skinImageManifest;
    if (!skinImageManifestRequest) {
        skinImageManifestRequest = fs.promises.readFile(SKIN_IMAGES_MANIFEST_FILE, 'utf8')
            .then(contents => JSON.parse(contents))
            .catch(error => {
                if (error.code === 'ENOENT') return {};
                throw error;
            })
            .then(manifest => {
                if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
                    throw new Error('Invalid skin image manifest');
                }
                skinImageManifest = manifest;
                return skinImageManifest;
            })
            .finally(() => {
                skinImageManifestRequest = null;
            });
    }
    return skinImageManifestRequest;
}

async function findCachedSkinImage(hash, manifest) {
    const entry = manifest[hash];
    const candidates = [];
    if (entry
        && typeof entry.sourceUrl === 'string'
        && isAllowedSkinImageUrl(entry.sourceUrl)
        && getSkinImageHash(entry.sourceUrl) === hash
        && typeof entry.fileName === 'string'
        && new RegExp(`^${hash}\\.(gif|jpg|png|webp)$`).test(entry.fileName)) {
        candidates.push(entry.fileName);
    }
    for (const extension of Object.keys(SKIN_IMAGE_CONTENT_TYPES)) {
        candidates.push(`${hash}${extension}`);
    }

    for (const fileName of new Set(candidates)) {
        const imagePath = path.join(SKIN_IMAGES_DIR, fileName);
        try {
            const stat = await fs.promises.stat(imagePath);
            if (stat.isFile()) {
                return {
                    filePath: imagePath,
                    contentType: SKIN_IMAGE_CONTENT_TYPES[path.extname(fileName)],
                };
            }
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
    return null;
}

function normalizeSkinImageName(name) {
    return name
        .replace(/^★\s*/, '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

async function loadLocalSkinImageIndex() {
    await fs.promises.mkdir(SKIN_IMAGES_DIR, { recursive: true });
    const [files, skinImageMap] = await Promise.all([
        fs.promises.readdir(SKIN_IMAGES_DIR, { withFileTypes: true }),
        fs.promises.readFile(SKIN_IMAGE_MAP_FILE, 'utf8')
            .then(contents => JSON.parse(contents))
            .catch(error => {
                if (error.code === 'ENOENT') return {};
                throw error;
            }),
    ]);
    if (!skinImageMap || typeof skinImageMap !== 'object' || Array.isArray(skinImageMap)) {
        throw new Error('Invalid skin image map');
    }

    const images = new Map();
    const weaponImages = new Map();
    const availableFiles = new Set(files
        .filter(file => file.isFile() && path.extname(file.name).toLocaleLowerCase() === '.png')
        .map(file => file.name));

    for (const [skinName, fileName] of Object.entries(skinImageMap)) {
        if (typeof fileName !== 'string'
            || path.basename(fileName) !== fileName
            || path.extname(fileName).toLocaleLowerCase() !== '.png'
            || !availableFiles.has(fileName)) continue;
        const baseName = parseRequestedSkinName(skinName).baseName;
        const key = normalizeSkinImageName(baseName);
        if (key && !images.has(key)) images.set(key, fileName);
        const weaponKey = normalizeSkinImageName(baseName.split('|')[0].trim());
        if (weaponKey && !weaponImages.has(weaponKey)) weaponImages.set(weaponKey, fileName);
    }

    for (const file of files) {
        if (!file.isFile() || path.extname(file.name).toLocaleLowerCase() !== '.png') continue;
        const stem = path.basename(file.name, path.extname(file.name));
        if (/^[a-f0-9]{64}$/i.test(stem)) continue;
        const baseName = parseRequestedSkinName(stem).baseName;
        const key = normalizeSkinImageName(baseName);
        if (key && !images.has(key)) images.set(key, file.name);
        const weaponKey = normalizeSkinImageName(baseName.split('|')[0].trim());
        if (weaponKey && !weaponImages.has(weaponKey)) weaponImages.set(weaponKey, file.name);
    }

    return { images, weaponImages };
}

function sendCachedSkinImage(res, filePath, contentType) {
    fs.stat(filePath, (error, stat) => {
        if (error || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Изображение не найдено');
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stat.size,
            'Cache-Control': 'public, max-age=31536000, immutable',
        });
        const stream = fs.createReadStream(filePath);
        stream.on('error', () => {
            if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Ошибка чтения изображения');
        });
        stream.pipe(res);
    });
}

async function handleLocalSkinImageRequest(req, res, encodedFileName) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { error: 'Метод не поддерживается' });
        return;
    }

    let fileName;
    try {
        fileName = decodeURIComponent(encodedFileName);
    } catch {
        sendJson(res, 400, { error: 'Некорректное имя изображения' });
        return;
    }

    if (path.basename(fileName) !== fileName || path.extname(fileName).toLocaleLowerCase() !== '.png') {
        sendJson(res, 404, { error: 'Изображение не найдено' });
        return;
    }

    const filePath = path.join(SKIN_IMAGES_DIR, fileName);
    try {
        const stat = await fs.promises.lstat(filePath);
        if (!stat.isFile()) {
            sendJson(res, 404, { error: 'Изображение не найдено' });
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': stat.size,
            'Cache-Control': 'public, max-age=3600',
        });
        if (req.method === 'HEAD') {
            res.end();
            return;
        }
        const stream = fs.createReadStream(filePath);
        stream.on('error', error => {
            console.error('Не удалось прочитать локальное изображение скина:', error.message);
            if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Ошибка чтения изображения');
        });
        stream.pipe(res);
    } catch (error) {
        if (error.code === 'ENOENT') {
            sendJson(res, 404, { error: 'Изображение не найдено' });
            return;
        }
        console.error('Не удалось прочитать локальное изображение скина:', error.message);
        sendJson(res, 500, { error: 'Не удалось прочитать локальное изображение скина' });
    }
}

async function handleSkinImageRequest(req, res, hash) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { error: 'Метод не поддерживается' });
        return;
    }

    try {
        const manifest = await loadSkinImageManifest();
        const cachedImage = await findCachedSkinImage(hash, manifest);
        if (!cachedImage) {
            sendJson(res, 404, { error: 'Изображение не найдено в локальном кэше' });
            return;
        }

        if (req.method === 'HEAD') {
            const stat = await fs.promises.stat(cachedImage.filePath);
            res.writeHead(200, {
                'Content-Type': cachedImage.contentType,
                'Content-Length': stat.size,
                'Cache-Control': 'public, max-age=31536000, immutable',
            });
            res.end();
            return;
        }
        sendCachedSkinImage(res, cachedImage.filePath, cachedImage.contentType);
    } catch (error) {
        console.error('Не удалось прочитать изображение скина из локального кэша:', error.message);
        sendJson(res, 500, { error: 'Не удалось прочитать изображение скина из локального кэша' });
    }
}

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
    const wearPattern = /\s+(?:\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|FN|MW|FT|WW|BS)\)|(Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|FN|MW|FT|WW|BS))$/i;
    const match = name.match(wearPattern);
    const wear = match ? wearAliases.get((match[1] || match[2]).toLocaleLowerCase()) : null;
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
    const response = await fetch(SKINPORT_PRICES_URL, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Skinport returned ${response.status}`);
    const prices = await response.json();
    if (!Array.isArray(prices)) throw new Error('Skinport returned an invalid price list');

    const pricesByName = new Map();
    for (const listing of prices) {
        if (typeof listing.market_hash_name !== 'string') continue;
        const { baseName, wear } = parseRequestedSkinName(listing.market_hash_name);
        if (!wear) continue;
        const key = normalizeSkinImageName(baseName);
        if (!pricesByName.has(key)) pricesByName.set(key, []);
        pricesByName.get(key).push({ wear, listing });
    }

    return {
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
        const { images: localImages, weaponImages } = await loadLocalSkinImageIndex();
        let pricesByName = new Map();
        let pricesAvailable = false;
        let updatedAt = new Date().toISOString();
        try {
            const prices = await getSkinMarketSources();
            pricesByName = prices.pricesByName;
            pricesAvailable = prices.pricesAvailable;
            updatedAt = prices.updatedAt;
        } catch (error) {
            console.error('Не удалось загрузить цены Skinport; локальные изображения будут показаны без цен:', error.message);
        }

        const items = {};

        for (const name of names) {
            const { baseName, wear: requestedWear } = parseRequestedSkinName(name);
            const normalizedName = normalizeSkinImageName(baseName);
            const listings = pricesByName.get(normalizedName) || [];
            const selected = (requestedWear
                ? listings.find(option => option.wear === requestedWear)
                : listings.find(option => option.wear === 'Field-Tested')
                    || [...listings].sort((a, b) => (b.listing.quantity || 0) - (a.listing.quantity || 0))[0]);
            const exactImageFileName = localImages.get(normalizedName);
            const weaponName = normalizeSkinImageName(baseName.split('|')[0].trim());
            const imageFileName = exactImageFileName || weaponImages.get(weaponName);

            items[name] = {
                image: imageFileName ? `/api/skin-images/local/${encodeURIComponent(imageFileName)}` : null,
                imageIsExact: Boolean(exactImageFileName),
                imageSourceName: exactImageFileName ? name : baseName.split('|')[0].trim(),
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
    '.webmanifest': 'application/manifest+json; charset=utf-8',
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

    const skinImageMatch = req.url.split('?')[0].match(/^\/api\/skin-images\/([a-f0-9]{64})$/);
    if (skinImageMatch) {
        handleSkinImageRequest(req, res, skinImageMatch[1]);
        return;
    }

    const localSkinImageMatch = req.url.split('?')[0].match(/^\/api\/skin-images\/local\/(.+)$/);
    if (localSkinImageMatch) {
        handleLocalSkinImageRequest(req, res, localSkinImageMatch[1]);
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
    const normalizedSkinImagesDir = SKIN_IMAGES_DIR.toLowerCase();
    const normalizedSkinImagesManifest = SKIN_IMAGES_MANIFEST_FILE.toLowerCase();
    if (normalizedFilePath === normalizedUsersFile
        || normalizedFilePath.startsWith(`${normalizedUsersFile}.`)
        || normalizedFilePath === normalizedSkinImagesManifest
        || normalizedFilePath.startsWith(`${normalizedSkinImagesDir}${path.sep}`)) {
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
