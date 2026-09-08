import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parseTimestamp } from '../lib/mappers';

interface EtlSyncStatusRow {
  executado_em: string | null;
  status: string | null;
}

interface State {
  ultimaAtualizacao: Date | null;
  status: string | null;
  loading: boolean;
  /** `true` quando a tabela de controle ainda não existe (migration pendente). */
  indisponivel: boolean;
}

/**
 * Busca o timestamp da última execução bem-sucedida do ETL, gravado pela
 * própria pipeline (GitHub Actions) na tabela `privado.etl_sync_status`
 * (ver supabase/migrations/002_etl_sync_status.sql).
 *
 * Isso é mais confiável do que inferir a partir de `data_criacao` da view,
 * pois reflete quando o ETL rodou de fato — mesmo em execuções em que
 * nenhuma linha foi alterada.
 */
export function useUltimaAtualizacao() {
  const [state, setState] = useState<State>({
    ultimaAtualizacao: null,
    status: null,
    loading: true,
    indisponivel: false,
  });

  const fetchStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const { data, error } = await supabase
      .from('etl_sync_status')
      .select('executado_em, status')
      .maybeSingle<EtlSyncStatusRow>();

    if (error) {
      // Tabela ainda não criada / não exposta — não é um erro fatal para
      // o dashboard, apenas o badge de atualização fica indisponível.
      setState({ ultimaAtualizacao: null, status: null, loading: false, indisponivel: true });
      return;
    }

    setState({
      ultimaAtualizacao: parseTimestamp(data?.executado_em ?? null),
      status: data?.status ?? null,
      loading: false,
      indisponivel: false,
    });
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { ...state, refetch: fetchStatus };
}
