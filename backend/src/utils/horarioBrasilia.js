// O sistema grava data/hora "ingênua": o horário digitado (de Brasília) vai
// para o banco como `...Z`, sem conversão de fuso (ver
// frontend/lib/dataHoraIngenua.js). Para comparar com "agora", o instante
// atual precisa estar na mesma convenção — senão toda janela abre/fecha 3 h
// antes. Brasília é UTC−3 fixo (sem horário de verão desde 2019).
// Espelhado em frontend/lib/horarioBrasilia.js.
const DESLOCAMENTO_BRASILIA_MS = 3 * 60 * 60 * 1000;

// Instante atual como data "ingênua" (componentes UTC = horário de Brasília).
function agoraIngenuo() {
  return new Date(Date.now() - DESLOCAMENTO_BRASILIA_MS);
}

// Um instante real (gravado com new Date(), ex.: credenciadoEm) na mesma
// convenção, para formatar o horário de Brasília com os componentes UTC.
function ingenuoDe(instante) {
  return new Date(new Date(instante).getTime() - DESLOCAMENTO_BRASILIA_MS);
}

// Dia de hoje em Brasília, "YYYY-MM-DD".
function hojeIngenuo() {
  return agoraIngenuo().toISOString().slice(0, 10);
}

module.exports = { agoraIngenuo, hojeIngenuo, ingenuoDe };
