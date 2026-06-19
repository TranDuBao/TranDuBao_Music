const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const Track = require('../models/Track');
const { query, dbType } = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

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
        resolve({
          stdout: stdout ? stdout.toString() : '',
          stderr: stderr ? stderr.toString() : ''
        });
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
      audio_url = await uploadToCloudinary(req.files.audio[0].path, 'music-stream/audio');
    }
    if (req.files?.cover?.[0]) {
      cover_url = await uploadToCloudinary(req.files.cover[0].path, 'music-stream/covers');
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

    // Delete audio and cover files from Cloudinary
    if (track.audio_url) {
      await deleteFromCloudinary(track.audio_url);
    }
    if (track.cover_url) {
      await deleteFromCloudinary(track.cover_url);
    }

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

// Helper: fetch metadata using oEmbed (YouTube official & noembed) when yt-dlp fails
const fetchFallbackMetadata = async (youtubeUrl) => {
  // 1. Try YouTube official oEmbed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    console.log(`[Import Fallback] Querying YouTube official oEmbed: ${oembedUrl}`);
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        console.log(`[Import Fallback] YouTube official oEmbed success: "${data.title}"`);
        return {
          title: data.title,
          uploader: data.author_name || 'Unknown Artist',
          thumbnail: data.thumbnail_url || '',
          duration: 180,
          extractor_key: 'Youtube'
        };
      }
    }
  } catch (err) {
    console.warn('[Import Fallback] YouTube official oEmbed failed:', err.message);
  }

  // 2. Try noembed.com
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`;
    console.log(`[Import Fallback] Querying noembed.com: ${noembedUrl}`);
    const res = await fetch(noembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        console.log(`[Import Fallback] noembed.com success: "${data.title}"`);
        return {
          title: data.title,
          uploader: data.author_name || 'Unknown Artist',
          thumbnail: data.thumbnail_url || '',
          duration: 180,
          extractor_key: 'Youtube'
        };
      }
    }
  } catch (err) {
    console.warn('[Import Fallback] noembed.com failed:', err.message);
  }

  return null;
};

// Helper: fetch stream URL from Cobalt public instances when yt-dlp fails
const fetchCobaltStreamUrl = async (youtubeUrl) => {
  const defaultInstances = [
    'https://cobaltapi.kittycat.boo',
    'https://dog.kittycat.boo',
    'https://rue-cobalt.xenon.zone',
    'https://fox.kittycat.boo'
  ];

  let cobaltInstances = defaultInstances;
  try {
    const res = await fetch('https://cobalt.directory/api/working?type=api', {
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : null
    });
    if (res.ok) {
      const json = await res.json();
      const liveList = json?.data?.youtube || json?.data?.['youtube'] || [];
      if (liveList.length > 0) {
        const cleanLive = liveList.filter(url => 
          !url.includes('qwkuns.me') && 
          !url.includes('wolfy.love') && 
          !url.includes('clxxped.lol') && 
          !url.includes('squair.xyz') && 
          !url.includes('meowing.de')
        );
        cobaltInstances = Array.from(new Set([...cleanLive, ...defaultInstances]));
        console.log(`[Stream Fallback] Loaded ${cobaltInstances.length} Cobalt instances (including dynamic ones)`);
      }
    }
  } catch (err) {
    console.warn('[Stream Fallback] Could not fetch live Cobalt instances:', err.message);
  }

  for (const instance of cobaltInstances) {
    try {
      console.log(`[Stream Fallback] Trying Cobalt instance "${instance}" for url="${youtubeUrl}"`);
      const res = await fetch(instance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: youtubeUrl,
          downloadMode: 'audio',
          audioFormat: 'best',
          audioBitrate: '128'
        })
      });
      if (res.ok) {
        const data = await res.json();
        let streamUrl = null;
        if (data && data.url) {
          streamUrl = data.url;
        } else if (data && data.status === 'redirect' && data.url) {
          streamUrl = data.url;
        }

        if (streamUrl) {
          console.log(`[Stream Fallback] Cobalt instance "${instance}" returned URL. Verifying stream validity...`);
          try {
            const verifySignal = AbortSignal.timeout ? AbortSignal.timeout(5000) : null;
            const testRes = await fetch(streamUrl, {
              method: 'GET',
              headers: { 'Range': 'bytes=0-1' },
              signal: verifySignal
            });
            const len = testRes.headers.get('content-length');
            if ((testRes.status === 200 || testRes.status === 206) && parseInt(len || '0') > 0) {
              console.log(`[Stream Fallback] Verification success for "${instance}" (Content-Length: ${len})`);
              return streamUrl;
            } else {
              console.warn(`[Stream Fallback] Verification failed for "${instance}". Status: ${testRes.status}, Content-Length: ${len}`);
            }
          } catch (verifyErr) {
            console.warn(`[Stream Fallback] Verification failed for "${instance}" due to connection error:`, verifyErr.message);
          }
        }
      } else {
        const text = await res.text();
        console.warn(`[Stream Fallback] Cobalt "${instance}" returned ${res.status}: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.warn(`[Stream Fallback] Cobalt "${instance}" connection error:`, err.message);
    }
  }
  return null;
};

