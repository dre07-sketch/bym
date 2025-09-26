'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Wrench,
  Calendar,
  Search,
  X,
  RotateCcw,
  Package,
  FileText,
} from 'lucide-react';

// === TYPES ===
interface ServiceTicket {
  id: number;
  ticket_number: string;
  customer_name: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  assigned_mechanic: string | null;
  status: string;
  vehicle_info: string | null;
  mechanic_assignments?: Array<{
    id: number;
    ticket_number: string;
    mechanic_id: number;
    mechanic_name: string;
    assigned_at: string;
  }>;
}

interface Tool {
  id: number;
  tool_name: string;
  brand: string;
  quantity: number;
  image_url?: string;
  category: string;
}

interface AssignedTool {
  assignmentId: number;
  tool_id: number;
  ticket_id: number;
  tool_name: string;
  brand: string;
  category: string;
  assignedQuantity: number;
  status: string;
  assigned_at: string;
  returned_at?: string | null;
  notes?: string;
  ticket_number: string;
  customer_name: string;
}

interface ReturnHistoryItem {
  assignment_id: number;
  ticket_number: string;
  tool_name: string;
  assigned_quantity: number;
  assigned_by: string;
  assigned_at: string;
  returned_at: string | null;
  customer_name: string;
  license_plate: string;
  vehicle_info: string | null;
}

