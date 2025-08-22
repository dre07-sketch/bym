import { useState, useEffect } from 'react';

// Define TypeScript interface for parts
interface Part {
  id: number;
  part_number: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'ordered' | 'received' | 'backordered';
}

// Extend the Order interface to include parts
interface Order {
  id: number;
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
  parts: Part[]; // Added parts array
}

const OrderManagementSystem = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // Mock data with parts
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 1,
        ticket_number: "TK-2023-0842",
        customer_type: "individual",
        customer_id: "CUST-1001",
        customer_name: "Sarah Johnson",
        vehicle_id: 101,
        vehicle_info: "2021 Honda CR-V EX",
        license_plate: "ABC-123",
        title: "Engine Noise Diagnosis",
        description: "Engine making unusual noise during acceleration. Customer reports loss of power when going uphill.",
        priority: "high",
        type: "regular",
        urgency_level: "urgent",
        status: "pending",
        created_at: "2023-10-15T09:30:00",
        updated_at: "2023-10-15T09:30:00",
        estimated_completion_date: "2023-10-18",
        parts: [
          {
            id: 1,
            part_number: "ENG-0452",
            description: "Engine Mount Set",
            quantity: 1,
            unit_price: 89.99,
            total_price: 89.99,
            status: "ordered"
          },
          {
            id: 2,
            part_number: "FLT-1123",
            description: "Oil Filter",
            quantity: 1,
            unit_price: 12.50,
            total_price: 12.50,
            status: "received"
          }
        ]
      },
      {
        id: 2,
        ticket_number: "TK-2023-0837",
        customer_type: "business",
        customer_id: "CUST-1002",
        customer_name: "Michael Rodriguez",
        vehicle_id: 102,
        vehicle_info: "2019 Ford F-150 XLT",
        license_plate: "TRK-789",
        title: "Brake System Inspection",
        description: "Brake pedal feels spongy and travels further than normal. Customer concerned about safety.",
        priority: "medium",
        type: "appointment",
        urgency_level: "normal",
        status: "pending",
        appointment_id: "APT-2023-0837",
        created_at: "2023-10-14T14:15:00",
        updated_at: "2023-10-14T14:15:00",
        estimated_completion_date: "2023-10-17",
        parts: [
          {
            id: 3,
            part_number: "BRK-7890",
            description: "Brake Pad Set - Front",
            quantity: 1,
            unit_price: 65.00,
            total_price: 65.00,
            status: "ordered"
          },
          {
            id: 4,
            part_number: "BRK-7891",
            description: "Brake Rotor - Front",
            quantity: 2,
            unit_price: 45.50,
            total_price: 91.00,
            status: "backordered"
          }
        ]
      },
      {
        id: 3,
        ticket_number: "TK-2023-0829",
        customer_type: "individual",
        customer_id: "CUST-1003",
        customer_name: "Emily Chen",
        vehicle_id: 103,
        vehicle_info: "2022 Tesla Model 3 LR",
        license_plate: "EV-001",
        title: "Software Update Failure",
        description: "Software update failed during installation. Vehicle showing multiple error codes.",
        priority: "low",
        type: "sos",
        urgency_level: "low",
        status: "assigned",
        mechanic_assign: "John Smith",
        created_at: "2023-10-12T11:20:00",
        updated_at: "2023-10-13T10:45:00",
        estimated_completion_date: "2023-10-16",
        parts: []
      },
      {
        id: 4,
        ticket_number: "TK-2023-0815",
        customer_type: "individual",
        customer_id: "CUST-1004",
        customer_name: "David Thompson",
        vehicle_id: 104,
        vehicle_info: "2018 BMW 3 Series 330i",
        license_plate: "LUX-456",
        title: "AC System Repair",
        description: "Air conditioning not cooling properly. Blows warm air intermittently.",
        priority: "medium",
        type: "service",
        urgency_level: "normal",
        status: "in progress",
        mechanic_assign: "Robert Garcia",
        created_at: "2023-10-10T08:45:00",
        updated_at: "2023-10-13T14:30:00",
        estimated_completion_date: "2023-10-15",
        parts: [
          {
            id: 5,
            part_number: "AC-3344",
            description: "AC Compressor",
            quantity: 1,
            unit_price: 320.00,
            total_price: 320.00,
            status: "received"
          },
          {
            id: 6,
            part_number: "AC-3345",
            description: "AC Condenser",
            quantity: 1,
            unit_price: 180.00,
            total_price: 180.00,
            status: "received"
          },
          {
            id: 7,
            part_number: "AC-3346",
            description: "Refrigerant R134a",
            quantity: 2,
            unit_price: 25.00,
            total_price: 50.00,
            status: "received"
          }
        ]
      },
      {
        id: 5,
        ticket_number: "TK-2023-0802",
        customer_type: "business",
        customer_id: "CUST-1005",
        customer_name: "Jessica Williams",
        vehicle_id: 105,
        vehicle_info: "2020 Toyota RAV4 Limited",
        license_plate: "SUV-789",
        title: "TPMS Sensor Issue",
        description: "Tire pressure warning light stays on. All tires appear properly inflated.",
        priority: "low",
        type: "regular",
        urgency_level: "low",
        status: "ready",
        mechanic_assign: "Michael Brown",
        inspector_assign: "Lisa Johnson",
        created_at: "2023-10-05T13:20:00",
        updated_at: "2023-10-14T10:15:00",
        completion_date: "2023-10-14",
        parts: [
          {
            id: 8,
            part_number: "TPM-5566",
            description: "TPMS Sensor",
            quantity: 1,
            unit_price: 45.00,
            total_price: 45.00,
            status: "received"
          }
        ]
      },
      {
        id: 6,
        ticket_number: "TK-2023-0791",
        customer_type: "individual",
        customer_id: "CUST-1006",
        customer_name: "Robert Garcia",
        vehicle_id: 106,
        vehicle_info: "2017 Chevrolet Silverado LTZ",
        license_plate: "TRK-246",
        title: "Transmission Slipping",
        description: "Transmission slipping between 2nd and 3rd gears. Noticeable at highway speeds.",
        priority: "high",
        type: "sos",
        urgency_level: "urgent",
        status: "completed",
        mechanic_assign: "David Wilson",
        inspector_assign: "James Taylor",
        created_at: "2023-10-01T10:30:00",
        updated_at: "2023-10-13T16:45:00",
        completion_date: "2023-10-13",
        parts: [
          {
            id: 9,
            part_number: "TRN-7788",
            description: "Transmission Filter Kit",
            quantity: 1,
            unit_price: 35.00,
            total_price: 35.00,
            status: "received"
          },
          {
            id: 10,
            part_number: "TRN-7789",
            description: "Transmission Fluid",
            quantity: 5,
            unit_price: 12.00,
            total_price: 60.00,
            status: "received"
          }
        ]
      }
    ];

    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  }, []);

  // Filter orders based on search term and status filter
  useEffect(() => {
    let result = orders;
    
    if (searchTerm) {
      result = result.filter(order => 
        order.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter]);

  // Open order details modal
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
  const assignToMechanic = () => {
    if (!selectedOrder) return;
    
    // In a real app, this would be an API call
    const updatedOrders = orders.map(order => 
      order.id === selectedOrder.id 
        ? { ...order, status: 'assigned' as const, mechanic_assign: 'John Smith', updated_at: new Date().toISOString() }
        : order
    );
    
    setOrders(updatedOrders);
    closeModal();
    showNotification('Order successfully assigned to mechanic!');
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

  // Get part status badge color
  const getPartStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'backordered': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              <p className="text-gray-600">Track and manage all service orders</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Today:</span>
            <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
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
              <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

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
              <option value="completed">Completed</option>
            </select>
            
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Order
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openOrderModal(order)}>
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
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderModal(order);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                  <p className="text-gray-500 mt-1">Ticket #{selectedOrder.ticket_number}</p>
                </div>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-800">{selectedOrder.customer_name}</p>
                    <p className="text-gray-600 mt-1">ID: {selectedOrder.customer_id}</p>
                    <p className="text-gray-600">Type: {selectedOrder.customer_type}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Vehicle Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-800">{selectedOrder.vehicle_info}</p>
                    <p className="text-gray-600 mt-1">ID: {selectedOrder.vehicle_id}</p>
                    <p className="text-gray-600">License: {selectedOrder.license_plate}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Service Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 font-medium mb-2">{selectedOrder.title}</p>
                  <p className="text-gray-700">{selectedOrder.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedOrder.priority)}`}>
                      Priority: {selectedOrder.priority}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                      Type: {selectedOrder.type}
                    </span>
                    {selectedOrder.urgency_level && (
                      <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                        Urgency: {selectedOrder.urgency_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Ordered Parts Section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Ordered Parts</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedOrder.parts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part #</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.parts.map((part) => (
                            <tr key={part.id}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{part.part_number}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{part.description}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{part.quantity}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${part.unit_price.toFixed(2)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${part.total_price.toFixed(2)}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPartStatusColor(part.status)}`}>
                                  {part.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Total Parts Cost:</td>
                            <td className="px-4 py-2 text-sm font-bold text-gray-900">
                              ${selectedOrder.parts.reduce((sum, part) => sum + part.total_price, 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No parts ordered for this service</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Assignment</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800">
                      <span className="font-medium">Mechanic:</span> {selectedOrder.mechanic_assign || 'Not assigned'}
                    </p>
                    <p className="text-gray-800 mt-1">
                      <span className="font-medium">Inspector:</span> {selectedOrder.inspector_assign || 'Not assigned'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Dates</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800">
                      <span className="font-medium">Created:</span> {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-800 mt-1">
                      <span className="font-medium">Estimated Completion:</span> {selectedOrder.estimated_completion_date ? new Date(selectedOrder.estimated_completion_date).toLocaleDateString() : 'Not set'}
                    </p>
                    {selectedOrder.completion_date && (
                      <p className="text-gray-800 mt-1">
                        <span className="font-medium">Completed:</span> {new Date(selectedOrder.completion_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="inline-flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-500' :
                      selectedOrder.status === 'assigned' ? 'bg-blue-500' :
                      selectedOrder.status === 'in progress' ? 'bg-indigo-500' :
                      selectedOrder.status === 'ready' ? 'bg-purple-500' : 'bg-green-500'
                    }`}></span>
                    Status: <span className="ml-1 font-medium">{selectedOrder.status}</span>
                  </span>
                </div>
                
                {selectedOrder.status === 'pending' && (
                  <button 
                    onClick={assignToMechanic}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assign to Mechanic
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default OrderManagementSystem;