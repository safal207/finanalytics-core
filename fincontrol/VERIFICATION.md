# FinControl SEC-001 — verification and publication boundary

Date: 22 September 2026.

## Fresh local publication preflight

The two unchanged Node test files were executed again before publication:

```sh
node --test tests/model.test.cjs tests/security.test.cjs
```

Actual result: **73 tests, 73 pass, 0 fail, 0 skipped**. Node v22.16.0; Python 3.13.5. This comprises 31 fixture-model tests and 42 cryptography/container/workspace tests. It does not execute the private FIN-001 engine.

Verified: the supplied standalone HTML equals the archive's `index.html` byte-for-byte. Source and fixture files uploaded to GitHub were compared with the local package using Git blob hashes. A bounded high-confidence secret-pattern preflight found no private-key headers, service-token patterns or JWTs in the reviewed text package; this is not a comprehensive secret or security audit. Included passwords and sentinel strings in the unit tests are public synthetic test inputs, not credentials.

## What the Node tests cover

Exact fixture amounts and counts; duplicate identity conflicts; transfers, repayments and refunds; pending exclusion; account and period scope; missing subperiod balances; chart-total reconciliation; CSV filtering; encrypted workspace round trip; independent classic-crypto interoperability; fresh random parameters; wrong password and tampering; strict file/KDF/algorithm/size bounds; Unicode semantics; supported-workspace validation; nonextractable keys; refusal without secure Web Crypto.

## Historical UI checks — not rerun for publication

The prior development package reported:

| Check | Result | Actual boundary |
|---|---:|---|
| Existing interface regression | 23/23 PASS | Chromium rendering via set_content |
| Save/restore interface scenarios | 31/31 PASS | Explicit Node Web Crypto test bridge, not native browser crypto |
| Static build checks | 7/7 PASS | Bounded additional checks, not an audit |

In that environment Chromium 144.0.7559.96 blocked file, loopback and HTTPS navigation. Its about:blank page had no native secure Web Crypto. The UI test bridge used real Node crypto operations through the automation channel; it was never part of the application. The earlier tests observed no application network requests or writes to the instrumented browser storage APIs. These historical results do not establish the behavior of a future hosted deployment.

The bridge, historical screenshots and full browser harness remain in the original development archive rather than this minimal public source publication. They are not executable dependencies of this project. They are not counted as fresh GitHub CI results.

## Native browser gate

**NOT VERIFIED:** complete save/restore with native browser Web Crypto on a trusted origin. See [NATIVE-SMOKE-CHECKLIST.md](NATIVE-SMOKE-CHECKLIST.md). A physical phone, cross-browser certification and independent security audit are not established.

No plaintext fallback is allowed when Web Crypto is unavailable. Synthetic data only. No real statements, bank requests, payments, cloud synchronization, recovery service or original financial engine are included.

## Build identity

Expected SHA-256 of the unchanged generated `index.html`:

```text
3a1ef74abde7df9ac1384ecec4c3ea619b6ce60fded2c78052281e4c1f45cb25
```

The publication workflow runs Node tests and reproduces this digest before adding only the generated HTML to `feat/fincontrol-sec001`. A workflow file's presence is not evidence that it ran: inspect the actual Actions run and its triggering SHA. That workflow does not validate native browser crypto and does not deploy GitHub Pages.

## Repository boundary

The public copy is under `fincontrol/` on a feature branch. This publication does not merge a PR, change the private Financial OS repository, or validate its open PR. Any later application/fixture/security change requires a new verification cycle; the digest above applies only to this exact build.
