import { z } from 'zod';

export const trafficInput = z.object({
  site_id: z.string().min(1).max(128).describe('Site ID from savri_list_sites'),
  period: z.enum(['7d', '30d', '90d']).optional().describe('Completed UTC days (default: 30d)'),
  compare: z.boolean().optional().describe('Compare with the equal-length previous period'),
  completed_days: z.boolean().optional().describe('Return structured completed-day data with exact counts and coverage; requires server 1.3.0 or newer'),
}).strict();

export const trafficDescription = 'Read Savri daily visitor aggregates for one authorized site. '
  + 'Use completed_days=true for full UTC days and equal previous dates: explicit coverage, exact counts and null for unavailable comparisons or a zero baseline. '
  + 'Visitors are summed daily visits, not distinct people across the period. Completed empty aggregations are measured zero; unprocessed dates are unknown. '
  + 'Use compare=true for comparison; keep traffic quality warnings. Server 1.3.0 also uses completed UTC days for legacy 7d/30d/90d stats calls while retaining the old response format. '
  + 'Older servers can include today: always use the dates and coverage actually returned. Page/source reports and Google/Bing have separate dates and populations.';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
const window = z.object({
  period: z.object({ from: date, through: date, timezone: z.literal('UTC'), includes_today: z.literal(false) }).passthrough(),
  coverage: z.object({ state: z.enum(['complete', 'partial', 'unavailable', 'invalid']), expected_days: z.number().int().positive(),
    observed_days: z.number().int().nonnegative(), missing_days_are_zero: z.literal(false) }).passthrough(),
  visits: z.number().nullable(), pageviews: z.number().nullable(), sessions: z.number().nullable(),
}).passthrough();
const completedResponse = z.object({ schema_version: z.literal(1), site_id: z.string(), source: z.literal('daily_stats.completed_days'),
  retrieved_at: z.string().datetime(), visits_are_daily_sessions_not_unique_people: z.literal(true), live_traffic_included: z.literal(false),
  current: window, previous: window.nullable(), comparison: z.object({ state: z.enum(['comparable', 'unavailable']) }).passthrough().nullable(),
}).passthrough();

/** An old server may silently ignore completed_days; never relabel its result. */
export function supportsCompletedTraffic(value: unknown, siteId: string, period = '30d', compare = false) {
  const parsed = completedResponse.safeParse(value);
  if (!parsed.success) return false;
  const data = parsed.data, days = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[period];
  const validWindow = (w: z.infer<typeof window>) => w.coverage.expected_days === days
    && (Date.parse(w.period.through) - Date.parse(w.period.from)) / 86400000 + 1 === days
    && w.period.through < data.retrieved_at.slice(0, 10);
  return data.site_id === siteId && validWindow(data.current) && (compare
    ? !!data.previous && !!data.comparison && validWindow(data.previous)
      && Date.parse(data.current.period.from) - Date.parse(data.previous.period.through) === 86400000
    : data.previous === null && data.comparison === null);
}
