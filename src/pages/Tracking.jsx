import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, errMsg } from '../api/client.js';
import { useAuth } from '../store/auth.js';
import { FLOW, STATUS_LABEL, isFinished, money } from '../utils.js';
import { TrackMap } from '../components/Maps.jsx';
import { directionsUrl, km } from '../lib/maps.js';

export default function Tracking() {
  const { id } = useParams();
  const user = useAuth((s) => s.user);
  const [notice, setNotice] = useState(useLocation().state?.notice || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0); // bump to reload right away

  // Poll every 4 seconds until the order is delivered or cancelled.
  // (Swap for WebSocket/SSE if you need push updates later.)
  useEffect(() => {
    let stop = false;
    let timer;
    const load = async () => {
      try {
        const o = await api.getOrder(id);
        if (stop) return;
        setOrder(o);
        setError('');
        if (!isFinished(o.status)) timer = setTimeout(load, 4000);
      } catch (e) {
        if (!stop) { setError(errMsg(e)); timer = setTimeout(load, 8000); }
      }
    };
    load();
    return () => { stop = true; clearTimeout(timer); };
  }, [id, tick]);

  async function act(fn) {
    setBusy(true);
    setNotice('');
    try { await fn(); setTick((t) => t + 1); } catch (e) { setNotice(errMsg(e)); } finally { setBusy(false); }
  }

  if (!order) return error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading your order...</p>;

  const cancelled = order.status === 'CANCELLED';
  const step = FLOW.indexOf(order.status);
  const rider = order.status === 'OUT_FOR_DELIVERY' ? order.rider : null;
  const away = rider && order.home ? km(rider, order.home) : null;
  const needsPayment = order.paymentMethod === 'ONLINE' && !order.paid && !cancelled;

  return (
    <div className="track">
      <div className="track-map">
        <TrackMap home={order.home} rider={rider} kitchen={order.kitchen} />
        {order.status === 'OUT_FOR_DELIVERY' && !rider && (
          <p className="map-note">Your rider has picked up the food. Their live location will appear here shortly.</p>
        )}
      </div>

      <section className="sheet">
        <p className="muted small">Order #{order.id}{order.restaurantName ? ` from ${order.restaurantName}` : ''}</p>
        <h1>
          {cancelled ? 'Order cancelled'
            : order.status === 'DELIVERED' ? 'Delivered. Enjoy your meal'
            : order.status === 'OUT_FOR_DELIVERY' ? (away != null ? `Rider is ${away < 1 ? `${Math.round(away * 1000)} m` : `${away.toFixed(1)} km`} away` : 'Your food is on the way')
            : STATUS_LABEL[order.status]}
        </h1>

        {notice && <p className="notice" role="alert">{notice}</p>}

        {!cancelled && (
          <ol className="timeline">
            {FLOW.map((s, i) => (
              <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>{STATUS_LABEL[s]}</li>
            ))}
          </ol>
        )}

        <div className="sheet-actions">
          {needsPayment && (
            <button className="btn" disabled={busy} onClick={() => act(() => api.payForOrder(order.id, user))}>
              Pay {money(order.total)}
            </button>
          )}
          {order.status === 'PENDING' && (
            <button className="btn ghost" disabled={busy} onClick={() => act(() => api.cancelOrder(order.id))}>
              Cancel order
            </button>
          )}
          {order.home && !isFinished(order.status) && (
            <a className="btn ghost" href={directionsUrl(order.home.lat, order.home.lng)} target="_blank" rel="noreferrer">
              Open my pin in Google Maps
            </a>
          )}
        </div>

        <h2>Items</h2>
        <ul className="mini">
          {order.items.map((i) => (
            <li key={i.menuItemId}><span>{i.quantity} x {i.name}</span><span>{money(i.price * i.quantity)}</span></li>
          ))}
        </ul>
        <p className="row-between"><strong>Total</strong><strong>{money(order.total)}</strong></p>
        <p className="muted small">
          {order.paid ? 'Paid online.' : order.paymentMethod === 'ONLINE' ? 'Payment pending.' : 'Pay the rider on delivery.'}
          {' '}Delivering to {order.address}
        </p>
        <Link className="btn ghost block" to="/orders">All orders</Link>
      </section>
    </div>
  );
}
