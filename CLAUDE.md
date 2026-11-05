# Savri MCP, publik distribution

Källkod och produktutveckling bor i `../analytics-value/packages/mcp`.
Detta repo är distributionsytan för `@savri/mcp` och GitHub-ärenden.
Arbeta på main med selektiv staging. Gör verktygsändringar i källrepot,
synka därefter uttryckligen beställda paketfiler hit.

## Current status 2026-11-05

npm **0.6.1 latest** is published as Value Unlimited. Source **15f1131**
was published through publicera.mjs. The registry archive exactly matches the
reviewed tarball (SHA-1 24312d41b77a4ccdc00b4096ede215691d5af5d5).
A fresh registry install reports 0.6.1 and 36 tools, and passes authorized
production site-list and setup-status reads without business writes.
Remote 1.3.1 is READY on both domains; actual Claude.ai and ChatGPT candidate
journeys passed. The separate Ads release is excluded. No remaining action.

Session reports belong in [docs/DRIFT.md](docs/DRIFT.md), newest first.
