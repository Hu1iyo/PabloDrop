const { spawn } = require('child_process');
const path = require('path');

const port = Number(process.env.PORT) || 3000;
const server = spawn(process.execPath, [path.join(__dirname, 'server.js'), String(port)], {
    stdio: 'inherit',
    env: process.env,
});
const tunnel = spawn('cloudflared', [
    'tunnel',
    '--url',
    `http://localhost:${port}`,
], {
    stdio: 'inherit',
    windowsHide: true,
});

let shuttingDown = false;

function shutdown(exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    if (server.exitCode === null) server.kill();
    if (tunnel.exitCode === null) tunnel.kill();
    process.exitCode = exitCode;
}

server.on('error', error => {
    console.error('Не удалось запустить сервер:', error.message);
    shutdown(1);
});

server.on('exit', code => shutdown(code ?? 1));

tunnel.on('error', error => {
    if (error.code === 'ENOENT') {
        console.error('cloudflared не найден. Установите его командой: winget install --id Cloudflare.cloudflared');
    } else {
        console.error('Не удалось запустить Cloudflare Tunnel:', error.message);
    }
    shutdown(1);
});

tunnel.on('exit', code => shutdown(code ?? 1));

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));