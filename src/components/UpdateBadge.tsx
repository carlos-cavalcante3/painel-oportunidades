import { fmtDateTime } from '../lib/format';

interface Props {
  ultimaAtualizacao: Date | null;
  loading: boolean;
  indisponivel: boolean;
}

/**
 * Indicador discreto e não-interativo (requisito 2) mostrando quando os
 * dados da fonte foram atualizados pela última vez, vindo de
 * `privado.etl_sync_status` (gravado pelo próprio ETL). Nunca reflete o
 * horário em que o usuário abriu a página.
 */
export function UpdateBadge({ ultimaAtualizacao, loading, indisponivel }: Props) {
  const conteudo = (() => {
    if (loading) return 'Verificando última atualização…';
    if (ultimaAtualizacao) {
      return (
        <>
          Última atualização: <b>{fmtDateTime(ultimaAtualizacao)}</b>
        </>
      );
    }
    if (indisponivel) return 'Última atualização indisponível';
    return 'Última atualização desconhecida';
  })();

  return (
    <div className="update-badge" role="status" aria-live="off">
      <span aria-hidden="true">🕒</span>
      <span>{conteudo}</span>
    </div>
  );
}
