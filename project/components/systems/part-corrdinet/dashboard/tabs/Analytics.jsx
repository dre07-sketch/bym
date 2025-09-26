import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Wrench, Clock, TrendingUp, CheckCircle } from 'lucide-react';

const Analytics = () => {
  const [metrics, setMetrics] = useState({
    activeRepairs: 0,
    completedRepairs: 0,
    pendingRepairs: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/part-cordinator-analytics/overview'); // Update if needed
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setMetrics(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-full flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-full">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Failed to load analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics Overview</h2>
        <p className="text-gray-600">Real-time insights into repairs and customers.</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Repairs */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-4">Active Repairs</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{metrics.activeRepairs}</p>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-4">Active Customers</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{metrics.activeCustomers}</p>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed Repairs */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-4">Completed Repairs</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{metrics.completedRepairs}</p>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Pending Repairs */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-4">Pending Repairs</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{metrics.pendingRepairs}</p>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most Requested Services */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transition-transform hover:scale-[1.01] duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Most Requested Services</h3>
            <select className="text-sm text-gray-600 border rounded-md px-2 py-1">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative group">
            <p className="text-gray-500 group-hover:opacity-0 transition-opacity">Bar chart of top 5 services</p>
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity text-sm text-gray-700 text-center px-4">
              💡 Tip: These services are trending and ideal for promotion or resource planning.
            </div>
          </div>
        </div>

        {/* Repair Category Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transition-transform hover:scale-[1.01] duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Repair Category Breakdown</h3>
            <button className="text-sm text-blue-600 hover:underline">View Details</button>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90" width="100" height="100">
                <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="50"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-blue-600">
                80%
              </div>
            </div>
            <p className="mt-4 text-gray-500 text-sm">Overall repair category efficiency</p>
          </div>
        </div>
      </div>

      {/* === Performance Trends & Insights === */}
      
    </div>
  );
};

export default Analytics;