from pathlib import Path
import re
from collections import Counter

path = Path('scripts/insert_itens_02_2026.sql')
text = path.read_text(encoding='utf-8')
lines = [l for l in text.splitlines() if l.startswith('INSERT INTO itens')]
print('insert lines:', len(lines))
rows = []
pattern = re.compile(r"INSERT INTO itens \(ata_id, codigo, descricao, valor_unitario, marca, unidade\) VALUES \(\(SELECT id FROM atas WHERE numero='02/2026'\), '(.+?)','(.+?)','(.+?)','(.+?)','(.+?)'\);$")
for l in lines:
    m = pattern.match(l)
    if not m:
        print('parse fail:', l[:120])
        continue
    rows.append(m.groups())
print('parsed rows:', len(rows))
code_counts = Counter(r[0] for r in rows)
dup_codes = [(code, count) for code, count in code_counts.items() if count > 1]
print('duplicate codes count:', len(dup_codes))
if dup_codes:
    print('first duplicate codes:', dup_codes[:20])
row_counts = Counter(rows)
dup_rows = [(row, count) for row, count in row_counts.items() if count > 1]
print('duplicate exact rows count:', len(dup_rows))
if dup_rows:
    print('first duplicate exact rows:')
    for row, count in dup_rows[:10]:
        print(count, row[0], row[1][:80])
