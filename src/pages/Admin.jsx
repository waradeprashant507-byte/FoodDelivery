import { useEffect, useRef, useState } from 'react';
import { api, errMsg } from '../api/client.js';
import { STATUS_LABEL, isFinished, money, when } from '../utils.js';
import { directionsUrl } from '../lib/maps.js';

const STATUSES = ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All orders' },
];

export default function Admin() {
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('active');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // live location sharing: only one order at a time
  const [sharing, setSharing] = useState(null); // order id
  const [shareMsg, setShareMsg] = useState('');
  const watch = useRef(null);
  const lastSent = useRef(0);

  const load = () =>
    api.admin.orders().then((d) => { setOrders(d); setError(''); }).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  function stopSharing() {
    if (watch.current != null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setSharing(null);
  }
  useEffect(() => stopSharing, []); // stop on leaving the page

  // stop sharing automatically once that order is finished
  useEffect(() => {
    const o = orders?.find((x) => x.id === sharing);
    if (sharing && o && isFinished(o.status)) stopSharing();
  }, [orders, sharing]);

  function startSharing(id) {
    if (!navigator.geolocation) return setShareMsg('This browser cannot share its location.');
    stopSharing();
    setShareMsg('Waiting for GPS...');
    setSharing(id);
    watch.current = navigator.geolocation.watchPosition(
      async (p) => {
        const now = Date.now();
        if (now - lastSent.current < 5000) return; // send at most every 5 seconds
        lastSent.current = now;
        try {
          await api.admin.sendLocation(id, p.coords.latitude, p.coords.longitude);
          setShareMsg(`Location sent at ${new Date().toLocaleTimeString('en-IN')}`);
        } catch (e) {
          setShareMsg(errMsg(e));
        }
      },
      (err) => {
        setShareMsg(err.code === 1 ? 'Location permission is blocked. Allow it in your browser settings.' : 'Could not read your location.');
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  }

  async function setStatus(o, status) {
    setBusyId(o.id);
    setError('');
    try {
      await api.admin.updateOrderStatus(o.id, status);
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  if (!orders) return error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading orders...</p>;

  const shown = tab === 'active' ? orders.filter((o) => !isFinished(o.status)) : orders;

  return (
    <>
      <div className="row-between">
        <h1>Orders desk</h1>
        <span className="muted small">Refreshes every 8 seconds</span>
      </div>

      <div className="chips" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={`chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}{t.id === 'active' ? ` (${orders.filter((o) => !isFinished(o.status)).length})` : ''}
          </button>
        ))}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {shareMsg && sharing && <p className="notice" role="status">{shareMsg}</p>}

      {shown.length === 0 ? (
        <p className="empty">{tab === 'active' ? 'No active orders right now.' : 'No orders yet.'}</p>
      ) : (
        <ul className="lines">
          {shown.map((o) => (
            <li key={o.id} className="order">
              <div className="order-head">
                <div>
                  <h3>#{o.id} - {o.customerName}</h3>
                  {o.restaurantName && <p className="small">Pick up from <strong>{o.restaurantName}</strong></p>}
                  <p className="muted small">{when(o.createdAt)} - <a href={`tel:${o.phone}`}>{o.phone}</a></p>
                </div>
                <span className={`status ${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </div>

              <p className="small">{o.address}</p>
              <p className="muted small">{o.items.map((i) => `${i.quantity} x ${i.name}`).join(', ')}</p>

              <div className="order-foot">
                <strong>{money(o.total)}</strong>
                <span className={`tag ${o.paid ? 'ok' : ''}`}>
                  {o.paid ? 'Paid online' : o.paymentMethod === 'ONLINE' ? 'Awaiting payment' : 'Cash on delivery'}
                </span>
                <span className="grow" />
                {o.home && (
                  <a className="btn ghost sm" href={directionsUrl(o.home.lat, o.home.lng)} target="_blank" rel="noreferrer">
                    Directions
                  </a>
                )}
                <label className="select-inline">
                  <span className="sr">Status for order {o.id}</span>
                  <select value={o.status} disabled={busyId === o.id || isFinished(o.status)}
                    onChange={(e) => setStatus(o, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
              </div>

              {o.status === 'OUT_FOR_DELIVERY' && (
                <div className="share">
                  {sharing === o.id ? (
                    <button className="btn ghost sm" onClick={stopSharing}>Stop sharing my location</button>
                  ) : (
                    <button className="btn sm" onClick={() => startSharing(o.id)}>
                      Share my live location with the customer
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
