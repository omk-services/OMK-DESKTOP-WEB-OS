export const RETENTION_COHORT_STATES = [
  'offer_viewed',
  'demo_booked',
  'followup_completed',
  'renewed',
  'churn_risk',
] as const

export type RetentionCohortState = (typeof RETENTION_COHORT_STATES)[number]

export interface SyntheticRetentionEvent {
  readonly cohortId: `syn_${string}`
  readonly state: RetentionCohortState
  readonly period: `${number}-W${number}`
  readonly memberCount: number
  readonly market: 'US'
}

export interface RetentionCohortSnapshot {
  readonly cohortId: `syn_${string}`
  readonly state: RetentionCohortState
  readonly period: `${number}-W${number}`
  readonly memberCount: number
  readonly market: 'US'
}

export type RetentionRouting =
  | {
      readonly owner: 'growth'
      readonly reason: 'synthetic_cohort_analysis'
    }
  | {
      readonly owner: 'legal'
      readonly reason:
        | 'direct_pii_detected'
        | 'privacy_rights_request'
        | 'regulated_data_question'
        | 'non_us_jurisdiction'
    }

const DIRECT_PII_FIELDS = new Set([
  'address',
  'email',
  'firstName',
  'fullName',
  'ipAddress',
  'lastName',
  'name',
  'phone',
  'postalAddress',
  'socialSecurityNumber',
  'ssn',
])

const LEGAL_SIGNAL_FIELDS = new Set([
  'ccpaRequest',
  'consentDispute',
  'privacyRequest',
  'regulatedDataQuestion',
])

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasFieldDeep(value: unknown, fields: ReadonlySet<string>): boolean {
  if (Array.isArray(value)) return value.some((item) => hasFieldDeep(item, fields))
  if (!isRecord(value)) return false

  return Object.entries(value).some(
    ([key, nestedValue]) => fields.has(key) || hasFieldDeep(nestedValue, fields),
  )
}

export function hasDirectPiiFields(value: unknown): boolean {
  return hasFieldDeep(value, DIRECT_PII_FIELDS)
}

export function isRetentionCohortState(value: unknown): value is RetentionCohortState {
  return (
    typeof value === 'string' &&
    (RETENTION_COHORT_STATES as readonly string[]).includes(value)
  )
}

export function validateSyntheticRetentionEvent(
  value: unknown,
): value is SyntheticRetentionEvent {
  if (!isRecord(value) || hasDirectPiiFields(value)) return false

  return (
    typeof value.cohortId === 'string' &&
    /^syn_[a-z0-9_-]+$/.test(value.cohortId) &&
    isRetentionCohortState(value.state) &&
    typeof value.period === 'string' &&
    /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(value.period) &&
    Number.isInteger(value.memberCount) &&
    Number(value.memberCount) >= 0 &&
    value.market === 'US'
  )
}

export function buildRetentionCohorts(
  events: readonly SyntheticRetentionEvent[],
): readonly RetentionCohortSnapshot[] {
  const totals = new Map<string, RetentionCohortSnapshot>()

  for (const event of events) {
    if (!validateSyntheticRetentionEvent(event)) {
      throw new Error('Invalid synthetic retention event')
    }

    const key = `${event.period}|${event.cohortId}|${event.state}`
    const current = totals.get(key)
    totals.set(key, {
      cohortId: event.cohortId,
      state: event.state,
      period: event.period,
      memberCount: (current?.memberCount ?? 0) + event.memberCount,
      market: 'US',
    })
  }

  return [...totals.values()].sort((left, right) => {
    const leftKey = `${left.period}|${left.cohortId}|${left.state}`
    const rightKey = `${right.period}|${right.cohortId}|${right.state}`
    return leftKey.localeCompare(rightKey)
  })
}

export function routeRetentionInput(value: unknown): RetentionRouting {
  if (hasDirectPiiFields(value)) {
    return { owner: 'legal', reason: 'direct_pii_detected' }
  }

  if (hasFieldDeep(value, LEGAL_SIGNAL_FIELDS)) {
    return { owner: 'legal', reason: 'privacy_rights_request' }
  }

  if (isRecord(value) && value.market !== undefined && value.market !== 'US') {
    return { owner: 'legal', reason: 'non_us_jurisdiction' }
  }

  if (isRecord(value) && value.dataClass === 'regulated') {
    return { owner: 'legal', reason: 'regulated_data_question' }
  }

  return { owner: 'growth', reason: 'synthetic_cohort_analysis' }
}
