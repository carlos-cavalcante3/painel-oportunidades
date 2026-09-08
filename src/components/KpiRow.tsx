import type { Oportunidade } from '../lib/types';
import { daysBetween, fmtCompact } from '../lib/format';

interface Props {
  data: Oportunidade[];
}

export function KpiRow({ data }: Props) {
  const valores = data.map((d) => d.valor ?? 0);
  const total = valores.reduce((s, v) => s + v, 0);
  const count = data.length;
  const avg = count > 0 ? total / count : 0;
  const max = valores.length > 0 ? Math.max(...valores) : 0;

  const duracoes = data
    .map((d) => daysBetween(d.dataEntrada, d.dataEntrega))
    .filter((d): d is number => d !== null && d >= 0);
  const avgDelivery = duracoes.length
    ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
    : null;

  return (
    <div className="kpis">
      <div className="kpi">
        <div className="kpi-label">Pipeline total</div>
        <div className="kpi-value accent">{fmtCompact(total)}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Oportunidades ativas</div>
        <div className="kpi-value">{count}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Ticket médio</div>
        <div className="kpi-value">{fmtCompact(avg)}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Maior oportunidade</div>
        <div className="kpi-value">{fmtCompact(max)}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Tempo médio de entrega</div>
        <div className="kpi-value">{avgDelivery !== null ? `${avgDelivery} dias` : 'Sem dados'}</div>
      </div>
    </div>
  );
}
