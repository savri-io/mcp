import { installationSnippetForOrigin } from './installation-snippet';

/** Shared by remote MCP and the separately distributed stdio package. */
export const onboardingPaths = { sites: '/sites', demo: '/demo', guides: '/docs/integration-guides' } as const;
export const onboardingPlatforms = ['wordpress', 'shopify', 'wix', 'squarespace', 'webflow', 'html', 'nextjs', 'react', 'vue', 'astro', 'static-sites', 'vercel'] as const;
export type OnboardingPlatform = typeof onboardingPlatforms[number];

export const listSitesDescription = 'List websites accessible through this connection. Start here when getting started without a known site ID. An empty result includes installation, developer handoff and demo options; it does not prove the account has no other sites. Reuse a URL/platform already supplied. Use include_stats=true only for a requested 30-day visitor/pageview summary.';
export const createSiteDescription = 'Add the user\'s own or a client\'s website when they request it and can install tracking or arrange installation with the responsible person. A URL alone cannot reveal another website\'s traffic. Reuse the supplied URL and platform; ask only for missing installation access. Returns a site ID, snippet and installation/control links, not proof of received data. The domain cannot be changed afterwards. Existing scope and plan limits apply.';
export const onboardingInstructions = 'For getting started without a known site ID, call savri_list_sites. Reuse the supplied URL/platform and ask only what is needed next. Savri measures an own/client website after authorized installation; connecting the account or adding a URL alone does not provide external traffic. Offer installation, a developer handoff, or use the public demo link returned by savri_list_sites. Keep the first reply short and focused on the next action. Use the returned platform snippet and guide instead of inventing an application layout. Never invent a site ID or bypass access/plan limits. After installation, use savri_get_setup_status with the returned ID and view:company once, or on explicit request, not polling. Distinguish connected account, added site, script found and dated received visits. A controlled QA visit is installation evidence, not organic traffic or customer activation. Reply in the user\'s language.';

/** Reuse the web guide's tested framework snippets; retain custom API origins. */
export function siteTrackingSnippet(baseUrl: string, siteId: string, platform: OnboardingPlatform | undefined, fallback: string): string {
  if (platform !== 'astro' && platform !== 'nextjs') return fallback;
  return installationSnippetForOrigin(platform, siteId, baseUrl);
}

export function emptySitesHelp(baseUrl: string, canCreate?: boolean): string {
  const create = canCreate === false
    ? `This connection cannot add sites. Add your site in the website interface: ${baseUrl}${onboardingPaths.sites}, or ask the account administrator for the required access.`
    : `For a requested addition${canCreate === undefined ? ' if this connection permits it' : ''}, use savri_create_site with the supplied domain/platform. Otherwise use ${baseUrl}${onboardingPaths.sites}.`;
  return `No sites are accessible through this connection. The account is connected; measurement has not been established here.\n\n` +
    `Savri measures your own or a client's website after tracking is installed. Entering another site's URL does not reveal its traffic. Reuse any URL/platform already given; ask only whether the user can install tracking or arrange it with the responsible developer, if unclear.\n\n` +
    `${create}\nIf someone else installs it, give them the returned site ID, snippet and relevant guide, then check received data after installation.\nNo site yet, or just exploring? Open the demo: ${baseUrl}${onboardingPaths.demo}. Demo data is not this account's data.`;
}

export function siteInstallationHelp(baseUrl: string, siteId: string, platform?: OnboardingPlatform): string {
  const measurement = `${baseUrl}/sites/${encodeURIComponent(siteId)}/measurement`;
  const guide = `${baseUrl}${onboardingPaths.guides}${platform ? `/${platform}` : ''}`;
  return `Site added; installation and received data are not yet confirmed.\n` +
    `Installation${platform ? ` (${platform})` : ' (choose the existing platform)'}: ${guide}\n` +
    `Install once using that guide, or hand the site ID, snippet and guide to the responsible developer.\n` +
    `After installation, open the site in a browser and check ${measurement}, or call savri_get_setup_status with site_id="${siteId}" and view="company". Check once after the visit; no polling. A found script is not a received visit. Report the returned visit status and time; a controlled QA visit only proves installation, not organic traffic or successful customer activation.`;
}

export function siteMeasurementSummary(baseUrl: string, siteId: string, hasData: boolean, scriptFound: boolean): string {
  if (hasData) return '';
  return `${scriptFound ? 'Script previously found; no visit data recorded.' : 'Site added; script and visit data not confirmed.'} ` +
    `Next: ${baseUrl}/sites/${encodeURIComponent(siteId)}/measurement or savri_get_setup_status with this ID and view:company.`;
}
