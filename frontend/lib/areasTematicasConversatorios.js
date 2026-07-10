// Áreas temáticas dos Conversatórios da V edição. Hoje são fixas aqui porque
// o painel administrativo (módulo 2) ainda não existe; quando ele for
// construído, este arquivo dá lugar a uma chamada à API — por isso a página
// de detalhe navega por slug, e não por um enum fixo de nomes.
export const AREAS_TEMATICAS_CONVERSATORIOS = [
  {
    numero: 1,
    slug: "conversatorio-1",
    titulo:
      "Educação indígena, educação escolar indígena e interculturalidade: narrativas, experiências e caminhos de transformação",
    coordenacao: [
      "Lauriene Seraguza (UFGD-Faind)",
      "Eliel Benites Kaiowá (Ministério dos Povos Indígenas)",
      "Izaque João Kaiowá (USP)",
      "Jacy Caris Duarte Vera Guarani (UFGD)",
      "Daniele Lourenço Terena (IFCS-UFRJ)",
      "Lileia Almeida Kaiowá (UFGD)",
    ],
    convidados: [
      { nome: "Ramon Tupinambá", afiliacao: "Cacique do Povo Tupinambá" },
    ],
    descricao: [
      "Gestada nas lutas históricas dos povos indígenas pela defesa de seus territórios, modos de vida e projetos de futuro, a educação indígena e a educação escolar indígena têm afirmado a interculturalidade como princípio político, epistemológico e pedagógico. Em uma perspectiva crítica, a interculturalidade emerge como prática fundada no diálogo entre diferentes sistemas de conhecimento, na valorização das cosmologias e epistemologias indígenas e na construção de processos educativos comprometidos com a autonomia dos povos e com a continuidade de suas formas próprias de existir, conhecer e educar.",
      "Essas experiências revelam que a educação indígena ultrapassa os limites da escola e se inscreve em territórios vivos de produção de saberes, onde os processos de ensinar e aprender se articulam às práticas comunitárias, às relações com a natureza, às memórias coletivas e às responsabilidades com as gerações futuras. Ao mesmo tempo, a educação escolar indígena tem se constituído como espaço estratégico de tradução, negociação e criação de conhecimentos, onde diferentes matrizes culturais e epistêmicas se encontram, se tensionam e se recriam.",
      "Este conversatório propõe compartilhar narrativas e experiências que emergem de contextos indígenas e de práticas de educação intercultural, evidenciando modos próprios de pensar, viver e fazer educação. Ao reunir educadoras e educadores indígenas, pesquisadores e lideranças, o diálogo busca contribuir para o fortalecimento da educação indígena e da educação escolar indígena, bem como para a construção de práticas educativas interculturais capazes de enfrentar as heranças da colonialidade e afirmar horizontes de coexistência baseados no respeito à diversidade, na autodeterminação dos povos e na responsabilidade coletiva com a Terra.",
    ],
  },
  {
    numero: 2,
    slug: "conversatorio-2",
    titulo: "Vivenciando a Educação na Matriz Africana",
    coordenacao: [
      "Mariana Bracks Fonseca (Universidade Federal de Sergipe - UFS)",
      "Jeidma Marinho de Almeida (Gpdes/UnB, PPGE/UnB)",
      "Lucas Ferreira (Gpdes/UnB, Mespt/UnB)",
      "Francisco Nonato do Nascimento (Gpdes/UnB, PPGE/UnB)",
    ],
    convidados: [
      { nome: "Mestra Janja", afiliacao: "Instituto Nzinga de Capoeira Angola, Salvador-BA" },
      { nome: "Taata Katuvanjesi", afiliacao: "Inzo Tumbansi, Itapecerica da Serra-SP" },
      { nome: "wanderson flor do nascimento", afiliacao: "Mespt|CEAM|NEAB|NEFA-UnB" },
      { nome: "Omar Sarr Badji", afiliacao: "Bùbajum Áyyi D’Oussouye, Senegal" },
    ],
    descricao: [
      "As expressões culturais negras no Brasil preservam e atualizam formas próprias de educar, aprender e conceber o mundo, oriundas das matrizes civilizatórias africanas e da experiência afrodiaspórica. A transmissão de valores, conhecimentos ancestrais, histórias e cosmopercepções mobiliza a oralidade, os cantos, os toques dos tambores, as danças, os rituais e as performances corporais, por meio dos quais se constroem sentidos de pertencimento, resistência, espiritualidade e comunidade.",
      "A partir das experiências de mestres, mestras e guardiãs(ões) desses saberes, este conversatório propõe refletir sobre as práticas educativas presentes nas culturas negras, compreendendo terreiros, rodas, cortejos, guardas e demais manifestações como espaços legítimos de produção de conhecimento e de formação humana, orientados por valores africanos. Busca-se discutir criticamente o conceito de educação tradicional de matriz africana e valorizar seus elementos constitutivos, tais como oralidade, corporalidade, performatividade, ancestralidade, circularidade, musicalidade, comunitarismo, senioridade e iniciações.",
      "O conversatório dirige-se a estudantes, professoras(es), gestoras(es) escolares e demais interessadas(os) em decolonizar suas práticas educativas, reconhecendo as epistemologias africanas e afrodiaspóricas como fundamentos legítimos para a construção de projetos pedagógicos antirracistas, interculturais e comprometidos com a justiça social. Espera-se, ainda, contribuir para que os espaços de educação formal ampliem o reconhecimento dessas sabedorias, incorporando suas linguagens, metodologias e tecnologias educativas no cotidiano escolar.",
    ],
  },
  {
    numero: 3,
    slug: "conversatorio-3",
    titulo:
      "Etnocenologia, educação e o século XXI: novos léxicos, locais de fala e suas relações decoloniais",
    coordenacao: [
      "Ivana Delfino (PPGCEN|Afeto|IdA-UnB)",
      "Adailson Costa (PPGCEN|Afeto|IdA-UnB)",
    ],
    convidados: [
      { nome: "Graça Veloso", afiliacao: "PPGCEN|Afeto|IdA-UnB" },
    ],
    descricao: [
      "O presente conversatório tem como intuito ampliar a discussão acerca dos locais de fala, novos léxicos e relações decoloniais que utilizamos em nossas pesquisas nos campos da educação e da Etnocenologia. Estes conceitos que utilizamos vêm sendo modificados a partir da ampliação das vozes, narrativas e práticas de outros campos e de outros corpos. Como somos entes de uma sociedade que pulsa pela pluralidade, essas teorias precisam ser constantemente revistas.",
      "Muito pode-se dizer ou defender que os locais de fala, novos léxicos e relações decoloniais de forma mais direta surgem em contextos históricos específicos e que é preciso levar em consideração o debate sobre seus usos. Todavia, com todas as discussões acerca dos capacitistas, do racismo, da branquitude, das questões de gênero e sexualidade, dos debates LGBTQIAPN+, das práticas indígenas, quilombolas e raciais, escolhemos muitas vezes decolonizar estes conceitos tornando-os outros. Nesta sessão, convidamos as pesquisadoras e pesquisadores que debatem em suas pesquisas novas percepções para compartilharem conosco estes desafios e vitórias da comunicação no século XXI.",
    ],
  },
  {
    numero: 4,
    slug: "conversatorio-4",
    titulo:
      "Educação e saberes do campo, das águas e das florestas: imaginar-construir a escola a partir do popular e do próprio",
    coordenacao: [
      "Grazielle Azevedo (Gpdes/UnB, Fase Amazônia)",
      "Jacqueline Freire (UFPA)",
      "Sabrina Stein (Gpdes-UnB)",
      "Cláudia Laurido (SEDUC-PA)",
      "Jáder Castro (UFG)",
      "Larissa Aviz (UEPA)",
      "Salomão Hage (UFPA)",
      "Monica Molina (PPGE/UnB)",
    ],
    convidados: [
      { nome: "Carla Ely Pereira", afiliacao: "Escola Padre Pio, Ilha do Capim, Abaetetuba-PA" },
      { nome: "Edielso Santos", afiliacao: "Escola das Águas, BA" },
    ],
    descricao: [
      "Os nossos saberes transitam como as águas correntes entre as pedras. Circulam, são produzidos e ensinados nas matas, nos rios, na terra, nos mutirões, nas igrejas, nos quintais e entre tantos outros espaços do mundo campesino, das águas e das florestas. Geram, portanto, aprendizados entranhados na própria vida e experimentados por meio de nossos corpos-territórios (individuais e coletivos) na vivência cotidiana de co-construir e ser-parte de uma comunidade.",
      "A educação escolar se insere nesse debate como uma dimensão fundamental, pois pode tanto operar como uma instituição fortalecedora desses mundos, quanto reproduzir o imaginário racista que historicamente inferiorizou e depreciou as formas próprias (não hegemônicas) de viver, conhecer e educar. Nesse sentido, as escolas inseridas em comunidades tradicionais ribeirinhas, pescadoras, extrativistas, geraizeiras, pomeranas, dentre tantas outras, podem ser transformadas positivamente pelo manancial de saberes, experiências, tecnologias sociais e pedagogias produzidas nesses contextos.",
      "Ao levar em conta essas referências, incorporando-as nos currículos e nas práticas pedagógicas, as escolas podem fortalecer os modos de vida locais, assentados no bem comum e em perspectivas integradoras das relações entre cultura e natureza. Assim, a escola também fortalece a luta comunitária contra os projetos desenvolvimentistas, neoextrativistas e predatórios. Neste conversatório aspira-se cirandar diálogos, promover trocas de experiências e fortalecer lutas e re-existências na construção de processos educativos escolares próprios voltados para o comum, a sustentabilidade, a justiça socioambiental e racial. Serão recepcionados trabalhos que tenham como foco as lutas dos povos do campo, das águas e das florestas pelo direito a uma educação escolar própria, informada por seus saberes, modos de vida e práticas educativas ancestrais.",
    ],
  },
  {
    numero: 5,
    slug: "conversatorio-5",
    titulo:
      "Decolonizar e interculturalizar as universidades: ações afirmativas, justiça epistêmica e outros modos de conhecer",
    coordenacao: [
      "Ana Tereza Reis da Silva (Faculdade de Educação | Gpdes-UnB)",
      "Lurian Lima (Gpdes-UnB)",
      "Edson Antoni (Colégio de Aplicação | UFRGS)",
      "Alessandro Roberto de Oliveira (Faculdade de Educação | Gpdes-UnB)",
      "Ana Catarina Zema (CLACSO)",
    ],
    convidados: [
      { nome: "Bernardo Javier Tobar Quitiaquez", afiliacao: "Unicauca/Colômbia" },
      { nome: "Mariana Solorzano", afiliacao: "UACO–México" },
    ],
    descricao: [
      "Nas últimas décadas, as políticas de ações afirmativas, a ampliação do acesso de populações historicamente excluídas ao ensino superior e a consolidação de universidades interculturais, indígenas e comunitárias no contexto do Sul Global têm produzido transformações profundas nas estruturas universitárias. Esses processos vêm tensionando os modelos tradicionais de universidade, desestabilizando seus currículos, suas formas de produção e validação do conhecimento, seus regimes de cientificidade e seus padrões de legitimidade epistêmica.",
      "Ao mesmo tempo, têm ampliado o repertório de epistemologias, cosmologias, ontologias e modos de conhecer que passam a circular nos espaços acadêmicos, reconfigurando o próprio sentido social, político e civilizatório da universidade. Este conversatório se apresenta como um espaço de reflexão teórica, intercâmbio de experiências e construção coletiva de horizontes políticos e epistêmicos sobre os processos de decolonização e interculturalização das universidades.",
      "Busca-se analisar criticamente seus impactos institucionais, curriculares e científicos, bem como os deslocamentos paradigmáticos que engendram nas formas de ensinar, pesquisar, produzir conhecimento e exercer a vida acadêmica. Serão acolhidos trabalhos acadêmicos, relatos de experiências institucionais, pesquisas empíricas, reflexões teóricas e sistematizações de práticas que abordem, entre outros temas: ações afirmativas e políticas de permanência estudantil; universidades interculturais, indígenas e comunitárias; processos de pluralização epistêmica; justiça cognitiva e justiça epistêmica; diálogos interepistêmicos e intercientíficos; decolonização dos currículos universitários; transformações nos paradigmas científicos; pesquisa engajada; metodologias participativas e colaborativas; políticas institucionais de diversidade; produção de conhecimento situada; e a construção de novas arquiteturas acadêmicas orientadas pela equidade racial, pela interculturalidade, pela democracia universitária e pelo bem comum.",
    ],
  },
  {
    numero: 6,
    slug: "conversatorio-6",
    titulo: "Decolonizar as infâncias: as vozes das crianças como perspectivas outras",
    coordenacao: [
      "Luciana Hartmann (PPGCEN-UnB, Imagens e(m) Cena-UnB e Rede Infâncias Protagonistas)",
      "Fátima Vidal (FE-UnB e Semillero Brasil)",
      "Aline Seabra de Oliveira (PPGCEN-UnB e SEEDF)",
      "Ana Maria Araújo (SEEDF)",
      "Débora Cristina Sales da Cruz Vieira (SEEDF, Imagens e(m) Cena-UnB e Rede Infâncias Protagonistas)",
      "Cecilia Alba Villalobos (UNACH-REIR)",
      "Emma Fabiola Díaz Gutiérrez (Benemérita Universidad Autónoma de Chiapas - UNACH, Red Latinoamericana de Investigación y Reflexión con niños, niñas y Jóvenes - Red REIR)",
    ],
    convidados: [
      { nome: "Kathia Núñez Patiño", afiliacao: "UNACH/REIR-México" },
    ],
    descricao: [
      "O conversatório tem como objetivo constituir-se como um espaço de diálogo e reflexão sobre o protagonismo estético, político e epistêmico das crianças nos diversos espaços sociais que ocupam, bem como sobre os discursos narrativos por elas agenciados. Para tanto, pretendemos fomentar a troca de experiências entre pesquisadores e pesquisadoras, professoras e professores, além de outros profissionais de distintas áreas do conhecimento interessados nas temáticas das crianças e das infâncias.",
      "O conversatório será um espaço de interlocução acerca de distintas práticas decolonizadoras, como as artístico-pedagógicas realizadas com e por crianças nos ambientes formais de educação, bem como práticas desenvolvidas com e por crianças investigadoras, migrantes e refugiadas e pertencentes a comunidades indígenas, ribeirinhas e quilombolas. Um dos diferenciais da abordagem com crianças migrantes e refugiadas é o reconhecimento de seu papel nos processos migratórios, por meio da escuta de suas narrativas e da valorização de seus saberes, especialmente por intermédio das linguagens artísticas.",
      "Partimos da premissa de que crianças e jovens imigrantes, que frequentemente já protagonizam processos de integração de suas famílias nos países de destino, podem contribuir de maneira ativa para o debate sobre políticas educacionais que garantam o acesso pleno à escola. Ademais, consideramos que as práticas comunitárias indígenas não constituem apenas alternativas para a construção de outras pedagogias nos contextos socioculturais das infâncias, mas também caminhos para sua integração nos processos de investigação, promovendo e viabilizando o protagonismo das crianças na produção de conhecimentos.",
    ],
  },
  {
    numero: 7,
    slug: "conversatorio-7",
    titulo: "Educação antirracista na Educação Básica: educando para as relações étnico-raciais",
    coordenacao: [
      "Bárbara Dourado (Gpdes-UnB)",
      "Carolina Mendes (Gpdes-UnB e IFB)",
      "Janaina Melques Fernandes (SEDUC-Santos-SP, UNIMES-SP, PPGICS-Unifesp)",
      "Matheus Costa (SEEDF)",
      "Tatiana Rosa (Sedu-PMS e PRoPEd-UERJ)",
    ],
    convidados: [
      { nome: "Billy Malachias", afiliacao: "Geopo-USP e CEERT" },
      { nome: "Gina Vieira Ponte", afiliacao: "Gecria-UnB e Projeto Mulheres Inspiradoras" },
    ],
    descricao: [
      "O conversatório tem por objetivo promover o diálogo e a troca de experiências sobre práticas educativas antirracistas e para as relações étnico-raciais na educação básica. Historicamente, a educação reproduz desigualdades, reforça o mito da democracia racial e nega as violências impostas aos povos africanos, afro-brasileiros e indígenas. Uma das dimensões dessa história de injustiça é o epistemicídio (Carneiro, 2005), isto é, o apagamento da cultura e das elaborações mentais desses povos e de suas contribuições para a sociedade brasileira.",
      "Nilma Gomes (2011) e Gersem Baniwa (2016) afirmam que a construção de uma sociedade antirracista passa pela criação de leis, ações afirmativas capazes de “reparar”, por meio da educação e de outras estratégias, séculos de negação de direitos. Serão recepcionadas comunicações como relatos de experiências, ensaios teóricos e resultados de pesquisa que tratem dos avanços, inovações e desafios na implementação das Leis 10.639/03 e 11.645/08 na educação básica, visando a construção de uma sociedade antirracista.",
    ],
  },
  {
    numero: 8,
    slug: "conversatorio-8",
    titulo: "Narrativas Autobiográficas de estudantes indígenas, quilombolas e de comunidades tradicionais",
    coordenacao: [
      "Atauan Queiroz (IFBA, Gpdes/UnB)",
      "Oziel Ticuna (PPGE/UnB)",
      "Railane Almeida (Gpdes/UnB)",
      "Nubiã Tupinambá (Funai)",
      "Manu Tuyuka (AAIUnB)",
      "Eulálio Apurinã (Mespt-UnB)",
      "Paula Fernandes Neves (Gpdes-UnB e UFG)",
    ],
    convidados: [
      { nome: "Alcineide Piratapuya", afiliacao: "AAIUnB" },
      { nome: "Mirim Ju Guarani", afiliacao: "Conselho Indígena do DF|TERRES-Geografia-UnB e AAIUnB" },
    ],
    descricao: [
      "Por meio do diálogo intercultural, decolonial e antirracista, o objetivo deste conversatório é refletir criticamente sobre os desafios que estudantes indígenas, quilombolas e de comunidades tradicionais enfrentam nos ambientes acadêmicos, bem como sobre seu protagonismo político, epistêmico e pedagógico. Colocaremos em relevo as oportunidades formativas que esses corpos-territórios possibilitam às universidades ocidentalizadas, no tocante à construção de outras maneiras de produzir conhecimento e ao desenvolvimento de uma ciência plural que respeite e reconheça os saberes das populações do campo, das águas e das florestas.",
      "Nesse sentido, o conversatório acolherá narrativas autobiográficas de estudantes indígenas, quilombolas e de comunidades tradicionais, considerando suas trajetórias acadêmicas e as formas pelas quais eles/as têm (re)afirmado suas identidades, territórios, saberes ancestrais, memórias e línguas, em diálogo insurgente com práticas, discursos e conhecimentos produzidos pelas universidades ocidentalizadas.",
    ],
  },
  {
    numero: 9,
    slug: "conversatorio-9",
    titulo: "Educação quilombola: território de (re)existência",
    coordenacao: [
      "Romero Antonio de Almeida Silva (Coletivo de Educação da CONAQ, Gpdes-UnB, SEE Pernambuco e FADIMAB-PE)",
      "Fabiana Vencezlau (AQCC|CONAQ e UFRGS)",
      "John Cleber Santiago (Movimento da Juventude Quilombola do Território de Jambuaçu | Gpdes-UnB e PPGED-UEPA)",
      "Silvana Ferreira (CECAF|SEDUC-PA e PPGED-UEPA)",
    ],
    convidados: [
      { nome: "Givânia Maria da Silva", afiliacao: "Coletivo de Educação da Conaq" },
    ],
    descricao: [
      "A educação quilombola perpassa as vidas dos povos Quilombolas, tanto na comunidade como na escola. Pensar a educação quilombola é pensar em diferentes possibilidades de ensino, pesquisa e escrita, nas regras que definem o bom trabalho acadêmico, nos critérios de validação e legitimação do conhecimento. Por outro lado, desafios globais como o colapso climático expõem os limites dessa lógica e revelam a importância estratégica dos saberes originários para a construção de outros caminhos civilizatórios, orientados pelo bem comum, respeito à mãe terra, equidade racial e justiça socioambiental.",
      "No Brasil, a crescente ampliação da diversidade étnico-racial nas escolas e nas universidades tem fomentado práticas de interculturalização e decolonização do ensino e do conhecimento a partir da valorização dos saberes afrocentrados e indígenas. Em outros contextos latino-americanos, as ciências próprias dos povos originários já desempenham um papel central nos processos formativos e na produção do conhecimento em universidades interculturais e comunais.",
      "Este conversatório é um convite à reflexão teórica e ao intercâmbio de experiências sobre práticas emergentes que buscam decolonizar e interculturalizar as escolas, as universidades, os currículos e os conhecimentos, bem como promover justiça epistêmica. Nesse sentido, serão acolhidos trabalhos sobre os mais variados temas: racismo epistêmico, epistemicídio, (in)justiça epistêmica, diálogo de saberes, pedagogias decoloniais, interculturalidade, decolonização dos currículos, ações afirmativas, pesquisa engajada, metodologias participativas, entre outros caminhos de luta, de história, de identidade, memória, ancestralidade e pertencimento aos territórios.",
      "Nesse intuito, o conversatório tem como objetivo debater as questões que envolvem a educação quilombola, passando pelas dimensões escolar e não escolar e por como essas duas dimensões são interligadas à vida e à r-existência dos territórios quilombolas. Receberemos trabalhos de Quilombolas e não Quilombolas, pesquisadoras/es, professoras/es da educação básica e do ensino superior, que tragam contribuições sobre a temática em tela.",
    ],
  },
  {
    numero: 10,
    slug: "conversatorio-10",
    titulo: "Autoria criativa, educação e consciência linguística: estudos críticos do discurso",
    coordenacao: [
      "Juliana Dias (PPGL|Gecria-UnB)",
      "Camila Moreira (Gecria-UnB)",
      "Caroline Vilhena (PPGL|Gecria-UnB)",
      "Keithe Hamid (PPGL|Gecria-UnB)",
      "Paula Gomes Lima (PPGL|Gecria-UnB)",
      "Sila Marisa (Gecria-UnB)",
    ],
    convidados: [
      { nome: "Gina Vieira Pontes Albuquerque", afiliacao: "Gecria-UnB" },
    ],
    descricao: [
      "Este conversatório traz discussões de pesquisas-vida construídas através da escrita criativa autoral e ancoradas em práticas de Letramento Criativo em comunidades de aprendizagem. A coordenação é realizada pelo Grupo de Pesquisa da UnB GECRIA – Educação Crítica e Autoria Criativa (PPGL/UnB CNPq) que vem pesquisando e oferecendo formação inicial e continuada sobre o tema, ao longo dos últimos anos.",
      "Seguimos diálogos transdisciplinares e indisciplinares, no bojo dos estudos linguísticos/discursivos decoloniais e da educação, ancorado em práticas (auto)etnográficas discursivas e críticas, envolvendo a agenda de pesquisa sobre processos de escrita autoral, leitura crítica e de autoria criativa. Partimos da concepção de autoria criativa como um modo protagonista e crítico de ação consciente do sujeito escritor, dos debates sobre agência, sob o viés dos estudos críticos de discurso (Bazerman, 2006; Possenti, 2002; Archer, 2003); escrita criativa autoral (Dias, Coroa e Lima, 2018) e protagonismo dos textos (Magalhães, 2017); e contribuições da pedagogia engajada e crítica (Freire, 1987, 1991, 1999; Giroux, 1995; hooks, 2013 e outras/os).",
      "Nossa contribuição para as comunidades científica e geral é promover reflexões discursivas, emoções e impulsos identitário-discursivos que levem a uma prática libertadora e transformadora do ser escritor/a e do ser humano em sua vida social.",
    ],
  },
  {
    numero: 11,
    slug: "conversatorio-11",
    titulo:
      "Clima, gênero e pedagogias ecofeministas comunitárias: cuidado, cura e afeto para tecer outras educações e outros futuros",
    coordenacao: [
      "Larissa da Silva Araújo (Laboratório de Antropologia Social/Universidade de Brasília)",
      "Andrea Brasil (Conselho Nacional de Justiça)",
      "Meritxell Simon-Martin (Universidad de Lleida, Espanha)",
      "Damiana Campos (Instituto Rosa Sertão)",
      "Vanessa Cardozo Alarcón (Universidad Nacional Mayor de San Marco, Peru e Ceped|IRD| Université Paris Cité, França)",
    ],
    convidados: [
      { nome: "Sineia do Vale", afiliacao: "Liderança Wapichana" },
      { nome: "Emília Flores", afiliacao: "Cooperativa Chiwik" },
      { nome: "Lidiane Taverny Sales", afiliacao: "Gpdes/UnB, Associação das Mulheres Retireiras do Araguaia" },
    ],
    descricao: [
      "Este conversatório propõe um espaço de diálogo, reflexão crítica e partilha de experiências sobre as relações entre mudanças climáticas, gênero e pedagogias ecofeministas comunitárias. Parte-se do reconhecimento de que a crise climática não afeta a todos de forma igual: mulheres — especialmente indígenas, quilombolas, afroindígenas, ribeirinhas e campesinas — estão entre os grupos mais impactados pelos efeitos socioambientais das mudanças climáticas, em razão das desigualdades históricas de gênero, raça, classe e território.",
      "Ao mesmo tempo, essas mulheres têm protagonizado práticas coletivas de resistência, cuidado e defesa dos territórios, produzindo conhecimentos, estratégias comunitárias e formas de organização que oferecem respostas potentes às crises ecológicas e civilizatórias do nosso tempo. Nesse contexto, o conversatório busca visibilizar e fortalecer experiências que articulam gênero, justiça climática, educação e defesa da vida, reconhecendo o papel central das mulheres na produção de saberes, práticas de cuidado, manejo territorial, cura e organização comunitária.",
      "As pedagogias ecofeministas comunitárias são aqui compreendidas como um pluriverso de práticas educativas e cosmopolíticas que emergem dos territórios e desafiam as separações modernas entre natureza e sociedade, razão e sensibilidade, humano e não humano. Ao valorizar saberes situados, práticas coletivas e narrativas insurgentes, tais experiências contribuem para a construção de outras formas de educar, aprender e habitar o mundo, orientadas pela reciprocidade, pela interdependência e pela justiça socioambiental.",
      "Serão acolhidos trabalhos acadêmicos, relatos de experiências institucionais, pesquisas empíricas, reflexões teóricas e sistematizações de práticas que abordem, entre outros temas: gênero e mudanças climáticas; protagonismo de mulheres na justiça climática; pedagogias comunitárias e territoriais; ecofeminismos do Sul; saberes e práticas de cuidado; educação e defesa dos territórios; relações entre corpo-terra-território; práticas de cura e saúde comunitária; e experiências educativas que articulam gênero, natureza, território e resistência.",
    ],
  },
  {
    numero: 12,
    slug: "conversatorio-12",
    titulo: "Educação Decolonial e o Ensino de Ciências Naturais e Matemática",
    coordenacao: [
      "Ramon de Oliveira Santana (UEAP | Gpdes/UnB e Coletivo Educação Científica Decolonial)",
      "Leliane da Costa Ferreira (UEAP | Gpdes/UnB e Coletivo Educação Científica Decolonial)",
      "Leandro de Oliveira Kerber (UESC e Coletivo Educação Científica Decolonial)",
      "Harryson Júnio Lessa Gonçalves (Unesp)",
      "Joaquina Barboza Malheiros (UNIFAP-Ilha das Cinzas | Gepes/UFRPE e Coletivo Educação Científica Decolonial)",
      "Natália Amarinho (UFMG - Rede da Universidade das Crianças e Coletivo Educação Científica Decolonial)",
    ],
    convidados: [
      { nome: "Juami Aquino", afiliacao: "Comunidade Kalunga Vão do Moleque" },
    ],
    descricao: [
      "Caras/os companheiras/os dessa nossa grande viagem cósmica, principalmente vocês que tiveram suas vidas transfiguradas por formações disciplinares em Química, Física, Biologia, Matemática e Engenharias, este conversatório tem por objetivo criar um espaço de diálogo e de troca de experiências sobre práticas educativas entrelaçando ensino de ciências naturais/matemática e decolonialidade na educação básica.",
      "Essas práticas têm sido propostas e experimentadas no chão da sala de aula; elas ainda são poucas e pontuais, mas evidenciam crescimento de publicações nos últimos anos. As ciências naturais e a matemática e seus ensinos têm sido fontes de colonialidade em nós (Jafelice, 2023). Há contradições manifestas no desenvolvimento de uma educação científica decolonial que possa contribuir, inclusive ela, para uma vivência da decolonialidade.",
      "Neste conversatório, queremos convidá-las(os) para um compartilhamento de experiências pedagógicas e reflexões sobre a implementação das Leis 10.639/03 e 11.645/08, visando a inclusão das ciências naturais e da matemática. Serão aceitas comunicações como relatos de experiências, ensaios teóricos e resultados de pesquisa, nos mais diversos formatos.",
    ],
  },
  {
    numero: 13,
    slug: "conversatorio-13",
    titulo: "O bem comum como prática e horizonte político de povos indígenas, quilombolas e comunidades tradicionais",
    coordenacao: [
      "Rosirene Lima (UEMA)",
      "Alex Fiuza (Gpdes-UnB e ICMBIO)",
      "Hueliton Azevedo (UFSC e Ilha do Capim Abaetetuba-PA)",
      "Roberto Goulart Menezes (IREL-UnB)",
      "Ana Laíde Barbosa (Movimento Xingu Vivo | Gpdes/UnB)",
    ],
    convidados: [
      { nome: "Deyvson Azevedo", afiliacao: "Ilha do Capim, Abaetetuba-PA" },
      { nome: "Maria Nice Costa Machado", afiliacao: "Comunidade Quilombola Penalva-MA" },
      { nome: "Odelina Ferraz", afiliacao: "Comunidade do Maracanã, São Luís-MA" },
      { nome: "Joaquim Shiraishi", afiliacao: "UFMA" },
    ],
    descricao: [
      "O avanço do neoliberalismo tem intensificado a mercantilização da vida e a apropriação privada da natureza e dos bens coletivos. Em contraposição a essa lógica, povos indígenas, quilombolas e comunidades tradicionais vêm afirmando, em seus territórios, outras formas de organizar a vida, baseadas no cuidado, na reciprocidade, na solidariedade e na responsabilidade compartilhada.",
      "Mais do que resistir, essas comunidades sustentam, no cotidiano, modos próprios de gerir o bem comum, articulando produção, conservação ambiental e reprodução da vida de forma integrada. Seus saberes, práticas e tecnologias — construídos na relação com o território — revelam caminhos concretos de enfrentamento às crises socioambientais e às ameaças à sua existência física e cultural.",
      "A partir de experiências situadas, este conversatório reúne pesquisadoras/es, estudantes, lideranças e intelectualidades de povos e comunidades tradicionais, bem como militantes e profissionais que atuam nesse campo, para refletir sobre duas dimensões centrais dessas práticas: as formas pelas quais essas comunidades articulam produção econômica, conservação ecológica e responsabilidade socioambiental; e as estratégias de resistência e defesa dos bens comuns, frente às pressões do modelo neoliberal e colonial.",
      "Ao trazer essas experiências para o centro do debate, o conversatório busca evidenciar o comum não como abstração, mas como prática viva — um princípio que organiza modos de existir e que sustenta projetos coletivos capazes de tensionar e reconfigurar as formas dominantes de relação entre sociedade, natureza e economia.",
    ],
  },
  {
    numero: 14,
    slug: "conversatorio-14",
    titulo:
      "Encontro de Saberes: diálogos interculturais e interepistêmicos entre a academia e os Povos e Comunidades Tradicionais",
    coordenacao: [
      "José Jorge de Carvalho (Instituto de Inclusão no Ensino Superior e na Pesquisa/UnB)",
      "Luciana Hartmann (PPGCEN/UnB)",
      "Renata Lima (UFG)",
      "Raoni Jardim (Psicanalista)",
    ],
    convidados: [
      { nome: "Cássia Cristina", afiliacao: "Makota Kidoialê — Liderança de terreiro e do quilombo Manzo, Belo Horizonte/MG" },
      { nome: "Lucely Moraes Pio", afiliacao: "Raizeira, liderança da Articulação Pacari das Plantas Medicinais do Cerrado, Mineiros/GO" },
    ],
    descricao: [
      "O Encontro de Saberes constitui uma das mais relevantes experiências brasileiras de diálogo intercultural e interepistêmico no âmbito da educação superior. Iniciada em 2010 na Universidade de Brasília (UnB), pelo Instituto de Inclusão no Ensino Superior e na Pesquisa, a iniciativa propôs uma inflexão radical nas relações entre universidade e povos tradicionais, ao convidar mestres e mestras desses povos a atuarem como docentes — nas categorias de visitantes ou substitutos — em cursos regulares, com atribuição de créditos na graduação e na pós-graduação.",
      "Essa proposta rompe com os formatos tradicionais de participação pontual em eventos acadêmicos, reconhecendo tais lideranças como produtoras legítimas de conhecimento e agentes centrais da formação universitária. Ao longo de quinze anos, o Encontro de Saberes se consolidou como um movimento de alcance nacional, presente atualmente em 25 universidades das cinco regiões do país, configurando uma ampla rede de articulação entre saberes acadêmicos e tradicionais.",
      "Neste contexto, o Conversatório se apresenta como um espaço circular, dialógico e horizontal de escuta, troca e reflexão coletiva entre docentes universitários, mestres e mestras dos povos e comunidades tradicionais, estudantes, mediadoras(es) culturais e gestoras(es) públicas(os). Entre os temas a serem abordados, destacam-se as avaliações das mestras acerca de suas experiências docentes nas universidades, a socialização de estudos empíricos e reflexões teóricas sobre o Encontro de Saberes, seus fundamentos político-epistêmicos e as transformações institucionais, pedagógicas e curriculares que ele enseja nas estruturas universitárias.",
      "O Conversatório destina-se a todas as pessoas interessadas em promover práticas acadêmicas decoloniais, interculturais e comprometidas com a justiça epistêmica, a valorização da diversidade e o reconhecimento dos povos tradicionais como sujeitos centrais da produção de conhecimento.",
    ],
  },
  {
    numero: 15,
    slug: "conversatorio-15",
    titulo:
      "Gênero, raça e sexualidade na educação: interseccionalidades, territórios de (re)existência e pedagogias desobedientes",
    coordenacao: [
      "Paulo Brito do Prado (UFPI-Univasf)",
      "Marcela Amaral (UFG)",
    ],
    convidados: [
      { nome: "Flávia Valéria Cassimiro Braga Melo", afiliacao: "UEG" },
    ],
    descricao: [
      "Os estudos de gênero, raça e sexualidade têm conquistado crescente reconhecimento acadêmico, científico, político e cultural, evidenciado pela ampliação do debate público, tanto no campo da produção intelectual, como pelas lutas sociais que denunciam violências estruturais, direcionadas ao enfrentamento do sexismo, da LGBTQIAPN+fobia, do racismo e da misoginia.",
      "Em diferentes espaços educacionais, os debates em torno dos marcadores das diferenças e suas interseccionalidades revelam os vínculos profundos entre modernidade, colonialismo, racialização e regimes de normalização dos corpos, dos afetos, dos prazeres, sonhos e desejos, contribuindo para processos de decolonização das subjetividades, das práticas educativas e das epistemologias. Este Conversatório posiciona-se no caminho da desobediência epistêmica como ação política e pedagógica atrevida, apresentando-se como um espaço aberto de reflexão crítica, formação, diálogo intercultural e produção coletiva de conhecimentos.",
      "O Conversatório busca analisar criticamente as relações de gênero, raça e sexualidade em suas múltiplas intersecções, em diálogo com práticas de letramento emergentes a partir de ações comunitárias, de movimentos sociais e coletivos, de comunidades indígenas, quilombolas e territórios periféricos, bem como de experimentos desobedientes nas esferas urbanas, nos interiores ou no entre lugar cidade/campo. Espera-se receber resultados de pesquisas, reflexões teóricas, relatos de experiência e narrativas autobiográficas sobre a intersecção entre gênero, raça, classe, sexualidades e território.",
    ],
  },
];

export function buscarAreaTematicaConversatorio(slug) {
  return AREAS_TEMATICAS_CONVERSATORIOS.find((area) => area.slug === slug) ?? null;
}

// A coordenação vem como "Nome (Instituição)" numa única string; aqui
// separamos os dois para poder dar peso e cor diferentes a cada parte.
export function dividirCoordenador(pessoa) {
  const combinacao = pessoa.match(/^(.*)\s\((.+)\)$/);
  return combinacao
    ? { nome: combinacao[1], afiliacao: combinacao[2] }
    : { nome: pessoa, afiliacao: null };
}
