import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  Eye,
  RefreshCw
} from 'lucide-react';

// Define types for type safety
interface TopMovingItem {
  itemName: string;
  type: 'restock' | 'sale';
  quantity: number;
}

interface SupplierPerformance {
  supplier: string;
  orders: number;
  onTime: number;
  rating: number;
  totalValue: number;
}

interface StockSummaryData {
  totalItems: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  recentlyAdded: number;
}

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<string>('stock-summary');
  const [dateRange, setDateRange] = useState<string>('last-30-days');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [animatedCards, setAnimatedCards] = useState<boolean>(false);

  // Typed state
  const [stockSummary, setStockSummary] = useState<StockSummaryData>({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    recentlyAdded: 0
  });

  const [movementData, setMovementData] = useState({
    incoming: 0,
    outgoing: 0,
    topItems: [] as TopMovingItem[]
  });

  const [supplierData, setSupplierData] = useState<SupplierPerformance[]>([]);

  // Fetch data when report or date range changes
  useEffect(() => {
    setAnimatedCards(false);
    setIsLoading(true);
    const timer = setTimeout(() => setAnimatedCards(true), 50);
    fetchReportData();
    return () => clearTimeout(timer);
  }, [selectedReport, dateRange]);

  const fetchReportData = async () => {
    try {
      const url = `http://localhost:5001/api/inventory/reports/${selectedReport}?dateRange=${dateRange}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        switch (selectedReport) {
          case 'stock-summary':
            setStockSummary(result.data);
            break;
          case 'movement-analysis':
            setMovementData(result.data);
            break;
          case 'supplier-performance':
            setSupplierData(result.data);
            break;
          default:
            break;
        }
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReportData();
  };

  const reportTypes = [
    { id: 'stock-summary', label: 'Stock Summary', icon: Package, color: 'from-blue-500 to-blue-600' },
    { id: 'stock-valuation', label: 'Stock Valuation', icon: DollarSign, color: 'from-green-500 to-green-600' },
    { id: 'movement-analysis', label: 'Movement Analysis', icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
    { id: 'supplier-performance', label: 'Supplier Performance', icon: Users, color: 'from-orange-500 to-orange-600' },
    { id: 'low-stock-alert', label: 'Low Stock Report', icon: AlertTriangle, color: 'from-red-500 to-red-600' }
  ];

  const renderStockSummaryReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Items', value: stockSummary.totalItems, icon: Package, color: 'from-blue-500 to-blue-600' },
          { title: 'Total Value', value: `$${(stockSummary.totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'from-green-500 to-green-600' },
          { title: 'Low Stock', value: stockSummary.lowStock, icon: TrendingDown, color: 'from-yellow-500 to-yellow-600' },
          { title: 'Out of Stock', value: stockSummary.outOfStock, icon: AlertTriangle, color: 'from-red-500 to-red-600' }
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.color} text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 ${animatedCards ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="w-10 h-10 opacity-80" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Recently Added Items</h3>
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-4xl font-bold text-gray-900">{stockSummary.recentlyAdded}</p>
        <p className="text-gray-600 mt-2">Items added in the last {dateRange.replace('last-', '').replace('-', ' ')}</p>
      </div>
    </div>
  );

  const renderMovementAnalysis = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Incoming Stock</p>
              <p className="text-3xl font-bold">{movementData.incoming}</p>
            </div>
            <TrendingUp className="w-10 h-10 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Outgoing Stock</p>
              <p className="text-3xl font-bold">{movementData.outgoing}</p>
            </div>
            <TrendingDown className="w-10 h-10 opacity-80" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Moving Items</h3>
        <div className="space-y-4">
          {movementData.topItems.length > 0 ? (
            movementData.topItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="font-medium">{item.itemName}</span>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.type === 'restock' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.type === 'restock' ? 'Restock' : 'Sale'}
                  </span>
                  <span className="font-bold">{item.quantity}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No movement data available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSupplierPerformance = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Supplier Performance</h3>
        <Users className="w-6 h-6 text-gray-400" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Supplier</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Orders</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">On Time</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Rating</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Value</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {supplierData.map((supplier, i) => {
              const onTimePercentage = supplier.orders > 0 ? (supplier.onTime / supplier.orders) * 100 : 0;
              return (
                <tr key={i}>
                  <td className="py-4 px-4 font-medium">{supplier.supplier}</td>
                  <td className="py-4 px-4">{supplier.orders}</td>
                  <td className="py-4 px-4">{supplier.onTime}</td>
                  <td className="py-4 px-4">⭐ {supplier.rating.toFixed(1)}</td>
                  <td className="py-4 px-4 font-bold">${supplier.totalValue.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      supplier.rating >= 4.5 && onTimePercentage >= 90
                        ? 'bg-green-100 text-green-800'
                        : supplier.rating >= 4.0 && onTimePercentage >= 80
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.rating >= 4.5 && onTimePercentage >= 90
                        ? '🏆 Excellent'
                        : supplier.rating >= 4.0 && onTimePercentage >= 80
                        ? '👍 Good'
                        : '⚠️ Needs Improvement'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'stock-summary':
        return renderStockSummaryReport();
      case 'movement-analysis':
        return renderMovementAnalysis();
      case 'supplier-performance':
        return renderSupplierPerformance();
      default:
        return renderStockSummaryReport();
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Reports & Analytics</h2>
          <p className="text-gray-600 mt-2">Generate comprehensive insights and reports for your inventory</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-3">
            {reportTypes.map(report => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  selectedReport === report.id
                    ? `bg-gradient-to-r ${report.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <report.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{report.label}</span>
              </button>
            ))}
          </div>
          <div className="flex space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        {renderReportContent()}
      </div>
    </div>
  );
};

export default Reports;