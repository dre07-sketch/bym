import React, { useState, useEffect } from 'react';
import { X, BarChart2, Download, Calendar, Filter, TrendingUp, Users, Ticket, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define interface for revenue data
interface RevenueDataItem {
  month: string;
  revenue: number;
  target: number;
  variance: number;
  performance: number;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [ticketAnalytics, setTicketAnalytics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataItem[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);

  const reportTypes = [
    { id: 'overview', name: 'Overview', icon: BarChart2 },
    { id: 'tickets', name: 'Ticket Analytics', icon: Ticket },
    { id: 'revenue', name: 'Revenue Report', icon: DollarSign },
    { id: 'customer', name: 'Customer Analytics', icon: Users },
  ];

  // Status colors for ticket distribution - updated with comprehensive mapping
  const colorMap: Record<string, string> = {
    'pending': '#6b7280',               // Gray
    'assigned': '#8b5cf6',              // Purple
    'in progress': '#f59e0b',           // Amber
    'ready for inspection': '#06b6d4',  // Cyan
    'inspection': '#3b82f6',            // Blue
    'successful inspection': '#10b981', // Emerald
    'inspection failed': '#dda15e',     // Red
    'awaiting bill': '#f97316',         // Orange
    'awaiting survey': '#14b8a6',       // Teal
    'awaiting salvage form': '#eab308', // Yellow
    'payment requested': '#d946ef',     // Pink-Purple
    'request payment': '#ec4899',       // Pink
    'completed': '#22c55e',             // Green
    'other': '#9333ea'                  // Fallback
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    return colorMap[normalized] || colorMap.other;
  };

  // Fetch report data based on selected report type
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;
        switch(selectedReport) {
          case 'overview':
            response = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/reports/overview');
            const overview = await response.json();
            setOverviewData(overview);
            break;
          case 'tickets':
            response = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/reports/tickets');
            const tickets = await response.json();
            setTicketAnalytics(tickets);
            break;
          case 'revenue':
            // Pass dateRange to the API for dynamic data
            response = await fetch(`https://ipasystem.bymsystem.com/api/ticket-stats/reports/revenue?dateRange=${dateRange}`);
            const revenue = await response.json();
            setRevenueData(revenue);
            break;
          case 'customer':
            response = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/reports/customers');
            const customers = await response.json();
            setCustomerAnalytics(customers);
            break;
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedReport, isOpen, dateRange]); // Added dateRange to dependency array

  const handleExport = (reportType: string) => {
    window.location.href = `/api/reports/export/${reportType}`;
  };

  if (!isOpen) return null;

  // Format customer data for display
  const customerData = customerAnalytics ? [
    { type: 'New Customers', count: customerAnalytics.newCustomers.count, percentage: customerAnalytics.newCustomers.percentage },
    { type: 'Returning Customers', count: customerAnalytics.returningCustomers.count, percentage: customerAnalytics.returningCustomers.percentage }
  ] : [];

  // Enhanced revenue data processing
  const getEnhancedRevenueData = (): RevenueDataItem[] => {
    if (!revenueData || revenueData.length === 0) return [];
    
    // Process revenue data based on date range
    return revenueData.map((item: any) => ({
      ...item,
      target: item.revenue ? Math.round(item.revenue * 1.1) : 0, // 10% growth target
      variance: item.revenue ? Math.round(item.revenue * 0.1) : 0, // 10% variance
      performance: item.revenue && item.target ? (item.revenue / item.target) * 100 : 0
    }));
  };

  const enhancedRevenueData = getEnhancedRevenueData();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Analytics & Reports</h3>
                <p className="text-sm text-gray-500">Comprehensive business insights and performance metrics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 space-y-4">
              {/* Date Range Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last3months">Last 3 Months</option>
                  <option value="last6months">Last 6 Months</option>
                  <option value="lastyear">Last Year</option>
                </select>
              </div>

              {/* Report Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <div className="space-y-2">
                  {reportTypes.map(report => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedReport === report.id
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <report.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{report.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={() => handleExport(selectedReport)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <>
                  {selectedReport === 'overview' && overviewData && (
                    <>
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-600">Total Tickets</p>
                              <p className="text-2xl font-bold text-blue-900">{overviewData.tickets}</p>
                            </div>
                            <Ticket className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-600">Revenue</p>
                              <p className="text-2xl font-bold text-green-900">${overviewData.revenue?.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-purple-600">Customers</p>
                              <p className="text-2xl font-bold text-purple-900">{overviewData.customers}</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-600" />
                          </div>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-orange-600">Avg Response</p>
                              <p className="text-2xl font-bold text-orange-900">{Math.round(overviewData.avgResponse)}m</p>
                            </div>
                            <BarChart2 className="w-8 h-8 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedReport === 'tickets' && ticketAnalytics && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status Distribution</h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={ticketAnalytics.statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {ticketAnalytics.statusDistribution.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Ticket Trends</h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={ticketAnalytics.trends}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedReport === 'revenue' && revenueData && (
                    <>
                      {/* Revenue Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-green-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-900">
                            ${enhancedRevenueData.reduce((sum: number, item: RevenueDataItem) => sum + (item.revenue || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-blue-600">Average Performance</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {(
                              enhancedRevenueData.reduce((sum: number, item: RevenueDataItem) => sum + (item.performance || 0), 0) / 
                              enhancedRevenueData.length
                            ).toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-purple-600">Best Period</p>
                          <p className="text-xl font-bold text-purple-900 truncate">
                            {enhancedRevenueData.length > 0 
                              ? enhancedRevenueData.reduce((max: RevenueDataItem, item: RevenueDataItem) => 
                                  (item.revenue || 0) > (max.revenue || 0) ? item : max
                                ).month || 'N/A'
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Revenue Chart */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Revenue Performance ({dateRange === 'last7days' ? 'Last 7 Days' : 
                            dateRange === 'last30days' ? 'Last 30 Days' : 
                            dateRange === 'last3months' ? 'Last 3 Months' : 
                            dateRange === 'last6months' ? 'Last 6 Months' : 'Last Year'})
                        </h4>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={enhancedRevenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'revenue' || name === 'target') {
                                  return [`$${value}`, name === 'revenue' ? 'Actual Revenue' : 'Target'];
                                }
                                return [value, name];
                              }}
                            />
                            <Bar dataKey="revenue" fill="#10b981" name="Actual Revenue" />
                            <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Performance Table */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {enhancedRevenueData.map((item: RevenueDataItem, index: number) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.revenue?.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.target?.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${item.performance >= 100 ? 'bg-green-500' : item.performance >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                          style={{ width: `${Math.min(item.performance, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="ml-2 text-sm font-medium">{item.performance.toFixed(1)}%</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedReport === 'customer' && customerAnalytics && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Breakdown</h4>
                        <div className="space-y-4">
                          {customerData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-gray-700">{item.type}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{item.count}</span>
                                <span className="text-sm text-gray-500">({item.percentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-green-600 mb-2">{customerAnalytics.satisfaction}</div>
                          <div className="text-gray-600">Average Rating</div>
                          <div className="mt-4 text-sm text-gray-500">Based on {customerAnalytics.reviews} reviews</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;