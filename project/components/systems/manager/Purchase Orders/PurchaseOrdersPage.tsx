import { useState, useEffect } from 'react';

// Define TypeScript interface for Purchase Order
interface PurchaseOrder {
  id: number;
  po_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'delivered' | 'cancelled';
  order_created_at: string;
  items: Array<{
    item_id: number;
    name: string;
    quantity: number;
    price: number;
    created_at: string;
  }>;
  // Computed fields
  total_amount?: number;
  total_quantity?: number;
  // Default values for missing fields
  supplier?: string;
  order_date?: string;
  expected_date?: string;
  received_date?: string;
  item_count?: number;
  created_by?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  updated_at?: string;
}

// API base URL - adjust as needed
const API_BASE_URL = 'http://localhost:5001/api';

// Runtime validation helpers
const VALID_STATUSES = ['pending', 'approved', 'rejected', 'ordered', 'delivered', 'cancelled'] as const;
type ValidStatus = typeof VALID_STATUSES[number];

const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
type ValidPriority = typeof VALID_PRIORITIES[number];

function isValidStatus(status: any): status is ValidStatus {
  return VALID_STATUSES.includes(status);
}

function isValidPriority(priority: any): priority is ValidPriority {
  return VALID_PRIORITIES.includes(priority);
}

// Status badge component with appropriate colors (now safe)
const StatusBadge = ({ status }: { status: PurchaseOrder['status'] }) => {
  // Fallback if status is undefined/null/invalid
  const safeStatus = isValidStatus(status) ? status : 'pending';

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    ordered: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const displayText = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
  const bgColorClass = statusColors[safeStatus];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColorClass}`}>
      {displayText}
    </span>
  );
};

// Priority badge component (now safe)
const PriorityBadge = ({ priority }: { priority: PurchaseOrder['priority'] }) => {
  const safePriority = isValidPriority(priority) ? priority : 'low';

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const displayText = safePriority.charAt(0).toUpperCase() + safePriority.slice(1);
  const bgColorClass = priorityColors[safePriority];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColorClass}`}>
      {displayText}
    </span>
  );
};

