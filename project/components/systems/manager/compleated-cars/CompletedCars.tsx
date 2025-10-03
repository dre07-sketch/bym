import { useState, useEffect } from 'react';

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
  proforma_items?: ProformaItem[];
}

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

interface Insurance {
  id: number;
  ticket_number: string;
  insurance_company: string;
  insurance_phone: string;
  accident_date: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  description: string;
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
  outsource_stock: any[];
  inspections: Inspection[];
  progress_logs: ProgressLog[];
  bills: Bill[];
  insurance: Insurance | null;
}

const CompletedCars = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billDetails, setBillDetails] = useState<{bill: Bill, items: ProformaItem[]} | null>(null);
  const [billFetchedForTicket, setBillFetchedForTicket] = useState<string | null>(null);

  // Fetch completed tickets
  useEffect(() => {
    const fetchCompletedTickets = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/completed-cars/completed-tickets');
        if (!response.ok) {
          throw new Error('Failed to fetch completed tickets');
        }
        const data = await response.json();
        setTickets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTickets();
  }, []);

  // Reset bill details and active tab when selected ticket changes
  useEffect(() => {
    setBillDetails(null);
    setBillFetchedForTicket(null);
    setActiveTab('overview');
  }, [selectedTicket]);

  // Fetch bill details when a ticket is selected and bills tab is active
  useEffect(() => {
    const fetchBillDetails = async () => {
      if (!selectedTicket || activeTab !== 'bills' || billFetchedForTicket === selectedTicket.ticket_number) return;
      
      try {
        setBillLoading(true);
        const response = await fetch(`http://localhost:5001/api/bill/car-bills/${selectedTicket.ticket_number}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bill details');
        }
        const data = await response.json();
        
        if (data.success) {
          setBillDetails({
            bill: data.bill,
            items: data.items || []
          });
          setBillFetchedForTicket(selectedTicket.ticket_number);
        }
      } catch (err) {
        console.error('Error fetching bill details:', err);
      } finally {
        setBillLoading(false);
      }
    };

    if (selectedTicket && activeTab === 'bills') {
      fetchBillDetails();
    }
  }, [selectedTicket, activeTab, billFetchedForTicket]);

  // Calculate total cost for a ticket
  const calculateTotalCost = (ticket: Ticket): number => {
    const partsCost = ticket.ordered_parts.reduce((sum, part) => {
      const cost = typeof part.cost === 'string' ? parseFloat(part.cost) : part.cost;
      return sum + (cost * part.quantity);
    }, 0);
    const mechanicsCost = ticket.outsource_mechanics.reduce((sum, mechanic) => {
      const cost = typeof mechanic.cost === 'string' ? parseFloat(mechanic.cost) : mechanic.cost;
      return sum + cost;
    }, 0);
    return partsCost + mechanicsCost;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format currency values safely
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? 'N/A' : `ETB ${numValue.toFixed(2)}`;
  };

  // Format quantity safely
  const formatQuantity = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? 'N/A' : numValue.toString();
  };

  // Helper function to render checklist items
  const renderChecklistItem = (label: string, value: string | null) => {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <span className="text-gray-700">{label}</span>
        {value === 'Yes' ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : value === 'No' ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading completed tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Completed Cars</h1>
        
        {/* Table of completed tickets */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.ticket_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ticket.vehicle_info}</div>
                    <div className="text-sm text-gray-500">{ticket.license_plate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ticket.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* Use the final_total from the first bill if available */}
                    {ticket.bills.length > 0 
                      ? formatCurrency(ticket.bills[0].final_total)
                      : formatCurrency(calculateTotalCost(ticket))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-gray-600 text-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-4xl">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Ticket Details</h2>
                    <p className="text-gray-600">{selectedTicket.ticket_number}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="mt-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {['overview', 'disassembled', 'parts', 'mechanics', 'bills', 'inspections', 'logs', ...(selectedTicket.type === 'insurance' ? ['insurance'] : [])].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === 'overview' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Information</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p><span className="font-medium">Name:</span> {selectedTicket.customer_name}</p>
                            <p><span className="font-medium">ID:</span> {selectedTicket.customer_id}</p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Vehicle Information</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p><span className="font-medium">Vehicle:</span> {selectedTicket.vehicle_info}</p>
                            <p><span className="font-medium">License Plate:</span> {selectedTicket.license_plate}</p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Details</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p><span className="font-medium">Title:</span> {selectedTicket.title}</p>
                            <p><span className="font-medium">Description:</span> {selectedTicket.description}</p>
                            <p><span className="font-medium">Priority:</span> {selectedTicket.priority}</p>
                            <p><span className="font-medium">Type:</span> {selectedTicket.type}</p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Dates</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p><span className="font-medium">Created:</span> {formatDate(selectedTicket.created_at)}</p>
                            <p><span className="font-medium">Updated:</span> {formatDate(selectedTicket.updated_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'disassembled' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Disassembled Parts</h3>
                      {selectedTicket.disassembled_parts.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reassembly Verified</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logged Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedTicket.disassembled_parts.map((part) => (
                                <tr key={part.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.part_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.condition}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      part.status === 'returned' 
                                        ? 'bg-green-100 text-green-800' 
                                        : part.status === 'replaced'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {part.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {part.reassembly_verified || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(part.logged_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                          <p className="text-gray-500">No disassembled parts recorded.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'parts' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Ordered Parts</h3>
                      {selectedTicket.ordered_parts.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedTicket.ordered_parts.map((part) => (
                                <tr key={part.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.part_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.quantity}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(part.cost)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.supplier}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(part.ordered_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                          <p className="text-gray-500">No parts ordered yet.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'mechanics' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Outsource Mechanics</h3>
                      {selectedTicket.outsource_mechanics.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanic</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedTicket.outsource_mechanics.map((mechanic) => (
                                <tr key={mechanic.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mechanic.mechanic_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mechanic.company_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mechanic.task}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(mechanic.cost)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      {mechanic.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                          <p className="text-gray-500">No outsource mechanics assigned.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'bills' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h3>
                      {billLoading ? (
                        <div className="flex justify-center items-center h-64">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading bill details...</p>
                          </div>
                        </div>
                      ) : billDetails ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg max-h-[500px] overflow-y-auto">
                          <div className="border-b border-gray-200">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice #{billDetails.bill.proforma_number}</h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">Created on {formatDate(billDetails.bill.created_at)}</p>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-md font-medium text-gray-900 mb-2">Cost Breakdown</h4>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Labor Cost:</span>
                                      <span className="font-medium">{formatCurrency(billDetails.bill.labor_cost)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Parts Cost:</span>
                                      <span className="font-medium">{formatCurrency(billDetails.bill.parts_cost)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Outsourced Parts:</span>
                                      <span className="font-medium">{formatCurrency(billDetails.bill.outsourced_parts_cost)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Outsourced Labor:</span>
                                      <span className="font-medium">{formatCurrency(billDetails.bill.outsourced_labor_cost)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-t border-gray-200 mt-2 pt-2">
                                      <span className="text-gray-600">Subtotal:</span>
                                      <span className="font-medium">{formatCurrency(billDetails.bill.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Tax ({billDetails.bill.tax_rate}%):</span>
                                      <span className="font-medium">{formatCurrency(billDetails.bill.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Discount:</span>
                                      <span className="font-medium">{formatCurrency(billDetails.bill.discount)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-t border-gray-200 mt-2 pt-2 font-bold">
                                      <span className="text-gray-900">Total:</span>
                                      <span className="text-gray-900">{formatCurrency(billDetails.bill.final_total)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-md font-medium text-gray-900 mb-2">Payment Details</h4>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Status:</span>
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        billDetails.bill.status === 'paid' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {billDetails.bill.status}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-600">Payment Type:</span>
                                      <span className="font-medium capitalize">{billDetails.bill.payment_type?.replace('_', ' ') || 'N/A'}</span>
                                    </div>
                                    {billDetails.bill.proforma_date && (
                                      <div className="flex justify-between py-1">
                                        <span className="text-gray-600">Proforma Date:</span>
                                        <span className="font-medium">{formatDate(billDetails.bill.proforma_date)}</span>
                                      </div>
                                    )}
                                    {billDetails.bill.notes && (
                                      <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-700">Notes:</p>
                                        <p className="text-sm text-gray-600 mt-1">{billDetails.bill.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Proforma Items Section - Only for insurance tickets */}
                              {selectedTicket.type === 'insurance' && billDetails.items.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="text-md font-medium text-gray-900 mb-4">Proforma Items</h4>
                                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {billDetails.items.map((item) => (
                                          <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatQuantity(item.quantity)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.amount)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                          <p className="text-gray-500">No billing information available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'inspections' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Inspection Checklist</h3>
                      {selectedTicket.inspections.length > 0 ? (
                        <div>
                          {selectedTicket.inspections.map((inspection) => (
                            <div key={inspection.id} className="mb-8">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-md font-medium text-gray-900">Inspection Date: {formatDate(inspection.inspection_date)}</h4>
                                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                                  inspection.inspection_status === 'pass' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  Status: {inspection.inspection_status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderChecklistItem("Oil Leaks", inspection.check_oil_leaks)}
                                {renderChecklistItem("Engine/Air Filter/Oil/Coolant", inspection.check_engine_air_filter_oil_coolant_level)}
                                {renderChecklistItem("Brake Fluid Levels", inspection.check_brake_fluid_levels)}
                                {renderChecklistItem("Gluten Fluid Levels", inspection.check_gluten_fluid_levels)}
                                {renderChecklistItem("Battery & Timing Belt", inspection.check_battery_timing_belt)}
                                {renderChecklistItem("Tire", inspection.check_tire)}
                                {renderChecklistItem("Tire Pressure & Rotation", inspection.check_tire_pressure_rotation)}
                                {renderChecklistItem("Lights, Wiper & Horn", inspection.check_lights_wiper_horn)}
                                {renderChecklistItem("Door Locks & Central Locks", inspection.check_door_locks_central_locks)}
                                {renderChecklistItem("Customer Work Order & Reception Book", inspection.check_customer_work_order_reception_book)}
                              </div>
                              
                              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-md font-medium text-gray-900 mb-2">Additional Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600"><span className="font-medium">Main Issue Resolved:</span> {inspection.main_issue_resolved}</p>
                                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Reassembly Verified:</span> {inspection.reassembly_verified}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600"><span className="font-medium">General Condition:</span> {inspection.general_condition}</p>
                                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Notes:</span> {inspection.notes}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                          <p className="text-gray-500">No inspections recorded.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'logs' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Logs</h3>
                      {selectedTicket.progress_logs.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                          <ul className="divide-y divide-gray-200">
                            {selectedTicket.progress_logs.map((log) => (
                              <li key={log.id} className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{log.action}</p>
                                    <p className="mt-1 text-sm text-gray-500">{log.notes}</p>
                                  </div>
                                  <div className="ml-4 flex-shrink-0">
                                    <p className="text-sm text-gray-500">{formatDate(log.created_at)}</p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                          <p className="text-gray-500">No progress logs recorded.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'insurance' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
                      {selectedTicket.insurance ? (
                        <div className="space-y-6">
                          {/* Insurance Header Card */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedTicket.insurance.insurance_company}</h3>
                                <p className="text-gray-600 mt-1">Ticket: {selectedTicket.insurance.ticket_number}</p>
                              </div>
                              <div className="text-right">
                                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Active
                                </span>
                                <p className="text-sm text-gray-500 mt-1">Status</p>
                              </div>
                            </div>
                          </div>

                          {/* Insurance Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Insurance Company Card */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                              <div className="flex items-center mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">Insurance Company</h4>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <span className="text-gray-600">Company Name</span>
                                  <span className="font-medium text-gray-900">{selectedTicket.insurance.insurance_company}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Phone Number</span>
                                  <span className="font-medium text-gray-900">{selectedTicket.insurance.insurance_phone}</span>
                                </div>
                              </div>
                            </div>

                            {/* Vehicle Owner Card */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                              <div className="flex items-center mb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">Vehicle Owner</h4>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <span className="text-gray-600">Owner Name</span>
                                  <span className="font-medium text-gray-900">{selectedTicket.insurance.owner_name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <span className="text-gray-600">Phone</span>
                                  <span className="font-medium text-gray-900">{selectedTicket.insurance.owner_phone}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Email</span>
                                  <span className="font-medium text-gray-900">{selectedTicket.insurance.owner_email}</span>
                                </div>
                              </div>
                            </div>

                            {/* Accident Details Card */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                              <div className="flex items-center mb-4">
                                <div className="p-2 bg-red-100 rounded-lg mr-3">
                                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">Accident Details</h4>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <span className="text-gray-600">Accident Date</span>
                                  <span className="font-medium text-gray-900">{formatDate(selectedTicket.insurance.accident_date)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Ticket Number</span>
                                  <span className="font-medium text-gray-900">{selectedTicket.insurance.ticket_number}</span>
                                </div>
                              </div>
                            </div>

                            {/* Dates Card */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                              <div className="flex items-center mb-4">
                                <div className="p-2 bg-green-100 rounded-lg mr-3">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">Record Dates</h4>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <span className="text-gray-600">Created Date</span>
                                  <span className="font-medium text-gray-900">{formatDate(selectedTicket.insurance.created_at)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Last Updated</span>
                                  <span className="font-medium text-gray-900">{formatDate(selectedTicket.insurance.updated_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Description Section */}
                          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                            <div className="flex items-center mb-4">
                              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900">Accident Description</h4>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                              <p className="text-gray-700">{selectedTicket.insurance.description}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-200 mb-4">
                            <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No insurance information</h3>
                          <p className="text-gray-500">Insurance details are not available for this ticket.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedCars;