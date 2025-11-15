import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "Today's Orders", value: '24' },
    { label: 'Active Tables', value: '8' },
    { label: 'Revenue (EGP)', value: '12,450' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <button
          onClick={() => navigate('/menu')}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Go to Menu
        </button>
      </div>
    </div>
  );
}

