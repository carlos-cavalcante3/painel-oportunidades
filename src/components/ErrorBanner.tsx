interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="error-banner">
      <span>
        <b>Não foi possível carregar os dados.</b> {message}
      </span>
      <button onClick={onRetry}>Tentar novamente</button>
    </div>
  );
}
