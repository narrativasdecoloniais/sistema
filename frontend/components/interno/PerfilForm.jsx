"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "@/components/forms/Campo";
import CampoSenha from "@/components/forms/CampoSenha";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoFoto from "@/components/forms/CampoFoto";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import {
  atualizarPerfilSchema,
  alterarSenhaSchema,
  solicitarTrocaEmailSchema,
  confirmarTrocaEmailSchema,
  extrairErros,
  categorias,
} from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./PerfilForm.module.scss";

export default function PerfilForm({ usuarioInicial }) {
  const router = useRouter();
  const usuario = usuarioInicial;

  const [perfil, setPerfil] = useState({
    nome: usuario?.nome || "",
    instituicao: usuario?.instituicao || "",
    categoria: usuario?.categoria || "",
    foto: usuario?.foto || null,
  });
  const [errosPerfil, setErrosPerfil] = useState({});
  const [mensagemPerfil, setMensagemPerfil] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [senhas, setSenhas] = useState({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
  const [errosSenha, setErrosSenha] = useState({});
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  async function salvarPerfil(evento) {
    evento.preventDefault();
    setMensagemPerfil("");

    // Usuario.foto agora é uma URL assinada do storage, não a imagem em si —
    // só reenviamos o campo quando o usuário realmente trocou ou removeu a
    // foto (novo data URI ou null); caso contrário, a URL atual reprovaria a
    // validação (que só aceita data:image/…) e sobrescreveria sem necessidade.
    const dadosParaValidar = { ...perfil };
    if (dadosParaValidar.foto === (usuario?.foto || null)) {
      delete dadosParaValidar.foto;
    }

    const resultado = atualizarPerfilSchema.safeParse(dadosParaValidar);
    if (!resultado.success) {
      setErrosPerfil(extrairErros(resultado));
      return;
    }
    setErrosPerfil({});
    setSalvandoPerfil(true);

    try {
      await apiClient.patch("/usuarios/me", resultado.data);
      setMensagemPerfil("Perfil atualizado com sucesso.");
      router.refresh();
    } catch (erro) {
      setMensagemPerfil(erro.message);
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function salvarSenha(evento) {
    evento.preventDefault();
    setMensagemSenha("");

    const resultado = alterarSenhaSchema.safeParse(senhas);
    if (!resultado.success) {
      setErrosSenha(extrairErros(resultado));
      return;
    }
    setErrosSenha({});
    setSalvandoSenha(true);

    try {
      await apiClient.patch("/usuarios/me/senha", resultado.data);
      setMensagemSenha("Senha alterada com sucesso.");
      setSenhas({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
    } catch (erro) {
      setMensagemSenha(erro.message);
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function excluirConta() {
    setErroExclusao("");
    setExcluindo(true);

    try {
      await apiClient.delete("/usuarios/me");
      router.push("/");
      router.refresh();
    } catch (erro) {
      setErroExclusao(erro.message);
      setExcluindo(false);
    }
  }

  return (
    <>
      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Dados da conta</h2>
        <div className={styles.linhaDados}>
          <span>E-mail</span>
          <span>{usuario?.email}</span>
        </div>
        <div className={styles.linhaDados}>
          <span>CPF</span>
          <span>{usuario?.cpf}</span>
        </div>
      </section>

      <AlterarEmail emailAtual={usuario?.email} />

      <form onSubmit={salvarPerfil} className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Editar perfil</h2>
        <Alerta tipo={mensagemPerfil.includes("sucesso") ? "sucesso" : "erro"}>
          {mensagemPerfil}
        </Alerta>
        <CampoFoto
          id="foto"
          rotulo="Foto de perfil"
          usuario={usuario}
          valor={perfil.foto}
          onChange={(foto) => setPerfil((atual) => ({ ...atual, foto }))}
          erro={errosPerfil.foto}
        />
        <Campo
          id="nome"
          rotulo="Nome completo"
          value={perfil.nome}
          onChange={(evento) => setPerfil((atual) => ({ ...atual, nome: evento.target.value }))}
          erro={errosPerfil.nome}
        />
        <Campo
          id="instituicao"
          rotulo="Instituição"
          value={perfil.instituicao}
          onChange={(evento) =>
            setPerfil((atual) => ({ ...atual, instituicao: evento.target.value }))
          }
          erro={errosPerfil.instituicao}
        />
        <CampoSelect
          id="categoria"
          rotulo="Categoria"
          value={perfil.categoria}
          onChange={(evento) =>
            setPerfil((atual) => ({ ...atual, categoria: evento.target.value }))
          }
          erro={errosPerfil.categoria}
        >
          {categorias.map((categoria) => (
            <option key={categoria.valor} value={categoria.valor}>
              {categoria.rotulo}
            </option>
          ))}
        </CampoSelect>
        <Botao type="submit" carregando={salvandoPerfil}>
          Salvar alterações
        </Botao>
      </form>

      <form onSubmit={salvarSenha} className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Alterar senha</h2>
        <Alerta tipo={mensagemSenha.includes("sucesso") ? "sucesso" : "erro"}>
          {mensagemSenha}
        </Alerta>
        <CampoSenha
          id="senhaAtual"
          rotulo="Senha atual"
          value={senhas.senhaAtual}
          onChange={(evento) => setSenhas((atual) => ({ ...atual, senhaAtual: evento.target.value }))}
          erro={errosSenha.senhaAtual}
        />
        <div className={styles.linha}>
          <CampoSenha
            id="novaSenha"
            rotulo="Nova senha"
            value={senhas.novaSenha}
            onChange={(evento) => setSenhas((atual) => ({ ...atual, novaSenha: evento.target.value }))}
            erro={errosSenha.novaSenha}
          />
          <CampoSenha
            id="confirmarNovaSenha"
            rotulo="Confirmar nova senha"
            value={senhas.confirmarNovaSenha}
            onChange={(evento) =>
              setSenhas((atual) => ({ ...atual, confirmarNovaSenha: evento.target.value }))
            }
            erro={errosSenha.confirmarNovaSenha}
          />
        </div>
        <Botao type="submit" carregando={salvandoSenha}>
          Alterar senha
        </Botao>
      </form>

      <section className={`${styles.secao} ${styles.perigo}`}>
        <h2 className={styles.secaoTitulo}>Excluir conta</h2>
        <p className={styles.perigoTexto}>
          Ao excluir sua conta, seus dados pessoais são anonimizados permanentemente,
          conforme a LGPD. Essa ação não pode ser desfeita.
        </p>
        <Alerta>{erroExclusao}</Alerta>
        {!confirmandoExclusao ? (
          <Botao
            type="button"
            variante="perigo"
            onClick={() => setConfirmandoExclusao(true)}
          >
            Excluir minha conta
          </Botao>
        ) : (
          <div className={styles.linha}>
            <Botao type="button" variante="perigo" carregando={excluindo} onClick={excluirConta}>
              Confirmar exclusão
            </Botao>
            <Botao type="button" variante="secundario" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Botao>
          </div>
        )}
      </section>
    </>
  );
}

// Duas etapas: novo e-mail + senha atual enviam um código para o novo
// endereço; a troca só acontece quando o código é digitado aqui.
function AlterarEmail({ emailAtual }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [dados, setDados] = useState({ novoEmail: "", senhaAtual: "" });
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function solicitar(evento) {
    evento?.preventDefault();
    const resultado = solicitarTrocaEmailSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setEnviando(true);

    try {
      const resposta = await apiClient.post("/usuarios/me/email/solicitar", resultado.data);
      setCodigoEnviado(true);
      setCodigo("");
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmar(evento) {
    evento.preventDefault();
    const resultado = confirmarTrocaEmailSchema.safeParse({ novoEmail: dados.novoEmail, codigo });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setEnviando(true);

    try {
      await apiClient.post("/usuarios/me/email/confirmar", resultado.data);
      notificar("E-mail alterado com sucesso.");
      setDados({ novoEmail: "", senhaAtual: "" });
      setCodigo("");
      setCodigoEnviado(false);
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  function recomecar() {
    setCodigoEnviado(false);
    setCodigo("");
    setErros({});
  }

  if (codigoEnviado) {
    return (
      <form onSubmit={confirmar} className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Alterar e-mail</h2>
        <p className={styles.perigoTexto}>
          Enviamos um código para <strong>{dados.novoEmail}</strong>. Ele vale por 30 minutos. Seu
          e-mail atual ({emailAtual}) continua valendo até você confirmar.
        </p>
        <Campo
          id="codigoTrocaEmail"
          rotulo="Código recebido"
          value={codigo}
          autoComplete="one-time-code"
          onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
          erro={erros.codigo}
        />
        <div className={styles.linha}>
          <Botao type="submit" carregando={enviando}>
            Confirmar novo e-mail
          </Botao>
          <Botao type="button" variante="secundario" disabled={enviando} onClick={solicitar}>
            Reenviar código
          </Botao>
          <Botao type="button" variante="secundario" disabled={enviando} onClick={recomecar}>
            Usar outro e-mail
          </Botao>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={solicitar} className={styles.secao}>
      <h2 className={styles.secaoTitulo}>Alterar e-mail</h2>
      <p className={styles.perigoTexto}>
        Vamos enviar um código para o novo endereço. A troca só vale depois que você digitar esse código.
      </p>
      <div className={styles.linha}>
        <Campo
          id="novoEmail"
          type="email"
          rotulo="Novo e-mail"
          autoComplete="email"
          value={dados.novoEmail}
          onChange={(evento) => setDados((atual) => ({ ...atual, novoEmail: evento.target.value }))}
          erro={erros.novoEmail}
        />
        <CampoSenha
          id="senhaAtualTrocaEmail"
          rotulo="Senha atual"
          value={dados.senhaAtual}
          onChange={(evento) => setDados((atual) => ({ ...atual, senhaAtual: evento.target.value }))}
          erro={erros.senhaAtual}
        />
      </div>
      <Botao type="submit" carregando={enviando}>
        Enviar código
      </Botao>
    </form>
  );
}
