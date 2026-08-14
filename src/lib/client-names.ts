/**
 * Friendly title casing for client-entered names. Capitalises every word and
 * each segment after an apostrophe or hyphen while keeping the result editable.
 */
export function titleCaseClientName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-CA")
    .replace(/(^|[\s'’-])([\p{L}])/gu, (_match, boundary: string, letter: string) =>
      `${boundary}${letter.toLocaleUpperCase("en-CA")}`,
    );
}

export function normalizeClientEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLocaleLowerCase("en-CA");
  return email || null;
}
