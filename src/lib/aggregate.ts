import type { Oportunidade } from './types';
import { norm } from './format';

export interface ContagemEntry {
  label: string;
  count: number;
  itens: Oportunidade[];
}

/**
 * Agrupa oportunidades por uma chave textual (ex: responsável, pré-vendas),
 * normalizando espaços e usando um rótulo de fallback para valores vazios.
 * Ordena do maior para o menor número de ocorrências (mesmo comportamento
 * do site original).
 */
export function agruparPorCampo(
  lista: Oportunidade[],
  campo: (o: Oportunidade) => string,
  fallbackLabel = 'Não atribuído',
): ContagemEntry[] {
  const map = new Map<string, Oportunidade[]>();
  for (const o of lista) {
    const key = norm(campo(o)) || fallbackLabel;
    const arr = map.get(key);
    if (arr) arr.push(o);
    else map.set(key, [o]);
  }
  return [...map.entries()]
    .map(([label, itens]) => ({ label, count: itens.length, itens }))
    .sort((a, b) => b.count - a.count);
}
