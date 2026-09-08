/**
 * Formato bruto retornado pela view `privado.vw_oportunidades_prevendas`.
 *
 * Baseado na amostra de dados fornecida em 2026-09-08. Os campos de data
 * chegam como texto no formato "YYYY-MM-DD HH:MI:SS" e o valor monetário
 * chega como texto formatado (ex: "R$ 2.492,70") em vez de numérico —
 * por isso o parsing cuidadoso em `mappers.ts`.
 */
export interface OportunidadeRow {
  id_do_negocio: string;
  nome_da_oportunidade: string | null;
  nome_da_empresa: string | null;
  cnpj: string | null;
  preco_total: string | number | null;
  gestor_atual: string | null;
  tipo_de_projeto: string | null;
  data_criacao: string | null;
  data_entrada_prevendas: string | null;
  status_oportunidade: string | null;
  engenheiro_responsavel: string | null;
  entrega_ao_gn: string | null;
}

/** Status calculado a partir dos dias sem avanço da oportunidade. */
export type StatusAlerta = 'red' | 'yellow' | 'normal';

/**
 * Modelo normalizado usado pelos componentes da aplicação. Mantém os
 * mesmos nomes de campo usados no site estático original (nome, cliente,
 * responsavel, preVendas, dataEntrada, dataEntrega, valor) para minimizar
 * a diferença de lógica na hora de portar o layout.
 */
export interface Oportunidade {
  id: string;
  nome: string;
  cliente: string;
  cnpj: string;
  responsavel: string;
  preVendas: string;
  tipo: string;
  status: string;
  valor: number | null;
  dataCriacao: Date | null;
  dataEntrada: Date | null;
  dataEntrega: Date | null;
}
