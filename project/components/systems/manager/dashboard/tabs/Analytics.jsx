import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  ClipboardCheck, 
  FileSpreadsheet,
  UserCheck,
  BarChart3,
  LineChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeCustomers: 0,
    vehiclesInService: 0,
    pendingInspections: 0
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [weeklyRepairTrends, setWeeklyRepairTrends] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [12, 19, 15, 17, 14, 8, 5]
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [30000, 35000, 42000, 38000, 45000, 50000]
  });
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [weeklyTrendsLoading, setWeeklyTrendsLoading] = useState(true);
  const [monthlyRevenueLoading, setMonthlyRevenueLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          employeesRes,
          customersRes,
          vehiclesRes,
          inspectionsRes
        ] = await Promise.all([
          fetch(`https://ipasystem.bymsystem.com/api/manager-analytics/total-employees`),
          fetch(`https://ipasystem.bymsystem.com/api/manager-analytics/active-customers`),
          fetch(`https://ipasystem.bymsystem.com/api/manager-analytics/vehicles-in-service`),
          fetch(`https://ipasystem.bymsystem.com/api/manager-analytics/pending-inspections`)
        ]);

        const results = await Promise.all([
          employeesRes.json(),
          customersRes.json(),
          vehiclesRes.json(),
          inspectionsRes.json()
        ]);

        setStats({
          totalEmployees: results[0]?.total || 0,
          activeCustomers: results[1]?.total || 0,
          vehiclesInService: results[2]?.total || 0,
          pendingInspections: results[3]?.total || 0
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch pending service requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      setRequestsLoading(true);
      try {
        const res = await fetch(`https://ipasystem.bymsystem.com/api/manager-analytics/pending`);
        if (!res.ok) throw new Error('Failed to fetch pending requests');

        const data = await res.json();

        const mappedRequests = data.map(req => ({
          id: req.id,
          customer: req.customer_name,
          vehicle: req.vehicle_info,
          licensePlate: req.license_plate,
          issue: req.title || req.description,
          status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
          priority: req.priority,
          type: req.type,
          createdAt: new Date(req.created_at).toLocaleDateString()
        }));

        setPendingRequests(mappedRequests);
      } catch (err) {
        console.error('Error fetching pending requests:', err);
        // Fallback mock data
        setPendingRequests([
          { id: '1', customer: 'John Doe', vehicle: 'Toyota Camry', issue: 'Engine Check', status: 'Pending', createdAt: '10/04' },
          { id: '2', customer: 'Jane Smith', vehicle: 'Honda Civic', issue: 'Brake Inspection', status: 'Awaiting Inspection', createdAt: '10/04' },
          { id: '3', customer: 'Mike Johnson', vehicle: 'Ford F-150', issue: 'Transmission', status: 'In Progress', createdAt: '10/03' }
        ]);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);

  // Fetch ticket status distribution (for pie chart)
  useEffect(() => {
    const fetchStatusDistribution = async () => {
      setChartLoading(true);
      try {
        const res = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/status-distribution');
        if (!res.ok) throw new Error('Failed to fetch status distribution');

        const data = await res.json();
        const rawDist = data?.distribution || [];

        const mapped = rawDist
          .filter(item => item && typeof item === 'object')
          .map(item => {
            const status = typeof item.status === 'string' ? item.status.trim() : 'Unknown';
            const count = typeof item.count === 'number' ? item.count : 0;
            return {
              name: status.charAt(0).toUpperCase() + status.slice(1),
              value: count,
              color: getStatusColor(status)
            };
          });

        setStatusData(mapped);
      } catch (err) {
        console.error('Error fetching status distribution:', err);
        setStatusData([
          { name: 'Pending', value: 5, color: '#f59e0b' },
          { name: 'In Progress', value: 3, color: '#3b82f6' },
          { name: 'Completed', value: 7, color: '#10b981' }
        ]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchStatusDistribution();
  }, []);

  // Fetch weekly repair trends
  useEffect(() => {
    const fetchWeeklyRepairTrends = async () => {
      setWeeklyTrendsLoading(true);
      try {
        const res = await fetch('https://ipasystem.bymsystem.com/api/manager-analytics/weekly-repair-trends');
        if (!res.ok) throw new Error('Failed to fetch weekly repair trends');

        const data = await res.json();
        setWeeklyRepairTrends({
          labels: data.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: data.data || [12, 19, 15, 17, 14, 8, 5]
        });
      } catch (err) {
        console.error('Error fetching weekly repair trends:', err);
        // Static data is already set as initial state, so no need to set it again
      } finally {
        setWeeklyTrendsLoading(false);
      }
    };

    fetchWeeklyRepairTrends();
  }, []);

  // Fetch monthly revenue
  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      setMonthlyRevenueLoading(true);
      try {
        const res = await fetch('https://ipasystem.bymsystem.com/api/manager-analytics/monthly-revenue');
        if (!res.ok) throw new Error('Failed to fetch monthly revenue');

        const data = await res.json();
        setMonthlyRevenue({
          labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: data.data || [30000, 35000, 42000, 38000, 45000, 50000]
        });
      } catch (err) {
        console.error('Error fetching monthly revenue:', err);
        // Static data is already set as initial state, so no need to set it again
      } finally {
        setMonthlyRevenueLoading(false);
      }
    };

    fetchMonthlyRevenue();
  }, []);

  // Helper to get color by status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#8b5cf6'; // purple
      case 'in progress': return '#f59e0b'; // amber
      case 'ready for inspection': return '#3b82f6'; // blue
      case 'inspection': return '#06b6d4'; // cyan
      case 'successful inspection': return '#10b981'; // green
      case 'inspection failed': return '#ef4444'; // red
      case 'awaiting bill': return '#f97316'; // orange
      case 'completed': return '#059669'; // dark green
      case 'awaiting survey': return '#eab308'; // yellow (stands out as "awaiting")
      case 'awaiting salvage form': return '#a855f7'; // violet (different from pending purple)
      default: return '#9ca3af'; // gray
    }
  };

  // Chart Data
  const repairTrendsData = {
    labels: weeklyRepairTrends.labels,
    datasets: [
      {
        label: 'Repairs Completed',
        data: weeklyRepairTrends.data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      }
    ]
  };

  const monthlyTrendsData = {
    labels: monthlyRevenue.labels,
    datasets: [
      {
        label: 'Revenue',
        data: monthlyRevenue.data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // Loading/Error
  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black text-sm">Total Employees</p>
              <p className="text-2xl font-bold mt-1 text-black">{stats.totalEmployees}</p>
            </div>
            <div className="text-blue-600"><Users className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black text-sm">Active Customers</p>
              <p className="text-2xl font-bold mt-1 text-black">{stats.activeCustomers}</p>
            </div>
            <div className="text-green-600"><UserCheck className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black text-sm">Vehicles in Service</p>
              <p className="text-2xl font-bold mt-1 text-black">{stats.vehiclesInService}</p>
            </div>
            <div className="text-orange-600"><Car className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black text-sm">Pending Inspections</p>
              <p className="text-2xl font-bold mt-1 text-black">{stats.pendingInspections}</p>
            </div>
            <div className="text-purple-600"><ClipboardCheck className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-black">
              <FileSpreadsheet className="w-5 h-5" />
              Pending Requests
            </h2>
          </div>

          {requestsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.slice(0, 3).map((request) => (
                <div 
                  key={request.id}
                  className={`p-4 rounded-lg border ${
                    selectedRequest === request.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  } cursor-pointer transition-colors`}
                  onClick={() => setSelectedRequest(request.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-black">{request.customer}</p>
                      <p className="text-sm text-gray-600">{request.vehicle}</p>
                      <p className="text-sm text-gray-500 mt-1">{request.issue}</p>
                      <p className="text-xs text-gray-400 mt-1">Created: {request.createdAt}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                        request.status === 'Awaiting Inspection' ? 'bg-purple-100 text-purple-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Status Overview (replaces Service Distribution) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-black">
            <PieChart className="w-5 h-5" />
            Ticket Status Overview
          </h2>

          {chartLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : statusData.length === 0 ? (
            <p className="text-center text-gray-500">No data available.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => value} />
                </RechartsPieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {item.name}: <strong>{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Repair Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-black">
            <LineChart className="w-5 h-5" />
            Weekly Repair Trends
          </h2>
          <div className="h-[300px]">
            {weeklyTrendsLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading weekly trends...</p>
              </div>
            ) : (
              <Line data={repairTrendsData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-black">
            <BarChart3 className="w-5 h-5" />
            Monthly Revenue
          </h2>
          <div className="h-[300px]">
            {monthlyRevenueLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading revenue data...</p>
              </div>
            ) : (
              <Bar data={monthlyTrendsData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;