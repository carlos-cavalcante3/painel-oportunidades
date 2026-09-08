import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha alto e cedo em vez de deixar o app renderizar sem dados.
  // eslint-disable-next-line no-console
  console.error(
    'Variáveis de ambiente SUPABASE_URL / SUPABASE_ANON_KEY não configuradas. ' +
      'Veja o .env.example.',
  );
}

/**
 * Cliente único do Supabase, apontando para o schema `privado` (onde vive
 * a view pública de leitura `vw_oportunidades_prevendas`).
 *
 * Usa exclusivamente a chave `anon` (pública, somente leitura conforme as
 * permissões configuradas no banco — ver supabase/migrations). Nenhuma
 * credencial de escrita ou service_role deve ser usada no frontend.
 */
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  db: { schema: 'privado' },
  auth: { persistSession: false },
});