// ── Player clients to try in order ────────────────────────────────────────────
// Render datacenter IPs are often blocked by web client but less so by mobile/TV clients.
const PLAYER_CLIENTS = ['tv', 'android_vr', 'ios', 'mweb', 'web_music', 'web'];

const importTrack = async (req, res) => {
  try {
    const { url, genre = 'Lofi', is_public = 1, category_id = null } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL là bắt buộc' });
    }

    // ── YouTube or SoundCloud URL: use oEmbed to get metadata (fast, never blocked) ─
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isSoundCloud = url.includes('soundcloud.com');

    if (!isYouTube && !isSoundCloud) {
      // Direct audio file URL (mp3, wav, Deezer preview, etc.)
      const title  = req.body.title  || 'Imported Audio';
      const artist = req.body.artist || 'Unknown Artist';
      const dup = await query(
        'SELECT id FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)',
        [title.trim(), artist.trim()]
      );
      if (dup && dup.length > 0) {
        return res.status(400).json({ success: false, message: 'Bài hát đã có sẵn trong thư viện.' });
      }
      const newTrack = await Track.create({
        title, artist,
        album: req.body.album || 'Imported',
        duration: parseInt(req.body.duration) || 180,
        cover_url: req.body.cover_url || '',
        audio_url: url,
        genre,
        is_public: Number(is_public),
        user_id: req.user?.id || null,
        category_id: category_id ? Number(category_id) : null,
      });
      return res.status(201).json({ success: true, data: newTrack });
    }

    // ── oEmbed Extraction (no API key, instant) ──────────────
    let title, artist, cover_url, duration;
    try {
      let oembedUrl;
      if (isYouTube) {
        oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      } else {
        oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      }
      console.log(`[Import] Fetching oEmbed: ${oembedUrl}`);
      const oRes = await fetch(oembedUrl);
      if (!oRes.ok) throw new Error(`oEmbed HTTP ${oRes.status}`);
      const data = await oRes.json();
      title    = data.title          || 'Imported Audio';
      artist   = data.author_name    || 'Unknown Artist';
      cover_url = data.thumbnail_url || '';
      duration = 180; // oEmbed doesn't return duration — frontend gets it from player or backend extracts
      console.log(`[Import] oEmbed OK: "${title}" by "${artist}"`);
    } catch (err) {
      console.error('[Import] oEmbed failed:', err.message);
      return res.status(400).json({
        success: false,
        message: `Không thể lấy thông tin bài hát từ URL. Hãy kiểm tra lại URL. Chi tiết: ${err.message}`
      });
    }

    // ── Duplicate check ───────────────────────────────────────────────
    const dup = await query(
      'SELECT id FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)',
      [title.trim(), artist.trim()]
    );
    if (dup && dup.length > 0) {
      return res.status(400).json({ success: false, message: 'Bài hát đã có sẵn trong thư viện.' });
    }

    // ── Save track with original YouTube / SoundCloud URL ─────────────
    const newTrack = await Track.create({
      title, artist,
      album: isYouTube ? 'YouTube' : 'SoundCloud',
      duration,
      cover_url,
      audio_url: url,
      genre,
      is_public: Number(is_public),
      user_id: req.user?.id || null,
      category_id: category_id ? Number(category_id) : null,
    });
    return res.status(201).json({ success: true, data: newTrack });

  } catch (err) {
    console.error('[Import] Unhandled error:', err.message);
    res.status(500).json({ success: false, message: err.message });
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
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('youtube:') || url.includes('soundcloud.com')) {
      const now = Date.now();
      // Check cache first
      const cached = streamCache.get(track.id);
      if (cached && cached.expiresAt > now + 15000) { // 15 seconds buffer to accommodate short-lived Cobalt URLs
        console.log(`[Stream] Serving cached stream URL for track ${track.id} (Expires in ${Math.round((cached.expiresAt - now) / 1000)} seconds)`);
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
      const STREAM_CLIENTS = ['tv', 'android_vr', 'web', 'ios'];
      const configs = [];

      if (hasCookies && cookieFilePath) {
        configs.push({ client: 'tv', useCookies: true });
        configs.push({ client: 'default', useCookies: true });
        for (const client of STREAM_CLIENTS) {
          if (client !== 'tv') {
            configs.push({ client, useCookies: true });
          }
        }
      } else {
        configs.push({ client: 'tv', useCookies: false });
        configs.push({ client: 'default', useCookies: false });
        for (const client of STREAM_CLIENTS) {
          if (client !== 'tv') {
            configs.push({ client, useCookies: false });
          }
        }
      }

      const attemptsErrors = [];
      for (const config of configs) {
        try {
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

          console.log(`[Stream] Trying client: ${config.client} (useCookies: ${config.useCookies})...`);
          const { stdout } = await runYtDlp(args, 25000);
          if (stdout && stdout.trim()) {
            const resolvedUrl = stdout.trim().split('\n')[0];
            if (resolvedUrl && resolvedUrl.startsWith('http')) {
              streamUrl = resolvedUrl;
              console.log(`[Stream] Successfully resolved stream using client: ${config.client}`);
              break;
            }
          }
        } catch (err) {
          console.warn(`[Stream] Client ${config.client} (useCookies: ${config.useCookies}) failed:`, err.message || err);
          attemptsErrors.push({
            client: config.client,
            useCookies: config.useCookies,
            error: err.message || err
          });
          lastErr = err;
        }
      }

      if (cookieFilePath) {
        try { fs.unlinkSync(cookieFilePath); } catch (_) {}
      }

      if (!streamUrl) {
        console.log(`[Stream] All yt-dlp attempts failed. Trying Cobalt fallback for url="${url}"...`);
        streamUrl = await fetchCobaltStreamUrl(url);
      }

      if (streamUrl) {
        let expiresAt = now + 4 * 60 * 60 * 1000; // 4h fallback
        const expireMatch = streamUrl.match(/[&?]expire=(\d+)/);
        if (expireMatch) {
          const val = parseInt(expireMatch[1]);
          expiresAt = val < 10000000000 ? val * 1000 : val;
        } else {
          const expMatch = streamUrl.match(/[&?]exp=(\d+)/);
          if (expMatch) {
            const val = parseInt(expMatch[1]);
            expiresAt = val < 10000000000 ? val * 1000 : val;
          }
        }
        
        streamCache.set(track.id, {
          streamUrl,
          expiresAt
        });

        console.log(`[Stream] Cached new stream URL for track ${track.id} (Expires at ${new Date(expiresAt).toISOString()})`);
        return res.redirect(302, streamUrl);
      } else {
        console.error('[Stream] Failed to get YouTube stream URL:', lastErr?.message);
        return res.status(400).json({ 
          success: false, 
          message: 'Could not extract stream URL: ' + (lastErr?.message || 'Unknown error'),
          details: attemptsErrors
        });
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
      const { stdout, stderr } = await runYtDlp(args, timeoutVal);
      testResult = {
        client,
        useCookies,
        success: true,
        output: stdout,
        stderr: stderr
      };
    } catch (err) {
      const errMsg = err && err.message ? err.message : 'Unknown error';
      testResult = {
        client,
        useCookies,
        success: false,
        error: errMsg.trim(),
        stderr: err && err.stderr ? err.stderr.trim() : null,
        stdout: err && err.stdout ? err.stdout.trim() : null,
        killed: err && err.killed || false,
        signal: err && err.signal || null
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
