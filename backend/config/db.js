const path = require('path');
const fs = require('fs');

const dbType = process.env.DB_TYPE || 'sqlite';

let query;
let dbInstance = null;

if (dbType === 'mysql') {
  const mysql = require('mysql2/promise');
  
  const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'music_stream_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Return DATE/DATETIME columns as strings, not JS Date objects.
    // JS Date objects serialize to UTC in JSON, which shifts VN dates back by 7h → wrong day.
    dateStrings: true
  };

  // Enable SSL automatically for remote cloud databases (like TiDB Serverless or Aiven)
  if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
    poolConfig.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    };
  }

  console.log('Using MySQL Database Connection config:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    hasSsl: !!poolConfig.ssl
  });

  const pool = mysql.createPool(poolConfig);

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
