// Demo data + fake backend so the UI runs without Spring Boot (VITE_USE_MOCK=true).
// Same shapes as the real API client. Nothing here is saved to your database.
import { photo } from '../utils.js';

const P = {
  pizza: 'photo-1513104890138-7c749659a591', burger: 'photo-1568901346375-23c9450c58cd',
  sushi: 'photo-1579871494447-9811cf80d66c', healthy: 'photo-1512621776951-a57141f2eefd',
  biryani: 'photo-1563379091339-03b21ab4a4f8', mexican: 'photo-1565299585323-38d6b0865b47',
  dessert: 'photo-1578985545062-69928b1d9587', coffee: 'photo-1495474472287-4d71bcdd2085',
  sides: 'photo-1573080496219-bb080dd4f877', ramen: 'photo-1569718212165-3a8278d5f624',
  shake: 'photo-1600271886742-f049cd451bba',
  misal: 'photo-1601050690597-df0568f70950', noodles: 'photo-1585032226651-759b368d7246',
  dumplings: 'photo-1496116218417-1a781b1c416c', rice: 'photo-1603133872878-684f208fb84b',
};

const CATS = [['Pizza', 'pizza'], ['Burgers', 'burger'], ['Sushi', 'sushi'], ['Healthy', 'healthy'],
  ['Biryani', 'biryani'], ['Mexican', 'mexican'], ['Desserts', 'dessert'], ['Coffee', 'coffee'],
  ['Misal', 'misal'], ['Chinese', 'noodles']];
const categories = CATS.map(([name, k], i) => ({ id: i + 1, name, image: photo(P[k], 200) }));
const catId = (name) => categories.find((c) => c.name === name).id;

const BASE = { lat: 19.076, lng: 72.8777 };
let nextItem = 100;
const dish = (name, description, price, k, section) => ({
  id: ++nextItem, name, description, price, image: photo(P[k]), section, categoryId: catId(section),
});
const R = (id, name, cuisine, k, rating, etaMinutes, dLat, dLng, menu) => ({
  id, name, cuisine, rating, etaMinutes, image: photo(P[k]),
  location: { lat: BASE.lat + dLat, lng: BASE.lng + dLng },
  categoryIds: [...new Set(menu.map((m) => m.categoryId))], menu,
});

const restaurants = [
  R(1, 'Slice Theory', 'Wood-fired pizza', 'pizza', 4.6, 25, 0.012, 0.008, [
    dish('Margherita', 'San Marzano tomato, fior di latte, basil', 299, 'pizza', 'Pizza'),
    dish('Pepperoni', 'Spicy pepperoni, mozzarella, chilli oil', 379, 'pizza', 'Pizza'),
    dish('Tiramisu', 'Espresso-soaked, mascarpone cream', 199, 'dessert', 'Desserts')]),
  R(2, 'Stack House', 'Smash burgers', 'burger', 4.4, 20, -0.01, 0.012, [
    dish('Classic smash', 'Double patty, cheddar, pickles, house sauce', 249, 'burger', 'Burgers'),
    dish('Crispy chicken', 'Buttermilk fried, slaw, hot honey', 229, 'burger', 'Burgers'),
    dish('Chocolate shake', 'Thick, with real cocoa', 179, 'shake', 'Desserts')]),
  R(3, 'Sakura Counter', 'Japanese', 'sushi', 4.8, 35, 0.02, -0.01, [
    dish('Salmon nigiri (6)', 'Hand-pressed, wasabi on the side', 499, 'sushi', 'Sushi'),
    dish('Tonkotsu ramen', 'Pork broth, chashu, soft egg', 459, 'ramen', 'Sushi')]),
  R(4, 'Green Bowl', 'Salads and bowls', 'healthy', 4.3, 20, -0.015, -0.01, [
    dish('Harvest salad', 'Roasted squash, kale, feta, pumpkin seeds', 289, 'healthy', 'Healthy'),
    dish('Quinoa power bowl', 'Chickpeas, avocado, tahini dressing', 329, 'healthy', 'Healthy')]),
  R(5, 'Biryani Junction', 'Hyderabadi', 'biryani', 4.7, 40, 0.005, 0.02, [
    dish('Chicken dum biryani', 'Slow-cooked, saffron rice, boiled egg', 349, 'biryani', 'Biryani'),
    dish('Veg biryani', 'Seasonal vegetables, mint, fried onions', 279, 'biryani', 'Biryani')]),
  R(6, 'Taco Lane', 'Street tacos', 'mexican', 4.5, 25, -0.006, -0.02, [
    dish('Al pastor tacos (3)', 'Pineapple, onion, coriander', 299, 'mexican', 'Mexican'),
    dish('Loaded burrito', 'Rice, beans, grilled chicken, salsa', 349, 'mexican', 'Mexican')]),
  R(7, 'Brew & Co', 'Coffee and bakes', 'coffee', 4.5, 15, 0.008, -0.018, [
    dish('Cold brew', '18-hour steep, over ice', 189, 'coffee', 'Coffee'),
    dish('Basque cheesecake', 'Burnt top, creamy centre', 229, 'dessert', 'Desserts')]),
  R(8, 'Katta Misal House', 'Maharashtrian misal', 'misal', 4.7, 25, 0.014, 0.003, [
    dish('Kolhapuri misal pav', 'Fiery sprouts curry, farsan, onion, two pav', 149, 'misal', 'Misal'),
    dish('Puneri misal pav', 'Milder, tangy usal with crunchy farsan', 139, 'misal', 'Misal'),
    dish('Sol kadhi', 'Cooling kokum and coconut drink', 59, 'shake', 'Misal')]),
  R(9, 'Puneri Misal Co.', 'Misal and snacks', 'misal', 4.5, 20, -0.004, 0.018, [
    dish('Misal thali', 'Misal, pav, papad, solkadhi and a sweet', 199, 'misal', 'Misal'),
    dish('Vada pav (2)', 'With dry garlic chutney', 79, 'sides', 'Misal')]),
  R(10, 'Dragon Wok', 'Indo-Chinese', 'noodles', 4.4, 30, 0.022, -0.018, [
    dish('Veg hakka noodles', 'Wok-tossed noodles, crunchy vegetables', 229, 'noodles', 'Chinese'),
    dish('Chicken fried rice', 'Egg, spring onion, soy and pepper', 259, 'rice', 'Chinese')]),
  R(11, 'Noodle Bar & Dumplings', 'Chinese', 'dumplings', 4.6, 30, 0.002, 0.01, [
    dish('Steamed veg momos (6)', 'Hand-folded, with red chilli chutney', 179, 'dumplings', 'Chinese'),
    dish('Schezwan noodles', 'Hot, garlicky, loaded with veg', 239, 'noodles', 'Chinese')]),
];

