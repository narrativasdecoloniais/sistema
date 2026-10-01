"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Botao from "@/components/forms/Botao";
import CampoSelect from "@/components/forms/CampoSelect";
import Alerta from "@/components/forms/Alerta";
import Modal from "./Modal";
import EditorEmail from "./EditorEmail";
import CampoTexto from "./CampoTexto";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { textoEmailSchema, extrairErros } from "@/lib/validacao";
import { valoresExemplo } from "@/lib/emailsMassa";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

// Envio de e-mail para pessoas selecionadas numa tabela (por enquanto, a aba
// Usuários de Participantes). destinatarios: [{ id, nome, email }] — contas.
// O texto parte de um modelo (ou em branco) e pode ser ajustado só para este
// envio; o envio em si roda em segundo plano no backend
// (emailsMassa.service.js) e é acompanhado na tela E-mails.
export default function EnviarEmailModal({ edicaoId, edicaoNome, destinatarios, onFechar, onEnviado }) {
  const { notificar } = useToast();
  const [modelos, setModelos] = useState([]);
  const [uso, setUso] = useState(null);
  const [modeloId, setModeloId] = useState("");
  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [salvandoModelo, setSalvandoModelo] = useState(false);
  // null = fechado; string = nome do novo modelo sendo digitado.
  const [nomeNovoModelo, setNomeNovoModelo] = useState(null);

  useEffect(() => {
    apiClient
      .get("/emails/modelos")
      .then((dados) => setModelos(dados?.modelos || []))
      .catch((erro) => setErroGeral(erro.message));
    apiClient
      .get("/emails/uso-mensal")
      .then(setUso)
      .catch(() => {});
  }, []);

  const total = destinatarios.length;
  const exemplo = valoresExemplo(destinatarios[0], edicaoNome);
  const percentualAposEnvio = uso ? ((uso.enviadosNoMes + total) / uso.limite) * 100 : 0;

  function escolherModelo(id) {
    setModeloId(id);
    const modelo = modelos.find((item) => item.id === id);
    setAssunto(modelo?.assunto || "");
    setCorpo(modelo?.corpo || "");
    setErros({});
  }

  function validar() {
    const resultado = textoEmailSchema.safeParse({ assunto, corpo });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return null;
    }
    setErros({});
    return resultado.data;
  }

  async function enviarTeste() {
    const texto = validar();
    if (!texto) return;
    setTestando(true);
    try {
      const resposta = await apiClient.post("/emails/teste", { ...texto, edicaoId });
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setTestando(false);
    }
  }

  async function salvarComoModelo() {
    const texto = validar();
    if (!texto) return;
    const nome = String(nomeNovoModelo || "").trim();
    if (nome.length < 3) {
      setErros({ nomeModelo: "Informe um nome para o modelo" });
      return;
    }
    setSalvandoModelo(true);
    try {
      const { modelo } = await apiClient.post("/emails/modelos", { ...texto, nome });
      setModelos((atuais) => [...atuais, modelo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setModeloId(modelo.id);
      setNomeNovoModelo(null);
      notificar(`Modelo "${modelo.nome}" salvo.`);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoModelo(false);
    }
  }

  function revisar() {
    if (validar()) setConfirmando(true);
  }

  async function enviar() {
    const texto = validar();
    if (!texto) return;
    setEnviando(true);
    try {
      const { envio } = await apiClient.post("/emails/envios", {
        ...texto,
        edicaoId,
        modeloId: modeloId || null,
        usuarioIds: destinatarios.map((destinatario) => destinatario.id),
      });
      notificar(
        `Envio iniciado para ${envio.total} ${envio.total === 1 ? "pessoa" : "pessoas"}${
          envio.ignorados > 0 ? ` (${envio.ignorados} ignoradas: conta inativa ou e-mail repetido)` : ""
        }. Acompanhe em E-mails.`
      );
      onEnviado?.();
      onFechar();
    } catch (erro) {
      setConfirmando(false);
      setErroGeral(erro.message);
      notificar(erro.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Enviar e-mail (${total} ${total === 1 ? "pessoa" : "pessoas"})`} onFechar={onFechar}>
      <div className={styles.formulario}>
        <Alerta>{erroGeral}</Alerta>
        {confirmando ? (
          <>
            <p className={styles.textoApoio}>
              <strong>{assunto}</strong> vai para {total} {total === 1 ? "pessoa" : "pessoas"}. O envio é feito aos poucos,
              em segundo plano, e pode ser acompanhado em{" "}
              <Link href={`/admin/edicoes/${edicaoId}/emails`}>E-mails</Link>.
            </p>
            {uso && (
              <p className={percentualAposEnvio >= 80 ? styles.aviso : styles.textoApoio}>
                Este mês já saíram {uso.enviadosNoMes} e-mails em massa; com este envio, {uso.enviadosNoMes + total} de{" "}
                {uso.limite} do plano do Resend. Os e-mails automáticos (inscrições, convites, resultado) também contam
                nesse limite.
              </p>
            )}
            <div className={styles.acoesFormulario}>
              <Botao type="button" variante="secundario" onClick={() => setConfirmando(false)} disabled={enviando}>
                Voltar
              </Botao>
              <Botao type="button" onClick={enviar} carregando={enviando}>
                Enviar para {total}
              </Botao>
            </div>
          </>
        ) : (
          <>
            <CampoSelect
              id="envio-modelo"
              rotulo="Modelo"
              value={modeloId}
              onChange={(evento) => escolherModelo(evento.target.value)}
            >
              <option value="">Em branco</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.nome}
                </option>
              ))}
            </CampoSelect>
            <p className={styles.textoApoio}>
              Mudanças no texto valem só para este envio — o modelo continua como está (edite-o em E-mails).
            </p>
            <EditorEmail
              idBase="envio"
              assunto={assunto}
              corpo={corpo}
              onAssunto={setAssunto}
              onCorpo={setCorpo}
              erros={erros}
              exemplo={exemplo}
            />
            {nomeNovoModelo !== null && (
              <div className={styles.formulario}>
                <CampoTexto
                  id="envio-nome-modelo"
                  rotulo="Nome do novo modelo"
                  value={nomeNovoModelo}
                  onChange={(evento) => setNomeNovoModelo(evento.target.value)}
                  erro={erros.nomeModelo}
                />
                <div className={styles.acoesFormulario}>
                  <Botao type="button" variante="secundario" onClick={() => setNomeNovoModelo(null)}>
                    Cancelar
                  </Botao>
                  <Botao type="button" onClick={salvarComoModelo} carregando={salvandoModelo}>
                    Salvar modelo
                  </Botao>
                </div>
              </div>
            )}
            <div className={styles.acoesFormulario}>
              {nomeNovoModelo === null && (
                <Botao type="button" variante="secundario" onClick={() => setNomeNovoModelo(assunto.slice(0, 120))}>
                  Salvar como novo modelo
                </Botao>
              )}
              <Botao type="button" variante="secundario" onClick={enviarTeste} carregando={testando}>
                Enviar teste para mim
              </Botao>
              <Botao type="button" onClick={revisar}>
                Revisar e enviar
              </Botao>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
