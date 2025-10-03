'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Package,
  Wrench,
  Activity,
  Calendar,
  User,
  FileText,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Types
interface ToolStats {
  totalTools: number;
  totalQuantity: number;
  toolsInUse: number;
  availableTools: number;
  damagedTools: number;
}

interface ReportSummary {
  totalTools: number;
  totalQuantity: number;
  lowStock: number;
  outOfStock: number;
  underMaintenance: number;
}

interface CategoryDistribution {
  category: string;
  count: number;
  quantity: number;
}

interface RecentActivity {
  activityId: number;
  type: string;
  message: string;
  user: string;
  time: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

interface DamageReport {
  id: number;
  toolId: string;
  name: string;
  brand: string;
  quantity: number;
  status: string;
  condition: string;
  imageUrl: string;
  reportedBy: string;
  damageNotes: string;
  reportedAt: string;
}

interface MonthlyData {
  month: string;
  assigned: number;
  returned: number;
  damaged: number;
}

const Reports: React.FC = () => {
  const [toolStats, setToolStats] = useState<ToolStats | null>(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'activity' | 'damage'>('overview');

  // Chart colors
  const CHART_COLORS = {
    primary: '#1e293b',
    secondary: '#3b82f6',
    accent: '#f97316',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gradient1: '#667eea',
    gradient2: '#764ba2',
    pie: ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  };

  // Fetch real data from your APIs
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parallel API calls
      const [
        statsRes,
        summaryRes,
        categoryRes,
        activityRes,
        damageRes
      ] = await Promise.all([
        fetch('http://localhost:5001/api/tools/stats').then(r => r.json()),
        fetch('http://localhost:5001/api/tools/reports/summary').then(r => r.json()),
        fetch('http://localhost:5001/api/tools/reports/category-distribution').then(r => r.json()),
        fetch('http://localhost:5001/api/tools/recent-activity').then(r => r.json()),
        fetch('http://localhost:5001/api/damage-reports').then(r => r.json())
      ]);

      // Handle responses
      if (statsRes.success) setToolStats(statsRes.data);
      else throw new Error('Failed to load tool stats');

      if (summaryRes.success) setReportSummary(summaryRes.data);
      else throw new Error('Failed to load report summary');

      if (categoryRes.success) setCategoryDistribution(categoryRes.data);
      else throw new Error('Failed to load category distribution');

      if (activityRes.success) setRecentActivity(activityRes.data);
      else throw new Error('Failed to load recent activity');

      if (damageRes.success) setDamageReports(damageRes.data);
      else throw new Error('Failed to load damage reports');

      // Generate monthly trend data (mock for now, can be enhanced)
      const now = new Date();
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mockMonthlyData: MonthlyData[] = months.map((month, i) => ({
        month,
        assigned: Math.floor(Math.random() * 20) + 30,
        returned: Math.floor(Math.random() * 20) + 30,
        damaged: Math.floor(Math.random() * 5) + 1
      }));
      setMonthlyData(mockMonthlyData);

    } catch (err: any) {
      console.error('Error fetching reports data:', err);
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Helper: Get activity icon
  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'assignment':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'return':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'check-in':
        return <Package className="h-4 w-4 text-orange-600" />;
      case 'damage':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">Quantity: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Bar/Area Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white p-6 rounded-xl shadow-lg">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-800" />
          <div>
            <p className="text-slate-800 font-semibold text-lg">Loading Reports...</p>
            <p className="text-slate-600 text-sm">Analyzing your tool data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Reports</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-3 rounded-lg hover:from-slate-700 hover:to-slate-600 transition-all duration-200 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Pie chart data
  const pieData = [
    { name: 'Available', value: toolStats?.availableTools || 0, color: CHART_COLORS.success },
    { name: 'In Use', value: toolStats?.toolsInUse || 0, color: CHART_COLORS.secondary },
    { name: 'Damaged', value: toolStats?.damagedTools || 0, color: CHART_COLORS.error },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Comprehensive tool management insights and reports</p>
              </div>
              <div className="flex space-x-3">
               
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-2 shadow-lg">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'analytics', name: 'Analytics', icon: TrendingUp },
              { id: 'activity', name: 'Activity Feed', icon: Activity },
              { id: 'damage', name: 'Damage Reports', icon: AlertTriangle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Tools',
                  value: toolStats?.totalQuantity || 0,
                  change: '+12%',
                  trend: 'up',
                  icon: Package,
                  gradient: 'from-blue-500 to-blue-600',
                  bgGradient: 'from-blue-50 to-blue-100'
                },
                {
                  title: 'Tools In Use',
                  value: toolStats?.toolsInUse || 0,
                  change: '+8%',
                  trend: 'up',
                  icon: Wrench,
                  gradient: 'from-orange-500 to-orange-600',
                  bgGradient: 'from-orange-50 to-orange-100'
                },
                {
                  title: 'Available',
                  value: toolStats?.availableTools || 0,
                  change: '-5%',
                  trend: 'down',
                  icon: CheckCircle,
                  gradient: 'from-green-500 to-green-600',
                  bgGradient: 'from-green-50 to-green-100'
                },
                {
                  title: 'Damaged',
                  value: toolStats?.damagedTools || 0,
                  change: '0%',
                  trend: 'stable',
                  icon: AlertTriangle,
                  gradient: 'from-red-500 to-red-600',
                  bgGradient: 'from-red-50 to-red-100'
                }
              ].map((metric) => (
                <div key={metric.title} className={`bg-gradient-to-br ${metric.bgGradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.gradient} shadow-lg`}>
                      <metric.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {metric.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-600" />}
                      {metric.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-600" />}
                      {metric.trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm font-medium mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tool Status Pie Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Tool Status Distribution</h3>
                    <p className="text-gray-600">Current status breakdown</p>
                  </div>
                  <Eye className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Bar Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Category Distribution</h3>
                    <p className="text-gray-600">Tools by category</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="quantity" 
                        fill="url(#colorGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-xl border border-orange-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Stock Alerts</h3>
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Low Stock</span>
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {reportSummary?.lowStock || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Out of Stock</span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {reportSummary?.outOfStock || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-xl border border-blue-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Maintenance</h3>
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Wrench className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Under Maintenance</span>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {reportSummary?.underMaintenance || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-xl border border-red-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recent Damage</h3>
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Damaged Tools</span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {damageReports?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Monthly Trends Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Monthly Tool Activity Trends</h3>
                  <p className="text-gray-600">Track assignments, returns, and damage reports over time</p>
                </div>
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="assignedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="returnedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="damagedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 14, fill: '#64748b' }}
                      stroke="#94a3b8"
                    />
                    <YAxis 
                      tick={{ fontSize: 14, fill: '#64748b' }}
                      stroke="#94a3b8"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="assigned"
                      name="Assigned"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#assignedGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="returned"
                      name="Returned"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#returnedGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="damaged"
                      name="Damaged"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#damagedGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparative Bar Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Category Performance Comparison</h3>
                  <p className="text-gray-600">Compare tool count vs quantity across categories</p>
                </div>
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      stroke="#94a3b8"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      stroke="#94a3b8"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Tool Types"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="quantity" 
                      name="Total Quantity"
                      fill="#1e293b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Recent Activity Feed</h3>
                  <p className="text-gray-600 text-sm mt-1">Latest tool management activities</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={activity.activityId} 
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        {getActivityIcon(activity.type, activity.status)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-gray-600 font-medium">by {activity.user}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No recent activity found</p>
                    <p className="text-sm">Activity will appear here as it happens</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Damage Reports Tab */}
        {activeTab === 'damage' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="p-6 border-b border-red-200/50 bg-gradient-to-r from-red-50/50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Damage Reports</h3>
                  <p className="text-gray-600 text-sm mt-1">Tools reported as damaged requiring attention</p>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">{damageReports.length} Active</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              {damageReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {damageReports.map((report) => (
                    <div key={report.id} className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{report.name}</h4>
                          <p className="text-sm text-gray-600 font-medium">{report.toolId} • {report.brand}</p>
                          <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-500 text-white font-bold shadow-sm">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {report.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-700 font-medium">{report.damageNotes || 'No details provided'}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-medium">Reported by {report.reportedBy}</span>
                        {report.reportedAt && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(report.reportedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-medium">No Damaged Tools</p>
                  <p className="text-sm">All tools are in good condition</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;