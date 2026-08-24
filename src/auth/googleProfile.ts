// ─── Metadados do perfil Google ───────────────────────────────────────────────
// O Supabase entrega o perfil em `user.user_metadata`, e os nomes dos campos
// variam conforme a versão do provedor — daí as duas opções em cada leitura.
// Vive fora dos componentes para não quebrar o fast refresh deles.

export interface GoogleMetadata {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
}

export const nameOf = (metadata: GoogleMetadata, email?: string | null) =>
  metadata.full_name || metadata.name || email || "";

export const initialOf = (metadata: GoogleMetadata, email?: string | null) =>
  (nameOf(metadata, email) || "?").trim().charAt(0).toUpperCase();

export const photoOf = (metadata: GoogleMetadata) =>
  metadata.avatar_url || metadata.picture;
