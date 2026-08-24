import { isAuthApiError, type AuthError } from "@supabase/supabase-js";

// Códigos do GoTrue para os quais temos um texto próprio. Qualquer outro cai
// em auth.errors.generic.
const KNOWN_CODES = new Set([
  "provider_disabled",
  "oauth_provider_not_supported",
  "signup_disabled",
  "user_banned",
  "bad_oauth_state",
  "bad_oauth_callback",
  "flow_state_expired",
  "flow_state_not_found",
  "over_request_rate_limit",
  "validation_failed",
]);

/** Traduz o erro do Supabase para uma chave de i18n. */
export function authErrorKey(error: AuthError | null): string | null {
  if (!error) return null;

  if (error.code && KNOWN_CODES.has(error.code)) {
    return `auth.errors.${error.code}`;
  }

  // Falha de rede: o SDK devolve AuthRetryableFetchError sem código.
  if (!isAuthApiError(error) && !error.code) {
    return "auth.errors.network";
  }

  return "auth.errors.generic";
}

/**
 * Traduz o erro que volta na URL do callback do OAuth. O Google e o Supabase
 * usam os códigos do padrão OAuth 2.0 aqui, que não são os mesmos de cima.
 */
export function oauthCallbackErrorKey(code: string | null): string | null {
  if (!code) return null;
  if (code === "access_denied") return "auth.errors.access_denied";
  if (code === "server_error" || code === "temporarily_unavailable") return "auth.errors.generic";
  return "auth.errors.oauth_failed";
}
