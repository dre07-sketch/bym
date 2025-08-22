import React, { useState, useEffect } from 'react';
import {
  Car,
  Clock,
  User,
  Wrench,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Settings,
  Battery,
  Zap,
  Shield,
  Fuel,
  Search,
  FileText,
  PenTool,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

// Define Vehicle interface
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: 'in-progress' | 'completed' | 'inspection' | 'pending' | 'awaiting bill'; // updated statuses
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCompletion: string;
  finalDeadline: string;
  technician: string;
  inspector: string; // now matches API key: inspector_assign
  services: string[];
  progress: number;
  title: string;
  description: string;
  disassembledParts: Array<{
    id: number;
    partName: string;
    condition: string;
    status: string;
    notes: string | null;
    loggedAt: string;
    reassemblyVerified: number | null;
  }>;
  progressLogs: Array<{
    id: number;
    date: string;
    time: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
  inspections: Array<{
    id: number;
    main_issue_resolved: boolean;
    reassembly_verified: boolean;
    general_condition: string;
    notes: string | null;
    inspection_date: string;
    inspection_status: string;
    created_at: string;
    updated_at: string;
  }>;
  billing: {
    subtotal: number;
    tax: number;
    total: number;
    status: 'pending' | 'paid' | 'invoiced';
    issuedDate: string;
    dueDate: string;
    items: Array<{
      description: string;
      category: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  } | null;
}

const VehicleStatus = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'logs' | 'inspections' | 'bill'>('details');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Status and Priority styling
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    inspection: 'bg-purple-100 text-purple-800 border-purple-200',
    'awaiting bill': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700 animate-pulse',
  };

  const statusIcons = {
    pending: <AlertCircle className="w-4 h-4" />,
    'in-progress': <Settings className="w-4 h-4" />,
    inspection: <AlertCircle className="w-4 h-4" />,
    'awaiting bill': <CreditCard className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
  };

  const billStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    invoiced: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
  };

  // Helper: Combine date and time into readable format
  const formatDateTime = (dateStr: string, timeStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const fullDate = new Date(date);
      fullDate.setHours(hours, minutes, 0, 0);

      return (
        fullDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ' • ' +
        fullDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })
      );
    } catch (err) {
      console.warn('Error formatting datetime:', err);
      return 'Invalid Date';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const renderDescription = (desc: string) => {
    const clean = desc.trim();
    const lines = clean
      .split(/[\n;]+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      return (
        <ul className="space-y-2">
          {lines.map((line, idx) => (
            <li key={idx} className="text-sm text-gray-800 flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p className="text-sm text-gray-800 leading-relaxed">
        {clean
          .replace(/\.\s+/g, '.\n')
          .split('\n')
          .map((s, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {s.trim()}
            </span>
          ))}
      </p>
    );
  };

  // Fetch vehicles from backend
  const fetchVehicles = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/tickets/summary');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const rawData = await response.json();
      const data = Array.isArray(rawData) ? rawData : rawData.tickets;

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected an array of tickets');
      }

      const mappedVehicles: Vehicle[] = data.map((row) => {
        const vehicleData = row.vehicle_info || {};

        // Normalize backend status to frontend keys
        let status: Vehicle['status'] = 'pending';
        const rawStatus = row.status?.toLowerCase();
        if (rawStatus.includes('complete')) status = 'completed';
        else if (rawStatus.includes('bill')) status = 'awaiting bill';
        else if (rawStatus.includes('inspect')) status = 'inspection';
        else if (rawStatus.includes('progress')) status = 'in-progress';
        else status = 'pending';

        const progressMap: Record<string, number> = {
          pending: 10,
          'in-progress': 60,
          inspection: 75,
          'awaiting bill': 90,
          completed: 100,
        };

        const services = row.title
          ? [row.title, ...(row.description ? [row.description] : [])]
          : ['Diagnostics'];

        // Mock or use real billing data
        const billing = row.billing
          ? {
              subtotal: parseFloat(row.billing.subtotal) || 0,
              tax: parseFloat(row.billing.tax) || 0,
              total: parseFloat(row.billing.total) || 0,
              status: ['pending', 'paid', 'invoiced'].includes(row.billing.status)
                ? row.billing.status
                : 'pending',
              issuedDate: row.billing.issued_date || '',
              dueDate: row.billing.due_date || '',
              items: Array.isArray(row.billing.items)
                ? row.billing.items.map((item: any) => ({
                    description: item.description || 'Service Item',
                    category: item.category || 'Labor',
                    quantity: item.quantity || 1,
                    unitPrice: parseFloat(item.unit_price) || 0,
                    totalPrice: parseFloat(item.total_price) || 0,
                  }))
                : [],
            }
          : null;

        return {
          id: row.ticket_number,
          make: String(vehicleData.make || 'Unknown'),
          model: String(vehicleData.model || 'Unknown'),
          year: typeof vehicleData.year === 'number' ? vehicleData.year : 2000,
          licensePlate: String(vehicleData.licensePlate || row.license_plate || 'N/A').toUpperCase(),
          status,
          priority: ['low', 'medium', 'high', 'urgent'].includes(row.priority) ? row.priority : 'medium',
          estimatedCompletion: row.estimated_completion_date || row.completion_date || '',
          finalDeadline: row.completion_date || '',
          technician: row.mechanic_assign || 'Unassigned',
          inspector: row.inspector_assign || 'Unassigned', // ✅ Matches API key
          services,
          progress: progressMap[status] || 0,
          title: row.title || 'Service Ticket',
          description: row.description || 'No additional details provided.',
          disassembledParts: (row.disassembled_parts || []).map((part: any) => ({
            id: part.id,
            partName: part.part_name,
            condition: part.condition || 'Unknown',
            status: part.status,
            notes: part.notes || null,
            loggedAt: part.logged_at,
            reassemblyVerified: part.reassembly_verified,
          })),
          progressLogs: (row.progress_logs || []).map((log: any) => ({
            id: log.id,
            date: log.date,
            time: log.time,
            status: log.status,
            description: log.description,
            createdAt: log.created_at,
          })),
          inspections: (row.inspections || []).map((insp: any) => ({
            id: insp.id,
            main_issue_resolved: insp.main_issue_resolved,
            reassembly_verified: insp.reassembly_verified,
            general_condition: insp.general_condition,
            notes: insp.notes,
            inspection_date: insp.inspection_date,
            inspection_status: insp.inspection_status,
            created_at: insp.created_at,
            updated_at: insp.updated_at,
          })),
          billing,
        };
      });

      setVehicles(mappedVehicles);
    } catch (err: any) {
      console.error('Error loading vehicle data:', err);
      setError(err.message || 'Failed to load vehicle data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const statusMatch = statusFilter === 'all' || vehicle.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || vehicle.priority === priorityFilter;
    const query = searchQuery.toLowerCase().trim();
    const searchMatch =
      !query ||
      vehicle.make.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.licensePlate.toLowerCase().includes(query) ||
      vehicle.technician.toLowerCase().includes(query) ||
      vehicle.inspector.toLowerCase().includes(query) ||
      vehicle.title.toLowerCase().includes(query) ||
      vehicle.description.toLowerCase().includes(query);
    return statusMatch && priorityMatch && searchMatch;
  });

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded-lg mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="h-8 bg-gray-200 rounded-lg mb-4"></div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="h-6 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 max-w-md w-full bg-red-50 border border-red-200 rounded-lg text-red-700">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <strong>Error</strong>
          </div>
          <p>{error}</p>
          <button
            onClick={fetchVehicles}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Repair Status Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time tracking of all active vehicles</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleTimeString()}</span>
              {isRefreshing && <span className="text-blue-600 ml-2">Refreshing...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by vehicle, plate, tech, or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="inspection">Inspection</option>
                <option value="awaiting bill">Awaiting Bill</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-semibold text-gray-700 grid grid-cols-12 gap-4">
            <div className="col-span-5">Vehicle</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Technician</div>
            <div className="col-span-1">Actions</div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">No vehicles found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="grid grid-cols-12 gap-4 items-center p-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all"
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setActiveTab('details');
                }}
              >
                <div className="col-span-5">
                  <div className="font-semibold text-gray-800">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-sm text-gray-500">{vehicle.licensePlate}</div>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[vehicle.status]}`}
                  >
                    {statusIcons[vehicle.status]}
                    <span className="ml-1 capitalize">
                      {vehicle.status === 'in-progress'
                        ? 'In Progress'
                        : vehicle.status === 'awaiting bill'
                        ? 'Awaiting Bill'
                        : vehicle.status}
                    </span>
                  </span>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${priorityColors[vehicle.priority]}`}
                  >
                    {vehicle.priority.toUpperCase()}
                  </span>
                </div>

                <div className="col-span-2 flex items-center text-gray-700 text-sm">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  {vehicle.technician}
                </div>

                <div className="col-span-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(vehicle);
                      setActiveTab('details');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-custom-gradient text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </h2>
                  <p className="text-blue-100">{selectedVehicle.licensePlate}</p>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="p-2 hover:bg-blue-800 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Summary Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Status */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                      Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium border ${statusColors[selectedVehicle.status]}`}
                        >
                          {selectedVehicle.status === 'in-progress'
                            ? 'In Progress'
                            : selectedVehicle.status === 'awaiting bill'
                            ? 'Awaiting Bill'
                            : selectedVehicle.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Priority</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[selectedVehicle.priority]}`}
                        >
                          {selectedVehicle.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Technician */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 text-blue-600 mr-2" />
                      Technician
                    </h3>
                    <p className="font-medium text-gray-800">{selectedVehicle.technician}</p>
                  </div>

                  {/* Inspector */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 text-purple-600 mr-2" />
                      Inspector
                    </h3>
                    <p className="font-medium text-gray-800">{selectedVehicle.inspector}</p>
                  </div>

                  {/* Deadlines */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                      Deadlines
                    </h3>
                    <div className="space-y-2 text-sm text-gray-800">
                      <div>
                        <span className="text-gray-600">Est. Completion:</span>{' '}
                        {formatDate(selectedVehicle.estimatedCompletion)}
                      </div>
                      <div>
                        <span className="text-gray-600">Final Deadline:</span>{' '}
                        <span
                          className={
                            new Date(selectedVehicle.finalDeadline) < new Date() &&
                            selectedVehicle.status !== 'completed'
                              ? 'text-red-600 font-bold'
                              : ''
                          }
                        >
                          {formatDate(selectedVehicle.finalDeadline)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Tabs */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-200 bg-gray-50">
                      {[
                        { key: 'details', label: 'Details', icon: FileText },
                        { key: 'parts', label: 'Disassembled', icon: Wrench },
                        { key: 'logs', label: 'Progress', icon: Clock },
                        { key: 'inspections', label: 'Inspections', icon: PenTool },
                        { key: 'bill', label: 'Bill', icon: CreditCard },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key as any)}
                          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium capitalize transition ${
                            activeTab === key
                              ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                              : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-5 text-gray-800">
                      {activeTab === 'details' && (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Issue</p>
                            <p className="font-medium text-gray-800 text-lg">{selectedVehicle.title}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Description</p>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-1">
                              {renderDescription(selectedVehicle.description)}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'parts' && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Disassembled Components</h4>
                          {selectedVehicle.disassembledParts.length === 0 ? (
                            <p className="text-sm text-gray-500">No parts disassembled yet.</p>
                          ) : (
                            <ul className="space-y-3">
                              {selectedVehicle.disassembledParts.map((part) => (
                                <li
                                  key={part.id}
                                  className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                                >
                                  <div className="font-medium">{part.partName}</div>
                                  <div className="text-sm">Condition: {part.condition}</div>
                                  <div className="text-sm">Status: {part.status}</div>
                                  {part.notes && <div className="text-sm mt-1">"{part.notes}"</div>}
                                  <div className="text-xs text-gray-500 mt-1">
                                    Logged: {formatDate(part.loggedAt)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {activeTab === 'logs' && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Progress Timeline</h4>
                          {selectedVehicle.progressLogs.length === 0 ? (
                            <p className="text-sm text-gray-500">No logs recorded.</p>
                          ) : (
                            <ol className="relative border-l border-gray-300 ml-4">
                              {selectedVehicle.progressLogs.map((log) => (
                                <li key={log.id} className="mb-6 ml-6">
                                  <span className="absolute w-3 h-3 bg-blue-600 rounded-full -left-1.5 border-4 border-white"></span>
                                  <div className="text-sm text-gray-500">{formatDateTime(log.date, log.time)}</div>
                                  <h5 className="text-base font-semibold">{log.status}</h5>
                                  <p className="text-gray-600 text-sm mt-1">{log.description}</p>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      )}

                      {activeTab === 'inspections' && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Inspection Reports</h4>
                          {selectedVehicle.inspections.length === 0 ? (
                            <p className="text-sm text-gray-500">No inspections conducted yet.</p>
                          ) : (
                            <div className="space-y-4">
                              {selectedVehicle.inspections.map((insp) => (
                                <div
                                  key={insp.id}
                                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                                >
                                  <div className="flex justify-between">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        insp.inspection_status === 'passed'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {insp.inspection_status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {formatDate(insp.inspection_date)}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-sm">
                                    <p>
                                      <strong>Main Issue Resolved:</strong>{' '}
                                      {insp.main_issue_resolved ? '✅ Yes' : '❌ No'}
                                    </p>
                                    <p>
                                      <strong>Reassembly Verified:</strong>{' '}
                                      {insp.reassembly_verified ? '✅ Yes' : '❌ No'}
                                    </p>
                                    <p>
                                      <strong>Condition:</strong> {insp.general_condition}
                                    </p>
                                    {insp.notes && <p className="mt-1">"{insp.notes}"</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'bill' && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Billing Summary</h4>
                          {selectedVehicle.billing ? (
                            <div>
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                                {selectedVehicle.billing.items.length > 0 ? (
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left pb-2">Description</th>
                                        <th className="text-left pb-2">Qty</th>
                                        <th className="text-left pb-2">Unit Price</th>
                                        <th className="text-right pb-2">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedVehicle.billing.items.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-b-0">
                                          <td className="py-2">
                                            <div className="font-medium">{item.description}</div>
                                            <div className="text-xs text-gray-500">{item.category}</div>
                                          </td>
                                          <td className="py-2">{item.quantity}</td>
                                          <td className="py-2">${item.unitPrice.toFixed(2)}</td>
                                          <td className="py-2 text-right">${item.totalPrice.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-sm text-gray-500">No line items recorded.</p>
                                )}

                                <div className="mt-4 border-t pt-3 text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>${selectedVehicle.billing.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tax:</span>
                                    <span>${selectedVehicle.billing.tax.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-semibold text-lg">
                                    <span>Total:</span>
                                    <span>${selectedVehicle.billing.total.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Status:</span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${billStatusColors[selectedVehicle.billing.status]}`}
                                    >
                                      {selectedVehicle.billing.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No billing information available.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

export default VehicleStatus;