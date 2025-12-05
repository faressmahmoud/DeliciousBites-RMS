import { useNavigate } from 'react-router-dom';
import { useRoleAuth } from '../context/RoleAuthContext';

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const { staffUser, logout } = useRoleAuth();

  const handleLogout = () => {
    logout();
    navigate('/staff-role-login');
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      <div className="bg-stone-800 text-amber-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Reception Dashboard</h1>
              <p className="text-stone-400 text-sm mt-1">
                Welcome, {staffUser?.name || 'Receptionist'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-stone-700 text-amber-50 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to Reception Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Use the button below to manage dine-in reservations.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/reservation-management')}
              className="bg-stone-800 text-amber-50 px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors font-medium"
            >
              Manage Reservations
            </button>
            <button className="bg-stone-800 text-amber-50 px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors font-medium">
              View Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

