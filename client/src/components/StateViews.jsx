import { Button } from 'react-bootstrap';
import { FiAlertTriangle, FiInbox } from 'react-icons/fi';

export function EmptyState({ title, message, action }) {
  return (
    <div className="im-state">
      <FiInbox size={34} aria-hidden="true" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="im-state im-state-error" role="alert">
      <FiAlertTriangle size={34} aria-hidden="true" />
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && <Button variant="outline-light" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
