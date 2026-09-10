import { parseTimestamp } from './mappers';

/**
 * Nomes de coluna amigáveis, compartilhados entre a tela da aba "Planilha
 * completa" e o arquivo .xlsx exportado — um único lugar para manter os
 * dois em sincronia.
 *
 * Colunas que não estiverem neste mapa (ex: uma coluna nova adicionada
 * futuramente na view do Supabase) caem no fallback de `humanizarColuna`,
 * que apenas capitaliza cada palavra do snake_case — sem acentuação, já
 * que não dá para adivinhar a grafia certa de um nome de coluna
 * desconhecido. Ou seja: se a view crescer, a planilha (tela e export)
 * continua mostrando a coluna nova automaticamente, só que com um nome
 * "genérico" até alguém adicionar a tradução aqui.
 */
const NOMES_AMIGAVEIS: Record<string, string> = {
  idx: 'Índice',
  id_do_negocio: 'ID do Negócio',
  nome_da_oportunidade: 'Nome da Oportunidade',
  nome_da_empresa: 'Nome da Empresa',
  cnpj: 'CNPJ',
  preco_total: 'Preço Total',
  gestor_atual: 'Gestor Atual',
  tipo_de_projeto: 'Tipo de Projeto',
  data_criacao: 'Data de Criação',
  data_entrada_prevendas: 'Data de Entrada (Pré-vendas)',
  status_oportunidade: 'Status da Oportunidade',
  engenheiro_responsavel: 'Engenheiro Responsável',
  entrega_ao_gn: 'Entrega ao GN',
};

/** Colunas cujo valor cru é um timestamp "YYYY-MM-DD HH:MI:SS" a normalizar para "DD/MM/AAAA". */
const COLUNAS_DE_DATA = new Set(['data_criacao', 'data_entrada_prevendas', 'entrega_ao_gn']);

export function humanizarColuna(coluna: string): string {
  if (NOMES_AMIGAVEIS[coluna]) return NOMES_AMIGAVEIS[coluna];
  return coluna
    .split('_')
    .filter(Boolean)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

/**
 * Normaliza um valor para exibição/exportação:
 * - datas conhecidas ("YYYY-MM-DD HH:MI:SS") viram texto "DD/MM/AAAA"
 *   (se o valor não bater com esse formato — por exemplo, já foi editado
 *   manualmente — é devolvido como veio, só sem espaços sobrando);
 * - textos têm espaços duplicados/sobrando removidos (ex: "Alexandre  Soares");
 * - nulo/indefinido vira string vazia;
 * - qualquer outro tipo (número, etc.) é mantido como está.
 */
export function normalizarValorExibicao(coluna: string, valor: unknown): string | number {
  if (valor === null || valor === undefined) return '';

  if (COLUNAS_DE_DATA.has(coluna) && typeof valor === 'string') {
    const data = parseTimestamp(valor);
    if (data) return data.toLocaleDateString('pt-BR');
    return valor.trim();
  }

  if (typeof valor === 'string') {
    return valor.replace(/\s+/g, ' ').trim();
  }

  return valor as string | number;
}
