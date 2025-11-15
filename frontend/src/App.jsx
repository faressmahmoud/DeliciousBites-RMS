import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ServiceModeProvider } from './context/ServiceModeContext';
import AppShell from './components/layout/AppShell';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ServiceModeSelection from './pages/ServiceModeSelection';
import Reservation from './pages/Reservation';
import ReservationConfirmation from './pages/ReservationConfirmation';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderSuccess from './pages/OrderSuccess';
import MyReservations from './pages/MyReservations';
import MyOrders from './pages/MyOrders';
import StaffLogin from './pages/StaffLogin';
import StaffRegister from './pages/StaffRegister';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute from './components/admin/AdminRoute';
import VerifyOTP from './pages/VerifyOTP';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ServiceModeProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/register" element={<StaffRegister />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route path="/service-mode" element={<ServiceModeSelection />} />
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/reservation-confirmation" element={<ReservationConfirmation />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/" element={<AppShell />}>
              <Route path="menu" element={<Menu />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="payment" element={<Payment />} />
              <Route path="my-reservations" element={<MyReservations />} />
              <Route path="my-orders" element={<MyOrders />} />
            </Route>
          </Routes>
        </ServiceModeProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

