import type { Oportunidade, OportunidadeRow } from './types';

/**
 * Converte um valor monetário no formato pt-BR retornado pela view
 * (ex: "R$ 2.492,70", "R$ 0,00") para número. Também aceita o campo já
 * vindo como número (caso a view mude no futuro) ou nulo/vazio.
 *
 * Retorna `null` quando não há valor informado (nulo, vazio ou apenas
 * espaços) e `0` quando o valor está explicitamente zerado — a distinção
 * importa para a lógica de ordenação (valor ausente/zero tem o mesmo
 * tratamento na ordenação, mas mantemos o dado real para exibição).
 */
export function parseValor(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Remove tudo que não for dígito, vírgula, ponto ou sinal de menos.
  const cleaned = trimmed.replace(/[^\d,.-]/g, '');
  if (!cleaned) return null;

  // Formato pt-BR: "." separador de milhar, "," separador decimal.
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Faz o parse de timestamps no formato "YYYY-MM-DD HH:MI:SS" (como
 * retornado pela view) ou ISO 8601 padrão. Retorna `null` para valores
 * vazios/nulos/inválidos.
 */
export function parseTimestamp(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function safeText(value: string | null | undefined, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

/**
 * Normaliza uma linha bruta da view para o modelo usado pelos
 * componentes da aplicação.
 *
 * Mapeamento de campos (confirmado com base na amostra de dados real):
 * - nome_da_oportunidade -> nome
 * - nome_da_empresa      -> cliente
 * - gestor_atual         -> responsavel (GN)
 * - engenheiro_responsavel -> preVendas
 * - data_entrada_prevendas -> dataEntrada (entrada no pipeline de pré-vendas)
 * - entrega_ao_gn        -> dataEntrega (entrega de volta ao GN)
 * - preco_total          -> valor (parseado de texto pt-BR para número)
 */
export function normalizeOportunidade(row: OportunidadeRow): Oportunidade {
  return {
    id: row.id_do_negocio,
    nome: safeText(row.nome_da_oportunidade, 'Sem nome'),
    cliente: safeText(row.nome_da_empresa),
    cnpj: safeText(row.cnpj),
    responsavel: safeText(row.gestor_atual, 'Não atribuído'),
    preVendas: safeText(row.engenheiro_responsavel),
    tipo: safeText(row.tipo_de_projeto),
    status: safeText(row.status_oportunidade),
    valor: parseValor(row.preco_total),
    dataCriacao: parseTimestamp(row.data_criacao),
    dataEntrada: parseTimestamp(row.data_entrada_prevendas),
    dataEntrega: parseTimestamp(row.entrega_ao_gn),
  };
}
