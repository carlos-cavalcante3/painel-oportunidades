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

function App() {
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
    <div className="wrap">
      <Header
        loading={loading}
        error={error}
        lastFetchedAt={lastFetchedAt}
        onRefresh={handleRefresh}
        ultimaAtualizacao={ultimaAtualizacao}
        ultimaAtualizacaoLoading={ultimaAtualizacaoLoading}
        ultimaAtualizacaoIndisponivel={ultimaAtualizacaoIndisponivel}
      />

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
    </div>
  );
}

export default App;
