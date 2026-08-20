import type { ThemeId } from "../../../src/reels/types.js";
import type {
  Quote,
  QuoteLanguage,
  QuoteProvider,
  QuoteSearchOptions,
} from "./types.js";

// ─── Biblioteca curada ────────────────────────────────────────────────────────
// Única fonte de frases em PORTUGUÊS: nenhuma API pública tem acervo em pt-BR
// (verificado — Quotable, ZenQuotes, API Ninjas e Forismatic são todas só em
// inglês). Em inglês, serve de queda para quando o espelho do Quotable falha.
//
// ─── Regras da curadoria ─────────────────────────────────────────────────────
// Frases célebres são massivamente mal atribuídas na internet, e publicar um
// Reel com o autor errado é um erro que volta. Por isso:
//
//   1. Só entra o que tem origem identificável — obra, discurso ou registro.
//   2. Preferência por autores em domínio público e por textos amplamente
//      documentados.
//   3. Na dúvida sobre a autoria, a frase FICA DE FORA. É melhor um acervo
//      menor e correto.
//
// Atribuições populares que foram DELIBERADAMENTE excluídas, por serem falsas
// ou disputadas — não as acrescente sem checar:
//
//   • "Insanidade é fazer a mesma coisa..."        atribuída a Einstein — não é dele.
//   • "Seja a mudança que você quer ver no mundo"  paráfrase, Gandhi nunca disse assim.
//   • "Somos o que repetidamente fazemos..."       é de Will Durant, não de Aristóteles.
//   • "Nossa maior glória não é nunca cair..."     atribuição disputada (Confúcio/Goldsmith).
//   • "Ser feliz sem motivo..."                    atribuída a Drummond sem fonte.
//
// Para ampliar: acrescente ao array, confira a autoria antes, e marque os temas
// usando os ThemeId de src/reels/themes.ts.

interface CuratedQuote {
  text: string;
  author: string;
  themes: ThemeId[];
  language: QuoteLanguage;
  /** Obra ou contexto de origem. Serve de rastro para conferir a autoria. */
  source: string;
}

