import { useEffect, useMemo, useState } from 'react';
import { useOportunidadesRaw } from '../hooks/useOportunidadesRaw';
import { exportarParaXlsx } from '../lib/exportXlsx';
import { humanizarColuna, normalizarValorExibicao } from '../lib/columnDisplay';

// Canvas compartilhado (fora do componente, criado uma única vez) usado só
// para medir a largura real de um texto com uma fonte específica — muito
// mais preciso que estimar "N pixels por caractere", já que a fonte usada
// aqui (Inter) não é monoespaçada e letras maiúsculas/largas (comuns em
// nomes de empresa em CAIXA ALTA) ocupam bem mais espaço que uma média
// genérica seria capaz de prever. Fica fora do componente (em vez de um
// ref) porque é um cálculo puro sem relação com o ciclo de vida de uma
// instância específica — não há necessidade de recriar o canvas a cada
// montagem, e evita mexer em refs durante a renderização.
let canvasDeMedida: HTMLCanvasElement | null = null;
function medirLarguraTexto(texto: string, fonte: string): number {
  if (typeof document === 'undefined') return texto.length * 7; // fallback bem improvável de ser usado
  if (!canvasDeMedida) canvasDeMedida = document.createElement('canvas');
  const ctx = canvasDeMedida.getContext('2d');
  if (!ctx) return texto.length * 7;
  ctx.font = fonte;
  return ctx.measureText(texto).width;
}

// Larguras de coluna ajustadas manualmente pelo usuário (arrastando a borda
// no cabeçalho) ficam salvas no navegador, por nome de coluna — assim
// sobrevivem a "Atualizar dados"/recarregar a página, e continuam válidas
// mesmo se a ordem das colunas mudar no futuro.
const CHAVE_LARGURAS_SALVAS = 'painel-oportunidades:larguras-colunas-planilha';
const LARGURA_MINIMA_COLUNA = 60;

function carregarLargurasSalvas(): Record<string, number> {
  try {
    const bruto = localStorage.getItem(CHAVE_LARGURAS_SALVAS);
    if (!bruto) return {};
    const dados: unknown = JSON.parse(bruto);
    if (dados && typeof dados === 'object') return dados as Record<string, number>;
  } catch {
    // localStorage indisponível (modo privado, navegador antigo, etc.) ou
    // dado salvo corrompido — segue normalmente com as larguras automáticas.
  }
  return {};
}

function salvarLargurasSalvas(larguras: Record<string, number>) {
  try {
    localStorage.setItem(CHAVE_LARGURAS_SALVAS, JSON.stringify(larguras));
  } catch {
    // Sem localStorage disponível: o ajuste manual dura só a sessão atual.
  }
}

/**
 * Aba "Planilha completa": mostra TODAS as colunas e TODAS as linhas de
 * privado.vw_oportunidades_prevendas — todo o conjunto de dados chega
 * dinamicamente do hook (nenhuma coluna é fixada no código), então se a
 * view ganhar colunas novas no futuro elas aparecem aqui automaticamente.
 *
 * Cabeçalhos e valores exibidos passam pelas mesmas regras de
 * `src/lib/columnDisplay.ts` usadas na exportação (nomes amigáveis,
 * datas em DD/MM/AAAA, espaços redundantes removidos) — então a tela e o
 * .xlsx exportado mostram sempre a mesma coisa. Colunas novas/desconhecidas
 * (sem tradução cadastrada) aparecem com um nome genérico em vez de
 * quebrar a tela.
 *
 * Importante: as edições feitas aqui são só locais (em memória, nesta
 * aba do navegador) — nada é gravado de volta no Supabase. Isso é
 * proposital: o link do dashboard é público e sem login, e os dados são
 * repopulados por um ETL a cada execução, então gravar edições no banco
 * a partir daqui não seria seguro nem duraria. Use "Exportar .xlsx" para
 * levar as edições para fora do app.
 */
export function SpreadsheetView() {
  const { linhas: linhasOriginais, colunas, loading, error, refetch } = useOportunidadesRaw();
  const [linhas, setLinhas] = useState<Record<string, unknown>[]>([]);
  const [filtro, setFiltro] = useState('');
  const [editado, setEditado] = useState(false);
  const [exportando, setExportando] = useState(false);
  // Larguras que o usuário ajustou manualmente arrastando o cabeçalho —
  // têm prioridade sobre a largura automática calculada pelo conteúdo.
  const [larguraManual, setLarguraManual] = useState<Record<string, number>>(carregarLargurasSalvas);

  // Sempre que os dados originais chegam (carga inicial ou "Atualizar
  // dados"), reinicia a cópia editável local.
  useEffect(() => {
    setLinhas(linhasOriginais.map((linha) => ({ ...linha })));
    setEditado(false);
  }, [linhasOriginais]);

  const handleCellChange = (rowIndex: number, coluna: string, valor: string) => {
    setLinhas((prev) => {
      const copia = [...prev];
      copia[rowIndex] = { ...copia[rowIndex], [coluna]: valor };
      return copia;
    });
    setEditado(true);
  };

  const handleRestaurar = () => {
    setLinhas(linhasOriginais.map((linha) => ({ ...linha })));
    setEditado(false);
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      await exportarParaXlsx(colunas, linhas);
    } finally {
      setExportando(false);
    }
  };

  const linhasVisiveis = useMemo(() => {
    const indexadas = linhas.map((linha, index) => ({ linha, index }));
    const termo = filtro.trim().toLowerCase();
    if (!termo) return indexadas;
    return indexadas.filter(({ linha }) =>
      colunas.some((coluna) =>
        String(normalizarValorExibicao(coluna, linha[coluna])).toLowerCase().includes(termo),
      ),
    );
  }, [linhas, filtro, colunas]);

  // Largura sugerida de cada coluna, calculada a partir do maior conteúdo
  // que ela guarda (cabeçalho incluído) — assim toda célula nasce cabendo
  // seu valor completo, sem cortar nome de oportunidade, empresa, CNPJ etc.
  // Serve como ponto de partida: o usuário pode arrastar a borda de
  // qualquer coluna no cabeçalho pra ajustar manualmente (ver
  // `larguraManual` acima), do mesmo jeito que em uma planilha de verdade.
  // Também funciona sozinho para colunas novas que a view do Supabase vier
  // a ganhar no futuro — cada uma recebe sua própria largura automática.
  const larguraSugerida = useMemo(() => {
    const fonteCabecalho = "500 11px 'Inter', Helvetica, Arial, sans-serif";
    const fonteValor = "400 12px 'Inter', Helvetica, Arial, sans-serif";
    const larguras: Record<string, number> = {};
    colunas.forEach((coluna) => {
      let maiorLargura = medirLarguraTexto(humanizarColuna(coluna), fonteCabecalho);
      for (const linha of linhas) {
        const valor = String(normalizarValorExibicao(coluna, linha[coluna]));
        const largura = medirLarguraTexto(valor, fonteValor);
        if (largura > maiorLargura) maiorLargura = largura;
      }
      // Padding do input (6px + 7px de cada lado) + borda + uma margem de
      // segurança contra pequenas diferenças de renderização entre
      // navegadores — pra garantir que o texto sempre caiba inteiro.
      larguras[coluna] = Math.max(96, Math.ceil(maiorLargura) + 44);
    });
    return larguras;
  }, [colunas, linhas]);

  // Largura efetiva = ajuste manual do usuário (se existir para a coluna)
  // ou, na falta dele, a sugestão automática calculada acima.
  const larguraColunas = useMemo(() => {
    const larguras: Record<string, number> = {};
    colunas.forEach((coluna) => {
      larguras[coluna] = larguraManual[coluna] ?? larguraSugerida[coluna] ?? 120;
    });
    return larguras;
  }, [colunas, larguraManual, larguraSugerida]);

  // Largura total da tabela = soma de todas as colunas (contando a coluna
  // "#"). Precisa ser um valor explícito no elemento <table> — não basta
  // width:auto no CSS. Com table-layout:fixed, o navegador só trata as
  // larguras do <colgroup> como valores absolutos garantidos quando a
  // largura da própria tabela já é (pelo menos) essa soma; com width:auto
  // ele trata as larguras do colgroup como PROPORÇÕES e reduz todas as
  // colunas de volta pra caber no espaço do painel — foi exatamente por
  // isso que redimensionar uma coluna não parecia fazer efeito nenhum: o
  // estado mudava, mas o navegador espremia tudo de volta silenciosamente.
  const larguraTotalTabela = useMemo(
    () => 44 + colunas.reduce((soma, coluna) => soma + (larguraColunas[coluna] ?? 120), 0),
    [colunas, larguraColunas],
  );

  const temAjusteManual = colunas.some((coluna) => larguraManual[coluna] !== undefined);

  const handleRedefinirLarguras = () => {
    setLarguraManual({});
    salvarLargurasSalvas({});
  };

  // Arrastar a borda direita de um cabeçalho de coluna redimensiona ela,
  // igual a qualquer app de planilha. O listener de mousemove/mouseup fica
  // no document (não no elemento) porque o cursor do usuário pode sair da
  // pequena faixa de 6px da borda durante o arrasto — ele precisa continuar
  // funcionando mesmo assim, até soltar o botão do mouse.
  const iniciarRedimensionamento = (coluna: string) => (evento: React.MouseEvent) => {
    evento.preventDefault();
    const xInicial = evento.clientX;
    const larguraInicial = larguraColunas[coluna] ?? 120;
    // Sem isso, arrastar o mouse sobre o cabeçalho/células vizinhas
    // seleciona o texto delas (o navegador trata como uma seleção normal
    // de texto) — desliga a seleção durante o arrasto e liga de volta ao
    // soltar o botão.
    const userSelectOriginal = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const aoMoverMouse = (e: MouseEvent) => {
      const novaLargura = Math.max(LARGURA_MINIMA_COLUNA, Math.round(larguraInicial + (e.clientX - xInicial)));
      setLarguraManual((prev) => ({ ...prev, [coluna]: novaLargura }));
    };

    const aoSoltarMouse = () => {
      document.removeEventListener('mousemove', aoMoverMouse);
      document.removeEventListener('mouseup', aoSoltarMouse);
      document.body.style.userSelect = userSelectOriginal;
      setLarguraManual((prev) => {
        salvarLargurasSalvas(prev);
        return prev;
      });
    };

    document.addEventListener('mousemove', aoMoverMouse);
    document.addEventListener('mouseup', aoSoltarMouse);
  };

  if (loading && linhas.length === 0) {
    return (
      <div className="panel">
        <p className="panel-title">Planilha completa</p>
        <p className="empty-note">Carregando todos os dados do Supabase…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <p className="panel-title">Planilha completa</p>
        <div className="error-banner" style={{ marginBottom: 0 }}>
          <span>
            <b>Não foi possível carregar os dados.</b> {error}
          </span>
          <button onClick={refetch}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <p className="panel-title">Planilha completa</p>
      <p className="panel-hint">
        Todas as colunas e linhas de <code>privado.vw_oportunidades_prevendas</code>, com nomes e
        datas organizados para leitura. As edições ficam só nesta tela (não são gravadas no
        banco): use "Atualizar dados" para buscar a versão mais recente do Supabase, "Restaurar
        originais" para desfazer suas edições sem acessar a rede, e "Exportar .xlsx" para salvar o
        que está na tela em um arquivo. Arraste a borda entre dois cabeçalhos para ajustar a
        largura de uma coluna manualmente — o ajuste fica salvo neste navegador.
      </p>

      <div className="sheet-toolbar">
        <input
          type="text"
          className="sheet-filter"
          placeholder="Filtrar em todas as colunas…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <div className="sheet-toolbar-actions">
          {editado && <span className="badge sheet-edited-badge">Alterações não salvas</span>}
          <button
            onClick={refetch}
            disabled={loading}
            title="Busca a versão mais recente diretamente do Supabase (rede). Substitui os dados na tela, inclusive edições ainda não exportadas."
          >
            Atualizar dados
          </button>
          {editado && (
            <button
              onClick={handleRestaurar}
              title="Desfaz suas edições nesta tela, voltando aos dados como vieram na última busca — sem acessar a rede."
            >
              Restaurar originais
            </button>
          )}
          {temAjusteManual && (
            <button
              onClick={handleRedefinirLarguras}
              title="Volta todas as colunas para a largura automática (calculada pelo conteúdo)"
            >
              Redefinir larguras
            </button>
          )}
          <button onClick={handleExportar} disabled={linhas.length === 0 || exportando}>
            {exportando ? 'Gerando arquivo…' : (
              <>
                Exportar .xlsx <span className="cta-arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="empty-note" style={{ marginBottom: 12 }}>
        {linhasVisiveis.length} de {linhas.length} linha(s) · {colunas.length} coluna(s)
      </p>

      {linhas.length === 0 ? (
        <p className="empty-note">Nenhum dado encontrado.</p>
      ) : (
        <div className="table-scroll sheet-scroll">
          <table className="sheet-table" style={{ width: larguraTotalTabela }}>
            <colgroup>
              <col style={{ width: 44 }} />
              {colunas.map((coluna) => (
                <col key={coluna} style={{ width: larguraColunas[coluna] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sheet-row-num">#</th>
                {colunas.map((coluna) => (
                  <th key={coluna} title={humanizarColuna(coluna)} className="sheet-th-resizable">
                    {humanizarColuna(coluna)}
                    <span
                      className="sheet-col-resizer"
                      onMouseDown={iniciarRedimensionamento(coluna)}
                      title="Arraste para redimensionar a coluna"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasVisiveis.map(({ linha, index }) => (
                <tr key={index}>
                  <td className="sheet-row-num tag">{index + 1}</td>
                  {colunas.map((coluna) => {
                    const valor = String(normalizarValorExibicao(coluna, linha[coluna]));
                    return (
                      <td key={coluna}>
                        <input
                          className="sheet-cell-input"
                          type="text"
                          title={valor}
                          value={valor}
                          onChange={(e) => handleCellChange(index, coluna, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
