'use client';

import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Wrench,
  Calendar,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Package,
  X,
  Plus,
  FileText
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
  serialNumber: string;
  assignedQuantity: number;
  status: string;
  assigned_at: string;
  returned_at?: string;
  notes?: string;
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

  // Assignment state
  const [assignedTools, setAssignedTools] = useState<{ tool: Tool; qty: number }[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Stats
  const [activeAssignments, setActiveAssignments] = useState<AssignedTool[]>([]);
  const [returnedAssignments, setReturnedAssignments] = useState<AssignedTool[]>([]);

// === FETCH DATA ===
const fetchTickets = async () => {
  try {
    const res = await fetch('http://localhost:5001/api/tickets/service_tickets');
    if (!res.ok) throw new Error('Failed to fetch tickets');
    
    const data: ServiceTicket[] = await res.json();

    const inProgress = data.filter((t: ServiceTicket) => 
      ['in-progress', 'In Progress', 'in progress', 'assigned', 'pending'].includes(t.status)
    );
    
    setTickets(inProgress);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    setError('Could not load tickets');
  }
};

  const fetchTools = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/tools');
      if (!res.ok) throw new Error('Failed to fetch tools');
      const data = await res.json();
      setTools(data.data || []);
    } catch (err) {
      console.error('Error fetching tools:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/tools/assigned');
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      const assignments: AssignedTool[] = data.data || [];

      setActiveAssignments(assignments.filter(a => a.status === 'In Use'));
      setReturnedAssignments(assignments.filter(a => a.status === 'Returned'));
      setAssignedList(assignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  // === OPEN MODAL ===
  const openModal = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    setAssignedTools([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setAssignedTools([]);
  };

  // === ASSIGN TOOL LOGIC ===
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
      setAssignedTools([]);
      fetchAssignments(); // Refresh assigned list
    } catch (err: any) {
      console.error('Assignment error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  // === RETURN TOOL ===
  const returnTool = async (assignmentId: number, quantity: number) => {
    if (!window.confirm(`Return this tool?`)) return;

    try {
      const res = await fetch('http://localhost:5001/api/tools/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, quantity }),
      });

      const result = await res.json();

      if (result.success) {
        alert('✅ Tool returned successfully!');
        fetchAssignments(); // Refresh list
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error('Return failed:', err);
      alert('⚠️ Network error');
    }
  };

  // Get assigned tools for selected ticket
  const getAssignedToolsForTicket = () => {
    return assignedList.filter(a => a.ticket_id === selectedTicket?.id);
  };

  // Filtered tools for search
  const filteredTools = tools.filter(tool =>
    (tool.tool_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tool.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const returnedToday = returnedAssignments.filter(a => {
    if (!a.returned_at) return false;
    const date = new Date(a.returned_at);
    return date.toDateString() === new Date().toDateString();
  });

  // === EFFECTS ===
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTickets(), fetchTools(), fetchAssignments()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();

    const interval = setInterval(() => {
      fetchTickets();
      fetchAssignments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">Loading service tickets...</p>
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
    <div className="space-y-6 animate-fade-in">
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
              <p className="text-green-100">Returned</p>
              <p className="text-3xl font-bold">{returnedAssignments.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Returned Today</p>
              <p className="text-3xl font-bold">{returnedToday.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Assignments</p>
              <p className="text-3xl font-bold">{activeAssignments.length + returnedAssignments.length}</p>
            </div>
            <Package className="w-8 h-8 text-purple-200 animate-spin" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
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
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No in-progress tickets found.</div>
        ) : (
          tickets.map((ticket) => {
            const assignedTools = getAssignedToolsForTicket();
            return (
              <div
                key={ticket.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => openModal(ticket)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
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
                            <strong>Vehicle:</strong> {ticket.year} {ticket.make} {ticket.model} ({ticket.license_plate})
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
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(ticket);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
                      title="Manage Tools"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assigned Tools List */}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              returnTool(tool.assignmentId, tool.assignedQuantity);
                            }}
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

      {/* Tool Management Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Manage Tools - {selectedTicket.ticket_number}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Available Tools to Assign */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Assign Tools</h3>
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
                    <p className="font-medium text-gray-800">{tool.tool_name}</p>
                    <p className="text-sm text-gray-600">{tool.brand}</p>
                    <p className={`text-sm font-medium ${tool.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tool.quantity} Available
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Tools to Assign */}
            {assignedTools.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tools to Assign</h3>
                <div className="space-y-2">
                  {assignedTools.map(({ tool, qty }) => (
                    <div key={tool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{tool.tool_name}</p>
                        <p className="text-sm text-gray-600">{tool.brand}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(tool.id, qty - 1); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{qty}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(tool.id, qty + 1); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromAssignment(tool.id); }}
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

            {/* Confirm Assignment */}
            {assignedTools.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={confirmAssignment}
                  disabled={assigning}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg disabled:opacity-70"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            )}

            {/* Currently Assigned Tools */}
            {getAssignedToolsForTicket().length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Currently Assigned Tools</h3>
                <div className="space-y-2">
                  {getAssignedToolsForTicket().map((tool) => (
                    <div key={tool.assignmentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{tool.tool_name}</p>
                        <p className="text-sm text-gray-600">{tool.brand} × {tool.assignedQuantity}</p>
                      </div>
                      <button
                        onClick={() => returnTool(tool.assignmentId, tool.assignedQuantity)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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