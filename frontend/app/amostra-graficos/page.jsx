import Buzio from "@/components/graficos/Buzio";
import Carimbo from "@/components/graficos/Carimbo";
import Divisor from "@/components/graficos/Divisor";
import TexturaPapel from "@/components/graficos/TexturaPapel";
import MarcaRodape from "@/components/graficos/MarcaRodape";
import BuziosSimbolos from "@/components/publico/buzios/BuziosSimbolos";
import styles from "./amostra.module.scss";

const CORES = [
  { nome: "--tinta" },
  { nome: "--barro" },
  { nome: "--buzio" },
  { nome: "--cerrado" },
];

const TAMANHOS_BUZIO = [16, 32, 64];
const TAMANHOS_MARCA = [20, 32, 48];
const SECOES_EXEMPLO = ["Inscrições", "Programação", "Eixos", "Anais"];

export default function AmostraGraficos() {
  return (
    <div className={styles.pagina}>
      <BuziosSimbolos />
      <h1 className={styles.tituloPagina}>Amostra de grafismos</h1>
      <p className={styles.aviso}>
        Página temporária de revisão — remover antes de finalizar o módulo.
      </p>

      <section className={styles.bloco}>
        <h2>Búzio</h2>
        <div className={styles.grade}>
          {CORES.map((cor) => (
            <div key={cor.nome} className={styles.celulaCor} style={{ color: `var(${cor.nome})` }}>
              <span className={styles.rotuloCor}>{cor.nome}</span>
              <div className={styles.linhaAmostras}>
                {TAMANHOS_BUZIO.map((tamanho) => (
                  <Buzio key={tamanho} tamanho={tamanho} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bloco}>
        <h2>Carimbo</h2>
        <div className={styles.grade}>
          {CORES.map((cor) => (
            <div key={cor.nome} className={styles.celulaCor} style={{ color: `var(${cor.nome})` }}>
              <span className={styles.rotuloCor}>{cor.nome}</span>
              <div className={styles.linhaAmostras}>
                <div className={styles.carimboCaixaPequena}>
                  <Carimbo />
                  <span>Pequeno</span>
                </div>
                <div className={styles.carimboCaixaMedia}>
                  <Carimbo />
                  <span>Médio</span>
                </div>
                <div className={styles.carimboCaixaGrande}>
                  <Carimbo />
                  <span>Grande</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bloco}>
        <h2>Divisor</h2>
        <div className={styles.grade}>
          {CORES.map((cor) => (
            <div key={cor.nome} className={styles.celulaCor} style={{ color: `var(${cor.nome})` }}>
              <span className={styles.rotuloCor}>{cor.nome}</span>
              <div className={styles.linhaAmostras}>
                <div className={styles.divisorAmostraCurto}>
                  <Divisor />
                </div>
                <div className={styles.divisorAmostraMedio}>
                  <Divisor />
                </div>
                <div className={styles.divisorAmostraVertical}>
                  <Divisor orientacao="vertical" />
                </div>
              </div>
              <div className={styles.divisorAmostraLongo}>
                <Divisor />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bloco}>
        <h2>Textura de papel</h2>
        <p className={styles.notaBloco}>
          Exibida aqui em opacidade 0.15 pra ficar visível na amostra — uso real
          previsto é bem mais sutil (~0.05).
        </p>
        <div className={styles.grade}>
          {CORES.map((cor) => (
            <div key={cor.nome} className={styles.celulaCor} style={{ color: `var(${cor.nome})` }}>
              <span className={styles.rotuloCor}>{cor.nome}</span>
              <div className={styles.linhaAmostras}>
                <div className={styles.texturaCaixaPequena}>
                  <TexturaPapel opacidade={0.15} />
                </div>
                <div className={styles.texturaCaixaMedia}>
                  <TexturaPapel opacidade={0.15} />
                </div>
                <div className={styles.texturaCaixaGrande}>
                  <TexturaPapel opacidade={0.15} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bloco}>
        <h2>Marca de rodapé</h2>
        <div className={styles.grade}>
          {CORES.map((cor) => (
            <div key={cor.nome} className={styles.celulaCor} style={{ color: `var(${cor.nome})` }}>
              <span className={styles.rotuloCor}>{cor.nome}</span>
              <div className={styles.linhaAmostras}>
                {TAMANHOS_MARCA.map((tamanho) => (
                  <MarcaRodape key={tamanho} tamanho={tamanho} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bloco}>
        <h2>Marcação de seção — escolha uma opção</h2>
        <div className={styles.opcoesMarcacao}>
          <div className={styles.opcaoMarcacao}>
            <h3>Opção A — búzio único</h3>
            {SECOES_EXEMPLO.map((nome) => (
              <div key={nome} className={styles.marcador}>
                <Buzio tamanho={18} className={styles.marcadorBuzio} />
                <span className={styles.marcadorTitulo}>{nome}</span>
              </div>
            ))}
          </div>
          <div className={styles.opcaoMarcacao}>
            <h3>Opção B — contagem em búzios</h3>
            {SECOES_EXEMPLO.map((nome, indice) => (
              <div key={nome} className={styles.marcador}>
                <span className={styles.marcadorContagem}>
                  {Array.from({ length: indice + 1 }).map((_, i) => (
                    <Buzio key={i} tamanho={14} className={styles.marcadorBuzio} />
                  ))}
                </span>
                <span className={styles.marcadorTitulo}>{nome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.bloco}>
        <h2>Botão &quot;Entrar&quot; e selo &quot;em breve&quot;</h2>
        <p className={styles.notaBloco}>Passe o mouse para ver o hover.</p>
        <div className={styles.linhaAmostras}>
          <a href="#entrar-demo" className={styles.entrarComCarimbo}>
            <Carimbo />
            <span>Entrar</span>
          </a>
          <span className={styles.seloComCarimbo}>
            <Carimbo />
            <span>Em breve</span>
          </span>
        </div>
      </section>
    </div>
  );
}
