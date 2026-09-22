# FinControl · SEC-001

**Financial dashboard with traceable metrics and local encrypted save/restore.**

**Финансовый дашборд: понятные показатели, детализация до операций и зашифрованное сохранение.**

Portfolio prototype. Synthetic data only. No bank connection, cloud sync or production-security claim.

## What you can explore

- Financial overview, account/period filters, transaction search and CSV export.
- Drill down from a metric to its supporting transactions.
- Reconciliation of duplicate observations, own-account transfers, card repayments, refunds and pending transactions.
- RU/EN interface and responsive layout.
- SEC-001: password-protected `.fcvault` files containing the complete demo workspace and view settings.
- Authenticated restore before state replacement; wrong passwords and tampered files are rejected.
- Explicit confirmation before exporting an unencrypted CSV.

The fixture illustrates 52,500 RUB of raw posted debit rows becoming 16,000 RUB of net spending after duplicate/internal-movement exclusion and linked refunds. This is a synthetic accounting example, not money saved for a real client.

## Run locally

From the repository root:

```sh
cd fincontrol
python build.py
node --test tests/model.test.cjs tests/security.test.cjs
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/index.html`. Python and Node are needed for building/testing; the generated HTML itself has no third-party runtime dependencies. The local server serves the demo files only. Do not place real financial documents in that directory.

The generated self-contained `index.html` can also be opened as a trusted local file when the browser supports Web Crypto there. If Web Crypto is unavailable, encryption is disabled explicitly; there is no plaintext fallback.

## Demonstrate encrypted save/restore

1. Choose **Защита / Security → Сохранить с паролем / Save with password**.
2. Use a new test-only passphrase or the built-in random generator and store it separately.
3. Save `.fcvault`, change the view, then restore the file with the correct password.
4. Repeat with a wrong password: the existing workspace must remain unchanged.
5. CSV export is a separate, unencrypted action requiring confirmation.

## Cryptography and its boundary

Web Crypto AES-256-GCM with a 128-bit tag; PBKDF2-HMAC-SHA-256 with 600,000 iterations; fresh 16-byte salt and 12-byte IV for each save. Strict versioned container, authenticated header, bounded input sizes and nonextractable derived keys.

This protects a saved `.fcvault` in the documented threat model. It does **not** encrypt the public synthetic fixture inside this demonstration, protect a compromised device, guarantee JavaScript memory erasure, restore lost passwords or implement end-to-end cloud synchronization.

Read [SECURITY.md](SECURITY.md) before making security claims.

## Verification status

A fresh local publication preflight on 22 September 2026 passed **73/73 Node tests**: 31 financial-model tests and 42 encryption/workspace tests. The supplied application build was not changed.

The earlier browser checks used a clearly disclosed Node Web Crypto test bridge. **A complete native-browser save/restore run on a trusted origin remains unverified.** Those checks are not an independent security audit and do not establish production readiness. See [VERIFICATION.md](VERIFICATION.md) and [NATIVE-SMOKE-CHECKLIST.md](NATIVE-SMOKE-CHECKLIST.md).

Expected SHA-256 of the unchanged generated `index.html`:

```text
3a1ef74abde7df9ac1384ecec4c3ea619b6ce60fded2c78052281e4c1f45cb25
```

## Publication scope

This folder is a separate public portfolio copy on `feat/fincontrol-sec001`. The existing `finanalytics-core` main branch and the private Financial OS repository/PR are not modified by this publication. The fixture is synthetic; the private FIN-001 engine is not included or executed. Source provenance inside the application identifies the original synthetic fixture revision, not an available public backend.

GitHub repository publication is separate from hosting a live website. No GitHub Pages deployment is claimed by this README.
