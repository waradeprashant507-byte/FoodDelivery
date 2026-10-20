import { Navigate, useLocation } from 'react-router-dom';
import { isAdmin, useAuth } from '../store/auth.js';

// admin: true  -> only ADMIN accounts
// admin: false -> only customers (admins are sent to their own screen)
export default function ProtectedRoute({ children, admin = false }) {
  const { token, user } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin(user)) return <Navigate to="/" replace />;
  if (!admin && isAdmin(user)) return <Navigate to="/admin" replace />;
  return children;
}