// Modal component for purchase order details
const PurchaseOrderModal = ({ 
  purchaseOrder, 
  onClose,
  onStatusChange,
  isUpdating 
}: { 
  purchaseOrder: PurchaseOrder; 
  onClose: () => void;
  onStatusChange: (id: number, newStatus: 'approved' | 'rejected') => void;
  isUpdating: boolean;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Purchase Order Details</h2>
              <p className="text-gray-500">{purchaseOrder.po_number}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              disabled={isUpdating}
            >
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Items</h3>
                <div className="mt-1">
                  <ul className="divide-y divide-gray-200">
                    {purchaseOrder.items.map((item, index) => (
                      <li key={index} className="py-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.name}</span>
                          <span>Qty: {item.quantity} × ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={purchaseOrder.status} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                <div className="mt-1">
                  <PriorityBadge priority={purchaseOrder.priority} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                <p className="text-gray-800">{purchaseOrder.order_date || purchaseOrder.order_created_at}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Expected Date</h3>
                <p className="text-gray-800">{purchaseOrder.expected_date || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Received Date</h3>
                <p className="text-gray-800">{purchaseOrder.received_date || 'Not received yet'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="text-xl font-bold text-gray-800">
                  ${(purchaseOrder.total_amount || 0).toFixed(2)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Quantity</h3>
                <p className="text-gray-800">{purchaseOrder.total_quantity || 0} items</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                <p className="text-gray-800">{purchaseOrder.created_by || 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="text-gray-800">{purchaseOrder.order_created_at}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Updated At</h3>
                <p className="text-gray-800">{purchaseOrder.updated_at || purchaseOrder.order_created_at}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg min-h-[80px]">
                  {purchaseOrder.notes || 'No notes provided'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Status Change Buttons */}
          {purchaseOrder.status === 'pending' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-3">Change Status</h3>
              <div className="flex space-x-3">
                <button 
                  onClick={() => onStatusChange(purchaseOrder.id, 'approved')}
                  disabled={isUpdating}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    isUpdating 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Order
                    </>
                  )}
                </button>
                <button 
                  onClick={() => onStatusChange(purchaseOrder.id, 'rejected')}
                  disabled={isUpdating}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    isUpdating 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject Order
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isUpdating}
            >
              Close
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Purchase Orders component
const PurchaseOrdersPage = () => {
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Validate and sanitize incoming order data
  const sanitizePurchaseOrder = (order: any): PurchaseOrder => {
    // Sanitize items array
    const sanitizedItems = (order.items || []).map((item: any) => ({
      item_id: item.item_id || 0,
      name: item.name || 'Unknown Item',
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
      created_at: item.created_at || 'N/A'
    }));
    
    // Calculate total amount and quantity
    const total_amount = sanitizedItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.price), 0) || 0;
    const total_quantity = sanitizedItems.reduce((sum: number, item: any) => 
      sum + item.quantity, 0) || 0;
    
    return {
      id: order.order_id || 0,
      po_number: order.po_number || 'UNKNOWN',
      status: isValidStatus(order.status) ? order.status : 'pending', // Use API status with fallback
      order_created_at: order.order_created_at || 'N/A',
      items: sanitizedItems,
      total_amount,
      total_quantity,
      // Default values for missing fields
      supplier: 'N/A',
      order_date: order.order_created_at,
      expected_date: undefined,
      received_date: undefined,
      item_count: total_quantity,
      created_by: 'Unknown',
      notes: undefined,
      priority: 'low',
      updated_at: order.order_created_at,
    };
  };

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/purchase-orders/purchase-orders-get`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const rawData = await response.json();
      const sanitizedData = Array.isArray(rawData) ? rawData.map(sanitizePurchaseOrder) : [];
      setPurchaseOrders(sanitizedData);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to fetch purchase orders. Please try again later.');
      
      // Fallback to mock data if API fails
      setPurchaseOrders([
        {
          id: 1,
          po_number: 'PO-2023-001',
          status: 'pending',
          order_created_at: '2023-05-15',
          items: [
            { item_id: 1, name: 'Laptop', quantity: 2, price: 600, created_at: '2023-05-15' },
            { item_id: 2, name: 'Monitor', quantity: 3, price: 150, created_at: '2023-05-15' }
          ],
          total_amount: 1650,
          total_quantity: 5,
          supplier: 'N/A',
          order_date: '2023-05-15',
          expected_date: '2023-05-30',
          received_date: undefined,
          item_count: 5,
          created_by: 'John Smith',
          notes: 'Urgent order for new project',
          priority: 'high',
          updated_at: '2023-05-16 14:22:00'
        },
        {
          id: 2,
          po_number: 'PO-2023-002',
          status: 'ordered',
          order_created_at: '2023-05-18',
          items: [
            { item_id: 3, name: 'Desk Chair', quantity: 5, price: 80, created_at: '2023-05-18' },
            { item_id: 4, name: 'Desk Lamp', quantity: 7, price: 30, created_at: '2023-05-18' }
          ],
          total_amount: 610,
          total_quantity: 12,
          supplier: 'N/A',
          order_date: '2023-05-18',
          expected_date: '2023-06-05',
          received_date: undefined,
          item_count: 12,
          created_by: 'Sarah Johnson',
          notes: 'Monthly office supplies',
          priority: 'medium',
          updated_at: '2023-05-18 11:15:00'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Function to update the status of a purchase order via API
  const handleStatusChange = async (id: number, newStatus: 'approved' | 'rejected') => {
    setIsUpdating(true);
    
    try {
      const endpoint = newStatus === 'approved' 
        ? `${API_BASE_URL}/purchase-orders/${id}/approve` 
        : `${API_BASE_URL}/purchase-orders/${id}/reject`;
        
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Refresh the data after successful update
      await fetchPurchaseOrders();
      
      // Update the selected order if it's the one being changed
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          updated_at: new Date().toLocaleString()
        });
      }
    } catch (err) {
      console.error(`Error ${newStatus}ing order:`, err);
      alert(`Failed to ${newStatus} order. Please try again.`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter purchase orders based on search and status
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = 
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
          <p className="text-gray-600 mt-2">Manage and track all your purchase orders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-gray-500 text-sm">Total Orders</div>
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <div className="text-2xl font-bold text-gray-800">{purchaseOrders.length}</div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-gray-500 text-sm">Pending</div>
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {purchaseOrders.filter(o => o.status === 'pending').length}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-gray-500 text-sm">Approved</div>
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {purchaseOrders.filter(o => o.status === 'approved').length}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-gray-500 text-sm">Total Value</div>
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <div className="text-2xl font-bold text-gray-800">
                ${purchaseOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by PO number or item name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg 
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="ordered">Ordered</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <button 
                onClick={fetchPurchaseOrders}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg 
                  className="w-5 h-5 mr-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Purchase Orders List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.po_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.items.length > 0 ? (
                            <>
                              {order.items[0].name}
                              {order.items.length > 1 && (
                                <span className="text-gray-500"> +{order.items.length - 1} more</span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-500">No items</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={order.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.order_date || order.order_created_at}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(order.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!isLoading && filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOrders.length}</span> of{' '}
            <span className="font-medium">{purchaseOrders.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <PurchaseOrderModal 
          purchaseOrder={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default PurchaseOrdersPage;