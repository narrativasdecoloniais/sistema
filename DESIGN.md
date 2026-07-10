# DESIGN.md — Identidade visual e princípios de UI/UX
## Sistema Narrativas Interculturais, Decoloniais e Antirracistas em Educação (GPDES/UnB)

> Este documento é a fonte de verdade do design. Antes de criar ou alterar qualquer tela, leia e siga o que está aqui. Em caso de conflito com instruções antigas, este documento vence.

---

## 1. Conceito central

O sistema tem **duas peles e um só espírito**:

- **Site público** (landing, login, cadastro, páginas de edição): é um **cartaz**. Estética editorial de lambe-lambe — tipografia stencil como imagem, búzio como assinatura, papel único, vazio disciplinado. A referência é a comunicação de rua dos movimentos que o evento estuda: direta, material, sem verniz corporativo.
- **Área interna** (participante, avaliador, organizador, admin): é uma **ferramenta**. Silenciosa, legível, produtiva. A mesma família terrosa, dessaturada; hierarquia por espaçamento e peso, nunca por decoração.

Regra de bolso: **a ousadia mora no público; a disciplina mora no interno.** Nenhuma tela mistura os dois registros.

### Decisões conceituais inegociáveis

- **Sem algarismos romanos** como recurso de design (numeração de seções, passos, listas): numeração imperial contradiz a identidade decolonial. Exceção única: a numeração de edição do evento ("V edição"), que é convenção da marca do cliente e permanece.
- **Sem ícones de UI kit no site público** (calendário, pessoa+, bússola etc.). O marcador do mundo público é o **búzio**. Na área interna, ícones de linha são permitidos com parcimônia (Lucide, traço 1.5px), nunca como decoração.
- **O búzio é assinatura, não padronagem.** . Ele marca; não tapeça.
- **Nada de**: gradientes decorativos, glassmorphism, sombras difusas grandes, cantos muito arredondados (raio máx. 6px em qualquer contexto), emojis na interface, marcadores numerados "01/02/03" de template.

## 2. Tokens de cor

### Pele pública (`_tokens-publico.scss`)

| Token | Valor | Uso |
|---|---|---|
| `--tinta` | `#201914` | Texto, títulos stencil, logo |
| `--barro` | `#9C4A2F` | CTAs, links, destaques de ação |
| `--ocre` | `#B87C34` | Acento secundário, uso pontual |
| `--buzio` | `#EDB153` | O búzio e detalhes-assinatura (conferir amostragem no PNG da logo) |
| `--areia` | `#EDE4D4` | Superfícies de apoio raras (não usar como faixa de seção) |
| `--papel` | `#FAF6EE` | Fundo único das páginas públicas |
| `--cerrado` | `#55603F` | Apoio pontual (detalhes, estados) |
| `--texto-suave` | `#4D4842` | Texto secundário — ~8.4:1 sobre `--papel` e ~7.2:1 sobre `--areia`, acima do mínimo AA (4.5:1) em ambos |

### Pele interna (`_tokens-interno.scss`)

| Token | Valor | Uso |
|---|---|---|
| `--fundo` | `#FBFAF7` | Fundo das telas internas |
| `--superficie` | `#FFFFFF` | Cards, tabelas, formulários |
| `--borda` | `#E7E1D6` | Bordas de 1px, separadores |
| `--texto` | `#2B2620` | Texto principal |
| `--texto-suave` | `#7A7166` | Texto secundário — 4.59:1 sobre `--fundo` e 4.79:1 sobre `--superficie`, ambos acima do mínimo AA (4.5:1) |
| `--acento` | `#A05C3B` | Ações primárias e estados ativos, somente |
| `--sucesso` | `#5C7A4E` | Confirmações |
| `--alerta` | `#B98A3A` | Avisos |
| `--erro` | `#A94434` | Erros e ações destrutivas |

Regras: cor nunca em hex solto no SCSS — sempre via token. SVGs herdam cor por `currentColor`. Nenhum componente interno usa a paleta pública vibrante, e vice-versa.

## 3. Tipografia

### Pública
- **Display stencil** (Saira Stencil One): títulos de página e de seção, caixa alta, tracking 0.08–0.15em, cor `--tinta`. É o eco do cartaz — usar com força, mas só em títulos. **Sempre verificar diacríticos** (ç, ã, õ, á, é) ao criar título novo.
- **Archivo**: todo o resto — corpo, botões, formulários, legendas. Variações de peso e largura criam hierarquia.
- Um título stencil por dobra é o ideal; dois stencils empilhados (eyebrow + título) é overdose.

### Interna
- **Archivo (ou Inter)** única, em escala contida: título de página ~1.5rem/600, título de card ~1.125rem/600, corpo 0.9375rem/400, apoio 0.8125rem. **Sem stencil na área interna** — exceção única: pode aparecer discretamente no logotipo/wordmark do shell (topbar), nunca em conteúdo.
- Hierarquia por peso, tamanho e cor de texto. Nunca por caixas coloridas ou fundos chamativos.

### Ambas
- Fontes via `next/font`, `display: swap`, subset latino completo.
- Corpo de texto: máx. 65–75ch de largura. Line-height 1.5–1.65 no corpo.

## 4. Grafismos (componentes em `frontend/components/graficos/`)

