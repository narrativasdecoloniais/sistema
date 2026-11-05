# Plano — EvenX: SaaS de eventos acadêmicos a partir do Narrativas

> **Plataforma:** **EvenX** — site em `www.evenx.app.br`.
> **Estratégia (decidida em 2026-10-17):** a EvenX é construída **em paralelo**, num **monorepo novo criado a partir de uma cópia do código atual**, sem tocar no Narrativas em produção. O Narrativas vira, no fim, um tenant no **modo integração**: o site público dele passa a ser um site sob medida que consome a API da EvenX, e a área do participante e do gestor passa a ser a da EvenX com a pele do Narrativas. Os dados migram uma única vez, numa janela planejada.
> **Status:** planejamento. Nada implementado.
> **Criado em:** 2026-10-06. Atualize este arquivo a cada decisão tomada ou etapa concluída (seções 2 e 16).

## Sumário

1. Visão e princípios
2. Decisões
3. Estratégia: projeto paralelo em monorepo
4. Diagnóstico do código atual
5. Arquitetura alvo — modelo de dados
6. Arquitetura alvo — infraestrutura (domínio, isolamento, auth, storage, e-mail, SEO)
7. Tema e sistema de design da EvenX
8. Hero do site genérico: logo, banner ou título
9. Extração de cores a partir de uma imagem
10. Domínio da EvenX: site (LP) e painel da plataforma
11. Modo integração: API pública e site sob medida
12. O site do Narrativas como site sob medida
13. Migração do Narrativas para a EvenX
14. Criação e personalização por chat com IA
15. Cobrança, planos, LGPD e jurídico
16. Etapas de execução
17. Riscos
18. Fora do escopo / futuro

---

## 1. Visão e princípios

**Produto:** **EvenX**, plataforma de gestão de eventos científicos e acadêmicos (concorrente do Even3), com alto grau de personalização e **marca da plataforma invisível** — o participante acredita estar no sistema próprio do evento. Infraestrutura única (uma API, um frontend, um banco) servindo todos os eventos. A marca EvenX só aparece no domínio próprio da plataforma (`evenx.app.br`): o site comercial (LP) e o painel da plataforma — seção 10.

**Princípios — valem para toda decisão de implementação:**

1. **O Narrativas em produção não é tocado até o corte.** A EvenX nasce e amadurece em paralelo; o Narrativas migra uma vez, numa janela planejada (seção 13).
2. **O site público do Narrativas continua igual.** Ele vira um site sob medida (`apps/site-narrativas`) que reaproveita as páginas atuais e lê os dados da API da EvenX. A **área do participante e do gestor** passa a ser a da EvenX com a pele do Narrativas — próxima, não idêntica (aceito em 2026-10-17).
3. **O núcleo da EvenX não conhece o Narrativas.** Búzios, rolo de tinta, faixas laterais, textura de papel e divisor stencil vivem só em `apps/site-narrativas`. Nada de `if (tenant === narrativas)` no núcleo.
4. **Levar, não reescrever.** As regras de negócio do Narrativas (inscrições, avaliação, resultado, certificados, Anais, credenciamento…) são levadas para a EvenX a partir do código atual, não reescritas do zero.
5. **Isolamento entre tenants é requisito de segurança.** Vazamento de dados de um evento para outro é incidente de dados pessoais (LGPD). Duas barreiras independentes (aplicação + banco).
6. **Marca invisível de ponta a ponta:** domínio, e-mail (remetente e corpo), PDFs, favicon, títulos, mensagens de erro. Única exceção consciente: a menção discreta à EvenX nos termos e na política de privacidade do cadastro, exigida pela identidade unificada (5.4).
7. **A IA só age pelas portas de um humano** — mesmos services, validadores Zod e permissões, em rascunho até alguém publicar.
8. **O usuário comum personaliza sem esforço.** O tema da EvenX é simples (estilos prontos, tokens, variantes, banner, paleta extraída); o que é muito específico vira site sob medida.

---

## 2. Decisões

| # | Decisão | Opções | Recomendação / decisão |
|---|---|---|---|
| D1 | O que é o tenant | (a) o **evento** (série de edições); (b) uma **organização** com vários eventos | (a) agora, com espaço para (b) acima depois — cobrança pode pedir organização |
| D2 | Contas de usuário | (a) por tenant; (b) identidade única com vínculo por evento | **Decidido (2026-10-17): (b) identidade única** — CPF/documento e e-mail únicos na base inteira, um login para todos os eventos, papéis e dados por evento num vínculo (5.4). Sem login único automático entre domínios |
| D3 | Onde mora o tema | (a) só no tenant; (b) tenant + sobrescrita por edição | (a) na primeira versão; (b) depois |
| D4 | Domínios próprios + SSL | Cloudflare for SaaS (Custom Hostnames); domínios custom do Railway; proxy próprio (Caddy on-demand TLS) | Cloudflare for SaaS — SSL automático, escala, WAF, e permite o roteamento por caminho do Narrativas (12.3) |
| D5 | Nome e domínio da plataforma | — | **Decidido (2026-10-17): EvenX, `www.evenx.app.br`** — o endereço abre o site comercial (LP). Substituiu o nome provisório evenClick, de 2026-10-06 |
| D6 | Gateway de cobrança | Asaas, Pagar.me, Stripe | Asaas ou Pagar.me (PIX/boleto, mercado BR) |
| D7 | Repositório | mesmo repositório vs novo | **Decidido (2026-10-17): monorepo novo** (ver D12, D13) |
| D8 | Páginas `/cronograma` e `/apresentacao` | levar ou não | não levar para a EvenX; aproveitar `/apresentacao` como estudo de caso na LP, se fizer sentido |
| D9 | Funcionalidades exclusivas do Narrativas | módulo ligável vs não levar | `/regularizar-cadastro`: não levar (temporária); importação do Even3: virar recurso do produto ("migre do Even3") |
| D10 | Identidade visual da EvenX (logo, paleta, tipografia) | — | definir; é uma pele própria, separada das peles dos tenants |
| D11 | Endereços no domínio evenx.app.br | painel; subdomínios de reserva; e-mail de reserva | painel em `painel.evenx.app.br`; eventos sem domínio em `<slug>.evenx.app.br` com slugs reservados (`www`, `painel`, `api`, `app`, `admin`, `status`, `docs`, `blog`, `ajuda`); e-mail de reserva num domínio neutro **separado** — `@evenx.app.br` revelaria a marca |
| D12 | Estratégia de construção | refatorar o Narrativas no lugar; reescrever do zero; copiar o código atual e evoluir em paralelo | **Decidido (2026-10-17): copiar e evoluir em paralelo**, sem tocar no Narrativas em produção (seção 3) |
| D13 | Organização do código | repositório separado; monorepo | **Decidido (2026-10-17): monorepo** — `apps/api`, `apps/web`, `apps/site-narrativas` + `packages/*` (3.2) |
| D14 | Área interna do Narrativas após a migração | idêntica à atual; a da EvenX com a pele do Narrativas | **Decidido (2026-10-17): a da EvenX com a pele do Narrativas** (próxima, não idêntica) |
| D15 | Data de corte do Narrativas (migração) | antes ou depois de certificados/Anais da V edição | depois de emitidos os certificados e publicados os Anais da V edição (previsto jan–fev/2027) e antes de abrirem inscrições/submissões da VI edição (seção 13) |
| D16 | Regra de divergência até o corte | — | proposta na seção 3.3; confirmar |
| D17 | Gerenciador do monorepo | npm workspaces; pnpm workspaces; + Turborepo | npm workspaces (já é o gerenciador do projeto) + Turborepo opcional para cache de build |
| D18 | Contas da EvenX | as mesmas do Narrativas; contas próprias | **contas próprias** (seção 3.4): organização `evenx` no GitHub, workspace próprio no Railway, projeto próprio no Google Cloud, conta própria no Resend e na Cloudflare; o Narrativas fica nas contas atuais até o corte |
| D19 | Direitos sobre o código atual | — | **Não se aplica (2026-10-17):** o código e o repositório do Narrativas são do próprio autor do plano; podem ser levados para a EvenX sem acordo |

