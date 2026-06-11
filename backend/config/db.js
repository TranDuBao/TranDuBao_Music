const path = require('path');
const fs = require('fs');

const dbType = process.env.DB_TYPE || 'sqlite';

let query;
let dbInstance = null;

if (dbType === 'mysql') {
  const mysql = require('mysql2/promise');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'music_stream_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  query = async (sql, params = []) => {
    try {
      const [results] = await pool.execute(sql, params);
      if (Array.isArray(results)) {
        return results;
      }
      return { insertId: results.insertId, affectedRows: results.affectedRows };
    } catch (error) {
      console.error('MySQL Query Error:', error);
      throw error;
    }
  };
  
  dbInstance = pool;
  console.log('Using MySQL Database Connection.');
} else {
  // SQLite implementation
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, '../../database/db.sqlite');
  
  // Ensure the database folder exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite connection error:', err.message);
    } else {
      console.log('Connected to SQLite Database at:', dbPath);
    }
  });

  query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Determine query type (SELECT vs Mutation)
      const cleanSql = sql.trim().toUpperCase();
      const isSelect = cleanSql.startsWith('SELECT');

      if (isSelect) {
        db.all(sql, params, (err, rows) => {
          if (err) {
            console.error('SQLite SELECT Error:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      } else {
        db.run(sql, params, function (err) {
          if (err) {
            console.error('SQLite Mutation Error:', err);
            reject(err);
          } else {
            resolve({ insertId: this.lastID, affectedRows: this.changes });
          }
        });
      }
    });
  };

  dbInstance = db;
  console.log('Using SQLite Database Connection.');
}

module.exports = {
  query,
  dbInstance,
  dbType
};
