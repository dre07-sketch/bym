import { useState, useEffect } from 'react';

interface ServiceTicket {
  id: number;
  ticket_number: string;
  customer_id: number;
  customer_name: string;
  customer_type: string;
  vehicle_id: number;
  vehicle_info: string;
  license_plate: string;
  title: string;
  description: string;
  priority: string;
  type: string;
  urgency_level: string;
  status: string;
  inspector_assign: string;
  estimated_completion_date: string;
  completion_date: string;
  created_at: string;
  updated_at: string;
  bill_amount: number | null; // Added bill amount field
  disassembled_parts: DisassembledPart[];
  progress_logs: ProgressLog[];
  inspections: Inspection[];
  outsource_mechanics: OutsourceMechanic[];
  tool_assignments: ToolAssignment[];
  ordered_parts: OrderedPart[];
  outsource_stock: OutsourceStockItem[];
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

interface ProgressLog {
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
  check_oil_leaks: string; // Changed from boolean to string for Yes/No values
  check_engine_air_filter_oil_coolant_level: string;
  check_brake_fluid_levels: string;
  check_gluten_fluid_levels: string;
  check_battery_timing_belt: string;
  check_tire: string;
  check_tire_pressure_rotation: string;
  check_lights_wiper_horn: string;
  check_door_locks_central_locks: string;
  check_customer_work_order_reception_book: string;
  checklist?: InspectionChecklist; // Added formatted checklist
}

interface InspectionChecklist {
  oilLeaks: boolean | null;
  engineAirFilterOilCoolant: boolean | null;
  brakeFluidLevels: boolean | null;
  glutenFluidLevels: boolean | null;
  batteryTimingBelt: boolean | null;
  tire: boolean | null;
  tirePressureRotation: boolean | null;
  lightsWiperHorn: boolean | null;
  doorLocksCentralLocks: boolean | null;
  customerWorkOrderReceptionBook: boolean | null;
}

interface OutsourceMechanic {
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

interface ToolAssignment {
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

interface OutsourceStockItem {
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

const RequestSurveyorPage = () => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'parts' | 'inspections' | 'mechanics' | 'tools'>('overview');
  const [completingSurvey, setCompletingSurvey] = useState<boolean>(false);

