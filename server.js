const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const rootDir = __dirname;
const packsDir = path.join(rootDir, 'packs');
const presetsDir = path.join(rootDir, 'presets');
const port = Number(process.env.PORT || 3000);
const audioExtensions = new Set(['.wav', '.aif', '.aiff', '.mp3', '.ogg']);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav'
};

let samples = [];
let presets = [];

async function collectSamples(directory) {
    const entries = await fsp.readdir(directory, { withFileTypes: true });
    const nestedSamples = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectSamples(fullPath);
        return audioExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
    }));
    return nestedSamples.flat();
}

async function collectPresets(directory) {
    const entries = await fsp.readdir(directory, { withFileTypes: true });
    const nestedPresets = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectPresets(fullPath);
        return path.extname(entry.name).toLowerCase() === '.json' && entry.name !== 'index.json' ? [fullPath] : [];
    }));
    return nestedPresets.flat();
}

function sendJson(response, statusCode, value) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
}

function serializeSample(samplePath) {
    const relativePath = path.relative(rootDir, samplePath).split(path.sep).join('/');
    return {
        name: path.basename(samplePath),
        path: relativePath,
        url: relativePath.split('/').map(encodeURIComponent).join('/')
    };
}

function serializePreset(presetPath) {
    const relativePath = path.relative(rootDir, presetPath).split(path.sep).join('/');
    return {
        name: path.basename(presetPath),
        path: relativePath,
        url: relativePath.split('/').map(encodeURIComponent).join('/')
    };
}

function resolveFromRoot(urlPath) {
    const relativePath = decodeURIComponent(urlPath).replace(/^\/+/, '');
    const filePath = path.resolve(rootDir, relativePath || 'index.html');
    return filePath.startsWith(`${rootDir}${path.sep}`) || filePath === rootDir ? filePath : null;
}

async function serveFile(response, urlPath) {
    const filePath = resolveFromRoot(urlPath);
    if (!filePath) return sendJson(response, 403, { error: 'Forbidden' });

    try {
        const stats = await fsp.stat(filePath);
        if (!stats.isFile()) return sendJson(response, 404, { error: 'Not found' });
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Content-Length': stats.size
        });
        fs.createReadStream(filePath).pipe(response);
    } catch {
        sendJson(response, 404, { error: 'Not found' });
    }
}

async function start() {
    samples = await collectSamples(packsDir);
    presets = await collectPresets(presetsDir);
    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        if (request.method === 'GET' && url.pathname === '/api/packs') {
            return sendJson(response, 200, {
                samples: samples.map(serializeSample)
            });
        }
        if (request.method === 'GET' && url.pathname === '/api/presets') {
            return sendJson(response, 200, {
                presets: presets.map(serializePreset)
            });
        }
        return serveFile(response, url.pathname);
    });

    server.listen(port, () => {
        console.log(`Tracker is running at http://localhost:${port}`);
        console.log(`${samples.length} audio samples available from packs/`);
        console.log(`${presets.length} presets available from presets/`);
    });
}

start().catch((error) => {
    console.error('Unable to start Tracker server:', error);
    process.exitCode = 1;
});