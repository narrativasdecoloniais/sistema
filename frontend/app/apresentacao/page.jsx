import Link from "next/link";
import Carimbo from "@/components/graficos/Carimbo";
import BuziosSimbolos from "@/components/publico/buzios/BuziosSimbolos";
import LogoEmDestaque from "./LogoEmDestaque";
import styles from "./apresentacao.module.scss";

const CORES = [
  {
    token: "tinta",
    nome: "Tinta",
    hex: "#201914",
    uso: "Texto, títulos stencil e a própria logo — a cor do traço, não a do fundo.",
  },
  {
    token: "barro",
    nome: "Barro",
    hex: "#9C4A2F",
    uso: "CTAs e links — a cor que convida a agir.",
  },
  {
    token: "ocre",
    nome: "Ocre",
    hex: "#B87C34",
    uso: "Acento secundário, uso pontual.",
  },
  {
    token: "buzio",
    nome: "Búzio",
    hex: "#EDB153",
    uso: "Amarelo amostrado do búzio na logo oficial — reservado à assinatura.",
  },
  {
    token: "areia",
    nome: "Areia",
    hex: "#EDE4D4",
    uso: "Superfície de apoio, usada com raridade.",
  },
  {
    token: "papel",
    nome: "Papel",
    hex: "#FAF6EE",
    uso: "Fundo único de todas as páginas públicas.",
  },
  {
    token: "cerrado",
    nome: "Cerrado",
    hex: "#55603F",
    uso: "O verde do bioma — apoio pontual, nunca faixa de seção.",
  },
];

// mesmas três conchas ilustradas usadas no site de verdade (cursor de
// rolagem da nav, rodapé, cluster que "cai" na home) — ver
// components/publico/buzios/BuziosSimbolos.jsx
const BUZIO_SIMBOLOS = {
  1: { id: "buzio-simbolo-1", viewBox: "0 0 164 182" },
  2: { id: "buzio-simbolo-2", viewBox: "0 0 148 197" },
  3: { id: "buzio-simbolo-3", viewBox: "0 0 152 196" },
};

function BuzioIlustrado({
  variante = 1,
  tamanho = 24,
  className = "",
  rotacao = 0,
}) {
  const { id, viewBox } = BUZIO_SIMBOLOS[variante];
  const [, , largura, altura] = viewBox.split(" ").map(Number);
  return (
    <svg
      viewBox={viewBox}
      width={tamanho}
      height={(tamanho * altura) / largura}
      className={className}
      style={rotacao ? { transform: `rotate(${rotacao}deg)` } : undefined}
      aria-hidden="true"
    >
      <use href={`#${id}`} width="100%" height="100%" />
    </svg>
  );
}

function Marcador() {
  return (
    <div className={styles.marcador} aria-hidden="true">
      <BuzioIlustrado
        variante={1}
        tamanho={18}
        className={styles.marcadorBuzio}
      />
    </div>
  );
}

function Secao({ eyebrow, titulo, children }) {
  return (
    <section className={styles.secao}>
      <Marcador />
      <div className={styles.conteudo}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.tituloSecao}>{titulo}</h2>
        {children}
      </div>
    </section>
  );
}

