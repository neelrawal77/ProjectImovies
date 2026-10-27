import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import { validateRegister } from '../../utils/validators.js';
import { getErrorMessage } from '../../services/api.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const v = validateRegister(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setServerError('');
    try {
      const user = await register({ username: form.username.trim(), email: form.email.trim(), password: form.password });
      toast.success(`Account created. Welcome, ${user.username}!`);
      navigate('/home', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not create your account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="im-auth">
      <Form className="im-panel" onSubmit={submit} noValidate>
        <h1 className="h3 mb-1">Create your account</h1>
        <p className="text-secondary">Free, and no card details needed.</p>
        {serverError && <Alert variant="danger" className="py-2" role="alert">{serverError}</Alert>}
        <Form.Group className="mb-3" controlId="reg-username">
          <Form.Label>Username</Form.Label>
          <Form.Control value={form.username} onChange={set('username')} isInvalid={!!errors.username} autoComplete="username" maxLength={30} />
          <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3" controlId="reg-email">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={form.email} onChange={set('email')} isInvalid={!!errors.email} autoComplete="email" />
          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
        </Form.Group>
        <PasswordInput id="reg-password" label="Password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" placeholder="8+ characters, a letter and a number" />
        <PasswordInput id="reg-confirm" label="Confirm password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
        <Button type="submit" variant="danger" className="w-100" disabled={busy}>{busy ? 'Creating account…' : 'Sign up'}</Button>
        <p className="mt-3 mb-0 text-secondary">Already registered? <Link to="/login" className="im-link">Log in</Link></p>
      </Form>
    </Container>
  );
}
