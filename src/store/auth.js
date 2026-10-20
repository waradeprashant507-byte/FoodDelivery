import { create } from 'zustand';

const saved = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const useAuth = create((set) => ({
  token: localStorage.getItem('token'),
  user: saved(),
  setSession: ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

export const isAdmin = (user) => user?.role === 'ADMIN';
