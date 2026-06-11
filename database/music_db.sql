-- ============================================================
-- MusicStream Database Schema
-- Supports: MySQL 5.7+ / MariaDB 10.3+
-- Import: mysql -u root -p < music_db.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS music_stream_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE music_stream_db;

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255)  NOT NULL,
    email         VARCHAR(255)  UNIQUE,
    password_hash VARCHAR(255)  DEFAULT NULL,
    role          ENUM('admin','user') NOT NULL DEFAULT 'user',
    provider      ENUM('local','google','facebook') NOT NULL DEFAULT 'local',
    provider_id   VARCHAR(255)  DEFAULT NULL,
    avatar_url    VARCHAR(500)  DEFAULT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Tracks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    artist      VARCHAR(255) NOT NULL,
    album       VARCHAR(255) DEFAULT 'Single',
    duration    INT NOT NULL DEFAULT 180,
    cover_url   VARCHAR(500) DEFAULT NULL,
    audio_url   VARCHAR(500) NOT NULL,
    genre       VARCHAR(100) DEFAULT 'Other',
    is_public   TINYINT(1)   DEFAULT 1,
    user_id     INT          DEFAULT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── Playlists ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    user_id     INT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Playlist Tracks ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INT NOT NULL,
    track_id    INT NOT NULL,
    position    INT DEFAULT 0,
    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id)    REFERENCES tracks(id)    ON DELETE CASCADE
);

-- ── Seed: Admin user (password: admin123) ──────────────────────
-- bcrypt hash of 'admin123'
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@musicstream.com', '$2a$10$wQJl3XhWLdBZBq5A0.nzGuNjkmFkmwkVeJMc2jc5/TFx1tJGj/0/C', 'admin'),
('Demo User', 'user@musicstream.com', '$2a$10$bNsV3pBSuSw9dSbKBc3Rp.Tc7bIKHLIl5P8yVw.S8bJGk4x5OHs9K', 'user');

-- ── Seed: Sample Tracks ─────────────────────────────────────────
INSERT INTO tracks (title, artist, album, duration, cover_url, audio_url, genre) VALUES
('Lost in the City',  'Lofi Chill',     'Urban Escapes',  372, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'Lofi'),
('Summer Breeze',     'Synthwave Rider', 'Neon Highways',  423, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'Synthwave'),
('Midnight Drive',    'Retro Synth',     'Outrun Nights',  302, 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'Retro'),
('Ocean Waves',       'Ambient Chill',   'Silent Tides',   276, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'Ambient'),
('Morning Coffee',    'Jazz Hop Trio',   'Café Tunes',     241, 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'Jazz Hop');

-- ── Seed: Playlists ─────────────────────────────────────────────
INSERT INTO playlists (name, description) VALUES
('My Favorites',      'My daily dose of good music'),
('Chill study vibes', 'Lofi and ambient tracks to focus');

INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES
(1, 1, 1), (1, 3, 2), (2, 4, 1), (2, 5, 2);
