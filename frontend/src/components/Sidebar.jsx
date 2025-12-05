import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/menu', label: 'Menu', icon: '🍽️' },
    { path: '/cart', label: 'Cart', icon: '🛒' },
    { path: '/my-reservations', label: 'My Reservations', icon: '📅' },
    { path: '/my-orders', label: 'My Orders', icon: '📋' },
    { path: '/order-monitoring', label: 'Order Monitoring', icon: '📍' },
  ];

  return (
    <aside className="w-64 bg-stone-800 text-amber-50 flex flex-col">
      <div className="p-6 border-b border-stone-700">
        <Link to="/menu" className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Delicious Bites</h2>
        </Link>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 block px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-stone-700 text-amber-50'
                      : 'text-stone-300 hover:bg-stone-700 hover:text-amber-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

