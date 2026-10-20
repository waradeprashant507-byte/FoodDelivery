import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api/client.js';
import { useAuth } from '../store/auth.js';
import { STATUS_LABEL, isFinished, money, when } from '../utils.js';

export default function Orders() {
  const user = useAuth((s) => s.user);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    api.listOrders().then((d) => { setOrders(d); setError(''); }).catch((e) => setError(errMsg(e)));

  useEffect(() => { load(); }, []);

  async function run(id, fn) {
    setBusyId(id);
    setError('');
    try { await fn(); await load(); } catch (e) { setError(errMsg(e)); } finally { setBusyId(null); }
  }

  if (!orders) return error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading your orders...</p>;
  if (orders.length === 0) {
    return (
      <div className="empty">
        <p>You have not ordered yet.</p>
        <Link className="btn" to="/">See the menu</Link>
      </div>
    );
  }

  return (
    <>
      <h1>My orders</h1>
      {error && <p className="error" role="alert">{error}</p>}
      <ul className="lines">
        {orders.map((o) => {
          const needsPayment = o.paymentMethod === 'ONLINE' && !o.paid && o.status !== 'CANCELLED';
          return (
            <li key={o.id} className="order">
              <div className="order-head">
                <div>
                  <h3>Order #{o.id}</h3>
                  <p className="muted small">{when(o.createdAt)}</p>
                </div>
                <span className={`status ${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
              </div>
              <p className="muted small">{o.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</p>
              <div className="order-foot">
                <strong>{money(o.total)}</strong>
                <span className={`tag ${o.paid ? 'ok' : ''}`}>
                  {o.paid ? 'Paid online' : o.paymentMethod === 'ONLINE' ? 'Payment pending' : 'Pay on delivery'}
                </span>
                <span className="grow" />
                {o.status === 'PENDING' && (
                  <button className="btn ghost sm" disabled={busyId === o.id}
                    onClick={() => run(o.id, () => api.cancelOrder(o.id))}>Cancel</button>
                )}
                {needsPayment && (
                  <button className="btn ghost sm" disabled={busyId === o.id}
                    onClick={() => run(o.id, () => api.payForOrder(o.id, user))}>Pay now</button>
                )}
                {o.status !== 'CANCELLED' && (
                  <Link className="btn sm" to={`/track/${o.id}`}>{isFinished(o.status) ? 'View' : 'Track live'}</Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
