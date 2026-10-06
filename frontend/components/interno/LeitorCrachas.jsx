"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, CircleCheck, Info, Undo2, UserCheck } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CampoSelect from "@/components/forms/CampoSelect";
import Avatar from "./Avatar";
import BuscaUsuario from "./BuscaUsuario";
import LeitorQrCode from "./LeitorQrCode";
import { useToast } from "./ToastProvider";
import { formatarPeriodoAtividade } from "@/lib/publico";
import { credenciamentoAdmin, ehTokenCracha, extrairTokenDoQr } from "@/lib/credenciamento";
import styles from "./LeitorCrachas.module.scss";

// A câmera continua ligada: o mesmo crachá lido de novo dentro deste intervalo
// é ignorado (a pessoa ainda está na frente da câmera).
const INTERVALO_REPETICAO = 6000;
// Quanto tempo o resultado fica na tela antes de liberar a próxima leitura.
const DURACAO_RESULTADO = { REGISTRADO: 4000, JA_REGISTRADO: 3000, ERRO: 3500, DESFEITO: 2000 };

function formatarDataHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function vibrar(padrao) {
  try {
    navigator.vibrate?.(padrao);
  } catch {
    // Sem vibração (iOS, desktop): o resultado na tela basta.
  }
}

const TITULOS = {
  evento: { REGISTRADO: "Credenciado(a)", JA_REGISTRADO: "Já estava credenciado(a)", DESFEITO: "Credenciamento desfeito" },
  atividade: { REGISTRADO: "Presença registrada", JA_REGISTRADO: "Presença já registrada", DESFEITO: "Presença removida" },
};

