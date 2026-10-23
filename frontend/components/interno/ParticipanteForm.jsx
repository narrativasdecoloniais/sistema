"use client";

import { useEffect, useRef, useState } from "react";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import BuscaUsuario from "./BuscaUsuario";
import SeletorSecoesAdmin from "./SeletorSecoesAdmin";
import { apiClient } from "@/lib/apiClient";
import { formatarIdentificacao } from "@/lib/identificacao";
import { participanteSchema, permissoesSecoesSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./ParticipanteForm.module.scss";

const valoresIniciais = { nome: "", email: "", acessoCompleto: false, secoesPermitidas: [] };
const MAX_PARECIDAS = 5;

async function buscarContas(termo) {
  const dados = await apiClient.get(`/usuarios/busca?termo=${encodeURIComponent(termo)}`);
  return dados?.usuarios || [];
}

// No convite, procura contas já cadastradas com o nome ou o e-mail digitados
// — a mesma pessoa pode já ter conta com outro e-mail (inscrição, Even3), e
// convidar criaria uma segunda conta.
function useContasParecidas(nome, email) {
  const [contas, setContas] = useState([]);
  const temporizadorRef = useRef(null);

  useEffect(() => {
    clearTimeout(temporizadorRef.current);
    const termoNome = nome.trim();
    const termoEmail = email.trim();
    const termos = [
      ...(termoNome.length >= 3 ? [termoNome] : []),
      ...(termoEmail.includes("@") ? [termoEmail] : []),
    ];
    if (termos.length === 0) {
      setContas([]);
      return undefined;
    }

    let cancelado = false;
    temporizadorRef.current = setTimeout(async () => {
      try {
        const listas = await Promise.all(termos.map(buscarContas));
        if (cancelado) return;
        const porId = new Map();
        // E-mail exato primeiro: é a mesma conta, não só um nome parecido.
        const emailAlvo = termoEmail.toLowerCase();
        listas
          .flat()
          .sort((a, b) => Number(b.email.toLowerCase() === emailAlvo) - Number(a.email.toLowerCase() === emailAlvo))
          .forEach((conta) => porId.set(conta.id, conta));
        setContas(Array.from(porId.values()).slice(0, MAX_PARECIDAS));
      } catch {
        if (!cancelado) setContas([]);
      }
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(temporizadorRef.current);
    };
  }, [nome, email]);

  return contas;
}

// Adicionar à equipe: conta já cadastrada (busca por nome/e-mail/CPF) ou
// convite por e-mail para quem ainda não tem conta. `idsEquipe` = quem já é
// organizador/admin — essas contas não entram de novo por aqui (permissões se
// editam na própria tabela).
export default function ParticipanteForm({ idsEquipe = [], aoSalvar, aoCancelar }) {
  const { notificar } = useToast();

  const [modo, setModo] = useState("conta");
  const [usuario, setUsuario] = useState(null);
  const [dados, setDados] = useState(valoresIniciais);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  const contasParecidas = useContasParecidas(modo === "convite" ? dados.nome : "", modo === "convite" ? dados.email : "");
  const emailDigitado = dados.email.trim().toLowerCase();

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function trocarModo(novoModo) {
    setModo(novoModo);
    setErros({});
    setErroGeral("");
  }

  function selecionarConta(conta) {
    setUsuario(conta);
    setErros({});
    setErroGeral("");
  }

  function usarContaExistente(conta) {
    selecionarConta(conta);
    setModo("conta");
  }

  const jaNaEquipe = Boolean(usuario && idsEquipe.includes(usuario.id));

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    if (modo === "conta") {
      if (!usuario) {
        setErros({ usuarioId: "Selecione uma conta" });
        return;
      }
      if (jaNaEquipe) return;
    }

    const resultado =
      modo === "conta" ? permissoesSecoesSchema.safeParse(dados) : participanteSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    if (!resultado.data.acessoCompleto && resultado.data.secoesPermitidas.length === 0) {
      setErroGeral("Marque pelo menos uma seção ou o acesso completo.");
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta =
        modo === "conta"
          ? await apiClient.patch(`/organizadores/${usuario.id}/organizador`, {
              acessoCompleto: resultado.data.acessoCompleto,
              secoesPermitidas: resultado.data.secoesPermitidas,
            })
          : await apiClient.post("/organizadores", resultado.data);
      notificar(`${resposta.organizador.nome} agora é organizador(a).`);
      aoSalvar(resposta.organizador);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>

      <div className={styles.alternador} role="radiogroup" aria-label="Como adicionar">
        <button
          type="button"
          role="radio"
          aria-checked={modo === "conta"}
          className={`${styles.opcaoAlternador} ${modo === "conta" ? styles.opcaoAtiva : ""}`}
          onClick={() => trocarModo("conta")}
        >
          Conta existente
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={modo === "convite"}
          className={`${styles.opcaoAlternador} ${modo === "convite" ? styles.opcaoAtiva : ""}`}
          onClick={() => trocarModo("convite")}
        >
          Convidar por e-mail
        </button>
      </div>

      {modo === "conta" ? (
        <>
          <BuscaUsuario
            id="buscaOrganizador"
            rotulo="Buscar por nome, e-mail ou CPF"
            usuarioSelecionado={usuario}
            onSelecionar={selecionarConta}
            erro={erros.usuarioId}
          />
          {jaNaEquipe ? (
            <p className={styles.aviso} role="alert">
              Esta pessoa já faz parte da equipe — ajuste as permissões dela na tabela.
            </p>
          ) : (
            <p className={styles.textoApoio}>
              Não encontrou? Use “Convidar por e-mail” para quem ainda não tem conta.
            </p>
          )}
        </>
      ) : (
        <>
          <Campo
            id="nome"
            rotulo="Nome completo"
            value={dados.nome}
            onChange={(evento) => atualizarCampo("nome", evento.target.value)}
            erro={erros.nome}
          />
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            value={dados.email}
            onChange={(evento) => atualizarCampo("email", evento.target.value)}
            erro={erros.email}
          />

          {contasParecidas.length > 0 ? (
            <div className={styles.parecidas} aria-live="polite">
              <p className={styles.parecidasTitulo}>
                Já existem contas parecidas. Se for a mesma pessoa, use a conta dela em vez de convidar.
              </p>
              <ul className={styles.parecidasLista}>
                {contasParecidas.map((conta) => {
                  const mesmoEmail = conta.email.toLowerCase() === emailDigitado;
                  const identificacao = formatarIdentificacao(conta);
                  return (
                    <li key={conta.id} className={styles.parecida}>
                      <div className={styles.parecidaDados}>
                        <span className={styles.parecidaNome}>
                          {conta.nome}
                          {mesmoEmail && <span className={styles.selo}>mesmo e-mail</span>}
                        </span>
                        <span className={styles.parecidaDetalhe}>
                          {conta.email}
                          {identificacao ? ` · ${identificacao}` : ""}
                        </span>
                      </div>
                      <Botao type="button" variante="secundario" onClick={() => usarContaExistente(conta)}>
                        Usar esta conta
                      </Botao>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className={styles.textoApoio}>
              Se o e-mail já tiver conta, ela é usada. Se não, enviamos um convite para a pessoa definir a senha.
            </p>
          )}
        </>
      )}

      <SeletorSecoesAdmin
        acessoCompleto={dados.acessoCompleto}
        secoesSelecionadas={dados.secoesPermitidas}
        onAlterarAcessoCompleto={(valor) => atualizarCampo("acessoCompleto", valor)}
        onAlterarSecoes={(valor) => atualizarCampo("secoesPermitidas", valor)}
      />
      <div className={styles.acoes}>
        <Botao type="button" variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando} disabled={jaNaEquipe}>
          Adicionar organizador
        </Botao>
      </div>
    </form>
  );
}
