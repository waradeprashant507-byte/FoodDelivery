import axios from 'axios';
import { api as mockApi } from './mock.js';
import { BRAND } from '../utils.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Attach JWT to every request
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Token rejected (expired / wrong) -> clear the session and go to login
http.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthCall = (err.config?.url || '').startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const data = (r) => r.data;

// Backend login/register return { token, id, name, email, role }; the UI keeps { token, user }
const toSession = ({ token, id, name, email, role }) => ({ token, user: { id, name, email, role } });

// Backend restaurant -> UI shape (menu items get image + section)
const toMenuItem = (m) => ({
  ...m,
  price: Number(m.price),
  image: m.imageUrl || '',
  section: m.section || 'Menu',
});
const toRestaurant = (r) => ({
  ...r,
  image: r.image || '',
  rating: r.rating ?? 4.0,
  etaMinutes: r.etaMinutes ?? 30,
  cuisine: r.cuisine || '',
  location: r.latitude != null && r.longitude != null ? { lat: r.latitude, lng: r.longitude } : null,
  menu: r.menu ? r.menu.map(toMenuItem) : undefined,
});

// Backend Order -> UI shape
const toOrder = (o) => ({
  ...o,
  total: Number(o.totalAmount),
  items: (o.items || []).map((i) => ({ ...i, image: i.imageUrl, price: Number(i.price) })),
  home: o.deliveryLat != null && o.deliveryLng != null ? { lat: o.deliveryLat, lng: o.deliveryLng } : null,
  rider: o.driverLat != null && o.driverLng != null ? { lat: o.driverLat, lng: o.driverLng } : null,
  kitchen: o.restaurantLat != null && o.restaurantLng != null ? { lat: o.restaurantLat, lng: o.restaurantLng } : null,
});

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the payment window. Check your internet connection.'));
    document.body.appendChild(s);
  });
}

const real = {
  /* ----- auth ----- */
  login: (body) => http.post('/auth/login', body).then((r) => toSession(r.data)),
  register: (body) => http.post('/auth/register', body).then((r) => toSession(r.data)),

  /* ----- restaurants and categories (public) ----- */
  categories: () =>
    http.get('/categories').then((r) => r.data.map((c) => ({ ...c, image: c.imageUrl || '' }))),
  // params: { category: <category id>, q: <text> }
  restaurants: (params) => http.get('/restaurants', { params }).then((r) => r.data.map(toRestaurant)),
  restaurant: (id) => http.get(`/restaurants/${id}`).then((r) => toRestaurant(r.data)),

  /* ----- customer orders ----- */
  createOrder: ({ restaurantId, items, address, phone, latitude, longitude, paymentMethod }) =>
    http
      .post('/orders', {
        restaurantId,
        address,
        phone,
        latitude,
        longitude,
        paymentMethod,
        items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
      })
      .then((r) => toOrder(r.data)),
  getOrder: (id) => http.get(`/orders/${id}`).then((r) => toOrder(r.data)),
  listOrders: () => http.get('/orders/my').then((r) => r.data.map(toOrder)),
  cancelOrder: (id) => http.put(`/orders/${id}/cancel`).then((r) => toOrder(r.data)),

  /* ----- Razorpay: opens checkout, resolves once the server verified the payment ----- */
  payForOrder: async (orderId, user = {}) => {
    await loadRazorpay();
    const p = await http.post('/payment/create', { orderId }).then(data);
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: p.keyId,
        amount: p.amount,
        currency: p.currency,
        order_id: p.razorpayOrderId,
        name: BRAND.name,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#d81b60' },
        handler: async (res) => {
          try {
            await http.post('/payment/verify', {
              razorpayOrderId: res.razorpay_order_id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            });
            resolve(res);
          } catch (e) {
            reject(e);
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment was not completed.')) },
      });
      rzp.on('payment.failed', (r) => reject(new Error(r.error?.description || 'Payment failed.')));
      rzp.open();
    });
  },

  /* ----- admin ----- */
  admin: {
    orders: (status) =>
      http.get('/admin/orders', { params: status ? { status } : {} }).then((r) => r.data.map(toOrder)),
    updateOrderStatus: (id, status) =>
      http.put(`/admin/orders/${id}/status`, { status }).then((r) => toOrder(r.data)),
    sendLocation: (id, latitude, longitude) =>
      http.put(`/admin/orders/${id}/location`, { latitude, longitude }).then((r) => toOrder(r.data)),
  },
};

// In mock mode the demo data replaces the real calls
export const api = USE_MOCK ? mockApi : real;

// Handles plain-string bodies and { message } JSON bodies
export const errMsg = (e) => {
  const d = e?.response?.data;
  if (!e?.response && e?.message === 'Network Error') {
    return 'Cannot reach the server. Is the Spring Boot app running on port 8080?';
  }
  return (typeof d === 'string' && d) || d?.message || e?.message || 'Something went wrong. Try again.';
};
