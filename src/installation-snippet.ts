export const installationPlatforms = ['auto', 'astro', 'nextjs', 'react', 'vue', 'html'] as const;
export type InstallationPlatform = typeof installationPlatforms[number] | 'vercel';
export const publicSiteId = 'YOUR-SITE-ID';

/** Shared by the web guides and standalone MCP package. */
export function installationSnippetForOrigin(platform: InstallationPlatform, siteId: string, origin: string) {
  const id = /^[a-zA-Z0-9_-]+$/.test(siteId) ? siteId : publicSiteId;
  const url = new URL(origin);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid tracking origin');
  const base = url.origin;
  if (platform === 'nextjs') return `import Script from 'next/script';\n\n// Inside the existing root layout's <body> (App Router),\n// or the existing pages/_app.tsx return (Pages Router):\n<Script id="savri-analytics" src="${base}/script.js"\n  data-site-id="${id}" data-api="${base}" strategy="afterInteractive" />`;
  return `<script${platform === 'astro' ? ' is:inline' : ''} defer\n  data-site-id="${id}" data-api="${base}"\n  src="${base}/script.js"></script>`;
}

export function installationSnippet(platform: InstallationPlatform, siteId: string, domain: string) {
  return installationSnippetForOrigin(platform, siteId, domain === 'savri.io' ? 'https://savri.io' : 'https://besokskollen.se');
}
