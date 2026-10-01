export type ContactConsentStatus = 'double_opt_in' | 'explicit_opt_in' | 'pending_review' | 'unsubscribed' | 'bounced' | 'rejected';

export interface CampaignRecipientCandidate {
  id?: string;
  email?: string;
  name?: string;
  origin?: string;
  consentStatus?: string;
}

export interface CampaignRecipientValidationResult {
  safeToSend: boolean;
  approvedRecipients: CampaignRecipientCandidate[];
  blockedRecipients: CampaignRecipientCandidate[];
  summary: {
    total: number;
    valid: number;
    blocked: number;
    invalidEmails: number;
    pendingReview: number;
    unsubscribed: number;
  };
}

export function normalizeEmail(email?: string): string {
  return (email || '').trim().toLowerCase();
}

export function isValidEmail(email?: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function normalizeConsentStatus(value?: string): ContactConsentStatus {
  const normalized = (value || '').trim().toLowerCase().replace(/\s+/g, '_');

  if (!normalized) return 'pending_review';
  if (normalized.includes('double') || normalized.includes('verified_double')) return 'double_opt_in';
  if (normalized.includes('explicit') || normalized.includes('opt_in') || normalized.includes('confirmed')) return 'explicit_opt_in';
  if (normalized.includes('unsubscribe') || normalized.includes('unsub')) return 'unsubscribed';
  if (normalized.includes('bounce') || normalized.includes('invalid') || normalized.includes('reject')) return 'rejected';
  return 'pending_review';
}

export function validateCampaignRecipients(
  recipients: CampaignRecipientCandidate[]
): CampaignRecipientValidationResult {
  const uniqueByEmail = new Map<string, CampaignRecipientCandidate>();
  const blockedRecipients: CampaignRecipientCandidate[] = [];
  const approvedRecipients: CampaignRecipientCandidate[] = [];

  for (const recipient of recipients) {
    const normalizedEmail = normalizeEmail(recipient.email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      blockedRecipients.push({ ...recipient, email: normalizedEmail || recipient.email });
      continue;
    }

    if (uniqueByEmail.has(normalizedEmail)) continue;
    uniqueByEmail.set(normalizedEmail, recipient);

    const consentStatus = normalizeConsentStatus(recipient.consentStatus);

    if (consentStatus === 'double_opt_in' || consentStatus === 'explicit_opt_in') {
      approvedRecipients.push({ ...recipient, email: normalizedEmail });
    } else {
      blockedRecipients.push({ ...recipient, email: normalizedEmail, consentStatus });
    }
  }

  const summary = {
    total: uniqueByEmail.size,
    valid: approvedRecipients.length,
    blocked: blockedRecipients.length,
    invalidEmails: blockedRecipients.filter(({ email }) => !email || !isValidEmail(email)).length,
    pendingReview: blockedRecipients.filter(({ consentStatus }) => normalizeConsentStatus(consentStatus) === 'pending_review').length,
    unsubscribed: blockedRecipients.filter(({ consentStatus }) => normalizeConsentStatus(consentStatus) === 'unsubscribed').length,
  };

  return {
    safeToSend: approvedRecipients.length > 0 && blockedRecipients.length === 0,
    approvedRecipients,
    blockedRecipients,
    summary,
  };
}
