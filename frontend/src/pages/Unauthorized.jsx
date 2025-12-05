import { useNavigate } from 'react-router-dom';
import { useRoleAuth } from '../context/RoleAuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { logout, staffUser } = useRoleAuth();

  const handleLogout = () => {
    logout();
    navigate('/staff-role-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-4">Access Denied</h1>
          <p className="text-stone-600 mb-6">
            You don't have permission to access this page.
            {staffUser && (
              <span className="block mt-2 text-sm">
                Your role: <strong>{staffUser.role}</strong>
              </span>
            )}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-stone-200 text-stone-800 py-3 rounded-lg font-medium hover:bg-stone-300 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

