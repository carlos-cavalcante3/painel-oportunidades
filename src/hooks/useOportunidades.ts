import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { normalizeOportunidade } from '../lib/mappers';
import type { Oportunidade, OportunidadeRow } from '../lib/types';

interface State {
  data: Oportunidade[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
}

/**
 * Busca os dados de `privado.vw_oportunidades_prevendas` via Supabase.
 * Expõe loading/error para a UI tratar cada estado, e um `refetch` para
 * o botão "Atualizar dados" — sem nunca precisar recarregar a página.
 */
export function useOportunidades() {
  const [state, setState] = useState<State>({
    data: [],
    loading: true,
    error: null,
    lastFetchedAt: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('vw_oportunidades_prevendas')
        .select('*')
        .returns<OportunidadeRow[]>();

      if (error) throw error;

      const normalizado = (data ?? []).map(normalizeOportunidade);
      setState({ data: normalizado, loading: false, error: null, lastFetchedAt: new Date() });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido ao buscar os dados no Supabase.';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
