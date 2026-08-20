#!/usr/bin/env python3
"""
Prepara as fontes usadas pelo gerador de Reels.

Baixa as fontes variáveis canônicas do repositório google/fonts, instancia
nos pesos que a composição usa e faz subset para Latin (PT-BR + EN).

O MESMO arquivo .ttf resultante é usado em três lugares:
  1. o browser, via @font-face, para desenhar o preview;
  2. o opentype.js, para medir o texto e quebrar as linhas;
  3. o resvg, no servidor, para rasterizar a camada de texto do vídeo.

É isso que faz o preview bater pixel a pixel com o MP4 final. Não troque por
webfonts do Google no preview — as métricas divergem.

Uso:  python scripts/prepare-fonts.py
"""

import io
import sys
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.subset import Subsetter, Options

RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl"

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "fonts"

# Latin básico + suplemento (acentos PT), Latin Extended-A, pontuação geral
# (aspas curvas, travessões, reticências) e alguns símbolos.
UNICODES = "U+0020-007F,U+00A0-00FF,U+0100-017F,U+2000-206F,U+20AC,U+2122"

# (arquivo de saída, família única, caminho no google/fonts, eixos a fixar)
#
# A família é reescrita para um nome ÚNICO por peso. Sem isso, as três
# instâncias do Inter sairiam todas como família "Inter" / subfamília
# "Regular", diferindo só no usWeightClass — e o resvg não conseguiria
# escolher o peso certo. Cormorant e Space Grotesk ainda herdariam o nome do
# instance padrão da variável ("Cormorant Garamond Light"), que está errado.
#
# Com nome único, o mesmo literal serve de font-family no SVG do servidor e no
# @font-face do browser. Precisa bater com fontFamilyName() em src/reels/fonts.ts.
FONTS = [
    # UI / corpo — já são as fontes do site
    ("Inter-Regular.ttf",              "ReelInter400",         "inter/Inter[opsz,wght].ttf",                    {"wght": 400, "opsz": 28}),
    ("Inter-Medium.ttf",               "ReelInter500",         "inter/Inter[opsz,wght].ttf",                    {"wght": 500, "opsz": 28}),
    ("Inter-SemiBold.ttf",             "ReelInter600",         "inter/Inter[opsz,wght].ttf",                    {"wght": 600, "opsz": 28}),
    ("SpaceGrotesk-Medium.ttf",        "ReelSpaceGrotesk500",  "spacegrotesk/SpaceGrotesk[wght].ttf",           {"wght": 500}),
    ("SpaceGrotesk-Bold.ttf",          "ReelSpaceGrotesk700",  "spacegrotesk/SpaceGrotesk[wght].ttf",           {"wght": 700}),
    # Serifadas — acabamento premium para o versículo
    ("CormorantGaramond-Medium.ttf",   "ReelCormorant500",     "cormorantgaramond/CormorantGaramond[wght].ttf", {"wght": 500}),
    ("CormorantGaramond-SemiBold.ttf", "ReelCormorant600",     "cormorantgaramond/CormorantGaramond[wght].ttf", {"wght": 600}),
    ("PlayfairDisplay-Medium.ttf",     "ReelPlayfair500",      "playfairdisplay/PlayfairDisplay[wght].ttf",     {"wght": 500}),
    ("PlayfairDisplay-SemiBold.ttf",   "ReelPlayfair600",      "playfairdisplay/PlayfairDisplay[wght].ttf",     {"wght": 600}),
]

# Licenças a copiar junto (OFL exige distribuir o texto da licença)
LICENSES = ["inter", "spacegrotesk", "cormorantgaramond", "playfairdisplay"]


def rename(font: TTFont, family: str) -> None:
    """
    Reescreve o nome da família para `family` e a subfamília para Regular.

    Mexe nos nameIDs 1 (family), 2 (subfamily), 3 (unique ID), 4 (full name),
    6 (PostScript) e remove os 16/17 (typographic family/subfamily), que teriam
    precedência sobre o 1/2 e reintroduziriam a ambiguidade entre os pesos.
    """
    name = font["name"]
    ps = family  # já é um identificador sem espaços
    values = {1: family, 2: "Regular", 3: f"{family};biblia-reels", 4: family, 6: ps}

    for record in list(name.names):
        if record.nameID in (16, 17):
            name.names.remove(record)

    for name_id, value in values.items():
        name.setName(value, name_id, 3, 1, 0x409)  # Windows / Unicode BMP / en-US
        name.setName(value, name_id, 1, 0, 0)      # Macintosh / Roman / en


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "biblia-reels-fontprep"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    cache: dict[str, bytes] = {}
    for out_name, family, repo_path, axes in FONTS:
        if repo_path not in cache:
            url = f"{RAW}/{repo_path}"
            print(f"  baixando {repo_path}")
            cache[repo_path] = fetch(url)

        font = TTFont(io.BytesIO(cache[repo_path]))
        static = instancer.instantiateVariableFont(font, axes, updateFontNames=False)
        rename(static, family)

        opts = Options()
        opts.layout_features = ["kern", "liga", "clig", "calt", "ccmp", "locl", "mark", "mkmk"]
        opts.name_IDs = ["*"]
        opts.name_legacy = True
        opts.notdef_outline = True
        opts.recalc_bounds = True
        opts.drop_tables += ["DSIG"]

        sub = Subsetter(options=opts)
        sub.populate(unicodes=parse_unicodes(UNICODES))
        sub.subset(static)

        dest = OUT_DIR / out_name
        static.save(dest)
        print(f"  -> {out_name}  ({dest.stat().st_size // 1024} KB)")

    for fam in LICENSES:
        dest = OUT_DIR / f"OFL-{fam}.txt"
        if not dest.exists():
            dest.write_bytes(fetch(f"{RAW}/{fam}/OFL.txt"))
            print(f"  -> OFL-{fam}.txt")

    print(f"\nPronto. Fontes em {OUT_DIR}")
    return 0


def parse_unicodes(spec: str):
    out = []
    for part in spec.split(","):
        part = part.strip().replace("U+", "")
        if "-" in part:
            lo, hi = part.split("-")
            out.extend(range(int(lo, 16), int(hi, 16) + 1))
        else:
            out.append(int(part, 16))
    return out


if __name__ == "__main__":
    sys.exit(main())