Registre aqui a decisão tomada e a data quando fechar cada uma.

---

## 3. Estratégia: projeto paralelo em monorepo

### 3.1 Por que copiar e evoluir (e não reescrever, nem refatorar no lugar)

- **Refatorar o Narrativas no lugar** obrigaria a esperar o fim da V edição e mexer num sistema em produção, exigindo que o motor de temas reproduzisse o Narrativas pixel a pixel.
- **Reescrever do zero** jogaria fora muita regra de negócio já resolvida e corrigida em produção (lista de espera, conflito de horário, avaliação cega, correções com versões, unificação de contas, certificados e Anais em PDF/Word, crachá, monitoria, e-mails em massa) — meses de trabalho e bugs reintroduzidos.
- **Copiar e evoluir** começa já, sem risco para o Narrativas; os services são levados; o schema continua "parente" do atual, o que torna a migração de dados mecânica (acrescentar `tenantId`, renomear valores de cor, copiar arquivos).

### 3.2 Estrutura do monorepo (JavaScript puro, sem TypeScript — stack do projeto)

```
evenx/
├── apps/
│   ├── api/                 # Express + Prisma — vem de narrativas/backend
│   ├── web/                 # Next.js — área interna (participante/gestor), site público genérico,
│   │                        #   LP (www.evenx.app.br) e painel da plataforma (painel.evenx.app.br)
│   └── site-narrativas/     # Next.js — páginas públicas atuais do Narrativas lendo /api/v1
├── packages/
│   ├── validacao/           # schemas Zod compartilhados front ↔ back
│   ├── rich-text/           # allowlists e sanitização (hoje sanitizadorRichText.js ↔ lib/richText.js)
│   ├── citacao/             # ABNT/APA/BibTeX/RIS (hoje utils/citacao.js ↔ lib/citacao.js)
│   ├── identificacao/       # CPF / documento estrangeiro
│   ├── marcadores/          # marcadores de e-mail e certificado, blocos condicionais
│   ├── tokens/              # tokens de design base e estilos prontos
│   └── cliente-api/         # cliente JS da /api/v1 (usado por site-narrativas, widgets e sites sob medida)
└── package.json             # npm workspaces
```

- **Ganho imediato:** acabam as cópias "mudou um, muda o outro" entre `backend/src/utils` e `frontend/lib` (validação, rich text, citação, identificação, marcadores de e-mail/certificado, blocos condicionais) — hoje uma fonte recorrente de bugs (campo novo só no backend some no front).
- **Módulos JS:** o backend é CommonJS (`require`) e o Next é ESM. Os pacotes compartilhados precisam funcionar nos dois — publicar em CommonJS e usar `transpilePackages` no Next, ou dual build. Decidir na Etapa 0.
- **Deploy:** cada app é um serviço próprio no Railway da EvenX (`api`, `web`, `site-narrativas`), mesmo banco por ambiente — contas da seção 3.4.
- **Criação:** o repositório `evenx` nasce de um clone do `narrativas` **com o histórico do git**, enviado para a organização `evenx` no GitHub (outra conta — o histórico vai junto), e os diretórios são movidos com `git mv` (`backend/` → `apps/api/`, `frontend/` → `apps/web/`).

### 3.3 Regra de divergência até o corte (D16)

Durante a transição o Narrativas continua evoluindo (Fase 2 até fev/2027). Proposta:

- **No repositório `narrativas`:** só correções e o que o evento precisar.
- **Cada commit do `narrativas` é portado para o monorepo** com `git format-patch` + `git am --directory=apps/api` (ou `apps/web`), registrado num checklist — o histórico compartilhado facilita. Funciona entre contas diferentes do GitHub: num clone local, os dois repositórios são *remotes*; basta acesso de leitura aos dois.
- **Funcionalidades novas grandes** (ex.: módulo 10, migração Even3) nascem já no monorepo sempre que não forem necessárias ao Narrativas antes do corte.
- **Congelamento:** a partir de uma data combinada antes do corte, o `narrativas` só recebe correções críticas.
- O repositório `narrativas` é arquivado depois do corte.

### 3.4 Contas separadas (D18)

A EvenX é um produto comercial com vida própria; o Narrativas, até o corte, é um projeto do GPDES. Cada um nas suas contas:

| Serviço | EvenX | Narrativas até o corte | No corte |
|---|---|---|---|
| GitHub | organização `evenx` (não conta pessoal: a empresa é dona do código, acesso por equipe, transferível) | repositório `narrativas` intacto | `narrativas` arquivado |
| Railway | workspace próprio, com homologação e produção, faturamento e variáveis separados | conta atual | dados exportados (`pg_dump`) → script de migração → banco da EvenX; serviços antigos desligados após o período de segurança |
| Google Cloud (buckets) | projeto e buckets próprios | buckets atuais | arquivos copiados para a EvenX (13.1); bucket antigo só leitura por um período |
| Resend | conta própria | conta atual | domínio do Narrativas verificado de novo na conta da EvenX (registros DNS novos) |
| Cloudflare | conta própria (Cloudflare for SaaS) | — | `narrativasdecoloniais.com.br` vira hostname customizado da EvenX com rotas por caminho |
| Domínio `narrativasdecoloniais.com.br` | — | registro com o dono atual | continua com o dono atual, que só aponta o DNS |

- **Segredos novos** na EvenX (JWT, chaves de API, credenciais), nunca copiados do Narrativas. Consequência já prevista: todos fazem login de novo uma vez no corte; as senhas continuam valendo.
- O monorepo terá o seu próprio `CLAUDE.md` e a sua própria memória de projeto.

### 3.5 Código e dados (D19)

- **Código:** o código e o repositório do Narrativas são do autor do plano; a cópia para o monorepo da EvenX não depende de acordo.
- **Dados (boa prática técnica):** homologação só com **cópia anonimizada** (nomes, e-mails, CPFs, documentos, telefones substituídos) — ambiente de teste não guarda dados reais de participantes. No corte, a política de privacidade do Narrativas é atualizada para refletir a nova hospedagem.

---

## 4. Diagnóstico do código atual

### O que já ajuda

- **Personalização visual madura, por edição** (logo SVG com cores editáveis, cores por dobra, faixas, Hero, navbar, aviso de contraste WCAG, motor Grupo/Lista/Item).
- **Tokens já são variáveis CSS** (~2.100 usos de `var(--…)` nos 138 arquivos SCSS).
- **Multi-edição desde o início:** 16 models já têm `edicaoId`.
- **Permissões granulares** (`SecaoAdmin`, `autorizarSecao`) — base para as permissões do tenant e as ferramentas da IA.
- **SDK da Anthropic, `sharp`, DOMPurify+jsdom, `pdf-parse`, `mammoth`** já instalados.
- **Páginas públicas do Narrativas já isoladas** em `app/(publico)` e `components/publico` — viram o ponto de partida de `apps/site-narrativas`.

### O que bloqueia (e será resolvido no monorepo)