export default function Apresentacao() {
  return (
    <div className={styles.pagina}>
      <BuziosSimbolos />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Mensagem para Ana Tereza</span>
        <h1 className={styles.tituloPrincipal}>
          O processo de criação da identidade do site
        </h1>
        <p className={styles.introducao}>
          Olá, Ana Tereza! Quero compartilhar o raciocínio por trás das escolhas
          visuais do site, pois, em um evento com esse nome, a estética também é
          posicionamento.
        </p>
      </header>

      <Secao eyebrow="A logo" titulo="O molde vazado do protesto">
        <p className={styles.texto}>
          O ponto de partida foi a própria logo. Ela é tipográfica, em stencil,
          com as letras dispostas em uma grade deslocada, além disso, os dois
          &ldquo;O&rdquo;s de DECOLONIAIS são búzios, referência direta à
          oralidade e à ancestralidade afro-brasileira.
        </p>
        <p className={styles.texto}>
          O stencil não é uma fonte neutra: é a técnica do molde vazado, do
          spray, da marcação de muro, uma forma de divulgação barata e
          acessível, historicamente ligada ao protesto e à comunicação que ocupa
          o espaço público sem pedir licença. Uma logo dessas não é um item de
          canto de tela: é o próprio cartaz. O site não inventa uma estética,
          estende com coerência a que a identidade do evento já carrega.
        </p>
        <p className={styles.texto}>
          A entrada da logo no site carrega o mesmo raciocínio, só que em
          movimento: a marca não aparece de uma vez, ela é revelada por uma
          faixa que desce e a &ldquo;imprime&rdquo; de cima para baixo, primeiro
          em branco, depois em cor. É o gesto de um rodo puxando tinta sobre a
          tela de serigrafia: mais uma tecnologia barata de reprodução do
          protesto, ao lado do stencil e do spray, agora acontecendo em
          movimento em vez de parada.
        </p>

        <div className={styles.amostraLogo}>
          <LogoEmDestaque />
          <p className={styles.legendaLogo}>
            A mesma animação de abertura do site, em tempo real — role até aqui
            de novo ou toque em &ldquo;repetir animação&rdquo;.
          </p>
        </div>
      </Secao>

      <Secao
        eyebrow="A estrutura"
        titulo="Um cartaz, não um site institucional"
      >
        <p className={styles.texto}>
          Assim, o site foge do padrão de plataformas de evento. Ela abre como
          um lambe-lambe colado no muro: a logo em grande escala é a primeira
          coisa que se vê, sem a barra de navegação convencional (logo pequena à
          esquerda, links à direita). Esse padrão convencional de layout
          encolheria a marca a um selo decorativo e enquadraria o evento na
          gramática de site institucional genérico, exatamente o que a
          identidade nega.
        </p>
        <p className={styles.texto}>
          A pessoa para diante do cartaz, lê, e então caminha, rolando a página,
          para descobrir o restante. A navegação só aparece quando passa a ser
          útil. O lambe, portanto, não é uma escolha aleatória: é a linguagem
          gráfica clássica das vozes sem acesso aos canais oficiais. Um evento
          sobre narrativas decoloniais e antirracistas em educação que se veste
          dessa gramática diz, sem escrever, de que lugar fala: da rua, do
          popular, do acessível.
        </p>

        <div className={styles.comparativo}>
          <figure className={styles.comparativoItem}>
            <img
              src="/comoEra.png"
              alt="Página do evento no Even3 — plataforma genérica de terceiros, com barra de login e o banner do evento encaixado num template padrão"
              className={styles.comparativoImagem}
            />
            <figcaption className={styles.comparativoRotulo}>
              Como era — Even3
            </figcaption>
          </figure>
          <figure className={styles.comparativoItem}>
            <img
              src="/comoFicou.png"
              alt="A nova página do evento — a logo em grande escala como hero, sem barra de navegação tradicional"
              className={styles.comparativoImagem}
            />
            <figcaption className={styles.comparativoRotulo}>
              Como ficou
            </figcaption>
          </figure>
        </div>
      </Secao>

      <Secao eyebrow="Tipografia" titulo="A palavra como imagem">
        <p className={styles.texto}>
          A tipografia é protagonista porque o evento se chama Narrativas. Os
          títulos das seções usam a mesma família stencil da logo, tratando a
          palavra como imagem principal, dialogando diretamente com o objeto do
          encontro: textos, falas, contação, escuta.
        </p>
        <p className={styles.texto}>
          A tipografia escolhida é também um eco da publicação independente
          (zines, panfletos, folhetos), que sempre foi o veículo material do
          pensamento contra-hegemônico. A chamada do evento é tratada como
          convocação, não como banner de marketing.
        </p>

        <div className={styles.amostraTipografia}>
          <div className={styles.especime}>
            <span className={styles.especimeStencilGrande}>Aa Éçã</span>
            <span className={styles.especimeStencilPalavra}>Narrativas</span>
            <p className={styles.especimeLegenda}>
              Saira Stencil One — só em títulos de página e de seção, sempre em
              caixa alta, sempre com diacríticos (ç, ã, õ, á, é) verificados.
            </p>
          </div>
          <div className={styles.especime}>
            <div className={styles.especimePesos}>
              <span className={styles.pesoArchivo400}>Aa 400</span>
              <span className={styles.pesoArchivo600}>Aa 600</span>
              <span className={styles.pesoArchivo800}>Aa 800</span>
            </div>
            <p className={styles.especimeLegenda}>
              Archivo — todo o resto: corpo de texto, botões, formulários,
              legendas. A hierarquia nasce da variação de peso e tamanho, nunca
              de caixas coloridas.
            </p>
          </div>
        </div>
      </Secao>

      <Secao eyebrow="Cores" titulo="Uma paleta de território">
        <p className={styles.texto}>
          As cores ancoram o design num território. Em vez dos azuis tech e
          gradientes das plataformas genéricas, a linguagem &ldquo;de lugar
          nenhum&rdquo;, a paleta é terrosa: barro, ocre, areia, o verde do
          cerrado e o amarelo dos búzios, extraído da própria logo.
        </p>
        <p className={styles.texto}>
          Terra, matéria, corpo e chão: as categorias de território e
          ancestralidade que são centrais ao pensamento decolonial. Há até uma
          leitura fina na grade desconstruída da logo: a estrutura existe, mas
          está deslocada, questionada, um eco visual do próprio gesto de
          descolonizar a norma.
        </p>

        <div className={styles.grade}>
          {CORES.map((cor) => (
            <div key={cor.token} className={styles.corCartao}>
              <div
                className={styles.corRetangulo}
                style={{ background: cor.hex }}
              />
              <span className={styles.corNome}>{cor.nome}</span>
              <span className={styles.corHex}>{cor.hex}</span>
              <p className={styles.corUso}>{cor.uso}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao eyebrow="O búzio" titulo="Assinatura, não padronagem">
        <p className={styles.texto}>
          Ao longo do site, o búzio substitui ícones convencionais. É ele que
          assinala cada seção nova, o cursor de rolagem, o rodapé. Repare: é o
          mesmo símbolo que marca, à esquerda, cada bloco deste próprio texto.
        </p>
        <p className={styles.texto}>
          Ele aparece como assinatura, não como padronagem: cada uso é pontual,
          quase uma marca de autenticidade. É essa escolha, mais do que qualquer
          detalhe isolado, que faz o site parecer costurado por dentro em vez de
          montado a partir de um template.
        </p>

        <div className={styles.amostraBuzio}>
          <div className={styles.buzioLinha}>
            <BuzioIlustrado
              variante={1}
              tamanho={44}
              className={styles.buzioAmarelo}
              rotacao={-8}
            />
            <BuzioIlustrado
              variante={2}
              tamanho={40}
              className={styles.buzioAmarelo}
              rotacao={10}
            />
            <BuzioIlustrado
              variante={3}
              tamanho={42}
              className={styles.buzioAmarelo}
              rotacao={3}
            />
          </div>
          <div className={styles.buzioLinha}>
            <BuzioIlustrado
              variante={1}
              tamanho={30}
              className={styles.buzioTinta}
            />
            <BuzioIlustrado
              variante={1}
              tamanho={30}
              className={styles.buzioBarro}
            />
            <BuzioIlustrado
              variante={1}
              tamanho={30}
              className={styles.buzioCerrado}
            />
          </div>
          <p className={styles.especimeLegenda}>
            As mesmas três conchas usadas no cursor de rolagem da barra de
            navegação, no rodapé e no conjunto que &ldquo;cai&rdquo; na página
            inicial — aqui, paradas, em outras cores da paleta.
          </p>
        </div>
      </Secao>

      <section className={styles.fechamento}>
        <p className={styles.texto}>
          O resultado é um site que nenhuma plataforma pronta entregaria: a
          identidade do evento levada às últimas consequências, sem abrir mão de
          usabilidade e acessibilidade. Fico à disposição para conversar sobre
          qualquer um desses pontos e ajustar o que a equipe sentir necessário.
        </p>
        <Link href="/" className={styles.cta}>
          <Carimbo className={styles.ctaCarimbo} preenchido />
          <span>Veja como ficou! →</span>
        </Link>
      </section>
    </div>
  );
}
