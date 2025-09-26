import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  RefreshCw,
  Filter,
  Download,
  Bell,
  TrendingUp,
  CheckCircle,
  Eye,
  BarChart3
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  status: 'critical' | 'low' | 'normal' | 'overstocked';
  lastRestocked: string;
  supplier: string;
  velocity: number;
}

const StockLevels: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [animatedCards, setAnimatedCards] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from backend
  useEffect(() => {
    const fetchStockLevels = async () => {
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/items');
        if (!response.ok) throw new Error('Failed to fetch inventory data');
        const result = await response.json();

        // Map and transform backend data to StockItem
        const mappedItems: StockItem[] = result.data.map((item: any) => {
          const velocity = 0.5; // Mock value or calculate if needed
          const lastRestocked = item.lastUpdated?.split('T')[0] || '2024-01-01';

          // Set maxStock as 2x minStock (you can adjust logic)
          const maxStock = item.maxStock || Math.max(50, item.minStock * 2);
          // Reorder point = 1.5x minStock
          const reorderPoint = Math.ceil(item.minStock * 1.5);

          // Determine status
          let status: StockItem['status'] = 'normal';
          if (item.quantity === 0) {
            status = 'critical';
          } else if (item.quantity <= item.minStock) {
            status = 'low';
          } else if (item.quantity > maxStock) {
            status = 'overstocked';
          }

          return {
            id: item.id.toString(),
            name: item.name,
            sku: item.sku,
            category: item.category,
            currentStock: item.quantity,
            minStock: item.minStock,
            maxStock,
            reorderPoint,
            status,
            lastRestocked,
            supplier: item.supplier || 'Unknown',
            velocity
          };
        });

        setStockItems(mappedItems);
      } catch (err: any) {
        console.error('Error fetching stock levels:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockLevels();
  }, []);

  // Trigger animation after render
  useEffect(() => {
    setAnimatedCards(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overstocked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <TrendingDown className="w-4 h-4" />;
      case 'normal':
        return <CheckCircle className="w-4 h-4" />;
      case 'overstocked':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'low':
        return 'bg-yellow-500';
      case 'normal':
        return 'bg-green-500';
      case 'overstocked':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    const fetchStockLevels = async () => {
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/items');
        if (!response.ok) throw new Error('Failed to fetch inventory data');
        const result = await response.json();

        const mappedItems: StockItem[] = result.data.map((item: any) => {
          const velocity = 0.5;
          const lastRestocked = item.lastUpdated?.split('T')[0] || '2024-01-01';
          const maxStock = item.maxStock || Math.max(50, item.minStock * 2);
          const reorderPoint = Math.ceil(item.minStock * 1.5);

          let status: StockItem['status'] = 'normal';
          if (item.quantity === 0) {
            status = 'critical';
          } else if (item.quantity <= item.minStock) {
            status = 'low';
          } else if (item.quantity > maxStock) {
            status = 'overstocked';
          }

          return {
            id: item.id.toString(),
            name: item.name,
            sku: item.sku,
            category: item.category,
            currentStock: item.quantity,
            minStock: item.minStock,
            maxStock,
            reorderPoint,
            status,
            lastRestocked,
            supplier: item.supplier || 'Unknown',
            velocity
          };
        });

        setStockItems(mappedItems);
      } catch (err: any) {
        console.error('Error refreshing stock levels:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockLevels();
  };

  const filteredItems = stockItems.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const statusCounts = {
    critical: stockItems.filter(item => item.status === 'critical').length,
    low: stockItems.filter(item => item.status === 'low').length,
    normal: stockItems.filter(item => item.status === 'normal').length,
    overstocked: stockItems.filter(item => item.status === 'overstocked').length
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading stock levels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>❌ Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Stock Level Monitoring
          </h2>
          <p className="text-gray-600 mt-2">Monitor stock levels and receive intelligent alerts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className={`flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 ${
              isLoading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Critical Stock', value: statusCounts.critical, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
          { title: 'Low Stock', value: statusCounts.low, icon: TrendingDown, color: 'from-yellow-500 to-yellow-600' },
          { title: 'Normal Stock', value: statusCounts.normal, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { title: 'Overstocked', value: statusCounts.overstocked, icon: TrendingUp, color: 'from-blue-500 to-blue-600' }
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
              animatedCards ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-white/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filter by status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'critical', 'low', 'normal', 'overstocked'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filterStatus === status
                    ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Items' : status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 px-2 py-1 bg-white rounded-full text-xs font-bold">
                    {statusCounts[status as keyof typeof statusCounts]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Stock Level Analysis</h3>
            </div>
            <span className="text-sm text-gray-500">
              Monitoring {filteredItems.length} items
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-500">SKU: {item.sku} • {item.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm border font-medium ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="capitalize">{item.status}</span>
                  </span>
                  {(item.status === 'critical' || item.status === 'low') && (
                    <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors animate-pulse">
                      <Bell className="w-4 h-4" />
                    </button>
                  )}
                  <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-100 rounded-lg transition-all duration-200">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{item.currentStock}</p>
                  <p className="text-xs text-gray-500 mt-1">Velocity: {item.velocity.toFixed(1)}/day</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Stock Range</p>
                  <p className="text-sm text-gray-900 font-medium">Min: {item.minStock} • Max: {item.maxStock}</p>
                  <p className="text-sm text-blue-600 font-medium">Reorder: {item.reorderPoint}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Restocked</p>
                  <p className="text-sm text-gray-900 font-medium">{item.lastRestocked}</p>
                  <p className="text-sm text-gray-500">{item.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Stock Health</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(item.status)}`}
                        style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {getStockPercentage(item.currentStock, item.maxStock).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Stock Level Progress</span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.currentStock} / {item.maxStock}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(item.status)}`}
                    style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                  ></div>
                  {/* Reorder point indicator */}
                  <div
                    className="absolute top-0 w-1 h-3 bg-blue-600 rounded"
                    style={{ left: `${(item.reorderPoint / item.maxStock) * 100}%` }}
                    title={`Reorder Point: ${item.reorderPoint}`}
                  ></div>
                  {/* Min stock indicator */}
                  <div
                    className="absolute top-0 w-1 h-3 bg-red-600 rounded"
                    style={{ left: `${(item.minStock / item.maxStock) * 100}%` }}
                    title={`Minimum Stock: ${item.minStock}`}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">0</span>
                  <span className="text-xs text-red-600">Min: {item.minStock}</span>
                  <span className="text-xs text-blue-600">Reorder: {item.reorderPoint}</span>
                  <span className="text-xs text-gray-400">Max: {item.maxStock}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockLevels;