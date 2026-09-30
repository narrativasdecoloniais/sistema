// Rótulos e links das licenças dos Anais (enum LicencaAnais). Espelhado em
// frontend/lib/anais.js — mudou aqui, muda lá.
const LICENCAS_ANAIS = {
  CC_BY: {
    sigla: "CC BY 4.0",
    nome: "Creative Commons Atribuição 4.0 Internacional",
    url: "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
  },
  CC_BY_SA: {
    sigla: "CC BY-SA 4.0",
    nome: "Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional",
    url: "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
  },
  CC_BY_NC: {
    sigla: "CC BY-NC 4.0",
    nome: "Creative Commons Atribuição-NãoComercial 4.0 Internacional",
    url: "https://creativecommons.org/licenses/by-nc/4.0/deed.pt-br",
  },
  CC_BY_NC_SA: {
    sigla: "CC BY-NC-SA 4.0",
    nome: "Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0 Internacional",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br",
  },
  CC_BY_ND: {
    sigla: "CC BY-ND 4.0",
    nome: "Creative Commons Atribuição-SemDerivações 4.0 Internacional",
    url: "https://creativecommons.org/licenses/by-nd/4.0/deed.pt-br",
  },
  CC_BY_NC_ND: {
    sigla: "CC BY-NC-ND 4.0",
    nome: "Creative Commons Atribuição-NãoComercial-SemDerivações 4.0 Internacional",
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/deed.pt-br",
  },
  TODOS_DIREITOS_RESERVADOS: {
    sigla: "Todos os direitos reservados",
    nome: "Todos os direitos reservados",
    url: null,
  },
};

module.exports = { LICENCAS_ANAIS };
