from pathlib import Path
import re
from collections import Counter

path = Path('scripts/extracted_ata_items.txt')
text = path.read_text(encoding='utf-8')
entries = re.split(r'\n\s*ITEM:\s*\d+\s*\n', text.strip())
entries = [e.strip() for e in entries if e.strip()]
print('entries:', len(entries))
rows = []
codes = []
for entry in entries:
    data = {}
    for m in re.finditer(r'([A-Z_]+):\s*(.*?)(?=\n[A-Z_]+:|\Z)', entry, re.S):
        data[m.group(1).strip()] = m.group(2).strip().replace('\n', ' ').strip()
    if 'CODIGO' not in data:
        continue
    code = data.get('CODIGO', '')
    material = data.get('MATERIAL', '')
    valor = data.get('VALOR_UNITARIO', '')
    marca = data.get('MARCA', '')
    unidade = data.get('UNIDADE_MEDIDA', '')
    codes.append(code)
    rows.append((code, material, valor, marca, unidade))

code_counts = Counter(codes)
dup_codes = [(code, count) for code, count in code_counts.items() if count > 1]
print('unique codes:', len(code_counts))
print('duplicate codes:', len(dup_codes))
print('sample duplicate codes:', dup_codes[:20])

row_counts = Counter(rows)
dup_rows = [(row, count) for row, count in row_counts.items() if count > 1]
print('duplicate exact rows:', len(dup_rows))
print('sample duplicate rows:')
for row, count in dup_rows[:20]:
    print(count, row[0], row[1][:80])