| Ponto | Onde | Impacto |
|---|---|---|
| Unicidade global de `Edicao.numero/slug`, `TipoAtividade/TipoParticipacao/TipoPontoInteresse.nome`, `ConviteCoautor.email` (as de `Usuario` continuam globais — identidade única, 5.4) | `schema.prisma` | compostas com `tenantId` |
| Catálogos globais (`TipoAtividade`, `TipoParticipacao`, `TipoPontoInteresse`, `ModeloEmail`) | schema + services | por tenant |
| `buscarEdicaoAtual()` global | `edicoes.service.js` | por tenant |
| API em URL absoluta com cookie httpOnly; `COOKIE_DOMAIN`; CORS de origem única | `apiClient.js`, `env.js`, `app.js` | API servida no domínio de cada evento |
| Fetch de servidor do Next sem contexto de tenant | `lib/publico.js` | repassar o tenant |
| Filas e locks em memória por edição (7 services) | services | carregar `tenantId` |
| Rate limiters por IP/usuário | `rateLimiter.js` | chave com tenant |
| Bucket GCS sem prefixo por tenant; allowlist do rich text aceita o bucket inteiro | `storage.service.js`, sanitizadores | prefixo `tenants/<id>/` |
| Identidade do Narrativas fixa em ~90 arquivos | seção 7.5 | separar núcleo × site do Narrativas |
| Valores de estilo fixos no SCSS (~250 `border-radius`, 67 `font-size`, sombras, 47 cores fora dos tokens) | SCSS | tokenizar |
| `backend/.env` aponta para **produção** | — | homologação obrigatória (Etapa 0) |
| Testes (módulo 6) não iniciados | — | suíte na Etapa 0 |

---

## 5. Arquitetura alvo — modelo de dados

### 5.1 Novos models (esboço — nomes finais em português, conforme CLAUDE.md)

```prisma
model Tenant {
  id                  String   @id @default(uuid())
  slug                String   @unique          // subdomínio de reserva: <slug>.evenx.app.br (fora dos slugs reservados — D11)
  status              StatusTenant @default(ATIVO) // ATIVO | SUSPENSO | ENCERRADO
  nomeCurto           String                    // "Narrativas" — e-mails, títulos, área interna
  nomeCompleto        String
  instituicao         String?                   // "GPDES/UnB"
  urlInstituicao      String?
  formatoNomeEdicao   FormatoNomeEdicao @default(ROMANO) // ROMANO | ANO | LIVRE
  remetenteNome       String?
  remetenteEmail      String?
  dominioEmailStatus  StatusVerificacao?
  resendDominioId     String?
  limiteEmailsMes     Int      @default(10000)
  modulos             ModuloTenant[]
  planoId             String?
  modoSitePublico     ModoSitePublico @default(COMPLETO) // COMPLETO | EXTERNO (seção 11)
  urlSiteExterno      String?
  createdAt / updatedAt
}

model DominioTenant {
  id, tenantId, hostname @unique, principal Boolean, status StatusVerificacao, cloudflareHostnameId String?
  rotasEvenX String[] // roteamento por caminho (12.3): ex. ["/participante", "/admin", "/login", …]; vazio = domínio inteiro na EvenX
}

model TemaTenant {                              // 1:1 com Tenant — seção 7
  tenantId     String  @unique
  estiloBase   String  // NEUTRO | INSTITUCIONAL | MINIMALISTA | MODERNO
  cores        Json    // 7 posições: { TEXTO: {hex, nome}, PRIMARIA: …, … }
  coresInternas Json?  // null = derivar da pública
  fonteDestaque String
  fonteTexto   String
  tokens       Json    // tokens globais e por componente — só o que difere do estilo base
  variantes    Json    // { nav: "LOGO_ESQUERDA", programacao: "GRADE", … }
  logoUrl      String?
  faviconUrl   String?
  cssAvancado  String? // opcional, plano superior, filtrado e restrito ao tenant
}

model ConfiguracaoSiteSobMedida {               // seção 11.4 — mini-CMS dos sites sob medida
  tenantId  String  @unique
  esquema   Json    // campos declarados pelo site (tipo, rótulo, grupo, padrão, validação)
  valores   Json    // por edição: { [edicaoId]: { campo: valor } } ou globais
  versao    Int
}

model ChaveApi {                                 // seção 11.1
  id, tenantId, nome, prefixo, hash, escopos String[], origensPermitidas String[], ultimoUsoEm, criadaEm, revogadaEm
}

model VinculoTenant {          // 5.4 — a pessoa (Usuario global) dentro de um evento
  id, usuarioId, tenantId, @@unique([usuarioId, tenantId])
  papeis           PapelUsuario[]   // PARTICIPANTE | AVALIADOR | ORGANIZADOR | ADMIN — saem de Usuario.papeis
  acessoCompleto   Boolean          // saem de Usuario
  secoesPermitidas SecaoAdmin[]     // saem de Usuario
  consentimentos   Json             // ex.: e-mails em massa daquele evento
  criadoEm, encerradoEm             // "sair deste evento"
}
model AdminPlataforma { … }   // equipe da EvenX — tabela separada de Usuario
model ConversaIA { … }        // seção 14
model AcaoIA { … }            // auditoria das ações do chat
model Webhook { … }           // futuro (seção 18)
```

### 5.2 `tenantId` nas tabelas

- **Raízes** (obrigatório): `VinculoTenant`, `Edicao`, `TipoAtividade`, `TipoParticipacao`, `TipoPontoInteresse`, `ModeloEmail`, `ConviteCoautor`, `TokenVerificacao`, `RefreshToken`.
- **Filhas**: `tenantId` desnormalizado também (RLS igual em toda tabela, sem JOIN).
- **Exceção:** `Usuario` (identidade) **não** tem `tenantId` — ver 5.4 para as regras que substituem o isolamento nessa tabela. `TokenVerificacao` e `RefreshToken` guardam o `tenantId` do domínio onde foram emitidos (a sessão é por domínio).

### 5.3 Unicidades que mudam

| Hoje | Passa a ser |
|---|---|
| `Usuario.email`, `cpf`, `documentoEstrangeiro` | **continuam únicos na base inteira** (identidade única, 5.4) |
| `Edicao.numero`, `Edicao.slug` | únicos por tenant |
| `TipoAtividade/TipoParticipacao/TipoPontoInteresse.nome` | único por tenant |
| `ConviteCoautor.email` | único por tenant |
| Tokens aleatórios (`tokenCracha` — o crachá é da pessoa e vale em qualquer evento em que ela esteja inscrita —, `tokenCredenciamento`, `tokenPresenca`, `Certificado.codigo`, tokens de verificação) | continuam globais (e **preservados na migração** — seção 13), mas toda busca filtra também pelo tenant |

O índice de e-mail ainda diferencia caixa e há pares que só diferem na caixa (regra do CLAUDE.md) — resolver antes de a base receber o segundo evento.

### 5.4 Identidade única com vínculo por evento (D2)

Uma pessoa tem **uma conta** (`Usuario`: nome, CPF ou documento estrangeiro, e-mail, senha, foto) e um **vínculo por evento** (`VinculoTenant`: papéis, permissões por seção, consentimentos). Inscrições, submissões, avaliações, certificados e credenciamento continuam por edição, isolados por tenant.

**Ganhos:** um login para todos os eventos; sem cadastro repetido; CPF único elimina contas duplicadas; organizador de um evento pode ser participante de outro com a mesma conta.

**Login:** em cada domínio de evento, com as mesmas credenciais. **Sem login único automático entre domínios** — exigiria um domínio central de login visível na barra do navegador. A sessão (cookie, refresh token) é por domínio. O primeiro login num evento novo cria o vínculo `PARTICIPANTE`.

**Cadastro num evento com CPF ou e-mail já existentes:** "Você já tem cadastro. Entre com seu e-mail e senha" + e-mail mascarado (regras atuais de `mascararEmail`) — **nunca** revelar de quais outros eventos a pessoa participa.

