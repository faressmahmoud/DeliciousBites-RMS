import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { RoleAuthProvider } from './context/RoleAuthContext';
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
import StaffRoleLogin from './pages/StaffRoleLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute from './components/admin/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import KitchenDashboard from './pages/KitchenDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import ReceptionDashboard from './pages/ReceptionDashboard';
import Unauthorized from './pages/Unauthorized';
import VerifyOTP from './pages/VerifyOTP';

function App() {
  return (
    <AuthProvider>
      <RoleAuthProvider>
        <CartProvider>
          <ServiceModeProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/login" element={<Login />} />
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff/register" element={<StaffRegister />} />
              <Route path="/staff-role-login" element={<StaffRoleLogin />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/kitchen-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['kitchen']}>
                    <KitchenDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/waiter-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['waiter']}>
                    <WaiterDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reception-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['reception']}>
                    <ReceptionDashboard />
                  </ProtectedRoute>
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
      </RoleAuthProvider>
    </AuthProvider>
  );
}

export default App;

