import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart.js';
import { money } from '../utils.js';
import Img from '../components/Img.jsx';

export default function Cart() {
  const { items, add, dec, remove, clear, total, restaurant } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link className="btn" to="/">Browse the menu</Link>
      </div>
    );
  }

  return (
    <div className="two-col">
      <section>
        <div className="row-between">
          <div>
            <h1>Your cart</h1>
            {restaurant && <p className="muted">From {restaurant.name}</p>}
          </div>
          <button className="link" onClick={clear}>Clear cart</button>
        </div>
        <ul className="lines">
          {items.map((i) => (
            <li key={i.id} className="line">
              <Img src={i.image} alt={i.name} className="line-img" />
              <div className="grow">
                <h3>{i.name}</h3>
                <p className="muted small">{money(i.price)} each</p>
              </div>
              <div className="stepper">
                <button onClick={() => dec(i.id)} aria-label={`Remove one ${i.name}`}>-</button>
                <span>{i.quantity}</span>
                <button onClick={() => add(restaurant, i)} aria-label={`Add one ${i.name}`}>+</button>
              </div>
              <strong className="line-total">{money(i.price * i.quantity)}</strong>
              <button className="link" onClick={() => remove(i.id)} aria-label={`Delete ${i.name}`}>Delete</button>
            </li>
          ))}
        </ul>
        {restaurant && <Link to={`/restaurant/${restaurant.id}`} className="link">Add more from {restaurant.name}</Link>}
      </section>

      <aside className="summary">
        <h2>Order summary</h2>
        <dl>
          <div className="total"><dt>Total</dt><dd>{money(total())}</dd></div>
        </dl>
        <button className="btn block" onClick={() => navigate('/checkout')}>Choose delivery location</button>
      </aside>
    </div>
  );
}
