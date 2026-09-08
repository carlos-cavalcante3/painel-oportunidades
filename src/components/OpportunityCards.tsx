import type { Oportunidade } from '../lib/types';
import { daysOpen, statusFor, statusLabel, statusOrder } from '../lib/format';

interface Props {
  data: Oportunidade[];
}

export function OpportunityCards({ data }: Props) {
  const withStatus = data.map((d) => {
    const days = daysOpen(d.dataEntrada);
    return { ...d, days, status: statusFor(days) };
  });

  withStatus.sort((a, b) => {
    const s = statusOrder[a.status] - statusOrder[b.status];
    if (s !== 0) return s;
    return (b.days ?? -Infinity) - (a.days ?? -Infinity);
  });

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <p className="panel-title">Oportunidades ativas</p>
      <div className="cards-legend">
        <span>
          <span className="sw" style={{ background: 'var(--danger)' }} />
          Mais de 10 dias sem avanço
        </span>
        <span>
          <span className="sw" style={{ background: 'var(--warn)' }} />
          Mais de 5 dias sem avanço
        </span>
        <span>
          <span className="sw" style={{ background: 'var(--ok)' }} />
          Em dia
        </span>
      </div>
      {withStatus.length === 0 ? (
        <p className="empty-note">Nenhuma oportunidade encontrada.</p>
      ) : (
        <div className="cards-grid">
          {withStatus.map((d) => (
            <div className={`opp-card status-${d.status}`} key={d.id}>
              <div className="opp-name" title={d.nome}>
                {d.nome}
              </div>
              <div className="opp-field">
                <span>Cliente</span>
                <b>{d.cliente || '—'}</b>
              </div>
              <div className="opp-field">
                <span>GN</span>
                <b>{d.responsavel}</b>
              </div>
              <div className="opp-field">
                <span>Entrada</span>
                <b>{d.dataEntrada ? d.dataEntrada.toLocaleDateString('pt-BR') : '—'}</b>
              </div>
              <div className={`opp-days status-${d.status}`}>
                {d.days === null
                  ? 'Sem data de entrada'
                  : d.days >= 0
                    ? `${d.days} ${statusLabel[d.status]}`
                    : 'entrada futura'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
