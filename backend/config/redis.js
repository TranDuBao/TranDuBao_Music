const net = require('net');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;

let socket = null;
let isConnected = false;
let connecting = false;
let pendingQueue = [];
let buffer = '';

function encodeCommand(args) {
  let cmd = `*${args.length}\r\n`;
  for (const arg of args) {
    const str = String(arg);
    cmd += `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
  }
  return cmd;
}

function parseResp(dataStr) {
  if (!dataStr) return { value: null, consumed: 0 };
  const first = dataStr[0];
  const lineEnd = dataStr.indexOf('\r\n');
  if (lineEnd === -1) return { value: null, consumed: 0 };

  if (first === '+') {
    return { value: dataStr.substring(1, lineEnd), consumed: lineEnd + 2 };
  }
  if (first === '-') {
    return { error: new Error(dataStr.substring(1, lineEnd)), consumed: lineEnd + 2 };
  }
  if (first === ':') {
    return { value: parseInt(dataStr.substring(1, lineEnd)), consumed: lineEnd + 2 };
  }
  if (first === '$') {
    const len = parseInt(dataStr.substring(1, lineEnd));
    if (len === -1) return { value: null, consumed: lineEnd + 2 };
    const contentStart = lineEnd + 2;
    if (dataStr.length < contentStart + len + 2) return { value: null, consumed: 0 };
    const val = dataStr.substring(contentStart, contentStart + len);
    return { value: val, consumed: contentStart + len + 2 };
  }
  if (first === '*') {
    const count = parseInt(dataStr.substring(1, lineEnd));
    if (count === -1) return { value: null, consumed: lineEnd + 2 };
    let curr = lineEnd + 2;
    const arr = [];
    for (let i = 0; i < count; i++) {
      const res = parseResp(dataStr.substring(curr));
      if (res.consumed === 0) return { value: null, consumed: 0 };
      if (res.error) return res;
      arr.push(res.value);
      curr += res.consumed;
    }
    return { value: arr, consumed: curr };
  }
  return { value: null, consumed: lineEnd + 2 };
}

function processBuffer() {
  while (buffer.length > 0 && pendingQueue.length > 0) {
    const parsed = parseResp(buffer);
    if (parsed.consumed === 0) break;
    buffer = buffer.substring(parsed.consumed);
    const cb = pendingQueue.shift();
    if (cb) {
      if (parsed.error) cb.reject(parsed.error);
      else cb.resolve(parsed.value);
    }
  }
}

function connect() {
  if (isConnected || connecting) return;
  connecting = true;

  socket = net.createConnection({ host: REDIS_HOST, port: REDIS_PORT }, () => {
    isConnected = true;
    connecting = false;
    console.log(`[Redis] Connected to Redis server at ${REDIS_HOST}:${REDIS_PORT}`);
  });

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    processBuffer();
  });

  socket.on('error', () => {
    isConnected = false;
    connecting = false;
    cleanup();
  });

  socket.on('close', () => {
    isConnected = false;
    connecting = false;
    cleanup();
  });

  socket.setTimeout(3000, () => {
    if (!isConnected) {
      try { socket.destroy(); } catch (_) {}
    }
  });
}

function cleanup() {
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.destroy();
    } catch (_) {}
    socket = null;
  }
  while (pendingQueue.length > 0) {
    const cb = pendingQueue.shift();
    if (cb) cb.resolve(null);
  }
  buffer = '';
}

try {
  connect();
} catch (e) {}

setInterval(() => {
  if (!isConnected && !connecting) {
    try { connect(); } catch (e) {}
  }
}, 30000);

async function execCommand(args) {
  if (!isConnected) return null;
  return new Promise((resolve, reject) => {
    pendingQueue.push({ resolve, reject });
    socket.write(encodeCommand(args), (err) => {
      if (err) {
        const idx = pendingQueue.findIndex(item => item.resolve === resolve);
        if (idx !== -1) pendingQueue.splice(idx, 1);
        resolve(null);
      }
    });
  });
}

/**
 * Get cached data by key
 */
async function getCache(key) {
  try {
    const val = await execCommand(['GET', key]);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch (_) {
      return val;
    }
  } catch (err) {
    return null;
  }
}

/**
 * Set cached data with TTL (seconds)
 */
async function setCache(key, data, ttlSeconds = 300) {
  try {
    const strVal = typeof data === 'string' ? data : JSON.stringify(data);
    await execCommand(['SETEX', key, ttlSeconds, strVal]);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Delete single key or keys matching pattern
 */
async function delCacheByPattern(pattern) {
  try {
    const keys = await execCommand(['KEYS', pattern]);
    if (Array.isArray(keys) && keys.length > 0) {
      await execCommand(['DEL', ...keys]);
    }
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  getCache,
  setCache,
  delCacheByPattern,
  isRedisConnected: () => isConnected
};
