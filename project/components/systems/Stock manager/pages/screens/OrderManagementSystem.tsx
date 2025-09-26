import { useState, useEffect } from 'react';
import { X, Plus, PackagePlus } from 'lucide-react';

// Define interfaces
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
  mechanicName?: string;
  inspector_assign?: string;
  description: string;
  priority: string;
  type: 'sos' | 'regular' | 'appointment' | 'service';
  urgency_level?: string;
  status: string;
  appointment_id?: string;
  created_at: string;
  updated_at: string;
  completion_date?: string;
  estimated_completion_date?: string;
  ordered_parts: OrderedPart[];
}

interface Part {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: string;
  inStock: number;
}

interface OutsourcedPart {
  id: number;
  ticket_number: string;
  name: string;
  category: string;
  sku: string;
  price: number | string;
  quantity: number;
  source_shop: string;
  status: string;
  requested_at: string;
  received_at: string;
  notes: string;
  updated_at: string;
  total_cost: number | string;
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
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'outsourced'>('active');
  
  // New state variables for parts modals
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showOutsourceModal, setShowOutsourceModal] = useState(false);
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [outsourcedParts, setOutsourcedParts] = useState<{id: number, name: string, category: string, quantity: number}[]>([]);
  const [outsourceForm, setOutsourceForm] = useState({ name: '', category: 'Engine Parts', quantity: 1 });
  const [parts, setParts] = useState<Part[]>([]);
  
  // New state for outsourced parts
  const [outsourcedPartsData, setOutsourcedPartsData] = useState<OutsourcedPart[]>([]);
  const [filteredOutsourcedParts, setFilteredOutsourcedParts] = useState<OutsourcedPart[]>([]);
  const [loadingOutsourced, setLoadingOutsourced] = useState(false);
  
  // New state for modal tabs
  const [modalActiveTab, setModalActiveTab] = useState<'ordered' | 'outsourced'>('ordered');
  const [orderOutsourcedParts, setOrderOutsourcedParts] = useState<OutsourcedPart[]>([]);
  const [loadingOrderOutsourced, setLoadingOrderOutsourced] = useState(false);

  // Normalize orders data
  const normalizeOrders = (orders: Order[]) =>
    orders.map(order => ({
      ...order,
      mechanic_assign: order.mechanicName,
      ordered_parts: order.ordered_parts.map(part => ({
        ...part,
        price: typeof part.price === 'number' ? part.price : Number(part.price) || 0,
      })),
    }));

  // Fetch active orders
  const fetchActiveOrders = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/ordered-parts');
      if (!response.ok) throw new Error('Failed to fetch active orders');
      const data: Order[] = await response.json();
      const normalized = normalizeOrders(data);
      
      // Filter: Keep only orders where at least one part is still 'pending'
      const filteredActiveOrders = normalized.filter(order => {
        if (order.ordered_parts.length === 0) return true;
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
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/order-history');
      if (!response.ok) throw new Error('Failed to fetch history orders');
      const data: Order[] = await response.json();
      const normalized = normalizeOrders(data);
      
      setHistoryOrders(normalized);
      return normalized;
    } catch (err) {
      console.error('Error loading history orders:', err);
      throw err;
    }
  };

  // Fetch parts
  const fetchParts = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/active-progress/parts');
      if (!response.ok) throw new Error('Failed to fetch parts');
      const data: Part[] = await response.json();
      setParts(data);
    } catch (err) {
      console.error('Error loading parts:', err);
      showNotification('Failed to load parts. Please try again.');
    }
  };

  // Fetch outsourced parts
  const fetchOutsourcedParts = async (ticketNumbers: string[]) => {
    setLoadingOutsourced(true);
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/outsource-parts-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketNumbers }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch outsourced parts');
      const data = await response.json();
      
      // Normalize the data to ensure price and total_cost are numbers
      const normalizedData = data.data.map((part: any) => ({
        ...part,
        price: typeof part.price === 'number' ? part.price : Number(part.price) || 0,
        total_cost: typeof part.total_cost === 'number' ? part.total_cost : Number(part.total_cost) || 0
      }));
      
      setOutsourcedPartsData(normalizedData);
    } catch (err) {
      console.error('Error loading outsourced parts:', err);
      showNotification('Failed to load outsourced parts. Please try again.');
    } finally {
      setLoadingOutsourced(false);
    }
  };

  // Fetch outsourced parts for a specific order
  const fetchOrderOutsourcedParts = async (ticketNumber: string) => {
    setLoadingOrderOutsourced(true);
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/outsource-parts-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketNumbers: [ticketNumber] }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch outsourced parts');
      const data = await response.json();
      
      // Normalize the data to ensure price and total_cost are numbers
      const normalizedData = data.data.map((part: any) => ({
        ...part,
        price: typeof part.price === 'number' ? part.price : Number(part.price) || 0,
        total_cost: typeof part.total_cost === 'number' ? part.total_cost : Number(part.total_cost) || 0
      }));
      
      setOrderOutsourcedParts(normalizedData);
    } catch (err) {
      console.error('Error loading outsourced parts for order:', err);
      showNotification('Failed to load outsourced parts for this order.');
    } finally {
      setLoadingOrderOutsourced(false);
    }
  };

  // Fetch all orders on mount
  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchActiveOrders(), fetchHistoryOrders(), fetchParts()]);
      } catch (err) {
        showNotification('Failed to load orders. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllOrders();
  }, []);

  // Fetch outsourced parts when tab is active
  useEffect(() => {
    if (activeTab === 'outsourced') {
      // Combine ticket numbers from active and history orders
      const allTicketNumbers = [
        ...orders.map(order => order.ticket_number),
        ...historyOrders.map(order => order.ticket_number)
      ];
      // Remove duplicates
      const uniqueTicketNumbers = Array.from(new Set(allTicketNumbers));
      if (uniqueTicketNumbers.length > 0) {
        fetchOutsourcedParts(uniqueTicketNumbers);
      }
    }
  }, [activeTab, orders, historyOrders]);

  // Filter orders based on search and status
  useEffect(() => {
    if (activeTab === 'outsourced') {
      let result: OutsourcedPart[] = [...outsourcedPartsData];
      if (searchTerm) {
        result = result.filter(
          (part) =>
            part.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        result = result.filter((part) => part.status === statusFilter);
      }
      setFilteredOutsourcedParts(result);
    } else {
      let result: Order[] = activeTab === 'active' ? [...orders] : [...historyOrders];
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
    }
  }, [orders, historyOrders, outsourcedPartsData, searchTerm, statusFilter, activeTab]);

  // Reset status filter when switching tabs
  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

  // Open modal with selected order
  const openOrderModal = async (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setModalActiveTab('ordered'); // Reset to ordered parts tab
    
    // Pre-fetch outsourced parts for this order
    await fetchOrderOutsourcedParts(order.ticket_number);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setOrderOutsourcedParts([]);
  };

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
      case 'ready for inspection': return 'bg-purple-100 text-purple-800';
      case 'awaiting bill': return 'bg-orange-100 text-orange-800';
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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
      const response = await fetch(`https://ipasystem.bymsystem.com/api/inventory/ordered-parts/${partId}/status`, {
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

  // Handlers for parts modals
  const handleSelectPart = (partId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedParts(prev => [...prev, partId]);
      if (!quantities[partId]) {
        setQuantities(prev => ({ ...prev, [partId]: 1 }));
      }
    } else {
      setSelectedParts(prev => prev.filter(id => id !== partId));
    }
  };

  const handleQuantityChange = (partId: number, quantity: number) => {
    setQuantities(prev => ({ ...prev, [partId]: quantity }));
  };

  // Updated handleOrderParts to match the API
  const handleOrderParts = async () => {
    if (!selectedOrder) return;

    try {
      // Transform selected parts to match API format
      const items = selectedParts.map(partId => {
        const part = parts.find(p => p.id === partId);
        if (!part) {
          throw new Error(`Part with ID ${partId} not found`);
        }
        return {
          item_id: part.id.toString(),
          name: part.name,
          category: part.category,
          sku: part.sku,
          price: parseFloat(part.price) || 0,
          quantity: quantities[partId] || 1
        };
      });

      const response = await fetch('https://ipasystem.bymsystem.com/api/active-progress/ordered-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketNumber: selectedOrder.ticket_number, 
          items 
        }),
      });

      if (!response.ok) throw new Error('Failed to order parts');

      setSelectedParts([]);
      setQuantities({});
      setShowPartsModal(false);
      showNotification('Parts ordered successfully');

      // Refresh the order
      const orderResponse = await fetch(`https://ipasystem.bymsystem.com/api/service-tickets/${selectedOrder.ticket_id}`);
      if (orderResponse.ok) {
        const updatedOrder: Order = await orderResponse.json();
        setSelectedOrder(updatedOrder);
      }

    } catch (err) {
      console.error('Error ordering parts:', err);
      showNotification('Failed to order parts. Please try again.');
    }
  };

  const handleOutsourceFormChange = (field: string, value: string | number) => {
    setOutsourceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOutsourceSubmit = () => {
    if (!outsourceForm.name.trim()) return;

    const newPart = {
      id: Date.now(), // temporary id
      name: outsourceForm.name,
      category: outsourceForm.category,
      quantity: outsourceForm.quantity
    };

    setOutsourcedParts(prev => [...prev, newPart]);
    setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
    document.getElementById('part-name-input')?.focus();
  };

  const removeOutsourcedPart = (id: number) => {
    setOutsourcedParts(prev => prev.filter(part => part.id !== id));
  };

  // Updated handleFinalOutsourceSubmit to match the API
  const handleFinalOutsourceSubmit = async () => {
    if (!selectedOrder || outsourcedParts.length === 0) return;

    try {
      // Send each part individually to match the API
      const requests = outsourcedParts.map(part => 
        fetch('https://ipasystem.bymsystem.com/api/active-progress/outsource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_number: selectedOrder.ticket_number,
            name: part.name,
            category: part.category,
            quantity: part.quantity
          })
        })
      );

      const responses = await Promise.all(requests);
      
      // Check if all requests were successful
      const allSuccessful = responses.every(response => response.ok);
      
      if (!allSuccessful) {
        throw new Error('Some parts failed to be outsourced');
      }

      // Parse all responses to verify success status
      const results = await Promise.all(responses.map(r => r.json()));
      const allSuccess = results.every(result => result.success);
      
      if (!allSuccess) {
        const failedResult = results.find(r => !r.success);
        throw new Error(failedResult?.message || 'Some parts failed to be outsourced');
      }

      // Clear state and close modal
      setOutsourcedParts([]);
      setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
      setShowOutsourceModal(false);
      showNotification('All outsourced parts submitted successfully');

      // Refresh the order
      const orderResponse = await fetch(`https://ipasystem.bymsystem.com/api/service-tickets/${selectedOrder.ticket_id}`);
      if (orderResponse.ok) {
        const updatedOrder: Order = await orderResponse.json();
        setSelectedOrder(updatedOrder);
      }

      // Refresh outsourced parts for this order
      await fetchOrderOutsourcedParts(selectedOrder.ticket_number);

    } catch (err) {
      console.error('Error submitting outsourced parts:', err);
      showNotification(`Failed to submit outsourced parts: ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  };

  // Refresh data when switching tabs
  useEffect(() => {
    if (activeTab === 'active') {
      fetchActiveOrders();
    } else if (activeTab === 'history') {
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
        <button
          className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'outsourced'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('outsourced')}
        >
          Outsourced Parts
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
              placeholder={activeTab === 'outsourced' ? "Search by ticket, part name, category, or SKU..." : "Search by ticket, customer, or vehicle..."}
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
            {activeTab === 'history' && (
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="ready for inspection">Ready for Inspection</option>
                <option value="awaiting bill">Awaiting Bill</option>
                <option value="completed">Completed</option>
              </select>
            )}
            {activeTab === 'outsourced' && (
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="requested">Requested</option>
                <option value="received">Received</option>
                <option value="ordered">Ordered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Orders/Parts List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'outsourced' ? (
            // Outsourced Parts Table
            loadingOutsourced ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <p className="text-lg text-gray-600">Loading outsourced parts...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Shop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOutsourcedParts.length > 0 ? (
                    filteredOutsourcedParts.map((part) => (
                      <tr key={part.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{part.ticket_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${Number(part.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${Number(part.total_cost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.source_shop || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(part.status)}`}>
                            {part.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {part.requested_at ? new Date(part.requested_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {part.received_at ? new Date(part.received_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                        No outsourced parts found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )
          ) : (
            // Orders Table
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
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 text-black">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 transform transition-all duration-300 scale-95 animate-scaleIn">
            {/* Modal Header with Gradient Background */}
            <div className={`p-6 rounded-t-2xl relative ${
              selectedOrder.status === 'completed' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-700' 
                : selectedOrder.status === 'ready for inspection'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700'
                : selectedOrder.status === 'awaiting bill'
                ? 'bg-gradient-to-r from-orange-600 to-amber-700'
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
              
              {/* Tabbed Parts Section */}
              <div className="mb-6">
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    className={`py-2 px-4 font-medium text-sm rounded-t-lg transition-colors ${
                      modalActiveTab === 'ordered'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setModalActiveTab('ordered')}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Ordered Parts
                    </div>
                  </button>
                  <button
                    className={`py-2 px-4 font-medium text-sm rounded-t-lg transition-colors ${
                      modalActiveTab === 'outsourced'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setModalActiveTab('outsourced')}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Outsourced Parts
                      {orderOutsourcedParts.length > 0 && (
                        <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {orderOutsourcedParts.length}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                {modalActiveTab === 'ordered' ? (
                  // Ordered Parts Tab Content
                  selectedOrder.ordered_parts.length > 0 ? (
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
                  )
                ) : (
                  // Outsourced Parts Tab Content
                  loadingOrderOutsourced ? (
                    <div className="flex justify-center items-center min-h-[200px] bg-white rounded-xl shadow border border-gray-200">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-3 text-gray-600">Loading outsourced parts...</p>
                      </div>
                    </div>
                  ) : orderOutsourcedParts.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Shop</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orderOutsourcedParts.map((part) => (
                            <tr key={part.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{part.category}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{part.sku}</td>
                              <td className="px-4 py-3 text-sm">{part.quantity}</td>
                              <td className="px-4 py-3 text-sm font-medium">${Number(part.price).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-medium">${Number(part.total_cost).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{part.source_shop || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(part.status)}`}>
                                  {part.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {part.requested_at ? new Date(part.requested_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {part.received_at ? new Date(part.received_at).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <p className="mt-4 text-gray-500">No outsourced parts for this order.</p>
                      <button
                        onClick={() => {
                          setShowOutsourceModal(true);
                        }}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center mx-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Outsource Parts
                      </button>
                    </div>
                  )
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
                        {selectedOrder.mechanicName || (
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
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${
                    selectedOrder.status === 'pending' ? 'bg-yellow-500' :
                    selectedOrder.status === 'assigned' ? 'bg-blue-500' :
                    selectedOrder.status === 'in progress' ? 'bg-indigo-500' :
                    selectedOrder.status === 'ready' ? 'bg-purple-500' :
                    selectedOrder.status === 'ready for inspection' ? 'bg-purple-500' :
                    selectedOrder.status === 'awaiting bill' ? 'bg-orange-500' : 'bg-green-500'
                  }`}></span>
                  <span className="text-sm font-medium text-gray-700">Status: <span className="font-semibold">{selectedOrder.status}</span></span>
                </div>
                
                {/* New buttons for ordering parts */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPartsModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Order Parts
                  </button>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Parts Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Order Parts</h3>
              <button onClick={() => setShowPartsModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Ticket Number Display */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <strong>Ticket Number:</strong> {selectedOrder?.ticket_number || 'N/A'}
            </div>
            
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Select</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">SKU</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">In Stock</th>
                    <th className="text-left py-2">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map(part => (
                    <tr key={part.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={selectedParts.includes(part.id)}
                          onChange={e => handleSelectPart(part.id, e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-2 text-gray-800">{part.name}</td>
                      <td className="py-2 text-gray-600">{part.sku}</td>
                      <td className="py-2 text-gray-600">{part.category}</td>
                      <td className="py-2 text-gray-800">
                        ${(parseFloat(part.price) || 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-gray-600">{part.inStock}</td>
                      <td className="py-2">
                        {selectedParts.includes(part.id) && (
                          <input
                            type="number"
                            min="1"
                            max={part.inStock}
                            value={quantities[part.id] || 1}
                            onChange={e => handleQuantityChange(part.id, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Selected Parts Summary */}
            {selectedParts.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {selectedParts.length} part(s) selected
                  </span>
                  <span className="font-medium">
                    Total: ${selectedParts.reduce((total, partId) => {
                      const part = parts.find(p => p.id === partId);
                      return total + (parseFloat(part?.price || '0') * (quantities[partId] || 1));
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowPartsModal(false);
                  setShowOutsourceModal(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Outsource Part
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPartsModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOrderParts}
                  disabled={selectedParts.length === 0}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    selectedParts.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow active:scale-95'
                  }`}
                >
                  <PackagePlus className="h-4 w-4" /> Order Selected Parts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Outsource Parts Modal */}
      {showOutsourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Outsource Parts</h3>
              <button
                onClick={() => {
                  setShowOutsourceModal(false);
                  setOutsourcedParts([]);
                  setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
                }}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Auto-Display Ticket Number */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <strong>Ticket Number:</strong> {selectedOrder?.ticket_number || 'N/A'}
              </div>
              
              {/* API Information */}
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Each part will be submitted individually as an outsourcing request.
                </p>
              </div>
              
              {/* Add New Part Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-3">Add New Part</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="part-name-input"
                      type="text"
                      value={outsourceForm.name}
                      onChange={(e) =>
                        handleOutsourceFormChange('name', e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleOutsourceSubmit();
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="Enter part name"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={outsourceForm.category}
                      onChange={(e) =>
                        handleOutsourceFormChange('category', e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="Engine Parts">Engine Parts</option>
                      <option value="Brake System">Brake System</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Transmission">Transmission</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Exhaust">Exhaust</option>
                      <option value="Cooling System">Cooling System</option>
                      <option value="Fuel System">Fuel System</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={outsourceForm.quantity}
                      onChange={(e) =>
                        handleOutsourceFormChange(
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  onClick={handleOutsourceSubmit}
                  disabled={!outsourceForm.name.trim()}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" /> Add to List
                </button>
              </div>
              
              {/* Parts List */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="font-medium mb-3">
                  Parts to Outsource ({outsourcedParts.length})
                </h4>
                {outsourcedParts.length > 0 ? (
                  <div className="overflow-y-auto flex-1 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">Name</th>
                          <th className="text-left py-2 px-3 font-medium">Category</th>
                          <th className="text-left py-2 px-3 font-medium">Quantity</th>
                          <th className="text-center py-2 px-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outsourcedParts.map((part) => (
                          <tr key={part.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{part.name}</td>
                            <td className="py-2 px-3">{part.category}</td>
                            <td className="py-2 px-3">{part.quantity}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => removeOutsourcedPart(part.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p>No parts added yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowOutsourceModal(false);
                  setOutsourcedParts([]);
                  setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalOutsourceSubmit}
                disabled={outsourcedParts.length === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  outsourcedParts.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow active:scale-95'
                }`}
              >
                <PackagePlus className="h-4 w-4" /> Submit All Parts
              </button>
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