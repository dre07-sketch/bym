import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Calendar, 
  User, 
  Package, 
  FileText,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  HardHat,
  Wrench
} from 'lucide-react';

interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'adjustment';
  itemName: string;
  sku: string;
  quantity: number;
  reason: string;
  reference?: string;
  user: string;
  date: string;
  supplier?: string;
  jobCard?: string;
  client?: string;
  clientType?: 'individual' | 'business';
  notes?: string;
}

const StockMovements: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real stock history from backend
  useEffect(() => {
    const fetchStockHistory = async () => {
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/stock-history');
        if (!response.ok) throw new Error('Failed to fetch stock history');
        const result = await response.json();

        // Map backend data to frontend structure
        const mappedMovements: StockMovement[] = result.data.map((item: any) => ({
          id: item.id.toString(),
          type: item.type === 'IN' ? 'in' : 'out', // Simplified (we'll add adjustments later)
          itemName: item.itemName,
          sku: item.sku || 'N/A',
          quantity: item.quantity,
          reason: item.reference ? 'Purchase Order' : 'Manual Adjustment',
          reference: item.reference || undefined,
          user: item.user || 'System',
          date: item.transactionDate || item.createdAt,
          supplier: item.reference?.startsWith('PO') ? 'AutoParts Pro' : undefined,
          notes: item.notes || undefined
        }));

        setMovements(mappedMovements);
      } catch (err: any) {
        console.error('Error fetching stock history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockHistory();
  }, []);

  const getMovementIcon = (type: string, quantity: number) => {
    if (type === 'adjustment') {
      return quantity > 0 ? (
        <Plus className="w-4 h-4 text-green-600" />
      ) : (
        <Minus className="w-4 h-4 text-red-600" />
      );
    }
    return type === 'in' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getMovementColor = (type: string, quantity: number) => {
    if (type === 'adjustment') {
      return quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    return type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getQuantityDisplay = (type: string, quantity: number) => {
    if (type === 'adjustment') {
      return quantity > 0 ? `+${quantity}` : quantity.toString();
    }
    return type === 'in' ? `+${quantity}` : `-${quantity}`;
  };

  const getClientIcon = (clientType?: string) => {
    switch (clientType) {
      case 'individual':
      return <User className="w-4 h-4 text-blue-500" />;
      case 'business':
        return <HardHat className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const filteredMovements = movements.filter((movement) => {
    if (activeTab === 'all') return true;
    return movement.type === activeTab;
  });

  const toggleRowExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading stock movements...</p>
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
    <div className="p-4 md:p-6 space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Movements</h2>
          <p className="text-gray-600 text-sm sm:text-base">Track all stock in, out, and adjustments</p>
        </div>
        <div className="flex space-x-2 sm:space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Record Movement</span>
          </button>
          <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-600">Stock In Today</p>
              <p className="text-xl sm:text-3xl font-bold text-green-700 mt-1 sm:mt-2">
                {movements
                  .filter(m => m.type === 'in' && new Date(m.date).toDateString() === new Date().toDateString())
                  .reduce((sum, m) => sum + m.quantity, 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">items received</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-600">Stock Out Today</p>
              <p className="text-xl sm:text-3xl font-bold text-red-700 mt-1 sm:mt-2">
                {movements
                  .filter(m => m.type === 'out' && new Date(m.date).toDateString() === new Date().toDateString())
                  .reduce((sum, m) => sum + m.quantity, 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">items used/sold</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-600">Total Movements</p>
              <p className="text-xl sm:text-3xl font-bold text-blue-700 mt-1 sm:mt-2">{movements.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">records logged</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 sm:space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'in', label: 'Stock In' },
              { id: 'out', label: 'Stock Out' },
              { id: 'adjustment', label: 'Adjustments' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex space-x-2 sm:space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Movements List */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Item</th>
                <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Type</th>
                <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Quantity</th>
                <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Date</th>
                <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <React.Fragment key={movement.id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpand(movement.id)}
                    >
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {movement.itemName}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">{movement.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${getMovementColor(
                            movement.type,
                            movement.quantity
                          )}`}
                        >
                          {getMovementIcon(movement.type, movement.quantity)}
                          <span className="capitalize">
                            {movement.type === 'in'
                              ? 'In'
                              : movement.type === 'out'
                              ? 'Out'
                              : 'Adjust'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <span
                          className={`text-sm sm:text-base font-bold ${
                            movement.type === 'in' || (movement.type === 'adjustment' && movement.quantity > 0)
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {getQuantityDisplay(movement.type, movement.quantity)}
                        </span>
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-900">
                              {new Date(movement.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(movement.date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 sm:p-2 hover:bg-blue-100 rounded-lg transition-all duration-200">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(movement.id);
                            }}
                          >
                            {expandedRow === movement.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === movement.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-4 sm:px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium">Reason</p>
                              <p className="font-medium">{movement.reason}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">Reference</p>
                              {movement.reference && (
                                <p className="font-medium text-blue-600">{movement.reference}</p>
                              )}
                              {movement.jobCard && (
                                <p className="font-medium text-purple-600">{movement.jobCard}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">User</p>
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <p className="font-medium">{movement.user}</p>
                              </div>
                            </div>
                            {movement.client && (
                              <div>
                                <p className="text-gray-500 font-medium">Client Used For</p>
                                <div className="flex items-center space-x-2">
                                  {getClientIcon(movement.clientType)}
                                  <p className="font-medium">{movement.client}</p>
                                </div>
                              </div>
                            )}
                            {movement.supplier && (
                              <div>
                                <p className="text-gray-500 font-medium">Supplier</p>
                                <p className="font-medium">{movement.supplier}</p>
                              </div>
                            )}
                            {movement.notes && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <p className="text-gray-500 font-medium">Notes</p>
                                <p className="font-medium text-gray-700">{movement.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Movement Modal (Placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Record Stock Movement</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <p className="text-center text-gray-600 py-6">
                Stock Out and adjustments will be available in the next update.
              </p>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end space-x-3 sm:space-x-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base">
                Record Movement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMovements;