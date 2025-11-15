import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function RevenueSales() {
  const [revenue, setRevenue] = useState({
    today: 0,
    week: 0,
    month: 0,
    byType: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    loadRevenue();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const socket = io(API_URL);
    
    socket.on('revenueUpdate', () => {
      loadRevenue();
    });

    socket.on('orderPaidChanged', () => {
      loadRevenue();
    });

    return () => socket.disconnect();
  }, [timeRange]);

  const loadRevenue = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/admin/revenue?timeRange=${timeRange}`);
      const data = await response.json();
      setRevenue(data);
    } catch (error) {
      console.error('Failed to load revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `EGP ${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-800 mb-8">Revenue & Sales</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <p className="text-sm text-stone-600 mb-2">Today's Revenue</p>
          <p className="text-3xl font-bold text-stone-800">{formatCurrency(revenue.today)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <p className="text-sm text-stone-600 mb-2">This Week</p>
          <p className="text-3xl font-bold text-stone-800">{formatCurrency(revenue.week)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <p className="text-sm text-stone-600 mb-2">This Month</p>
          <p className="text-3xl font-bold text-stone-800">{formatCurrency(revenue.month)}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-stone-800">Revenue by Order Type</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-stone-600">Loading revenue data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Simple Bar Chart */}
            {revenue.byType && revenue.byType.length > 0 ? (
              <div className="space-y-4">
                {revenue.byType.map((item) => {
                  const maxRevenue = Math.max(...revenue.byType.map(r => r.total), 1);
                  const percentage = (item.total / maxRevenue) * 100;
                  
                  return (
                    <div key={item.service_mode}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-stone-700 capitalize">
                          {item.service_mode.replace('-', ' ')}
                        </span>
                        <span className="text-sm font-semibold text-stone-800">
                          {formatCurrency(item.total)} ({item.count} orders)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-medium text-white">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-stone-600">No revenue data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

