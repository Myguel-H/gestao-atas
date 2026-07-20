const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, 'utf8');
  text.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k) process.env[k] = v;
    }
  });
}
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    const res = await pool.query('select id, numero, descricao, modelo from atas order by id desc limit 10');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err.message || err);
  } finally {
    await pool.end();
  }
})();
