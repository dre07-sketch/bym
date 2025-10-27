import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Search, 
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Eye,
  DollarSign,
  AlertCircle,
  ShoppingCart,
  X,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  User,
  Loader,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Helper functions for JWT handling
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error('JWT parsing error:', e);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = parseJwt(token);
  if (!decoded) return true;
  const now = Date.now() / 1000;
  const isExpired = decoded.exp < now;
  console.log('Token expiration check:', {
    exp: new Date(decoded.exp * 1000),
    now: new Date(now * 1000),
    isExpired
  });
  return isExpired;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface PurchaseOrder {
  poNumber: string;
  supplier: string;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'received';
  orderDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  totalAmount: number;
  itemCount: number;
  createdBy: string; // Now just the full name
  notes: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  items: OrderItem[];
}

interface Supplier {
  id: number;
  name: string;
}

const PurchaseOrders: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'ordered' | 'received'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [animatedCards, setAnimatedCards] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Function to handle logout and redirect
  const handleLogout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Function to check authentication and redirect if needed
  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    console.log('Auth check - Token exists:', !!token);
    console.log('Auth check - User data exists:', !!userData);
    
    if (!token) {
      setAuthError('No authentication token found. Please log in again.');
      setDebugInfo('Missing token');
      handleLogout();
      return false;
    }
    
    if (isTokenExpired(token)) {
      setAuthError('Session expired. Please log in again.');
      setDebugInfo('Token expired');
      handleLogout();
      return false;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Raw user data from localStorage:', user);
        
        // Extract user ID from JWT token as well for comparison
        const decodedToken = parseJwt(token);
        console.log('Decoded JWT token:', decodedToken);
        
        // Get user ID from token if available, otherwise from user data
        let userId;
        if (decodedToken && decodedToken.id) {
          userId = decodedToken.id;
          console.log('Using user ID from token:', userId);
        } else if (user.id) {
          userId = user.id;
          console.log('Using user ID from user data:', userId);
        } else {
          throw new Error('User ID not found in token or user data');
        }
        
        // Ensure ID is a number
        const numericId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        if (isNaN(numericId)) {
          throw new Error(`Invalid user ID format: ${userId}`);
        }
        
        console.log('Final user ID (numeric):', numericId);
        
        setCurrentUser({
          id: numericId,
          name: user.full_name || user.name || 'Unknown User',
          role: user.role || 'Unknown Role'
        });
        console.log('Current user set:', user.full_name || user.name, 'with ID:', numericId);
        return true;
      } catch (e) {
        console.error('Error parsing user data:', e);
        setAuthError(`Invalid user data: ${e instanceof Error ? e.message : 'Unknown error'}`);
        setDebugInfo('Invalid user data');
        handleLogout();
        return false;
      }
    } else {
      setAuthError('User data not found. Please log in again.');
      setDebugInfo('Missing user data');
      handleLogout();
      return false;
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = checkAuth();
    if (isAuthenticated) {
      setAnimatedCards(true);
      fetchPurchaseOrders();
    }
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthError('No authentication token found. Please log in again.');
        setDebugInfo('Missing token in fetchPurchaseOrders');
        handleLogout();
        return;
      }

      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/purchase-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Fetch response status:', response.status);
      
      if (response.status === 401) {
        setAuthError('Session expired. Please log in again.');
        setDebugInfo('401 Unauthorized in fetchPurchaseOrders');
        handleLogout();
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Fetch result:', result);
      
      if (result.success && Array.isArray(result.data)) {
        // Map the data to match our interface
        const poList = result.data.map((po: any) => ({
          poNumber: po.poNumber,
          supplier: po.supplier,
          status: po.status,
          orderDate: po.orderDate || 'N/A',
          expectedDate: po.expectedDate || null,
          receivedDate: po.receivedDate || null,
          totalAmount: parseFloat(po.totalAmount) || 0,
          itemCount: parseInt(po.itemCount) || 0,
          createdBy: po.createdBy || 'Unknown',
          notes: po.notes || '',
          priority: po.priority || 'medium',
          items: Array.isArray(po.items) ? po.items.map((item: any) => ({
            id: item.id?.toString() || '',
            name: item.name || '',
            quantity: parseInt(item.quantity) || 0,
            price: parseFloat(item.price) || 0
          })) : []
        }));
        
        setPurchaseOrders(poList);
      } else {
        console.error('Invalid API response structure:', result);
        setPurchaseOrders([]);
      }
    } catch (err) {
      console.error('Error in fetchPurchaseOrders:', err);
      setPurchaseOrders([]);
      setAuthError(`Failed to load purchase orders: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchPurchaseOrders();
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleStatusUpdate = async (poNumber: string, status: string) => {
    if (!window.confirm(`Are you sure you want to ${status} this PO?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthError('No authentication token found. Please log in again.');
        handleLogout();
        return;
      }

      const response = await fetch(`https://ipasystem.bymsystem.com/api/inventory/purchase-orders/${poNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.status === 401) {
        setAuthError('Session expired. Please log in again.');
        handleLogout();
        return;
      }

      const result = await response.json();

      if (response.ok) {
        alert(`✅ PO ${status} successfully!`);
        fetchPurchaseOrders();
        if (viewingPO?.poNumber === poNumber) {
          setViewingPO(prev => {
            if (!prev) return prev;
            return { ...prev, status: status as PurchaseOrder['status'] };
          });
        }
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Error in handleStatusUpdate:', err);
      alert('❌ Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'received': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'approved': return <CheckCircle className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      case 'ordered': return <TrendingUp className="w-3 h-3" />;
      case 'received': return <CheckCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.items && order.items.some(item => 
                            item.name.toLowerCase().includes(searchTerm.toLowerCase())
                          ));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    pending: purchaseOrders.filter(po => po.status === 'pending').length,
    approved: purchaseOrders.filter(po => po.status === 'approved').length,
    rejected: purchaseOrders.filter(po => po.status === 'rejected').length,
    ordered: purchaseOrders.filter(po => po.status === 'ordered').length,
    received: purchaseOrders.filter(po => po.status === 'received').length
  };

  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  // Show authentication error if any
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          {debugInfo && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p className="text-xs font-mono text-gray-700">Debug: {debugInfo}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Purchase Orders
          </h2>
          <p className="text-gray-600 mt-2">Manage and monitor purchase requests</p>
          {currentUser && (
            <div className="flex items-center mt-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{currentUser.name}</span> 
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {currentUser.role}
                </span>
              </p>
            </div>
          )}
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
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Request PO</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by PO number, supplier, requester, or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-wrap gap-3 justify-center">
          {(['all', 'pending', 'approved', 'rejected', 'ordered', 'received'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all duration-200 shadow-sm ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-bold">
                  {statusCounts[status]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { title: 'Pending', value: statusCounts.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
          { title: 'Approved', value: statusCounts.approved, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { title: 'Rejected', value: statusCounts.rejected, icon: XCircle, color: 'from-red-500 to-red-600' },
          { title: 'Ordered', value: statusCounts.ordered, icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
          { title: 'Total Value', value: `$${(totalValue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'from-purple-500 to-purple-600' }
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

      {/* Purchase Orders Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Purchase Orders</h3>
            </div>
            <span className="text-sm text-gray-500">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
        </div>

        <div className="p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No purchase orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.poNumber} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{order.poNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.supplier}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {order.items && order.items.length > 0 ? (
                            <div className="flex flex-col">
                              {order.items.slice(0, 2).map((item, index) => (
                                <div key={item.id} className="flex justify-between">
                                  <span className="truncate">{item.name}</span>
                                  <span className="ml-2 text-gray-500">x{item.quantity}</span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="text-gray-500 text-xs mt-1">
                                  +{order.items.length - 2} more items
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No items</span>
                          )}
                        </div>
                      </td>
                     <td className="px-4 py-3 text-sm text-gray-900">
  {order.orderDate ? new Date(order.orderDate).toLocaleString() : '-'}
</td>
<td className="px-4 py-3 text-sm text-gray-900">
  {order.receivedDate ? new Date(order.receivedDate).toLocaleString() : '-'}
</td>

                      <td className="px-4 py-3 text-sm font-bold text-gray-900">${order.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setViewingPO(order)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request PO Modal */}
      {showRequestModal && (
        <RequestPOModal
          onClose={() => setShowRequestModal(false)}
          onPOCreated={fetchPurchaseOrders}
          currentUser={currentUser}
          handleLogout={handleLogout}
        />
      )}

      {/* View PO Modal */}
      {viewingPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in text-black">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Purchase Order Details</h3>
              <p className="text-gray-600">{viewingPO.poNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-semibold">{viewingPO.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingPO.status)}`}>
                    {getStatusIcon(viewingPO.status)}
                    <span className="ml-1 capitalize">{viewingPO.status}</span>
                  </span>
                </div>
               <div>
  <p className="text-sm text-gray-500">Order Date</p>
  <p className="font-semibold">
    {viewingPO.orderDate ? new Date(viewingPO.orderDate).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '-'}
  </p>
</div>

<div>
  <p className="text-sm text-gray-500">Received Date</p>
  <p className="font-semibold text-green-700">
    {viewingPO.receivedDate ? new Date(viewingPO.receivedDate).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '-'}
  </p>
</div>

                <div>
  <p className="text-sm text-gray-500">Expected Delivery</p>
  <p className="font-semibold">
    {viewingPO.expectedDate 
      ? new Date(viewingPO.expectedDate).toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) 
      : '-'}
  </p>
</div>

                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-bold">${viewingPO.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requested By</p>
                  <p className="font-semibold">{viewingPO.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(viewingPO.priority)}`}>
                    {viewingPO.priority.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Item Count</p>
                  <p className="font-semibold">{viewingPO.itemCount}</p>
                </div>
              </div>
              {viewingPO.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium text-gray-900">{viewingPO.notes}</p>
                </div>
              )}
              
              {/* Item Details Table */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                      {viewingPO.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-medium">{item.name}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">${item.price.toFixed(2)}</td>
                          <td className="px-3 py-2 font-bold">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 space-y-3">
              {viewingPO.status === 'approved' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleStatusUpdate(viewingPO.poNumber, 'ordered')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Order</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(viewingPO.poNumber, 'rejected')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}

              {viewingPO.status === 'ordered' && (
                <button
                  onClick={() => handleStatusUpdate(viewingPO.poNumber, 'received')}
                  className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Receive</span>
                </button>
              )}
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewingPO(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// RequestPOModal Component with Supplier Dropdown
interface RequestPOModalProps {
  onClose: () => void;
  onPOCreated: () => void;
  currentUser: { id: number; name: string; role: string } | null;
  handleLogout: () => void;
}

const RequestPOModal: React.FC<RequestPOModalProps> = ({ 
  onClose, 
  onPOCreated,
  currentUser,
  handleLogout
}) => {
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDate: '',
    notes: ''
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: '1', name: '', quantity: 0, price: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
          setAuthError('Session expired. Please log in again.');
          setDebugInfo('Token expired in fetchSuppliers');
          handleLogout();
          return;
        }

        const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/names', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
          setAuthError('Session expired. Please log in again.');
          setDebugInfo('401 in fetchSuppliers');
          handleLogout();
          return;
        }
        
        const result = await response.json();
        
        if (result.success) {
          setSuppliers(result.data);
        } else {
          console.error('Failed to fetch suppliers:', result.message);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      } finally {
        setIsLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [handleLogout]);

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 0,
      price: 0
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setOrderItems(orderItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const itemCount = orderItems.length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSupplierSelect = (supplierName: string) => {
    setFormData(prev => ({
      ...prev,
      supplier: supplierName
    }));
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    console.log('Submit - Token exists:', !!token);
    
    if (!token) {
      setAuthError('No authentication token found. Please log in again.');
      setDebugInfo('Missing token on submit');
      handleLogout();
      return;
    }
    
    if (isTokenExpired(token)) {
      setAuthError('Session expired. Please log in again.');
      setDebugInfo('Token expired on submit');
      handleLogout();
      return;
    }

    if (!formData.supplier || !orderItems || orderItems.length === 0 || orderItems.some(item => !item.name)) {
      alert('Please fill all required fields');
      return;
    }

    // Ensure we have current user info
    if (!currentUser || !currentUser.name) {
      setAuthError('User information is missing. Please log in again.');
      setDebugInfo('Missing user info on submit');
      handleLogout();
      return;
    }

    // Get user ID from JWT token as the primary source
    const decodedToken = parseJwt(token);
    let userId = currentUser.id; // Default to current user state
    
    if (decodedToken && decodedToken.id) {
      // Use the ID from the token if available
      userId = typeof decodedToken.id === 'string' ? parseInt(decodedToken.id, 10) : decodedToken.id;
      console.log('Using user ID from token:', userId);
    } else {
      console.log('Using user ID from state:', userId);
    }

    // Validate that user ID is a number
    if (isNaN(userId) || userId <= 0) {
      setAuthError('Invalid user ID. Please log in again.');
      setDebugInfo(`Invalid user ID: ${userId}`);
      handleLogout();
      return;
    }

    // Convert to number explicitly to ensure it's not a string
    const numericUserId = Number(userId);
    console.log('Final user ID for submission:', numericUserId, typeof numericUserId);

    setIsSubmitting(true);
    try {
      // Format the payload to match backend expectations
      const payload = {
        supplier: formData.supplier,
        orderDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        expectedDate: formData.expectedDate || null,
        receivedDate: null, // Not set when creating a new PO
        createdBy: currentUser.name, // Send as string, not object
        notes: formData.notes || '',
        priority: 'medium',
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      console.log('Submitting payload:', payload);

      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.status === 401) {
        setAuthError('Session expired. Please log in again.');
        setDebugInfo('401 on submit');
        handleLogout();
        return;
      }

      const result = await response.json();
      console.log('Response body:', result);

      if (response.ok) {
        alert(`✅ Purchase request submitted for approval! PO Number: ${result.poNumber}`);
        onPOCreated();
        onClose();
      } else {
        console.error('Backend error:', result);
        alert(`❌ Error: ${result.message || 'Unknown error occurred'}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('❌ Network error. Check if backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show authentication error if any
  if (authError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          {debugInfo && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p className="text-xs font-mono text-gray-700">Debug: {debugInfo}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in text-black">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Request Purchase Order</h2>
                {currentUser && (
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-sm text-gray-600">
                      Created by: <span className="font-medium">{currentUser.name}</span> 
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {currentUser.role}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supplier *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="relative">
                  <div
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer bg-white"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {formData.supplier ? (
                      <div className="text-gray-900">{formData.supplier}</div>
                    ) : (
                      <div className="text-gray-500">Enter supplier name</div>
                    )}
                  </div>
                  <ChevronDown 
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingSuppliers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                          <span className="ml-2 text-gray-500">Loading suppliers...</span>
                        </div>
                      ) : suppliers.length > 0 ? (
                        suppliers.map(supplier => (
                          <div
                            key={supplier.id}
                            className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors text-black"
                            onClick={() => handleSupplierSelect(supplier.name)}
                          >
                            {supplier.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500">
                          No suppliers available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Created By Field */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Created By
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={currentUser?.name || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700 cursor-not-allowed"
                placeholder="Current user"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg font-semibold text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={orderItems.length === 1}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Additional notes or special instructions..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.supplier || orderItems.some(item => !item.name)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Submit for Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrders;