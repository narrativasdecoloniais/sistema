import Carimbo from "@/components/graficos/Carimbo";
import BuziosSimbolos from "@/components/publico/buzios/BuziosSimbolos";
import {
  FASES_CRONOGRAMA,
  MODULOS_PROJETO,
  PLANO_PAGAMENTO,
  ROTULO_STATUS,
  STATUS,
  calcularProgressoModulos,
  calcularValorPago,
  formatarReal,
} from "@/lib/cronogramaProjeto";
import styles from "./cronograma.module.scss";

export const metadata = {
  title: "Andamento do projeto — Narrativas",
  robots: { index: false, follow: false },
};

// mesmas três conchas ilustradas usadas no site de verdade (cursor de
// rolagem da nav, rodapé, cluster que "cai" na home) — ver
// components/publico/buzios/BuziosSimbolos.jsx
const BUZIO_SIMBOLOS = {
  1: { id: "buzio-simbolo-1", viewBox: "0 0 164 182" },
  2: { id: "buzio-simbolo-2", viewBox: "0 0 148 197" },
  3: { id: "buzio-simbolo-3", viewBox: "0 0 152 196" },
};

function BuzioIlustrado({ variante = 1, tamanho = 24, className = "" }) {
  const { id, viewBox } = BUZIO_SIMBOLOS[variante];
  const [, , largura, altura] = viewBox.split(" ").map(Number);
  return (
    <svg
      viewBox={viewBox}
      width={tamanho}
      height={(tamanho * altura) / largura}
      className={className}
      aria-hidden="true"
    >
      <use href={`#${id}`} width="100%" height="100%" />
    </svg>
  );
}

function Marcador() {
  return (
    <div className={styles.marcador} aria-hidden="true">
      <BuzioIlustrado variante={1} tamanho={18} className={styles.marcadorBuzio} />
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

const CLASSE_SELO = {
  [STATUS.CONCLUIDO]: styles.seloConcluido,
  [STATUS.EM_ANDAMENTO]: styles.seloEmAndamento,
  [STATUS.PLANEJADO]: styles.seloPlanejado,
};

function Selo({ status }) {
  return (
    <span className={`${styles.selo} ${CLASSE_SELO[status]}`}>
      <Carimbo className={styles.seloCarimbo} preenchido />
      <span>{ROTULO_STATUS[status]}</span>
    </span>
  );
}

const CLASSE_STATUS_ITEM = {
  [STATUS.CONCLUIDO]: styles.itemStatusConcluido,
  [STATUS.EM_ANDAMENTO]: styles.itemStatusEmAndamento,
  [STATUS.PLANEJADO]: styles.itemStatusPlanejado,
};

const CLASSE_BORDA_ITEM = {
  [STATUS.CONCLUIDO]: styles.itemConcluido,
  [STATUS.EM_ANDAMENTO]: styles.itemEmAndamento,
  [STATUS.PLANEJADO]: styles.itemPlanejado,
};

function ItemModulo({ item }) {
  return (
    <li className={`${styles.item} ${CLASSE_BORDA_ITEM[item.status]}`}>
      <div className={styles.itemLinha}>
        <span className={styles.itemTitulo}>{item.titulo}</span>
        <span className={`${styles.itemStatus} ${CLASSE_STATUS_ITEM[item.status]}`}>
          {ROTULO_STATUS[item.status]}
        </span>
        {item.bastidor && <span className={styles.tagBastidor}>trabalho de bastidor</span>}
      </div>
      {item.descricao && <p className={styles.itemDescricao}>{item.descricao}</p>}
    </li>
  );
}

function CartaoModulo({ modulo }) {
  return (
    <article className={styles.moduloCartao}>
      <header className={styles.moduloCabecalho}>
        <div className={styles.moduloTitulos}>
          <span className={styles.moduloNumero}>Módulo {modulo.numero}</span>
          <h3 className={styles.moduloNome}>{modulo.nome}</h3>
        </div>
        <div className={styles.moduloMeta}>
          <span className={styles.moduloMes}>{modulo.mes}</span>
          <Selo status={modulo.status} />
        </div>
      </header>
      <p className={styles.moduloResumo}>{modulo.resumo}</p>
      <ul className={styles.listaItens}>
        {modulo.itens.map((item) => (
          <ItemModulo key={item.titulo} item={item} />
        ))}
      </ul>
      {modulo.nota && <p className={styles.moduloNota}>{modulo.nota}</p>}
    </article>
  );
}

export default function Cronograma() {
  const progresso = calcularProgressoModulos(MODULOS_PROJETO);
  const valorPago = calcularValorPago(PLANO_PAGAMENTO);

  return (
    <div className={styles.pagina}>
      <BuziosSimbolos />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Painel do projeto — para Ana Tereza</span>
        <h1 className={styles.tituloPrincipal}>Andamento do sistema</h1>
        <p className={styles.introducao}>
          Esta página acompanha, módulo a módulo, o que já foi entregue do Sistema de Gestão Narrativas e o que
          ainda está por vir, na mesma ordem da proposta assinada em julho de 2026. Em cada módulo, além do que
          aparece na tela, listo também o trabalho de bastidor — servidor, banco de dados, e-mail, segurança —
          que sustenta o que você já viu funcionar.
        </p>
        <p className={styles.resumoProgresso}>
          {progresso.concluidos} de {progresso.total} módulos concluídos · {progresso.emAndamento} em andamento ·{" "}
          {formatarReal(valorPago)} pagos de {formatarReal(PLANO_PAGAMENTO.valorTotal)}
        </p>
      </header>

      <Secao eyebrow="Pagamento" titulo="Cronograma financeiro">
        <p className={styles.texto}>
          Forma de pagamento escolhida no aceite: <strong>{PLANO_PAGAMENTO.opcao}</strong>, com{" "}
          {formatarReal(PLANO_PAGAMENTO.valorTotal)} distribuídos ao longo do desenvolvimento.
        </p>
        <div className={styles.tabelaPagamentoMoldura}>
          <table className={styles.tabelaPagamento}>
            <thead>
              <tr>
                <th scope="col">Momento</th>
                <th scope="col">Data</th>
                <th scope="col">Valor</th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {PLANO_PAGAMENTO.parcelas.map((parcela) => (
                <tr key={`${parcela.momento}-${parcela.data}`}>
                  <td>{parcela.momento}</td>
                  <td>{parcela.data}</td>
                  <td>{formatarReal(parcela.valor)}</td>
                  <td>
                    <span
                      className={`${styles.situacaoPagamento} ${
                        parcela.pago ? styles.situacaoPaga : styles.situacaoPendente
                      }`}
                    >
                      {parcela.pago ? "Pago" : "A pagar"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      {FASES_CRONOGRAMA.map((fase) => (
        <Secao key={fase.numero} eyebrow={fase.periodo} titulo={fase.nome}>
          <p className={styles.texto}>{fase.objetivo}</p>
          <div className={styles.listaModulos}>
            {MODULOS_PROJETO.filter((modulo) => modulo.fase === fase.numero).map((modulo) => (
              <CartaoModulo key={modulo.numero} modulo={modulo} />
            ))}
          </div>
        </Secao>
      ))}

      <section className={styles.fechamento}>
        <p className={styles.texto}>
          Qualquer dúvida sobre um módulo específico ou sobre os prazos, é só me chamar — atualizo esta página
          conforme o trabalho avança.
        </p>
      </section>
    </div>
  );
}
