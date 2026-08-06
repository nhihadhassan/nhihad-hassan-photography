export type AgreementExpiryState = {
  signed_at: string | null;
  expires_at: string | null;
  expired_at: string | null;
};

/** Shared derived expiry state for server enforcement and admin display. */
export function isAgreementPastExpiry(request: AgreementExpiryState, now = Date.now()) {
  if (request.signed_at) return false;
  if (request.expired_at) return true;
  if (!request.expires_at) return false;
  const expiresAt = new Date(request.expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= now;
}
