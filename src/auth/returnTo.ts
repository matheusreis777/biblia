// Guarda onde a pessoa estava antes de sair para o consentimento do Google,
// para a volta cair no mesmo capítulo em vez de na raiz.

const RETURN_TO_KEY = "biblia.auth.return-to";

export function rememberReturnTo(path: string) {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    /* modo privativo: só perdemos o "voltar para onde estava" */
  }
}

/** Lê e descarta o caminho salvo. Ignora valores que não sejam internos. */
export function takeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    // Só caminho relativo: "//host" seria um redirecionamento para fora.
    return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
  } catch {
    return null;
  }
}
