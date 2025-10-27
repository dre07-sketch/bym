import { useState, useEffect } from 'react';

// TypeScript interfaces (same as before)
interface Ticket {
  id: number;
  ticket_number: string;
  customer_type: string;
  customer_id: number;
  customer_name: string;
  vehicle_id: number;
  vehicle_info: string;
  license_plate: string;
  title: string;
  outsource_mechanic: string;
  inspector_assign: string;
  description: string;
  priority: string;
  type: string;
  urgency_level: string;
  status: string;
  appointment_id: number;
  created_at: string;
  updated_at: string;
  completion_date: string;
  estimated_completion_date: string;
}

interface DisassembledPart {
  id: number;
  ticket_number: string;
  part_name: string;
  part_condition: string;
  status: string;
  notes: string;
  logged_at: string;
  reassembly_verified: boolean;
}

interface Log {
  id: number;
  ticket_number: string;
  date: string;
  time: string;
  status: string;
  description: string;
  created_at: string;
}

interface Inspection {
  id: number;
  ticket_number: string;
  main_issue_resolved: boolean;
  reassembly_verified: boolean;
  general_condition: string;
  notes: string;
  inspection_date: string;
  inspection_status: string;
  created_at: string;
  updated_at: string;
  check_oil_leaks: boolean;
  check_engine_air_filter_oil_coolant_level: boolean;
  check_brake_fluid_levels: boolean;
  check_gluten_fluid_levels: boolean;
  check_battery_timing_belt: boolean;
  check_tire: boolean;
  check_tire_pressure_rotation: boolean;
  check_lights_wiper_horn: boolean;
  check_door_locks_central_locks: boolean;
  check_customer_work_order_reception_book: boolean;
}

interface Mechanic {
  id: number;
  ticket_number: string;
  mechanic_name: string;
  phone: string;
  payment: number;
  payment_method: string;
  work_done: string;
  notes: string;
  created_at: string;
}

interface Tool {
  id: number;
  tool_id: number;
  tool_name: string;
  ticket_id: number;
  ticket_number: string;
  assigned_quantity: number;
  assigned_by: string;
  status: string;
  assigned_at: string;
  returned_at: string;
  updated_at: string;
}

interface OrderedPart {
  item_id: number;
  ticket_number: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  quantity: number;
  status: string;
  ordered_at: string;
}

interface OutsourceStock {
  id: number;
  ticket_number: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  quantity: number;
  source_shop: string;
  status: string;
  requested_at: string;
  received_at: string;
  notes: string;
  updated_at: string;
  total_cost: number;
}

