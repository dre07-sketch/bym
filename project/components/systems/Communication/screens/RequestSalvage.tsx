import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define data types
interface ServiceTicket {
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

interface ProgressLog {
  id: number;
  ticket_number: string;
  date: string;
  time: string;
  status: string;
  description: string;
  created_at: string;
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
  check_oil_leaks: string;
  check_engine_air_filter_oil_coolant_level: string;
  check_brake_fluid_levels: string;
  check_gluten_fluid_levels: string;
  check_battery_timing_belt: string;
  check_tire: string;
  check_tire_pressure_rotation: string;
  check_lights_wiper_horn: string;
  check_door_locks_central_locks: string;
  check_customer_work_order_reception_book: string;
  checklist: InspectionChecklist;
  mainIssueResolvedBoolean: boolean | null;
  reassemblyVerifiedBoolean: boolean | null;
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

interface ApiResponse {
  success: boolean;
  tickets: ServiceTicket[];
  disassembledParts: DisassembledPart[];
  logs: ProgressLog[];
  inspections: Inspection[];
  mechanics: Mechanic[];
  tools: ToolAssignment[];
  orderedParts: OrderedPart[];
  outsourceStock: OutsourceStock[];
}

const formatInspectionChecklist = (inspection: Inspection): Inspection => {
  // Convert string values to booleans for main_issue_resolved and reassembly_verified
  const mainIssueResolvedBoolean = inspection.main_issue_resolved === 'Resolved' ? true : 
                                    inspection.main_issue_resolved === 'Not Resolved' ? false : null;
  
  const reassemblyVerifiedBoolean = inspection.reassembly_verified === 'Yes' ? true : 
                                    inspection.reassembly_verified === 'No' ? false : null;

  return {
    ...inspection,
    mainIssueResolvedBoolean,
    reassemblyVerifiedBoolean,
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

const ChecklistItem: React.FC<{ label: string; value: boolean | null }> = ({ label, value }) => {
  if (value === true) {
    return (
      <li className="flex items-center text-sm">
        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-green-600">{label}</span>
      </li>
    );
  } else if (value === false) {
    return (
      <li className="flex items-center text-sm">
        <svg className="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-red-600">{label}</span>
      </li>
    );
  } else {
    return (
      <li className="flex items-center text-sm">
        <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-gray-500">{label}</span>
      </li>
    );
  }
};

const StatusItem: React.FC<{ label: string; value: boolean | null }> = ({ label, value }) => {
  if (value === true) {
    return (
      <div className="flex items-center">
        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-green-600 font-medium">{label}</span>
      </div>
    );
  } else if (value === false) {
    return (
      <div className="flex items-center">
        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-red-600 font-medium">{label}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center">
        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-gray-500 font-medium">{label}</span>
      </div>
    );
  }
};

const SalvageFormPage: React.FC = () => {
  const [salvageData, setSalvageData] = useState<ApiResponse | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Fetch salvage form data
  useEffect(() => {
    const fetchSalvageData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/communication-center/awaiting-salvage-form');
        setSalvageData(response.data);
      } catch (error) {
        console.error('Error fetching salvage form data:', error);
        setNotification({ message: 'Failed to fetch salvage form data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchSalvageData();
  }, []);

  const handleViewClick = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setActiveTab('Overview');
    setShowModal(true);
  };

  const handleRequestPayment = async () => {
    if (!selectedTicket) return;
    
    setPaymentLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/communication-center/service-tickets/request-payment', {
        ticket_number: selectedTicket.ticket_number
      });
      
      // Show success notification
      setNotification({ message: response.data.message, type: 'success' });
      
      // Update the ticket status in the local state
      if (salvageData) {
        const updatedTickets = salvageData.tickets.map(ticket => 
          ticket.ticket_number === selectedTicket.ticket_number 
            ? { ...ticket, status: 'request payment' } 
            : ticket
        );
        
        setSalvageData({
          ...salvageData,
          tickets: updatedTickets
        });
        
        // Update the selected ticket
        setSelectedTicket({
          ...selectedTicket,
          status: 'request payment'
        });
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error requesting payment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to request payment';
      setNotification({ message: errorMessage, type: 'error' });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'awaiting survey':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting bill':
        return 'bg-purple-100 text-purple-800';
      case 'awaiting salvage form':
        return 'bg-orange-100 text-orange-800';
      case 'request payment':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get ticket details for selected ticket
  const getTicketDetails = () => {
    if (!selectedTicket || !salvageData) return null;

    return {
      disassembledParts: salvageData.disassembledParts.filter(part => part.ticket_number === selectedTicket.ticket_number),
      logs: salvageData.logs.filter(log => log.ticket_number === selectedTicket.ticket_number),
      inspections: salvageData.inspections
        .filter(inspection => inspection.ticket_number === selectedTicket.ticket_number)
        .map(inspection => formatInspectionChecklist(inspection)),
      mechanics: salvageData.mechanics.filter(mechanic => mechanic.ticket_number === selectedTicket.ticket_number),
      tools: salvageData.tools.filter(tool => tool.ticket_number === selectedTicket.ticket_number),
      orderedParts: salvageData.orderedParts.filter(part => part.ticket_number === selectedTicket.ticket_number),
      outsourceStock: salvageData.outsourceStock.filter(stock => stock.ticket_number === selectedTicket.ticket_number),
    };
  };

  const ticketDetails = getTicketDetails();

  // Close notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!salvageData || salvageData.tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Salvage Request Form</h1>
            <p className="text-gray-600 mt-2">Manage and process salvage requests for service tickets</p>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No salvage requests</h3>
              <p className="mt-1 text-sm text-gray-500">There are currently no tickets awaiting salvage form processing.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-5 w-5 ${
              notification.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {notification.type === 'success' ? (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Salvage Request Form</h1>
          <p className="text-gray-600 mt-2">Manage and process salvage requests for service tickets</p>
          <div className="mt-4 flex items-center">
            <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {salvageData.tickets.length} tickets awaiting salvage form
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Tickets Awaiting Salvage Form</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {salvageData.tickets.map((ticket) => (
              <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-800 font-medium">{ticket.ticket_number.substring(5, 9)}</span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{ticket.title}</h3>
                        <p className="text-sm text-gray-500">Ticket: {ticket.ticket_number}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {ticket.type}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Vehicle:</span> {ticket.vehicle_info}
                      </div>
                      <div>
                        <span className="font-medium">Customer:</span> {ticket.customer_name}
                      </div>
                      <div>
                        <span className="font-medium">Inspector:</span> {ticket.inspector_assign || 'Not assigned'}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(ticket.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-4">
                    <button
                      onClick={() => handleViewClick(ticket)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Detail Modal */}
        {showModal && selectedTicket && ticketDetails && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Salvage Request: {selectedTicket.ticket_number}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 text-black">
                {/* Ticket Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Title</p>
                      <p className="font-medium">{selectedTicket.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{selectedTicket.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{selectedTicket.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle</p>
                      <p className="font-medium">{selectedTicket.vehicle_info}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Inspector</p>
                      <p className="font-medium">{selectedTicket.inspector_assign || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created Date</p>
                      <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {['Overview', 'Disassembled Parts', 'Progress Logs', 'Inspections', 'Mechanics', 'Tools', 'Ordered Parts', 'Outsource Stock'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mb-8">
                  {activeTab === 'Overview' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Overview</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{selectedTicket.description || 'No description available'}</p>
                      </div>
                      
                    
                    </div>
                  )}

                  {activeTab === 'Inspections' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Inspections</h4>
                      {ticketDetails.inspections.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {ticketDetails.inspections.map((inspection) => (
                              <li key={inspection.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">
                                      Inspection on {formatDate(inspection.inspection_date)}
                                    </p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        inspection.inspection_status === 'pass' ? 'bg-green-100 text-green-800' : 
                                        inspection.inspection_status === 'fail' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {inspection.inspection_status}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Main Issue and Reassembly Status */}
                                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <h5 className="text-sm font-medium text-gray-900 mb-2">Main Issue Status</h5>
                                        <StatusItem label="Main Issue Resolved" value={inspection.mainIssueResolvedBoolean} />
                                        <div className="mt-2 text-sm text-gray-600">
                                          Original Value: <span className="font-medium">{inspection.main_issue_resolved}</span>
                                        </div>
                                      </div>
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <h5 className="text-sm font-medium text-gray-900 mb-2">Reassembly Status</h5>
                                        <StatusItem label="Reassembly Verified" value={inspection.reassemblyVerifiedBoolean} />
                                        <div className="mt-2 text-sm text-gray-600">
                                          Original Value: <span className="font-medium">{inspection.reassembly_verified}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* General Condition */}
                                  {inspection.general_condition && (
                                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                      <h5 className="text-sm font-medium text-gray-900 mb-2">General Condition</h5>
                                      <div className="flex items-center">
                                        <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-blue-600 font-medium">{inspection.general_condition}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Checklist Items */}
                                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-900 mb-3">Vehicle Checks</h5>
                                      <ul className="space-y-2">
                                        <ChecklistItem label="Oil Leaks" value={inspection.checklist.oilLeaks} />
                                        <ChecklistItem label="Engine/Air Filter/Oil/Coolant" value={inspection.checklist.engineAirFilterOilCoolant} />
                                        <ChecklistItem label="Brake Fluid Levels" value={inspection.checklist.brakeFluidLevels} />
                                        <ChecklistItem label="Gluten Fluid Levels" value={inspection.checklist.glutenFluidLevels} />
                                        <ChecklistItem label="Battery/Timing Belt" value={inspection.checklist.batteryTimingBelt} />
                                      </ul>
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-900 mb-3">Additional Checks</h5>
                                      <ul className="space-y-2">
                                        <ChecklistItem label="Tires" value={inspection.checklist.tire} />
                                        <ChecklistItem label="Tire Pressure/Rotation" value={inspection.checklist.tirePressureRotation} />
                                        <ChecklistItem label="Lights/Wiper/Horn" value={inspection.checklist.lightsWiperHorn} />
                                        <ChecklistItem label="Door Locks/Central Locks" value={inspection.checklist.doorLocksCentralLocks} />
                                        <ChecklistItem label="Customer Work Order/Reception Book" value={inspection.checklist.customerWorkOrderReceptionBook} />
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  {/* Notes */}
                                  {inspection.notes && (
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                      <h5 className="text-sm font-medium text-gray-900 mb-2">Notes</h5>
                                      <p className="text-sm text-gray-600">{inspection.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 text-center rounded-lg">
                          <p className="text-gray-500">No inspections recorded</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Other tabs remain the same as in previous implementation */}
                  {activeTab === 'Disassembled Parts' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Disassembled Parts</h4>
                      {ticketDetails.disassembledParts.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {ticketDetails.disassembledParts.map((part) => (
                              <li key={part.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{part.part_name}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        part.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
                                      {part.reassembly_verified && (
                                        <p className="ml-4 flex items-center text-sm text-green-500">
                                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          Reassembly Verified
                                        </p>
                                      )}
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <p>
                                        {formatDate(part.logged_at)}
                                      </p>
                                    </div>
                                  </div>
                                  {part.notes && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      Notes: {part.notes}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 text-center rounded-lg">
                          <p className="text-gray-500">No disassembled parts recorded</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Ordered Parts' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Ordered Parts</h4>
                      {ticketDetails.orderedParts.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {ticketDetails.orderedParts.map((part) => (
                              <li key={part.item_id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{part.name}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        part.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {part.status}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                      <p className="flex items-center text-sm text-gray-500">
                                        {part.quantity} x ${part.price.toFixed(2)} = ${(part.quantity * part.price).toFixed(2)}
                                      </p>
                                      <p className="ml-4 flex items-center text-sm text-gray-500">
                                        SKU: {part.sku}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <p>
                                        Ordered: {formatDate(part.ordered_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 text-center rounded-lg">
                          <p className="text-gray-500">No parts ordered yet</p>
                          <p className="text-sm text-gray-400 mt-1">Parts ordered for this service will appear here</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Outsource Stock' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Outsource Stock</h4>
                      {ticketDetails.outsourceStock.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {ticketDetails.outsourceStock.map((stock) => (
                              <li key={stock.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{stock.name}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        stock.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {stock.status}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                      <p className="flex items-center text-sm text-gray-500">
                                        {stock.quantity} x ${stock.price.toFixed(2)} = ${stock.total_cost.toFixed(2)}
                                      </p>
                                      <p className="ml-4 flex items-center text-sm text-gray-500">
                                        Source: {stock.source_shop}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <p>
                                        Requested: {formatDate(stock.requested_at)}
                                      </p>
                                    </div>
                                  </div>
                                  {stock.notes && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      Notes: {stock.notes}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 text-center rounded-lg">
                          <p className="text-gray-500">No outsource stock items</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Progress Logs' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Progress Logs</h4>
                      {ticketDetails.logs.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {ticketDetails.logs.map((log) => (
                              <li key={log.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{log.description}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                                        {log.status}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                      <p className="flex items-center text-sm text-gray-500">
                                        Date: {log.date} at {log.time}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <p>
                                        Logged: {formatDate(log.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 text-center rounded-lg">
                          <p className="text-gray-500">No progress logs recorded</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Mechanics' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Mechanics</h4>
                      {ticketDetails.mechanics.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {ticketDetails.mechanics.map((mechanic) => (
                              <li key={mechanic.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{mechanic.mechanic_name}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        ${mechanic.payment?.toFixed(2) || '0.00'} Paid
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                      <p className="flex items-center text-sm text-gray-500">
                                        Phone: {mechanic.phone}
                                      </p>
                                      <p className="ml-4 flex items-center text-sm text-gray-500">
                                        Payment Method: {mechanic.payment_method}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <p>
                                        Assigned: {formatDate(mechanic.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                  {mechanic.work_done && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      Work Done: {mechanic.work_done}
                                    </div>
                                  )}
                                  {mechanic.notes && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      Notes: {mechanic.notes}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 text-center rounded-lg">
                          <p className="text-gray-500">No mechanics assigned</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Tools' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Tool Assignments</h4>
                      {ticketDetails.tools.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {ticketDetails.tools.map((tool) => (
                              <li key={tool.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{tool.tool_name}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        tool.status === 'Returned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {tool.status}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                      <p className="flex items-center text-sm text-gray-500">
                                        Quantity: {tool.assigned_quantity}
                                      </p>
                                      <p className="ml-4 flex items-center text-sm text-gray-500">
                                        Assigned By: {tool.assigned_by}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <p>
                                        Assigned: {formatDate(tool.assigned_at)}
                                        {tool.returned_at && ` | Returned: ${formatDate(tool.returned_at)}`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-6 text-center rounded-lg">
                          <p className="text-gray-500">No tools assigned</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Request Payment Button */}
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleRequestPayment}
                    disabled={paymentLoading || selectedTicket.status === 'request payment'}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                      paymentLoading || selectedTicket.status === 'request payment'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    }`}
                  >
                    {paymentLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : selectedTicket.status === 'request payment' ? (
                      'Payment Requested'
                    ) : (
                      'Request Payment'
                    )}
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

export default SalvageFormPage;