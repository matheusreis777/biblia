/**
 * Quando o consentimento do Google falha ou é recusado, o erro volta na URL do
 * callback — na query string ou no fragmento, dependendo do fluxo. Esta função
 * olha os dois e devolve o código do erro (ex.: "access_denied").
 */
export function readAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const fromSearch = new URLSearchParams(window.location.search);
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return fromSearch.get("error") ?? fromHash.get("error");
}
