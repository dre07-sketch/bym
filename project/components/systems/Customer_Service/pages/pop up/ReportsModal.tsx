import React, { useState } from 'react';
import { X, BarChart2, Download, Calendar, Filter, TrendingUp, Users, Ticket, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');

  const reportTypes = [
    { id: 'overview', name: 'Overview', icon: BarChart2 },
    { id: 'tickets', name: 'Ticket Analytics', icon: Ticket },
    { id: 'revenue', name: 'Revenue Report', icon: DollarSign },
    { id: 'customer', name: 'Customer Analytics', icon: Users },
  ];

  const overviewData = [
    { name: 'Week 1', tickets: 45, revenue: 12500, customers: 32 },
    { name: 'Week 2', tickets: 52, revenue: 15200, customers: 38 },
    { name: 'Week 3', tickets: 48, revenue: 13800, customers: 35 },
    { name: 'Week 4', tickets: 61, revenue: 18900, customers: 42 },
  ];

  const ticketStatusData = [
    { name: 'Completed', value: 156, color: '#10b981' },
    { name: 'In Progress', value: 24, color: '#f59e0b' },
    { name: 'Pending', value: 12, color: '#3b82f6' },
    { name: 'Cancelled', value: 8, color: '#ef4444' },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 50000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: 61000, target: 55000 },
    { month: 'May', revenue: 58000, target: 55000 },
    { month: 'Jun', revenue: 67000, target: 60000 },
  ];

  const customerData = [
    { type: 'New Customers', count: 45, percentage: 23 },
    { type: 'Returning Customers', count: 156, percentage: 77 },
  ];

  const handleExport = (reportType: string) => {
    console.log(`Exporting ${reportType} report for ${dateRange}`);
    // Simulate export functionality
    alert(`${reportType} report exported successfully!`);
  };

  if (!isOpen) return null;

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
              {selectedReport === 'overview' && (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Total Tickets</p>
                          <p className="text-2xl font-bold text-blue-900">206</p>
                        </div>
                        <Ticket className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+12% vs last month</span>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Revenue</p>
                          <p className="text-2xl font-bold text-green-900">$60,400</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+18% vs last month</span>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Customers</p>
                          <p className="text-2xl font-bold text-purple-900">147</p>
                        </div>
                        <Users className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+8% vs last month</span>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600">Avg Response</p>
                          <p className="text-2xl font-bold text-orange-900">12m</p>
                        </div>
                        <BarChart2 className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">-3m vs last month</span>
                      </div>
                    </div>
                  </div>

                  {/* Overview Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={overviewData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="tickets" fill="#3b82f6" name="Tickets" />
                        <Bar dataKey="customers" fill="#10b981" name="Customers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {selectedReport === 'tickets' && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status Distribution</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={ticketStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {ticketStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Ticket Trends</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={overviewData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {selectedReport === 'revenue' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Target</h4>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, '']} />
                      <Bar dataKey="revenue" fill="#10b981" name="Actual Revenue" />
                      <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {selectedReport === 'customer' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Breakdown</h4>
                    <div className="space-y-4">
                      {customerData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700">{item.type}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{item.count}</span>
                            <span className="text-sm text-gray-500">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction</h4>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">4.8</div>
                      <div className="text-gray-600">Average Rating</div>
                      <div className="mt-4 text-sm text-gray-500">Based on 156 reviews</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;