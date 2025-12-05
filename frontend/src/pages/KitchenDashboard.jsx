import { useNavigate } from 'react-router-dom';
import { useRoleAuth } from '../context/RoleAuthContext';
import KitchenDisplayScreen from '../components/kitchen/KitchenDisplayScreen';

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const { staffUser, logout } = useRoleAuth();

  const handleLogout = () => {
    logout();
    navigate('/staff-role-login');
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header Bar */}
      <div className="bg-stone-800 text-amber-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Kitchen Display System</h1>
              <p className="text-stone-400 text-lg mt-1">
                Welcome, {staffUser?.name || 'Kitchen Staff'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-stone-700 text-amber-50 px-6 py-3 rounded-lg hover:bg-stone-600 transition-colors text-lg font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Kitchen Display Screen */}
      <div className="max-w-7xl mx-auto">
        <KitchenDisplayScreen />
      </div>
    </div>
  );
}

