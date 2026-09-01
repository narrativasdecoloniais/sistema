import { apiClient } from "@/lib/apiClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitar(caminho, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(dados?.mensagem || "Ocorreu um erro. Tente novamente.");
  }

  return dados;
}

export function enviarLinkEntradaSubmissao({ email, destino }) {
  return requisitar("/publico/submissao/email", { method: "POST", body: { email, destino } });
}

export function cadastrarParaSubmissao(dados) {
  return requisitar("/publico/submissao/cadastro", { method: "POST", body: dados });
}

export function confirmarEntradaSubmissao(token) {
  return requisitar("/publico/submissao/entrar", { method: "POST", body: { token } });
}

// Usa o cookie de sessão (login), não o token de submissão — por isso passa
// pelo apiClient (credentials: "include") em vez de requisitar() com Bearer.
export function buscarTokenPorSessaoSubmissao() {
  return apiClient.get("/publico/submissao/token-por-sessao");
}

export function verificarEmailAutor(token, email) {
  return requisitar("/publico/submissao/verificar-email-autor", {
    method: "POST",
    token,
    body: { email },
  });
}

export function enviarSubmissao(token, dados) {
  return requisitar("/publico/submissao", { method: "POST", token, body: dados });
}

// Sessão de submissão (Bearer curto) guardada por aba — evita pedir e-mail
// de novo a cada navegação dentro do formulário. Usada tanto pela página do
// formulário (app/(publico)/submissao/[modalidade]/enviar) quanto pela
// página que consome o link mágico (app/(publico)/submissao/entrar).
const CHAVE_SESSAO = "narrativas:submissao-sessao";
const VALIDADE_SESSAO_MS = 55 * 60 * 1000;

export function lerSessaoSubmissaoSalva() {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto);
    if (!sessao?.token || !sessao?.expiraEm || sessao.expiraEm < Date.now()) return null;
    return sessao;
  } catch {
    return null;
  }
}

export function salvarSessaoSubmissao(token, nome) {
  try {
    sessionStorage.setItem(
      CHAVE_SESSAO,
      JSON.stringify({ token, nome, expiraEm: Date.now() + VALIDADE_SESSAO_MS })
    );
  } catch {
    // sessionStorage indisponível (ex. navegação privada) — segue só em memória
  }
}
