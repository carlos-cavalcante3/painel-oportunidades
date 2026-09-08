import type { Oportunidade } from '../lib/types';
import { ordenarDetalhamento } from '../lib/sorting';
import { fmtCurrency, fmtDate } from '../lib/format';

interface Props {
  data: Oportunidade[];
}

export function DetailTable({ data }: Props) {
  const sorted = ordenarDetalhamento(data);

  return (
    <div className="panel">
      <p className="panel-title">Detalhamento completo</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Oportunidade</th>
              <th>Cliente</th>
              <th>Responsável</th>
              <th>Pré-vendas</th>
              <th>Entrada</th>
              <th>Entrega</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr key={d.id}>
                <td>{d.nome}</td>
                <td>{d.cliente || '—'}</td>
                <td>{d.responsavel}</td>
                <td className="tag">{d.preVendas || '—'}</td>
                <td className="tag">{fmtDate(d.dataEntrada)}</td>
                <td className="tag">{fmtDate(d.dataEntrega)}</td>
                <td className="num">{fmtCurrency(d.valor ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && <p className="empty-note">Nenhuma oportunidade encontrada.</p>}
    </div>
  );
}
