import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Wrench,
  User,
  Car,
  PenTool,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Phone,
  Mail,
  Ticket,
} from 'lucide-react';

const VehiclesInProgress = () => {
  const [vehiclesInProgress, setVehiclesInProgress] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterLicense, setFilterLicense] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch active tickets from API
  useEffect(() => {
    const fetchActiveTickets = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/active-tickets/active-tickets');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        const mappedVehicles = data.map((ticket) => {
          const normalizedStatus = ticket.status
            ?.replace(/\s+/g, '-')
            .toLowerCase();
          const status = ['in-progress', 'on-hold', 'completed'].includes(normalizedStatus)
            ? normalizedStatus
            : 'in-progress';

          const startDate = ticket.created_at
            ? new Date(ticket.created_at).toISOString().split('T')[0]
            : 'N/A';

          // ✅ Use estimated_completion_date for estimated
          const estimatedCompletion = ticket.estimated_completion_date
            ? new Date(ticket.estimated_completion_date).toISOString().split('T')[0]
            : 'N/A';

          // ✅ Use completion_date for final deadline
          const finalCompletionDeadline = ticket.completion_date
            ? new Date(ticket.completion_date).toISOString().split('T')[0]
            : 'N/A';

          let progress = 30;
          if (status === 'completed') progress = 100;
          else if (normalizedStatus === 'in-progress') progress = 60;
          else if (normalizedStatus === 'inspection') progress = 20;

          return {
            id: ticket.id?.toString(),
            ticketNumber: ticket.ticket_number || `TKT-${ticket.id}`,
            clientName: ticket.customer_name || 'Unknown Client',
            licensePlate: ticket.license_plate || 'XXX-XXX',
            mechanicName: ticket.mechanic_assign || 'Unassigned',
            issue: ticket.title || 'No issue title',
            problemDescription: ticket.description || 'No detailed description provided.',
            startDate,
            estimatedCompletion,
            finalCompletionDeadline, // ← New field
            progress,
            status,
            clientPhone: ticket.phone || 'N/A',
            clientEmail: ticket.email || 'N/A',
            totalCost: parseFloat(ticket.total_cost) || 0,
            notes: ticket.notes || '',
            logs: [],
            disassembledParts: [],
          };
        });

        setVehiclesInProgress(mappedVehicles);
      } catch (err) {
        console.error('Error fetching active tickets:', err);
      }
    };

    fetchActiveTickets();
  }, []);

  // Handle vehicle selection and fetch details
  const handleVehicleClick = async (vehicle) => {
    const cleanVehicle = {
      ...vehicle,
      logs: [],
      disassembledParts: [],
    };

    setSelectedVehicle(cleanVehicle);
    const ticketNumber = vehicle.ticketNumber;

    try {
      // Fetch Progress Logs
      const logsRes = await fetch(`http://localhost:5001/api/progress/progress-logs/${ticketNumber}`);
      let logs = [];
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        logs = Array.isArray(logsData.progress_logs)
          ? logsData.progress_logs.map(log => `${log.date}: ${log.description}`)
          : [];
      }

      // Fetch Disassembled Parts
      const partsRes = await fetch(`http://localhost:5001/api/disassmbled/disassembled-parts/${ticketNumber}`);
      let disassembledParts = [];
      if (partsRes.ok) {
        const partsData = await partsRes.json();
        disassembledParts = Array.isArray(partsData.disassembled_parts)
          ? partsData.disassembled_parts.map(part => ({
              name: part.part_name,
              condition: part.condition,
              status: part.status,
              notes: part.notes,
              loggedAt: part.logged_at,
            }))
          : [];
      }

      setSelectedVehicle(prev => ({
        ...prev,
        logs,
        disassembledParts,
      }));
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setSelectedVehicle(prev => ({
        ...prev,
        logs: [],
        disassembledParts: [],
      }));
    }
  };

  // Close modal
  const closeDetailModal = () => {
    setSelectedVehicle(null);
  };

  const filteredVehicles = vehiclesInProgress.filter((vehicle) => {
    return (
      (!filterLicense ||
        vehicle.licensePlate.toLowerCase().includes(filterLicense.toLowerCase())) &&
      (!filterTicket ||
        vehicle.ticketNumber.toLowerCase().includes(filterTicket.toLowerCase())) &&
      (!filterStatus || vehicle.status === filterStatus)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in-progress':
        return <Wrench className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'on-hold':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Vehicles in Progress</h2>
        <p className="text-gray-600">Track ongoing repair work and progress</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors text-black"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input
                  type="text"
                  placeholder="Search license plate..."
                  value={filterLicense}
                  onChange={(e) => setFilterLicense(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Number</label>
                <input
                  type="text"
                  placeholder="Search ticket number..."
                  value={filterTicket}
                  onChange={(e) => setFilterTicket(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All statuses</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vehicles List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Active Repairs</h3>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredVehicles.length} vehicles
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching vehicles</h3>
              <p className="text-gray-500">Try adjusting your filter criteria.</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleVehicleClick(vehicle)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(vehicle.status)}
                        <h4 className="text-lg font-semibold text-gray-900">{vehicle.clientName}</h4>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1).replace(/-/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Ticket className="w-4 h-4" />
                        <span>{vehicle.ticketNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{vehicle.licensePlate}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span title="Estimated completion">Est: {vehicle.estimatedCompletion}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-red-500" />
                          <span title="Final completion deadline">Deadline: {vehicle.finalCompletionDeadline}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold">Issue:</span> {vehicle.issue}
                      </p>
                    </div>
                    {vehicle.totalCost > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Total Cost</p>
                        <p className="font-semibold text-green-600">${vehicle.totalCost.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors ml-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVehicle && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-custom-gradient text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Vehicle Progress Details</h2>
                <button
                  onClick={closeDetailModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                    <Ticket className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ticket Number</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.ticketNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl">
                    <User className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl">
                    <Car className="w-6 h-6 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">License Plate</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.licensePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                    <Wrench className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Mechanic</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.mechanicName}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Issue</p>
                    <p className="font-semibold text-gray-900">{selectedVehicle.issue}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.startDate}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <p className="text-sm text-gray-600">Estimated Completion</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.estimatedCompletion}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl">
                      <p className="text-sm text-gray-600">Final Deadline</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.finalCompletionDeadline}</p>
                    </div>
                  </div>
                  {selectedVehicle.totalCost > 0 && (
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="font-semibold text-green-600 text-xl">${selectedVehicle.totalCost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVehicle.clientPhone && (
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.clientPhone}</p>
                    </div>
                  </div>
                )}
                {selectedVehicle.clientEmail && (
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{selectedVehicle.clientEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Problem Description */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Problem Description</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedVehicle.problemDescription}
                  </pre>
                </div>
              </div>

              {/* Notes */}
              {selectedVehicle.notes && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="text-gray-900">{selectedVehicle.notes}</p>
                </div>
              )}

              {/* Activity Log */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-500" />
                  Activity Log
                </h3>
                {Array.isArray(selectedVehicle.logs) && selectedVehicle.logs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedVehicle.logs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors group"
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:scale-125 transition-transform"></div>
                        <p className="text-gray-700 font-medium group-hover:text-gray-900">{log}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                    <PenTool className="w-10 h-10 text-gray-400 mb-3 opacity-70" />
                    <h4 className="font-semibold text-gray-700 text-lg">No Activity Logs Yet</h4>
                    <p className="text-sm text-gray-500 mt-1">This ticket is still pending initial diagnostics.</p>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-blue-400 mt-3"></div>
                  </div>
                )}
              </div>

              {/* Disassembled Parts */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-500" />
                  Disassembled Parts
                </h3>
                {Array.isArray(selectedVehicle.disassembledParts) && selectedVehicle.disassembledParts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedVehicle.disassembledParts.map((part, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-bold text-gray-900">🔧 {part.name}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span className="text-gray-600">
                            <strong>Condition:</strong> {part.condition}
                          </span>
                          <span className="text-gray-600">
                            <strong>Status:</strong> {part.status}
                          </span>
                        </div>
                        {part.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">“{part.notes}”</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Logged: {new Date(part.loggedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-dashed border-orange-200 text-center shadow-sm">
                    <Wrench className="w-10 h-10 text-orange-400 mb-3 opacity-80" />
                    <h4 className="font-semibold text-orange-700 text-lg">No Parts Disassembled</h4>
                    <p className="text-sm text-orange-500 mt-1">Inspection in progress — components not yet removed.</p>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-orange-400 mt-3"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesInProgress;