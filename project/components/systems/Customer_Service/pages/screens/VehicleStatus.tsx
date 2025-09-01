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
  Users,
  ShoppingCart,
  Package,
} from 'lucide-react';

// Define Vehicle interface (unchanged)
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: 'in-progress' | 'completed' | 'inspection' | 'pending' | 'awaiting bill';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCompletion: string;
  finalDeadline: string;
  technician: string;
  inspector: string;
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
  // New fields from backend
  outsourceMechanics: Array<{
    id: number;
    ticket_number: string;
    mechanic_name: string;
    phone: string;
    payment: number | null;
    payment_method: string | null;
    work_done: string | null;
    notes: string | null;
    created_at: string;
  }>;
  toolAssignments: Array<{
    id: number;
    tool_id: number;
    tool_name: string;
    ticket_id: number;
    ticket_number: string;
    assigned_quantity: number;
    assigned_by: string;
    status: string;
    assigned_at: string;
    returned_at: string | null;
    updated_at: string;
  }>;
  orderedParts: Array<{
    auto_id: number;
    id: number;
    ticket_number: string;
    name: string;
    category: string;
    sku: string;
    price: number | string;
    quantity: number;
    source_shop: string;
    status: string;
    requested_at: string;
    received_at: string | null;
    notes: string | null;
    updated_at: string;
  }>;
  outsourceStock: Array<{
    id: number;
    ticket_number: string;
    part_name: string;
    category: string;
    quantity: number;
    unit_price: number | string;
    total_cost: number | string;
    created_at: string;
  }>;
}

