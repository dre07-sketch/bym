import { useState, useEffect } from 'react';

// Define interfaces based on API response
interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  currentMileage: number;
  vehicleImages: string[];
}

interface Customer {
  customerId: string;
  customerType: 'individual' | 'company';
  name: string;
  companyName: string | null;
  email: string;
  phone: string;
  emergencyContact: string;
  address: string;
  notes: string;
  registrationDate: string;
  totalServices: number;
  loyaltyPoints: number;
  status: string;
  customerImages: string[];
  vehicles: Vehicle[];
}

// Interfaces for service history details
interface DisassembledPart {
  id: number;
  ticket_number: string;
  part_name: string;
  condition: string;
  status: string;
  notes: string | null;
  logged_at: string;
  reassembly_verified: string | null;
}

interface OutsourceMechanic {
  id: number;
  ticket_number: string;
  mechanic_name: string;
  company_name: string;
  task: string;
  cost: number | string;
  status: string;
  created_at: string;
}

interface OrderedPart {
  id: number;
  ticket_number: string;
  part_name: string;
  quantity: number;
  cost: number | string;
  supplier: string;
  ordered_at: string;
}

interface OutsourceStock {
  id: number;
  ticket_number: string;
  part_name: string;
  quantity: number;
  supplier: string;
  requested_at: string;
}

interface Inspection {
  id: number;
  ticket_number: string;
  main_issue_resolved: string;
  reassembly_verified: string;
  general_condition: string;
  notes: string;
  inspection_date: string;
  inspection_status: string;
  created_at: string;
  updated_at: string;
  check_oil_leaks: string | null;
  check_engine_air_filter_oil_coolant_level: string | null;
  check_brake_fluid_levels: string | null;
  check_gluten_fluid_levels: string | null;
  check_battery_timing_belt: string | null;
  check_tire: string | null;
  check_tire_pressure_rotation: string | null;
  check_lights_wiper_horn: string | null;
  check_door_locks_central_locks: string | null;
  check_customer_work_order_reception_book: string | null;
}

interface ProgressLog {
  id: number;
  ticket_number: string;
  action: string;
  notes: string;
  created_at: string;
}

interface ProformaItem {
  id: number;
  proforma_id: number;
  description: string;
  size: string;
  quantity: number;
  unit_price: number | string;
  amount: number | string;
  created_at: string;
  updated_at: string;
}

interface Bill {
  id: number;
  ticket_number: string;
  proforma_number: string;
  proforma_id?: number;
  proforma_date?: string;
  customer_name: string;
  vehicle_info: string;
  labor_cost: number | string;
  parts_cost: number | string;
  outsourced_parts_cost: number | string;
  outsourced_labor_cost: number | string;
  subtotal: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total: number | string;
  discount: number | string;
  final_total: number | string;
  status: string;
  payment_type?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: number;
  vehicle_info: string;
  license_plate: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  created_at: string;
  updated_at: string;
  disassembled_parts: DisassembledPart[];
  outsource_mechanics: OutsourceMechanic[];
  ordered_parts: OrderedPart[];
  outsource_stock: OutsourceStock[];
  inspections: Inspection[];
  progress_logs: ProgressLog[];
  bills: Bill[];
  proforma_items: ProformaItem[];
}

// Simplified ticket interface for list view
interface TicketSummary {
  ticket_number: string;
  title: string;
  created_at: string;
  updated_at?: string;
  vehicle_info: string;
  status: string;
}

const CustomerPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ticket');
  
  // New states for customer tickets
  const [customerTickets, setCustomerTickets] = useState<TicketSummary[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  
  // New states for completed tickets
  const [completedTickets, setCompletedTickets] = useState<TicketSummary[]>([]);
  const [completedTicketsLoading, setCompletedTicketsLoading] = useState(false);
  const [completedTicketsError, setCompletedTicketsError] = useState<string | null>(null);
  const [completedTicketsPagination, setCompletedTicketsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [serviceHistoryTab, setServiceHistoryTab] = useState('allTickets');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ipasystem.bymsystem.com/api/customers/fetch');
        
        if (!response.ok) {
          throw new Error('Failed to fetch customer data');
        }
        
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch ticket details
  const fetchTicketDetails = async (ticketNumber: string, isCompleted = false) => {
    try {
      setTicketLoading(true);
      setTicketError(null);
      
      if (!selectedCustomer) {
        setTicketError("Customer not selected");
        return;
      }
      
      // Try the service-report endpoint first
      let response = await fetch(
        `https://ipasystem.bymsystem.com/api/service-report/${selectedCustomer.customerId}/${ticketNumber}`
      );
      
      // If that fails, try an alternative endpoint
      if (!response.ok) {
        console.log('Service report endpoint failed, trying alternative endpoint');
        response = await fetch(
          `https://ipasystem.bymsystem.com/api/tickets/${ticketNumber}`
        );
      }
      
      if (response.status === 404) {
        setTicketError("Ticket details not found. This ticket may not be completed yet or the ticket number is invalid.");
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch ticket details');
      }
      
      const data = await response.json();
      
      // Structure the data to match our Ticket interface
      // Handle different possible response structures
      let ticket: Ticket;
      
      if (data.ticket) {
        // If the response has a ticket property (from service-report endpoint)
        ticket = {
          ...data.ticket,
          disassembled_parts: data.disassembled_parts || [],
          outsource_mechanics: data.outsource_mechanics || [],
          ordered_parts: data.ordered_parts || [],
          outsource_stock: data.outsource_stock || [],
          inspections: data.inspections || [],
          progress_logs: data.progress_logs || [],
          bills: data.bills || [],
          proforma_items: data.proforma_items || [],
        };
      } else {
        // If the response is the ticket directly (from tickets endpoint)
        ticket = {
          ...data,
          disassembled_parts: data.disassembled_parts || [],
          outsource_mechanics: data.outsource_mechanics || [],
          ordered_parts: data.ordered_parts || [],
          outsource_stock: data.outsource_stock || [],
          inspections: data.inspections || [],
          progress_logs: data.progress_logs || [],
          bills: data.bills || [],
          proforma_items: data.proforma_items || [],
        };
      }
      
      setSelectedTicket(ticket);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setTicketError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setTicketLoading(false);
    }
  };

  // Fetch customer tickets
  const fetchCustomerTickets = async (customerId: string) => {
    try {
      setTicketsLoading(true);
      setTicketsError(null);
      
      // Try to fetch tickets from the API
      const response = await fetch(`https://ipasystem.bymsystem.com/api/customers/${customerId}/tickets`);
      
      if (response.status === 404) {
        // If the endpoint doesn't exist, we'll show a message that tickets aren't available
        setTicketsError('Service history is not available for this customer');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer tickets');
      }
      
      const data = await response.json();
      setCustomerTickets(data);
    } catch (err) {
      console.error('Error fetching customer tickets:', err);
      setTicketsError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setTicketsLoading(false);
    }
  };

  // Fetch completed tickets
  const fetchCompletedTickets = async (customerId: string, page = 1) => {
    try {
      setCompletedTicketsLoading(true);
      setCompletedTicketsError(null);
      
      const response = await fetch(
        `https://ipasystem.bymsystem.com/api/customer-manege/completed-tickets/${customerId}?page=${page}&limit=${completedTicketsPagination.limit}`
      );
      
      if (response.status === 404) {
        // If the endpoint doesn't exist, we'll show a message that tickets aren't available
        setCompletedTicketsError('Completed tickets history is not available for this customer');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch completed tickets');
      }
      
      const data = await response.json();
      setCompletedTickets(data.tickets);
      setCompletedTicketsPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching completed tickets:', err);
      setCompletedTicketsError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setCompletedTicketsLoading(false);
    }
  };

  // Status badge styling
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Open customer details modal
  const openCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setServiceHistoryTab('allTickets');
    // Fetch tickets for this customer
    await fetchCustomerTickets(customer.customerId);
    // Fetch completed tickets
    await fetchCompletedTickets(customer.customerId);
  };

  // Close customer details modal
  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerTickets([]);
    setCompletedTickets([]);
    setTicketsError(null);
    setCompletedTicketsError(null);
  };

  // Open vehicle details modal
  const openVehicleDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  // Close vehicle details modal
  const closeVehicleDetails = () => {
    setSelectedVehicle(null);
  };

  // Open ticket details modal
  const openTicketDetails = (ticketNumber: string, isCompleted = false) => {
    console.log('Opening ticket details for:', ticketNumber, 'isCompleted:', isCompleted);
    fetchTicketDetails(ticketNumber, isCompleted);
  };

  // Close ticket details modal
  const closeTicketDetails = () => {
    setSelectedTicket(null);
    setTicketError(null);
  };

  // Handle pagination for completed tickets
  const handlePageChange = (page: number) => {
    if (selectedCustomer) {
      fetchCompletedTickets(selectedCustomer.customerId, page);
    }
  };

  // Retry fetching ticket details
  const retryFetchTicketDetails = () => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket.ticket_number, serviceHistoryTab === 'completedTickets');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading data</div>
          <div className="text-gray-700">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-lg text-gray-600">View and manage all customer information</p>
        </div>

        {/* Customer List Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicles
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {customer.customerImages.length > 0 ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={customer.customerImages[0]} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {customer.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.customerType === 'company' ? customer.companyName : customer.name}
                          </div>
                          {customer.customerType === 'company' && (
                            <div className="text-sm text-gray-500">Contact: {customer.name}</div>
                          )}
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{customer.customerType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      <div className="text-sm text-gray-500">{customer.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.vehicles.length}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(customer.status)}`}>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openCustomerDetails(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-40 flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-2xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center">
                {selectedCustomer.customerImages.length > 0 ? (
                  <img 
                    className="h-16 w-16 rounded-full object-cover mr-4" 
                    src={selectedCustomer.customerImages[0]} 
                    alt={selectedCustomer.name} 
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <span className="text-gray-500 font-medium text-xl">
                      {selectedCustomer.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCustomer.customerType === 'company' ? selectedCustomer.companyName : selectedCustomer.name}
                  </h2>
                  {selectedCustomer.customerType === 'company' && (
                    <p className="text-gray-600">Contact: {selectedCustomer.name}</p>
                  )}
                  <p className="text-gray-600 capitalize">{selectedCustomer.customerType} Customer</p>
                </div>
              </div>
              <button
                onClick={closeCustomerDetails}
                className="text-gray-400 hover:text-gray-500 bg-gray-100 rounded-full p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="mt-6 flex-grow overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column - Customer Info */}
                <div className="md:w-1/3">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Customer ID</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.customerId}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.phone}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.emergencyContact}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.address}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Registration Date</p>
                        <p className="text-gray-900 font-medium">{new Date(selectedCustomer.registrationDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Total Services</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.totalServices}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Loyalty Points</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.loyaltyPoints}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(selectedCustomer.status)}`}>
                          {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                        </span>
                      </div>
                      
                      {selectedCustomer.notes && (
                        <div>
                          <p className="text-sm text-gray-500">Notes</p>
                          <p className="text-gray-900 font-medium">{selectedCustomer.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="md:w-2/3">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicles</h3>
                    <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                      {selectedCustomer.vehicles.length > 0 ? (
                        <div className="space-y-4">
                          {selectedCustomer.vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  {vehicle.vehicleImages.length > 0 ? (
                                    <img 
                                      className="h-16 w-16 rounded-lg object-cover mr-4" 
                                      src={vehicle.vehicleImages[0]} 
                                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} 
                                    />
                                  ) : (
                                    <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center mr-4">
                                      <span className="text-gray-500 font-medium">
                                        {vehicle.make.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                                    <div className="text-sm text-gray-500">VIN: {vehicle.vin}</div>
                                    <div className="text-sm text-gray-500">License: {vehicle.licensePlate}</div>
                                    <div className="text-sm text-gray-500">Color: {vehicle.color}</div>
                                    <div className="text-sm text-gray-500">Mileage: {vehicle.currentMileage.toLocaleString()} miles</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => openVehicleDetails(vehicle)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No vehicles registered</p>
                      )}
                    </div>
                  </div>

                  
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={closeCustomerDetails}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-2xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
              <button
                onClick={closeVehicleDetails}
                className="text-gray-400 hover:text-gray-500 bg-gray-100 rounded-full p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-6 flex-grow overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column - Vehicle Image */}
                <div className="md:w-1/2">
                  <div className="bg-gray-100 rounded-xl overflow-hidden">
                    {selectedVehicle.vehicleImages.length > 0 ? (
                      <img 
                        className="w-full h-64 object-cover" 
                        src={selectedVehicle.vehicleImages[0]} 
                        alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`} 
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium text-xl">
                          {selectedVehicle.make} {selectedVehicle.model}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Vehicle Info */}
                <div className="md:w-1/2">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Vehicle ID</p>
                        <p className="text-gray-900 font-medium">{selectedVehicle.id}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">VIN</p>
                        <p className="text-gray-900 font-medium">{selectedVehicle.vin}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">License Plate</p>
                        <p className="text-gray-900 font-medium">{selectedVehicle.licensePlate}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Color</p>
                        <p className="text-gray-900 font-medium">{selectedVehicle.color}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Current Mileage</p>
                        <p className="text-gray-900 font-medium">{selectedVehicle.currentMileage.toLocaleString()} miles</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={closeVehicleDetails}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service History Details Modal */}
      {(selectedTicket || ticketError) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-2xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Service History Details</h2>
                <p className="text-gray-600">
                  {selectedTicket 
                    ? `Ticket #${selectedTicket.ticket_number} - ${selectedTicket.title}` 
                    : 'Ticket Details'}
                </p>
              </div>
              <button
                onClick={closeTicketDetails}
                className="text-gray-400 hover:text-gray-500 bg-gray-100 rounded-full p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 border-b">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'ticket', label: 'Ticket Info' },
                  { id: 'bill', label: 'Bill' },
                  { id: 'disassembled', label: 'Disassembled Parts' },
                  { id: 'outsource', label: 'Outsource Mechanics' },
                  { id: 'ordered', label: 'Ordered Parts' },
                  { id: 'outsourceStock', label: 'Outsource Stock' },
                  { id: 'inspection', label: 'Inspection' },
                  { id: 'progress', label: 'Progress Logs' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6 flex-grow overflow-y-auto">
              {ticketLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : ticketError ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{ticketError}</p>
                      <div className="mt-4">
                        <button
                          onClick={retryFetchTicketDetails}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedTicket ? (
                <>
                  {/* Ticket Info Tab */}
                  {activeTab === 'ticket' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Ticket Number</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.ticket_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Vehicle</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.vehicle_info}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">License Plate</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.license_plate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Priority</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.priority}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="text-gray-900 font-medium">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="text-gray-900 font-medium">{selectedTicket.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bill Tab */}
                  {activeTab === 'bill' && selectedTicket.bills && selectedTicket.bills.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Information</h3>
                      {selectedTicket.bills.map((bill) => (
                        <div key={bill.id} className="mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Bill Number</p>
                              <p className="text-gray-900 font-medium">{bill.proforma_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Date</p>
                              <p className="text-gray-900 font-medium">{bill.proforma_date ? new Date(bill.proforma_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Status</p>
                              <p className="text-gray-900 font-medium">{bill.status}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Payment Type</p>
                              <p className="text-gray-900 font-medium">{bill.payment_type || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Subtotal</p>
                              <p className="text-gray-900 font-medium">${bill.subtotal}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Tax</p>
                              <p className="text-gray-900 font-medium">${bill.tax_amount} ({bill.tax_rate}%)</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Discount</p>
                              <p className="text-gray-900 font-medium">${bill.discount}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total</p>
                              <p className="text-gray-900 font-medium">${bill.final_total}</p>
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mb-2">Bill Items</h4>
                          <div className="bg-white rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {selectedTicket.proforma_items?.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">${item.unit_price}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">${item.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Disassembled Parts Tab */}
                  {activeTab === 'disassembled' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Disassembled Parts</h3>
                      {selectedTicket.disassembled_parts && selectedTicket.disassembled_parts.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logged At</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reassembly Verified</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedTicket.disassembled_parts.map((part) => (
                                <tr key={part.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{part.part_name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{part.condition}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{part.status}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{new Date(part.logged_at).toLocaleDateString()}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{part.reassembly_verified || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No disassembled parts recorded</p>
                      )}
                    </div>
                  )}

                  {/* Outsource Mechanics Tab */}
                  {activeTab === 'outsource' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Outsource Mechanics</h3>
                      {selectedTicket.outsource_mechanics && selectedTicket.outsource_mechanics.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanic Name</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedTicket.outsource_mechanics.map((mechanic) => (
                                <tr key={mechanic.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{mechanic.mechanic_name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{mechanic.company_name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{mechanic.task}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">${mechanic.cost}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{mechanic.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No outsource mechanics recorded</p>
                      )}
                    </div>
                  )}

                  {/* Ordered Parts Tab */}
                  {activeTab === 'ordered' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordered Parts</h3>
                      {selectedTicket.ordered_parts && selectedTicket.ordered_parts.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered At</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedTicket.ordered_parts.map((part) => (
                                <tr key={part.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{part.part_name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{part.quantity}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">${part.cost}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{part.supplier}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{new Date(part.ordered_at).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No ordered parts recorded</p>
                      )}
                    </div>
                  )}

                  {/* Outsource Stock Tab */}
                  {activeTab === 'outsourceStock' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Outsource Stock</h3>
                      {selectedTicket.outsource_stock && selectedTicket.outsource_stock.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedTicket.outsource_stock.map((stock) => (
                                <tr key={stock.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{stock.part_name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{stock.quantity}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{stock.supplier}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{new Date(stock.requested_at).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No outsource stock recorded</p>
                      )}
                    </div>
                  )}

                  {/* Inspection Tab */}
                  {activeTab === 'inspection' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Details</h3>
                      {selectedTicket.inspections && selectedTicket.inspections.length > 0 ? (
                        selectedTicket.inspections.map((inspection) => (
                          <div key={inspection.id} className="bg-white rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Inspection Date</p>
                                <p className="text-gray-900 font-medium">{new Date(inspection.inspection_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="text-gray-900 font-medium">{inspection.inspection_status}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Main Issue Resolved</p>
                                <p className="text-gray-900 font-medium">{inspection.main_issue_resolved}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Reassembly Verified</p>
                                <p className="text-gray-900 font-medium">{inspection.reassembly_verified}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">General Condition</p>
                                <p className="text-gray-900 font-medium">{inspection.general_condition}</p>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-2">Notes</p>
                              <p className="text-gray-900 font-medium">{inspection.notes}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Checklist</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {inspection.check_oil_leaks && (
                                  <div className="text-sm text-gray-900">• Oil Leaks: {inspection.check_oil_leaks}</div>
                                )}
                                {inspection.check_engine_air_filter_oil_coolant_level && (
                                  <div className="text-sm text-gray-900">• Engine/Air Filter/Oil/Coolant: {inspection.check_engine_air_filter_oil_coolant_level}</div>
                                )}
                                {inspection.check_brake_fluid_levels && (
                                  <div className="text-sm text-gray-900">• Brake Fluid: {inspection.check_brake_fluid_levels}</div>
                                )}
                                {inspection.check_gluten_fluid_levels && (
                                  <div className="text-sm text-gray-900">• Gluten Fluid: {inspection.check_gluten_fluid_levels}</div>
                                )}
                                {inspection.check_battery_timing_belt && (
                                  <div className="text-sm text-gray-900">• Battery/Timing Belt: {inspection.check_battery_timing_belt}</div>
                                )}
                                {inspection.check_tire && (
                                  <div className="text-sm text-gray-900">• Tires: {inspection.check_tire}</div>
                                )}
                                {inspection.check_tire_pressure_rotation && (
                                  <div className="text-sm text-gray-900">• Tire Pressure/Rotation: {inspection.check_tire_pressure_rotation}</div>
                                )}
                                {inspection.check_lights_wiper_horn && (
                                  <div className="text-sm text-gray-900">• Lights/Wiper/Horn: {inspection.check_lights_wiper_horn}</div>
                                )}
                                {inspection.check_door_locks_central_locks && (
                                  <div className="text-sm text-gray-900">• Door Locks/Central Locks: {inspection.check_door_locks_central_locks}</div>
                                )}
                                {inspection.check_customer_work_order_reception_book && (
                                  <div className="text-sm text-gray-900">• Work Order/Reception Book: {inspection.check_customer_work_order_reception_book}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No inspection records available</p>
                      )}
                    </div>
                  )}

                  {/* Progress Logs Tab */}
                  {activeTab === 'progress' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Logs</h3>
                      {selectedTicket.progress_logs && selectedTicket.progress_logs.length > 0 ? (
                        <div className="space-y-4">
                          {selectedTicket.progress_logs.map((log) => (
                            <div key={log.id} className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">{log.action}</div>
                                  <div className="text-sm text-gray-500 mt-1">{log.notes}</div>
                                </div>
                                <div className="text-sm text-gray-500">{new Date(log.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No progress logs recorded</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No ticket data available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={closeTicketDetails}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;