const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const Track = require('../models/Track');
const { query, dbType } = require('../config/db');

const isWindows = process.platform === 'win32';
const ytDlpPath = isWindows
  ? path.resolve(__dirname, '../bin/yt-dlp.exe')
  : path.resolve(__dirname, '../bin/yt-dlp');

// Ensure executable permissions on Linux/macOS
if (!isWindows) {
  try {
    if (fs.existsSync(ytDlpPath)) {
      fs.chmodSync(ytDlpPath, '755');
    }
  } catch (err) {
    console.error('Failed to set executable permission on yt-dlp binary:', err.message);
  }
}

const runYtDlp = (args, timeoutMs = 30000, signal = null) => {
  return new Promise((resolve, reject) => {
    const options = { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 };
    if (signal) {
      options.signal = signal;
    }
    execFile(ytDlpPath, args, options, (error, stdout, stderr) => {
      if (error) {
        const safeStderr = stderr ? stderr.toString() : '';
        const safeStdout = stdout ? stdout.toString() : '';
        const err = new Error(safeStderr.trim() || error.message);
        err.stderr = safeStderr;
        err.stdout = safeStdout;
        err.killed = error.killed;
        err.signal = error.signal;
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
};

// Helper: detect YouTube bot/login block errors regardless of apostrophe encoding
const isBotBlocked = (msg) => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes('not a bot') ||
    lower.includes('sign in to confirm') ||
    lower.includes('cookies-from-browser') ||
    lower.includes('use --cookies') ||
    lower.includes('bot detection') ||
    lower.includes('verify you') ||
    lower.includes('confirm your') ||
    lower.includes('too many requests') ||
    lower.includes('http error 429') ||
    lower.includes('preconditionrequired') ||
    lower.includes('this video is unavailable') ||
    lower.includes('video unavailable')
  );
};

// Helper to download files (like covers or direct links)
const downloadFile = async (url, destPath) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(destPath, buffer);
};

const getAllTracks = async (req, res) => {
  try {
    const search     = req.query.search || '';
    const showMine   = req.query.mine === 'true';
    const userId     = req.user?.id || null;
    const categoryId = req.query.categoryId || null;
    const tracks     = await Track.getAll(search, userId, showMine, categoryId);
    res.json({ success: true, data: tracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTrackById = async (req, res) => {
  try {
    const track = await Track.getById(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });
    res.json({ success: true, data: track });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTrack = async (req, res) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist)
      return res.status(400).json({ success: false, message: 'Title and artist are required' });

    // Check duplicate track: title and artist (case-insensitive)
    const existing = await query('SELECT id FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)', [title.trim(), artist.trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Bài hát đã có sẵn' });
    }

    let audio_url = req.body.audio_url;
    let cover_url = req.body.cover_url || '';

    // Handle file uploads
    if (req.files?.audio?.[0]) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
      audio_url = `${backendUrl}/uploads/audio/${req.files.audio[0].filename}`;
    }
    if (req.files?.cover?.[0]) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
      cover_url = `${backendUrl}/uploads/img/${req.files.cover[0].filename}`;
    }

    if (!audio_url)
      return res.status(400).json({ success: false, message: 'Audio file or URL is required' });

    const newTrack = await Track.create({
      ...req.body,
      audio_url,
      cover_url,
      user_id:   req.user?.id || null,
      is_public: req.body.is_public !== undefined ? Number(req.body.is_public) : 1,
    });
    res.status(201).json({ success: true, data: newTrack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateTrack = async (req, res) => {
  try {
    const track = await Track.getById(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });

    // Only owner or admin can update
    if (track.user_id && track.user_id !== req.user?.id && req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const updated = await Track.update(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteTrack = async (req, res) => {
  try {
    const track = await Track.getById(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });

    // Owner or admin can delete
    if (track.user_id && track.user_id !== req.user?.id && req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    await Track.delete(req.params.id);
    res.json({ success: true, message: 'Track deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cleanNetscapeCookies = (rawCookies) => {
  if (!rawCookies) return '';
  // Remove markdown code fence if present
  let clean = rawCookies.replace(/```(?:txt|cookies)?/g, '').trim();
  
  const lines = clean.split(/\r?\n/);
  const mergedLines = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // If it starts with #, treat it as a comment but preserve it in the intermediate list
    if (trimmed.startsWith('#')) {
      mergedLines.push(trimmed);
      continue;
    }
    
    // Check if this looks like a new cookie line starting with a domain and TRUE/FALSE
    const parts = trimmed.split(/\s+/);
    const isNewCookie = parts.length >= 2 && 
      (parts[0].includes('.') || parts[0] === 'localhost') &&
      (parts[1] === 'TRUE' || parts[1] === 'FALSE');
      
    if (isNewCookie) {
      mergedLines.push(trimmed);
    } else {
      // It's a continuation of the previous cookie value!
      if (mergedLines.length > 0) {
        // Find the last non-comment line to append to
        let lastIdx = mergedLines.length - 1;
        while (lastIdx >= 0 && mergedLines[lastIdx].startsWith('#')) {
          lastIdx--;
        }
        if (lastIdx >= 0) {
          mergedLines[lastIdx] = mergedLines[lastIdx] + trimmed;
        } else {
          mergedLines.push(trimmed);
        }
      } else {
        mergedLines.push(trimmed);
      }
    }
  }

  const resultLines = [];
  // Ensure the Netscape header is always at the very top
  resultLines.push('# Netscape HTTP Cookie File');
  
  for (const line of mergedLines) {
    if (line.startsWith('#')) continue; // Skip comments
    const parts = line.split(/\s+/);
    if (parts.length >= 6) {
      const domain = parts[0];
      const subdomains = parts[1];
      const path = parts[2];
      const secure = parts[3];
      const expiry = parts[4];
      const name = parts[5];
      const value = parts.slice(6).join(' '); // Value might contain spaces
      resultLines.push([domain, subdomains, path, secure, expiry, name, value].join('\t'));
    }
  }
  
  return resultLines.join('\n');
};

// ── Player clients to try in order ────────────────────────────────────────────
// Render datacenter IPs are often blocked by web client but less so by mobile/TV clients.
const PLAYER_CLIENTS = ['android_vr', 'tv', 'ios', 'mweb', 'web_music', 'web'];

const importTrack = async (req, res) => {
  let cookieFilePath = null;
  try {
    const { url, genre = 'Lofi', is_public = 1, category_id = null } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL là bắt buộc' });
    }

    // ── Load cookies from DB (optional) ───────────────────────────────
    let hasCookies = false;
    let cookieLength = 0;
    try {
      const rows = await query("SELECT value FROM settings WHERE `key` = 'youtube_cookies'");
      if (rows && rows.length > 0 && rows[0].value && rows[0].value.trim()) {
        const tempDir = path.resolve(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cookieFilePath = path.join(tempDir, `yt_cookies_${Date.now()}.txt`);
        const cleanedCookies = cleanNetscapeCookies(rows[0].value.trim());
        fs.writeFileSync(cookieFilePath, cleanedCookies, 'utf8');
        hasCookies = true;
        cookieLength = rows[0].value.trim().length;
        console.log(`[Import] YouTube cookies loaded and cleaned from DB (${cookieLength} chars).`);
      }
    } catch (e) {
      console.warn('[Import] Could not load cookies from DB:', e.message);
    }

    // Shared base flags
    const baseFlags = ['--no-warnings', '--no-playlist', '--geo-bypass', '--ignore-config', '--js-runtimes', 'node'];

    // ── STEP 1: Fetch metadata ─────────────────────────────────────────
    let meta         = null;
    let lastMetaErr  = null;

    const metaAttempts = [];
    for (const client of PLAYER_CLIENTS) {
      metaAttempts.push({ client, useCookies: false });
    }
    if (cookieFilePath) {
      for (const client of PLAYER_CLIENTS) {
        metaAttempts.push({ client, useCookies: true });
      }
    }

    for (const attempt of metaAttempts) {
      try {
        console.log(`[Import] Metadata attempt: client="${attempt.client}", cookies=${attempt.useCookies}`);
        const args = [
          ...baseFlags,
          '-f', 'b',
          '--extractor-args', `youtube:player_client=${attempt.client}`,
          '--dump-json',
        ];
        if (attempt.useCookies && cookieFilePath) {
          args.push('--cookies', cookieFilePath);
        }
        args.push(url);

        const raw = await runYtDlp(args);
        meta = JSON.parse(raw);
        console.log(`[Import] Metadata OK  (client="${attempt.client}", cookies=${attempt.useCookies}, title="${meta.title}")`);
        break;
      } catch (err) {
        lastMetaErr = err;
        console.warn(`[Import] Metadata FAIL (client="${attempt.client}", cookies=${attempt.useCookies}): ${(err.message || '').slice(0, 150)}`);
      }
    }

    if (!meta) {
      const raw = lastMetaErr?.message || '';
      console.error('[Import] All clients failed for metadata.');
      const msg = `Lỗi lấy thông tin bài hát (Cookies: ${hasCookies ? 'Đã nạp ' + cookieLength + ' ký tự' : 'Chưa nạp'}). Chi tiết: ${raw.slice(0, 400)}`;
      return res.status(400).json({ success: false, message: msg });
    }

    const title  = meta.title                                             || 'Imported Audio';
    const artist = meta.uploader || meta.artist || meta.channel           || 'Unknown Artist';

    // ── STEP 2: Duplicate check ────────────────────────────────────────
    const dup = await query(
      'SELECT id FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)',
      [title.trim(), artist.trim()]
    );
    if (dup && dup.length > 0) {
      return res.status(400).json({ success: false, message: 'Bài hát đã có sẵn trong thư viện.' });
    }

    // ── STEP 3: Setup permanent URLs ───────────────────────────────────
    const cover_url = meta.thumbnail || '';
    const audio_url = url; // Save the original YouTube URL directly in the database!

    // ── STEP 4: Persist track ──────────────────────────────────────────
    const newTrack  = await Track.create({
      title,
      artist,
      album:       meta.extractor_key || 'Imported',
      duration:    parseInt(meta.duration) || 180,
      cover_url,
      audio_url,
      genre,
      is_public:   Number(is_public),
      user_id:     req.user?.id || null,
      category_id: category_id ? Number(category_id) : null,
    });

    return res.status(201).json({ success: true, data: newTrack });

  } catch (err) {
    const raw = err.message || '';
    console.error('[Import] Unhandled error:', raw);
    const msg = isBotBlocked(raw)
      ? 'YouTube đang chặn server của ứng dụng. Hãy nhờ admin dán YouTube Cookies vào phần "Admin Panel → Cấu hình → YouTube Cookies" để tiếp tục.'
      : raw;
    res.status(500).json({ success: false, message: msg });
  } finally {
    if (cookieFilePath) {
      try { fs.unlinkSync(cookieFilePath); } catch (_) {}
    }
  }
};

// In-memory cache for YouTube streaming URLs
// Key: trackId, Value: { streamUrl, expiresAt }
const streamCache = new Map();

const streamTrack = async (req, res) => {
  try {
    const track = await Track.getById(req.params.id);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    const url = track.audio_url;
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('youtube:')) {
      const now = Date.now();
      // Check cache first
      const cached = streamCache.get(track.id);
      if (cached && cached.expiresAt > now + 600000) { // 10 minutes buffer
        console.log(`[Stream] Serving cached stream URL for track ${track.id} (Expires in ${Math.round((cached.expiresAt - now) / 60000)} mins)`);
        return res.redirect(302, cached.streamUrl);
      }

      let cookieFilePath = null;
      let hasCookies = false;
      try {
        const rows = await query("SELECT value FROM settings WHERE `key` = 'youtube_cookies'");
        if (rows && rows.length > 0 && rows[0].value && rows[0].value.trim()) {
          const tempDir = path.resolve(__dirname, '../../temp');
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
          cookieFilePath = path.join(tempDir, `yt_stream_cookies_${Date.now()}.txt`);
          const cleanedCookies = cleanNetscapeCookies(rows[0].value.trim());
          fs.writeFileSync(cookieFilePath, cleanedCookies, 'utf8');
          hasCookies = true;
        }
      } catch (e) {
        console.warn('[Stream] Could not load cookies from DB:', e.message);
      }

      let userAgent = req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      try {
        const rows = await query("SELECT value FROM settings WHERE \`key\` = 'youtube_user_agent'");
        if (rows && rows.length > 0 && rows[0].value && rows[0].value.trim()) {
          userAgent = rows[0].value.trim();
        }
      } catch (e) {
        console.warn('[Stream] Could not load User-Agent from DB:', e.message);
      }

      const baseFlags = [
        '--no-warnings',
        '--no-playlist',
        '--geo-bypass',
        '--ignore-config',
        '--js-runtimes', 'node'
      ];
      let streamUrl = null;
      let lastErr = null;
      const STREAM_CLIENTS = ['android_vr', 'web', 'ios'];
      const configs = [];

      if (hasCookies && cookieFilePath) {
        configs.push({ client: 'default', useCookies: true });
        for (const client of STREAM_CLIENTS) {
          configs.push({ client, useCookies: true });
        }
      } else {
        configs.push({ client: 'default', useCookies: false });
        for (const client of STREAM_CLIENTS) {
          configs.push({ client, useCookies: false });
        }
      }

      const controller = new AbortController();
      const { signal } = controller;

      const tasks = configs.map(config => {
        return (async () => {
          const args = [...baseFlags];
          if (config.client !== 'default') {
            args.push('--extractor-args', `youtube:player_client=${config.client}`);
          }
          if (config.client === 'web' || config.client === 'default') {
            args.push('--user-agent', userAgent);
          }
          args.push('-f', 'ba/18/22/best', '-g');

          if (config.useCookies && cookieFilePath) {
            args.push('--cookies', cookieFilePath);
          }
          args.push(url);

          const output = await runYtDlp(args, 25000, signal);
          if (output && output.trim()) {
            const resolvedUrl = output.trim().split('\n')[0];
            if (resolvedUrl && resolvedUrl.startsWith('http')) {
              return resolvedUrl;
            }
          }
          throw new Error(`Invalid output from client ${config.client}`);
        })();
      });

      try {
        streamUrl = await Promise.any(tasks);
        controller.abort();
      } catch (aggregateError) {
        controller.abort();
        lastErr = aggregateError;
        console.error('[Stream] All parallel stream extraction attempts failed.');
        if (aggregateError.errors) {
          aggregateError.errors.forEach((err, idx) => {
            console.error(`  - Config ${configs[idx].client} (cookies: ${configs[idx].useCookies}) failed:`, err.message || err);
          });
        }
      }

      if (cookieFilePath) {
        try { fs.unlinkSync(cookieFilePath); } catch (_) {}
      }

      if (streamUrl) {
        let expiresAt = now + 4 * 60 * 60 * 1000; // 4h fallback
        const expireMatch = streamUrl.match(/[&?]expire=(\d+)/);
        if (expireMatch) {
          expiresAt = parseInt(expireMatch[1]) * 1000;
        }
        
        streamCache.set(track.id, {
          streamUrl,
          expiresAt
        });

        console.log(`[Stream] Cached new stream URL for track ${track.id} (Expires at ${new Date(expiresAt).toISOString()})`);
        return res.redirect(302, streamUrl);
      } else {
        console.error('[Stream] Failed to get YouTube stream URL:', lastErr?.message);
        return res.status(400).json({ success: false, message: 'Could not extract stream URL: ' + (lastErr?.message || 'Unknown error') });
      }
    } else {
      const filename = path.basename(url);
      return res.redirect(302, `/uploads/audio/${filename}`);
    }
  } catch (err) {
    console.error('[Stream] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTopWeekly = async (req, res) => {
  try {
    // played_at is stored as Vietnam time (UTC+7), compare against 7 days ago in VN time
    const timeExpr = dbType === 'mysql'
      ? 'DATE_SUB(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR), INTERVAL 7 DAY)'
      : "datetime('now', '+7 hours', '-7 days')";

    const topTracks = await query(`
      SELECT t.id, t.title, t.artist, t.cover_url, t.audio_url, t.genre, t.duration,
             COUNT(ph.id) as weekly_plays
      FROM tracks t
      JOIN play_history ph ON ph.track_id = t.id
      WHERE ph.played_at >= ${timeExpr}
      GROUP BY t.id
      ORDER BY weekly_plays DESC
      LIMIT 5
    `);
    res.json({ success: true, data: topTracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRecentUploads = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const tracks = await Track.getRecentUploads(userId);
    res.json({ success: true, data: tracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const debugYtDlp = async (req, res) => {
  let cookieFilePath = null;
  try {
    const rows = await query("SELECT value FROM settings WHERE `key` = 'youtube_cookies'");
    const hasCookies = !!(rows && rows.length > 0 && rows[0].value && rows[0].value.trim());
    
    let cleanedCookiesSample = '';
    if (hasCookies) {
      const rawVal = rows[0].value.trim();
      const cleaned = cleanNetscapeCookies(rawVal);
      
      const lines = cleaned.split('\n');
      const previewLines = [];
      for (const line of lines) {
        if (line.startsWith('#')) {
          previewLines.push(line);
          continue;
        }
        const parts = line.split('\t');
        if (parts.length >= 7) {
          const name = parts[5];
          const val = parts[6];
          const redactedVal = val.substring(0, 10) + '...' + val.substring(Math.max(10, val.length - 10));
          parts[6] = `[REDACTED_LEN_${val.length}: ${redactedVal}]`;
          previewLines.push(parts.join('\t'));
        } else {
          previewLines.push(line);
        }
      }
      cleanedCookiesSample = previewLines.slice(0, 25).join('\n');

      const tempDir = path.resolve(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      cookieFilePath = path.join(tempDir, `debug_cookies_${Date.now()}.txt`);
      fs.writeFileSync(cookieFilePath, cleaned, 'utf8');
    }

    let userAgent = req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    try {
      const rows = await query("SELECT value FROM settings WHERE \`key\` = 'youtube_user_agent'");
      if (rows && rows.length > 0 && rows[0].value && rows[0].value.trim()) {
        userAgent = rows[0].value.trim();
      }
    } catch (e) {
      console.warn('[Debug] Could not load User-Agent from DB:', e.message);
    }
    const sampleUrl = req.query.url || 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const client = req.query.client || 'android_vr';
    const useCookies = req.query.useCookies !== 'false' && hasCookies;
    const timeoutVal = parseInt(req.query.timeout) || 40000;

    const listFormats = req.query.listFormats === 'true';
    const args = [
      '--no-warnings',
      '--no-playlist',
      '--geo-bypass',
      '--ignore-config',
      '--js-runtimes', 'node',
      '--extractor-args', `youtube:player_client=${client}`
    ];
    if (client === 'web') {
      args.push('--user-agent', userAgent);
    }
    if (useCookies && cookieFilePath) {
      args.push('--cookies', cookieFilePath);
    }
    if (listFormats) {
      args.push('--list-formats');
    } else {
      args.push('-f', 'ba/18/22/best', '-g');
    }
    args.push(sampleUrl);

    let testResult = null;
    try {
      const stdoutText = await runYtDlp(args, timeoutVal);
      testResult = {
        client,
        useCookies,
        success: true,
        output: stdoutText
      };
    } catch (err) {
      testResult = {
        client,
        useCookies,
        success: false,
        error: err.message.trim(),
        stderr: err.stderr ? err.stderr.trim() : null,
        stdout: err.stdout ? err.stdout.trim() : null,
        killed: err.killed || false,
        signal: err.signal || null
      };
    }

    if (cookieFilePath) {
      try { fs.unlinkSync(cookieFilePath); } catch (_) {}
    }

    res.json({
      success: true,
      hasCookies,
      cleanedCookiesSample,
      userAgent,
      testResult
    });
  } catch (err) {
    if (cookieFilePath) {
      try { fs.unlinkSync(cookieFilePath); } catch (_) {}
    }
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
};

module.exports = { getAllTracks, getTrackById, createTrack, updateTrack, deleteTrack, importTrack, streamTrack, getTopWeekly, getRecentUploads, debugYtDlp };
