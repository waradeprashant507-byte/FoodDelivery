export const photo = (id, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: import.meta.env.VITE_CURRENCY || 'INR',
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

// The backend runs one kitchen. Edit these in .env.
export const BRAND = {
  id: 1,
  name: import.meta.env.VITE_RESTAURANT_NAME || 'Crave',
};

export const KITCHEN = {
  lat: Number(import.meta.env.VITE_RESTAURANT_LAT) || 19.076,
  lng: Number(import.meta.env.VITE_RESTAURANT_LNG) || 72.8777,
};

// Backend OrderStatus values
export const STATUS_LABEL = {
  PENDING: 'Order placed',
  PREPARING: 'Being prepared',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
export const FLOW = ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
export const isFinished = (s) => s === 'DELIVERED' || s === 'CANCELLED';

export const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : '';
