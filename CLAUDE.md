# Savri MCP, publik distribution

Källkod och produktutveckling bor i `../analytics-value/packages/mcp`.
Detta repo är distributionsytan för `@savri/mcp` och GitHub-ärenden.
Arbeta på main med selektiv staging. Gör verktygsändringar i källrepot,
synka därefter uttryckligen beställda paketfiler hit.

## Status 2026-09-15, Codex

På Aarons fortsatta Google/Bing-releaseorder ersätts den gamla frysningen
på 0.2.1 med distribution av **0.4.0**. Åtta nya sökläsningar, 27 verktyg.
Fem källfiler selektivt synkade, låsfil uppdaterad. Savri-URL-/manifestmappning
enligt källrepots releaseskript. LICENSE och .gitignore bevarade.

Artefaktbygge, TypeScript, paketinnehåll (fyra filer), låsfil och verklig
stdio-discovery (27 verktyg, 0.4.0) verifierade. Paketets SHA-1:
`09af964ca01bdf9d1897a0940453626cd2756946`.
**Publicerad 15/9:** main och annoterad `v0.4.0` pushade atomärt till
`8f10a857a21d3e82e5c53bf9be563a009b9fdca0`, fjärrtaggens commit återläst.
npm-registrets 0.4.0 och SHA-1 återlästa. Exakt publicerad version installerad
i isolerad tempmapp: bundle-SHA256 matchar det verifierade paketet,
27 verktyg och sajtlista fungerar. Alla åtta riktiga Google/Bing-läsningar
matchar publikt API för samma tillfälliga användare/sajt/urval, förutom
föränderlig cacheålder. Inga äldre app-/kundsviter omkörda.
Produktionsfixtures därefter frånkopplade och raderade med exakt kvitto.
Full kanalstatus och bevisgränser finns i källrepots
`docs/impl/gsc-mcp-bwt-analys-2026-09-15.md`, avsnitt 15.
Todoist: befintlig `6hWHc3Wm3G2FrwqM`, öppen 22 september.
