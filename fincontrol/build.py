"""Build the self-contained SEC-001 demo; no downloads or third-party dependencies."""
import base64
import hashlib
import json
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent
read = lambda p: (root / p).read_text(encoding='utf-8')
sha = lambda p: hashlib.sha256((root / p).read_bytes()).hexdigest()
data = {'manifest': json.loads(read('data/manifest.json')), 'csv': read('data/transactions.csv'),
        'provenance': {'repo': 'safal207/alex-financial-os', 'commit': '8780de339f11ed07f14e246270583c328170f3d2',
                       'csv_sha256': sha('data/transactions.csv'), 'manifest_sha256': sha('data/manifest.json'),
                       'classification': 'SYNTHETIC', 'prototype_adapter': 'fixture-only-v0.1', 'engine_executed': False}}
html = read('src/shell.html')
for marker, value in [('/*STYLE*/', read('src/styles.css')),
                      ('/*DATA*/', json.dumps(data, ensure_ascii=False).replace('</', '<\\/')),
                      ('/*MODEL*/', read('src/model.js')), ('/*VAULT*/', read('src/vault.js')),
                      ('/*WORKSPACE*/', read('src/workspace.js')), ('/*VAULT_UI*/', read('src/vault-ui.js')),
                      ('/*APP*/', read('src/app.js'))]:
    if html.count(marker) != 1:
        raise ValueError(f'Expected exactly one build marker: {marker}')
    html = html.replace(marker, value)
# No 'unsafe-inline' or 'unsafe-eval' for scripts. Inline styles are retained for chart widths.
scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
if len(scripts) != 6:
    raise ValueError('Unexpected inline script count')
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" for s in scripts]
csp = ("default-src 'none'; script-src " + ' '.join(hashes) + "; style-src 'unsafe-inline'; "
       "connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'")
html = html.replace('<!--CSP-->', '<meta http-equiv="Content-Security-Policy" content="' + csp + '">')
(root / 'index.html').write_text(html, encoding='utf-8')
print(root / 'index.html')
