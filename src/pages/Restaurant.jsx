import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errMsg } from '../api/client.js';
import { useCart } from '../store/cart.js';
import { money } from '../utils.js';
import Img from '../components/Img.jsx';

export default function Restaurant() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  const { add, dec, items, total, restaurant: cartRestaurant } = useCart();

  useEffect(() => {
    setR(null);
    setError('');
    api.restaurant(id).then(setR).catch((e) => setError(errMsg(e)));
  }, [id]);

  const sections = useMemo(() => {
    const map = {};
    (r?.menu || []).forEach((m) => {
      const key = m.section || 'Menu';
      (map[key] ||= []).push(m);
    });
    return Object.entries(map);
  }, [r]);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const qty = (itemId) => items.find((i) => i.id === itemId)?.quantity || 0;

  if (error) return <p className="error" role="alert">{error} <Link to="/">Back to restaurants</Link></p>;
  if (!r) return <p className="muted">Loading menu...</p>;

  const otherCart = cartRestaurant && cartRestaurant.id !== r.id;

  return (
    <>
      <div className="rhead">
        <Img src={r.image} alt={r.name} className="rhead-img" />
        <div>
          <h1>{r.name}</h1>
          <p className="muted">{r.cuisine} - {Number(r.rating).toFixed(1)} rating - {r.etaMinutes} min</p>
        </div>
      </div>

      {otherCart && (
        <p className="notice">
          Your cart has items from {cartRestaurant.name}. Adding an item here will start a new cart.
        </p>
      )}

      {sections.length === 0 && <p className="empty">This restaurant has no dishes available right now.</p>}

      {sections.map(([name, list]) => (
        <section key={name}>
          <h2>{name}</h2>
          <div className="menu">
            {list.map((m) => (
              <article key={m.id} className="mitem">
                <div className="mitem-text">
                  <h3>{m.name}</h3>
                  <p className="muted small">{m.description}</p>
                  <strong>{money(m.price)}</strong>
                </div>
                <div className="mitem-side">
                  <Img src={m.image} alt={m.name} className="mitem-img" />
                  {qty(m.id) === 0 ? (
                    <button className="btn add" onClick={() => add(r, m)}>Add</button>
                  ) : (
                    <div className="stepper">
                      <button onClick={() => dec(m.id)} aria-label={`Remove one ${m.name}`}>-</button>
                      <span>{qty(m.id)}</span>
                      <button onClick={() => add(r, m)} aria-label={`Add one ${m.name}`}>+</button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {count > 0 && !otherCart && (
        <Link to="/cart" className="cartbar">
          <span>{count} {count === 1 ? 'item' : 'items'} - {money(total())}</span>
          <span>View cart</span>
        </Link>
      )}
    </>
  );
}
