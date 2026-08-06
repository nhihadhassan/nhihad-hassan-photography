export type AgreementSigner = {
  name: string;
  email: string;
};

export type AgreementSignerSource = {
  client_name: string | null;
  client_email: string | null;
  details: {
    signerName?: string;
    secondSignerName?: string;
    secondSignerEmail?: string;
  };
};

const clean = (value?: string | null) => value?.trim() ?? "";

export function requiredAgreementSigners(source: AgreementSignerSource): AgreementSigner[] {
  const primary = {
    name: clean(source.details.signerName) || clean(source.client_name),
    email: clean(source.client_email).toLowerCase(),
  };
  const secondary = {
    name: clean(source.details.secondSignerName),
    email: clean(source.details.secondSignerEmail).toLowerCase(),
  };

  return [
    ...(primary.name ? [primary] : []),
    ...(secondary.name && secondary.email ? [secondary] : []),
  ];
}

export function remainingAgreementSigners(
  required: AgreementSigner[],
  signedEmails: Array<string | null>,
): AgreementSigner[] {
  const completed = new Set(signedEmails.map((email) => clean(email).toLowerCase()).filter(Boolean));
  return required.filter((signer) => !completed.has(signer.email));
}
