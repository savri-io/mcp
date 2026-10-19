import { z } from 'zod';

const id = z.string().min(1).max(128);
export const alertConfig = z.object({
  kind: z.enum(['silence', 'decline']),
  metric: z.enum(['collection', 'import', 'visits', 'recorded_commission']),
  days: z.number().int().min(1).max(28).default(7),
  threshold_percent: z.number().int().min(1).max(100).default(30),
  minimum_baseline: z.number().int().min(1).max(1000000).default(100),
  silence_hours: z.number().int().min(48).max(720).default(48),
  cooldown_hours: z.number().int().min(24).max(720).default(168),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable().default(null),
}).strict().superRefine((c, ctx) => {
  if ((c.kind === 'silence') !== ['collection', 'import'].includes(c.metric)) ctx.addIssue({ code: 'custom', message: 'invalid_metric' });
  if ((c.metric === 'recorded_commission') !== (c.currency !== null)) ctx.addIssue({ code: 'custom', message: 'invalid_currency' });
});
export type AlertConfig = z.infer<typeof alertConfig>;
export const alertReadInput = z.object({ site_id: id }).strict();
export const alertPreviewInput = z.object({ site_id: id, config: alertConfig }).strict();
export const alertSaveInput = z.object({ site_id: id, rule_id: id.optional(), expected_version: z.number().int().positive().optional(),
  config: alertConfig, enabled: z.boolean(), recipient_user_id: id, locale: z.enum(['sv', 'en']),
  confirm_activation: z.literal(true).optional(),
}).strict();
export const alertDisableInput = z.object({ site_id: id, rule_id: id, expected_version: z.number().int().positive() }).strict();
export const alertErrorCodes = ['invalid_request', 'unauthenticated', 'scope_required', 'access_missing', 'account_locked',
  'account_key_required', 'plan_required', 'activation_unavailable', 'recipient_unverified', 'recipient_must_activate',
  'explicit_consent_required', 'conflict', 'not_found', 'unavailable'] as const;
export const alertErrorKey = (error: unknown) => typeof error === 'string' && (alertErrorCodes as readonly string[]).includes(error) ? error : 'unavailable';
export type AlertReason = 'activity_missing' | 'collection_silent' | 'import_overdue' | 'import_waiting' | 'not_connected'
  | 'source_delayed' | 'incomplete_period' | 'insufficient_baseline' | 'zero_baseline' | 'decline_detected' | 'within_expected'
  | 'unavailable' | 'access_missing' | 'activation_unavailable' | 'plan_required' | 'account_locked' | 'cooldown' | 'disabled' | 'changed' | 'delivery_uncertain' | 'delivery_failed';
export interface AlertEvidence {
  rule: AlertConfig;
  state: 'alert' | 'ok' | 'not_evaluable'; reason: AlertReason; source: string;
  from: string; through: string; previous_from: string; previous_through: string; timezone: 'UTC';
  current: string | null; baseline: string | null; relative_change_percent: string | null;
  baseline_count: number | null; unit: string; last_observed_at: number | null;
  next_action: 'check_tracking' | 'check_connection' | 'review_traffic' | 'review_commission' | 'wait_for_data' | 'review_access';
  collection_coverage: 'unknown'; provider_delay: 'unknown' | 'not_applicable';
}
export const alertTools = [
  { name: 'savri_get_alerts', title: 'Read saved alerts and delivery history', schema: alertReadInput, scope: 'read' as const,
    description: 'Read site-scoped alert status, active consent, next evaluation and delivery history. Provider acceptance is not inbox delivery. No polling. While billing is locked, the dashboard remains available for reading and disabling rules; account API reads and remote MCP require unlocked access.' },
  { name: 'savri_preview_alert', title: 'Preview an alert without activating it', schema: alertPreviewInput, scope: 'read' as const,
    description: 'Evaluate an unsaved alert using measured data. No network key or email is submitted. Completed empty visit days are zero; unprocessed days are unknown. Recorded commission is approved plus pending commission by order date in one currency, excluding rejected, unknown and open claims; pending is not confirmed income. Relative percent is distinct from percentage points.' },
  { name: 'savri_save_alert', title: 'Save an alert with explicit recipient consent', schema: alertSaveInput, scope: 'write' as const,
    description: 'Only on an explicit user request. Activation requires confirm_activation=true, current edit access, a verified recipient who is the acting user, and Growth or above on the site payer. Import and commission alerts additionally require existing affiliate access on Business or Enterprise. Ordinary trials do not include alerts. Never infer consent from report emails. Saving a new recipient leaves the rule off until that recipient explicitly activates it.' },
  { name: 'savri_disable_alert', title: 'Turn off an alert', schema: alertDisableInput, scope: 'write' as const,
    description: 'Disable the named rule only on the user request. Cancels queued messages. A message already submitted to the mail provider cannot be recalled. If account billing is locked, use the dashboard to read and disable rules; remote MCP cannot access locked sites.' },
  { name: 'savri_delete_alert', title: 'Delete a disabled alert', schema: alertDisableInput, scope: 'write' as const,
    description: 'Only on an explicit user request, delete a disabled rule and its history. An enabled rule or a message currently being submitted must be stopped first.' },
].map(tool => ({ ...tool, annotations: { readOnlyHint: tool.scope === 'read', destructiveHint: ['savri_disable_alert', 'savri_delete_alert'].includes(tool.name), idempotentHint: tool.scope === 'read', openWorldHint: tool.scope === 'write' } }));
