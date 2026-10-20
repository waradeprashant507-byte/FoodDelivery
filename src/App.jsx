import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Restaurant from './pages/Restaurant.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Checkout from './pages/Checkout.jsx';
import Tracking from './pages/Tracking.jsx';
import Orders from './pages/Orders.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurant/:id" element={<Restaurant />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/track/:id" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute admin><Admin /></ProtectedRoute>} />
          <Route path="*" element={<p className="empty">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
