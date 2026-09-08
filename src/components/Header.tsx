import logo from '../assets/logo.png';
import { UpdateBadge } from './UpdateBadge';

interface Props {
  loading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
  onRefresh: () => void;
  ultimaAtualizacao: Date | null;
  ultimaAtualizacaoLoading: boolean;
  ultimaAtualizacaoIndisponivel: boolean;
}

export function Header({
  loading,
  error,
  lastFetchedAt,
  onRefresh,
  ultimaAtualizacao,
  ultimaAtualizacaoLoading,
  ultimaAtualizacaoIndisponivel,
}: Props) {
  const dotClass = loading ? 'dot loading' : error ? 'dot error' : 'dot';
  const statusText = loading
    ? 'Buscando dados no Supabase...'
    : error
      ? 'Não foi possível atualizar agora'
      : lastFetchedAt
        ? `Dados ao vivo — atualizado às ${lastFetchedAt.toLocaleTimeString('pt-BR')}`
        : 'Dados de referência carregados';

  return (
    <header>
      <div>
        <div className="brand">
          <img className="brand-logo" src={logo} alt="Avantia — Tecnologia e Segurança" />
        </div>
        <h1>Painel de oportunidades</h1>
        <p>Pipeline comercial de pré-venda</p>
      </div>
      <div className="header-actions">
        <UpdateBadge
          ultimaAtualizacao={ultimaAtualizacao}
          loading={ultimaAtualizacaoLoading}
          indisponivel={ultimaAtualizacaoIndisponivel}
        />
        <div className="status">
          <span className={dotClass} />
          <span>{statusText}</span>
        </div>
        <button onClick={onRefresh} disabled={loading}>
          Atualizar dados <span className="cta-arrow">→</span>
        </button>
      </div>
    </header>
  );
}
