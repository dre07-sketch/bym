'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'surveyor' | 'salvage' | 'payment' | 'performa' | 'summary';
  generatedDate: string;
  status: 'completed' | 'pending' | 'failed';
  downloadUrl: string;
  size: string;
  viewed: boolean;
}

interface AnalyticsData {
  totalRequests: number;
  completionRate: number;
  avgResponseTime: number; // in hours
  urgentRequests: number;
  topType: string;
  monthlyGrowth: number;
}

interface RequestVolume {
  month: string;
  totalRequests: number;
}

interface RequestDistribution {
  status: string;
  count: number;
}

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');

  // Mock Reports
  const [reports] = useState<Report[]>([
    {
      id: 'RPT-001',
      title: 'Weekly Communication Summary - Jan 1-7',
      type: 'summary',
      generatedDate: '2024-01-08T09:30:00Z',
      status: 'completed',
      downloadUrl: '#',
      size: '42 KB',
      viewed: true,
    },
    {
      id: 'RPT-002',
      title: 'Surveyor Request Trends - Dec 2023',
      type: 'surveyor',
      generatedDate: '2024-01-05T14:22:00Z',
      status: 'completed',
      downloadUrl: '#',
      size: '38 KB',
      viewed: false,
    },
    {
      id: 'RPT-003',
      title: 'Pending Payment Requests Report',
      type: 'payment',
      generatedDate: '2024-01-04T10:15:00Z',
      status: 'pending',
      downloadUrl: '',
      size: '—',
      viewed: false,
    },
    {
      id: 'RPT-004',
      title: 'Salvage Approval Rate Analysis',
      type: 'salvage',
      generatedDate: '2024-01-02T16:45:00Z',
      status: 'completed',
      downloadUrl: '#',
      size: '51 KB',
      viewed: true,
    },
    {
      id: 'RPT-005',
      title: 'Proforma Invoice Conversion Stats',
      type: 'performa',
      generatedDate: '2023-12-30T11:00:00Z',
      status: 'completed',
      downloadUrl: '#',
      size: '44 KB',
      viewed: true,
    },
  ]);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRequests: 0,
    completionRate: 0,
    avgResponseTime: 0,
    urgentRequests: 0,
    topType: '—',
    monthlyGrowth: 0,
  });

  const [requestVolume, setRequestVolume] = useState<RequestVolume[]>([]);
  const [requestDistribution, setRequestDistribution] = useState<RequestDistribution[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'surveyor':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'salvage':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'performa':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'summary':
        return <TrendingUp className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      case 'urgent':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleExport = () => {
    alert('Exporting latest analytics data as CSV...');
    // In real app: trigger file download
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/communication-center/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchRequestVolume = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/communication-center/analytics/request-volume');
      const data = await response.json();
      if (data.success) {
        setRequestVolume(data.data);
      }
    } catch (error) {
      console.error('Error fetching request volume:', error);
    }
  };

  const fetchRequestDistribution = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/communication-center/analytics/request-distribution');
      const data = await response.json();
      if (data.success) {
        setRequestDistribution(data.data);
      }
    } catch (error) {
      console.error('Error fetching request distribution:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnalytics(),
      fetchRequestVolume(),
      fetchRequestDistribution()
    ]);
    setLoading(false);
  };

  // Simulate loading analytics data
  useEffect(() => {
    fetchAllData();
  }, []);

  // Calculate max request volume for chart scaling
  const maxRequestVolume = Math.max(...requestVolume.map(item => item.totalRequests), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h2>
          <p className="text-gray-500 mt-1">Insights, trends, and downloadable reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl p-6 animate-pulse"></div>
          ))
        ) : (
          <>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100">Total Requests</p>
                  <p className="text-3xl font-bold">{analytics.totalRequests}</p>
                  <p className="text-sm text-indigo-200">Last 30 days</p>
                </div>
                <BarChart3 className="w-8 h-8 text-indigo-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Completion Rate</p>
                  <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                  <p className="text-sm text-green-200">On-time closure</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Avg Response Time</p>
                  <p className="text-3xl font-bold">{analytics.avgResponseTime}h</p>
                  <p className="text-sm text-yellow-200">From submission</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200 animate-spin" />
              </div>
            </div>

            

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100">Monthly Growth</p>
                  <p className="text-3xl font-bold">+{analytics.monthlyGrowth}%</p>
                  <p className="text-sm text-pink-200">vs last month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-pink-200" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Trends Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />
              Request Volume Trend
            </h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1"
            >
              <option value="7">Last 4 Weeks</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last Quarter</option>
            </select>
          </div>

          <div className="h-64 flex items-end space-x-6 justify-around bg-gray-50 rounded-xl p-6">
            {requestVolume.length > 0 ? (
              requestVolume.map((data, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-16 bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t-sm shadow-md"
                    style={{ height: `${(data.totalRequests / maxRequestVolume) * 200}px` }}
                  ></div>
                  <p className="text-xs text-gray-600 mt-2 text-center">{formatMonth(data.month)}</p>
                  <p className="text-sm font-medium text-gray-800">{data.totalRequests}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No request volume data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-6">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            Request Status Distribution
          </h3>
          <div className="space-y-4">
            {requestDistribution.length > 0 ? (
              requestDistribution.map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-4 h-4 rounded ${getStatusColorClass(item.status)} mr-3`}></div>
                  <span className="flex-1 text-gray-700 capitalize">{item.status}</span>
                  <span className="text-sm font-medium text-gray-800">{item.count}</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full ml-4">
                    <div
                      className={`h-2 rounded-full ${getStatusColorClass(item.status)}`}
                      style={{ width: `${(item.count / Math.max(...requestDistribution.map(d => d.count), 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No distribution data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Insights */}
     
    </div>
  );
};

export default ReportsAnalytics;