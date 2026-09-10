import { humanizarColuna, normalizarValorExibicao } from './columnDisplay';

/**
 * Gera e baixa um arquivo .xlsx a partir de linhas/colunas dinâmicas, com
 * cabeçalhos amigáveis e valores normalizados (datas em DD/MM/AAAA,
 * espaços em branco redundantes removidos) — as mesmas regras usadas na
 * tela da aba "Planilha completa" (ver src/lib/columnDisplay.ts), então
 * o que você vê editando é o que sai no arquivo.
 *
 * A biblioteca `xlsx` (SheetJS, ~900KB) é carregada dinamicamente aqui —
 * só quando o usuário realmente exporta — para não pesar no bundle do
 * dashboard principal, que a maioria dos acessos nem chega a usar.
 *
 * Nota de segurança: essa biblioteca tem CVEs conhecidos de prototype
 * pollution / ReDoS — mas ambos afetam o caminho de LEITURA de arquivos
 * .xlsx não confiáveis. Aqui usamos apenas a escrita (`json_to_sheet` /
 * `writeFile`) a partir de dados que já estão em memória no próprio app,
 * nunca para importar um arquivo externo — esse uso não é afetado pelas
 * vulnerabilidades reportadas.
 */
export async function exportarParaXlsx(
  colunas: string[],
  linhas: Record<string, unknown>[],
  nomeArquivo = 'oportunidades-prevendas.xlsx',
) {
  const XLSX = await import('xlsx');

  const cabecalhos = colunas.map(humanizarColuna);

  const linhasOrdenadas = linhas.map((linha) => {
    const obj: Record<string, unknown> = {};
    colunas.forEach((coluna, i) => {
      obj[cabecalhos[i]] = normalizarValorExibicao(coluna, linha[coluna]);
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(linhasOrdenadas, { header: cabecalhos });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Oportunidades');
  XLSX.writeFile(workbook, nomeArquivo);
}