**Regras que substituem o isolamento na tabela de identidade:**

| Hoje | Passa a ser |
|---|---|
| Aba "Usuários" e `BuscaUsuario` listam a base inteira | listam **só quem tem vínculo com o evento**; a extensão do Prisma força o JOIN com `VinculoTenant` em toda consulta de `Usuario` fora do client "plataforma" |
| Admin altera o e-mail de qualquer usuário (`PATCH /usuarios/:id/email`) | **removido para o admin do evento** — dados de identidade (nome, CPF/documento, e-mail, senha) só pela própria pessoa ou pelo suporte da EvenX; o admin edita só o vínculo |
| "Unificar contas" no admin do evento | vira função do **painel da EvenX** (afeta todos os eventos) |
| Promover/rebaixar admin altera `Usuario.papeis` | altera `VinculoTenant.papeis` daquele evento |
| Convite (organizador, avaliador, autor, coautor) para e-mail sem conta cria conta convidada | se o e-mail ou CPF já existem na base, cria **só o vínculo** — sem conta nova nem senha nova |
| Excluir conta (anonimização) | duas ações: **"sair deste evento"** (encerra o vínculo e anonimiza os dados daquele evento, com as regras atuais de autoria) e **"excluir minha conta"** (anonimiza a identidade global; bloqueada se houver autoria em qualquer evento) |
| Troca de e-mail pela pessoa | atualiza a identidade e, portanto, a comunicação de todos os eventos |

**Segurança:** uma senha vazada abre todos os eventos da pessoa — limite de tentativas também global (por conta, não só por domínio), alerta de login em domínio novo, verificação em duas etapas opcional (obrigatória para `ADMIN`/`ORGANIZADOR` numa fase posterior).

**LGPD:** a EvenX passa a ser **controladora da base de contas** (identidade e login); cada evento continua controlador dos dados de inscrição, submissão etc. Isso exige uma menção discreta no cadastro e na política de privacidade ("seus dados de acesso são geridos pela EvenX, plataforma usada por este evento") — a única exceção consciente à marca invisível (princípio 6).

**Importações** (Even3, inserção pela organização, coautores) casam com a base global por e-mail/CPF e criam o vínculo; a regra de associação automática precisa ser explícita antes do segundo evento importar dados.

**Fora por enquanto:** área "todos os meus eventos" (exigiria uma área da EvenX visível ao participante).

### 5.5 Campos de aparência da `Edicao` que saem do núcleo

Os ~55 campos `cor*`/`opacidade*`/`mostrarFaixa*` da `Edicao`, `logoSvg*`, `fundoHero*`, `faixaHero*`, `corFundoRealizadores` etc. são **específicos do site do Narrativas**. No monorepo:

- saem do schema da EvenX (a edição fica com conteúdo, não com estilo);
- seus valores atuais são migrados para `ConfiguracaoSiteSobMedida.valores` do tenant Narrativas, com um `esquema` declarado por `apps/site-narrativas` (seção 12.2);
- o site genérico da EvenX usa só `TemaTenant` (tema por tenant) + modo da Hero, banner e textos por edição.

### 5.6 Módulos por tenant

`ModuloTenant`: `INSCRICOES`, `ATIVIDADES`, `SUBMISSOES`, `AVALIACAO`, `ANAIS`, `CERTIFICADOS`, `CREDENCIAMENTO`, `MONITORIA`, `EMAILS_MASSA`, `CONTRIBUICAO`, `IMPORTACAO_EVEN3`, `IA`. Desligado ⇒ rotas 404, item some do menu e da home. Base dos planos (seção 15).

---

## 6. Arquitetura alvo — infraestrutura

### 6.1 Resolução do tenant pelo domínio

```
navegador ──► Cloudflare (Custom Hostnames, SSL, regras por caminho)
                 ├─► apps/web (Next)            área interna, site genérico, LP, painel
                 │      └─ /api/* ──rewrite──► apps/api (rede interna)
                 └─► apps/site-narrativas (Next) só para os caminhos públicos do Narrativas (12.3)
```

- **Next (`apps/web`):** o middleware lê o `Host`, resolve o tenant (cache curto) e injeta o tema como variáveis CSS no `<head>`, metadados e fontes. Host desconhecido → 404 neutra.
- **Express (`apps/api`):** resolve o tenant pelo host repassado pelo proxy confiável (`X-Forwarded-Host`, `trust proxy` restrito) ou por header interno assinado nas chamadas de servidor. Nunca confia em header de tenant vindo do navegador. Abre o contexto (AsyncLocalStorage) usado pelo Prisma.
- **Hosts da plataforma:** `www.evenx.app.br` → LP; `evenx.app.br` → redireciona para `www`; `painel.evenx.app.br` → painel. Reconhecidos antes de procurar um tenant.
- **Subdomínio de reserva** `<slug>.evenx.app.br`: funciona sem DNS do cliente; único ponto em que a marca pode aparecer ao participante — `noindex` quando há domínio próprio.

### 6.2 Isolamento de dados (duas barreiras)

1. **Aplicação:** extensão do Prisma Client (`$extends`) que injeta `where: { tenantId }` e `data: { tenantId }` a partir do contexto. Sem tenant ⇒ erro (falha fechada), exceto num client explícito "plataforma" (painel e manutenção).
2. **Banco:** Row Level Security com `current_setting('app.tenant_id')` por transação (`SET LOCAL`); usuário de banco da aplicação sem `BYPASSRLS`.
3. **Jobs em segundo plano** guardam o `tenantId` e reabrem o contexto ao rodar/retomar; locks chaveados por `tenantId:edicaoId`.
4. **Rate limiters:** chave `tenantId + IP/usuário`.
5. **Suíte de isolamento:** para cada rota, dados em dois tenants; A não lê nem altera B.

### 6.3 Autenticação e cookies

- API em `https://<dominio-do-evento>/api/*` ⇒ cookies first-party e host-only; sem `COOKIE_DOMAIN`, sem CORS (mesma origem).
- JWT com `tenantId` do domínio; token emitido num domínio e usado em outro é rejeitado (a conta é a mesma, mas a sessão é por domínio — 5.4).
- Papéis valem dentro do tenant (`VinculoTenant`). Equipe da plataforma = `AdminPlataforma`, login próprio; "entrar como" só com auditoria.
- Links de e-mail, QR codes e convites usam o domínio principal do tenant.

### 6.4 Storage (GCS)

- Prefixo `tenants/<tenantId>/` nos dois buckets (projeto próprio da EvenX no Google Cloud — 3.4); validação e allowlist do rich text restritas ao prefixo do tenant. Os arquivos do Narrativas são copiados na migração e as URLs reescritas (13.1); a allowlist aceita o bucket antigo só durante a transição.
- Opcional: servir arquivos pelo domínio do evento (`/arquivos/*`) para não expor `storage.googleapis.com`.
- Cota por plano.

### 6.5 E-mail

- Remetente no domínio do evento (domínio criado no Resend pela API, registros DNS mostrados ao cliente). Sem domínio verificado: domínio neutro separado (D11), nome do evento no "De", `Reply-To` do contato.
- `layoutEmailPublico` lê cores, fontes, nome e rodapé do tenant; os ~15 e-mails transacionais interpolam `{nomeCurto}`.
- Cota mensal por tenant; conta do Resend compartilhada e monitorada (cota e limite de domínios).

### 6.6 Domínios e SSL

- Tenant informa o domínio → CNAME → Cloudflare valida e emite certificado → `DominioTenant.status = ATIVO`.
- Regras por caminho quando o domínio é dividido entre a EvenX e um site sob medida (12.3).

### 6.7 SEO

