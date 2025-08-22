'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Eye,
  Wrench,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle,
  Clock,
  X,
  Plus,
  ArrowLeftRight,
  FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// === TYPES ===
interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  license_plate: string;
  vehicle_info: string | {
    make: string;
    model: string;
    year: number;
  };
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  technician: string | null;
  created_at: string;
  updated_at: string;
  phone?: string;
  email?: string;
}

interface Tool {
  id: string;
  toolId: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  status: string;
}

interface ToolAssignment {
  assignmentId: string;
  tool_id: string;
  tool_name: string;
  brand: string;
  category: string;
  assignedQuantity: number;
  status: string;
  assigned_at: string;
}

// === HELPER: Parse vehicle_info safely ===
function getVehicleInfo(vehicleInfo: ServiceTicket['vehicle_info']) {
  if (typeof vehicleInfo === 'string') {
    try {
      const parsed = JSON.parse(vehicleInfo);
      return {
        make: parsed.make || 'Unknown',
        model: parsed.model || 'Unknown',
        year: parsed.year || 'Unknown'
      };
    } catch (e) {
      return { make: 'Unknown', model: 'Unknown', year: 'Unknown' };
    }
  }
  return vehicleInfo;
}

// === MAIN COMPONENT ===
const ToolAssignmentDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedTools, setAssignedTools] = useState<ToolAssignment[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch in-progress tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/tickets/service_tickets');
        const data = await res.json();
        const inProgress = Array.isArray(data)
          ? data.filter(
              (t: ServiceTicket) =>
                ['in-progress', 'assigned', 'pending'].includes(t.status)
            )
          : [];
        setTickets(inProgress);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Fetch available tools
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const res = await fetch('/api/tools');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const tools = data.data
            .filter((t: any) => t.status !== 'Out of Stock')
            .map((t: any) => ({
              id: t.id,
              toolId: t.toolId,
              name: t.name,
              category: t.category,
              quantity: t.quantity,
              available: t.quantity,
              status: t.status
            }));
          setAvailableTools(tools);
        }
      } catch (err) {
        console.error('Failed to fetch tools:', err);
      }
    };

    fetchTools();
  }, []);

  // Fetch assigned tools for a ticket
  const fetchAssignedTools = async (ticketNumber: string) => {
    try {
      const res = await fetch(`/api/tools/assigned`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Filter by ticket if needed (backend should support query param)
        const filtered = data.data.filter((a: any) => a.ticket_id === ticketNumber);
        setAssignedTools(filtered);
      } else {
        setAssignedTools([]);
      }
    } catch (err) {
      console.error('Failed to fetch assigned tools:', err);
      setAssignedTools([]);
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const vehicle = getVehicleInfo(ticket.vehicle_info);
    return (
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Stats
  const totalTools = availableTools.reduce((sum, t) => sum + t.quantity, 0);
  const inUseTools = assignedTools.reduce((sum, a) => sum + a.assignedQuantity, 0);
  const availableCount = Math.max(0, totalTools - inUseTools);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tool Assignment
          </h1>
          <p className="text-gray-600 mt-1">Assign tools to in-progress service tickets</p>
        </div>
        <button
          onClick={() => selectedTicket && setShowAssignModal(true)}
          disabled={!selectedTicket}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Tools</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Pending Tickets</p>
              <p className="text-3xl font-bold">{tickets.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">In-Use Tools</p>
              <p className="text-3xl font-bold">{inUseTools}</p>
            </div>
            <Wrench className="w-8 h-8 text-green-200 animate-spin" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Available Tools</p>
              <p className="text-3xl font-bold">{availableCount}</p>
            </div>
            <Package className="w-8 h-8 text-blue-200 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets by ticket #, customer, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <p className="text-center text-gray-500">No in-progress tickets found.</p>
        ) : (
          filteredTickets.map((ticket) => {
            const vehicle = getVehicleInfo(ticket.vehicle_info);

            return (
              <div
                key={ticket.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {ticket.status.replace('-', ' ')}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          ticket.priority === 'high'
                            ? 'bg-red-500'
                            : ticket.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      >
                        {ticket.priority} priority
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{ticket.customer_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>
                            {vehicle.make} {vehicle.model} {vehicle.year}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{ticket.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      fetchAssignedTools(ticket.ticket_number);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          assignedTools={assignedTools}
          onClose={() => setSelectedTicket(null)}
          onAssignTools={() => setShowAssignModal(true)}
        />
      )}

      {/* Assign Tools Modal */}
      {showAssignModal && selectedTicket && (
        <AssignToolsModal
          ticket={selectedTicket}
          availableTools={availableTools}
          onClose={() => setShowAssignModal(false)}
          onToolAssigned={() => fetchAssignedTools(selectedTicket.ticket_number)}
        />
      )}
    </div>
  );
};

// === MODAL COMPONENTS (inline) ===

const TicketDetailModal = ({
  ticket,
  assignedTools,
  onClose,
  onAssignTools
}: {
  ticket: ServiceTicket;
  assignedTools: ToolAssignment[];
  onClose: () => void;
  onAssignTools: () => void;
}) => {
  const vehicle = getVehicleInfo(ticket.vehicle_info);

  const handleReturnTools = async () => {
    if (!window.confirm(`Return all ${assignedTools.length} assigned tools?`)) return;

    const promises = assignedTools.map((tool) =>
      fetch('/api/tools/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: tool.assignmentId,
          quantity: tool.assignedQuantity,
          returnedBy: 'System'
        })
      })
    );

    try {
      await Promise.all(promises);
      alert('All tools returned successfully.');
      onClose();
    } catch (err) {
      alert('Failed to return tools.');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Ticket Details - {ticket.ticket_number}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Customer</label>
              <p className="text-gray-800 font-medium">{ticket.customer_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Vehicle</label>
              <p className="text-gray-800">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-sm text-gray-600">Plate: {ticket.license_plate}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Technician</label>
              <p className="text-gray-800">{ticket.technician || 'Not assigned'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {ticket.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-800">{new Date(ticket.created_at).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Priority</label>
              <span
                className={`px-3 py-1 rounded-full text-sm text-white ${
                  ticket.priority === 'high'
                    ? 'bg-red-500'
                    : ticket.priority === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
              >
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-500 mb-2">Job Description</label>
          <p className="p-3 bg-gray-50 rounded-lg text-gray-800">{ticket.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-500">Assigned Tools</label>
            <button
              onClick={onAssignTools}
              className="flex items-center space-x-1 text-blue-600 hover:underline"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tools</span>
            </button>
          </div>
          {assignedTools.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tools assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {assignedTools.map((tool) => (
                <div key={tool.assignmentId} className="p-3 border border-gray-200 rounded-lg flex justify-between">
                  <div>
                    <p className="font-medium">{tool.tool_name}</p>
                    <p className="text-sm text-gray-600">{tool.category} • Qty: {tool.assignedQuantity}</p>
                  </div>
                  <Wrench className="w-5 h-5 text-green-600" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-4 pt-6 border-t">
          <button
            onClick={onAssignTools}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Assign Tools
          </button>

          {assignedTools.length > 0 && (
            <button
              onClick={handleReturnTools}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Return All Tools
            </button>
          )}

          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AssignToolsModal = ({
  ticket,
  availableTools,
  onClose,
  onToolAssigned
}: {
  ticket: ServiceTicket;
  availableTools: Tool[];
  onClose: () => void;
  onToolAssigned: () => void;
}) => {
  const [selectedToolId, setSelectedToolId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const selectedTool = availableTools.find(t => t.id === selectedToolId);

  const handleAssign = async () => {
    if (!selectedTool || quantity < 1 || quantity > selectedTool.available) {
      alert('Please select a valid tool and quantity.');
      return;
    }

    const res = await fetch('/api/tools/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolID: selectedTool.id,
        ticketID: ticket.id,
        quantity,
        assignedBy: 'Mechanic' // Replace with dynamic user
      })
    });

    if (res.ok) {
      alert('Tool assigned successfully!');
      onToolAssigned();
      onClose();
    } else {
      const data = await res.json();
      alert(`Error: ${data.message || 'Failed to assign tool'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Assign Tool to {ticket.ticket_number}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Tool</label>
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">Choose a tool</option>
              {availableTools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name} ({tool.available} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max={selectedTool?.available || 1}
              disabled={!selectedTool}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex space-x-4 pt-6 border-t">
          <button
            onClick={handleAssign}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Assign Tool
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolAssignmentDashboard;