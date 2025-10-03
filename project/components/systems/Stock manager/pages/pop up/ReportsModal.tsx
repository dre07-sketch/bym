import React, { useState, useEffect } from 'react';
import { X, BarChart3, Download, Calendar, Filter, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react';

interface ReportsModalProps {
  onClose: () => void;
}

interface InventoryCategory {
  category: string;
  items: number;
  value: string;
  lowStock: number;
}

interface SalesTrend {
  month: string;
  sales: number;
  orders: number;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryCategory[]>([]);
  const [salesData, setSalesData] = useState<SalesTrend[]>([]);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalValue: '$0.00',
    lowStockItems: 0
  });

  const reportTypes = [
    { id: 'inventory', name: 'Inventory Report', icon: Package },
    { id: 'sales', name: 'Activity Trend', icon: TrendingUp },
    { id: 'financial', name: 'Financial Report', icon: DollarSign },
    { id: 'movement', name: 'Stock Movement', icon: TrendingDown },
  ];

  // Fetch inventory report
  const fetchInventoryReport = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/inventory/report/summary');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      setInventoryData(result.data.summary);
      setInventoryStats({
        totalItems: result.data.totalItems,
        totalValue: result.data.totalValue,
        lowStockItems: result.data.lowStockItems
      });
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
      alert('Failed to load inventory data');
    }
  };

  // Fetch sales/activity trend
  const fetchSalesTrend = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/inventory/report/sales-trend');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      setSalesData(result.data);
    } catch (error) {
      console.error('Failed to fetch sales trend:', error);
      alert('Failed to load trend data');
    }
  };

  // Load data on mount and when report changes
  useEffect(() => {
    if (selectedReport === 'inventory') {
      fetchInventoryReport();
    } else if (selectedReport === 'sales') {
      fetchSalesTrend();
    }
  }, [selectedReport]);

  const handleExport = () => {
    alert(`Exporting ${selectedReport} report for ${dateRange}`);
    // You can implement real export (CSV/PDF) later
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Report Types Sidebar */}
            <div className="lg:w-64 space-y-2">
              <h3 className="font-semibold text-gray-900 mb-4">Report Types</h3>
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                    selectedReport === report.id
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <report.icon className="w-5 h-5" />
                  <span className="font-medium">{report.name}</span>
                </button>
              ))}
            </div>

            {/* Report Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="90days">Last 90 days</option>
                    <option value="1year">Last year</option>
                  </select>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              {/* Inventory Report */}
              {selectedReport === 'inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-blue-600">Total Items</p>
                      <p className="text-2xl font-bold text-blue-900">{inventoryStats.totalItems.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-green-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-900">{inventoryStats.totalValue}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-red-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-red-900">{inventoryStats.lowStockItems}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900">Inventory by Category</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {inventoryData.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                          ) : (
                            inventoryData.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.items}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.value}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      item.lowStock > 10
                                        ? 'bg-red-100 text-red-800'
                                        : item.lowStock > 5
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {item.lowStock}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales/Activity Trend Report */}
              {selectedReport === 'sales' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-green-600">Estimated Sales</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${salesData.reduce((sum, m) => sum + m.sales, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-blue-600">Activity Count</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {salesData.reduce((sum, m) => sum + m.orders, 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-purple-600">Avg. Monthly</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ${Math.round(salesData.reduce((sum, m) => sum + m.sales, 0) / salesData.length || 1)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Monthly Activity Trend</h4>
                    <div className="space-y-4">
                      {salesData.length === 0 ? (
                        <p className="text-center text-gray-500">Loading trend data...</p>
                      ) : (
                        salesData.map((month, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium text-gray-900 w-12">{month.month}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${(month.sales / Math.max(...salesData.map(m => m.sales))) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">${month.sales.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">{month.orders} updates</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder for Financial & Movement */}
              {(selectedReport === 'financial' || selectedReport === 'movement') && (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">This feature is under development</p>
                    <p className="text-sm text-gray-500 mt-2">Will be available in next update</p>
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