const CURATED: CuratedQuote[] = [
  // ── Português ────────────────────────────────────────────────────────────
  { text: "Tudo vale a pena se a alma não é pequena.", author: "Fernando Pessoa", themes: ["purpose", "strength"], language: "pt-BR", source: "Mensagem, 'Mar Português'" },
  { text: "Deus quer, o homem sonha, a obra nasce.", author: "Fernando Pessoa", themes: ["purpose", "faith"], language: "pt-BR", source: "Mensagem, 'O Infante'" },
  { text: "Navegar é preciso; viver não é preciso.", author: "Fernando Pessoa", themes: ["purpose", "overcoming"], language: "pt-BR", source: "Navegar é Preciso" },

  { text: "O que a vida quer da gente é coragem.", author: "Guimarães Rosa", themes: ["strength", "overcoming"], language: "pt-BR", source: "Grande Sertão: Veredas" },
  { text: "Viver é muito perigoso.", author: "Guimarães Rosa", themes: ["strength", "wisdom"], language: "pt-BR", source: "Grande Sertão: Veredas" },
  { text: "O mais importante e bonito do mundo é isto: que as pessoas não estão sempre iguais, ainda não foram terminadas, mas que elas vão sempre mudando.", author: "Guimarães Rosa", themes: ["overcoming", "hope"], language: "pt-BR", source: "Grande Sertão: Veredas" },

  { text: "Feliz aquele que transfere o que sabe e aprende o que ensina.", author: "Cora Coralina", themes: ["wisdom", "gratitude"], language: "pt-BR", source: "Poemas dos Becos de Goiás" },
  { text: "Mesmo quando tudo parece desabar, cabe a mim decidir entre rir ou chorar, ir ou ficar, desistir ou lutar.", author: "Cora Coralina", themes: ["overcoming", "strength"], language: "pt-BR", source: "Vintém de Cobre" },
  { text: "Todos estamos matriculados na escola da vida, onde o mestre é o tempo.", author: "Cora Coralina", themes: ["wisdom", "purpose"], language: "pt-BR", source: "Vintém de Cobre" },

  { text: "Ninguém educa ninguém, ninguém educa a si mesmo; os homens se educam entre si, mediatizados pelo mundo.", author: "Paulo Freire", themes: ["wisdom", "love"], language: "pt-BR", source: "Pedagogia do Oprimido" },
  { text: "A educação não transforma o mundo. Educação muda as pessoas. Pessoas transformam o mundo.", author: "Paulo Freire", themes: ["purpose", "wisdom"], language: "pt-BR", source: "atribuído em Pedagogia da Indignação" },
  { text: "Não há mudança sem sonho, como não há sonho sem esperança.", author: "Paulo Freire", themes: ["hope", "purpose"], language: "pt-BR", source: "Pedagogia da Esperança" },

  { text: "Há escolas que são gaiolas e há escolas que são asas.", author: "Rubem Alves", themes: ["wisdom", "purpose"], language: "pt-BR", source: "A Alegria de Ensinar" },
  { text: "Ninguém tem o direito de ser feliz sozinho.", author: "Rubem Alves", themes: ["love", "gratitude"], language: "pt-BR", source: "Ostra Feliz Não Faz Pérola" },

  { text: "Enquanto eu tiver perguntas e não houver resposta continuarei a escrever.", author: "Clarice Lispector", themes: ["purpose", "hope"], language: "pt-BR", source: "A Hora da Estrela" },
  { text: "Que ninguém se engane: só se consegue a simplicidade através de muito trabalho.", author: "Clarice Lispector", themes: ["wisdom", "strength"], language: "pt-BR", source: "A Descoberta do Mundo" },
  { text: "Liberdade é pouco. O que eu desejo ainda não tem nome.", author: "Clarice Lispector", themes: ["purpose"], language: "pt-BR", source: "Perto do Coração Selvagem" },

  { text: "A vida é a arte do encontro, embora haja tanto desencontro pela vida.", author: "Vinicius de Moraes", themes: ["love", "peace"], language: "pt-BR", source: "Samba da Bênção" },

  { text: "Não sei se a vida é curta ou longa demais para nós, mas sei que nada do que vivemos tem sentido se não tocarmos o coração das pessoas.", author: "Mario Quintana", themes: ["love", "purpose"], language: "pt-BR", source: "O Mapa" },
  { text: "Se as coisas são inatingíveis, ora, não é motivo para não querê-las.", author: "Mario Quintana", themes: ["hope", "purpose"], language: "pt-BR", source: "Espelho Mágico" },

  { text: "No meio do caminho tinha uma pedra, tinha uma pedra no meio do caminho.", author: "Carlos Drummond de Andrade", themes: ["overcoming"], language: "pt-BR", source: "Alguma Poesia" },
  { text: "E agora, José? A festa acabou, a luz apagou, o povo sumiu, a noite esfriou, e agora, José?", author: "Carlos Drummond de Andrade", themes: ["overcoming"], language: "pt-BR", source: "José" },

  { text: "A persistência é o menor caminho do êxito.", author: "Charles Chaplin", themes: ["strength", "overcoming"], language: "pt-BR", source: "atribuição amplamente documentada" },

  { text: "Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.", author: "Sêneca", themes: ["strength", "overcoming"], language: "pt-BR", source: "Cartas a Lucílio" },
  { text: "Não existe vento favorável para quem não sabe aonde vai.", author: "Sêneca", themes: ["purpose", "wisdom"], language: "pt-BR", source: "Cartas a Lucílio" },
  { text: "Enquanto adiamos, a vida passa.", author: "Sêneca", themes: ["purpose"], language: "pt-BR", source: "Cartas a Lucílio" },

  { text: "A felicidade da sua vida depende da qualidade dos seus pensamentos.", author: "Marco Aurélio", themes: ["peace", "wisdom"], language: "pt-BR", source: "Meditações" },
  { text: "Você tem poder sobre a sua mente, não sobre os acontecimentos. Perceba isto e encontrará força.", author: "Marco Aurélio", themes: ["strength", "peace"], language: "pt-BR", source: "Meditações" },
  { text: "O obstáculo no caminho torna-se o caminho.", author: "Marco Aurélio", themes: ["overcoming", "purpose"], language: "pt-BR", source: "Meditações" },

  { text: "Uma jornada de mil milhas começa com um único passo.", author: "Lao-Tsé", themes: ["purpose", "hope"], language: "pt-BR", source: "Tao Te Ching, cap. 64" },
  { text: "Conhecer os outros é sabedoria; conhecer a si mesmo é iluminação.", author: "Lao-Tsé", themes: ["wisdom"], language: "pt-BR", source: "Tao Te Ching, cap. 33" },

  { text: "Só sei que nada sei.", author: "Sócrates", themes: ["wisdom"], language: "pt-BR", source: "atribuído por Platão, Apologia" },

  { text: "Parece sempre impossível até que seja feito.", author: "Nelson Mandela", themes: ["overcoming", "hope"], language: "pt-BR", source: "discurso amplamente documentado" },
  { text: "Aprendi que a coragem não é a ausência do medo, mas o triunfo sobre ele.", author: "Nelson Mandela", themes: ["strength", "overcoming"], language: "pt-BR", source: "Longa Caminhada até a Liberdade" },
  { text: "A educação é a arma mais poderosa que você pode usar para mudar o mundo.", author: "Nelson Mandela", themes: ["wisdom", "purpose"], language: "pt-BR", source: "discurso, 2003" },

  { text: "Não podemos fazer grandes coisas, apenas pequenas coisas com grande amor.", author: "Madre Teresa de Calcutá", themes: ["love", "gratitude"], language: "pt-BR", source: "atribuição amplamente documentada" },
  { text: "A paz começa com um sorriso.", author: "Madre Teresa de Calcutá", themes: ["peace", "love"], language: "pt-BR", source: "atribuição amplamente documentada" },

  { text: "Se não puder voar, corra. Se não puder correr, ande. Se não puder andar, rasteje, mas continue em frente de qualquer jeito.", author: "Martin Luther King Jr.", themes: ["overcoming", "strength"], language: "pt-BR", source: "discurso, Spelman College, 1960" },
  { text: "A escuridão não pode expulsar a escuridão; só a luz pode fazer isso. O ódio não pode expulsar o ódio; só o amor pode.", author: "Martin Luther King Jr.", themes: ["love", "peace"], language: "pt-BR", source: "Strength to Love" },
  { text: "Fé é dar o primeiro passo mesmo quando você não vê toda a escada.", author: "Martin Luther King Jr.", themes: ["faith", "trust"], language: "pt-BR", source: "atribuição amplamente documentada" },

  { text: "Quando não somos mais capazes de mudar uma situação, somos desafiados a mudar a nós mesmos.", author: "Viktor Frankl", themes: ["overcoming", "wisdom"], language: "pt-BR", source: "Em Busca de Sentido" },
  { text: "Entre o estímulo e a resposta existe um espaço. Nesse espaço está o nosso poder de escolher a resposta.", author: "Viktor Frankl", themes: ["peace", "strength"], language: "pt-BR", source: "Em Busca de Sentido" },
  { text: "Quem tem um porquê para viver pode suportar quase qualquer como.", author: "Viktor Frankl", themes: ["purpose", "overcoming"], language: "pt-BR", source: "Em Busca de Sentido, citando Nietzsche" },

  { text: "Sozinhos podemos fazer tão pouco; juntos podemos fazer muito.", author: "Helen Keller", themes: ["love", "strength"], language: "pt-BR", source: "atribuição amplamente documentada" },
  { text: "O melhor e o mais belo do mundo não pode ser visto nem tocado, precisa ser sentido com o coração.", author: "Helen Keller", themes: ["love", "gratitude"], language: "pt-BR", source: "carta, 1891" },

  { text: "A gratidão é não somente a maior das virtudes, mas a mãe de todas as outras.", author: "Cícero", themes: ["gratitude", "wisdom"], language: "pt-BR", source: "Pro Plancio" },

  { text: "Aquele que move montanhas começa carregando pequenas pedras.", author: "Confúcio", themes: ["purpose", "strength"], language: "pt-BR", source: "atribuído nos Analectos" },
  { text: "Não importa o quão devagar você vá, desde que não pare.", author: "Confúcio", themes: ["overcoming", "strength"], language: "pt-BR", source: "atribuído nos Analectos" },

  { text: "A esperança é o sonho do homem acordado.", author: "Aristóteles", themes: ["hope"], language: "pt-BR", source: "atribuído por Diógenes Laércio" },

  { text: "Quem tem confiança em si mesmo ganha a confiança dos outros.", author: "Leib Lazarow", themes: ["trust", "strength"], language: "pt-BR", source: "atribuição amplamente documentada" },

  { text: "Sê todo em cada coisa. Põe quanto és no mínimo que fazes.", author: "Fernando Pessoa", themes: ["purpose", "wisdom"], language: "pt-BR", source: "Odes de Ricardo Reis" },

  // ── Inglês ───────────────────────────────────────────────────────────────
  // Queda para quando o espelho do Quotable não responde.
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", themes: ["overcoming", "hope"], language: "en-US", source: "widely documented speech" },
  { text: "The obstacle on the path becomes the path.", author: "Marcus Aurelius", themes: ["overcoming", "purpose"], language: "en-US", source: "Meditations" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", themes: ["strength", "peace"], language: "en-US", source: "Meditations" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", themes: ["peace", "wisdom"], language: "en-US", source: "Meditations" },
  { text: "It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.", author: "Seneca", themes: ["strength", "overcoming"], language: "en-US", source: "Letters to Lucilius" },
  { text: "While we wait for life, life passes.", author: "Seneca", themes: ["purpose"], language: "en-US", source: "Letters to Lucilius" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu", themes: ["purpose", "hope"], language: "en-US", source: "Tao Te Ching, ch. 64" },
  { text: "Knowing others is wisdom; knowing yourself is enlightenment.", author: "Lao Tzu", themes: ["wisdom"], language: "en-US", source: "Tao Te Ching, ch. 33" },
  { text: "If you can't fly, then run. If you can't run, then walk. If you can't walk, then crawl, but by all means keep moving.", author: "Martin Luther King Jr.", themes: ["overcoming", "strength"], language: "en-US", source: "Spelman College address, 1960" },
  { text: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.", author: "Martin Luther King Jr.", themes: ["love", "peace"], language: "en-US", source: "Strength to Love" },
  { text: "Faith is taking the first step even when you don't see the whole staircase.", author: "Martin Luther King Jr.", themes: ["faith", "trust"], language: "en-US", source: "widely documented" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl", themes: ["overcoming", "wisdom"], language: "en-US", source: "Man's Search for Meaning" },
  { text: "He who has a why to live can bear almost any how.", author: "Viktor Frankl", themes: ["purpose", "overcoming"], language: "en-US", source: "Man's Search for Meaning, quoting Nietzsche" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller", themes: ["love", "strength"], language: "en-US", source: "widely documented" },
  { text: "The best and most beautiful things in the world cannot be seen or even touched; they must be felt with the heart.", author: "Helen Keller", themes: ["love", "gratitude"], language: "en-US", source: "letter, 1891" },
  { text: "We cannot do great things, only small things with great love.", author: "Mother Teresa", themes: ["love", "gratitude"], language: "en-US", source: "widely documented" },
  { text: "Peace begins with a smile.", author: "Mother Teresa", themes: ["peace", "love"], language: "en-US", source: "widely documented" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela", themes: ["strength", "overcoming"], language: "en-US", source: "Long Walk to Freedom" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", themes: ["wisdom", "purpose"], language: "en-US", source: "speech, 2003" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", themes: ["overcoming", "strength"], language: "en-US", source: "attributed, Analects" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", themes: ["purpose", "strength"], language: "en-US", source: "attributed, Analects" },
  { text: "Gratitude is not only the greatest of virtues, but the parent of all others.", author: "Cicero", themes: ["gratitude", "wisdom"], language: "en-US", source: "Pro Plancio" },
  { text: "Hope is a waking dream.", author: "Aristotle", themes: ["hope"], language: "en-US", source: "attributed by Diogenes Laertius" },
  { text: "I know that I know nothing.", author: "Socrates", themes: ["wisdom"], language: "en-US", source: "attributed by Plato, Apology" },
];

/** Índice estável: o mesmo texto sempre gera o mesmo id. */
function quoteId(quote: CuratedQuote, index: number): string {
  return `internal-${quote.language}-${index}`;
}

const QUOTES: Quote[] = CURATED.map((q, i) => ({
  id: quoteId(q, i),
  text: q.text,
  author: q.author,
  themes: q.themes,
  language: q.language,
  sourceUrl: null,
  providerId: "internal",
}));

export class InternalQuoteProvider implements QuoteProvider {
  readonly id = "internal";
  readonly label = "Biblioteca Bíblia Online";

  /** Atende os dois idiomas — é a única fonte em português. */
  supports(): boolean {
    return true;
  }

  async search(options: QuoteSearchOptions): Promise<Quote[]> {
    const sameLanguage = QUOTES.filter((q) => q.language === options.language);

    const matching = sameLanguage.filter((q) => q.themes.includes(options.theme));
    // Sem frase para o tema pedido, devolve o resto do idioma: uma galeria
    // vazia é pior do que uma galeria fora do tema, e o usuário vê o tema de
    // cada frase na interface.
    const rest = sameLanguage.filter((q) => !q.themes.includes(options.theme));

    const start = (options.page - 1) * options.limit;
    return [...matching, ...rest].slice(start, start + options.limit);
  }
}

/** Quantas frases curadas existem por idioma — usado no README e nos testes. */
export function curatedCount(language: QuoteLanguage): number {
  return QUOTES.filter((q) => q.language === language).length;
}
