// Dados do andamento do projeto, exibidos em /cronograma para a contratante.
// Espelham os 13 módulos e o cronograma da proposta comercial assinada em
// julho/2026, mas descem a um nível de detalhe que a proposta não tem: cada
// módulo carrega os subitens que de fato compõem a entrega, incluindo
// trabalho de infraestrutura que não aparece em nenhuma tela (servidor,
// DNS, e-mail transacional, sessão entre domínios etc.) — o objetivo é
// deixar visível o que foi construído por trás do que a contratante já viu.
//
// Assim como lib/modalidadesSubmissao.js, isto é dado fixo porque o módulo 2
// (painel administrativo) ainda não existe. Quando este próprio módulo 2 for
// entregue, esta lista pode até continuar estática — é um registro histórico
// do desenvolvimento, não um dado operacional do evento.

export const STATUS = {
  CONCLUIDO: "concluido",
  EM_ANDAMENTO: "em_andamento",
  PLANEJADO: "planejado",
};

export const ROTULO_STATUS = {
  [STATUS.CONCLUIDO]: "Concluído",
  [STATUS.EM_ANDAMENTO]: "Em andamento",
  [STATUS.PLANEJADO]: "Planejado",
};

export const FASES_CRONOGRAMA = [
  {
    numero: 1,
    nome: "Fase 1 — até o evento",
    periodo: "julho a dezembro de 2026",
    objetivo: "Garante a operação da V edição em dezembro de 2026.",
  },
  {
    numero: 2,
    nome: "Fase 2 — pós-evento",
    periodo: "janeiro a fevereiro de 2027",
    objetivo: "Conclui a plataforma e prepara a chamada da VI edição.",
  },
];