const delay = (v, ms = 200) => new Promise((r) => setTimeout(() => r(v), ms));
const read = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const fail = (msg) => { throw new Error(msg); };
const slim = ({ menu, ...r }) => r;

// Orders move on their own: PENDING -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED
function progress(o) {
  if (o.status === 'CANCELLED') return o;
  const kitchen = restaurants.find((r) => r.id === o.restaurantId)?.location || BASE;
  const home = o.home || { lat: kitchen.lat + 0.012, lng: kitchen.lng + 0.01 };
  const s = (Date.now() - o.createdAt) / 1000;
  let status = 'PENDING';
  if (s > 50) status = 'DELIVERED';
  else if (s > 20) status = 'OUT_FOR_DELIVERY';
  else if (s > 8) status = 'PREPARING';
  if (o.forced) status = o.forced;
  const t = status === 'DELIVERED' ? 1 : Math.max(0, (s - 20) / 30);
  const rider = status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED'
    ? { lat: kitchen.lat + (home.lat - kitchen.lat) * t, lng: kitchen.lng + (home.lng - kitchen.lng) * t }
    : null;
  return { ...o, status, home, rider, kitchen };
}

const session = (u) => ({ token: 'mock-token', user: { id: u.id, name: u.name, email: u.email, role: u.role || 'CUSTOMER' } });

export const api = {
  async login({ email, password }) {
    if (email === 'admin@crave.com' && password === 'admin') {
      return delay(session({ id: 0, name: 'Admin', email, role: 'ADMIN' }));
    }
    const u = read('mock_users', []).find((x) => x.email === email && x.password === password);
    if (!u) fail('Invalid email or password');
    return delay(session(u));
  },
  async register({ name, email, phone, password }) {
    const users = read('mock_users', []);
    if (users.some((x) => x.email === email)) fail('Email is already registered');
    const u = { id: Date.now(), name, email, phone, password };
    write('mock_users', [...users, u]);
    return delay(session(u));
  },
  categories: () => delay(categories, 80),
  async restaurants({ category, q } = {}) {
    let list = restaurants;
    if (category) list = list.filter((r) => r.categoryIds.includes(Number(category)));
    if (q) {
      const n = q.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(n) || r.cuisine.toLowerCase().includes(n)
        || r.menu.some((m) => m.name.toLowerCase().includes(n)));
    }
    return delay(list.map(slim));
  },
  async restaurant(id) {
    const r = restaurants.find((x) => x.id === Number(id));
    if (!r) fail('Restaurant not found');
    return delay(r);
  },
  async createOrder({ restaurantId, items, address, phone, latitude, longitude, paymentMethod }) {
    const r = restaurants.find((x) => x.id === Number(restaurantId));
    const lines = items.map((i) => {
      const it = r.menu.find((x) => x.id === i.id);
      return { menuItemId: it.id, name: it.name, image: it.image, quantity: i.quantity, price: it.price };
    });
    const order = {
      id: Date.now(), createdAt: Date.now(), status: 'PENDING', address, phone, paymentMethod, paid: false,
      restaurantId: r.id, restaurantName: r.name, customerName: 'You',
      total: lines.reduce((s, l) => s + l.price * l.quantity, 0), items: lines,
      home: latitude != null ? { lat: latitude, lng: longitude } : null,
    };
    write('mock_orders', [order, ...read('mock_orders', [])]);
    return delay(progress(order), 400);
  },
  async getOrder(id) {
    const o = read('mock_orders', []).find((x) => String(x.id) === String(id));
    if (!o) fail('Order not found');
    return progress(o);
  },
  listOrders: async () => delay(read('mock_orders', []).map(progress)),
  async cancelOrder(id) {
    const all = read('mock_orders', []);
    const o = all.find((x) => String(x.id) === String(id));
    if (!o) fail('Order not found');
    if (progress(o).status !== 'PENDING') fail('Only pending orders can be cancelled');
    o.status = 'CANCELLED';
    write('mock_orders', all);
    return delay(progress(o));
  },
  async payForOrder(id) {
    const all = read('mock_orders', []);
    const o = all.find((x) => String(x.id) === String(id));
    if (o) { o.paid = true; write('mock_orders', all); }
    return delay(true, 700);
  },
  admin: {
    orders: async () => delay(read('mock_orders', []).map(progress)),
    async updateOrderStatus(id, status) {
      const all = read('mock_orders', []);
      const o = all.find((x) => String(x.id) === String(id));
      if (o) { o.forced = status; if (status === 'CANCELLED') o.status = status; write('mock_orders', all); }
      return delay(progress(o));
    },
    sendLocation: async () => delay(true, 50),
  },
};
