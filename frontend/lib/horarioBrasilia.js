// Espelho de backend/src/utils/horarioBrasilia.js: o instante atual na
// convenção "ingênua" das datas do sistema (componentes UTC = horário de
// Brasília, UTC−3 fixo), pra comparar com prazos e janelas gravados assim.
const DESLOCAMENTO_BRASILIA_MS = 3 * 60 * 60 * 1000;

export function agoraIngenuo() {
  return new Date(Date.now() - DESLOCAMENTO_BRASILIA_MS);
}

export function hojeIngenuo() {
  return agoraIngenuo().toISOString().slice(0, 10);
}
