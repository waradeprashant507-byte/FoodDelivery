import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, errMsg } from '../api/client.js';
import { isAdmin, useAuth } from '../store/auth.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const setSession = useAuth((s) => s.setSession);
  const navigate = useNavigate();
  const from = useLocation().state?.from;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await api.login({ email: form.email.trim(), password: form.password });
      setSession(session);
      navigate(isAdmin(session.user) ? '/admin' : from || '/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth" onSubmit={submit}>
      <h1>Log in</h1>
      <label>Email
        <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
      </label>
      <label>Password
        <input type="password" required autoComplete="current-password" value={form.password} onChange={set('password')} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn block" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      <p className="muted">New to Crave? <Link to="/signup">Create an account</Link></p>
    </form>
  );
}
