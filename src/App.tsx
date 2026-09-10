import { lazy, Suspense, useState } from 'react';
import { Header } from './components/Header';
import { KpiRow } from './components/KpiRow';
import { OpportunityCards } from './components/OpportunityCards';
import { BarChartPanel } from './components/BarChartPanel';
import { DetailTable } from './components/DetailTable';
import { ErrorBanner } from './components/ErrorBanner';
import { LoadingState } from './components/LoadingState';
import { useOportunidades } from './hooks/useOportunidades';
import { useUltimaAtualizacao } from './hooks/useUltimaAtualizacao';
import { agruparPorCampo } from './lib/aggregate';

type Aba = 'dashboard' | 'planilha';

// Carregado sob demanda: só baixa o código da planilha (e a biblioteca de
// exportação .xlsx) quando o usuário abre essa aba, mantendo o dashboard
// principal com o mesmo tamanho de bundle de antes.
const SpreadsheetView = lazy(() =>
  import('./components/SpreadsheetView').then((m) => ({ default: m.SpreadsheetView })),
);

function App() {
  const [aba, setAba] = useState<Aba>('dashboard');
  const { data, loading, error, lastFetchedAt, refetch } = useOportunidades();
  const {
    ultimaAtualizacao,
    loading: ultimaAtualizacaoLoading,
    indisponivel: ultimaAtualizacaoIndisponivel,
    refetch: refetchUltimaAtualizacao,
  } = useUltimaAtualizacao();

  const handleRefresh = () => {
    refetch();
    refetchUltimaAtualizacao();
  };

  const gnEntries = agruparPorCampo(data, (o) => o.responsavel);
  const preVendasEntries = agruparPorCampo(data, (o) => o.preVendas);

  const mostrarConteudo = !loading || data.length > 0;

  return (
    <div className={`wrap${aba === 'planilha' ? ' wrap-wide' : ''}`}>
      <Header
        loading={loading}
        error={error}
        lastFetchedAt={lastFetchedAt}
        onRefresh={handleRefresh}
        ultimaAtualizacao={ultimaAtualizacao}
        ultimaAtualizacaoLoading={ultimaAtualizacaoLoading}
        ultimaAtualizacaoIndisponivel={ultimaAtualizacaoIndisponivel}
      />

      <div className="tabs" role="tablist" aria-label="Seções do painel">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'dashboard'}
          className={`tab-button${aba === 'dashboard' ? ' active' : ''}`}
          onClick={() => setAba('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'planilha'}
          className={`tab-button${aba === 'planilha' ? ' active' : ''}`}
          onClick={() => setAba('planilha')}
        >
          Planilha completa
        </button>
      </div>

      {aba === 'dashboard' ? (
        <>
          {error && <ErrorBanner message={error} onRetry={refetch} />}

          {!mostrarConteudo ? (
            <LoadingState />
          ) : (
            <>
              <KpiRow data={data} />
              <OpportunityCards data={data} />

              <div className="grid2">
                <BarChartPanel
                  title="Quantidade de demandas por GN"
                  hint="Clique em uma barra para ver as demandas"
                  ariaLabel="Gráfico de barras horizontais clicável mostrando a quantidade de oportunidades por responsável (GN)"
                  entries={gnEntries}
                  barColor="#9AB0D6"
                  placeholder="Clique em um GN para ver as demandas dele."
                />
                <BarChartPanel
                  title="Quantidade de demandas por pré-vendas"
                  hint="Clique em uma barra para ver as demandas"
                  ariaLabel="Gráfico de barras horizontais clicável mostrando a quantidade de oportunidades por pré-vendas responsável"
                  entries={preVendasEntries}
                  barColor="#235094"
                  placeholder="Clique em um pré-vendas para ver as demandas dele."
                />
              </div>

              <DetailTable data={data} />
            </>
          )}

          <footer>
            {error
              ? 'Exibindo os últimos dados carregados com sucesso (se houver). Clique em "Tentar novamente" no aviso acima.'
              : 'Os dados são carregados diretamente do Supabase (view privado.vw_oportunidades_prevendas). Clique em "Atualizar dados" para buscar a versão mais recente.'}
          </footer>
        </>
      ) : (
        <>
          <Suspense fallback={<p className="empty-note">Carregando planilha…</p>}>
            <SpreadsheetView />
          </Suspense>
          <footer>
            Planilha completa: leitura direta de todas as colunas da view. Edições feitas aqui
            ficam só neste navegador — use "Exportar .xlsx" para salvá-las em arquivo.
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
