const { query, dbType, dbInstance } = require('./db');
const bcrypt = require('bcryptjs');
const initDb = async () => {
  if (dbType === 'mysql') {
    try {
      // Create database if it doesn't exist
      const mysql = require('mysql2/promise');
      const connConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306,
      };

      if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
        connConfig.ssl = {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true
        };
      }

      const connection = await mysql.createConnection(connConfig);
      const dbName = process.env.DB_NAME || 'music_stream_db';
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.end();

      // Check if tables already exist (e.g. check if 'users' table exists)
      const tables = await query("SHOW TABLES LIKE 'users'");
      if (tables && tables.length > 0) {
        console.log('MySQL database is already initialized.');
        return;
      }

      console.log('Initializing MySQL Database...');
      const fs = require('fs');
      const path = require('path');
      const sqlFile = path.resolve(__dirname, '../../database/music_db.sql');
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');

      // Split by semicolon, filter empty queries
      const queries = sqlContent
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (const q of queries) {
        await dbInstance.query(q);
      }
      console.log('MySQL Database Initialized Successfully.');
    } catch (err) {
      console.error('Failed to initialize MySQL Database:', err.message);
    }
    return;
  }

  try {
    // ── Users ────────────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    UNIQUE,
      password_hash TEXT,
      role        TEXT    NOT NULL DEFAULT 'user',
      provider    TEXT    NOT NULL DEFAULT 'local',
      provider_id TEXT,
      avatar_url  TEXT,
      bio         TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Categories ───────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      description TEXT,
      color       TEXT    DEFAULT '#7c3aed',
      icon        TEXT    DEFAULT '🎵',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Tracks ───────────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS tracks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      artist      TEXT    NOT NULL,
      album       TEXT    DEFAULT 'Single',
      duration    INTEGER NOT NULL DEFAULT 180,
      cover_url   TEXT,
      audio_url   TEXT    NOT NULL,
      genre       TEXT    DEFAULT 'Other',
      is_public   INTEGER DEFAULT 1,
      play_count  INTEGER DEFAULT 0,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      album_id    INTEGER REFERENCES albums(id) ON DELETE SET NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration: add new columns to existing tables if missing
    try { await query("ALTER TABLE tracks ADD COLUMN play_count INTEGER DEFAULT 0"); } catch (_) { }
    try { await query("ALTER TABLE tracks ADD COLUMN category_id INTEGER"); } catch (_) { }
    try { await query("ALTER TABLE tracks ADD COLUMN album_id INTEGER"); } catch (_) { }
    try { await query("ALTER TABLE users ADD COLUMN bio TEXT"); } catch (_) { }
    try { await query("ALTER TABLE users ADD COLUMN banned_until DATETIME DEFAULT NULL"); } catch (_) { }
    try { await query("ALTER TABLE users ADD COLUMN last_active_at DATETIME DEFAULT NULL"); } catch (_) { }

    // ── Playlists ────────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS playlists (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Playlist Tracks ──────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER,
      track_id    INTEGER,
      position    INTEGER DEFAULT 0,
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id)    REFERENCES tracks(id)    ON DELETE CASCADE
    )`);

    // ── Play History ─────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS play_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      track_id    INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
      played_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Favorites ────────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS favorites (
      user_id     INTEGER,
      track_id    INTEGER,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, track_id),
      FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    )`);

    // ── Ratings ──────────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS ratings (
      user_id    INTEGER,
      track_id   INTEGER,
      rating     INTEGER CHECK(rating BETWEEN 1 AND 5),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, track_id),
      FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    )`);

    // ── Featured Artists ──────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS featured_artists (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      genre         TEXT    NOT NULL,
      listeners     TEXT    NOT NULL,
      bio           TEXT    NOT NULL,
      image_url     TEXT    NOT NULL,
      glow_class    TEXT    NOT NULL,
      popular_track TEXT    NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Banner Slides ─────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS banner_slides (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url   TEXT    NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Albums ────────────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS albums (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      artist      TEXT    NOT NULL,
      cover_url   TEXT,
      description TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Settings ──────────────────────────────────────────────────
    await query(`CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT    NOT NULL
    )`);

    // ── Seed Admin ───────────────────────────────────────────────
    const adminCount = await query("SELECT COUNT(*) as c FROM users WHERE role='admin'");
    if (adminCount[0].c === 0) {
      const existingUser = await query("SELECT id FROM users WHERE email='admin@musicstream.com'");
      if (existingUser && existingUser.length > 0) {
        await query("UPDATE users SET role='admin' WHERE email='admin@musicstream.com'");
        console.log('Admin role restored for admin@musicstream.com');
      } else {
        const h = await bcrypt.hash('admin123', 10);
        await query("INSERT INTO users (name,email,password_hash,role,bio) VALUES (?,?,?,'admin','Quản trị viên hệ thống MusicStream')",
          ['Admin', 'admin@musicstream.com', h]);
        console.log('Admin seeded: admin@musicstream.com / admin123');
      }
    }

    const userCount = await query("SELECT COUNT(*) as c FROM users WHERE email='user@musicstream.com'");
    if (userCount[0].c === 0) {
      const h = await bcrypt.hash('user123', 10);
      await query("INSERT INTO users (name,email,password_hash,role,bio) VALUES (?,?,?,'user','Người yêu nhạc')",
        ['Demo User', 'user@musicstream.com', h]);
      console.log('Demo user seeded: user@musicstream.com / user123');
    }

    // ── Seed Categories ──────────────────────────────────────────
    const catCount = await query("SELECT COUNT(*) as c FROM categories");
    if (catCount[0].c === 0) {
      const cats = [
        ['Lofi', 'Nhạc lofi nhẹ nhàng, thư giãn', '#7c3aed', '🎵'],
        ['Synthwave', 'Tổng hợp điện tử phong cách retro', '#db2777', '🌆'],
        ['Ambient', 'Nhạc nền yên tĩnh, tiếng thiên nhiên', '#0891b2', '🌊'],
        ['Jazz', 'Nhạc jazz và jazz hop', '#d97706', '🎷'],
        ['Classical', 'Nhạc cổ điển', '#059669', '🎻'],
        ['Hip Hop', 'Hip hop và rap', '#dc2626', '🎤'],
        ['Electronic', 'Nhạc điện tử, EDM', '#7c3aed', '⚡'],
        ['Rock', 'Rock và alternative', '#374151', '🎸'],
      ];
      for (const [name, desc, color, icon] of cats)
        await query("INSERT INTO categories (name,description,color,icon) VALUES (?,?,?,?)",
          [name, desc, color, icon]);
      console.log('Categories seeded.');
    }

    // ── Seed Featured Artists ────────────────────────────────────
    const artistCount = await query("SELECT COUNT(*) as c FROM featured_artists");
    if (artistCount[0].c === 0) {
      const defaultArtists = [
        [
          'The Weeknd',
          'R&B / Synthwave / Pop',
          '115.4M',
          'Abel Makkonen Tesfaye, nghệ danh The Weeknd, là nam ca sĩ kiêm nhạc sĩ và nhà sản xuất âm nhạc người Canada. Anh nổi tiếng với những ca khúc nhạc điện tử mang phong cách tăm tối, u uất kết hợp cùng âm hưởng R&B đương đại, tiêu biểu là các siêu phẩm toàn cầu như "Blinding Lights", "Starboy" và "Save Your Tears".',
          'http://localhost:1005/uploads/img/the_weeknd.png',
          'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.35)] group-hover:border-purple-500/30',
          'Blinding Lights'
        ],
        [
          'Ariana Grande',
          'Pop / R&B',
          '84.2M',
          'Ariana Grande-Butera là nữ ca sĩ, nhạc sĩ kiêm diễn viên người Mỹ. Sở hữu quãng giọng soprano bốn quãng tám cùng kỹ thuật giả thanh đỉnh cao, cô là một trong những nghệ sĩ nhạc pop thành công nhất thế kỷ 21 với hàng loạt album đạt vị trí quán quân như "Thank U, Next" và "Positions".',
          'http://localhost:1005/uploads/img/ariana_grande.png',
          'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.35)] group-hover:border-pink-500/30',
          'Thank U, Next'
        ],
        [
          'Justin Bieber',
          'Pop / R&B / Dance',
          '78.9M',
          'Justin Drew Bieber là nam ca sĩ kiêm nhạc sĩ người Canada. Được phát hiện qua YouTube từ năm 13 tuổi, anh nhanh chóng trở thành hiện tượng nhạc Pop toàn cầu. Với phong cách đa dạng từ Teen Pop đến R&B trưởng thành, anh gặt hái thành công lớn qua các ca khúc "Stay", "Peaches" và "Sorry".',
          'http://localhost:1005/uploads/img/justin_bieber.png',
          'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] group-hover:border-blue-500/30',
          'Stay'
        ]
      ];
      for (const [name, genre, listeners, bio, image_url, glow_class, popular_track] of defaultArtists) {
        await query(
          "INSERT INTO featured_artists (name, genre, listeners, bio, image_url, glow_class, popular_track) VALUES (?,?,?,?,?,?,?)",
          [name, genre, listeners, bio, image_url, glow_class, popular_track]
        );
      }
      console.log('Featured artists seeded.');
    }

    // ── Seed Banner Slides ────────────────────────────────────────
    const bannerCount = await query("SELECT COUNT(*) as c FROM banner_slides");
    if (bannerCount[0].c === 0) {
      const defaultSlides = [
        'http://localhost:1005/uploads/img/banner_slide_1.png',
        'http://localhost:1005/uploads/img/banner_slide_2.png',
        'http://localhost:1005/uploads/img/banner_slide_3.png',
        'http://localhost:1005/uploads/img/banner_slide_4.png',
        'http://localhost:1005/uploads/img/banner_slide_5.png'
      ];
      for (const url of defaultSlides) {
        await query("INSERT INTO banner_slides (image_url) VALUES (?)", [url]);
      }
      console.log('Banner slides seeded.');
    }

    // ── Seed Settings ─────────────────────────────────────────────
    const bgSettingCount = await query("SELECT COUNT(*) as c FROM settings WHERE key='background_image_url'");
    if (bgSettingCount[0].c === 0) {
      await query("INSERT INTO settings (key, value) VALUES (?, ?)", ['background_image_url', 'http://localhost:1005/uploads/img/the_weeknd.png']);
      console.log('Background setting seeded.');
    }

    // ── Seed Tracks ──────────────────────────────────────────────
    const trackCount = await query("SELECT COUNT(*) as c FROM tracks");
    if (trackCount[0].c === 0) {
      const seed = [
        ['Lost in the City', 'Lofi Chill', 'Urban Escapes', 372, 'Lofi', 1, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
        ['Summer Breeze', 'Synthwave Rider', 'Neon Highways', 423, 'Synthwave', 2, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'],
        ['Midnight Drive', 'Retro Synth', 'Outrun Nights', 302, 'Synthwave', 2, 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'],
        ['Ocean Waves', 'Ambient Chill', 'Silent Tides', 276, 'Ambient', 3, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'],
        ['Morning Coffee', 'Jazz Hop Trio', 'Café Tunes', 241, 'Jazz', 4, 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'],
      ];
      for (const [title, artist, album, duration, genre, cat_id, cover_url, audio_url] of seed)
        await query(
          "INSERT INTO tracks (title,artist,album,duration,genre,category_id,cover_url,audio_url,play_count) VALUES (?,?,?,?,?,?,?,?,?)",
          [title, artist, album, duration, genre, cat_id, cover_url, audio_url, Math.floor(Math.random() * 200)]
        );
      await query("INSERT INTO playlists (name,description) VALUES (?,?)", ['My Favorites', 'Daily dose of good music']);
      await query("INSERT INTO playlists (name,description) VALUES (?,?)", ['Chill study vibes', 'Focus tracks']);
      await query("INSERT INTO playlist_tracks VALUES (1,1,1),(1,3,2),(2,4,1),(2,5,2)");
      console.log('Tracks seeded.');
    }

    console.log('Database ready.');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
};

module.exports = initDb;
