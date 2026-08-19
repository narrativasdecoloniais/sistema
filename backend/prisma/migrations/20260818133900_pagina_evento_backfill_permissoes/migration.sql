-- Preserva o acesso de quem já tinha PAGINA_EVENTO liberado: antes esse
-- valor cobria a tela inteira (Hero, Navbar e Realizadores); agora que virou
-- 6 seções com controle de acesso independente, concede as 5 novas pra quem
-- já tinha a antiga, senão o acesso encolheria pra só "Hero + Navbar".
-- Em migração separada da anterior porque Postgres não permite usar um
-- valor de enum recém-criado (ALTER TYPE ... ADD VALUE) na mesma transação.
UPDATE "usuarios"
SET "secoesPermitidas" = array_cat(
  "secoesPermitidas",
  ARRAY['PAGINA_APRESENTACAO', 'PAGINA_MODALIDADES', 'PAGINA_AGENDA', 'PAGINA_PUBLICACOES', 'PAGINA_REALIZADORES']::"SecaoAdmin"[]
)
WHERE 'PAGINA_EVENTO' = ANY("secoesPermitidas");
