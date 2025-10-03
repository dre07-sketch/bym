import React, { useState, useEffect, useMemo } from 'react';
// Define interfaces for type safety
interface StatsData {
  totalTools: number;
  totalQuantity: number;
  toolsInUse: number;
  availableTools: number;
  damagedTools: number;
  returnedTools: number;
  returnedToday: number;
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
  customer_name: string;
  mechanicName: string;
}
interface TicketGroup {
  ticketNumber: string;
  tools: ToolAssignment[];
  customerName: string;
  mechanicName: string;
  latestReturnedDate: string | null;
  toolCount: number;
}
const ReturnedToolsList: React.FC = () => {
  // State for API data
  const [stats, setStats] = useState<StatsData | null>(null);
  const [returnedTools, setReturnedTools] = useState<ToolAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for UI
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // Fetch stats data
  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const response = await fetch('http://localhost:5001/api/tools/stats');
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data as StatsData);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to fetch stats data');
        console.error(err);
      }
    };
    fetchStats();
  }, []);
  
  // Fetch returned tools data
  useEffect(() => {
    const fetchReturnedTools = async (): Promise<void> => {
      try {
        const response = await fetch('http://localhost:5001/api/tools/returned-tools');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setReturnedTools(data as ToolAssignment[]);
        } else {
          setError('Invalid data format');
        }
      } catch (err) {
        setError('Failed to fetch returned tools');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturnedTools();
  }, []);
  
  // Group tools by ticket number
  const groupedByTicket = useMemo(() => {
    const grouped: Record<string, TicketGroup> = {};
    
    returnedTools.forEach(tool => {
      const ticketNumber = tool.ticket_number;
      if (!grouped[ticketNumber]) {
        grouped[ticketNumber] = {
          ticketNumber,
          tools: [],
          customerName: tool.customer_name,
          mechanicName: tool.mechanicName,
          latestReturnedDate: tool.returned_at,
          toolCount: 0
        };
      }
      grouped[ticketNumber].tools.push(tool);
      grouped[ticketNumber].toolCount += 1;
      
      // Update the latest returned date if this tool's date is later
      if (tool.returned_at && grouped[ticketNumber].latestReturnedDate) {
        const currentDate = new Date(tool.returned_at).getTime();
        // Fixed: Add non-null assertion operator since we've already checked it's truthy
        const currentLatest = new Date(grouped[ticketNumber].latestReturnedDate!).getTime();
        if (currentDate > currentLatest) {
          grouped[ticketNumber].latestReturnedDate = tool.returned_at;
        }
      } else if (tool.returned_at) {
        grouped[ticketNumber].latestReturnedDate = tool.returned_at;
      }
    });
    
    // Convert to array and sort by latest returned date
    return Object.values(grouped).sort((a, b) => {
      const dateA = a.latestReturnedDate ? new Date(a.latestReturnedDate).getTime() : 0;
      const dateB = b.latestReturnedDate ? new Date(b.latestReturnedDate).getTime() : 0;
      return dateB - dateA; // descending
    });
  }, [returnedTools]);
  
  // Filter tickets based on search term
  const filteredTickets = useMemo(() => {
    if (!searchTerm) return groupedByTicket;
    
    return groupedByTicket.filter(ticketGroup => {
      const ticketNumber = ticketGroup.ticketNumber || '';
      const mechanicName = ticketGroup.mechanicName || '';
      const customerName = ticketGroup.customerName || '';
      
      // Check if any tool in the group matches the tool name
      const toolNamesMatch = ticketGroup.tools.some(tool => 
        tool.tool_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return (
        ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mechanicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        toolNamesMatch
      );
    });
  }, [groupedByTicket, searchTerm]);
  
  // Get tools for the selected ticket
  const getToolsForTicket = (ticketNumber: string): ToolAssignment[] => {
    return returnedTools.filter(tool => tool.ticket_number === ticketNumber);
  };
  
  // Open modal with selected ticket
  const openModal = (ticketNumber: string): void => {
    setSelectedTicket(ticketNumber);
    setIsModalOpen(true);
  };
  
  // Close modal
  const closeModal = (): void => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date: Date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tool data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <div className="text-red-500 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Data</h3>
            <p className="mt-2 text-gray-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Tool Return Management</h1>
          <p className="text-gray-600">Track and manage returned tools with ease</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 font-medium">Returned Tools</p>
                <p className="text-4xl font-bold mt-2">{stats?.returnedTools || 0}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-cyan-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 font-medium">Returned Today</p>
                <p className="text-4xl font-bold mt-2">{stats?.returnedToday || 0}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search by ticket, mechanic, customer or tool name..."
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Tickets List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Returned Tickets</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tools Count</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanic</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticketGroup: TicketGroup, index: number) => (
                  <tr key={ticketGroup.ticketNumber || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <span className="text-cyan-800 font-bold">
                            {ticketGroup.ticketNumber ? ticketGroup.ticketNumber.split('-')[1] : 'N/A'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ticketGroup.ticketNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticketGroup.toolCount}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tools
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticketGroup.mechanicName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticketGroup.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticketGroup.latestReturnedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Returned
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => openModal(ticketGroup.ticketNumber || '')}
                        className="text-cyan-600 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        View Tools
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No tickets found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search to find what you're looking for.</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Showing {filteredTickets.length} of {groupedByTicket.length} returned tickets</p>
        </div>
      </div>
      
      {/* Modal for Tools Taken */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Tools Taken - {selectedTicket}</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[70vh] p-6">
              {(() => {
                const toolsForTicket = getToolsForTicket(selectedTicket);
                return toolsForTicket.length > 0 ? (
                  <div className="space-y-4">
                    {toolsForTicket.map((tool: ToolAssignment) => (
                      <div key={tool.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{tool.tool_name}</h3>
                            <div className="mt-1 text-sm text-gray-500">
                              <p>Quantity: {tool.assigned_quantity}</p>
                              <p>Returned: {formatDate(tool.returned_at)}</p>
                              <p>Assigned by: {tool.assigned_by || 'N/A'}</p>
                              <p>Mechanic: {tool.mechanicName || 'N/A'}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Returned
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No tools found</h3>
                    <p className="mt-1 text-gray-500">No tools were taken for this ticket.</p>
                  </div>
                );
              })()}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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
export default ReturnedToolsList;