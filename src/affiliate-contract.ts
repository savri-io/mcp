import { z } from 'zod';

export const affiliateReportTool = {
  name: 'savri_get_affiliate_report', title: 'Get Affiliate Commission and Click Evidence',
  description: 'Read imported Adtraction commission for one authorized site, by order date in UTC. Original currencies remain separate. '
    + 'Use matchClass (exact, assessed, unknown), not the legacy matchOutcome, when describing matching. '
    + 'Exact requires a unique returned click reference with surviving evidence; certain/probable are assessed. '
    + 'Matching coverage is not precision. An exact click never proves a complete visit, search query or paid traffic source. '
    + 'Default period is 30 completed UTC days with the previous equal period. basis selects order_date or click_cohort. '
    + 'Use displayTotals, commissionDisplay and cohort.epc[].display verbatim for rounded values; fractional minor units and source decimals are exact. '
    + 'EPC uses approved/pending exact commissions observed at complete import and ALL registered affiliate outclicks in the selected site as denominator, independent of currency/status/match filters. '
    + 'Show its matching share, collection coverage, import checkpoints and dates beside every EPC. Unknown collection coverage is not complete collection. '
    + 'changes are observed at import, not invented historical source transitions. No imports, network connections, or conversions are triggered.',
  schema: z.object({ site_id: z.string().min(1).max(128), from: z.string().optional(), through: z.string().optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(), basis:z.enum(['order_date','click_cohort']).optional(),
    status:z.enum(['approved','pending','rejected','open_claim','unknown']).optional(),currency:z.string().regex(/^[A-Z]{3}$/).optional(),
    match:z.enum(['exact','assessed','unknown']).optional() }).strict(),
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};
