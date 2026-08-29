"use client";

import { useState } from "react";
import { z } from "zod";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { edicaoPontoInteresseSchema, extrairErros } from "@/lib/validacao";
import ModalConfirmacao from "./ModalConfirmacao";
import SecaoLocalizacao from "./SecaoLocalizacao";
import styles from "./EdicaoForm.module.scss";

const localizacaoSchema = z.object({
  pontosInteresse: z.array(edicaoPontoInteresseSchema).optional(),
});

function pontoParaPayload(ponto) {
  const payload = {
    tipo: ponto.tipo,
    nome: ponto.nome.trim(),
    endereco: ponto.endereco?.trim() || undefined,
    latitude: ponto.latitude,
    longitude: ponto.longitude,
    link: ponto.link?.trim() || undefined,
  };
  if (ponto.id) payload.id = ponto.id;
  return payload;
}

export default function LocalizacaoForm({ edicaoInicial }) {
  const { notificar } = useToast();
  const [pontosInteresse, setPontosInteresse] = useState(edicaoInicial.pontosInteresse || []);
  const [erros, setErros] = useState({});
  const [indiceConfirmandoRemocao, setIndiceConfirmandoRemocao] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  async function salvar(overrides = {}) {
    const resultado = localizacaoSchema.safeParse({
      pontosInteresse: (overrides.pontosInteresse ?? pontosInteresse).map(pontoParaPayload),
    });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});

    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoInicial.id}`, {
        numero: edicaoInicial.numero,
        nome: edicaoInicial.nome,
        pontosInteresse: resultado.data.pontosInteresse,
      });
      setPontosInteresse(resposta.edicao.pontosInteresse || []);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarPonto(indice, campo, valor) {
    setPontosInteresse((atual) => {
      const novo = [...atual];
      novo[indice] = { ...novo[indice], [campo]: valor };
      return novo;
    });
  }

  function aoAdicionarPonto() {
    setPontosInteresse((atual) => [
      ...atual,
      { tipo: "LOCAL_EVENTO", nome: "", endereco: "", latitude: null, longitude: null, link: "" },
    ]);
  }

  async function confirmarRemocao() {
    setRemovendo(true);
    const novo = pontosInteresse.filter((_, i) => i !== indiceConfirmandoRemocao);
    await salvar({ pontosInteresse: novo });
    setPontosInteresse(novo);
    setRemovendo(false);
    setIndiceConfirmandoRemocao(null);
  }

  return (
    <div className={styles.formulario}>
      <SecaoLocalizacao
        pontos={pontosInteresse}
        erros={erros}
        aoMudarPonto={aoMudarPonto}
        aoSalvar={() => salvar({})}
        aoAdicionarPonto={aoAdicionarPonto}
        aoPedirRemocao={setIndiceConfirmandoRemocao}
      />
      {indiceConfirmandoRemocao !== null && (
        <ModalConfirmacao
          titulo="Excluir ponto de interesse"
          mensagem={`Tem certeza que deseja excluir "${pontosInteresse[indiceConfirmandoRemocao]?.nome || "este ponto"}"? Essa ação não pode ser desfeita.`}
          confirmando={removendo}
          onConfirmar={confirmarRemocao}
          onCancelar={() => setIndiceConfirmandoRemocao(null)}
        />
      )}
    </div>
  );
}
