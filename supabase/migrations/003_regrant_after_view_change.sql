-- ============================================================================
-- 003_regrant_after_view_change.sql
--
-- Rode este script SEMPRE que a view privado.vw_oportunidades_prevendas (ou
-- privado.etl_sync_status) for recriada com DROP VIEW + CREATE VIEW.
--
-- Motivo: no Postgres, GRANT é preso ao objeto (OID), não ao nome. Um
-- DROP VIEW apaga o objeto e todas as permissões concedidas nele; a view
-- recriada com o mesmo nome é um objeto novo, sem nenhum acesso liberado
-- para o role `anon` até este script rodar de novo.
--
-- Este script é idempotente — pode ser rodado quantas vezes quiser, sem
-- efeito colateral, mesmo que as views já estejam com a permissão certa.
-- ============================================================================

grant usage on schema privado to anon;

grant select on privado.vw_oportunidades_prevendas to anon;

-- Só necessário se a view de status do ETL também foi recriada.
grant select on privado.etl_sync_status to anon;

-- Força o PostgREST a recarregar o cache de schema imediatamente, em vez de
-- esperar a detecção automática (útil para confirmar a correção na hora).
notify pgrst, 'reload schema';