| Componente | Uso permitido | Onde NÃO usar |
|---|---|---|
| `Buzio` | Marcador de seção pública, detalhe do cue de rolagem, favicon, marca | Como bullet repetido de listas longas; área interna (exceto wordmark) |
| `Carimbo` | Envolver botão "Entrar" e selos de estado ("EM BREVE", "V EDIÇÃO") no público | Botões internos, inputs |
| `Divisor` | Reservado — atualmente fora da landing; só reintroduzir com aprovação | Uso livre |
| `TexturaPapel` | Reservado para usos futuros aprovados | Fundos de seção |
| `MarcaRodape` | Rodapé público | Área interna |

Regras: todo grafismo novo segue o padrão — JSX puro, `<svg>` inline, `viewBox` definido, cor por `currentColor`/prop, `aria-hidden` quando decorativo, sem hex fixo, sem gradiente/sombra, estética de molde vazado (vãos, pontas retas, imperfeição controlada).

## 5. Padrões de layout

### Público
- **Fundo único `--papel`** por página — sem faixas de cor alternadas, sem divisores tracejados. Separação entre seções por espaço em branco e escala tipográfica.
- **Grid assimétrico**: marcador (búzio) ancorado à esquerda, conteúdo à direita. Nada centralizado flutuando, exceto o hero.
- Altura de seção **nasce do conteúdo** (padding `clamp(4rem, 8vw, 7rem)`); proibido `min-height` que gere vazio residual.
- **Navegação**: sem navbar tradicional (logo à esquerda + links à direita). No topo, só o carimbo "Entrar". A barra mínima de âncoras surge ao rolar além do hero e some ao voltar — **sem logo dentro dela**. Rodapé é o índice completo.
- A logo aparece **uma vez por página**, em escala de cartaz. Nunca reduzida a selo de canto.

### Interno
- **Shell fixo**: sidebar de navegação (ou topbar em telas de escopo único) + área de conteúdo sobre `--fundo`; conteúdo em cards `--superficie` com borda `--borda` de 1px, raio 4–6px, sem sombra (ou sombra mínima 0 1px 2px).
- Densidade confortável: tabelas com linhas de ~48px, formulários em coluna única (duas no máximo, para campos curtos relacionados), rótulos acima dos campos.
- Página interna típica: título da página + descrição curta → ações primárias à direita do título → conteúdo. Breadcrumb quando a hierarquia passa de dois níveis.
- Botões: primário preenchido `--acento` (um por tela, o da ação principal), secundário com borda, terciário como texto. Destrutivo em `--erro` com confirmação.

## 6. Princípios de UX

1. **Público seduz, interno resolve.** No público, a pergunta é "isso convida?"; no interno, "isso economiza um clique?".
2. **O usuário típico não é técnico**: docentes, estudantes e comunidade externa, muitas vezes no celular. Linguagem simples, em português, sem jargão de sistema ("Submeter" → "Enviar").
3. **Mobile-first no público** (inscrição acontece no celular); interno responsivo com prioridade a desktop (gestão acontece na mesa), mas o credenciamento QR é mobile-first absoluto.
4. **Estados sempre desenhados**: todo fluxo tem carregando, vazio (com orientação do que fazer), erro (com como resolver) e sucesso. Tela vazia nunca é tela em branco.
5. **Feedback imediato**: validação de formulário no campo, ao sair dele; mensagens de erro dizem o que corrigir, nunca só "dados inválidos".
6. **Nada se perde**: ações destrutivas pedem confirmação; formulários longos preservam dados em erro de envio.
7. **O caminho feliz em até 3 cliques**: inscrever-se, baixar QR code e baixar certificado são as ações-âncora do participante — sempre visíveis na área dele.

## 7. Acessibilidade (inegociável, em todas as telas)

- Contraste **AA (≥ 4.5:1)** para texto, **3:1** para componentes de UI — testar sobre o fundo real do contexto.
- Navegação completa por teclado; **foco visível** (outline 2px `--barro`/`--acento`, offset 2px); skip link nas páginas públicas.
- HTML semântico (`header/nav/main/footer`, headings em ordem); formulários com `label` associado, erros ligados por `aria-describedby`.
- `prefers-reduced-motion`: toda animação (incluindo pulso do búzio) desligada ou reduzida a fade.
- Imagens com `alt` significativo; grafismos decorativos com `aria-hidden="true"`.
- Alvos de toque ≥ 44px no mobile.
- Compatibilidade com VLibras prevista no site público (não quebrar o widget com z-index/overflow).

## 8. Stack e implementação (resumo — detalhes no CLAUDE.md)

- Next.js (App Router), **JavaScript/JSX puro — proibido TypeScript**; **SCSS Modules — proibido Tailwind** e CSS-in-JS; Express + PostgreSQL/Prisma no backend.
- Rotas públicas no grupo `(publico)` consomem `_tokens-publico.scss`; rotas internas no grupo `(interno)` consomem `_tokens-interno.scss`. Uma tela nunca importa os tokens da outra pele.
- Código em inglês; UI, mensagens e commits em português.

## 9. Checklist antes de dar uma tela por pronta

- [ ] A tela está na pele certa (pública = cartaz / interna = ferramenta) e só usa os tokens dela?
- [ ] Zero hex solto, zero numeral romano decorativo, zero ícone genérico no público?
- [ ] Título em stencil (público) com diacríticos corretos? / Sem stencil no conteúdo (interno)?
- [ ] Altura nasce do conteúdo — sem vazio residual nem `min-height` arbitrário?
- [ ] Estados de carregando/vazio/erro/sucesso desenhados?
- [ ] Contraste AA verificado, foco visível, teclado funciona, `prefers-reduced-motion` respeitado?
- [ ] Funciona bem no celular?
- [ ] Sem TypeScript, sem Tailwind, estilos em SCSS Modules?
