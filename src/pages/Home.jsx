import { useEffect, useState } from 'react';
import { api, errMsg } from '../api/client.js';
import Img from '../components/Img.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categories().then(setCategories).catch((e) => setError(errMsg(e)));
  }, []);

  // Re-fetch when category or search text changes (debounced).
  // `ignore` drops answers that arrive late, so an old search can never replace a newer one.
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .restaurants({ category: category || undefined, q: q.trim() || undefined })
        .then((d) => { if (!ignore) { setRestaurants(d); setError(''); } })
        .catch((e) => { if (!ignore) setError(errMsg(e)); })
        .finally(() => { if (!ignore) setLoading(false); });
    }, 250);
    return () => { ignore = true; clearTimeout(t); };
  }, [category, q]);

  const filtered = Boolean(category || q.trim());

  return (
    <>
      <section className="hero">
        <h1>Hungry? Dinner is 25 minutes away.</h1>
        <p>Order from local kitchens and watch your rider on the live map.</p>
        <input
          className="search"
          type="search"
          placeholder="Search restaurants, cuisines or dishes"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search restaurants"
        />
      </section>

      {q.trim() && (
        <p className="search-note" role="status">
          {loading
            ? `Searching for "${q.trim()}"...`
            : error
              ? ''
              : `${restaurants.length} ${restaurants.length === 1 ? 'result' : 'results'} for "${q.trim()}"`}
          {' '}
          <button className="link" onClick={() => setQ('')}>Clear search</button>
        </p>
      )}

      {categories.length > 0 && (
        <section>
          <h2>What are you craving?</h2>
          <div className="cats" role="list">
            {categories.map((c) => (
              <button
                key={c.id}
                role="listitem"
                className={`cat ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(category === c.id ? '' : c.id)}
                aria-pressed={category === c.id}
              >
                <Img src={c.image} alt={c.name} round />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>{category ? `${categories.find((c) => c.id === category)?.name || ''} near you` : 'Restaurants near you'}</h2>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? (
          <div className="grid" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((k) => <div key={k} className="rcard skeleton" />)}
          </div>
        ) : restaurants.length === 0 && !error ? (
          <p className="empty">
            {filtered
              ? 'No restaurants match. Try another category or clear your search.'
              : 'No restaurants yet. Restart the Spring Boot app to load the starter restaurants.'}
          </p>
        ) : (
          <div className="grid">
            {restaurants.map((r) => <RestaurantCard key={r.id} r={r} />)}
          </div>
        )}
      </section>
    </>
  );
}
