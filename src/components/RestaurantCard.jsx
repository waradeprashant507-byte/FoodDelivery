import { Link } from 'react-router-dom';
import Img from './Img.jsx';

export default function RestaurantCard({ r }) {
  return (
    <Link to={`/restaurant/${r.id}`} className="rcard">
      <Img src={r.image} alt={r.name} className="rcard-img" />
      <div className="rcard-body">
        <div className="rcard-top">
          <h3>{r.name}</h3>
          <span className="rating">{Number(r.rating).toFixed(1)}</span>
        </div>
        <p className="muted">{r.cuisine}</p>
        <p className="muted small">{r.etaMinutes} min delivery</p>
      </div>
    </Link>
  );
}
