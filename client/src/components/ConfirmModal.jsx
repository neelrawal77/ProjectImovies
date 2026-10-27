import { Modal, Button } from 'react-bootstrap';

export default function ConfirmModal({ show, title, children, confirmLabel = 'Confirm', busy, onConfirm, onCancel, variant = 'danger' }) {
  return (
    <Modal show={show} onHide={onCancel} centered contentClassName="im-modal">
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title as="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>Keep it</Button>
        <Button variant={variant} onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
}
