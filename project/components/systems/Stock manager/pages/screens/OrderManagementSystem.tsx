import { useState, useEffect } from 'react';
// Define interfaces (unchanged)
interface OrderedPart {
  id: number;
  item_id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  quantity: number;
  status: 'pending' | 'given';
  ordered_at: string;
}
interface Order {
  ticket_id: number;
  ticket_number: string;
  customer_type: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: number;
  vehicle_info: string;
  license_plate: string;
  title: string;
  mechanic_assign?: string;
  inspector_assign?: string;
  description: string;
  priority: string;
  type: 'sos' | 'regular' | 'appointment' | 'service';
  urgency_level?: string;
  status: 'pending' | 'assigned' | 'in progress' | 'ready' | 'completed';
  appointment_id?: string;
  created_at: string;
  updated_at: string;
  completion_date?: string;
  estimated_completion_date?: string;
  ordered_parts: OrderedPart[];
}

const OrderManagementSystem = () => {
  // State variables
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Normalize orders data
const normalizeOrders = (orders: Order[]) =>
  orders.map(order => ({
    ...order,
    ordered_parts: order.ordered_parts.map(part => ({
      ...part,
      price: typeof part.price === 'number' ? part.price : Number(part.price) || 0,
    })),
  }));

  // Fetch active orders
  const fetchActiveOrders = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/inventory/ordered-parts');
    if (!response.ok) throw new Error('Failed to fetch active orders');
    const data: Order[] = await response.json();
    const normalized = normalizeOrders(data);

    // Filter: Keep only orders where **at least one part is still 'pending'**
    const filteredActiveOrders = normalized.filter(order => {
      // If there are no parts, keep it in active (can't be complete)
      if (order.ordered_parts.length === 0) return true;

      // Otherwise: keep only if at least one part is *not* "given"
      return order.ordered_parts.some(part => part.status === 'pending');
    });

    setOrders(filteredActiveOrders);
    return filteredActiveOrders;
  } catch (err) {
    console.error('Error loading active orders:', err);
    throw err;
  }
};

  // Fetch history orders
const fetchHistoryOrders = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/inventory/order-history');
    if (!response.ok) throw new Error('Failed to fetch history orders');
    const data: Order[] = await response.json();
    const normalized = normalizeOrders(data);

    console.log('Raw history data:', data); // 🔍 CHECK THIS

    const filtered = normalized.filter(order =>
      order.ordered_parts.length > 0 &&
      order.ordered_parts.every(part => part.status === 'given')
    );

    console.log('After filter:', filtered); // 🔍 Did it get filtered out?

    setHistoryOrders(filtered);
    return filtered;
  } catch (err) {
    console.error('Error loading history orders:', err);
    throw err;
  }
};

  // Fetch all orders on mount
  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchActiveOrders(), fetchHistoryOrders()]);
      } catch (err) {
        showNotification('Failed to load orders. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllOrders();
  }, []);

  // Filter orders based on search and status
  useEffect(() => {
    let result = activeTab === 'active' ? [...orders] : [...historyOrders];
    
    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [orders, historyOrders, searchTerm, statusFilter, activeTab]);

  // Open modal with selected order
  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Assign order to mechanic


  // Show notification
  const showNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-indigo-100 text-indigo-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Update part status and check if order should be completed
  const updatePartStatus = async (partId: number, newStatus: 'pending' | 'given') => {
    if (!selectedOrder) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/inventory/ordered-parts/${partId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update part status');
      
      // Update the part in the selected order
      const updatedParts = selectedOrder.ordered_parts.map(part => 
        part.id === partId ? { ...part, status: newStatus } : part
      );
      
      // Check if all parts are now "given"
      const allPartsGiven = updatedParts.every(part => part.status === 'given');
      
      // Update the order status if all parts are given
      let updatedOrder = { ...selectedOrder, ordered_parts: updatedParts };
      let orderMovedToHistory = false;
      
      if (allPartsGiven) {
        try {
          // Update order status to completed in the database
          const orderResponse = await fetch(`/api/service-tickets/${selectedOrder.ticket_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'completed',
              completion_date: new Date().toISOString()
            }),
          });
          
          if (orderResponse.ok) {
            updatedOrder = { ...updatedOrder, status: 'completed', completion_date: new Date().toISOString() };
            orderMovedToHistory = true;
            showNotification('All parts have been given! Order moved to history.');
            
            // Refresh both active and history lists
            await Promise.all([fetchActiveOrders(), fetchHistoryOrders()]);
          }
        } catch (err) {
          console.error('Error updating order status:', err);
        }
      }
      
      // Update the selected order state
      setSelectedOrder(updatedOrder);
      
      if (!orderMovedToHistory) {
        showNotification(`Part status updated to "${newStatus}"`);
      }
    } catch (err) {
      console.error('Error updating part status:', err);
      showNotification('Failed to update part status. Please try again.');
    }
  };

  // Refresh data when switching tabs
  useEffect(() => {
    if (activeTab === 'active') {
      fetchActiveOrders();
    } else {
      fetchHistoryOrders();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading orders...</p>
      </div>
    );
  }

  // The rest of the component remains the same as before
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-indigo-600 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Service Order Management</h1>
              <p className="text-gray-600">Track and manage all service orders with parts</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Today:</span>
            <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'active'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active Orders
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'history'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Order History
        </button>
      </div>

      {/* Stats Overview - Only show for active orders */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="rounded-full bg-indigo-100 p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Assigned</p>
                <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'assigned').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-2xl font-bold text-gray-800">{historyOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by ticket, customer, or vehicle..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            {activeTab === 'active' && (
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in progress">In Progress</option>
                <option value="ready">Ready</option>
              </select>
            )}
           
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parts</th>
                {activeTab === 'history' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.ticket_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openOrderModal(order)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">{order.ticket_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.vehicle_info}</div>
                      <div className="text-sm text-gray-500">{order.license_plate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{order.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.ordered_parts.length > 0 ? (
                        <span className={activeTab === 'history' ? "text-green-600 font-medium" : "text-green-600 font-medium"}>
                          {order.ordered_parts.length} Part(s)
                        </span>
                      ) : (
                        <span className="text-gray-400">No parts</span>
                      )}
                    </td>
                    {activeTab === 'history' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.completion_date ? new Date(order.completion_date).toLocaleDateString() : 'N/A'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderModal(order);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === 'history' ? 9 : 8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No {activeTab === 'history' ? 'completed' : 'active'} orders found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 transform transition-all duration-300 scale-95 animate-scaleIn">
            {/* Modal Header with Gradient Background */}
            <div className={`p-6 rounded-t-2xl relative ${
              selectedOrder.status === 'completed' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-700' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-700'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Order Details</h2>
                  <p className="text-indigo-200 mt-1">Ticket #{selectedOrder.ticket_number}</p>
                </div>
                <button 
                  onClick={closeModal} 
                  className="text-white hover:text-indigo-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Status Badge in Header */}
              <div className="absolute top-6 right-16">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)} shadow-md`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Information Card */}
                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-800 text-lg">{selectedOrder.customer_name}</p>
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm font-medium mr-2">ID:</span>
                      <span className="text-sm">{selectedOrder.customer_id}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm font-medium mr-2">Type:</span>
                      <span className="text-sm">{selectedOrder.customer_type}</span>
                    </div>
                  </div>
                </div>
                
                {/* Vehicle Information Card */}
                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vehicle Information
                  </h3>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-800 text-lg">{selectedOrder.vehicle_info}</p>
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm font-medium mr-2">ID:</span>
                      <span className="text-sm">{selectedOrder.vehicle_id}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm font-medium mr-2">License:</span>
                      <span className="text-sm">{selectedOrder.license_plate}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Service Details Card */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Service Details
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-800 font-medium text-lg">{selectedOrder.title}</p>
                  <p className="text-gray-700">{selectedOrder.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedOrder.priority)}`}>
                      Priority: {selectedOrder.priority}
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                      Type: {selectedOrder.type}
                    </span>
                    {selectedOrder.urgency_level && (
                      <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                        Urgency: {selectedOrder.urgency_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Ordered Parts Section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Ordered Parts
                </h3>
                {selectedOrder.ordered_parts.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.ordered_parts.map((part) => (
                          <tr key={part.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{part.sku}</td>
                            <td className="px-4 py-3 text-sm">{part.quantity}</td>
                            <td className="px-4 py-3 text-sm font-medium">${part.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm">
                              <select
                                value={part.status}
                                onChange={(e) => updatePartStatus(part.id, e.target.value as 'pending' | 'given')}
                                disabled={selectedOrder.status === 'completed'}
                                className={`text-xs px-3 py-1.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                  part.status === 'pending' 
                                    ? 'bg-yellow-50 border-yellow-300 text-yellow-800' 
                                    : 'bg-green-50 border-green-300 text-green-800'
                                } ${selectedOrder.status === 'completed' ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="given">Given</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(part.ordered_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="mt-4 text-gray-500">No parts have been ordered for this service.</p>
                  </div>
                )}
              </div>
              
              {/* Assignment and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Assignment Card */}
                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Assignment
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-24">Mechanic:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedOrder.mechanic_assign || (
                          <span className="text-gray-500 italic">Not assigned</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-24">Inspector:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedOrder.inspector_assign || (
                          <span className="text-gray-500 italic">Not assigned</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Dates Card */}
                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Dates
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-32">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-32">Est. Completion:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedOrder.estimated_completion_date 
                          ? new Date(selectedOrder.estimated_completion_date).toLocaleDateString() 
                          : <span className="text-gray-500 italic">Not set</span>
                        }
                      </span>
                    </div>
                    {selectedOrder.completion_date && (
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 w-32">Completed:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedOrder.completion_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${
                    selectedOrder.status === 'pending' ? 'bg-yellow-500' :
                    selectedOrder.status === 'assigned' ? 'bg-blue-500' :
                    selectedOrder.status === 'in progress' ? 'bg-indigo-500' :
                    selectedOrder.status === 'ready' ? 'bg-purple-500' : 'bg-green-500'
                  }`}></span>
                  <span className="text-sm font-medium text-gray-700">Status: <span className="font-semibold">{selectedOrder.status}</span></span>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 flex items-center animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Add custom animations to global styles */}
      <style jsx global>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OrderManagementSystem;
