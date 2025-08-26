'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Eye,
  X,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Plus,
  RotateCcw,
} from 'lucide-react';

// === TYPES ===
interface Tool {
  id: number;
  tool_name: string;
  brand: string;
  quantity: number;
  image_url?: string;
  status: string;
  condition?: string;
}

interface Vehicle {
  make: string | null;
  model: string | null;
  year: number | null;
  image: string | null;
}

interface ServiceTicket {
  id: number;
  ticket_number: string;
  customer_name: string;
  license_plate: string;
  assigned_mechanic: string | null;
  status: string;
  vehicle: Vehicle | null;
  vehicle_info: string | null;
}

interface AssignedTool {
  assignmentId: number;
  tool_id: number;
  ticket_id: number;
  tool_name: string;
  brand: string;
  assignedQuantity: number;
  status: string;
  assigned_at: string;
}

interface ToolStats {
  totalTools: number;
  toolsInUse: number;
  availableTools: number;
  damagedTools: number;
  overdueReturns: number;
}

// === MAIN COMPONENT ===
const ToolRequests = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingTools, setLoadingTools] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [assignedTools, setAssignedTools] = useState<{ tool: Tool; qty: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsLoading, setStatsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toolStats, setToolStats] = useState<ToolStats>({
    totalTools: 0,
    toolsInUse: 0,
    availableTools: 0,
    damagedTools: 0,
    overdueReturns: 0,
  });
  const [assignedList, setAssignedList] = useState<AssignedTool[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<AssignedTool[]>([]);

  // === DATA FETCHING FUNCTIONS ===
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/tools/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'API error');
      }

      const { totalQuantity, toolsInUse, availableTools, damagedTools } = result.data;

      setToolStats({
        totalTools: result.data.totalTools,
        toolsInUse,
        availableTools,
        damagedTools,
        overdueReturns: 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('http://localhost:5001/api/tickets/service_tickets');
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data: ServiceTicket[] = await res.json();
      const inProgress = data.filter(t =>
        ['in-progress', 'in progress', 'In Progress', 'assigned', 'pending'].includes(t.status)
      );
      setTickets(inProgress);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchTools = async () => {
    setLoadingTools(true);
    try {
      const res = await fetch('http://localhost:5001/api/tools/tools-get');
      if (!res.ok) throw new Error('Failed to fetch tools');
      const data = await res.json();
      setTools((data.data || []).map((tool: any) => ({
        ...tool,
        tool_name: tool.tool_name || tool.name || 'Unnamed Tool',
      })));
    } catch (err) {
      console.error('Error fetching tools:', err);
    } finally {
      setLoadingTools(false);
    }
  };

  const fetchAssignedTools = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/tools/assigned');
      const data = await res.json();
      setAssignedList(data.data || []);
    } catch (err) {
      console.error('Failed to fetch assigned tools');
    }
  };

  const fetchActiveAssignments = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/tools/assigned');
      const data = await res.json();
      setActiveAssignments(data.data || []);
    } catch (err) {
      console.error('Failed to load active assignments');
    }
  };

  // === TOOL RETURN ===
  const returnTool = async (assignmentId: number, toolId: number, quantity: number) => {
    if (!assignmentId || !toolId || !quantity) {
      alert('Invalid return data');
      return;
    }

    const confirm = window.confirm(`Return ${quantity} of this tool?`);
    if (!confirm) return;

    try {
      const res = await fetch('http://localhost:5001/api/tools/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, toolID: toolId, quantity }),
      });

      const result = await res.json();

      if (result.success) {
        alert('✅ Tool returned successfully!');
        fetchStats();
        fetchAssignedTools();
        fetchActiveAssignments();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error('Return failed:', err);
      alert('⚠️ Network error. Check console.');
    }
  };

  // === ASSIGNMENT LOGIC ===
  const openToolSelector = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    setAssignedTools([]);
  };

  const addToAssignment = (tool: Tool) => {
    if (tool.quantity <= 0) return;

    setAssignedTools(prev => {
      const existing = prev.find(a => a.tool.id === tool.id);
      if (existing) {
        if (existing.qty < tool.quantity) {
          return prev.map(a => (a.tool.id === tool.id ? { ...a, qty: a.qty + 1 } : a));
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
    setAssignedTools(prev => prev.filter(a => a.tool.id !== toolId));
  };

  const updateQuantity = (toolId: number, qty: number) => {
    setAssignedTools(prev =>
      prev.map(a =>
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
        const res = await fetch('http://localhost:5001/api/tools/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolID: tool.id,
            ticketID: selectedTicket.id,
            quantity: qty,
            assignedBy: selectedTicket.assigned_mechanic || 'Unknown',
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to assign tool');
        }
      }

      alert('✅ Tools assigned successfully!');
      closeModal();
      fetchStats();
      fetchTickets();
    } catch (err: any) {
      console.error('Assignment error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    if (isModalOpen) {
      await fetchTickets();
      await fetchTools();
    }
    setRefreshing(false);
  };

  // === EFFECTS ===
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchStats();
    fetchTickets();
    fetchTools();
    fetchAssignedTools();
    fetchActiveAssignments();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchAssignedTools();
      fetchActiveAssignments();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtered tools for search
  const filteredTools = tools.filter(tool =>
    (tool.tool_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tool.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get assigned tools for a ticket
  const getAssignedToolsForTicket = (ticketId: number) => {
    return assignedList.filter(a => a.ticket_id === ticketId);
  };

  // === UI: Loading State ===
  if (loadingTickets || loadingTools) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading service data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tool Assignment
          </h1>
          <p className="text-gray-600 mt-1">Assign and return tools for in-progress tickets</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
        >
          <Clock className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Tools</p>
              <p className="text-3xl font-bold">{toolStats.totalTools}</p>
            </div>
            <Package className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Available</p>
              <p className="text-3xl font-bold">{toolStats.availableTools}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">In Use</p>
              <p className="text-3xl font-bold">{toolStats.toolsInUse}</p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-200 animate-spin" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Damaged</p>
              <p className="text-3xl font-bold">{toolStats.damagedTools}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No in-progress tickets found.</div>
        ) : (
          tickets.map((ticket) => {
            const assignedTools = getAssignedToolsForTicket(ticket.id);
            return (
              <div
                key={ticket.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Clock className="w-3 h-3 inline mr-1" />
                        In Progress
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <User className="w-4 h-4" />
                          <span>
                            <strong>Mechanic:</strong> {ticket.assigned_mechanic || 'Unassigned'}
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
    {ticket.vehicle?.make && ticket.vehicle?.model && ticket.vehicle?.year ? (
      <>
        {ticket.vehicle.year} {ticket.vehicle.make} {ticket.vehicle.model}
      </>
    ) : (
      <em>No structured vehicle data</em>
    )}
    {ticket.vehicle_info && (
      <span className="ml-2 text-sm text-gray-500">
        ({ticket.vehicle_info})
      </span>
    )}
  </span>
</div>
                      </div>

                      <div>
                        <p className="font-medium text-gray-800 mb-1">Assigned Tools:</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {assignedTools.length > 0 ? (
                            assignedTools.slice(0, 3).map((tool) => (
                              <span
                                key={tool.assignmentId}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                              >
                                {tool.tool_name} ({tool.assignedQuantity})
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No tools assigned</p>
                          )}
                          {assignedTools.length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                              +{assignedTools.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => openToolSelector(ticket)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
                      title="Assign Tool"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {assignedTools.length > 0 && (
                      <button
                        onClick={() =>
                          assignedTools.forEach((t) =>
                            returnTool(t.assignmentId, t.tool_id, t.assignedQuantity)
                          )
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                        title="Return All Tools"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Assigned Tools List with Return Button */}
                {assignedTools.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Currently Assigned:</h4>
                    <div className="space-y-2">
                      {assignedTools.map((tool) => (
                        <div
                          key={tool.assignmentId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <span>
                            {tool.tool_name} × {tool.assignedQuantity} ({tool.brand})
                          </span>
                          <button
                            onClick={() => returnTool(tool.assignmentId, tool.tool_id, tool.assignedQuantity)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tool Assignment Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Assign Tools - {selectedTicket.ticket_number}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map((tool) => (
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
                    <p className="font-medium text-black">{tool.tool_name}</p>
                   
                    <p className={`text-sm font-medium ${tool.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tool.quantity} Available
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Tools */}
            {assignedTools.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Tools</h3>
                <div className="space-y-2">
                  {assignedTools.map(({ tool, qty }) => (
                    <div key={tool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{tool.tool_name}</p>
                        <p className="text-sm text-gray-600">{tool.brand}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(tool.id, qty - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{qty}</span>
                        <button
                          onClick={() => updateQuantity(tool.id, qty + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromAssignment(tool.id)}
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

            <div className="flex space-x-4 pt-6 border-t">
              <button
                onClick={confirmAssignment}
                disabled={assigning}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolRequests;