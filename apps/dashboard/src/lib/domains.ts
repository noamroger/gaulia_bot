/** Same normalization as the API: "https://www.Example.com/page" -> "example.com". */
export function normalizeDomain(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/^[a-z]+:\/\//, "")
      .replace(/^www\./, "")
      .split(/[/?#:]/)[0] ?? ""
  );
}

/** Validity only: the wording of the error comes from the caller's catalog. */
export function isValidDomain(domain: string): boolean {
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain);
}