const AssignmentReturn: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [assignedList, setAssignedList] = useState<AssignedTool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  // Assignment state
  const [assignedTools, setAssignedTools] = useState<{ tool: Tool; qty: number }[]>([]);
  const [assigning, setAssigning] = useState(false);
  
  // Stats
  const [toolStats, setToolStats] = useState<{
    returnedTools: number;
    returnedToday: number;
    totalTools: number;
    totalQuantity: number;
    toolsInUse: number;
    availableTools: number;
    damagedTools: number;
  } | null>(null);
  
  // Return history
  const [returnHistory, setReturnHistory] = useState<ReturnHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // === FETCH DATA ===
  const fetchTickets = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tickets/service_tickets');
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data: ServiceTicket[] = await res.json();
      const inProgress = data.filter((t) =>
        ['in-progress', 'in progress', 'assigned', 'pending'].includes(
          t.status.trim().toLowerCase()
        )
      );
      setTickets(inProgress);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Could not load tickets');
    }
  };

  const fetchTools = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools');
      if (!res.ok) throw new Error('Failed to fetch tools');
      const data = await res.json();
      setTools(data.data || []);
    } catch (err) {
      console.error('Error fetching tools:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools/assigned');
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      const assignments: AssignedTool[] =
        Array.isArray(data.data)
          ? data.data.map((a: any) => ({
              ...a,
              status: a.status?.trim().toLowerCase() === 'returned' ? 'Returned' : 'In Use',
            }))
          : [];
      setAssignedList(assignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchToolStats = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools/stats');
      if (!res.ok) throw new Error('Failed to fetch tool stats');
      const data = await res.json();
      setToolStats(data.data);
    } catch (err) {
      console.error('Error fetching tool stats:', err);
    }
  };

  // === OPEN MODAL ===
  const openModal = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    setAssignedTools([]);
    setReturnHistory([]);
    setDebugInfo('');
    setActiveTab('active');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setAssignedTools([]);
    setReturnHistory([]);
    setActiveTab('active');
    setDebugInfo('');
  };

  // === ASSIGN TOOL LOGIC ===
  const addToAssignment = (tool: Tool) => {
    if (tool.quantity <= 0) return;
    setAssignedTools((prev) => {
      const existing = prev.find((a) => a.tool.id === tool.id);
      if (existing) {
        if (existing.qty < tool.quantity) {
          return prev.map((a) =>
            a.tool.id === tool.id ? { ...a, qty: a.qty + 1 } : a
          );
        } else {
          alert(`Maximum available quantity reached for ${tool.tool_name}`);
          return prev;
        }
      } else {
        return [...prev, { tool, qty: 1 }];
      }
    });
  };

  const removeFromAssignment = (toolId: number) => {
    setAssignedTools((prev) => prev.filter((a) => a.tool.id !== toolId));
  };

  const updateQuantity = (toolId: number, qty: number) => {
    setAssignedTools((prev) =>
      prev.map((a) =>
        a.tool.id === toolId
          ? { ...a, qty: Math.max(1, Math.min(qty, a.tool.quantity)) }
          : a
      )
    );
  };

  const confirmAssignment = async () => {
    if (!selectedTicket || assignedTools.length === 0) return;
    setAssigning(true);
    try {
      for (const { tool, qty } of assignedTools) {
        const res = await fetch('https://ipasystem.bymsystem.com/api/tools/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolID: tool.id,
            ticketID: selectedTicket.id,
            quantity: qty,
            assignedBy: selectedTicket.mechanic_assignments?.[0]?.mechanic_name || 'Unknown Mechanic',
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to assign tool');
        }
      }
      alert('✅ Tools assigned successfully!');
      setAssignedTools([]);
      fetchAssignments();
      fetchTickets();
      if (activeTab === 'history') {
        await fetchReturnHistory(selectedTicket.ticket_number);
      }
    } catch (err: any) {
      console.error('Assignment error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  // === RETURN TOOL ===
  const returnTool = async (assignmentId: number, quantity: number) => {
    if (!window.confirm(`Are you sure you want to return this tool?`)) return;
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, quantity }),
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Tool returned successfully!');
        fetchAssignments();
        fetchTickets();
        if (activeTab === 'history' && selectedTicket) {
          await fetchReturnHistory(selectedTicket.ticket_number);
        }
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error('Return failed:', err);
      alert('⚠️ Network error');
    }
  };

  // === FETCH RETURN HISTORY FOR TICKET ===
  const fetchReturnHistory = useCallback(async (ticketNumber: string) => {
    setLoadingHistory(true);
    setDebugInfo(`Fetching return history for ticket: ${ticketNumber}`);
    try {
      const trimmedTicketNumber = ticketNumber.trim();
      const url = `https://ipasystem.bymsystem.com/api/tools/returned/${encodeURIComponent(trimmedTicketNumber)}`;
      setDebugInfo((prev) => prev + `\n➡️ Request URL: ${url}`);
      
      const res = await fetch(url);
      setDebugInfo((prev) => prev + `\n📡 Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }
      
      const data = await res.json();
      setDebugInfo((prev) => prev + `\n✅ Parsed data: ${JSON.stringify(data, null, 2)}`);
      
      // Check if the response has the expected structure
      if (data.success && Array.isArray(data.data)) {
        console.log('Setting return history:', data.data);
        setReturnHistory(data.data);
        setDebugInfo((prev) => prev + `\n📈 Loaded ${data.data.length} returned items`);
      } else {
        console.warn('No valid return history data:', data);
        setReturnHistory([]);
        setDebugInfo((prev) => prev + `\n🟨 No return history found: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      console.error('Failed to fetch return history:', err);
      setDebugInfo((prev) => prev + `\n❌ Error: ${err.message}`);
      alert(`Failed to load return history: ${err.message}`);
      setReturnHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Get currently assigned (in-use) tools
  const getAssignedToolsForTicket = () => {
    return assignedList.filter(
      (a) => a.ticket_id === selectedTicket?.id && a.status === 'In Use'
    );
  };

  // Filtered tools
  const filteredTools = tools.filter(
    (tool) =>
      tool.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter tickets based on active tab
  const displayedTickets = activeTab === 'active'
    ? tickets.filter((ticket) => {
        const assigned = assignedList.filter((a) => a.ticket_id === ticket.id);
        return assigned.length > 0 && assigned.some((a) => a.status === 'In Use');
      })
    : tickets.filter((ticket) => {
        const assigned = assignedList.filter((a) => a.ticket_id === ticket.id);
        return assigned.length > 0 && assigned.some((a) => a.status === 'Returned');
      });

  // Effects
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTickets(), fetchTools(), fetchAssignments(), fetchToolStats()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(() => {
      fetchTickets();
      fetchTools();
      fetchAssignments();
      fetchToolStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle tab change and fetch history
  useEffect(() => {
    if (isModalOpen && selectedTicket) {
      if (activeTab === 'history') {
        fetchReturnHistory(selectedTicket.ticket_number);
      } else {
        setReturnHistory([]);
        setDebugInfo(prev => prev + `\n🗑️ Cleared return history on tab switch to 'Active'`);
      }
    }
  }, [activeTab, isModalOpen, selectedTicket, fetchReturnHistory]);

  // Derived stats
  const activeAssignments = assignedList.filter((a) => a.status === 'In Use');
  const returnedAssignments = assignedList.filter((a) => a.status === 'Returned');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">Loading service tickets and tools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tool Assignment & Return
          </h1>
          <p className="text-gray-600 mt-1">Assign and return tools for in-progress tickets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Active Assignments</p>
              <p className="text-3xl font-bold">{activeAssignments.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-200 animate-pulse" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Returned Tools</p>
              <p className="text-3xl font-bold">{toolStats?.returnedTools || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="teal-100">Returned Today</p>
              <p className="text-3xl font-bold">{toolStats?.returnedToday || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-teal-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Assignments</p>
              <p className="text-3xl font-bold">{assignedList.length}</p>
            </div>
            <Package className="w-8 h-8 text-purple-200 animate-spin" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'active'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Active Tickets
        </button>
      </div>

      {/* Search Tools (only visible in Assign tab) */}
      {activeTab === 'active' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {displayedTickets.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {activeTab === 'active'
              ? 'No active tickets with assigned tools.'
              : 'No return history found for any ticket.'}
          </div>
        ) : (
          displayedTickets.map((ticket) => {
            const assigned = assignedList.filter((a) => a.ticket_id === ticket.id);
            const hasActive = assigned.some((a) => a.status === 'In Use');
            const hasReturned = assigned.some((a) => a.status === 'Returned');
            return (
              <div
                key={ticket.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => openModal(ticket)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          activeTab === 'active'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}
                      >
                        {activeTab === 'active' ? (
                          <>
                            <Clock className="w-3 h-3 inline mr-1" /> In Progress
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 inline mr-1" /> Has Returns
                          </>
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <User className="w-4 h-4" />
                          <span>
                            <strong>Mechanic:</strong> {
                              ticket.mechanic_assignments && ticket.mechanic_assignments.length > 0
                                ? ticket.mechanic_assignments.map(m => m.mechanic_name).join(', ')
                                : 'Unassigned'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <FileText className="w-4 h-4" />
                          <span>
                            <strong>Customer:</strong> {ticket.customer_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <Wrench className="w-4 h-4" />
                          <span>
                            <strong>Vehicle:</strong>{' '}
                            {ticket.vehicle_info ||
                              `${ticket.year ?? ''} ${ticket.make ?? ''} ${ticket.model ?? ''}`}
                            {ticket.license_plate ? ` (${ticket.license_plate})` : ''}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Tools Status:</p>
                        <div className="flex flex-wrap gap-1">
                          {hasActive && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              {assigned.filter((a) => a.status === 'In Use').length} In Use
                            </span>
                          )}
                          {hasReturned && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                              {assigned.filter((a) => a.status === 'Returned').length} Returned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(ticket);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Manage Tools"
                  >
                    <Wrench className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {activeTab === 'active'
                  ? `Assign/Return Tools - ${selectedTicket.ticket_number}`
                  : `Return History - ${selectedTicket.ticket_number}`}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assign Tools Tab */}
            {activeTab === 'active' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Tools</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTools.length > 0 ? (
                      filteredTools.map((tool) => (
                        <div
                          key={tool.id}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer"
                          onClick={() => addToAssignment(tool)}
                        >
                          {tool.image_url && (
                            <img
                              src={tool.image_url}
                              alt={tool.tool_name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <p className="font-medium text-gray-800">{tool.tool_name}</p>
                          <p className="text-sm text-gray-600">{tool.brand}</p>
                          <p
                            className={`text-sm font-medium ${
                              tool.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tool.quantity} Available
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-full text-gray-500">No tools match your search.</p>
                    )}
                  </div>
                </div>

                {assignedTools.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">To Assign</h3>
                    <div className="space-y-2">
                      {assignedTools.map(({ tool, qty }) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{tool.tool_name}</p>
                            <p className="text-sm text-gray-600">{tool.brand}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(tool.id, qty - 1);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{qty}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(tool.id, qty + 1);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              +
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromAssignment(tool.id);
                              }}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assignedTools.length > 0 && (
                  <div className="mb-6">
                    <button
                      onClick={confirmAssignment}
                      disabled={assigning}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg disabled:opacity-70 transition"
                    >
                      {assigning ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                  </div>
                )}

                {getAssignedToolsForTicket().length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Currently Assigned</h3>
                    <div className="space-y-2">
                      {getAssignedToolsForTicket().map((tool) => (
                        <div
                          key={tool.assignmentId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{tool.tool_name}</p>
                            <p className="text-sm text-gray-600">
                              {tool.brand} × {tool.assignedQuantity}
                            </p>
                          </div>
                          <button
                            onClick={() => returnTool(tool.assignmentId, tool.assignedQuantity)}
                            className="text-red-600 hover:text-red-800"
                            title="Return Tool"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-6 border-t">
              <button
                onClick={closeModal}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
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

export default AssignmentReturn;