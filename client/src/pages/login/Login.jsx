import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import { validateLogin } from '../../utils/validators.js';
import { getErrorMessage } from '../../services/api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const v = validateLogin(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setServerError('');
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.username}!`);
      navigate(location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/home'), { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not log in'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="im-auth">
      <Form className="im-panel" onSubmit={submit} noValidate>
        <h1 className="h3 mb-1">Log in</h1>
        <p className="text-secondary">Welcome back — your seats are waiting.</p>
        {location.state?.from && <Alert variant="info" className="py-2">Please log in to continue.</Alert>}
        {serverError && <Alert variant="danger" className="py-2" role="alert">{serverError}</Alert>}
        <Form.Group className="mb-3" controlId="login-email">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={form.email} onChange={set('email')} isInvalid={!!errors.email} autoComplete="email" placeholder="you@example.com" />
          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
        </Form.Group>
        <PasswordInput id="login-password" label="Password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="current-password" />
        <Button type="submit" variant="danger" className="w-100" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
        <p className="mt-3 mb-0 text-secondary">New here? <Link to="/register" className="im-link">Create an account</Link></p>
      </Form>
    </Container>
  );
}