- Sitemap, robots, canonical, Open Graph e `citation_*` por domínio do tenant.
- Domínio de reserva com `noindex` quando há domínio próprio ativo.

---

## 7. Tema e sistema de design da EvenX

Com o Narrativas virando site sob medida, o tema da EvenX **não precisa reproduzir o Narrativas**. Ele é pensado para o usuário comum: escolher um estilo pronto, ajustar poucas coisas, subir o banner — e ter um site bonito, responsivo e acessível.

### 7.1 Camadas

**Camada 1 — tokens globais**

| Eixo | Opções |
|---|---|
| Cores | 7 posições: `TEXTO`, `PRIMARIA`, `SECUNDARIA`, `SUPERFICIE`, `FUNDO`, `ESCURA`, `DESTAQUE` — cada uma com hex e nome de exibição |
| Tipografia | fonte de destaque e de texto (catálogo curado, 10–15 famílias com acentos verificados, licença livre — o backend precisa dos mesmos arquivos para PDFs); escala (compacta / padrão / ampla); peso dos títulos; caixa alta ou não; espaçamento entre letras |
| Arredondamento | nenhum / suave / arredondado / pílula → `--raio-p/m/g` |
| Bordas | fina / marcada / nenhuma |
| Sombras | nenhuma / sutil / elevada → `--sombra-1/2/3` |
| Densidade | compacta / confortável |
| Largura do conteúdo | estreita / padrão / larga |

**Camada 2 — tokens por componente** (herdam os globais): navbar (altura, fundo, marcação do link ativo); botões (preenchido/contorno, caixa alta, raio); cards (borda, sombra ou fundo); tabelas (zebrada ou divisórias, cabeçalho); campos (caixa ou sublinhado); selos, divisores, modais.

**Camada 3 — variantes de estrutura** (2 a 4 por componente, todas responsivas e acessíveis, como atributos `data-*` com um bloco SCSS por variante):

| Componente | Variantes |
|---|---|
| Navbar | logo à esquerda / centralizada / menu sempre recolhido |
| Hero | logo / banner / título (seção 8) |
| Programação | lista / grade de cards / linha do tempo |
| Cabeçalho das dobras | eyebrow / só título / título com linha |
| Rodapé | colunas / simples |

**Camada 4 — estilos prontos:** Neutro, Institucional (sóbrio, títulos com serifa, bordas finas), Minimalista (muito espaço, sem sombras, cantos retos), Moderno (sem serifa geométrica, cantos arredondados, cards com sombra). O `TemaTenant` guarda só o que difere do estilo base. Cada estilo pronto entra na regressão visual.

### 7.2 Regras

- **HTML/SCSS livre: não.** XSS e vazamento de dados, atualizações quebrando o CSS dos clientes, perda de responsividade/acessibilidade, IA ineficaz. Válvula opcional: "CSS avançado" em plano superior, sob o seletor do tenant, filtrado (sem `@import`, `url()` só do bucket do tenant), com aviso de que pode quebrar. Conteúdo continua pelo rich text sanitizado. Quem precisa de mais vai para o **site sob medida** (seção 11).
- **Guardrails:** contraste mínimo, tamanho mínimo de texto e foco visível validados no editor.
- **Área interna** (participante/gestor) aceita um subconjunto: cores, logo, fontes, arredondamento. É também a área interna do Narrativas depois do corte (D14).
- **Editor:** tela "Estilo" com prévia ao vivo (home + uma página interna); as mesmas opções são ferramentas do chat (seção 14).
- **`DESIGN.md`** vira dois: regras universais da plataforma (`apps/web`) e o guia do Narrativas (`apps/site-narrativas`).

### 7.3 Pré-requisito: tokenizar o SCSS

Levantamento de 2026-10-16 (138 arquivos SCSS): ~250 `border-radius` literais (`6px` ×144, `8px` ×42, `4px` ×32…), 67 `font-size` distintos, sombras com `rgba` literal, 33 cores hex e 14 `rgba` fora dos tokens. No monorepo esses literais viram tokens (Etapa 2). A paleta deixa de existir em cinco cópias (`_tokens-publico.scss`, `lib/cores.js`, `CampoCorSecao`, `CORES_EMAIL`, `icon.svg`) e passa a ter fonte única (`TemaTenant` + `packages/tokens`).

### 7.4 Inventário: o que é próprio do Narrativas e para onde vai

| Elemento | Destino |
|---|---|
| Paleta terrosa (tinta, barro, ocre, areia, papel, cerrado, búzio) | **núcleo**: valores do `TemaTenant` do Narrativas (pele da área interna, e-mails, PDFs) **e** `site-narrativas` |
| Saira Stencil One + Archivo | **núcleo** (catálogo de fontes) e `site-narrativas` |
| Logo SVG com reveal "rolo de tinta", cores editáveis | `site-narrativas` (o núcleo só tem logo simples + fade) |
| Búzios (3 SVGs, animação "lançados", convite de rolagem, marca do rodapé e da sidebar) | `site-narrativas`; na área interna, a sidebar usa a logo do tenant |
| Faixas laterais, textura de papel, divisor stencil | `site-narrativas` |
| Cores/opacidades por dobra, navbar configurável, faixas por seção (~55 campos da `Edicao`) | `site-narrativas` via `ConfiguracaoSiteSobMedida` (5.5, 12.2) |
| Ordem fixa das dobras e rótulos ("Apresentação", "Modalidades"…) | `site-narrativas` mantém; no núcleo viram configuráveis |
| Algarismos romanos nas edições | **núcleo**: `Tenant.formatoNomeEdicao` |
| Funções de monitoria pré-preenchidas da V edição | dado do tenant Narrativas, não padrão do núcleo |
| Favicon búzio | `TemaTenant.faviconUrl` do Narrativas |

### 7.5 Textos fixos no código → campos do tenant (núcleo)

| Onde | Exemplos | Vira |
|---|---|---|
| Metadados | `layout.jsx` ("Narrativas — GPDES/UnB"), `— Narrativas`, `siteName` dos Anais | `nomeCurto`, `instituicao` |
| Rodapé / home | "GPDES/UnB", "Conheça o GPDES", "Política de privacidade — em breve" | `instituicao`, `urlInstituicao`, política do tenant |
| Auth | "cadastrado no Narrativas" | `nomeCurto` |
| Área interna | `Sidebar`, `EditorSubmissao`, `ParticipantesPainel`, onboarding, QR inválido, `CartaoInscricaoParticipante` | `nomeCurto`/`nomeCompleto` |
| E-mails | `EMAIL_FROM`, cabeçalho "Narrativas", rodapé `NOME_EVENTO · GPDES/UnB`, ~15 assuntos/corpos | campos do tenant (6.5) |
| PDFs/DOCX | `creator`/`Author` em Anais e certificados; "Brasília: GPDES/UnB" no admin | campos do tenant |

---

## 8. Hero do site genérico: logo, banner ou título

`Edicao.modoHero`:

| Modo | Comportamento |
|---|---|
| `LOGO` | logo (SVG ou PNG/WebP) em destaque com fade, data, local, botão; fundo de cor ou imagem decorativa |
| `BANNER` | imagem **inteira, sem corte**, largura total; versão mobile opcional; faixa com data/local/"Inscreva-se" abaixo, ocultável; fundo ao redor = cor das bordas do banner |
| `TITULO` | nome do evento na fonte de destaque + data/local/botão — também o substituto quando nada foi enviado |

Recomendações de tamanho no admin (desktop 1920×600 a 1920×1080; mobile 1080×1350), com aviso não bloqueante.

---

## 9. Extração de cores a partir de uma imagem