  // Format inspection checklist function with proper typing
  const formatInspectionChecklist = (inspection: Inspection): Inspection => {
    return {
      ...inspection,
      checklist: {
        oilLeaks: inspection.check_oil_leaks === 'Yes' ? true : inspection.check_oil_leaks === 'No' ? false : null,
        engineAirFilterOilCoolant: inspection.check_engine_air_filter_oil_coolant_level === 'Yes' ? true : inspection.check_engine_air_filter_oil_coolant_level === 'No' ? false : null,
        brakeFluidLevels: inspection.check_brake_fluid_levels === 'Yes' ? true : inspection.check_brake_fluid_levels === 'No' ? false : null,
        glutenFluidLevels: inspection.check_gluten_fluid_levels === 'Yes' ? true : inspection.check_gluten_fluid_levels === 'No' ? false : null,
        batteryTimingBelt: inspection.check_battery_timing_belt === 'Yes' ? true : inspection.check_battery_timing_belt === 'No' ? false : null,
        tire: inspection.check_tire === 'Yes' ? true : inspection.check_tire === 'No' ? false : null,
        tirePressureRotation: inspection.check_tire_pressure_rotation === 'Yes' ? true : inspection.check_tire_pressure_rotation === 'No' ? false : null,
        lightsWiperHorn: inspection.check_lights_wiper_horn === 'Yes' ? true : inspection.check_lights_wiper_horn === 'No' ? false : null,
        doorLocksCentralLocks: inspection.check_door_locks_central_locks === 'Yes' ? true : inspection.check_door_locks_central_locks === 'No' ? false : null,
        customerWorkOrderReceptionBook: inspection.check_customer_work_order_reception_book === 'Yes' ? true : inspection.check_customer_work_order_reception_book === 'No' ? false : null
      }
    };
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/communication-center/awaiting-survey');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        // Ensure tickets is always an array
        if (data.success && Array.isArray(data.tickets)) {
          // Fetch bill amount for each ticket
          const ticketsWithBillAmount = await Promise.all(
            data.tickets.map(async (ticket: ServiceTicket) => {
              let actualBillAmount = null;
              try {
                const billRes = await fetch(`http://localhost:5001/api/bill/car-bills/${ticket.ticket_number}`);
                if (billRes.ok) {
                  const billData = await billRes.json();
                  if (billData.success && billData.bill && billData.bill.final_total) {
                    const total = parseFloat(billData.bill.final_total);
                    if (!isNaN(total)) {
                      actualBillAmount = total;
                    }
                  }
                }
              } catch (err) {
                console.warn(`No bill for ticket ${ticket.ticket_number}`, err);
              }
              
              // Format status and add bill amount
              return {
                ...ticket,
                status: ticket.status === 'in progress'
                  ? 'in-progress'
                  : ticket.status.toLowerCase().replace(/\s+/g, '-'),
                bill_amount: actualBillAmount,
              };
            })
          );
          
          // Format inspection checklists
          const ticketsWithFormattedInspections = ticketsWithBillAmount.map(ticket => {
            if (ticket.inspections && ticket.inspections.length > 0) {
              return {
                ...ticket,
                inspections: ticket.inspections.map((inspection: Inspection) => formatInspectionChecklist(inspection))
              };
            }
            return ticket;
          });
          
          setTickets(ticketsWithFormattedInspections);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load tickets. Please try again later.');
        setTickets([]); // Ensure tickets is an array even on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTicketClick = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  const handleCompleteSurvey = async () => {
    if (!selectedTicket) return;
    
    setCompletingSurvey(true);
    
    try {
      const response = await fetch(`http://localhost:5001/api/communication-center/tickets/${selectedTicket.ticket_number}/complete-survey`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update the ticket in the list
        setTickets(prevTickets => 
          prevTickets.map(ticket => 
            ticket.ticket_number === selectedTicket.ticket_number 
              ? { ...ticket, status: 'awaiting salvage form' } 
              : ticket
          )
        );
        
        // Close the modal
        handleCloseModal();
        
        // Show success message
        alert(`Survey completed for ${selectedTicket.ticket_number}. Ticket status updated to 'awaiting salvage form'.`);
      } else {
        // Show error message
        alert(data.message || 'Failed to complete survey. Please try again.');
      }
    } catch (err) {
      console.error('Error completing survey:', err);
      alert('An error occurred while completing the survey. Please try again.');
    } finally {
      setCompletingSurvey(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'awaiting survey': return 'bg-blue-100 text-blue-800';
      case 'awaiting salvage form': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Updated getChecklistColor function to properly handle undefined values
  const getChecklistColor = (value: boolean | null | undefined): string => {
    if (value === true) return 'bg-green-500';
    if (value === false) return 'bg-red-500';
    if (value === null) return 'bg-gray-300';
    return 'bg-gray-300'; // Handle undefined case
  };

  // Helper function to safely get checklist value
  const getChecklistValue = (checklist: InspectionChecklist | undefined, key: keyof InspectionChecklist): boolean | null => {
    if (!checklist || checklist[key] === undefined) {
      return null;
    }
    return checklist[key];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading survey requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-xl font-bold text-gray-800">Error Loading Data</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure tickets is always an array before mapping
  const ticketsArray = Array.isArray(tickets) ? tickets : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Service Survey Requests</h1>
          <p className="text-gray-600 mt-2">Manage and complete vehicle service surveys</p>
        </header>

        {ticketsArray.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-200 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No tickets found</h3>
            <p className="text-gray-600">No tickets with status 'awaiting survey' were found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Pending Surveys</h2>
                  <p className="text-gray-600 text-sm mt-1">Click on a ticket to view details</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Filter by:</span>
                  <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                    <option>All Statuses</option>
                    <option>Awaiting Survey</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {ticketsArray.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="p-4 md:p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  onClick={() => handleTicketClick(ticket)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 text-indigo-800 rounded-lg p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-gray-800">{ticket.ticket_number}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(ticket.urgency_level)}`}>
                            {ticket.urgency_level}
                          </span>
                        </div>
                        <p className="text-gray-600">{ticket.vehicle_info}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-6">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">{ticket.customer_name}</p>
                        <p className="text-xs text-gray-500">{ticket.inspector_assign}</p>
                        {ticket.bill_amount !== null && (
                          <p className="text-xs font-medium text-indigo-600">{formatCurrency(ticket.bill_amount)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {formatDate(ticket.estimated_completion_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Popup */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedTicket.ticket_number}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(selectedTicket.urgency_level)}`}>
                      {selectedTicket.urgency_level}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{selectedTicket.customer_name} - {selectedTicket.vehicle_info}</p>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Inspector: {selectedTicket.inspector_assign}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due: {formatDate(selectedTicket.estimated_completion_date)}
                </div>
                {selectedTicket.bill_amount !== null && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Bill Amount: {formatCurrency(selectedTicket.bill_amount)}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'progress' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('progress')}
                >
                  Progress Logs
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'parts' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('parts')}
                >
                  Parts
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'inspections' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('inspections')}
                >
                  Inspections
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'mechanics' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('mechanics')}
                >
                  Mechanics
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'tools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('tools')}
                >
                  Tools
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-grow p-6 overflow-y-auto">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Service Overview</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Ticket Number</p>
                        <p className="font-medium">{selectedTicket.ticket_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium">{selectedTicket.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium">{selectedTicket.vehicle_info}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">License Plate</p>
                        <p className="font-medium">{selectedTicket.license_plate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer</p>
                        <p className="font-medium">{selectedTicket.customer_name} ({selectedTicket.customer_type})</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Priority</p>
                        <p className="font-medium">{selectedTicket.priority}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Urgency Level</p>
                        <p className="font-medium">{selectedTicket.urgency_level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium">{selectedTicket.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Inspector</p>
                        <p className="font-medium">{selectedTicket.inspector_assign}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estimated Completion</p>
                        <p className="font-medium">{formatDate(selectedTicket.estimated_completion_date)}</p>
                      </div>
                      {selectedTicket.bill_amount !== null && (
                        <div>
                          <p className="text-sm text-gray-600">Bill Amount</p>
                          <p className="font-medium">{formatCurrency(selectedTicket.bill_amount)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="mt-1 text-gray-800">{selectedTicket.description}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'progress' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Progress Logs</h3>
                  {Array.isArray(selectedTicket.progress_logs) && selectedTicket.progress_logs.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTicket.progress_logs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(log.date)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{log.time}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{log.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-200 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No progress logs yet</h4>
                      <p className="text-gray-600 max-w-md mx-auto">Progress updates will appear here as work is completed</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'parts' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Parts Management</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Disassembled Parts</h4>
                    {Array.isArray(selectedTicket.disassembled_parts) && selectedTicket.disassembled_parts.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reassembly Verified</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedTicket.disassembled_parts.map((part) => (
                              <tr key={part.id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.part_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{part.part_condition}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(part.status)}`}>
                                    {part.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${part.reassembly_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {part.reassembly_verified ? 'Verified' : 'Not Verified'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{part.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600">No disassembled parts</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Ordered Parts</h4>
                    {Array.isArray(selectedTicket.ordered_parts) && selectedTicket.ordered_parts.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedTicket.ordered_parts.map((part) => (
                              <tr key={part.item_id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{part.category}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{part.sku}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(part.price)}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{part.quantity}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(part.status)}`}>
                                    {part.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(part.ordered_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600">No parts ordered yet</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Outsource Stock</h4>
                    {Array.isArray(selectedTicket.outsource_stock) && selectedTicket.outsource_stock.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Shop</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedTicket.outsource_stock.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.sku}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.source_shop}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(item.total_cost)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600">No outsource stock items</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'inspections' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Inspection Results</h3>
                  {Array.isArray(selectedTicket.inspections) && selectedTicket.inspections.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">General Condition</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Issue Resolved</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reassembly Verified</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTicket.inspections.map((inspection) => (
                            <tr key={inspection.id}>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inspection.inspection_date)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(inspection.inspection_status)}`}>
                                  {inspection.inspection_status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{inspection.general_condition}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${inspection.main_issue_resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {inspection.main_issue_resolved ? 'Resolved' : 'Not Resolved'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${inspection.reassembly_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {inspection.reassembly_verified ? 'Verified' : 'Not Verified'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-6 p-4 bg-white">
                        <h4 className="font-medium text-gray-700 mb-3">Inspection Checklist</h4>
                        {selectedTicket.inspections.map((inspection) => (
                          <div key={inspection.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'oilLeaks'))}`}></div>
                              <span className="text-sm">Oil Leaks Check</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'engineAirFilterOilCoolant'))}`}></div>
                              <span className="text-sm">Engine/Air Filter/Oil/Coolant Level</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'brakeFluidLevels'))}`}></div>
                              <span className="text-sm">Brake Fluid Levels</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'glutenFluidLevels'))}`}></div>
                              <span className="text-sm">Gluten Fluid Levels</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'batteryTimingBelt'))}`}></div>
                              <span className="text-sm">Battery/Timing Belt</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'tire'))}`}></div>
                              <span className="text-sm">Tire Check</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'tirePressureRotation'))}`}></div>
                              <span className="text-sm">Tire Pressure/Rotation</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'lightsWiperHorn'))}`}></div>
                              <span className="text-sm">Lights/Wiper/Horn</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'doorLocksCentralLocks'))}`}></div>
                              <span className="text-sm">Door Locks/Central Locks</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${getChecklistColor(getChecklistValue(inspection.checklist, 'customerWorkOrderReceptionBook'))}`}></div>
                              <span className="text-sm">Work Order/Reception Book</span>
                            </div>
                          </div>
                        ))}
                        
                        {selectedTicket.inspections[0]?.notes && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600">Notes</p>
                            <p className="mt-1 text-sm text-gray-800">{selectedTicket.inspections[0].notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-200 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No inspections completed yet</h4>
                      <p className="text-gray-600 max-w-md mx-auto">Inspection results will appear here once completed</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'mechanics' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Outsource Mechanics</h3>
                  {Array.isArray(selectedTicket.outsource_mechanics) && selectedTicket.outsource_mechanics.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanic Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Done</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTicket.outsource_mechanics.map((mechanic) => (
                            <tr key={mechanic.id}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{mechanic.mechanic_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{mechanic.phone}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(mechanic.payment)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{mechanic.payment_method}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{mechanic.work_done}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {selectedTicket.outsource_mechanics[0]?.notes && (
                        <div className="mt-4 p-4 bg-white">
                          <p className="text-sm text-gray-600">Notes</p>
                          <p className="mt-1 text-sm text-gray-800">{selectedTicket.outsource_mechanics[0].notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-200 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No outsource mechanics</h4>
                      <p className="text-gray-600 max-w-md mx-auto">Outsource mechanic information will appear here once assigned</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'tools' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Tool Assignments</h3>
                  {Array.isArray(selectedTicket.tool_assignments) && selectedTicket.tool_assignments.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned At</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTicket.tool_assignments.map((tool) => (
                            <tr key={tool.id}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{tool.tool_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{tool.assigned_quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{tool.assigned_by}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tool.status)}`}>
                                  {tool.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(tool.assigned_at)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{tool.returned_at ? formatDate(tool.returned_at) : 'Not returned'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-200 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No tools assigned yet</h4>
                      <p className="text-gray-600 max-w-md mx-auto">Tool assignments will appear here once assigned</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Survey Complete Button */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Last updated: {formatDate(selectedTicket.updated_at)}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompleteSurvey}
                    disabled={completingSurvey}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {completingSurvey ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Survey Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestSurveyorPage;