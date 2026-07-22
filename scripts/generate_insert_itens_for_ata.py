from pathlib import Path
import re
import sys

if len(sys.argv) > 1:
    ata_num = sys.argv[1]
else:
    ata_num = '10/2026'

source = Path('scripts/extracted_ata_items.txt')
if not source.exists():
    raise FileNotFoundError(source)
text = source.read_text(encoding='utf-8')
entries = re.split(r'\n\s*ITEM:\s*\d+\s*\n', text.strip())
entries = [e.strip() for e in entries if e.strip()]
rows = []
for entry in entries:
    data = {}
    for m in re.finditer(r'([A-Z_]+):\s*(.*?)(?=\n[A-Z_]+:|\Z)', entry, re.S):
        key = m.group(1).strip()
        val = m.group(2).strip().replace('\n', ' ').strip()
        data[key] = val
    if 'CODIGO' not in data or 'MATERIAL' not in data:
        continue
    rows.append({
        'codigo': data['CODIGO'],
        'descricao': data['MATERIAL'],
        'valor_unitario': data.get('VALOR_UNITARIO', ''),
        'marca': data.get('MARCA', ''),
        'unidade': data.get('UNIDADE_MEDIDA', ''),
    })

safe_ata = ata_num.replace('/', '_')
output = Path(f'scripts/insert_ata_{safe_ata}.sql')

def esc(s: str) -> str:
    return s.replace("'", "''")

with output.open('w', encoding='utf-8') as f:
    f.write(f"INSERT INTO atas (numero, descricao, modelo) SELECT '{ata_num}', 'Ata {ata_num}', 'novo' WHERE NOT EXISTS (SELECT 1 FROM atas WHERE numero = '{ata_num}');\n\n")
    for r in rows:
        f.write(
            "INSERT INTO itens (ata_id, codigo, descricao, valor_unitario, marca, unidade) SELECT (SELECT id FROM atas WHERE numero='{}'), '{}' ,'{}','{}','{}','{}' WHERE NOT EXISTS (SELECT 1 FROM itens i JOIN atas a ON i.ata_id = a.id WHERE a.numero = '{}' AND i.codigo = '{}');\n".format(
                esc(ata_num), esc(r['codigo']), esc(r['descricao']), esc(r['valor_unitario']), esc(r['marca']), esc(r['unidade']), esc(ata_num), esc(r['codigo'])
            )
        )
print(f'wrote {len(rows)} insert statements to {output}')