export const MODULOS_PROJETO = [
  {
    numero: 1,
    nome: "Cadastro, login e autenticação",
    fase: 1,
    mes: "Julho/2026",
    status: STATUS.CONCLUIDO,
    resumo:
      "A porta de entrada do sistema — e também onde ficou toda a fundação técnica que os próximos 12 módulos vão usar.",
    itens: [
      {
        titulo: "Servidor, domínio e DNS",
        descricao:
          "Contratação do domínio, configuração da zona de DNS e hospedagem do backend, frontend e banco de dados no Railway — a base sobre a qual todo o resto do sistema roda.",
        status: STATUS.CONCLUIDO,
        bastidor: true,
      },
      {
        titulo: "Modelagem do banco de dados",
        descricao:
          "Estrutura em PostgreSQL (via Prisma) já pensada para suportar múltiplas edições do evento (V, VI, VII...) desde o primeiro cadastro criado.",
        status: STATUS.CONCLUIDO,
        bastidor: true,
      },
      {
        titulo: "Cadastro de usuário",
        descricao: "Nome, e-mail, CPF, instituição e categoria (estudante, docente, pesquisador, comunidade externa).",
        status: STATUS.CONCLUIDO,
      },
      {
        titulo: "Serviço de e-mail em produção",
        descricao:
          "Troca do envio de SMTP para a API HTTP do Resend: o Railway bloqueia portas de saída de SMTP em todos os planos, então sem essa troca nenhum e-mail de confirmação ou recuperação de senha chegaria a sair em produção.",
        status: STATUS.CONCLUIDO,
        bastidor: true,
      },
      {
        titulo: "Confirmação de e-mail no cadastro",
        status: STATUS.CONCLUIDO,
      },
      {
        titulo: "Login por CPF e senha",
        descricao: "Senha nunca guardada em texto puro — hash com bcrypt.",
        status: STATUS.CONCLUIDO,
      },
      {
        titulo: "Sessão segura entre domínios",
        descricao:
          "Autenticação por JWT em cookie httpOnly, ajustada para funcionar entre o site e a API, que vivem em subdomínios diferentes.",
        status: STATUS.CONCLUIDO,
        bastidor: true,
      },
      {
        titulo: "Recuperação de senha",
        status: STATUS.CONCLUIDO,
      },
      {
        titulo: "Perfis e permissões",
        descricao:
          "Participante, avaliador, organizador e administrador do sistema — os middlewares de autenticação e autorização que os módulos 2 a 13 vão reaproveitar já estão prontos.",
        status: STATUS.CONCLUIDO,
        bastidor: true,
      },
      {
        titulo: "Conformidade com a LGPD",
        descricao:
          "Aceite de termos no cadastro e exclusão de conta por anonimização — o registro nunca é apagado de fato, para não quebrar inscrições e certificados de módulos futuros.",
        status: STATUS.CONCLUIDO,
      },
      {
        titulo: "Identidade visual e página inicial",
        descricao:
          "Logo animada, sistema de grafismos (búzio, carimbo) e a landing page pública — parte do módulo 12 adiantada, porque o site precisava ter uma cara já na primeira tela.",
        status: STATUS.CONCLUIDO,
      },
    ],
  },
  {
    numero: 2,
    nome: "Painel administrativo — edições e atividades",
    fase: 1,
    mes: "Agosto/2026",
    status: STATUS.PLANEJADO,
    resumo: "Onde a organização cria e gerencia cada edição do evento, sem depender de mim para nada do dia a dia.",
    itens: [
      { titulo: "Criação de novas edições (V, VI, VII...)", descricao: "Nome, datas, tema, descrição, capa e edital em PDF.", status: STATUS.PLANEJADO },
      { titulo: "Cadastro de atividades por edição", descricao: "Palestras, mesas-redondas, oficinas, conversatórios, espaços pedagógico-formativos.", status: STATUS.PLANEJADO },
      { titulo: "Períodos de inscrição por atividade", status: STATUS.PLANEJADO },
      { titulo: "Categorias de participante com formulários condicionais", descricao: "Monitor, ouvinte, palestrante, brasileiro, estrangeiro.", status: STATUS.PLANEJADO },
      { titulo: "Gestão de inscritos", descricao: "Busca, filtros, ordenação, edição manual e exportação para Excel/CSV.", status: STATUS.PLANEJADO },
      { titulo: "Múltiplos organizadores com níveis de acesso", status: STATUS.PLANEJADO },
      { titulo: "Envio de comunicados por e-mail para grupos filtrados", status: STATUS.PLANEJADO },
      { titulo: "Relatórios", descricao: "Por atividade, categoria, instituição e taxa de credenciamento.", status: STATUS.PLANEJADO },
      { titulo: "Histórico de ações no painel (auditoria)", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 3,
    nome: "Inscrições",
    fase: 1,
    mes: "Agosto/2026",
    status: STATUS.PLANEJADO,
    resumo: "O fluxo que o participante usa para garantir vaga nas atividades da edição.",
    itens: [
      { titulo: "Seleção de edição e atividades", descricao: "Respeitando o período de inscrição de cada uma.", status: STATUS.PLANEJADO },
      { titulo: "Controle automático de vagas com lista de espera", status: STATUS.PLANEJADO },
      { titulo: "Confirmação automática por e-mail", status: STATUS.PLANEJADO },
      { titulo: "Bloqueio de conflito de horário entre atividades", status: STATUS.PLANEJADO },
      { titulo: "Página pública com a programação completa da edição", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 4,
    nome: "Credenciamento por QR code",
    fase: 1,
    mes: "Setembro/2026",
    status: STATUS.PLANEJADO,
    resumo: "Como a equipe confere presença na porta de cada atividade, sem lista de papel.",
    itens: [
      { titulo: "Geração automática do QR code após a inscrição", status: STATUS.PLANEJADO },
      { titulo: "Envio do QR code por e-mail e na área do participante", status: STATUS.PLANEJADO },
      { titulo: "Interface de leitura para a equipe (celular ou tablet)", status: STATUS.PLANEJADO },
      { titulo: "Registro do horário exato de entrada", descricao: "Base para a validação automática dos certificados no módulo 9.", status: STATUS.PLANEJADO },
      { titulo: "Painel em tempo real de credenciados por atividade", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 5,
    nome: "Área do participante",
    fase: 1,
    mes: "Setembro/2026",
    status: STATUS.PLANEJADO,
    resumo: "O espaço logado de cada inscrito, com tudo o que ele precisa acompanhar.",
    itens: [
      { titulo: "“Minhas inscrições” com histórico completo", status: STATUS.PLANEJADO },
      { titulo: "Meu QR code, com opção de baixar ou adicionar à carteira digital", status: STATUS.PLANEJADO },
      { titulo: "Programação personalizada, ordenada por horário", status: STATUS.PLANEJADO },
      { titulo: "“Meus certificados”", descricao: "Habilitado só na Fase 2, junto do módulo 9.", status: STATUS.PLANEJADO },
      { titulo: "“Meus trabalhos”", descricao: "Habilitado só na Fase 2, junto do módulo 13.", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 6,
    nome: "Testes e homologação",
    fase: 1,
    mes: "Outubro/2026",
    status: STATUS.PLANEJADO,
    resumo: "Rodada de testes com a equipe organizadora antes de qualquer coisa ir ao ar de verdade.",
    itens: [
      { titulo: "Testes guiados com a equipe organizadora", status: STATUS.PLANEJADO },
      { titulo: "Correções e ajustes finais antes da entrada em produção", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 7,
    nome: "Colocação no ar e treinamento",
    fase: 1,
    mes: "Novembro/2026",
    status: STATUS.PLANEJADO,
    resumo: "O sistema completo em ambiente definitivo, com a equipe treinada para operá-lo.",
    itens: [
      {
        titulo: "Publicação em ambiente definitivo com domínio próprio",
        descricao:
          "O domínio e a hospedagem já foram contratados e configurados desde julho, adiantados junto do módulo 1 — o que falta aqui é a virada final para o ambiente de produção completo, com todos os módulos no ar.",
        status: STATUS.PLANEJADO,
      },
      { titulo: "Configuração de backups automáticos diários", status: STATUS.PLANEJADO },
      { titulo: "Treinamento da equipe organizadora", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 8,
    nome: "Suporte durante o evento",
    fase: 1,
    mes: "Dezembro/2026",
    status: STATUS.PLANEJADO,
    resumo: "Acompanhamento ao vivo nos dias do evento em dezembro.",
    itens: [
      { titulo: "Correção emergencial de qualquer imprevisto técnico", status: STATUS.PLANEJADO },
      { titulo: "Acompanhamento do credenciamento em tempo real junto à organização", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 9,
    nome: "Certificados",
    fase: 2,
    mes: "Janeiro/2027",
    status: STATUS.PLANEJADO,
    resumo: "Emissão automática dos certificados de todos os públicos do evento.",
    itens: [
      { titulo: "Modelos personalizáveis com a identidade visual do evento", status: STATUS.PLANEJADO },
      { titulo: "Emissão automática por tipo de público", descricao: "Participação geral, específica, palestrante, convidado, avaliador, apresentador etc.", status: STATUS.PLANEJADO },
      { titulo: "Consulta pública de autenticidade", descricao: "Por código ou QR code impresso no certificado.", status: STATUS.PLANEJADO },
      { titulo: "Download em PDF pela área do participante", status: STATUS.PLANEJADO },
      { titulo: "Certificado para quem enviou resumo pela Even3", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 10,
    nome: "Migração de dados da Even3",
    fase: 2,
    mes: "Janeiro/2027",
    status: STATUS.PLANEJADO,
    resumo: "Trazer o histórico da plataforma anterior para dentro do novo sistema.",
    itens: [
      { titulo: "Levantamento dos dados exportáveis", descricao: "Inscritos, trabalhos submetidos, avaliações, pareceres.", status: STATUS.PLANEJADO },
      { titulo: "Importação estruturada para a nova plataforma", status: STATUS.PLANEJADO },
      { titulo: "Vínculo com os cadastros de usuários", descricao: "Mesmo e-mail, mesmo perfil.", status: STATUS.PLANEJADO },
      { titulo: "Validação de integridade após a migração", status: STATUS.PLANEJADO },
    ],
  },
  {
    numero: 11,
    nome: "Anais",
    fase: 2,
    mes: "Janeiro/2027",
    status: STATUS.PLANEJADO,
    resumo: "Publicação dos trabalhos aprovados na edição.",
    itens: [
      { titulo: "Cadastro dos trabalhos aprovados na edição", descricao: "Provenientes da migração do módulo 10.", status: STATUS.PLANEJADO },
      { titulo: "Organização por eixo temático, com sumário navegável", status: STATUS.PLANEJADO },
      { titulo: "Geração automática de Word (texto puro, sem diagramação)", status: STATUS.PLANEJADO },
      { titulo: "Publicação na biblioteca do site institucional", status: STATUS.PLANEJADO },
    ],
    nota: "ISBN, DOI e diagramação editorial não estão inclusos nesta proposta.",
  },
  {
    numero: 12,
    nome: "Site institucional e página de edição",
    fase: 2,
    mes: "Fevereiro/2027",
    status: STATUS.EM_ANDAMENTO,
    resumo: "O hub multi-edição do evento — parte da base visual já nasceu junto do módulo 1, adiantada.",
    itens: [
      {
        titulo: "Identidade visual e landing inicial",
        descricao: "Sistema de grafismos, logo animada e primeira página pública — construído com antecedência, junto do módulo 1.",
        status: STATUS.CONCLUIDO,
      },
      { titulo: "Hub do evento multi-edição", descricao: "Histórico, missão, grupos de pesquisa parceiros.", status: STATUS.PLANEJADO },
      { titulo: "Biblioteca com todas as edições, anais, fotos e vídeos", status: STATUS.PLANEJADO },
      { titulo: "Landing dedicada por edição", descricao: "Identidade própria, animações, chamada de inscrição, edital, programação, palestrantes e apoiadores.", status: STATUS.PLANEJADO },
      { titulo: "Otimização básica para busca no Google (SEO)", status: STATUS.PLANEJADO },
      {
        titulo: "Acessibilidade — WCAG 2.1 nível AA",
        descricao: "Contraste, foco visível e respeito a movimento reduzido já seguidos desde a primeira tela; ajuste de fonte, leitura automática e tradução de idiomas ainda faltam.",
        status: STATUS.EM_ANDAMENTO,
      },
    ],
  },
  {
    numero: 13,
    nome: "Submissão de trabalhos",
    fase: 2,
    mes: "Fevereiro/2027",
    status: STATUS.EM_ANDAMENTO,
    resumo: "A chamada de trabalhos já está no ar; falta o fluxo de fato receber e avaliar submissões.",
    itens: [
      {
        titulo: "Landing com as modalidades de submissão",
        descricao: "Construída com antecedência, fora da ordem original do cronograma, porque o prazo de submissão da própria V edição já estava correndo.",
        status: STATUS.CONCLUIDO,
      },
      { titulo: "Páginas de detalhe por modalidade e área temática", status: STATUS.CONCLUIDO },
      { titulo: "Formulário de submissão", descricao: "Título, resumo, autores, coautores, eixo temático, palavras-chave e upload do arquivo.", status: STATUS.PLANEJADO },
      { titulo: "Edição e reenvio até o prazo final", status: STATUS.PLANEJADO },
      { titulo: "Painel do autor com status de cada trabalho", status: STATUS.PLANEJADO },
      { titulo: "Distribuição de trabalhos para avaliadores", status: STATUS.PLANEJADO },
      { titulo: "Formulário de parecer, com critérios por edital", status: STATUS.PLANEJADO },
      { titulo: "Segundo parecer em caso de divergência", status: STATUS.PLANEJADO },
      { titulo: "Notificação automática do resultado ao autor", status: STATUS.PLANEJADO },
    ],
  },
];

export const PLANO_PAGAMENTO = {
  opcao: "Opção 1 — entrada, parcelas mensais e saldo na entrega",
  valorTotal: 12000,
  parcelas: [
    { momento: "No aceite", data: "Julho/2026", valor: 2000, pago: true },
    { momento: "Parcela", data: "Agosto/2026", valor: 1000, pago: false },
    { momento: "Parcela", data: "Setembro/2026", valor: 1000, pago: false },
    { momento: "Parcela", data: "Outubro/2026", valor: 1000, pago: false },
    { momento: "Parcela", data: "Novembro/2026", valor: 1000, pago: false },
    { momento: "Parcela", data: "Dezembro/2026", valor: 1000, pago: false },
    { momento: "Entrega final", data: "Fevereiro/2027", valor: 5000, pago: false },
  ],
};

export function formatarReal(valorEmReais) {
  return valorEmReais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function calcularProgressoModulos(modulos = MODULOS_PROJETO) {
  const concluidos = modulos.filter((modulo) => modulo.status === STATUS.CONCLUIDO).length;
  const emAndamento = modulos.filter((modulo) => modulo.status === STATUS.EM_ANDAMENTO).length;
  return { total: modulos.length, concluidos, emAndamento, planejados: modulos.length - concluidos - emAndamento };
}

export function calcularValorPago(plano = PLANO_PAGAMENTO) {
  return plano.parcelas.filter((parcela) => parcela.pago).reduce((soma, parcela) => soma + parcela.valor, 0);
}