// Leitor de crachás da equipe (seção CREDENCIAMENTO): lê o crachá virtual do
// participante e credencia no evento ou registra a presença na atividade
// escolhida. As regras moram no backend (credenciamento.service.js,
// lerNaEquipe); aqui só há o fluxo de tela: resultado em destaque, "Desfazer"
// por alguns segundos e a busca pelo nome de reserva.
export default function LeitorCrachas({ edicao, atividades }) {
  const { notificar } = useToast();
  const [atividadeId, setAtividadeId] = useState("");
  const [resultado, setResultado] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [desfazendo, setDesfazendo] = useState(false);
  const [registros, setRegistros] = useState(0);
  const [selecionado, setSelecionado] = useState(null);
  const ultimaLeituraRef = useRef({ texto: "", em: 0 });
  const ocupadoRef = useRef(false);

  const atividade = atividades.find((item) => item.id === atividadeId) || null;
  const modo = atividade ? "atividade" : "evento";
  ocupadoRef.current = processando || Boolean(resultado);

  useEffect(() => {
    const duracao = resultado && DURACAO_RESULTADO[resultado.resultado];
    if (!duracao || desfazendo) return undefined;
    const temporizador = setTimeout(() => setResultado(null), duracao);
    return () => clearTimeout(temporizador);
  }, [resultado, desfazendo]);

  function trocarModo(valor) {
    setAtividadeId(valor);
    setResultado(null);
    ultimaLeituraRef.current = { texto: "", em: 0 };
  }

  async function ler(dados) {
    setProcessando(true);
    try {
      const resposta = await credenciamentoAdmin.ler(edicao.id, { ...dados, atividadeId: atividadeId || undefined });
      setResultado({ ...resposta, dados });
      if (resposta.resultado === "REGISTRADO") {
        setRegistros((total) => total + 1);
        vibrar(80);
        notificar(resposta.mensagem);
      } else {
        vibrar([40, 60, 40]);
      }
      return true;
    } catch (falha) {
      setResultado({ resultado: "ERRO", mensagem: falha.message });
      vibrar(250);
      notificar(falha.message, "erro");
      return false;
    } finally {
      setProcessando(false);
    }
  }

  function aoLer(texto) {
    if (ocupadoRef.current) return;
    const valor = String(texto || "").trim();
    const agora = Date.now();
    const ultima = ultimaLeituraRef.current;
    if (valor === ultima.texto && agora - ultima.em < INTERVALO_REPETICAO) return;
    ultimaLeituraRef.current = { texto: valor, em: agora };

    if (!ehTokenCracha(valor)) {
      setResultado({
        resultado: "ERRO",
        mensagem: extrairTokenDoQr(valor)
          ? "Este é o QR code afixado no evento ou numa atividade, não o crachá de um participante."
          : "Este QR code não é um crachá do Narrativas.",
      });
      vibrar(250);
      return;
    }
    ler({ token: valor });
  }

  async function registrarSelecionado() {
    if (await ler({ usuarioId: selecionado.id })) setSelecionado(null);
  }

  async function desfazer() {
    const { pessoa } = resultado;
    setDesfazendo(true);
    try {
      const resposta = atividade
        ? await credenciamentoAdmin.removerPresenca(edicao.id, atividade.id, pessoa.id)
        : await credenciamentoAdmin.desfazer(edicao.id, pessoa.id);
      setRegistros((total) => Math.max(0, total - 1));
      setResultado({ resultado: "DESFEITO", pessoa, mensagem: resposta.mensagem });
      notificar(resposta.mensagem);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setDesfazendo(false);
    }
  }

  function tituloResultado() {
    if (resultado.resultado === "CONFIRMAR") return "Confirme a presença";
    if (resultado.resultado === "ERRO") return "Não foi possível";
    return TITULOS[modo][resultado.resultado];
  }

  const tom =
    resultado?.resultado === "REGISTRADO"
      ? "sucesso"
      : resultado?.resultado === "ERRO"
        ? "erro"
        : resultado?.resultado === "DESFEITO"
          ? "neutro"
          : "alerta";
  const IconeResultado = tom === "sucesso" ? CircleCheck : tom === "erro" ? CircleAlert : Info;
  const rotuloAcao = atividade ? "Registrar presença" : "Credenciar";

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <Link href={`/admin/edicoes/${edicao.id}/credenciamento`} className={styles.voltar}>
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          Credenciamento
        </Link>
        <h1 className={styles.titulo}>Leitor de crachás</h1>
        <p className={styles.apoio}>{edicao.nome}</p>
      </header>

      <CampoSelect id="modo-leitura" rotulo="O que registrar" value={atividadeId} onChange={(evento) => trocarModo(evento.target.value)}>
        <option value="">Credenciamento no evento</option>
        {atividades.length > 0 && (
          <optgroup label="Presença em atividade">
            {atividades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.janela?.aberta ? "Agora · " : ""}
                {item.nome} — {formatarPeriodoAtividade(item.inicioAtividade, item.fimAtividade)}
              </option>
            ))}
          </optgroup>
        )}
      </CampoSelect>

      <section className={styles.leitor} aria-label="Leitura do crachá">
        <LeitorQrCode continuo rotuloIniciar="Abrir câmera" aoLer={aoLer} />
        <p className={styles.apoio}>
          {processando
            ? "Registrando..."
            : `${registros} ${registros === 1 ? "registro" : "registros"} neste aparelho desde que a página abriu.`}
        </p>
      </section>

      <section className={styles.busca} aria-label="Registrar sem crachá">
        <BuscaUsuario
          id="leitor-busca"
          rotulo="Sem crachá? Busque pelo nome, e-mail ou CPF"
          usuarioSelecionado={selecionado}
          onSelecionar={setSelecionado}
        />
        {selecionado && (
          <div>
            <Botao type="button" carregando={processando} onClick={registrarSelecionado}>
              <UserCheck size={18} strokeWidth={1.5} aria-hidden="true" />
              {rotuloAcao}
            </Botao>
          </div>
        )}
      </section>

      <div className={styles.areaPainel} role="status" aria-live="polite">
        {resultado && (
          <div className={`${styles.painel} ${styles[tom]}`}>
            <p className={styles.painelTitulo}>
              <IconeResultado size={22} strokeWidth={1.5} aria-hidden="true" />
              {tituloResultado()}
            </p>

            {resultado.pessoa && (
              <div className={styles.pessoa}>
                <Avatar usuario={resultado.pessoa} tamanho={64} />
                <div className={styles.pessoaTexto}>
                  <p className={styles.nome}>{resultado.pessoa.nome}</p>
                  <p className={styles.apoio}>{resultado.pessoa.documento || "Sem documento cadastrado"}</p>
                </div>
              </div>
            )}

            <p className={styles.mensagem}>
              {resultado.mensagem}
              {resultado.resultado === "JA_REGISTRADO" && resultado.registradoEm
                ? ` Desde ${formatarDataHora(resultado.registradoEm)}.`
                : ""}
            </p>

            <div className={styles.painelAcoes}>
              {resultado.resultado === "CONFIRMAR" ? (
                <>
                  <Botao type="button" variante="secundario" onClick={() => setResultado(null)}>
                    Cancelar
                  </Botao>
                  <Botao type="button" carregando={processando} onClick={() => ler({ ...resultado.dados, confirmar: true })}>
                    Registrar presença
                  </Botao>
                </>
              ) : (
                <>
                  {resultado.resultado === "REGISTRADO" && (
                    <Botao type="button" variante="secundario" carregando={desfazendo} onClick={desfazer}>
                      <Undo2 size={18} strokeWidth={1.5} aria-hidden="true" />
                      Desfazer
                    </Botao>
                  )}
                  <Botao type="button" onClick={() => setResultado(null)}>
                    Próximo
                  </Botao>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
