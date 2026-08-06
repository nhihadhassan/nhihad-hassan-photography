/** Contact details the client supplies on the contract page before signing. */
export type AgreementClientDetails = {
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  backupName?: string;
  backupEmail?: string;
  backupPhone?: string;
};

export function asClientDetails(value: unknown): AgreementClientDetails {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const pick = (key: string) => {
    const raw = v[key];
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed ? trimmed : undefined;
  };
  return {
    phone: pick("phone"),
    addressLine1: pick("addressLine1"),
    addressLine2: pick("addressLine2"),
    city: pick("city"),
    province: pick("province"),
    postalCode: pick("postalCode"),
    backupName: pick("backupName"),
    backupEmail: pick("backupEmail"),
    backupPhone: pick("backupPhone"),
  };
}

/** Single-line mailing address, used on the contract and in the admin review. */
export function formatClientAddress(details: AgreementClientDetails): string {
  return [
    details.addressLine1,
    details.addressLine2,
    details.city,
    details.province,
    details.postalCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function formatBackupContact(details: AgreementClientDetails): string {
  return [details.backupName, details.backupPhone, details.backupEmail]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
}