const VehicleStatus = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'logs' | 'inspections' | 'bill' | 'tools'>('details');
  const [orderedPartsTab, setOrderedPartsTab] = useState<'ordered' | 'stock'>('ordered');
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

  // Helper functions
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

  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? 'N/A' : `$${numValue.toFixed(2)}`;
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
          inspector: row.inspector_assign || 'Unassigned',
          services,
          progress: progressMap[status] || 0,
          title: row.title || 'Service Ticket',
          description: row.description || 'No additional details provided.',
          disassembledParts: (row.disassembled_parts || []).map((part: any) => ({
            id: part.id,
            partName: part.part_name,
            condition: part.part_condition || part.condition || 'Unknown',
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
          // Map new fields from backend
          outsourceMechanics: (row.outsource_mechanics || []).map((mech: any) => ({
            id: mech.id,
            ticket_number: mech.ticket_number,
            mechanic_name: mech.mechanic_name,
            phone: mech.phone,
            payment: mech.payment,
            payment_method: mech.payment_method,
            work_done: mech.work_done,
            notes: mech.notes,
            created_at: mech.created_at,
          })),
          toolAssignments: (row.tool_assignments || []).map((tool: any) => ({
            id: tool.id,
            tool_id: tool.tool_id,
            tool_name: tool.tool_name,
            ticket_id: tool.ticket_id,
            ticket_number: tool.ticket_number,
            assigned_quantity: tool.assigned_quantity,
            assigned_by: tool.assigned_by,
            status: tool.status,
            assigned_at: tool.assigned_at,
            returned_at: tool.returned_at,
            updated_at: tool.updated_at,
          })),
          orderedParts: (row.ordered_parts || []).map((part: any) => ({
            auto_id: part.item_id || part.id,
            id: part.item_id || part.id,
            ticket_number: part.ticket_number,
            name: part.name,
            category: part.category,
            sku: part.sku,
            price: part.price || 0,
            quantity: part.quantity,
            source_shop: part.source_shop || 'Internal',
            status: part.status,
            requested_at: part.ordered_at || part.requested_at,
            received_at: part.received_at,
            notes: part.notes,
            updated_at: part.updated_at || part.ordered_at,
          })),
          outsourceStock: (row.outsource_stock || []).map((stock: any) => ({
            id: stock.id,
            ticket_number: stock.ticket_number,
            part_name: stock.name,
            category: stock.category,
            quantity: stock.quantity,
            unit_price: stock.price,
            total_cost: stock.total_cost,
            created_at: stock.requested_at,
          })),
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 rounded-lg shadow-lg">
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

      {/* Enhanced Detail Modal - Tabs at the Top */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-70 text-black flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200">
            {/* Header - Matching the Image */}
            <div className="bg-white p-6 rounded-t-2xl border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Car className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </h2>
                    <p className="text-gray-600">{selectedVehicle.licensePlate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Tab Navigation - At the Top */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                {[
                  { key: 'details', label: 'Overview', icon: FileText },
                  { key: 'parts', label: 'Progress Logs', icon: Clock },
                  { key: 'logs', label: 'Disassembled Parts', icon: Wrench },
                  { key: 'inspections', label: 'Used Tools', icon: Settings },
                  { key: 'bill', label: 'Ordered Parts', icon: ShoppingCart },
                  { key: 'tools', label: 'Inspection', icon: PenTool },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Left: Summary Info - Matching the Image */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Customer Info Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Customer Info
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">Alice Johnson</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">0912345678</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">alice@example.com</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Info Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Car className="w-5 h-5 mr-2 text-blue-600" />
                      Vehicle Info
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Model</p>
                        <p className="font-medium">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">License Plate</p>
                        <p className="font-medium">{selectedVehicle.licensePlate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mileage</p>
                        <p className="font-medium">56,741 miles</p>
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Assigned Mechanic Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                      Assigned Mechanic
                    </h3>
                    <p className="font-medium text-gray-800">{selectedVehicle.technician}</p>
                    {selectedVehicle.outsourceMechanics.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Outsource Mechanic:</p>
                        <p className="font-medium text-gray-800">
                          {selectedVehicle.outsourceMechanics.map(mech => mech.mechanic_name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right: Tab Content */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5 text-gray-800">
                      {/* Tab content - Matching the Image Style */}
                      {activeTab === 'details' && (
                        <div className="space-y-6">
                          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-700 font-medium mb-2">Issue</p>
                            <p className="font-semibold text-gray-800 text-lg">{selectedVehicle.title}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-3">Description</p>
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                              {renderDescription(selectedVehicle.description)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {activeTab === 'parts' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-gray-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-blue-600" />
                            Progress Logs
                          </h4>
                          {selectedVehicle.progressLogs.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                              <p className="text-gray-500">No logs recorded.</p>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                              <div className="space-y-6 ml-8">
                                {selectedVehicle.progressLogs.map((log) => (
                                  <div key={log.id} className="relative">
                                    <div className="absolute -left-8 top-2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white"></div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                      <div className="text-sm text-gray-500 mb-1">{formatDateTime(log.date, log.time)}</div>
                                      <h5 className="text-base font-semibold text-gray-800">{log.status}</h5>
                                      <p className="text-gray-600 text-sm mt-2">{log.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'logs' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-gray-800 flex items-center">
                            <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                            Disassembled Components
                          </h4>
                          {selectedVehicle.disassembledParts.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                              <Wrench className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                              <p className="text-gray-500">No parts disassembled yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {selectedVehicle.disassembledParts.map((part) => (
                                <div
                                  key={part.id}
                                  className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
                                >
                                  <div className="font-semibold text-gray-800">{part.partName}</div>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">Condition:</span> {part.condition}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Status:</span> {part.status}
                                    </div>
                                  </div>
                                  {part.notes && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                                      <span className="font-medium text-blue-800">Notes:</span> {part.notes}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-3">
                                    Logged: {formatDate(part.loggedAt)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'inspections' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-gray-800 flex items-center">
                            <Settings className="w-5 h-5 mr-2 text-blue-600" />
                            Used Tools
                          </h4>
                          {selectedVehicle.toolAssignments.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                              <Wrench className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                              <p className="text-gray-500">No tools assigned.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {selectedVehicle.toolAssignments.map((tool) => (
                                <div key={tool.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="font-bold text-gray-800">{tool.tool_name}</div>
                                      <div className="text-sm text-gray-600 mt-1">Assigned By: {tool.assigned_by}</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                      tool.status === 'returned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {tool.status}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                    <div>
                                      <span className="text-gray-600">Quantity:</span> {tool.assigned_quantity}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Assigned At:</span> {formatDate(tool.assigned_at)}
                                    </div>
                                  </div>
                                  {tool.returned_at && (
                                    <div className="mt-2 text-sm">
                                      <span className="text-gray-600">Returned At:</span> {formatDate(tool.returned_at)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'bill' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-gray-800 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
                            Parts Management
                          </h4>
                          
                          {/* Nested Tabs for Ordered Parts and Outsource Stock */}
                          <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg">
                            <button
                              className={`px-4 py-3 text-sm font-medium flex items-center space-x-2 transition-colors ${
                                orderedPartsTab === 'ordered'
                                  ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                              onClick={() => setOrderedPartsTab('ordered')}
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>Ordered Parts</span>
                            </button>
                            <button
                              className={`px-4 py-3 text-sm font-medium flex items-center space-x-2 transition-colors ${
                                orderedPartsTab === 'stock'
                                  ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                              onClick={() => setOrderedPartsTab('stock')}
                            >
                              <Package className="w-4 h-4" />
                              <span>Outsource Stock</span>
                            </button>
                          </div>
                          
                          {/* Nested Tab Content */}
                          <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 p-4">
                            {orderedPartsTab === 'ordered' ? (
                              <div className="space-y-3">
                                {selectedVehicle.orderedParts.length === 0 ? (
                                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">No parts ordered.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {selectedVehicle.orderedParts.map((part) => (
                                      <div key={part.auto_id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="font-bold text-gray-800">{part.name}</div>
                                            <div className="text-sm text-gray-600 mt-1">SKU: {part.sku}</div>
                                          </div>
                                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                                            part.status === 'received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {part.status}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                          <div>
                                            <span className="text-gray-600">Category:</span> {part.category}
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Quantity:</span> {part.quantity}
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Price:</span> {formatCurrency(part.price)}
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Source:</span> {part.source_shop}
                                          </div>
                                        </div>
                                        <div className="mt-2 text-sm">
                                          <span className="text-gray-600">Requested:</span> {formatDate(part.requested_at)}
                                        </div>
                                        {part.received_at && (
                                          <div className="mt-1 text-sm">
                                            <span className="text-gray-600">Received:</span> {formatDate(part.received_at)}
                                          </div>
                                        )}
                                        {part.notes && (
                                          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                                            <span className="font-medium text-blue-800">Notes:</span> {part.notes}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {selectedVehicle.outsourceStock.length === 0 ? (
                                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">No outsource stock records.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {selectedVehicle.outsourceStock.map((stock) => (
                                      <div key={stock.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                        <div className="font-bold text-gray-800">{stock.part_name}</div>
                                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                          <div>
                                            <span className="text-gray-600">Category:</span> {stock.category}
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Quantity:</span> {stock.quantity}
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Unit Price:</span> {formatCurrency(stock.unit_price)}
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Total Cost:</span> {formatCurrency(stock.total_cost)}
                                          </div>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-500">
                                          Created: {formatDate(stock.created_at)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {activeTab === 'tools' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-gray-800 flex items-center">
                            <PenTool className="w-5 h-5 mr-2 text-blue-600" />
                            Inspection Reports
                          </h4>
                          {selectedVehicle.inspections.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                              <PenTool className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                              <p className="text-gray-500">No inspections conducted yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedVehicle.inspections.map((insp) => (
                                <div
                                  key={insp.id}
                                  className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <span
                                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                                        insp.inspection_status === 'passed'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {insp.inspection_status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      {formatDate(insp.inspection_date)}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center">
                                      {insp.main_issue_resolved ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                      ) : (
                                        <X className="w-4 h-4 text-red-600 mr-2" />
                                      )}
                                      <span>Main Issue Resolved</span>
                                    </div>
                                    <div className="flex items-center">
                                      {insp.reassembly_verified ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                      ) : (
                                        <X className="w-4 h-4 text-red-600 mr-2" />
                                      )}
                                      <span>Reassembly Verified</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-sm">
                                    <span className="font-medium">Condition:</span> {insp.general_condition}
                                  </div>
                                  {insp.notes && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                                      <span className="font-medium text-blue-800">Notes:</span> {insp.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer - Matching the Image */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end border-t border-gray-200">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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