1. **Extração determinística (backend):** `sharp` reduz a imagem → quantização (ex.: `node-vibrant`). Os hex vêm da imagem, nunca da IA.
2. **Mapeamento para as 7 posições** (claras → fundo/superfície, escuras → texto, vibrante → primária…).
3. **Ajuste de acessibilidade** em OKLCH (só luminosidade) até os pares atingirem o mínimo do `DESIGN.md`.
4. **2–3 propostas com prévia ao vivo:** "Fiel ao banner", "Sóbria", "Alto contraste".
5. **IA como intérprete (opcional):** decide papéis, sugere fonte e nomes das cores.
6. Paleta interna derivada; favicon a partir da logo; cor ao redor do banner.

---

## 10. Domínio da EvenX: site (LP) e painel da plataforma

### 10.1 Site comercial (LP) — `www.evenx.app.br`

| Seção | Conteúdo |
|---|---|
| Abertura | proposta de valor, "Contratar" e "Agendar demonstração" |
| Funcionalidades | inscrições com vagas e lista de espera; submissão com avaliação cega; resultado e correções; Anais com Google Acadêmico, PDF e Word; certificados com validação pública; credenciamento por QR e crachá virtual; monitoria; e-mails em massa; acessibilidade |
| Personalização e marca invisível | domínio próprio, e-mails do domínio do evento, paleta do banner, estilos prontos e ajuste fino |
| Site sob medida e integração | sites como o do Narrativas e o do CBIS, API e widgets (seção 11) — o Narrativas como estudo de caso |
| IA | "envie a chamada do seu evento e ele fica pronto" |
| Formas de contratação | planos e preços (por edição ou anual), o que cada um inclui, PIX/boleto/cartão; **plano Integração** e **site sob medida** como serviço |
| Migração do Even3 | importação de inscritos e trabalhos |
| Depoimentos e eventos que usam | só com autorização expressa e consentimento de uso de nome/foto (LGPD) — a marca invisível é uma promessa ao cliente |
| Perguntas frequentes, contato, termos e privacidade da EvenX | — |

Pele própria da EvenX (D10). Conteúdo editado no painel (depoimentos, vitrine, planos, FAQ) sem deploy. "Contratar" leva ao autoatendimento (Etapa 11); antes disso, a contato/lista de espera. Uma versão simples (abertura, funcionalidades, lista de espera) pode ir ao ar a qualquer momento.

### 10.2 Painel da plataforma — `painel.evenx.app.br`

Tenants (criar, suspender, encerrar, exportar), domínios (Cloudflare, principal, rotas por caminho), e-mail (Resend, DNS, uso), módulos e limites, "entrar como" com auditoria, métricas e saúde, conteúdo da LP, contatos e lista de espera.

---

## 11. Modo integração: API pública e site sob medida

### 11.1 API pública de conteúdo (só leitura)

- **Recursos:** edição (datas, local, janela de inscrições), programação (atividades, dias, horários, local, pessoas, vagas restantes, trabalhos apresentados quando publicados), modalidades/áreas/prazos, realizadores, apoiadores, grupos de conteúdo (comissões, programas), contribuição, monitoria (edital, janela), Anais, configuração do site sob medida (11.4).
- **Contrato próprio e versionado** (`/api/v1/…`), OpenAPI, DTOs estáveis — não as rotas internas. Mudança incompatível = `/v2` com prazo de convivência.
- **Chave por tenant** (`ChaveApi`): só dados públicos, origens autorizadas, limite por chave, revogável, guardada como hash. Cache (ETag + CDN).
- Rich text já sanitizado + texto puro.
- **`packages/cliente-api`:** cliente JS oficial, usado pelo `site-narrativas`, pelos widgets e pelos sites sob medida.
- **Widgets embutíveis** (programação, botão de inscrição com vagas, contador de prazo) em Shadow DOM.

### 11.2 Entrar e Cadastrar: páginas hospedadas pela EvenX

Os botões do site externo são **links** para as telas da EvenX — nunca formulários que enviam senha à API a partir do site do cliente (risco de captura por scripts de terceiros, responsabilidade LGPD indefinida, perda de controle dos fluxos de CPF/documento, confirmação de e-mail, recuperação e limite de tentativas). As telas ficam no domínio do evento (subdomínio ou mesmo domínio por caminho — 12.3), com a pele do evento. Opcional: `GET /api/v1/sessao` para o site mostrar "Olá, Fulano".

### 11.3 O que continua hospedado pela EvenX no modo integração

Login, cadastro, confirmação de e-mail, recuperação de senha, convites; área do participante e do gestor (com "Voltar ao site do evento"); validação de certificado; credenciamento por QR; Anais (recomendado: `citation_*`, PDF, citação já prontos — a API também os expõe). A home pública do tenant redireciona para `urlSiteExterno` quando o domínio não é dividido por caminho.

### 11.4 Configuração do site sob medida (mini-CMS)

Para que o gestor continue editando o visual de um site sob medida sem a EvenX conhecer os detalhes dele:

- o site declara um **esquema** de campos (cor da paleta ou hex, opacidade 0–100, sim/não, imagem, SVG sanitizado, texto, escolha entre opções), agrupados por seção, com padrão e validação;
- o admin da EvenX **gera o formulário** a partir do esquema (tela "Site do evento"), com os validadores de sempre (contraste, sanitização de SVG/imagem);
- a API entrega os valores (`/api/v1/site`), por edição ou globais;
- o esquema é versionado junto com o site (`apps/site-narrativas` publica o seu).

É assim que as personalizações atuais do Narrativas (Hero, faixas, cores por dobra, navbar, logo SVG com cores editáveis) continuam editáveis pelo admin depois da migração.

### 11.5 Tela "Integrações" e ofertas

