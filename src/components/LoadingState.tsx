export function LoadingState() {
  return (
    <>
      <div className="kpis">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-label">&nbsp;</div>
            <div className="skeleton" style={{ height: 24, width: '70%' }} />
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginBottom: 24 }}>
        <p className="panel-title">Oportunidades ativas</p>
        <div className="cards-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="opp-card" key={i}>
              <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 10, width: '50%' }} />
            </div>
          ))}
        </div>
      </div>
      <p className="empty-note">Carregando dados do Supabase…</p>
    </>
  );
}
