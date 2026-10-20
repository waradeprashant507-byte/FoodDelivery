import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errMsg } from '../api/client.js';
import { useAuth } from '../store/auth.js';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const setSession = useAuth((s) => s.setSession);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.password.length < 6) return setError('Use at least 6 characters for your password.');
    if (!/^\d{10}$/.test(form.phone)) return setError('Phone number must be 10 digits.');
    setBusy(true);
    setError('');
    try {
      const session = await api.register({ ...form, name: form.name.trim(), email: form.email.trim() });
      setSession(session);
      localStorage.setItem('phone', form.phone);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth" onSubmit={submit}>
      <h1>Create your account</h1>
      <label>Full name
        <input required autoComplete="name" value={form.name} onChange={set('name')} />
      </label>
      <label>Email
        <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
      </label>
      <label>Phone (10 digits)
        <input type="tel" required inputMode="numeric" maxLength={10} autoComplete="tel-national" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
      </label>
      <label>Password
        <input type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn block" disabled={busy}>{busy ? 'Creating account...' : 'Sign up'}</button>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  );
}
