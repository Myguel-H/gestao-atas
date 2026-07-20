const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const envPath = path.join(process.cwd(), '.env.local');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : process.env.DATABASE_URL;
const DATABASE_URL = env && typeof env === 'string'
  ? env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='))?.split('=')[1] || env
  : null;
if (!DATABASE_URL) {
  console.error('No DATABASE_URL found');
  process.exit(1);
}
const pool = new Pool({ connectionString: DATABASE_URL });
(async () => {
  try {
    const atas = await pool.query('SELECT id, numero, descricao, modelo, created_at FROM atas ORDER BY created_at DESC LIMIT 1');
    if (atas.rows.length === 0) {
      console.log('No atas found');
      return;
    }
    const ata = atas.rows[0];
    const itens = await pool.query(
      'SELECT id, ata_id, codigo, descricao, valor_unitario, marca, unidade, quantidade FROM itens WHERE ata_id=$1 ORDER BY id',
      [ata.id],
    );
    console.log(JSON.stringify({ ata, itens: itens.rows }, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
