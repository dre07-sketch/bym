import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Eye, Wrench, User, Car, Calendar,
  Clock, CheckCircle, AlertTriangle, X, Phone,
  Mail, Settings, FileText, Package, Save, Ticket,
  Loader2, CheckSquare, ShoppingCart, ExternalLink, Tag
} from 'lucide-react';

const PartsManagement = () => {
  // State declarations
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterLicense, setFilterLicense] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showPartsForm, setShowPartsForm] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTicketNumber, setPendingTicketNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [progressLogs, setProgressLogs] = useState([]);
  const [disassembledParts, setDisassembledParts] = useState([]);
  const [activeToolTab, setActiveToolTab] = useState('tools');
  const [activePartsTab, setActivePartsTab] = useState('tools');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeOrderedTab, setActiveOrderedTab] = useState('ordered');
  
  // Form states
  const [progressForm, setProgressForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    status: 'In Progress',
    description: ''
  });
  
  const [partsForm, setPartsForm] = useState({
    partName: '',
    condition: 'Good',
    status: 'received',
    notes: ''
  });
  
  // API endpoint configuration
  const API_BASE_URL = 'http://localhost:5001/api';
  
  // Fetch active tickets
  useEffect(() => {
    const fetchActiveTickets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/active-tickets/active-tickets`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        
        const mappedVehicles = data.map((ticket) => {
          const normalizedStatus = ticket.status?.replace(/\s+/g, '-').toLowerCase();
          const status = ['in-progress', 'on-hold', 'completed', 'ready-for-inspection'].includes(normalizedStatus)
            ? normalizedStatus
            : 'in-progress';
            
          const formatDate = (dateString) => 
            dateString ? new Date(dateString).toISOString().split('T')[0] : 'N/A';
          
          return {
            id: ticket.id?.toString(),
            ticketNumber: ticket.ticket_number || `TKT-${ticket.id}`,
            clientName: ticket.customer_name || 'Unknown Client',
            licensePlate: ticket.license_plate || 'XXX-XXX',
            mechanicName: ticket.mechanic_name || 'Unassigned',
            inspector: ticket.inspector_assign || 'Not Assigned',
            issue: ticket.title || 'No issue title',
            problemDescription: ticket.description || 'No detailed description provided.',
            startDate: formatDate(ticket.created_at),
            dueDate: formatDate(ticket.estimated_completion_date),           
            completionDeadline: formatDate(ticket.completion_date),                         
            status,
            clientPhone: ticket.phone || 'N/A',
            clientEmail: ticket.email || 'N/A',
            totalCost: parseFloat(ticket.total_cost) || 0,
            toolsAssigned: ticket.tools_assigned || [],
            outsourceStock: ticket.outsource_stock || [],
            orderedParts: ticket.ordered_parts || [],
            notes: ticket.notes || 'No additional notes.',
            type: ticket.type || 'Standard', // Added type field
          };
        });
        
        setActiveVehicles(mappedVehicles);
      } catch (err) {
        console.error('Error fetching active tickets:', err);
        setError('Failed to load vehicle data. Please check the console.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveTickets();
  }, [API_BASE_URL]);
  
  // Fetch progress logs and disassembled parts when a vehicle is selected
  useEffect(() => {
    if (!selectedVehicle) {
      setProgressLogs([]);
      setDisassembledParts([]);
      return;
    }
    
    const fetchDetails = async () => {
      setDetailLoading(true);
      try {
        // Fetch progress logs
        const logsRes = await fetch(`${API_BASE_URL}/progress/progress-logs/${selectedVehicle.ticketNumber}`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setProgressLogs(logsData.progress_logs || []);
        } else {
          console.error('Failed to fetch progress logs');
          setProgressLogs([]);
        }
        
        // Fetch disassembled parts
        const partsRes = await fetch(`${API_BASE_URL}/disassmbled/disassembled-parts/${selectedVehicle.ticketNumber}`);
        if (partsRes.ok) {
          const partsData = await partsRes.json();
          setDisassembledParts(partsData.disassembled_parts || []);
        } else {
          console.error('Failed to fetch disassembled parts');
          setDisassembledParts([]);
        }
      } catch (err) {
        console.error('Error fetching vehicle details:', err);
        setProgressLogs([]);
        setDisassembledParts([]);
      } finally {
        setDetailLoading(false);
      }
    };
    
    fetchDetails();
  }, [selectedVehicle, API_BASE_URL]);
  
  // Memoized filtered vehicles for performance
  const filteredVehicles = useMemo(() => {
    return activeVehicles.filter((vehicle) => {
      return (
        (!filterLicense ||
          vehicle.licensePlate.toLowerCase().includes(filterLicense.toLowerCase())) &&
        (!filterTicket ||
          vehicle.ticketNumber.toLowerCase().includes(filterTicket.toLowerCase())) &&
        (!filterStatus || vehicle.status === filterStatus)
      );
    });
  }, [activeVehicles, filterLicense, filterTicket, filterStatus]);
  
  // Generate tool updates from toolsAssigned data
  const toolUpdates = useMemo(() => {
    if (!selectedVehicle || !selectedVehicle.toolsAssigned) return [];
    
    return selectedVehicle.toolsAssigned.flatMap(tool => {
      const events = [];
      
      // Assignment event
      events.push({
        id: `assign-${tool.tool_name}-${tool.assigned_at}`,
        toolName: tool.tool_name,
        event: 'Assigned',
        date: tool.assigned_at ? new Date(tool.assigned_at).toISOString().split('T')[0] : 'N/A',
        time: tool.assigned_at ? new Date(tool.assigned_at).toTimeString().slice(0, 5) : 'N/A',
        details: `Assigned ${tool.assigned_quantity} unit(s)`,
        status: tool.status,
        icon: <Wrench className="w-4 h-4" />,
        iconBg: 'bg-blue-100 text-blue-600'
      });
      
      // If the tool is returned, add a return event
      if (tool.status === 'returned') {
        // For demonstration, we'll use a placeholder date
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 1); // Next day
        
        events.push({
          id: `return-${tool.tool_name}-${tool.assigned_at}`,
          toolName: tool.tool_name,
          event: 'Returned',
          date: returnDate.toISOString().split('T')[0],
          time: '14:30', // Placeholder time
          details: `Returned ${tool.assigned_quantity} unit(s)`,
          status: 'returned',
          icon: <CheckCircle className="w-4 h-4" />,
          iconBg: 'bg-green-100 text-green-600'
        });
      }
      return events;
    }).sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  }, [selectedVehicle]);
  
  // Status styling functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      case 'ready-for-inspection': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'in-progress': return <Wrench className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'on-hold': return <AlertTriangle className="w-4 h-4" />;
      case 'ready-for-inspection': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Type styling function
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'maintenance': return 'bg-green-100 text-green-800';
      case 'repair': return 'bg-blue-100 text-blue-800';
      case 'inspection': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Form handlers
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedVehicle?.ticketNumber) throw new Error('No vehicle selected');
      const { date, time, status, description } = progressForm;
      if (!date || !time || !status || !description) throw new Error('Please fill all fields');
      
      const payload = { ticket_number: selectedVehicle.ticketNumber, date, time, status, description };
      const response = await fetch(`${API_BASE_URL}/progress/progress-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit');
      
      // Refresh progress logs
      const logsRes = await fetch(`${API_BASE_URL}/progress/progress-logs/${selectedVehicle.ticketNumber}`);
      if (logsRes.ok) setProgressLogs((await logsRes.json()).progress_logs || []);
      
      setShowProgressForm(false);
      setProgressForm({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        status: 'In Progress',
        description: ''
      });
      
      alert('Progress update saved successfully!');
    } catch (err) {
      console.error('Error submitting progress update:', err);
      alert(`Error: ${err.message}`);
    }
  };
  
  const handlePartsSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedVehicle?.ticketNumber) throw new Error('No vehicle selected');
      const { partName, condition, status } = partsForm;
      if (!partName || !condition || !status) throw new Error('Required fields missing');
      
      const payload = {
        ticket_number: selectedVehicle.ticketNumber,
        part_name: partName,
        condition,
        status,
        notes: partsForm.notes || ''
      };
      
      const response = await fetch(`${API_BASE_URL}/disassmbled/disassembled-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit');
      
      // Refresh disassembled parts
      const partsRes = await fetch(`${API_BASE_URL}/disassmbled/disassembled-parts/${selectedVehicle.ticketNumber}`);
      if (partsRes.ok) setDisassembledParts((await partsRes.json()).disassembled_parts || []);
      
      setShowPartsForm(false);
      setPartsForm({ partName: '', condition: 'Good', status: 'received', notes: '' });
      
      alert('Parts data saved successfully!');
    } catch (err) {
      console.error('Error submitting parts data:', err);
      alert(`Error: ${err.message}`);
    }
  };
  
  const handleUpdatePartStatus = async (partId, newStatus) => {
    if (newStatus !== 'returned') return alert('Only status change allowed is to "returned".');
    try {
      const response = await fetch(`${API_BASE_URL}/disassmbled/disassembled-parts/${partId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to update');
      
      // Refresh disassembled parts
      const partsRes = await fetch(`${API_BASE_URL}/disassmbled/disassembled-parts/${selectedVehicle.ticketNumber}`);
      if (partsRes.ok) setDisassembledParts((await partsRes.json()).disassembled_parts || []);
      
      alert('Part status updated to "Returned"');
    } catch (err) {
      console.error('Error updating part status:', err);
      alert(`Error: ${err.message}`);
    }
  };
  
  const handleTransferToInspection = (ticketNumber) => {
    setPendingTicketNumber(ticketNumber);
    setShowConfirmModal(true);
  };
  
  const confirmTransfer = async () => {
    const ticketNumber = pendingTicketNumber;
    setShowConfirmModal(false);
    setPendingTicketNumber(null);
    setIsTransferring(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/active-tickets/update-status/${ticketNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready for inspection' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Update vehicle status in state
      setActiveVehicles(prev =>
        prev.map(vehicle =>
          vehicle.ticketNumber === ticketNumber
            ? { ...vehicle, status: 'ready-for-inspection' }
            : vehicle
        )
      );
      
      // Update selected vehicle if it's the one being transferred
      setSelectedVehicle(prev => 
        prev && prev.ticketNumber === ticketNumber 
          ? { ...prev, status: 'ready-for-inspection' } 
          : prev
      );
      
      alert('Vehicle transferred to inspection successfully!');
    } catch (err) {
      console.error('Error transferring to inspection:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="h-screen overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
          <p className="mt-4 text-lg text-gray-700">Loading active repairs...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="h-screen overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Parts Management</h2>
        <p className="text-gray-600">Manage active vehicle repairs and track parts</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-gray-700 flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Number</label>
                <input
                  type="text"
                  placeholder="Search ticket number..."
                  value={filterTicket}
                  onChange={(e) => setFilterTicket(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All statuses</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="ready-for-inspection">Ready for Inspection</option>
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
            <h3 className="text-xl font-semibold text-gray-900">Active Vehicle Repairs</h3>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredVehicles.length} vehicles
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active vehicles</h3>
              <p className="text-gray-500">No vehicles are currently being worked on.</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(vehicle.status)}
                        <h4 className="text-lg font-semibold text-gray-900">{vehicle.clientName}</h4>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1).replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(vehicle.type)}`}>
                        {vehicle.type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Ticket className="w-4 h-4" />
                        <span>{vehicle.ticketNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{vehicle.licensePlate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-4 h-4 text-green-500" />
                        <span>{vehicle.mechanicName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span title="Estimated completion date">Est: {vehicle.dueDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-red-500" />
                        <span title="Final completion deadline">Deadline: {vehicle.completionDeadline}</span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black"
          onClick={() => setSelectedVehicle(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Matching the screenshot design */}
            <div className="bg-custom-gradient text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Ticket: {selectedVehicle.ticketNumber}</h2>
                  <p className="text-lg opacity-90">{selectedVehicle.clientName}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedVehicle.status === 'in-progress' ? 'bg-yellow-500' :
                    selectedVehicle.status === 'completed' ? 'bg-green-500' :
                    selectedVehicle.status === 'on-hold' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}>
                    {selectedVehicle.status === 'in-progress' ? 'In Progress' :
                     selectedVehicle.status === 'completed' ? 'Completed' :
                     selectedVehicle.status === 'on-hold' ? 'On Hold' :
                     selectedVehicle.status === 'ready-for-inspection' ? 'Ready for Inspection' :
                     selectedVehicle.status}
                  </span>
                  <button 
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    onClick={() => setSelectedVehicle(null)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex space-x-1 bg-blue-800/30 p-1 rounded-lg">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'progress', label: 'Progress Logs' },
                  { id: 'parts', label: 'Disassembled Parts' },
                  { id: 'tools', label: 'Used Tools' },
                  { id: 'ordered', label: 'Ordered Parts' },
                
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-white text-blue-700 shadow' 
                        : 'text-blue-100 hover:text-white hover:bg-blue-700/50'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl">
                        <Ticket className="w-6 h-6 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">Ticket Number</p>
                          <p className="font-semibold">{selectedVehicle.ticketNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                        <User className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Client</p>
                          <p className="font-semibold">{selectedVehicle.clientName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl">
                        <Car className="w-6 h-6 text-orange-600" />
                        <div>
                          <p className="text-sm text-gray-600">License Plate</p>
                          <p className="font-semibold">{selectedVehicle.licensePlate}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                        <Wrench className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Mechanic</p>
                          <p className="font-semibold">{selectedVehicle.mechanicName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-indigo-50 rounded-xl">
                        <Tag className="w-6 h-6 text-indigo-600" />
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-semibold">{selectedVehicle.type}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-2">Issue</p>
                        <p className="font-semibold">{selectedVehicle.issue}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="font-semibold">{selectedVehicle.startDate}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl">
                          <p className="text-sm text-gray-600">Estimated Due</p>
                          <p className="font-semibold">{selectedVehicle.dueDate}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl">
                          <p className="text-sm text-gray-600">Final Deadline</p>
                          <p className="font-semibold">{selectedVehicle.completionDeadline}</p>
                        </div>
                        {selectedVehicle.totalCost > 0 && (
                          <div className="p-4 bg-green-50 rounded-xl">
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <p className="font-semibold text-green-600">${selectedVehicle.totalCost.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Problem Description</p>
                    <p className="whitespace-pre-wrap">{selectedVehicle.problemDescription}</p>
                  </div>
                  
                  {selectedVehicle.notes && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">Notes</p>
                      <p>{selectedVehicle.notes}</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'progress' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Progress Logs</h3>
                  {detailLoading ? (
                    <p className="text-gray-500">Loading logs...</p>
                  ) : progressLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No progress logs recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {progressLogs.map((log) => (
                        <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">{log.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.date).toLocaleDateString()} at {log.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'parts' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Disassembled Parts</h3>
                  {detailLoading ? (
                    <p className="text-gray-500">Loading parts...</p>
                  ) : disassembledParts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 bg-yellow-50 rounded-xl">No parts have been logged yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {disassembledParts.map((part) => (
                        <div
                          key={part.id}
                          className="p-5 bg-yellow-50 rounded-2xl shadow-md border-l-4 border-yellow-400"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-lg font-semibold">{part.part_name}</p>
                            <span className="inline-block px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">
                              {part.condition}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Status:</span> {part.status}</p>
                            <p><span className="font-medium">Notes:</span> {part.notes || '—'}</p>
                            <p><span className="font-medium">Logged At:</span> {new Date(part.logged_at).toLocaleString()}</p>
                          </div>
                          {part.status === 'received' && (
                            <div className="mt-3 pt-3 border-t border-yellow-200">
                              <button
                                onClick={() => handleUpdatePartStatus(part.id, 'returned')}
                                className="w-full bg-green-600 text-white text-sm py-1.5 px-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-1"
                              >
                                <CheckSquare className="w-4 h-4" />
                                <span>Mark as Returned</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'tools' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Used Tools</h3>
                  
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      className={`py-2 px-4 font-medium text-sm ${activeToolTab === 'tools' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveToolTab('tools')}
                    >
                      Current Tools
                    </button>
                    <button
                      className={`py-2 px-4 font-medium text-sm ${activeToolTab === 'updates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveToolTab('updates')}
                    >
                      Updates
                    </button>
                  </div>
                  
                  {activeToolTab === 'tools' ? (
                    selectedVehicle.toolsAssigned && selectedVehicle.toolsAssigned.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tool Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Assigned Quantity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Assigned At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedVehicle.toolsAssigned.map((tool, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.tool_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tool.assigned_quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${tool.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 
                                      tool.status === 'returned' ? 'bg-green-100 text-green-800' : 
                                      'bg-yellow-100 text-yellow-800'}`}>
                                    {tool.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(tool.assigned_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4 bg-blue-50 rounded-xl">No tools assigned.</p>
                    )
                  ) : (
                    toolUpdates.length > 0 ? (
                      <div className="space-y-4">
                        {toolUpdates.map((update) => (
                          <div key={update.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${update.iconBg}`}>
                              {update.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium">{update.event}: {update.toolName}</p>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  update.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 
                                  update.status === 'returned' ? 'bg-green-100 text-green-800' : 
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {update.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{update.details}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {update.date} at {update.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4 bg-blue-50 rounded-xl">No updates available.</p>
                    )
                  )}
                </div>
              )}
              
              {activeTab === 'ordered' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Parts Management</h3>
                  
                  {/* Sub-tabs for Ordered Parts */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      className={`py-2 px-4 font-medium text-sm ${activeOrderedTab === 'ordered' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                      onClick={() => setActiveOrderedTab('ordered')}
                    >
                      Ordered Parts
                    </button>
                    <button
                      className={`py-2 px-4 font-medium text-sm ${activeOrderedTab === 'outsource' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                      onClick={() => setActiveOrderedTab('outsource')}
                    >
                      Outsource Stock
                    </button>
                  </div>
                  
                  {/* Ordered Parts Content */}
                  {activeOrderedTab === 'ordered' && (
                    selectedVehicle.orderedParts && selectedVehicle.orderedParts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Quantity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Ordered At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedVehicle.orderedParts.map((part, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${part.status === 'ordered' ? 'bg-blue-100 text-blue-800' : 
                                      part.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                      'bg-yellow-100 text-yellow-800'}`}>
                                    {part.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(part.ordered_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-900 text-center py-4 bg-purple-50 rounded-xl">No ordered parts.</p>
                    )
                  )}
                  
                  {/* Outsource Stock Content */}
                  {activeOrderedTab === 'outsource' && (
                    selectedVehicle.outsourceStock && selectedVehicle.outsourceStock.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Quantity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Source Shop</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Requested At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedVehicle.outsourceStock.map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.source_shop}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${item.status === 'requested' ? 'bg-yellow-100 text-yellow-800' : 
                                      item.status === 'received' ? 'bg-green-100 text-green-800' : 
                                      'bg-red-100 text-red-800'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(item.requested_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-900 text-center py-4 bg-green-50 rounded-xl">No outsource stock items.</p>
                    )
                  )}
                </div>
              )}
              
              
            </div>
            
            {/* Footer Buttons */}
            <div className="flex-shrink-0 p-6 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex space-x-4">
                <button 
                  onClick={() => setShowProgressForm(true)}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>Log Progress</span>
                </button>
                <button 
                  onClick={() => setShowPartsForm(true)}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Package className="w-5 h-5" />
                  <span>Log Parts</span>
                </button>
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => handleTransferToInspection(selectedVehicle.ticketNumber)}
                  disabled={isTransferring}
                  className={`relative px-8 py-3.5 ${isTransferring ? 'bg-indigo-500' : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700'} text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-indigo-200/50 transform hover:scale-[1.02] active:scale-95`}
                >
                  {isTransferring && (
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl opacity-75 animate-pulse"></span>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {isTransferring ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Transferring...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        <span>Transfer to Inspection</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Transfer</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to transfer this vehicle to <strong>Inspection</strong>? 
              This will update its status to <strong>Ready for Inspection</strong>.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingTicketNumber(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                onClick={confirmTransfer}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Form Modal */}
      {showProgressForm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black"
          onClick={() => setShowProgressForm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-custom-gradient text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Log Progress Update</h2>
                <button className="p-2 hover:bg-white/20 rounded-lg" onClick={() => setShowProgressForm(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleProgressSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={progressForm.date}
                    onChange={(e) => setProgressForm({...progressForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={progressForm.time}
                    onChange={(e) => setProgressForm({...progressForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={progressForm.status}
                  onChange={(e) => setProgressForm({...progressForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Waiting for Parts">Waiting for Parts</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={progressForm.description}
                  onChange={(e) => setProgressForm({...progressForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Describe the progress made..."
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowProgressForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Progress</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Parts Form Modal */}
      {showPartsForm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black"
          onClick={() => setShowPartsForm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-custom-gradient text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Log Disassembled Parts</h2>
                <button className="p-2 hover:bg-white/20 rounded-lg" onClick={() => setShowPartsForm(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form className="p-6 space-y-4" onSubmit={handlePartsSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Part Name</label>
                <input
                  type="text"
                  value={partsForm.partName}
                  onChange={(e) => setPartsForm({...partsForm, partName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter part name..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <select
                    value={partsForm.condition}
                    onChange={(e) => setPartsForm({...partsForm, condition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Poor</option>
                    <option>Damaged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={partsForm.status}
                    onChange={(e) => setPartsForm({...partsForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="received">Received</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={partsForm.notes}
                  onChange={(e) => setPartsForm({...partsForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none"
                  placeholder="Additional notes about the part..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowPartsForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Part</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsManagement;