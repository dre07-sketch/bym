'use client';
import React, { useState, useEffect } from 'react';
// Icons
import {
  Package,
  Search,
  Clock,
  AlertTriangle,
  Truck,
  CheckCircle,
  X,
  TrendingUp,
  Loader,
  Tag,
  Calendar,
  RefreshCw,
  Plus,
  ChevronDown,
  Edit,
} from 'lucide-react';
// === Types ===
type OutsourceStockStatus = 'awaiting_request' | 'requested' | 'received' | 'cancelled';
interface OutsourceStock {
  id: string;
  itemName: string;
  category: string;
  sku: string;
  quantity: number;
  supplier: string;
  unitPrice: string;
  totalAmount: string;
  status: OutsourceStockStatus;
  requestedAt: string;
  expectedDelivery: string;
}
// === Status Mapping ===
const statusLabels: Record<OutsourceStockStatus, string> = {
  'awaiting_request': 'Awaiting Request',
  'requested': 'Requested',
  'received': 'Received',
  'cancelled': 'Cancelled',
};
const getStatusIcon = (status: OutsourceStockStatus) => {
  switch (status) {
    case 'awaiting_request':
      return <Clock className="w-4 h-4 text-white" />;
    case 'requested':
      return <AlertTriangle className="w-4 h-4 text-white" />; 
    case 'received':
      return <CheckCircle className="w-4 h-4 text-white" />;
    case 'cancelled':
      return <X className="w-4 h-4 text-white" />;
  }
};
const getStatusColor = (status: OutsourceStockStatus) => {
  switch (status) {
    case 'awaiting_request':
      return 'from-blue-400 to-blue-600';
    case 'requested':
      return 'from-yellow-400 to-yellow-600';
    case 'received':
      return 'from-green-400 to-green-600';
    case 'cancelled':
      return 'from-red-400 to-red-600';
  }
};
// === Main Component ===
const OutsourceStocksPage = () => {
  const [stocks, setStocks] = useState<OutsourceStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // New state for price update modal
  const [selectedItem, setSelectedItem] = useState<OutsourceStock | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [updatingPrice, setUpdatingPrice] = useState<boolean>(false);
  
  // Fetch data from backend
  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      setError(null);
      const API_BASE = 'https://ipasystem.bymsystem.com';
      try {
        const response = await fetch(`${API_BASE}/api/communication-center/outsource-stock`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'API request failed');
        }
        if (!Array.isArray(result.data)) {
          throw new Error('Invalid data format: expected array');
        }
        const mapped = result.data.map((item: any): OutsourceStock => {
          const price = parseFloat(item.price);
          const unitPrice = isNaN(price) ? '0.00' : price.toFixed(2);
          const totalAmount = isNaN(price) ? '0.00' : (price * item.quantity).toFixed(2);
          const requestedDate = new Date(item.requested_at);
          const expectedDate = new Date(requestedDate);
          expectedDate.setDate(expectedDate.getDate() + 7);
          const expectedDelivery = expectedDate.toISOString().split('T')[0];
          const status: OutsourceStockStatus = 
            ['awaiting_request', 'requested', 'in-transit', 'received', 'cancelled'].includes(item.status)
              ? item.status
              : 'awaiting_request';
          return {
            id: item.id.toString(),
            itemName: item.name,
            category: item.category,
            sku: item.sku,
            quantity: item.quantity,
            supplier: item.source_shop,
            unitPrice: `$${unitPrice}`,
            totalAmount: `$${totalAmount}`,
            status,
            requestedAt: item.requested_at,
            expectedDelivery,
          };
        });
        setStocks(mapped);
      } catch (err: any) {
        console.error('Fetch outsource stock error:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, []);
  
  // Compute stats
  const stats = {
    total: stocks.length,
    awaiting: stocks.filter(s => s.status === 'awaiting_request').length,
    requested: stocks.filter(s => s.status === 'requested').length,
    received: stocks.filter(s => s.status === 'received').length,
    cancelled: stocks.filter(s => s.status === 'cancelled').length,
  };
  
  // Filtered list
  const filteredStocks = stocks.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  
  // Handle status change
  const handleStatusChange = async (id: string, newStatus: OutsourceStockStatus) => {
    // Optimistic UI update
    setStocks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/communication-center/outsource-stock/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        let errorMsg = 'Failed to update status';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // If JSON parse fails, keep default message
        }
        throw new Error(errorMsg);
      }
      const result = await response.json();
      console.log('✅ Status updated:', result);
    } catch (err) {
      // Type check for 'unknown'
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
          ? err 
          : 'An unknown error occurred';
      console.error('❌ Failed to update status:', errorMessage);
      alert(`Could not save status to server: ${errorMessage}`);
      // Optional: rollback UI
      setStocks((prev) =>
        prev.map((item) =>
          item.id === id
            ? stocks.find(s => s.id === id) || item
            : item
        )
      );
    }
  };
  
  // Open price update modal
  const openPriceModal = (item: OutsourceStock) => {
    setSelectedItem(item);
    // Pre-fill with current price without the dollar sign
    setNewPrice(item.unitPrice.replace('$', ''));
  };
  
  // Close price update modal
  const closePriceModal = () => {
    setSelectedItem(null);
    setNewPrice('');
  };
  
  // Handle price update
  const handlePriceUpdate = async () => {
    if (!selectedItem || !newPrice) return;
    
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue)) {
      alert('Please enter a valid price');
      return;
    }
    
    setUpdatingPrice(true);
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/communication-center/update-price/${selectedItem.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: priceValue }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update price');
      }
      
      const result = await response.json();
      if (result.success) {
        // Update the local state with the new price and calculated total
        setStocks(prevStocks => 
          prevStocks.map(item => {
            if (item.id === selectedItem.id) {
              const updatedItem = { ...item };
              updatedItem.unitPrice = `$${priceValue.toFixed(2)}`;
              // Recalculate total amount
              const totalAmount = priceValue * item.quantity;
              updatedItem.totalAmount = `$${totalAmount.toFixed(2)}`;
              return updatedItem;
            }
            return item;
          })
        );
        closePriceModal();
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (err) {
      console.error('Error updating price:', err);
      alert(`Could not update price: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdatingPrice(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-blue-100/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Outsource Stock Requests</h1>
              <p className="mt-2 text-gray-600">Manage external inventory purchases and track deliveries</p>
            </div>
            <div className="flex gap-3">
             
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-lg border border-blue-100/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white text-gray-900 font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-blue-100/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.awaiting}</div>
                <div className="text-sm text-gray-600 mt-1">Awaiting Request</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-blue-100/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.requested}</div>
                <div className="text-sm text-gray-600 mt-1">Requested</div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-blue-100/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.received}</div>
                <div className="text-sm text-gray-600 mt-1">Received</div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-blue-100/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.cancelled}</div>
                <div className="text-sm text-gray-600 mt-1">Cancelled</div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-blue-100/30 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, category, supplier, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full bg-white/70 border border-blue-100/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-white/70 border border-blue-100/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                >
                  <option value="all" className="bg-white">All Status</option>
                  <option value="awaiting_request" className="bg-white">Awaiting Request</option>
                  <option value="requested" className="bg-white">Requested</option>
                  <option value="received" className="bg-white">Received</option>
                  <option value="cancelled" className="bg-white">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Stock List */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100/30 overflow-hidden">
          <div className="px-6 py-5 border-b border-blue-100/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Stock Requests</h2>
                <p className="text-gray-600 text-sm mt-1">Manage and track all your external inventory requests</p>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredStocks.length} of {stocks.length} items
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-lg rounded-full mb-4">
                <Loader className="w-8 h-8 animate-spin text-gray-600" />
              </div>
              <p className="text-gray-900 font-medium">Loading data from server...</p>
              <p className="text-gray-600 text-sm mt-2">This might take a few moments</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 backdrop-blur-lg rounded-full mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Data</h3>
              <p className="text-gray-600 max-w-md mx-auto">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-lg rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Matching Stock Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-blue-100/20">
              {filteredStocks.map((item) => (
                <div key={item.id} className="p-6 hover:bg-blue-50/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{item.itemName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-600">SKU:</span>
                          <span className="text-sm text-gray-900">{item.sku}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Supplier:</span>
                          <span className="text-sm text-gray-900">{item.supplier}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-600">Quantity:</span>
                          <span className="text-sm text-gray-900">{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-600">Unit Price:</span>
                          <span className="text-sm font-bold text-gray-900">{item.unitPrice}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Total:</span>
                          <span className="text-sm font-bold text-gray-900">{item.totalAmount}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-600">Expected:</span>
                          <span className="text-sm text-gray-900">{item.expectedDelivery}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-600">Requested:</span>
                          <span className="text-sm text-gray-900">{new Date(item.requestedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(item.status)} shadow-md`}
                      >
                        {getStatusIcon(item.status)}
                        <span className="text-white">{statusLabels[item.status]}</span>
                      </span>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Price Update Button */}
                        <button
                          onClick={() => openPriceModal(item)}
                          className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Update Price</span>
                        </button>
                        
                        {item.status === 'awaiting_request' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'requested')}
                            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                          >
                            Mark Requested
                          </button>
                        )}
                        {(item.status === 'awaiting_request' || item.status === 'requested') && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'received')}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                          >
                            Mark Received
                          </button>
                        )}
                        {(item.status === 'awaiting_request' || item.status === 'requested') && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'cancelled')}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Price Update Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Update Price</h3>
              <button onClick={closePriceModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{selectedItem.itemName}</h4>
                  <p className="text-sm text-gray-600">{selectedItem.category} • SKU: {selectedItem.sku}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="font-medium text-gray-900">{selectedItem.unitPrice}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium text-gray-900">{selectedItem.quantity}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="price-input" className="block text-sm font-medium text-gray-700 mb-1">
                  New Price ($)
                </label>
                <input
                  id="price-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new price"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">New Total Amount:</span>
                  <span className="font-bold text-gray-900">
                    ${newPrice && !isNaN(parseFloat(newPrice)) 
                      ? (parseFloat(newPrice) * selectedItem.quantity).toFixed(2) 
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={closePriceModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePriceUpdate}
                disabled={updatingPrice}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70"
              >
                {updatingPrice ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Price</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OutsourceStocksPage;