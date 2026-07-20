from pathlib import Path
import re

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

output = Path('scripts/insert_itens_02_2026.sql')
with output.open('w', encoding='utf-8') as f:
    f.write("INSERT INTO atas (numero, descricao, modelo) SELECT '02/2026', 'Ata 02/2026', 'novo' WHERE NOT EXISTS (SELECT 1 FROM atas WHERE numero = '02/2026');\n")
    f.write("\n")
    for r in rows:
        def esc(s):
            return s.replace("'", "''")
        f.write(
            "INSERT INTO itens (ata_id, codigo, descricao, valor_unitario, marca, unidade) VALUES ((SELECT id FROM atas WHERE numero='02/2026'), '{}' ,'{}','{}','{}','{}');\n".format(
                esc(r['codigo']), esc(r['descricao']), esc(r['valor_unitario']), esc(r['marca']), esc(r['unidade'])
            )
        )
print(f'wrote {len(rows)} insert statements to {output}')