- **Tela "Integrações"** no admin: chaves, origens, URL do site externo, modo do site público, documentação, widgets, consumo.
- **Plano Integração:** para quem já tem site — paga pela operação.
- **Site sob medida (serviço):** a equipe da EvenX constrói o site como um app do monorepo (`apps/site-<cliente>`) consumindo a API. O Narrativas é o primeiro; o CBIS ([cbis26.web.app](https://cbis26.web.app/)) é o tipo de cliente-alvo.

---

## 12. O site do Narrativas como site sob medida

### 12.1 O que é

`apps/site-narrativas` = as páginas públicas atuais (`app/(publico)` + `components/publico` + estilos e tokens públicos) movidas para um app próprio, trocando a origem dos dados de `/publico/*` para `/api/v1/*` via `packages/cliente-api`. Mantém tudo o que é próprio do Narrativas: logo com rolo de tinta, búzios, faixas, textura, divisor stencil, ordem das dobras, navbar. **Regressão visual contra o Narrativas atual**: páginas públicas idênticas.

Páginas: home, edições anteriores, atividade, submissão (modalidade/área — o envio em si acontece na EvenX), monitoria (edital), Anais (ou redirecionamento — 12.4), widget de acessibilidade/VLibras.

### 12.2 Personalização editável

O `site-narrativas` declara o seu esquema na `ConfiguracaoSiteSobMedida` (11.4) com os campos de hoje (cores e opacidades por dobra, Hero, faixas desktop/mobile, navbar, logo SVG e suas cores, cores do destaque da monitoria…). A migração (seção 13) copia os valores atuais da `Edicao` para lá. O admin do Narrativas continua editando tudo, agora na tela "Site do evento" da EvenX.

### 12.3 Domínio: roteamento por caminho, sem quebrar nenhum link

`narrativasdecoloniais.com.br` continua sendo o único domínio. Na Cloudflare (`DominioTenant.rotasEvenX`):

| Caminhos | Vai para |
|---|---|
| `/participante/*`, `/admin/*`, `/equipe/*`, `/editor/*`, `/login`, `/cadastro`, `/confirmar-email`, `/definir-senha`, `/recuperar-senha`, `/redefinir-senha`, `/inscricao`, `/submissao/*/enviar`, `/validar-certificado/*`, `/api/*` | `apps/web` (EvenX) |
| todo o resto (home, atividades, edições, monitoria, Anais…) | `apps/site-narrativas` |

Assim os QR codes de certificados já emitidos, os links de e-mails enviados, os QR de credenciamento impressos e as citações dos Anais continuam funcionando. A lista exata sai do inventário de rotas na Etapa 4.

### 12.4 Anais

Duas opções, decidir na Etapa 4: (a) páginas dos Anais no `site-narrativas` lendo a API (mantém o visual do Narrativas); (b) Anais hospedados pela EvenX no mesmo domínio por caminho. Em ambas, **as URLs `/anais/<edicao>/<artigo>` não mudam** (indexação do Google Acadêmico e citações).

---

## 13. Migração do Narrativas para a EvenX

### 13.1 O que migra

| Item | Como |
|---|---|
| Banco | script de migração do schema atual → schema EvenX: cria o tenant Narrativas, acrescenta `tenantId`, renomeia valores de cor para posições, move os campos de aparência da `Edicao` para `ConfiguracaoSiteSobMedida`, catálogos globais → do tenant |
| Contas | as contas do Narrativas viram a **semente da base global de identidades**; `Usuario.papeis`/`acessoCompleto`/`secoesPermitidas` viram `VinculoTenant` do tenant Narrativas; pares de e-mail que só diferem na caixa resolvidos antes |
| Senhas | hashes bcrypt copiados como estão — ninguém precisa redefinir senha |
| Sessões | refresh tokens podem ser descartados (todos entram de novo uma vez) ou migrados — decidir |
| Identificadores públicos | **preservados**: `Certificado.codigo`, `tokenCracha`, `tokenCredenciamento`, `tokenPresenca`, slugs de edição/atividade/artigo, convites pendentes |
| Arquivos (GCS) | **copiados** do bucket do Narrativas para `tenants/<id>/` no bucket da EvenX (públicos e privados — autorizações de monitoria inclusive); **URLs reescritas no banco**, inclusive dentro do rich text (resumos, referências, editais, apresentação dos Anais), logos, fundos de certificado, PDFs/DOCX dos Anais |
| Bucket antigo | fica **só leitura** por um período de transição: links externos (Google Acadêmico apontando para PDFs dos Anais, e-mails antigos com imagens) continuam funcionando; depois, redirecionar ou manter os PDFs dos Anais publicados |
| Segredos | novos na EvenX (3.4) — por isso todos entram de novo uma vez |
| E-mails pendentes/filas | esvaziadas antes do corte |

### 13.2 Ensaio e corte

0. **Antes do corte:** política de privacidade do Narrativas atualizada para a nova hospedagem (3.5).
1. **Ensaios em homologação** com cópia anonimizada: rodar o script, comparar contagens por tabela, conferir telas-chave, rodar a regressão visual do site público e o roteiro de testes da área interna.
2. **Janela de corte (D15):** depois de emitidos os certificados e publicados os Anais da V edição e antes de abrirem as inscrições/submissões da VI edição. Comunicar participantes e equipe antes.
3. **No corte:** Narrativas antigo em modo leitura → backup → migração → verificação → troca das rotas na Cloudflare.
4. **Volta:** o sistema antigo fica parado mas intacto por N dias; reverter = devolver as rotas da Cloudflare (dados criados após o corte precisariam ser reconciliados — por isso o corte é numa janela calma).
5. Depois do período de segurança: repositório `narrativas` arquivado, serviços antigos do Railway desligados; bucket antigo mantido só leitura até o fim da transição (13.1).

---

## 14. Criação e personalização por chat com IA

### 14.1 O que o chat faz

- **Criar o evento a partir de documentos** (chamada/edital/programação em PDF/DOCX): datas, modalidades, áreas, atividades, prazos — em rascunho.
- **Personalizar a aparência** sobre tokens, variantes e estilos prontos: "use as cores do banner", "algo mais sóbrio, sem sombras e com cantos retos", "programação em grade de cards".
- **Escrever textos** (apresentação, dobras, modelos de e-mail) e **configurar** (janelas, vagas, certificados, critérios dos Anais).

### 14.2 Como funciona

- Claude API com tool use em `apps/api` (`@anthropic-ai/sdk`). Sonnet 5.5 padrão; Opus 5.5 para montar evento a partir de documentos longos; Haiku 4.5 para tarefas simples.
- **Ferramentas = services existentes**, com os mesmos validadores Zod (`packages/validacao`) e `autorizarSecao`.
- **Rascunho → prévia → publicar**; validações viram feedback; auditoria e desfazer (`AcaoIA`).
- Conteúdo de documentos = dado, nunca instrução; ações destrutivas fora do alcance da IA; limites e custo por tenant.

### 14.3 Interface

Painel de chat ao lado da prévia ao vivo, histórico por edição, sugestões iniciais.

---

## 15. Cobrança, planos, LGPD e jurídico

- **Planos:** inscritos por edição, e-mails/mês, armazenamento, módulos, domínio próprio, IA, Integração; site sob medida como serviço. Gateway com PIX/boleto/cartão (D6). Inadimplência ⇒ site público só leitura, nada apagado.
- **LGPD:** EvenX = **controladora da base de contas** (identidade e login, por causa da identidade única — 5.4) e **operadora** dos demais dados; cada evento = controlador das inscrições, submissões etc.; DPA no aceite; política de privacidade por tenant; "sair deste evento" (vínculo) e "excluir minha conta" (identidade global); encerramento de tenant = exportação completa → retenção → exclusão física; registro dos acessos de suporte.
- **Termos:** da plataforma (para o evento) e do evento (para o participante).

---

## 16. Etapas de execução

Tamanho relativo: P (dias), M (1–3 semanas), G (1–2 meses). Até a Etapa 6, **nada toca o Narrativas em produção**.

### Etapa 0 — Monorepo, homologação e testes · M
- Contas da EvenX (D18, 3.4): organização `evenx` no GitHub, workspace no Railway, projeto no Google Cloud; Resend e Cloudflare podem esperar as Etapas 3 e 5.
- Repositório `evenx` a partir de um snapshot do `narrativas` com histórico; `git mv` para `apps/api` e `apps/web`; npm workspaces (D17); decisão CommonJS/ESM dos pacotes.
- Primeiros `packages/*` (validacao, rich-text, citacao, identificacao, marcadores) eliminando as cópias front/back.
- Ambiente de homologação no Railway da EvenX (banco e serviços próprios, **cópia anonimizada** do Narrativas — 3.5).
- Testes de integração das rotas críticas; referência de regressão visual do Narrativas atual (páginas públicas e internas).
- Checklist de portabilidade de commits do `narrativas` (3.3).
- **Pronto quando:** monorepo rodando em homologação com os dados de cópia, CI verde, referência visual capturada.

### Etapa 1 — Fundação multi-tenant · G
- `Tenant`, `DominioTenant`, `VinculoTenant` (papéis e permissões saem de `Usuario`), `tenantId` em tudo exceto a identidade, unicidades compostas; regras da identidade única (5.4): busca e listagem de usuários só pelo vínculo, admin do evento sem edição de identidade, unificação de contas no painel da EvenX, convite que só cria vínculo, "sair deste evento" × "excluir minha conta"; extensão do Prisma + RLS; resolução por `Host`; API em `/api` no mesmo domínio; cookies host-only; JWT com tenant; catálogos, filas, locks e limitadores por tenant; prefixo de storage; suíte de isolamento.
- **Pronto quando:** dois tenants de teste em homologação, sem um enxergar nada do outro — inclusive uma mesma pessoa inscrita nos dois, com o admin de cada um vendo só o que é do seu evento.

### Etapa 2 — Tema e sistema de design · G
- Tokenizar o SCSS (7.3); `TemaTenant`; 7 posições de cor; catálogo de fontes; tokens globais e por componente; variantes; estilos prontos; guardrails; tela "Estilo" com prévia; área interna com pele (subconjunto); textos da seção 7.5 interpolados; e-mails e PDFs lendo o tenant; `formatoNomeEdicao`.
- Os campos de aparência da `Edicao` saem do schema do núcleo (5.5).
- **Pronto quando:** um tenant de teste com estilo completamente diferente, sem vestígio do Narrativas, e a área interna com a pele do Narrativas aprovada visualmente.

### Etapa 3 — API v1 e modo integração · M
- `/api/v1` com OpenAPI, `ChaveApi`, origens, limite, cache; `packages/cliente-api`; `ConfiguracaoSiteSobMedida` + tela "Site do evento"; login hospedado com retorno ao site; `modoSitePublico`; widgets; tela "Integrações".
- Pode correr em paralelo com a Etapa 2.
- **Pronto quando:** um site externo de teste mostra a programação pela API e leva o participante do "Entrar" à área dele, sem senha passando pelo site externo.

### Etapa 4 — Site do Narrativas sobre a API · M
- `apps/site-narrativas` a partir das páginas públicas atuais, lendo `/api/v1`; esquema da configuração do site (12.2); decisão sobre os Anais (12.4); inventário de rotas para o roteamento por caminho (12.3).
- **Pronto quando:** em homologação, com a cópia dos dados migrada, as páginas públicas são idênticas às atuais (regressão visual verde) e editáveis pela tela "Site do evento".

### Etapa 5 — Domínios e e-mail por tenant · M
- Cloudflare for SaaS com regras por caminho; Resend por tenant; remetente neutro de reserva; SEO por host.
- Pode correr em paralelo com as Etapas 2–4.
- **Pronto quando:** tenant de teste com domínio próprio, SSL e e-mail do próprio domínio; domínio de teste dividido por caminho entre `apps/web` e um site sob medida.

### Etapa 6 — Migração do Narrativas · M
- Script de migração com cópia dos arquivos e reescrita de URLs (13.1); domínio do Narrativas verificado no Resend da EvenX; ensaios em homologação; comunicação; corte na janela D15; período de segurança; arquivamento do `narrativas`.
- **Pronto quando:** `narrativasdecoloniais.com.br` servido pela EvenX (área interna) + `site-narrativas` (público), com certificados antigos validando, links de e-mails antigos funcionando e nenhuma senha redefinida.

### Etapa 7 — Hero em modos e extração de cores · M
- `modoHero`, logo raster, banner sem corte; extração de paleta com prévia (seção 9).
- Pode começar assim que a Etapa 2 existir.

### Etapa 8 — Painel da plataforma · M
- `AdminPlataforma`, tenants, domínios e rotas, módulos e limites, "entrar como", métricas, saúde.
- **Pronto quando:** criar um evento novo do zero sem tocar em banco nem código.

### Etapa 9 — IA · G
- Cores com interpretação → chat em rascunho com auditoria → evento a partir do edital; limites e custo por tenant.

### Etapa 10 — Cobrança e autoatendimento · M
- Gateway, planos, suspensão; "Contratar" da LP → tenant em `<slug>.evenx.app.br` → onboarding; termos, DPA, política de privacidade.

### Etapa 11 — Lançamento comercial · M
- LP completa (10.1), identidade da EvenX (D10), documentação, suporte, monitoramento, backups testados, plano de incidentes.
- **Pronto quando:** um organizador que não conhece a EvenX entende o produto pela LP, escolhe um plano e contrata sem falar com ninguém.

**Ordem e dependências:**

```
0 → 1 → ┬─ 2 (tema)      → 7 (Hero e cores) → 9 (IA)        ─┐
        ├─ 3 (API)       → 4 (site Narrativas) → 6 (migração) ├─→ 11 (lançamento)
        └─ 5 (domínios)  → 8 (painel)       → 10 (cobrança) ─┘
```

A migração (6) também depende da 2 (pele da área interna) e da 5 (rotas por caminho). A coluna do meio — a trilha do Narrativas — tem prioridade: termina com o corte e prova a plataforma em produção com um cliente real. As outras colunas avançam conforme a capacidade do time; a LP simples pode subir a qualquer momento.

---

## 17. Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Divergência entre `narrativas` e o monorepo durante a transição | alta | alto | regra de divergência (3.3), checklist de portabilidade, histórico compartilhado, congelamento antes do corte |
| Tentação de reescrever em vez de levar | média | alto | princípio 4; cada service é movido e só então adaptado |
| Admin de um evento enxergando ou alterando pessoas de outros eventos pela tabela de identidade global | média | crítico | busca/listagem só por vínculo forçada na extensão do Prisma, identidade editável só pela pessoa ou pelo suporte, testes de isolamento com a mesma pessoa em dois eventos |
| Uma senha vazada abrindo todos os eventos da pessoa | média | alto | limite de tentativas global por conta, alerta de login em domínio novo, verificação em duas etapas para organizadores |
| Revelar a um evento a participação da pessoa em outros | baixa | alto | mensagens de "já tem cadastro" só com e-mail mascarado, nenhuma tela ou API cruza vínculos |
| Vazamento de dados entre tenants | média | crítico | extensão do Prisma com falha fechada + RLS + suíte de isolamento + tokens filtrados por tenant |
| Migração de dados do Narrativas | média | alto | schema "parente", ensaios em homologação, comparação de contagens, backup, volta por rotas da Cloudflare |
| Links antigos quebrando (QR de certificados, e-mails, Anais) | média | alto | roteamento por caminho no mesmo domínio, identificadores preservados, inventário de rotas na Etapa 4 |
| Área interna do Narrativas estranhando os usuários | baixa | médio | pele do Narrativas, aprovação visual na Etapa 2, comunicação antes do corte |
| Mudança na API pública quebrando sites de clientes (inclusive o do Narrativas) | média | alto | contrato versionado, DTOs separados, testes de contrato, `site-narrativas` no mesmo monorepo pega quebras no CI |
| Chave de API exposta no site do cliente | alta | baixo | só dados públicos, origens autorizadas, limite, revogação |
| Combinações de estilo quebrando layouts | média | médio | opções fechadas, guardrails, regressão por estilo pronto, ≤ 4 variantes por componente |
| Troca de DNS do domínio do Narrativas | baixa | alto | janela planejada, TTL baixo antes, volta documentada |
| Dependência de contas antigas (bucket, Resend) depois do corte | média | alto | arquivos copiados e URLs reescritas, domínio reverificado no Resend da EvenX, bucket antigo só leitura por um período definido |
| Entregabilidade de e-mail em domínios novos; limites do Resend | média | médio | aquecimento gradual, remetente neutro de reserva, monitoramento |
| Custo e erro da IA | média | médio | rascunho obrigatório, ferramentas validadas, limites por plano |

---

## 18. Fora do escopo / futuro

- **Inscrição paga** (maior lacuna frente ao Even3).
- DOI para os trabalhos dos Anais (Crossref).
- Tema por edição (D3 opção b); organização acima do evento (D1 opção b).
- **Webhooks** (inscrição criada, submissão recebida, resultado divulgado, certificado emitido).
- **Login com a conta do cliente** (OIDC/SAML) — associados de sociedades científicas.
- API de escrita, só com demanda real.
- Inglês/espanhol; credenciamento offline; catálogo de estilos prontos de terceiros.
