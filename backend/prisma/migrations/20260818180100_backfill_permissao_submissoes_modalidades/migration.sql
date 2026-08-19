-- Concede a nova seção "SUBMISSOES_MODALIDADES" a quem já gerencia
-- Atividades — mesmo público de cadastro pré-evento. Precisa ser uma
-- migração separada da anterior porque Postgres não permite usar um valor
-- de enum recém-criado (ALTER TYPE ... ADD VALUE) na mesma transação.
UPDATE "usuarios"
SET "secoesPermitidas" = array_cat("secoesPermitidas", ARRAY['SUBMISSOES_MODALIDADES']::"SecaoAdmin"[])
WHERE 'ATIVIDADES' = ANY("secoesPermitidas");
