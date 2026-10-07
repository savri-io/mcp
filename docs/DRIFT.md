# Distribution history

## 2026-10-07, Codex: guided start 0.5.1 published

Published `@savri/mcp` 0.5.0, then the required compatibility patch 0.5.1.
The three guided-start tools read setup status, save an explicitly requested
business profile, and record explicit feedback. Profile replacement/clearing
and feedback replacement now advertise `destructiveHint: true`.

Main and annotated tags were pushed atomically: `v0.5.0` at `c769d4f`,
`v0.5.1` at `c428214`. Existing tags were preserved. npm `latest` is 0.5.1.
Registry tarball SHA256:
`321550f8ef54e8b6d8cecd22a4a8523b134c2bd4cd03bfc57f15e9b209c17b79`.
The four-file tarball and installed bundle match the verified build.

Build and TypeScript passed. An isolated installation of the exact published
version reports 0.5.1 and discovers 30 tools. An authorized setup-status call
returned all nine source sections; an unauthorized site request returned 403.
Only expected API-use/status-check telemetry was written. No business
profiles, goals, funnels, feedback, temporary accounts or keys were created.

**npm delivery complete.** No further npm action is needed. The separate
ChatGPT plugin 1.2.1 is in OpenAI review; catalog publication and installed
client journeys remain separate checks. No recurring task was created.
Historical reports below were moved from CLAUDE.md, which now holds only
instructions and a short current status. Documentation is committed/pushed
separately without moving package tags.

## 2026-09-15, Codex


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
