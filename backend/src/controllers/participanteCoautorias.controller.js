const asyncHandler = require("../utils/asyncHandler");
const convitesCoautorService = require("../services/convitesCoautor.service");
const { vincularConviteSchema } = require("../validators/coautores.validators");

const vincular = asyncHandler(async (req, res) => {
  const { token } = vincularConviteSchema.parse(req.body);
  const { titulos } = await convitesCoautorService.vincularAConta(token, req.usuario.id);
  return res.json({ titulos });
});

module.exports = { vincular };
