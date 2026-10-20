import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, errMsg } from '../api/client.js';
import { useAuth } from '../store/auth.js';
import { useCart } from '../store/cart.js';
import { money } from '../utils.js';
import { LocationPicker } from '../components/Maps.jsx';
import { mapsEnabled, reverseGeocode } from '../lib/maps.js';

const METHODS = [
  { id: 'ONLINE', label: 'Pay online', hint: 'UPI, cards and net banking through Razorpay' },
  { id: 'COD', label: 'Cash on delivery', hint: 'Pay the rider when your food arrives' },
];

export default function Checkout() {
  const { items, total, clear, restaurant } = useCart();
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const [pin, setPin] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(localStorage.getItem('phone') || '');
  const [method, setMethod] = useState('ONLINE');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (items.length === 0 || !restaurant) return <Navigate to="/cart" replace />;

  async function choose(pos) {
    setPin(pos);
    setError('');
    try {
      const a = await reverseGeocode(pos.lat, pos.lng);
      if (a) setAddress(a);
    } catch {
      /* address stays as typed; the pin is still saved */
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setError('Your browser cannot share its location. Tap the map instead.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); choose({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      () => { setLocating(false); setError('Location permission is blocked. Allow it in your browser, or tap the map.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function validate() {
    if (mapsEnabled && !pin) return 'Drop a pin on the map so the rider can find you.';
    if (address.trim().length < 8) return 'Add your full address with flat or house number and landmark.';
    if (!/^\d{10}$/.test(phone)) return 'Phone number must be 10 digits.';
    return '';
  }

  async function placeOrder(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setBusy(true);
    setError('');
    let order;
    try {
      order = await api.createOrder({
        restaurantId: restaurant.id,
        items,
        address: address.trim(),
        phone,
        latitude: pin?.lat,
        longitude: pin?.lng,
        paymentMethod: method,
      });
    } catch (err) {
      setBusy(false);
      return setError(errMsg(err));
    }

    localStorage.setItem('phone', phone);
    clear();

    let notice = '';
    if (method === 'ONLINE') {
      try {
        await api.payForOrder(order.id, user);
      } catch (err) {
        notice = `${errMsg(err)} Your order is saved. You can pay from the order page.`;
      }
    }
    navigate(`/track/${order.id}`, { replace: true, state: { notice } });
  }

  return (
    <form className="two-col" onSubmit={placeOrder}>
      <section>
        <h1>Where should we bring it?</h1>

        <div className="row-between mapbar">
          <p className="muted small">Tap the map or drag the pin to set your door.</p>
          <button type="button" className="btn ghost sm" onClick={useMyLocation} disabled={locating}>
            {locating ? 'Finding you...' : 'Use my location'}
          </button>
        </div>
        <div className="mapwrap">
          <LocationPicker value={pin} onChange={choose} center={restaurant.location} />
        </div>

        <label>Address
          <textarea rows="3" value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Flat or house number, building, street, landmark" />
        </label>
        <label>Phone for the rider
          <input type="tel" inputMode="numeric" maxLength={10} value={phone} autoComplete="tel-national"
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10 digit mobile number" />
        </label>

        <h2>Payment</h2>
        <div className="methods" role="radiogroup" aria-label="Payment method">
          {METHODS.map((m) => (
            <label key={m.id} className={`method ${method === m.id ? 'active' : ''}`}>
              <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
              <span><strong>{m.label}</strong><span className="muted small block">{m.hint}</span></span>
            </label>
          ))}
        </div>
      </section>

      <aside className="summary">
        <h2>Your order</h2>
        <p className="muted small">From {restaurant.name}</p>
        <ul className="mini">
          {items.map((i) => (
            <li key={i.id}><span>{i.quantity} x {i.name}</span><span>{money(i.price * i.quantity)}</span></li>
          ))}
        </ul>
        <dl>
          <div className="total"><dt>Total</dt><dd>{money(total())}</dd></div>
        </dl>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block" disabled={busy}>
          {busy ? 'Placing order...' : method === 'ONLINE' ? `Pay ${money(total())}` : 'Place order'}
        </button>
      </aside>
    </form>
  );
}
