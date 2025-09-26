import React, { useState, useEffect } from 'react';
import {
  Home,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Status mapping: backend → frontend label & value
  const statusMap = {
    pending: { label: 'Pending', icon: <Clock className="w-6 h-6 text-yellow-500" />, order: 3 },
    'in progress': { label: 'In Progress', icon: <AlertCircle className="w-6 h-6 text-orange-500" />, order: 4 },
    'ready for inspection': { label: 'In Progress', addTo: 'in progress' }, // group into "In Progress"
    inspection: { label: 'In Progress', addTo: 'in progress' },
    'inspection failed': { label: 'In Progress', addTo: 'in progress' },
    'successful inspection': { label: 'In Progress', addTo: 'in progress' },
    completed: { label: 'Completed', icon: <CheckCircle className="w-6 h-6 text-green-500" />, order: 2 },
  
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/inspection-analysis/inspection-stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();

        // Process raw data into grouped frontend stats
        const processed = {};

        // Initialize all frontend-relevant statuses
        Object.keys(statusMap)
          .filter(key => statusMap[key].order)
          .forEach(key => {
            const { label, icon, order } = statusMap[key];
            if (!processed[label]) {
              processed[label] = { value: 0, label, icon, order };
            }
          });

        // Aggregate backend statuses into frontend groups
        Object.entries(data).forEach(([status, count]) => {
          const mapping = statusMap[status];
          if (mapping?.addTo) {
            const targetLabel = statusMap[mapping.addTo]?.label || mapping.addTo;
            processed[targetLabel].value += count;
          } else if (mapping?.label) {
            processed[mapping.label].value += count;
          }
        });

        // Add Total Assigned = sum of all except maybe cancelled
        const completed = processed['Completed']?.value || 0;
        const pending = processed['Pending']?.value || 0;
        const inProgress = processed['In Progress']?.value || 0;
        const totalAssigned = completed + pending + inProgress;

        const finalStats = {
          totalAssigned: { id: 1, value: totalAssigned, label: 'Total Assigned', icon: <ClipboardList className="w-6 h-6 text-blue-500" /> },
          ...processed
        };

        setStats(finalStats);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Prepare pie chart data
  const pieData = stats
    ? ['Completed', 'Pending', 'In Progress', 'Cancelled'].map(label => ({
        name: label,
        value: stats[label]?.value || 0
      }))
    : [];

  const COLORS = ['#10B981', '#FBBF24', '#3B82F6', '#EF4444'];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
        <p className="mt-2 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
        <p className="mt-2 text-gray-600">Failed to load dashboard data.</p>
      </div>
    );
  }

  const statList = Object.values(stats).sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="p-2 bg-blue-100 rounded-lg mr-3">
          <Home className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Inspection Dashboard</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statList.map(stat => (
          <div
            key={stat.label}
            className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-xs">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pie Chart */}
      <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Inspection Status Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} inspections`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;