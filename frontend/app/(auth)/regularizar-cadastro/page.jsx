"use client";

import { useState } from "react";
import Link from "next/link";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import Campo from "@/components/forms/Campo";
import CampoIdentificacao from "@/components/forms/CampoIdentificacao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { buscaRegularizacaoSchema, planoRegularizacaoSchema, extrairErros } from "@/lib/validacao";
import styles from "@/components/publico/TelaAutenticacao.module.scss";
import { IDENTIFICACAO_INICIAL, payloadIdentificacao } from "@/lib/identificacao";
import estilos from "./page.module.scss";

// Temporária (edição V): quem tem conta importada do Even3 (sem CPF) acha a
// conta pelo nome e vincula o CPF, ou unifica com a conta criada pela
// inscrição. O código vai só para o e-mail da conta sem CPF — ver
// backend/src/services/regularizacaoContas.service.js. "CPF" aqui vale também
// para o documento de estrangeiro.
export default function PaginaRegularizarCadastro() {
  const [etapa, setEtapa] = useState("busca"); // busca → selecao → codigo → concluido
  const [nome, setNome] = useState("");
  const [contas, setContas] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [identificacao, setIdentificacao] = useState(IDENTIFICACAO_INICIAL);
  const [manterId, setManterId] = useState("");
  const [plano, setPlano] = useState(null);
  const [codigos, setCodigos] = useState({});
  const [concluido, setConcluido] = useState(null);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const contasSelecionadas = contas.filter((conta) => selecionadas.includes(conta.id));
  const duasSemCpf = contasSelecionadas.length === 2 && contasSelecionadas.every((conta) => !conta.temIdentificacao);
  const umaComCpf = contasSelecionadas.length === 1 && contasSelecionadas[0].temIdentificacao;

  async function executar(acao) {
    setMensagem("");
    setCarregando(true);
    try {
      await acao();
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function buscar(evento) {
    evento.preventDefault();
    const resultado = buscaRegularizacaoSchema.safeParse({ nome });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    executar(async () => {
      const resposta = await apiClient.post("/publico/regularizacao/buscar", resultado.data);
      setContas(resposta.contas);
      setSelecionadas([]);
      setPlano(null);
      setEtapa("selecao");
    });
  }

  function alternarConta(id) {
    setPlano(null);
    setSelecionadas((atual) => {
      if (atual.includes(id)) return atual.filter((item) => item !== id);
      return atual.length >= 2 ? atual : [...atual, id];
    });
  }

  function dadosDoPlano() {
    return {
      contaIds: selecionadas,
      ...payloadIdentificacao(identificacao),
      ...(duasSemCpf ? { manterId } : {}),
    };
  }

  function validarPlano() {
    const resultado = planoRegularizacaoSchema.safeParse(dadosDoPlano());
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return null;
    }
    if (duasSemCpf && !manterId) {
      setErros({ manterId: "Escolha qual e-mail vai continuar valendo" });
      return null;
    }
    setErros({});
    return resultado.data;
  }

  function verPlano(evento) {
    evento.preventDefault();
    const dados = validarPlano();
    if (!dados) return;
    executar(async () => {
      const resposta = await apiClient.post("/publico/regularizacao/previa", dados);
      setPlano(resposta.plano);
    });
  }

  function enviarCodigos() {
    const dados = validarPlano();
    if (!dados) return;
    executar(async () => {
      const resposta = await apiClient.post("/publico/regularizacao/codigos", dados);
      setPlano(resposta.plano);
      setCodigos({});
      setEtapa("codigo");
    });
  }

  function confirmar(evento) {
    evento.preventDefault();
    const faltando = plano.contasComCodigo.find((conta) => !(codigos[conta.id] || "").trim());
    if (faltando) {
      setErros({ [`codigo-${faltando.id}`]: "Informe o código enviado por e-mail" });
      return;
    }
    setErros({});
    executar(async () => {
      const resposta = await apiClient.post("/publico/regularizacao/confirmar", { ...dadosDoPlano(), codigos });
      setConcluido(resposta);
      setEtapa("concluido");
    });
  }

  function recomecar() {
    setEtapa("busca");
    setContas([]);
    setSelecionadas([]);
    setPlano(null);
    setCodigos({});
    setErros({});
    setMensagem("");
  }

  return (
    <TelaAutenticacao
      eyebrow="Área do participante"
      titulo="Regularizar cadastro"
      subtitulo="Para quem tem conta vinda do Even3 (sem CPF) ou ficou com duas contas: encontre as suas pelo nome e deixe tudo numa conta só, com o seu CPF (ou documento, se for estrangeiro)."
    >
      {etapa === "busca" && (
        <form onSubmit={buscar} className={styles.formulario}>
          <Alerta>{mensagem}</Alerta>
          <Campo
            id="nome"
            rotulo="Nome completo"
            variante="minimal"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            erro={erros.nome}
          />
          <button type="submit" className={styles.cta} disabled={carregando}>
            {carregando ? "Aguarde..." : "Buscar minhas contas"}
          </button>
          <p className={styles.rodape}>
            <Link href="/login">Voltar para o login</Link>
          </p>
        </form>
      )}

      {etapa === "selecao" && (
        <form onSubmit={verPlano} className={styles.formulario}>
          <Alerta>{mensagem}</Alerta>
          {contas.length === 0 ? (
            <p className={estilos.texto}>
              Não encontramos contas parecidas com esse nome. Tente escrever o nome como no cadastro do Even3 ou fale
              com a organização do evento.
            </p>
          ) : (
            <>
              <p className={estilos.texto}>Marque a sua conta (ou as duas, se forem ambas suas):</p>
              <ul className={estilos.listaContas}>
                {contas.map((conta) => {
                  const marcada = selecionadas.includes(conta.id);
                  return (
                    <li key={conta.id}>
                      <label className={`${estilos.cartao} ${marcada ? estilos.cartaoMarcado : ""}`}>
                        <input
                          type="checkbox"
                          className={estilos.checkbox}
                          checked={marcada}
                          disabled={!marcada && selecionadas.length >= 2}
                          onChange={() => alternarConta(conta.id)}
                        />
                        <span className={estilos.cartaoCorpo}>
                          <span className={estilos.cartaoNome}>{conta.nome}</span>
                          <span className={estilos.cartaoEmail}>{conta.email}</span>
                          <span className={estilos.selo}>{conta.temIdentificacao ? "Com CPF/documento" : "Sem CPF (Even3)"}</span>
                          {conta.titulos.length > 0 && (
                            <span className={estilos.titulos}>
                              {conta.titulos.map((titulo) => (
                                <span key={titulo}>{titulo}</span>
                              ))}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {umaComCpf && (
            <p className={estilos.texto}>
              Essa conta já tem CPF ou documento — é só <Link href="/login">entrar</Link> ou{" "}
              <Link href="/recuperar-senha">recuperar a senha</Link>. Se você também tem uma conta sem CPF, marque as
              duas.
            </p>
          )}

          {selecionadas.length > 0 && !umaComCpf && (
            <>
              <CampoIdentificacao
                id="regularizacao"
                rotuloCpf="Seu CPF"
                variante="minimal"
                valor={identificacao}
                onChange={(novo) => {
                  setIdentificacao(novo);
                  setPlano(null);
                }}
                erros={erros}
              />
              {duasSemCpf && (
                <fieldset className={estilos.escolha}>
                  <legend className={estilos.texto}>Qual e-mail vai continuar valendo para entrar?</legend>
                  {contasSelecionadas.map((conta) => (
                    <label key={conta.id} className={estilos.opcao}>
                      <input
                        type="radio"
                        name="manterId"
                        checked={manterId === conta.id}
                        onChange={() => {
                          setManterId(conta.id);
                          setPlano(null);
                        }}
                      />
                      <span className={estilos.cartaoEmail}>{conta.email}</span>
                    </label>
                  ))}
                  {erros.manterId && <p className={estilos.erro}>{erros.manterId}</p>}
                </fieldset>
              )}
            </>
          )}

          {plano && <ResumoPlano plano={plano} />}

          {selecionadas.length > 0 && !umaComCpf && (
            plano && plano.bloqueios.length === 0 ? (
              <button type="button" className={styles.cta} disabled={carregando} onClick={enviarCodigos}>
                {carregando ? "Aguarde..." : "Enviar código por e-mail"}
              </button>
            ) : (
              <button type="submit" className={styles.cta} disabled={carregando}>
                {carregando ? "Aguarde..." : "Continuar"}
              </button>
            )
          )}
          <button type="button" className={styles.linkBotao} onClick={recomecar}>
            Buscar outro nome
          </button>
        </form>
      )}

      {etapa === "codigo" && plano && (
        <form onSubmit={confirmar} className={styles.formulario}>
          <Alerta>{mensagem}</Alerta>
          <p className={estilos.texto}>
            Enviamos um código para o e-mail {plano.contasComCodigo.length > 1 ? "de cada conta" : "da conta"} sem CPF.
            Ele vale por 30 minutos — confira também o spam.
          </p>
          {plano.contasComCodigo.map((conta) => (
            <Campo
              key={conta.id}
              id={`codigo-${conta.id}`}
              rotulo={`Código enviado para ${conta.email}`}
              variante="minimal"
              autoComplete="one-time-code"
              value={codigos[conta.id] || ""}
              onChange={(evento) =>
                setCodigos((atual) => ({ ...atual, [conta.id]: evento.target.value.toUpperCase() }))
              }
              erro={erros[`codigo-${conta.id}`]}
            />
          ))}
          <button type="submit" className={styles.cta} disabled={carregando}>
            {carregando ? "Aguarde..." : "Confirmar"}
          </button>
          <button type="button" className={styles.linkBotao} disabled={carregando} onClick={enviarCodigos}>
            Reenviar código
          </button>
        </form>
      )}

      {etapa === "concluido" && concluido && (
        <div className={styles.formulario}>
          <Alerta tipo="sucesso">
            {concluido.tipo === "UNIFICAR" ? "Contas unificadas" : "Identificação vinculada"} com sucesso. Sua conta agora usa o
            e-mail {concluido.email} e o seu CPF (ou documento).
          </Alerta>
          <p className={estilos.texto}>
            Entre com o seu CPF (ou documento). Se ainda não tem senha, use &quot;Esqueci minha senha&quot; para criar uma.
          </p>
          <Link href="/login" className={`${styles.cta} ${estilos.ctaLink}`}>
            Entrar
          </Link>
          <p className={styles.rodape}>
            <Link href="/recuperar-senha">Esqueci minha senha</Link>
          </p>
        </div>
      )}
    </TelaAutenticacao>
  );
}

function ResumoPlano({ plano }) {
  return (
    <div className={estilos.resumo}>
      {plano.bloqueios.length > 0 ? (
        <Alerta>{plano.bloqueios.join(" ")} Se precisar, fale com a organização do evento.</Alerta>
      ) : (
        <p className={estilos.texto}>
          {plano.tipo === "UNIFICAR"
            ? `As duas contas vão virar uma só, com o e-mail ${plano.emailFinal} e o seu CPF (ou documento).`
            : `O seu CPF (ou documento) será vinculado à conta com o e-mail ${plano.emailFinal}.`}{" "}
          Para confirmar, vamos enviar um código para {plano.contasComCodigo.map((conta) => conta.email).join(" e ")}.
        </p>
      )}
      {plano.avisos.map((aviso) => (
        <p key={aviso} className={estilos.aviso}>
          {aviso}
        </p>
      ))}
    </div>
  );
}
