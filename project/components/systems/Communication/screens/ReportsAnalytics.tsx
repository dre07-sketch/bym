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

  const chartData = [
    { week: 'Dec 24-30', requests: 24 },
    { week: 'Dec 31-Jan 6', requests: 32 },
    { week: 'Jan 7-13', requests: 41 },
    { week: 'Jan 14-20', requests: 38 },
  ];

  const typeDistribution = [
    { type: 'Surveyor', count: 28, color: 'bg-blue-500' },
    { type: 'Salvage', count: 19, color: 'bg-orange-500' },
    { type: 'Payment', count: 35, color: 'bg-green-500' },
    { type: 'Proforma', count: 18, color: 'bg-purple-500' },
  ];

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

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleExport = () => {
    alert('Exporting latest analytics data as CSV...');
    // In real app: trigger file download
  };

  // Simulate loading analytics data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAnalytics({
        totalRequests: 120,
        completionRate: 87,
        avgResponseTime: 2.4,
        urgentRequests: 23,
        topType: 'Payment',
        monthlyGrowth: 18,
      });
      setLoading(false);
    }, 800);
  }, []);

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

            <div className="bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Urgent Requests</p>
                  <p className="text-3xl font-bold">{analytics.urgentRequests}</p>
                  <p className="text-sm text-orange-200">High priority</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-200 animate-pulse" />
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
            {chartData.map((data, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="w-16 bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t-sm shadow-md"
                  style={{ height: `${(data.requests / 45) * 200}px` }}
                ></div>
                <p className="text-xs text-gray-600 mt-2 text-center">{data.week}</p>
                <p className="text-sm font-medium text-gray-800">{data.requests}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-6">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            Request Type Distribution
          </h3>
          <div className="space-y-4">
            {typeDistribution.map((item, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-4 h-4 rounded ${item.color} mr-3`}></div>
                <span className="flex-1 text-gray-700">{item.type}</span>
                <span className="text-sm font-medium text-gray-800">{item.count}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full ml-4">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${(item.count / 100) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Insights */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Top Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">High Payment Volume</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Payment requests increased by 22% this month. Consider streamlining approval workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Slow Response on Salvage</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Avg. response time for salvage requests is 4.2h — above target of 2h.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800">Strong Completion Rate</h4>
                <p className="text-sm text-green-700 mt-1">
                  87% of requests completed on time — exceeding last month's 78%.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-start space-x-3">
              <Eye className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-800">Top Request Type</h4>
                <p className="text-sm text-purple-700 mt-1">
                  {analytics.topType} is the most common request type this quarter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="surveyor">Surveyor</option>
              <option value="salvage">Salvage</option>
              <option value="payment">Payment</option>
              <option value="performa">Proforma</option>
              <option value="summary">Summary</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Generated Reports</h3>
        </div>
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reports match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  !report.viewed ? 'bg-indigo-25' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">{getTypeIcon(report.type)}</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{report.title}</h4>
                    <div className="text-sm text-gray-600 mt-1 flex items-center space-x-4">
                      <span>{report.id}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.generatedDate).toLocaleDateString()}</span>
                      </div>
                      {report.size !== '—' && (
                        <>
                          <span>•</span>
                          <span>{report.size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>
                  {report.downloadUrl ? (
                    <a
                      href={report.downloadUrl}
                      download
                      className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">Processing...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsAnalytics;