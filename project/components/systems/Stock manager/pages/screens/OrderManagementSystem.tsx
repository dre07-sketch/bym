import { useState, useEffect } from 'react';

// Interfaces (unchanged)
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

  // Helper: Calculate total parts cost
  const calculateTotalPartsCost = (parts: OrderedPart[]) => {
    return parts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  };

  // Fetch active orders
  const fetchActiveOrders = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/inventory/ordered-parts');
      if (!response.ok) throw new Error('Failed to fetch active orders');
      const  any[] = await response.json();

      const ordersMap = new Map<number, Order>();

      data.forEach((item) => {
        if (!ordersMap.has(item.ticket_id)) {
          ordersMap.set(item.ticket_id, {
            ticket_id: item.ticket_id,
            ticket_number: item.ticket_number,
            customer_type: item.customer_type,
            customer_id: item.customer_id,
            customer_name: item.customer_name,
            vehicle_id: item.vehicle_id,
            vehicle_info: item.vehicle_info,
            license_plate: item.license_plate,
            title: item.title,
            mechanic_assign: item.mechanic_assign || undefined,
            inspector_assign: item.inspector_assign || undefined,
            description: item.description,
            priority: item.priority,
            type: item.type,
            urgency_level: item.urgency_level || undefined,
            status: item.status,
            appointment_id: item.appointment_id || undefined,
            created_at: item.created_at,
            updated_at: item.updated_at,
            estimated_completion_date: item.estimated_completion_date || undefined,
            completion_date: item.completion_date || undefined,
            ordered_parts: [],
          });
        }

        const order = ordersMap.get(item.ticket_id)!;
        order.ordered_parts.push({
          id: item.id,
          item_id: item.item_id,
          name: item.name,
          category: item.category,
          sku: item.sku,
          price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price) || 0,
          quantity: item.quantity,
          status: item.status,
          ordered_at: item.ordered_at,
        });
      });

      const result = Array.from(ordersMap.values());
      setOrders(result);
      return result;
    } catch (err) {
      console.error('Error loading active orders:', err);
      throw err;
    }
  };

  // Fetch history orders
  const fetchHistoryOrders = async () => {
    try {
      const response = await fetch('http://localhost:5001/order-history');
      if (!response.ok) throw new Error('Failed to fetch history orders');
      const data = await response.json();

      const ordersMap = new Map<string, Order>();

      data.forEach((row: any) => {
        const ticketNumber = row.ticket_number;

        if (!ordersMap.has(ticketNumber)) {
          ordersMap.set(ticketNumber, {
            ticket_id: row.ticket_id,
            ticket_number: row.ticket_number,
            customer_type: row.customer_type,
            customer_id: row.customer_id,
            customer_name: row.customer_name,
            vehicle_id: row.vehicle_id,
            vehicle_info: row.vehicle_info,
            license_plate: row.license_plate,
            title: row.title,
            mechanic_assign: row.mechanic_assign || undefined,
            inspector_assign: row.inspector_assign || undefined,
            description: row.description,
            priority: row.priority,
            type: row.type,
            urgency_level: row.urgency_level || undefined,
            status: 'completed',
            appointment_id: row.appointment_id || undefined,
            created_at: row.created_at,
            updated_at: row.updated_at,
            estimated_completion_date: row.estimated_completion_date || undefined,
            completion_date: row.completion_date || row.ordered_at,
            ordered_parts: [],
          });
        }

        const order = ordersMap.get(ticketNumber)!;
        order.ordered_parts.push({
          id: row.id,
          item_id: row.item_id,
          name: row.name,
          category: row.category,
          sku: row.sku,
          price: typeof row.price === 'string' ? parseFloat(row.price) : Number(row.price) || 0,
          quantity: row.quantity,
          status: row.status,
          ordered_at: row.ordered_at,
        });
      });

      const groupedOrders = Array.from(ordersMap.values()).map((order) => ({
        ...order,
        completion_date: order.ordered_parts.reduce((latest, p) =>
          new Date(p.ordered_at) > new Date(latest) ? p.ordered_at : latest
        , order.completion_date || order.created_at),
      }));

      setHistoryOrders(groupedOrders);
      return groupedOrders;
    } catch (err) {
      console.error('Error loading history orders:', err);
      throw err;
    }
  };

  // Load all data
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchActiveOrders(), fetchHistoryOrders()]);
      } catch {
        showNotification('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Filter orders
  useEffect(() => {
    let result = activeTab === 'active' ? [...orders] : [...historyOrders];

    if (searchTerm) {
      result = result.filter(
        (o) =>
          o.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [orders, historyOrders, searchTerm, statusFilter, activeTab]);

  // Handlers
  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const showNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Update part status
  const updatePartStatus = async (partId: number, newStatus: 'pending' | 'given') => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`http://localhost:5001/api/inventory/ordered-parts/${partId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update part status');

      const updatedParts = selectedOrder.ordered_parts.map(p =>
        p.id === partId ? { ...p, status: newStatus } : p
      );

      const allGiven = updatedParts.every(p => p.status === 'given');
      const updatedOrder = { ...selectedOrder, ordered_parts: updatedParts };

      if (allGiven && selectedOrder.status !== 'completed') {
        updatedOrder.status = 'completed';
        fetchHistoryOrders(); // Refresh history
        showNotification('Order completed!');
      } else {
        showNotification(`Part status updated to "${newStatus}"`);
      }

      setSelectedOrder(updatedOrder);
    } catch (err) {
      console.error(err);
      showNotification('Update failed. Please try again.');
    }
  };

  // Refetch on tab change
  useEffect(() => {
    if (activeTab === 'active') fetchActiveOrders();
    else fetchHistoryOrders();
  }, [activeTab]);

  // Loading Skeleton
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="mt-4 text-gray-500 text-lg">{message}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Today: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'active'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active Orders
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'history'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Order History
        </button>
      </div>

      {/* Stats */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 mr-4">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 mr-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'assigned').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{historyOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by ticket, customer, or vehicle..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            {activeTab === 'active' && (
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <EmptyState message={`No ${activeTab === 'history' ? 'completed' : 'active'} orders found.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parts</th>
                  {activeTab === 'history' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  )}
                  {activeTab === 'history' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const totalCost = calculateTotalPartsCost(order.ordered_parts);
                  return (
                    <tr key={order.ticket_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openOrderModal(order)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{order.ticket_number}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{order.vehicle_info}</div>
                        <div className="text-xs text-gray-500">{order.license_plate}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{order.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.ordered_parts.length} part(s)
                      </td>
                      {activeTab === 'history' && (
                        <td className="px-6 py-4 text-sm font-medium text-green-700">
                          ${totalCost.toFixed(2)}
                        </td>
                      )}
                      {activeTab === 'history' && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {order.completion_date ? new Date(order.completion_date).toLocaleDateString() : 'N/A'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={(e) => { e.stopPropagation(); openOrderModal(order); }}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal, Notification, Animations — unchanged */}
      {/* (Same as previous version) */}
      {/* ... */}
    </div>
  );
};

export default OrderManagementSystem;