const { query, dbType } = require('../config/db');
const PlayHistory = require('../models/PlayHistory');
const Rating = require('../models/Rating');
const Favorite = require('../models/Favorite');

const getStats = async (req, res) => {
  try {
    const [userStats]  = await query("SELECT COUNT(*) as total FROM users");
    const [trackStats] = await query("SELECT COUNT(*) as total, COALESCE(SUM(play_count),0) as plays FROM tracks");
    const [favStats]   = await query("SELECT COUNT(*) as total FROM favorites");
    const [ratingStats]= await query("SELECT COUNT(*) as total, AVG(rating) as avg FROM ratings");

    const topTracks = await query(`
      SELECT id, title, artist, cover_url, play_count, genre
      FROM tracks ORDER BY play_count DESC LIMIT 10`);

    const topRated = await Rating.getTopRated();
    const dailyPlays = await PlayHistory.getDailyStats(7);
    const recentActivity = await PlayHistory.getRecentGlobal(15);

    // Compatible with both MySQL and SQLite — no UNION ALL with NULL int issues
    // Tracks with a category
    const withCat = await query(`
      SELECT 
        c.id as categoryId,
        c.name as genre,
        c.color,
        COUNT(t.id) as count,
        COALESCE(SUM(t.play_count), 0) as plays
      FROM categories c
      LEFT JOIN tracks t ON t.category_id = c.id
      GROUP BY c.id, c.name, c.color
      ORDER BY plays DESC`);

    // Tracks without a category
    const [noCat] = await query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(play_count), 0) as plays
      FROM tracks
      WHERE category_id IS NULL`);

    const genreStats = [...withCat];
    if (noCat && Number(noCat.count) > 0) {
      genreStats.push({
        categoryId: null,
        genre: 'Chưa phân loại',
        color: '#71717a',
        count: noCat.count,
        plays: noCat.plays
      });
    }
    genreStats.sort((a, b) => Number(b.plays) - Number(a.plays));

    const favoriteStats = await Favorite.getStats();

    res.json({
      success: true,
      data: {
        totalUsers:    userStats.total,
        totalTracks:   trackStats.total,
        totalPlays:    trackStats.plays || 0,
        totalFavorites:favStats.total,
        totalRatings:  ratingStats.total,
        avgRating:     Math.round((ratingStats.avg || 0) * 10) / 10,
        topTracks,
        topRated,
        dailyPlays,
        recentActivity,
        genreStats,
        favoriteStats,
      }
    });
  } catch (e) {
    console.error('[Stats] ERROR:', e.message, '\nStack:', e.stack);
    res.status(500).json({ success: false, message: e.message });
  }
};

const getPlayHistoryStats = async (req, res) => {

  try {
    const { view = 'day', date, startDate, endDate } = req.query;

    const playedAtVn = dbType === 'mysql'
      ? "DATE_ADD(played_at, INTERVAL 7 HOUR)"
      : "datetime(played_at, '+7 hours')";

    const phPlayedAtVn = dbType === 'mysql'
      ? "DATE_ADD(ph.played_at, INTERVAL 7 HOUR)"
      : "datetime(ph.played_at, '+7 hours')";

    if (date) {
      // Clean date string to avoid timezone parsing issues in SQL
      const cleanDate = date.includes('T') ? date.split('T')[0] : (date.includes(' ') ? date.split(' ')[0] : date);

      let whereClause = `DATE(${playedAtVn}) = DATE(?)`;
      let hourlySelect = dbType === 'mysql'
        ? `DATE_FORMAT(${playedAtVn}, '%H')`
        : `strftime('%H', ${playedAtVn})`;
      let hourlyLabel = "hour";

      if (cleanDate.length === 7) {
        // Year-Month (e.g. 2026-06)
        whereClause = dbType === 'mysql' 
          ? `DATE_FORMAT(${playedAtVn}, '%Y-%m') = ?` 
          : `strftime('%Y-%m', ${playedAtVn}) = ?`;
        hourlySelect = dbType === 'mysql'
          ? `DATE_FORMAT(${playedAtVn}, '%Y-%m-%d')`
          : `strftime('%Y-%m-%d', ${playedAtVn})`;
        hourlyLabel = "day";
      } else if (cleanDate.length === 4) {
        // Year (e.g. 2026)
        whereClause = dbType === 'mysql' 
          ? `DATE_FORMAT(${playedAtVn}, '%Y') = ?` 
          : `strftime('%Y', ${playedAtVn}) = ?`;
        hourlySelect = dbType === 'mysql'
          ? `DATE_FORMAT(${playedAtVn}, '%Y-%m')`
          : `strftime('%Y-%m', ${playedAtVn})`;
        hourlyLabel = "month";
      }

      // 1. Detailed statistics for a specific selected date/month/year
      const [totalCount] = await query(`
        SELECT COUNT(*) as count 
        FROM play_history 
        WHERE ${whereClause}`, [cleanDate]);

      // Distribution stats (hourly, daily, or monthly depending on period)
      const distributionStats = await query(`
        SELECT ${hourlySelect} as period, COUNT(*) as count
        FROM play_history
        WHERE ${whereClause}
        GROUP BY period
        ORDER BY period ASC`, [cleanDate]);

      // Top tracks for that period
      const topTracks = await query(`
        SELECT t.id, t.title, t.artist, t.cover_url, COUNT(*) as plays
        FROM play_history ph
        JOIN tracks t ON ph.track_id = t.id
        WHERE ${whereClause.replace(/played_at/g, 'ph.played_at')}
        GROUP BY t.id, t.title, t.artist, t.cover_url
        ORDER BY plays DESC
        LIMIT 10`, [cleanDate]);

      // Activity list on that period
      const playsList = await query(`
        SELECT ${phPlayedAtVn} as played_at, t.title, t.artist, u.name as user_name
        FROM play_history ph
        JOIN tracks t ON ph.track_id = t.id
        LEFT JOIN users u ON ph.user_id = u.id
        WHERE ${whereClause.replace(/played_at/g, 'ph.played_at')}
        ORDER BY ph.played_at DESC
        LIMIT 100`, [cleanDate]);

      return res.json({
        success: true,
        data: {
          mode: 'specific_date',
          date: cleanDate,
          totalPlays: totalCount.count,
          distributionStats,
          distributionLabel: hourlyLabel,
          topTracks,
          playsList
        }
      });
    }

    // 2. Aggregated statistics (Day / Month / Year)
    let selectExpr = `DATE(${playedAtVn})`;
    let dateFilter = "";
    const params = [];

    if (startDate && endDate) {
      dateFilter = `WHERE DATE(${playedAtVn}) BETWEEN DATE(?) AND DATE(?)`;
      params.push(startDate, endDate);
    }

    if (view === 'month') {
      selectExpr = dbType === 'mysql' ? `DATE_FORMAT(${playedAtVn}, '%Y-%m')` : `strftime('%Y-%m', ${playedAtVn})`;
    } else if (view === 'year') {
      selectExpr = dbType === 'mysql' ? `DATE_FORMAT(${playedAtVn}, '%Y')` : `strftime('%Y', ${playedAtVn})`;
    }

    const aggregated = await query(`
      SELECT ${selectExpr} as label, COUNT(*) as count
      FROM play_history
      ${dateFilter}
      GROUP BY label
      ORDER BY label ASC`, params);

    res.json({
      success: true,
      data: {
        mode: 'aggregated',
        view,
        aggregated
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getCategoryTracksStats = async (req, res) => {
  try {
    const { categoryId } = req.query; // 'null' or ID number
    let sql;
    let params = [];
    if (categoryId === 'null' || !categoryId) {
      sql = `
        SELECT id, title, artist, cover_url, play_count as plays
        FROM tracks
        WHERE category_id IS NULL
        ORDER BY play_count DESC
      `;
    } else {
      sql = `
        SELECT id, title, artist, cover_url, play_count as plays
        FROM tracks
        WHERE category_id = ?
        ORDER BY play_count DESC
      `;
      params = [categoryId];
    }
    const tracks = await query(sql, params);
    res.json({ success: true, data: tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logVisit = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    await query("INSERT INTO visits (ip, user_agent) VALUES (?, ?)", [ip, userAgent]);
    res.json({ success: true, message: 'Visit logged successfully' });
  } catch (error) {
    console.error('[logVisit] ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVisitsStats = async (req, res) => {
  try {
    const { view = 'day', startDate, endDate } = req.query;
    const visitedAtVn = dbType === 'mysql'
      ? "DATE_ADD(visited_at, INTERVAL 7 HOUR)"
      : "datetime(visited_at, '+7 hours')";
    let selectExpr = dbType === 'mysql' ? `DATE(${visitedAtVn})` : `date(${visitedAtVn})`;
    let dateFilter = "";
    const params = [];

    if (startDate && endDate) {
      dateFilter = `WHERE DATE(${visitedAtVn}) BETWEEN DATE(?) AND DATE(?)`;
      params.push(startDate, endDate);
    }

    if (view === 'month') {
      selectExpr = dbType === 'mysql' ? `DATE_FORMAT(${visitedAtVn}, '%Y-%m')` : `strftime('%Y-%m', ${visitedAtVn})`;
    }

    const rows = await query(`
      SELECT ${selectExpr} as label, COUNT(DISTINCT ip) as unique_visitors, COUNT(*) as total_visits
      FROM visits
      ${dateFilter}
      GROUP BY label
      ORDER BY label ASC
    `, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getVisitsStats] ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getPlayHistoryStats, getCategoryTracksStats, logVisit, getVisitsStats };
