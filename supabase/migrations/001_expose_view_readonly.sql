-- ============================================================================
-- 001_expose_view_readonly.sql
--
-- Objetivo: permitir que o frontend público (usando a chave `anon`) leia
-- SOMENTE a view privado.vw_oportunidades_prevendas, sem acesso a mais
-- nenhuma tabela/view do schema `privado` e sem nenhum privilégio de
-- escrita (INSERT/UPDATE/DELETE) em lugar nenhum.
--
-- Rode este script no SQL Editor do Supabase (Dashboard -> SQL Editor)
-- com um usuário que tenha privilégios de owner/admin no banco.
--
-- Pré-requisito: o schema `privado` já precisa estar na lista de
-- "Exposed schemas" em Project Settings -> Data API. Isso é uma
-- configuração do dashboard (não dá para fazer via SQL) e, segundo
-- confirmado, já está feito.
-- ============================================================================

-- 1) Garante que o role `anon` (usado pela anon key, sem autenticação)
--    consegue "enxergar" o schema `privado` para resolver nomes de objetos.
--    Isso, por si só, NÃO concede acesso a nenhuma tabela/view.
grant usage on schema privado to anon;

-- 2) Postura defensiva: revoga qualquer privilégio que porventura já
--    exista para `anon` em TODAS as tabelas/views do schema `privado`.
--    Isso garante que, a partir daqui, o único acesso de `anon` ao
--    schema `privado` é o que concedermos explicitamente no passo 3.
revoke all privileges on all tables in schema privado from anon;

-- 3) Concede SELECT (somente leitura) exclusivamente na view usada pelo
--    dashboard. Nenhuma outra tabela/view do schema `privado` fica
--    acessível ao público.
grant select on privado.vw_oportunidades_prevendas to anon;

-- 4) Garante que novas tabelas/views criadas futuramente no schema
--    `privado` NÃO fiquem expostas por padrão ao role `anon` — cada
--    objeto que deva ser público precisa de um GRANT explícito, como
--    fizemos acima.
alter default privileges in schema privado revoke all on tables from anon;

-- Observações de segurança:
-- - A view não deve ser marcada com `security_invoker = true`. No modo
--   padrão (security definer-like), a view executa com os privilégios do
--   seu dono, e é a própria definição da view (SELECT/JOIN/WHERE) que
--   limita quais colunas e linhas ficam visíveis — mesmo que as tabelas
--   de origem tenham RLS habilitado e `anon` NÃO tenha nenhum acesso
--   direto a elas (o que é o cenário aqui, já que só concedemos SELECT
--   na view, não nas tabelas de origem).
-- - Nenhuma credencial de escrita (service_role, senha do Postgres) deve
--   ser usada no frontend. O ETL (GitHub Actions) deve continuar usando
--   suas próprias credenciais com privilégio de escrita, que são
--   totalmente independentes do role `anon`.
