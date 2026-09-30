import type { Plugin } from "vite";
import { SITE_NAME, pageMeta, prerenderedPaths } from "../src/lib/pageMeta";

// ─── Open Graph e canônica no HTML inicial ────────────────────────────────────
// O site é SPA: sem isto, toda URL devolveria o mesmo index.html, e os crawlers
// de prévia (WhatsApp, Instagram, Facebook, X) não executam JS para descobrir
// título e imagem da página.
//
// No build, o index.html vira um HTML por rota (reels/index.html,
// genesis/1/index.html…), cada um com o <head> de src/lib/pageMeta.ts. A Vercel
// serve o arquivo da rota antes de cair no rewrite do SPA do vercel.json; o
// JS é o mesmo, só muda o <head>. Em dev, o Vite serve o index.html em toda
// rota, e as tags saem da URL pedida.

const MARKER = "<!-- open-graph -->";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function headTags(siteUrl: string, pathname: string): string {
  const meta = pageMeta(pathname);
  const url = siteUrl + meta.path;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:locale:alternate" content="en_US" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${siteUrl}${meta.image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />`,
    // O X lê as og:* acima, mas só mostra a imagem grande com este cartão.
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join("\n    ");
}

/** `siteUrl`: origem absoluta, sem barra final — og:image não aceita URL relativa. */
export function openGraph(siteUrl: string): Plugin {
  const render = (html: string, pathname: string) => {
    if (!html.includes(MARKER)) throw new Error(`index.html sem o marcador ${MARKER}`);
    return html.replace(MARKER, headTags(siteUrl, pathname));
  };

  return {
    name: "open-graph",
    // Depois do vite-plugin-pwa, para os HTMLs das rotas já levarem o manifest.
    enforce: "post",
    transformIndexHtml(html, ctx) {
      // No build o marcador fica para o generateBundle, que precisa dele intacto.
      return ctx.server ? render(html, (ctx.originalUrl ?? "/").split("?")[0]) : html;
    },
    generateBundle(_, bundle) {
      const index = bundle["index.html"];
      if (index?.type !== "asset") return;
      const template = String(index.source);
      index.source = render(template, "/");
      for (const path of prerenderedPaths()) {
        this.emitFile({
          type: "asset",
          fileName: `${path.slice(1)}/index.html`,
          source: render(template, path),
        });
      }
    },
  };
}
