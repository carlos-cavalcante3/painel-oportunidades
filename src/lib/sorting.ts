import type { Oportunidade } from './types';

/**
 * Ordenação da tabela "Detalhamento completo" (requisito de negócio):
 *
 * 1º — Valor: oportunidades com valor > 0 primeiro, do maior para o menor.
 * 2º — Data de entrega: entre as oportunidades sem valor (ausente ou 0)
 *      que possuem data de entrega, da mais próxima para a mais distante.
 * 3º — Data de entrada: entre as oportunidades sem valor e sem data de
 *      entrega, da mais antiga para a mais recente.
 *
 * Valores nulos, vazios ou iguais a zero em `valor` são tratados da mesma
 * forma (ausência de valor). Datas nulas/vazias/inválidas também caem
 * para o próximo critério.
 */
type Grupo = 1 | 2 | 3;

function temValor(o: Oportunidade): boolean {
  return typeof o.valor === 'number' && Number.isFinite(o.valor) && o.valor > 0;
}

function grupoDe(o: Oportunidade): Grupo {
  if (temValor(o)) return 1;
  if (o.dataEntrega instanceof Date) return 2;
  return 3;
}

export function compararDetalhamento(a: Oportunidade, b: Oportunidade): number {
  const grupoA = grupoDe(a);
  const grupoB = grupoDe(b);
  if (grupoA !== grupoB) return grupoA - grupoB;

  if (grupoA === 1) {
    // Maior valor primeiro.
    return (b.valor as number) - (a.valor as number);
  }

  if (grupoA === 2) {
    // Data de entrega mais próxima (mais cedo) primeiro.
    return (a.dataEntrega as Date).getTime() - (b.dataEntrega as Date).getTime();
  }

  // Grupo 3: sem valor e sem entrega -> data de entrada mais antiga primeiro.
  const da = a.dataEntrada;
  const db = b.dataEntrada;
  if (da && db) return da.getTime() - db.getTime();
  if (da && !db) return -1; // quem tem data de entrada vem antes de quem não tem nada
  if (!da && db) return 1;
  return 0;
}

export function ordenarDetalhamento(lista: Oportunidade[]): Oportunidade[] {
  return [...lista].sort(compararDetalhamento);
}
