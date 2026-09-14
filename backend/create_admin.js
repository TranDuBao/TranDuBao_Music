/**
 * Script tạo tài khoản admin mặc định
 * Chạy: node create_admin.js
 * Yêu cầu: ADMIN_EMAIL và ADMIN_PASSWORD phải được set trong .env hoặc environment
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../database/db.sqlite');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file không tồn tại:', dbPath);
  process.exit(1);
}

// Read from environment variables - NEVER hardcode account info in source!
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Admin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ADMIN_EMAIL và ADMIN_PASSWORD phải được set trong .env!');
  console.error('   Ví dụ: ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=StrongPass123 node create_admin.js');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

async function createAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  db.get('SELECT id, email, role, provider FROM users WHERE LOWER(email) = LOWER(?)', [ADMIN_EMAIL], (err, row) => {
    if (err) {
      console.error('❌ Lỗi query:', err.message);
      db.close();
      return;
    }

    if (row) {
      console.log('⚠️  User đã tồn tại:', { id: row.id, email: row.email, role: row.role });
      db.run(
        'UPDATE users SET password_hash = ?, role = ?, provider = ? WHERE id = ?',
        [hash, 'admin', 'local', row.id],
        function(err2) {
          if (err2) {
            console.error('❌ Lỗi update:', err2.message);
          } else {
            console.log(`✅ Đã cập nhật admin user ID=${row.id}: email=${ADMIN_EMAIL}, role=admin`);
          }
          db.close();
        }
      );
    } else {
      db.run(
        'INSERT INTO users (name, email, password_hash, role, provider) VALUES (?, ?, ?, ?, ?)',
        [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin', 'local'],
        function(err2) {
          if (err2) {
            console.error('❌ Lỗi tạo admin:', err2.message);
          } else {
            console.log(`✅ Đã tạo admin user ID=${this.lastID}:`);
            console.log(`   Email: ${ADMIN_EMAIL}`);
            console.log(`   Role: admin`);
          }
          db.close();
        }
      );
    }
  });
}

createAdmin().catch(err => {
  console.error('❌ Lỗi:', err);
  db.close();
});
