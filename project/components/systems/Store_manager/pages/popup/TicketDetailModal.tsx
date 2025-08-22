import React from 'react';
import { X, Wrench, Package, ArrowLeftRight, Plus } from 'lucide-react';

const TicketDetailModal = ({
  ticket,
  assignedTools,
  onClose,
  onAssignTools
}: {
  ticket: any;
  assignedTools: any[];
  onClose: () => void;
  onAssignTools: () => void;
}) => {
  const vehicleInfo = typeof ticket.vehicle_info === 'string'
    ? JSON.parse(ticket.vehicle_info)
    : ticket.vehicle_info;

  const handleReturnTools = async () => {
    if (!window.confirm(`Return all ${assignedTools.length} assigned tools?`)) return;

    const promises = assignedTools.map((tool) =>
      fetch('/api/tools/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: tool.assignmentId, quantity: tool.assignedQuantity })
      })
    );

    await Promise.all(promises);
    alert('Tools returned successfully.');
    window.location.reload(); // Or refresh state
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
                {vehicleInfo?.year} {vehicleInfo?.make} {vehicleInfo?.model}
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
              <span className={`px-3 py-1 rounded-full text-sm text-white ${
                ticket.priority === 'high' ? 'bg-red-500' :
                ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
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