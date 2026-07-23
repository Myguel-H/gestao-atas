const { Pool } = require('pg');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const parsed = envFile.split(/\r?\n/).reduce((acc, line) => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) acc[match[1].trim()] = match[2].trim()
  return acc
}, {})
const pool = new Pool({ connectionString: parsed.DATABASE_URL });
(async () => {
  try {
    const res = await pool.query('SELECT id, ata_id, codigo, descricao FROM itens WHERE id = $1 LIMIT 1', [4559]);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
