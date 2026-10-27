import { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function PasswordInput({ id, label, value, onChange, error, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{label}</Form.Label>
      <InputGroup hasValidation>
        <Form.Control
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          isInvalid={!!error}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <Button variant="outline-secondary" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} type="button">
          {show ? <FiEyeOff /> : <FiEye />}
        </Button>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </InputGroup>
    </Form.Group>
  );
}
