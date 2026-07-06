const app = require("./app");
const env = require("./config/env");

app.listen(env.porta, () => {
  console.log(`Backend do Narrativas rodando em http://localhost:${env.porta}`);
});
