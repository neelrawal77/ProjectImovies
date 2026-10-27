import { Spinner } from 'react-bootstrap';

export default function Loader({ label = 'Loading…', fullPage = false }) {
  return (
    <div className={`im-loader ${fullPage ? 'im-loader-full' : ''}`} role="status" aria-live="polite">
      <Spinner animation="border" variant="danger" size={fullPage ? undefined : 'sm'} />
      <span>{label}</span>
    </div>
  );
}
