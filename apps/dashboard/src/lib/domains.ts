/** Même normalisation que l'API : "https://www.Exemple.com/page" → "exemple.com". */
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

export function domainError(domain: string): string | null {
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)
    ? null
    : `« ${domain} » n'est pas un nom de domaine valide.`;
}
