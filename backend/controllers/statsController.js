const { query, dbType } = require('../config/db');
const PlayHistory = require('../models/PlayHistory');
const Rating = require('../models/Rating');
const Favorite = require('../models/Favorite');

const getStats = async (req, res) => {
  try {
    const [userStats]  = await query("SELECT COUNT(*) as total FROM users");
    const [trackStats] = await query("SELECT COUNT(*) as total, SUM(play_count) as plays FROM tracks");
    const [favStats]   = await query("SELECT COUNT(*) as total FROM favorites");
    const [ratingStats]= await query("SELECT COUNT(*) as total, AVG(rating) as avg FROM ratings");

    const topTracks = await query(`
      SELECT id, title, artist, cover_url, play_count, genre
      FROM tracks ORDER BY play_count DESC LIMIT 10`);

    const topRated = await Rating.getTopRated();
    const dailyPlays = await PlayHistory.getDailyStats(7);
    const recentActivity = await PlayHistory.getRecentGlobal(15);

    // Grouping by the actual category names (phân loại nhạc) including all categories and category color
    const genreStats = await query(`
      SELECT 
        c.id as categoryId,
        c.name as genre, 
        c.color,
        COUNT(t.id) as count, 
        COALESCE(SUM(t.play_count), 0) as plays
      FROM categories c
      LEFT JOIN tracks t ON t.category_id = c.id
      GROUP BY c.id, c.name, c.color
      
      UNION ALL
      
      SELECT 
        NULL as categoryId,
        'Chưa phân loại' as genre, 
        '#71717a' as color,
        COUNT(t.id) as count, 
        COALESCE(SUM(t.play_count), 0) as plays
      FROM tracks t
      WHERE t.category_id IS NULL
      
      ORDER BY plays DESC`);

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
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getPlayHistoryStats = async (req, res) => {
  try {
    const { view = 'day', date, startDate, endDate } = req.query;

    if (date) {
      // Clean date string to avoid timezone parsing issues in SQL
      const cleanDate = date.includes('T') ? date.split('T')[0] : (date.includes(' ') ? date.split(' ')[0] : date);

      // 1. Detailed statistics for a specific selected date
      const [totalCount] = await query(`
        SELECT COUNT(*) as count 
        FROM play_history 
        WHERE DATE(played_at) = DATE(?)`, [cleanDate]);

      // Hourly distribution
      const hourlySql = dbType === 'mysql'
        ? `SELECT DATE_FORMAT(played_at, '%H') as hour, COUNT(*) as count
           FROM play_history
           WHERE DATE(played_at) = DATE(?)
           GROUP BY hour
           ORDER BY hour ASC`
        : `SELECT strftime('%H', played_at) as hour, COUNT(*) as count
           FROM play_history
           WHERE DATE(played_at) = DATE(?)
           GROUP BY hour
           ORDER BY hour ASC`;
      const hourlyStats = await query(hourlySql, [cleanDate]);

      // Top tracks for that day
      const topTracks = await query(`
        SELECT t.id, t.title, t.artist, t.cover_url, COUNT(*) as plays
        FROM play_history ph
        JOIN tracks t ON ph.track_id = t.id
        WHERE DATE(ph.played_at) = DATE(?)
        GROUP BY t.id, t.title, t.artist, t.cover_url
        ORDER BY plays DESC
        LIMIT 10`, [cleanDate]);

      // Activity list on that day
      const playsList = await query(`
        SELECT ph.played_at, t.title, t.artist, u.name as user_name
        FROM play_history ph
        JOIN tracks t ON ph.track_id = t.id
        LEFT JOIN users u ON ph.user_id = u.id
        WHERE DATE(ph.played_at) = DATE(?)
        ORDER BY ph.played_at DESC`, [cleanDate]);

      return res.json({
        success: true,
        data: {
          mode: 'specific_date',
          date,
          totalPlays: totalCount.count,
          hourlyStats,
          topTracks,
          playsList
        }
      });
    }

    // 2. Aggregated statistics (Day / Month / Year)
    let selectExpr = "DATE(played_at)";
    let dateFilter = "";
    const params = [];

    if (startDate && endDate) {
      dateFilter = "WHERE DATE(played_at) BETWEEN DATE(?) AND DATE(?)";
      params.push(startDate, endDate);
    }

    if (view === 'month') {
      selectExpr = dbType === 'mysql' ? "DATE_FORMAT(played_at, '%Y-%m')" : "strftime('%Y-%m', played_at)";
    } else if (view === 'year') {
      selectExpr = dbType === 'mysql' ? "DATE_FORMAT(played_at, '%Y')" : "strftime('%Y', played_at)";
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

module.exports = { getStats, getPlayHistoryStats, getCategoryTracksStats };
