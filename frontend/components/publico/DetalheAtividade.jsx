import Link from "next/link";
import Divisor from "@/components/graficos/Divisor";
import Marcador from "@/components/publico/Marcador";
import FaixaLateral from "@/components/publico/FaixaLateral";
import { agruparPessoasPorTipoParticipacao, formatarPeriodoAtividade } from "@/lib/publico";
import { estiloCoresPersonalizadas } from "@/lib/cores";
import styles from "./DetalheAtividade.module.scss";

// Compartilhado por /atividades/[slug] (edição atual) e
// /edicoes/[slug]/atividades/[atividadeSlug] (qualquer edição) —
// `permiteInscricao` é a única diferença de comportamento entre as duas:
// inscrição só faz sentido pra edição atual, mas descrição, pessoas
// envolvidas e horário continuam visíveis pra qualquer edição.
export default function DetalheAtividade({ atividade, permiteInscricao }) {
  const subtitulo = [
    atividade.local,
    atividade.cargaHoraria ? `${atividade.cargaHoraria}h` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Aparência (cor de fundo/texto/búzio + faixa lateral) é compartilhada por
  // TODAS as páginas de atividade, definida uma única vez na edição-mãe (ver
  // Página do evento > Atividades) — nunca por atividade individual.
  // `atividade.edicao` só vem preenchido nas rotas públicas (buscarPorSlug),
  // não no admin.
  const edicao = atividade.edicao || {};
  const corFundo = edicao.corFundoAtividades || "PAPEL";
  const opacidadeFundo = edicao.opacidadeFundoAtividades ?? 100;
  const corTexto = edicao.corTextoAtividades || "TINTA";
  const corBuzio = edicao.corBuzioAtividades || "BARRO";
  const mostrarFaixa = edicao.mostrarFaixaAtividades ?? true;

  const faixaHeroTipoDesktop = edicao.faixaHeroTipoDesktop || "COR";
  const corFaixaHeroDesktop = edicao.corFaixaHeroDesktop || "OCRE";
  const imagemFaixaHeroDesktop = edicao.imagemFaixaHeroDesktop;
  const larguraFaixaHeroDesktop = edicao.larguraFaixaHeroDesktop ?? 96;
  const faixaHeroTipoMobile = edicao.faixaHeroTipoMobile || "COR";
  const corFaixaHeroMobile = edicao.corFaixaHeroMobile || "OCRE";
  const imagemFaixaHeroMobile = edicao.imagemFaixaHeroMobile;
  const larguraFaixaHeroMobile = edicao.larguraFaixaHeroMobile ?? 40;

  const estiloFaixaLateral = {
    ...(imagemFaixaHeroDesktop
      ? { "--imagem-faixa-hero-desktop": `url(${imagemFaixaHeroDesktop})` }
      : {}),
    ...(imagemFaixaHeroMobile
      ? { "--imagem-faixa-hero-mobile": `url(${imagemFaixaHeroMobile})` }
      : {}),
    "--largura-faixa-hero-mobile-valor": `${larguraFaixaHeroMobile}px`,
    "--largura-faixa-hero-desktop-valor": `${larguraFaixaHeroDesktop}px`,
    ...estiloCoresPersonalizadas({
      "--cor-faixa-hero-desktop": corFaixaHeroDesktop,
      "--cor-faixa-hero-mobile": corFaixaHeroMobile,
    }),
  };

  // Zera a largura por eixo quando a seção não exibe a faixa (mostrarFaixa)
  // ou quando o Hero não tem faixa configurada pro breakpoint em questão
  // (tipo "NENHUMA") — sem isso o padding continuava reservando o espaço da
  // faixa mesmo com ela escondida (ver mesmo ajuste em PaginaInicialConteudo.jsx).
  const estiloPagina = {
    "--opacidade-fundo-secao": `${opacidadeFundo}%`,
    ...estiloFaixaLateral,
    "--largura-faixa-hero-mobile-valor":
      mostrarFaixa && faixaHeroTipoMobile !== "NENHUMA"
        ? estiloFaixaLateral["--largura-faixa-hero-mobile-valor"]
        : "0px",
    "--largura-faixa-hero-desktop-valor":
      mostrarFaixa && faixaHeroTipoDesktop !== "NENHUMA"
        ? estiloFaixaLateral["--largura-faixa-hero-desktop-valor"]
        : "0px",
    ...estiloCoresPersonalizadas({
      "--cor-fundo-secao-base": corFundo,
      "--cor-texto-secao": corTexto,
      "--cor-buzio-secao": corBuzio,
    }),
  };

  return (
    <article
      className={styles.pagina}
      data-cor-fundo={corFundo}
      data-cor-texto={corTexto}
      data-cor-buzio={corBuzio}
      style={estiloPagina}
    >
      {mostrarFaixa && (
        <FaixaLateral
          estilo={estiloFaixaLateral}
          corDesktop={corFaixaHeroDesktop}
          corMobile={corFaixaHeroMobile}
          tipoDesktop={faixaHeroTipoDesktop}
          tipoMobile={faixaHeroTipoMobile}
        />
      )}
      <div className={styles.paginaConteudo}>
        <Marcador />
        <div className={styles.paginaCorpo}>
          <header className={styles.cabecalho}>
            <span className={styles.eyebrow}>{atividade.tipoAtividade.nome}</span>
            <h1 className={`${styles.titulo} stencil`}>{atividade.nome}</h1>
            {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
          </header>

          <Divisor className={styles.divisor} />

          {atividade.descricao && (
            <section className={styles.secaoTexto}>
              <h2 className={styles.subtituloSecao}>Sobre a atividade</h2>
              <p>{atividade.descricao}</p>
            </section>
          )}

          {atividade.pessoas.length > 0 &&
            agruparPessoasPorTipoParticipacao(atividade.pessoas).map((grupo) => (
              <section key={grupo.rotulo} className={styles.secaoTexto}>
                <h2 className={styles.subtituloSecao}>{grupo.rotulo}</h2>
                <ul className={styles.convidadosGrade}>
                  {grupo.pessoas.map((pessoa) => (
                    <li key={pessoa.id} className={styles.convidadoCartao}>
                      <div
                        className={styles.convidadoFoto}
                        aria-hidden={pessoa.imagem ? undefined : "true"}
                      >
                        {pessoa.imagem ? (
                          <img src={pessoa.imagem} alt="" className={styles.convidadoImagem} />
                        ) : (
                          <span className={styles.convidadoInicial}>
                            {pessoa.nome.trim().charAt(0)}
                          </span>
                        )}
                      </div>
                      <p className={styles.convidadoNome}>{pessoa.nome}</p>
                      {pessoa.breveDescricao && (
                        <p className={styles.convidadoDescricao}>{pessoa.breveDescricao}</p>
                      )}
                      {pessoa.descricao && (
                        <p className={styles.convidadoDescricao}>{pessoa.descricao}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

          <section className={styles.secaoTexto}>
            <h2 className={styles.subtituloSecao}>Quando e inscrição</h2>
            <ul className={styles.sessoesLista}>
              <li className={styles.sessaoItem}>
                <div className={styles.sessaoInfoBloco}>
                  <span className={styles.sessaoInfo}>
                    Quando: {formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade)}
                  </span>
                  <span className={styles.sessaoVagas}>
                    {!atividade.exigeInscricao
                      ? "Sem inscrição necessária"
                      : atividade.semLimiteVagas
                        ? "Vagas ilimitadas"
                        : `${atividade.vagas} vagas`}
                  </span>
                </div>
                {atividade.exigeInscricao &&
                  (permiteInscricao ? (
                    <Link href={`/inscricao?atividade=${atividade.slug}`} className={styles.sessaoCta}>
                      Inscreva-se
                    </Link>
                  ) : (
                    <span className={styles.sessaoEncerrada}>Inscrições encerradas</span>
                  ))}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}
