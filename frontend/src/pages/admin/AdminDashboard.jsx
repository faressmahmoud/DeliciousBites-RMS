import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrdersMonitor from './OrdersMonitor';
import RevenueSales from './RevenueSales';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  
  const handleLogout = () => {
    localStorage.removeItem('staffUser');
    navigate('/staff/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      <div className="flex h-screen">
        {/* Left Navigation */}
        <aside className="w-64 bg-stone-800 text-amber-50 flex flex-col">
          <div className="p-6 border-b border-stone-700">
            <h2 className="text-xl font-bold mb-2">Admin Dashboard</h2>
            <p className="text-sm text-stone-400">
              {JSON.parse(localStorage.getItem('staffUser') || '{}').name || 'Staff'}
            </p>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-stone-700 text-amber-50'
                      : 'text-stone-300 hover:bg-stone-700 hover:text-amber-50'
                  }`}
                >
                  📋 Orders Monitor
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'revenue'
                      ? 'bg-stone-700 text-amber-50'
                      : 'text-stone-300 hover:bg-stone-700 hover:text-amber-50'
                  }`}
                >
                  💰 Revenue & Sales
                </button>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t border-stone-700">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-stone-700 text-amber-50 rounded-lg hover:bg-stone-600 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === 'orders' && <OrdersMonitor />}
            {activeTab === 'revenue' && <RevenueSales />}
          </div>
        </main>
      </div>
    </div>
  );
}