// New interfaces for Bill data
interface Bill {
  id: number;
  ticket_number: string;
  proforma_number: string;
  proforma_id: number | null;
  proforma_date: string | null;
  customer_name: string;
  vehicle_info: string;
  labor_cost: number;
  parts_cost: number;
  outsourced_parts_cost: number;
  outsourced_labor_cost: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  discount: number;
  final_total: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ProformaItem {
  id: number;
  proforma_id: number;
  description: string;
  size: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

interface BillResponse {
  success: boolean;
  bill: Bill;
  items: ProformaItem[];
}

// New interface for Insurance
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

interface ApiResponse {
  success: boolean;
  tickets: Ticket[];
  disassembledParts: DisassembledPart[];
  logs: Log[];
  inspections: Inspection[];
  mechanics: Mechanic[];
  tools: Tool[];
  orderedParts: OrderedPart[];
  outsourceStock: OutsourceStock[];
  insurance: Insurance[]; // Added insurance
}

// Helper function to safely convert to number and format
const formatCurrency = (value: any): string => {
  const num = typeof value === 'number' ? value : parseFloat(value || 0);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const PaymentRequestedPage = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('parts');
  const [billData, setBillData] = useState<BillResponse | null>(null);
  const [billLoading, setBillLoading] = useState<boolean>(false);
  
  // State for API data
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment requested tickets
  useEffect(() => {
    const fetchPaymentRequestedData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ipasystem.bymsystem.com/api/communication-center/payment-requested');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.success) {
          setApiData(data);
        } else {
          setError('Failed to fetch payment requested data');
        }
      } catch (err) {
        console.error('Error fetching payment requested data:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentRequestedData();
  }, []);

  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    setActiveTab('parts'); // Reset to first tab when opening modal
    setBillData(null); // Reset bill data when opening new modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setBillData(null);
  };

  // Get related data for the selected ticket
  const getRelatedData = () => {
    if (!selectedTicket || !apiData) return {
      disassembledParts: [],
      logs: [],
      inspections: [],
      mechanics: [],
      tools: [],
      orderedParts: [],
      outsourceStock: [],
      insurance: [] // Added insurance
    };

    return {
      disassembledParts: apiData.disassembledParts.filter(part => part.ticket_number === selectedTicket.ticket_number),
      logs: apiData.logs.filter(log => log.ticket_number === selectedTicket.ticket_number),
      inspections: apiData.inspections.filter(inspection => inspection.ticket_number === selectedTicket.ticket_number),
      mechanics: apiData.mechanics.filter(mechanic => mechanic.ticket_number === selectedTicket.ticket_number),
      tools: apiData.tools.filter(tool => tool.ticket_number === selectedTicket.ticket_number),
      orderedParts: apiData.orderedParts.filter(part => part.ticket_number === selectedTicket.ticket_number),
      outsourceStock: apiData.outsourceStock.filter(stock => stock.ticket_number === selectedTicket.ticket_number),
      insurance: apiData.insurance.filter(insurance => insurance.ticket_number === selectedTicket.ticket_number) // Added insurance
    };
  };

  const relatedData = getRelatedData();

  // Fetch bill data when the bills tab is selected
  useEffect(() => {
    if (activeTab === 'bills' && selectedTicket && !billData) {
      setBillLoading(true);
      
      const fetchBillData = async () => {
        try {
          const response = await fetch(`https://ipasystem.bymsystem.com/api/bill/car-bills/${selectedTicket.ticket_number}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data: BillResponse = await response.json();
          
          if (data.success) {
            setBillData(data);
          } else {
            setBillData(null);
          }
        } catch (err) {
          console.error('Error fetching bill data:', err);
          setBillData(null);
        } finally {
          setBillLoading(false);
        }
      };

      fetchBillData();
    }
  }, [activeTab, selectedTicket, billData]);

  // Tab navigation items - Always include the Bills tab
  const tabs = [
    { id: 'parts', name: 'Parts', count: relatedData.disassembledParts.length },
    { id: 'logs', name: 'Logs', count: relatedData.logs.length },
    { id: 'inspections', name: 'Inspections', count: relatedData.inspections.length },
    { id: 'mechanics', name: 'Mechanics', count: relatedData.mechanics.length },
    { id: 'tools', name: 'Tools', count: relatedData.tools.length },
    { id: 'ordered', name: 'Ordered', count: relatedData.orderedParts.length },
    { id: 'outsourced', name: 'Outsourced', count: relatedData.outsourceStock.length },
    { id: 'insurance', name: 'Insurance', count: relatedData.insurance.length }, // Added insurance tab
    { id: 'bills', name: 'Bills', count: 1 } // Always show the Bills tab with count 1
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Requested</h1>
          <p className="text-lg text-gray-600">Service tickets awaiting payment processing</p>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tickets List */}
        {!loading && !error && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Payment Requested Tickets</h2>
              <p className="mt-1 text-sm text-gray-500">List of all tickets with payment pending</p>
            </div>
            
            {apiData && apiData.tickets.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {apiData.tickets.map((ticket) => (
                  <li key={ticket.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-indigo-600 truncate">{ticket.ticket_number}</p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ticket.priority === 'High' ? 'bg-red-100 text-red-800' : 
                              ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="truncate">{ticket.customer_name}</span>
                            <span className="mx-2">•</span>
                            <span>{ticket.vehicle_info}</span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => openModal(ticket)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment requested tickets</h3>
                <p className="mt-1 text-sm text-gray-500">There are currently no tickets awaiting payment.</p>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {isModalOpen && selectedTicket && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          Ticket Details: {selectedTicket.ticket_number}
                        </h3>
                        <button
                          type="button"
                          className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={closeModal}
                        >
                          <span className="sr-only">Close</span>
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Ticket Information */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Ticket Information</h4>
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                <dd className="text-sm text-gray-900">{selectedTicket.customer_name}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Vehicle</dt>
                                <dd className="text-sm text-gray-900">{selectedTicket.vehicle_info}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">License Plate</dt>
                                <dd className="text-sm text-gray-900">{selectedTicket.license_plate}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                                <dd className="text-sm text-gray-900">{selectedTicket.type}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                                <dd className={`text-sm font-medium ${
                                  selectedTicket.priority === 'High' ? 'text-red-600' : 
                                  selectedTicket.priority === 'Medium' ? 'text-yellow-600' : 
                                  'text-green-600'
                                }`}>
                                  {selectedTicket.priority}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="text-sm font-medium text-indigo-600">{selectedTicket.status}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="text-sm text-gray-900">{new Date(selectedTicket.created_at).toLocaleDateString()}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Est. Completion</dt>
                                <dd className="text-sm text-gray-900">{new Date(selectedTicket.estimated_completion_date).toLocaleDateString()}</dd>
                              </div>
                            </dl>
                          </div>
                          
                          {/* Service Description */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Service Description</h4>
                            <p className="text-sm text-gray-700 mb-4">{selectedTicket.description}</p>
                            
                            <h4 className="text-md font-medium text-gray-900 mb-3">Assigned Personnel</h4>
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Mechanic</dt>
                                <dd className="text-sm text-gray-900">{selectedTicket.outsource_mechanic}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Inspector</dt>
                                <dd className="text-sm text-gray-900">{selectedTicket.inspector_assign}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                        
                        {/* Tabs for Related Data */}
                        <div className="mt-6">
                          <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                              {tabs.map((tab) => (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                      ? 'border-indigo-500 text-indigo-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  {tab.name}
                                  {tab.count > 0 && (
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                      activeTab === tab.id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-900'
                                    }`}>
                                      {tab.count}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </nav>
                          </div>
                          
                          {/* Tab Content */}
                          <div className="mt-4">
                            {/* Bills Tab */}
                            {activeTab === 'bills' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Bill Details</h4>
                                {billLoading ? (
                                  <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                  </div>
                                ) : billData ? (
                                  <div className="space-y-6">
                                    {/* Bill Summary Card */}
                                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="text-lg font-semibold text-gray-900">Bill #{billData.bill.id}</h3>
                                          <p className="text-gray-600 mt-1">Proforma: {billData.bill.proforma_number || 'N/A'}</p>
                                          <div className="mt-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                              billData.bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-green-100 text-green-800'
                                            }`}>
                                              {billData.bill.status}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-gray-500">Final Total</p>
                                          <p className="text-xl font-bold text-gray-900">${formatCurrency(billData.bill.final_total)}</p>
                                        </div>
                                      </div>
                                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <p className="text-gray-500">Customer</p>
                                          <p className="font-medium text-gray-900">{billData.bill.customer_name}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Vehicle</p>
                                          <p className="font-medium text-gray-900">{billData.bill.vehicle_info}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Date</p>
                                          <p className="font-medium text-gray-900">
                                            {billData.bill.proforma_date ? new Date(billData.bill.proforma_date).toLocaleDateString() : 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Cost Breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Labor Cost</p>
                                        <p className="text-lg font-semibold text-gray-900">${formatCurrency(billData.bill.labor_cost)}</p>
                                      </div>
                                      
                                      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Parts Cost</p>
                                        <p className="text-lg font-semibold text-gray-900">${formatCurrency(billData.bill.parts_cost)}</p>
                                      </div>
                                      
                                      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Outsourced Parts</p>
                                        <p className="text-lg font-semibold text-gray-900">${formatCurrency(billData.bill.outsourced_parts_cost)}</p>
                                      </div>
                                      
                                      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Tax</p>
                                        <p className="text-lg font-semibold text-gray-900">${formatCurrency(billData.bill.tax_amount)}</p>
                                      </div>
                                    </div>

                                    {/* Bill Items */}
                                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                                      <div className="px-6 py-4 border-b border-gray-200">
                                        <h4 className="text-md font-medium text-gray-900">Bill Items</h4>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {billData.items.map((item) => (
                                              <tr key={item.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(item.unit_price)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatCurrency(item.amount)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* Payment Summary */}
                                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                                      <h4 className="text-md font-medium text-gray-900 mb-4">Payment Summary</h4>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">Subtotal</span>
                                          <span className="font-medium text-gray-900">${formatCurrency(billData.bill.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">Tax ({(billData.bill.tax_rate * 100).toFixed(0)}%)</span>
                                          <span className="font-medium text-gray-900">${formatCurrency(billData.bill.tax_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">Discount</span>
                                          <span className="font-medium text-green-600">-${formatCurrency(billData.bill.discount)}</span>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                                          <span className="text-base font-medium text-gray-900">Total</span>
                                          <span className="text-lg font-bold text-indigo-700">${formatCurrency(billData.bill.final_total)}</span>
                                        </div>
                                      </div>
                                      {billData.bill.notes && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                          <p className="text-sm text-gray-500">Notes</p>
                                          <p className="text-sm text-gray-700 mt-1">{billData.bill.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No bill found</h3>
                                    <p className="mt-1 text-sm text-gray-500">No bill information is available for this ticket.</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Insurance Tab */}
                            {activeTab === 'insurance' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Insurance Information</h4>
                                {relatedData.insurance.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.insurance.map((insurance) => (
                                        <li key={insurance.id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">{insurance.insurance_company}</p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                  {insurance.owner_name}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                              <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                  Phone: {insurance.insurance_phone}
                                                </p>
                                              </div>
                                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                  Accident: {new Date(insurance.accident_date).toLocaleDateString()}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2">
                                              <p className="text-sm text-gray-700">{insurance.description}</p>
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                              <div>
                                                <p className="text-gray-500">Owner Name</p>
                                                <p className="font-medium text-gray-900">{insurance.owner_name}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Owner Phone</p>
                                                <p className="font-medium text-gray-900">{insurance.owner_phone}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Owner Email</p>
                                                <p className="font-medium text-gray-900">{insurance.owner_email}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Created</p>
                                                <p className="font-medium text-gray-900">{new Date(insurance.created_at).toLocaleDateString()}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No insurance information available</p>
                                )}
                              </div>
                            )}
                            
                            {/* Other tabs remain the same... */}
                            {/* Parts Tab */}
                            {activeTab === 'parts' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Disassembled Parts</h4>
                                {relatedData.disassembledParts.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.disassembledParts.map((part) => (
                                        <li key={part.id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">{part.part_name}</p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                  part.status === 'Replaced' ? 'bg-green-100 text-green-800' :
                                                  part.status === 'Reconditioned' ? 'bg-yellow-100 text-yellow-800' :
                                                  'bg-red-100 text-red-800'
                                                }`}>
                                                  {part.status}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                              <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                  Condition: {part.part_condition}
                                                </p>
                                              </div>
                                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                  {new Date(part.logged_at).toLocaleDateString()}
                                                </p>
                                              </div>
                                            </div>
                                            {part.notes && (
                                              <div className="mt-2 text-sm text-gray-500">
                                                Notes: {part.notes}
                                              </div>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No disassembled parts recorded</p>
                                )}
                              </div>
                            )}
                            
                            {/* Logs Tab */}
                            {activeTab === 'logs' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Progress Logs</h4>
                                {relatedData.logs.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.logs.map((log) => (
                                        <li key={log.id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">{log.status}</p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                  {log.date} {log.time}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2">
                                              <p className="text-sm text-gray-700">{log.description}</p>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No progress logs recorded</p>
                                )}
                              </div>
                            )}
                            
                            {/* Inspections Tab */}
                            {activeTab === 'inspections' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Inspections</h4>
                                {relatedData.inspections.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.inspections.map((inspection) => (
                                        <li key={inspection.id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">
                                                {inspection.inspection_status}
                                              </p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                  inspection.inspection_status === 'Passed' ? 'bg-green-100 text-green-800' :
                                                  'bg-red-100 text-red-800'
                                                }`}>
                                                  {inspection.inspection_status}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                              <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                  Date: {new Date(inspection.inspection_date).toLocaleDateString()}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2">
                                              <p className="text-sm text-gray-700">
                                                General Condition: {inspection.general_condition}
                                              </p>
                                              {inspection.notes && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                  Notes: {inspection.notes}
                                                </p>
                                              )}
                                            </div>
                                            <div className="mt-3">
                                              <p className="text-sm font-medium text-gray-900">Checklist:</p>
                                              <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_oil_leaks}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Oil Leaks</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_engine_air_filter_oil_coolant_level}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Engine/Air Filter/Oil</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_brake_fluid_levels}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Brake Fluid</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_gluten_fluid_levels}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Gluten Fluid</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_battery_timing_belt}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Battery/Timing Belt</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_tire}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Tires</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_tire_pressure_rotation}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Tire Pressure/Rotation</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_lights_wiper_horn}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Lights/Wiper/Horn</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_door_locks_central_locks}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Door Locks</label>
                                                </div>
                                                <div className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={inspection.check_customer_work_order_reception_book}
                                                    readOnly
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                  />
                                                  <label className="ml-2 text-gray-700">Work Order</label>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No inspections recorded</p>
                                )}
                              </div>
                            )}
                            
                            {/* Mechanics Tab */}
                            {activeTab === 'mechanics' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Assigned Mechanics</h4>
                                {relatedData.mechanics.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.mechanics.map((mechanic) => (
                                        <li key={mechanic.id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">{mechanic.mechanic_name}</p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                  ${formatCurrency(mechanic.payment)} - {mechanic.payment_method}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                              <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                  {mechanic.phone}
                                                </p>
                                              </div>
                                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                  {new Date(mechanic.created_at).toLocaleDateString()}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2">
                                              <p className="text-sm text-gray-700">{mechanic.work_done}</p>
                                              {mechanic.notes && (
                                                <p className="mt-1 text-sm text-gray-500 italic">Notes: {mechanic.notes}</p>
                                              )}
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No mechanics assigned</p>
                                )}
                              </div>
                            )}
                            
                            {/* Tools Tab */}
                            {activeTab === 'tools' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Assigned Tools</h4>
                                {relatedData.tools.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.tools.map((tool) => (
                                        <li key={tool.id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">{tool.tool_name}</p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                  tool.status === 'Returned' ? 'bg-green-100 text-green-800' :
                                                  'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                  {tool.status}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                              <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                  Qty: {tool.assigned_quantity}
                                                </p>
                                              </div>
                                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                  Assigned: {new Date(tool.assigned_at).toLocaleDateString()}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 flex justify-between text-sm text-gray-500">
                                              <p>Assigned by: {tool.assigned_by}</p>
                                              {tool.returned_at && (
                                                <p>Returned: {new Date(tool.returned_at).toLocaleDateString()}</p>
                                              )}
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No tools assigned</p>
                                )}
                              </div>
                            )}
                            
                            {/* Ordered Parts Tab */}
                            {activeTab === 'ordered' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Ordered Parts</h4>
                                {relatedData.orderedParts.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.orderedParts.map((part) => (
                                        <li key={part.item_id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">{part.name}</p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                  part.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                  'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                  {part.status}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                              <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                  {part.category} • SKU: {part.sku}
                                                </p>
                                              </div>
                                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                  ${formatCurrency(part.price)} × {part.quantity} = ${formatCurrency(part.price * part.quantity)}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                              Ordered: {new Date(part.ordered_at).toLocaleDateString()}
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No parts ordered</p>
                                )}
                              </div>
                            )}
                            
                            {/* Outsourced Stock Tab */}
                            {activeTab === 'outsourced' && (
                              <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Outsourced Stock</h4>
                                {relatedData.outsourceStock.length > 0 ? (
                                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                      {relatedData.outsourceStock.map((stock) => (
                                        <li key={stock.id}>
                                          <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-indigo-600 truncate">{stock.name}</p>
                                              <div className="ml-2 flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                  stock.status === 'Received' ? 'bg-green-100 text-green-800' :
                                                  'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                  {stock.status}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                              <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                  {stock.category} • SKU: {stock.sku}
                                                </p>
                                              </div>
                                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                  ${formatCurrency(stock.price)} × {stock.quantity} = ${formatCurrency(stock.total_cost)}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                              Source: {stock.source_shop}
                                            </div>
                                            <div className="mt-2 flex justify-between text-sm text-gray-500">
                                              <p>Requested: {new Date(stock.requested_at).toLocaleDateString()}</p>
                                              {stock.received_at && (
                                                <p>Received: {new Date(stock.received_at).toLocaleDateString()}</p>
                                              )}
                                            </div>
                                            {stock.notes && (
                                              <div className="mt-2 text-sm text-gray-500">
                                                Notes: {stock.notes}
                                              </div>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No outsourced stock</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={closeModal}
                  >
                    Close
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

export default PaymentRequestedPage;