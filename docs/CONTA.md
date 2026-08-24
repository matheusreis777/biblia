# Conta e sincronização

Login **opcional**, só com Google, via Supabase Auth. Quem não entra lê a Bíblia
normalmente e tem a última leitura guardada no `localStorage`; quem entra ganha a mesma
informação na nuvem, sincronizada entre dispositivos.

---

## O que a conta guarda

Uma tabela para cada coisa, todas com RLS ligado e políticas que só deixam a pessoa ver
e escrever as próprias linhas:

| Tabela | Conteúdo |
|---|---|
| `profiles` | Nome, e-mail, foto e idioma preferido. Criada por trigger no primeiro login. |
| `reading_progress` | Uma linha por usuário com o último livro e capítulo abertos. |
| `favorite_verses` | Versículos marcados com a estrela. |

**O RLS sozinho não basta neste projeto.** Ele foi criado com a política "RLS-first" do
Supabase, que não concede privilégios de tabela automaticamente: sem o `GRANT ... TO
authenticated` da migração `20260821191609`, o PostgREST devolve `42501 permission
denied` antes mesmo de avaliar as políticas. Toda tabela nova precisa dos dois.

---

## Como o estado é resolvido

`src/auth/` tem dois provedores, nesta ordem:

- **`AuthProvider`** — restaura a sessão do `localStorage` no carregamento
  (`persistSession` + `autoRefreshToken`), o que mantém a pessoa logada entre visitas, e
  expõe `signInWithGoogle` / `signOut`.
- **`UserDataProvider`** — dona da última leitura, dos favoritos e do idioma. Sem sessão
  trabalha só com o `localStorage`. Ao entrar, mescla os dois lados: na última leitura
  vence o `updated_at` mais recente; nos favoritos vale a união dos dois conjuntos, e o
  que só existia no navegador sobe para a nuvem.

O flag `ready` do `UserDataProvider` é o que evita a pegadinha mais fácil deste fluxo:
gravar Gênesis 1 (o capítulo padrão) por cima do progresso real antes de a nuvem
responder. A página só restaura e só grava depois que ele vira `true`.

---

## O que precisa estar configurado no painel do Supabase

- **Authentication → Providers → Google**: habilitado, com o Client ID e o Client Secret
  do Google Cloud. No Google Cloud, a *Authorized redirect URI* é a do Supabase:
  `https://<projeto>.supabase.co/auth/v1/callback`.
- **Authentication → URL Configuration → Redirect URLs**: precisa listar o callback da
  app em cada ambiente, senão a volta do Google cai no *Site URL* em vez da rota certa:
  `http://localhost:5173/auth/callback` e `https://<seu-domínio>/auth/callback`.
- **Authentication → Providers → Email**: pode ser desligado. A interface não oferece
  mais senha, mas enquanto o provedor estiver ligado ainda dá para criar conta chamando a
  API direto.
- Opcional: *Leaked Password Protection* — irrelevante enquanto só houver Google.

As migrações já aplicadas no projeto ficam em `supabase/migrations/`.
