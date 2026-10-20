import { Link, NavLink, useNavigate } from 'react-router-dom';
import { isAdmin, useAuth } from '../store/auth.js';
import { useCart } from '../store/cart.js';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const navigate = useNavigate();
  const admin = isAdmin(user);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">FoodTrack</Link>
        <nav className="nav-links">
          {admin ? (
            <>
              <NavLink to="/" end>View shop</NavLink>
              <NavLink to="/admin" end>Orders desk</NavLink>
              
            </>
          ) : (
            <>
              {token && <NavLink to="/orders">My orders</NavLink>}
              <NavLink to="/cart" className="cart-link">
                Cart
                {count > 0 && <span className="badge">{count}</span>}
              </NavLink>
            </>
          )}
          {token ? (
            <>
              <span className="muted hide-sm">{user?.name?.split(' ')[0]}</span>
              <button className="btn ghost sm" onClick={() => { logout(); navigate('/'); }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="btn ghost sm" to="/login">Log in</Link>
              <Link className="btn sm" to="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
