const { Pool } = require("pg")

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("FALHA: defina DATABASE_URL no ambiente antes de rodar este script.")
  console.error("Ex: DATABASE_URL=postgresql://user:pass@host:5432/dbname node scripts/init-db.js")
  process.exit(1)
}

const sql = `
CREATE TABLE IF NOT EXISTS atas (
  id serial PRIMARY KEY,
  numero text NOT NULL,
  descricao text,
  modelo text NOT NULL DEFAULT 'novo',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS itens (
  id serial PRIMARY KEY,
  ata_id integer NOT NULL REFERENCES atas(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  descricao text NOT NULL,
  valor_unitario text,
  marca text,
  unidade text,
  quantidade text,
  created_at timestamp NOT NULL DEFAULT now()
);
`

async function main() {
  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    console.log("Conectando ao banco...")
    await client.query(sql)
    console.log("Tabelas criadas/atualizadas com sucesso.")
  } catch (error) {
    console.error("Erro ao inicializar o banco:", error)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
