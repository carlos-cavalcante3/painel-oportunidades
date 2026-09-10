import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface State {
  linhas: Record<string, unknown>[];
  colunas: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Busca TODAS as linhas e TODAS as colunas de
 * `privado.vw_oportunidades_prevendas` exatamente como o Supabase retorna
 * — sem nenhuma normalização/mapeamento de nomes de campo.
 *
 * Usado exclusivamente pela aba "Planilha completa". É deliberadamente um
 * hook independente de `useOportunidades` (que alimenta o dashboard) para
 * não arriscar alterar o comportamento já existente: se algo aqui falhar,
 * o dashboard principal continua funcionando normalmente.
 *
 * As colunas são detectadas dinamicamente a partir da própria resposta
 * (união das chaves de todas as linhas, na ordem em que aparecem), então
 * se a view ganhar/perder colunas no futuro (como já aconteceu), a
 * planilha acompanha automaticamente sem precisar mexer no código.
 */
export function useOportunidadesRaw() {
  const [state, setState] = useState<State>({
    linhas: [],
    colunas: [],
    loading: true,
    error: null,
  });

  const fetchRaw = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.from('vw_oportunidades_prevendas').select('*');
      if (error) throw error;

      const linhas = (data ?? []) as Record<string, unknown>[];

      const colunas: string[] = [];
      const vistas = new Set<string>();
      for (const linha of linhas) {
        for (const chave of Object.keys(linha)) {
          if (!vistas.has(chave)) {
            vistas.add(chave);
            colunas.push(chave);
          }
        }
      }

      setState({ linhas, colunas, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido ao buscar os dados no Supabase.';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    fetchRaw();
  }, [fetchRaw]);

  return { ...state, refetch: fetchRaw };
}
