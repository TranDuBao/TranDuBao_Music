-- ============================================================
-- MusicStream Database Schema (MySQL)
-- Supports: MySQL 5.7+ / MariaDB 10.3+
-- ============================================================

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255)  NOT NULL,
    email         VARCHAR(255)  UNIQUE,
    password_hash VARCHAR(255)  DEFAULT NULL,
    role          VARCHAR(50)   NOT NULL DEFAULT 'user',
    provider      VARCHAR(50)   NOT NULL DEFAULT 'local',
    provider_id   VARCHAR(255)  DEFAULT NULL,
    avatar_url    TEXT          DEFAULT NULL,
    bio           TEXT          DEFAULT NULL,
    banned_until  DATETIME      DEFAULT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    color       VARCHAR(50)  DEFAULT '#7c3aed',
    icon        VARCHAR(50)  DEFAULT '🎵',
    user_id     INT          DEFAULT NULL,
    position    INT          DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Albums ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS albums (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    artist      VARCHAR(255) NOT NULL,
    cover_url   VARCHAR(500) DEFAULT NULL,
    description TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tracks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    artist      VARCHAR(255) NOT NULL,
    album       VARCHAR(255) DEFAULT 'Single',
    duration    INT NOT NULL DEFAULT 180,
    cover_url   TEXT         DEFAULT NULL,
    audio_url   TEXT         NOT NULL,
    genre       VARCHAR(100) DEFAULT 'Other',
    is_public   TINYINT(1)   DEFAULT 1,
    play_count  INT          DEFAULT 0,
    user_id     INT          DEFAULT NULL,
    category_id INT          DEFAULT NULL,
    album_id    INT          DEFAULT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Playlists ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    user_id     INT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Playlist Tracks ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INT NOT NULL,
    track_id    INT NOT NULL,
    position    INT DEFAULT 0,
    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id)    REFERENCES tracks(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Play History ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS play_history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT DEFAULT NULL,
    track_id    INT NOT NULL,
    played_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Favorites ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
    user_id     INT NOT NULL,
    track_id    INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Ratings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
    user_id    INT NOT NULL,
    track_id   INT NOT NULL,
    rating     INT CHECK(rating BETWEEN 1 AND 5),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Featured Artists ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS featured_artists (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    genre         VARCHAR(255) NOT NULL,
    listeners     VARCHAR(50)  NOT NULL,
    bio           TEXT         NOT NULL,
    image_url     VARCHAR(500) NOT NULL,
    glow_class    VARCHAR(255) NOT NULL,
    popular_track VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Banner Slides ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banner_slides (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    image_url   VARCHAR(500) NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Settings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    `key`       VARCHAR(255) PRIMARY KEY,
    `value`     TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Users ──────────────────────
-- bcrypt hashes for admin123 and user123
INSERT IGNORE INTO users (id, name, email, password_hash, role, bio) VALUES
(1, 'Admin', 'admin@musicstream.com', '$2y$10$wQJl3XhWLdBZBq5A0.nzGuNjkmFkmwkVeJMc2jc5/TFx1tJGj/0/C', 'admin', 'Quản trị viên hệ thống MusicStream'),
(2, 'Demo User', 'user@musicstream.com', '$2y$10$bNsV3pBSuSw9dSbKBc3Rp.Tc7bIKHLIl5P8yVw.S8bJGk4x5OHs9K', 'user', 'Người yêu nhạc');

-- ── Seed: Categories ──────────────────────────────────────────
INSERT IGNORE INTO categories (id, name, description, color, icon) VALUES
(1, 'Lofi', 'Nhạc lofi nhẹ nhàng, thư giãn', '#7c3aed', '🎵'),
(2, 'Synthwave', 'Tổng hợp điện tử phong cách retro', '#db2777', '🌆'),
(3, 'Ambient', 'Nhạc nền yên tĩnh, tiếng thiên nhiên', '#0891b2', '🌊'),
(4, 'Jazz', 'Nhạc jazz và jazz hop', '#d97706', '🎷'),
(5, 'Classical', 'Nhạc cổ điển', '#059669', '🎻'),
(6, 'Hip Hop', 'Hip hop và rap', '#dc2626', '🎤'),
(7, 'Electronic', 'Nhạc điện tử, EDM', '#7c3aed', '⚡'),
(8, 'Rock', 'Rock và alternative', '#374151', '🎸');

-- ── Seed: Featured Artists ────────────────────────────────────
INSERT IGNORE INTO featured_artists (id, name, genre, listeners, bio, image_url, glow_class, popular_track) VALUES
(1, 'The Weeknd', 'R&B / Synthwave / Pop', '115.4M', 'Abel Makkonen Tesfaye, nghệ danh The Weeknd, là nam ca sĩ kiêm nhạc sĩ và nhà sản xuất âm nhạc người Canada. Anh nổi tiếng với những ca khúc nhạc điện tử mang phong cách tăm tối, u uất kết hợp cùng âm hưởng R&B đương đại, tiêu biểu là các siêu phẩm toàn cầu như "Blinding Lights", "Starboy" và "Save Your Tears".', 'http://localhost:5000/uploads/img/the_weeknd.png', 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.35)] group-hover:border-purple-500/30', 'Blinding Lights'),
(2, 'Ariana Grande', 'Pop / R&B', '84.2M', 'Ariana Grande-Butera là nữ ca sĩ, nhạc sĩ kiêm diễn viên người Mỹ. Sở hữu quãng giọng soprano bốn quãng tám cùng kỹ thuật giả thanh đỉnh cao, cô là một trong những nghệ sĩ nhạc pop thành công nhất thế kỷ 21 với hàng loạt album đạt vị trí quán quân như "Thank U, Next" và "Positions".', 'http://localhost:5000/uploads/img/ariana_grande.png', 'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.35)] group-hover:border-pink-500/30', 'Thank U, Next'),
(3, 'Justin Bieber', 'Pop / R&B / Dance', '78.9M', 'Justin Drew Bieber là nam ca sĩ kiêm nhạc sĩ người Canada. Được phát hiện qua YouTube từ năm 13 tuổi, anh nhanh chóng trở thành hiện tượng nhạc Pop toàn cầu. Với phong cách đa dạng từ Teen Pop đến R&B trưởng thành, anh gặt hái thành công lớn qua các ca khúc "Stay", "Peaches" và "Sorry".', 'http://localhost:5000/uploads/img/justin_bieber.png', 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] group-hover:border-blue-500/30', 'Stay');

-- ── Seed: Banner Slides ────────────────────────────────────────
INSERT IGNORE INTO banner_slides (id, image_url) VALUES
(1, 'http://localhost:5000/uploads/img/banner_slide_1.png'),
(2, 'http://localhost:5000/uploads/img/banner_slide_2.png'),
(3, 'http://localhost:5000/uploads/img/banner_slide_3.png'),
(4, 'http://localhost:5000/uploads/img/banner_slide_4.png'),
(5, 'http://localhost:5000/uploads/img/banner_slide_5.png');

-- ── Seed: Settings ─────────────────────────────────────────────
INSERT IGNORE INTO settings (`key`, `value`) VALUES
('background_image_url', 'http://localhost:5000/uploads/img/the_weeknd.png');

-- ── Seed: Sample Tracks ─────────────────────────────────────────
INSERT IGNORE INTO tracks (id, title, artist, album, duration, cover_url, audio_url, genre, category_id, play_count) VALUES
(1, 'Lost in the City',  'Lofi Chill',     'Urban Escapes',  372, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'Lofi', 1, 120),
(2, 'Summer Breeze',     'Synthwave Rider', 'Neon Highways',  423, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'Synthwave', 2, 85),
(3, 'Midnight Drive',    'Retro Synth',     'Outrun Nights',  302, 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'Synthwave', 2, 70),
(4, 'Ocean Waves',       'Ambient Chill',   'Silent Tides',   276, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'Ambient', 3, 50),
(5, 'Morning Coffee',    'Jazz Hop Trio',   'Café Tunes',     241, 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=500', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'Jazz', 4, 30);

-- ── Seed: Playlists ─────────────────────────────────────────────
INSERT IGNORE INTO playlists (id, name, description) VALUES
(1, 'My Favorites',      'My daily dose of good music'),
(2, 'Chill study vibes', 'Lofi and ambient tracks to focus');

-- ── Seed: Playlist Tracks ───────────────────────────────────────
INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES
(1, 1, 1),
(1, 3, 2),
(2, 4, 1),
(2, 5, 2);
