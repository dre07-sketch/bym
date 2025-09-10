import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Car, 
  Wrench, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  CheckSquare, 
  X,
  ChevronDown,
  MapPin,
  Phone,
  Checkbox
} from 'lucide-react';

const MyInspections = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPassFailModal, setShowPassFailModal] = useState(false);
  const [filterLicense, setFilterLicense] = useState('');
  const [filterMechanic, setFilterMechanic] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [inspectionForm, setInspectionForm] = useState({
    mainIssueResolved: '', // 'Resolved' | 'Not Resolved'
    reassemblyVerified: '', // 'Yes' | 'No'
    generalCondition: '', // 'Good' | 'Needs Attention'
    notes: '',
    completionDate: '',
    uploadedFiles: [],
    // New fields from API
    check_oil_leaks: false,
    check_engine_air_filter_oil_coolant_level: false,
    check_brake_fluid_levels: false,
    check_gluten_fluid_levels: false,
    check_battery_timing_belt: false,
    check_tire: false,
    check_tire_pressure_rotation: false,
    check_lights_wiper_horn: false,
    check_door_locks_central_locks: false,
    check_customer_work_order_reception_book: false
  });

  // Fetch inspections from API
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        const url = new URL('http://localhost:5001/api/inspection-endpoint/fetch-inspection', window.location.origin);
        if (statusFilter !== 'all') url.searchParams.append('status', statusFilter);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch inspections');
        
        const data = await response.json();
        setInspections(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, [statusFilter]);

  // Filter inspections based on search and filters
  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.mechanicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLicense = inspection.licensePlate?.toLowerCase().includes(filterLicense.toLowerCase());
    const matchesTicket = inspection.ticketNumber?.toLowerCase().includes(filterTicket.toLowerCase());
    const matchesStatus = filterStatus === '' || inspection.status === filterStatus;
    const matchesPriority = priorityFilter === 'all' || inspection.priority === priorityFilter;
    return matchesSearch && matchesLicense && matchesTicket && matchesStatus && matchesPriority;
  });

  const handleInspectionClick = (inspection) => {
    setSelectedInspection(inspection);
    setInspectionForm({
      mainIssueResolved: inspection.mainIssueResolved || '',
      reassemblyVerified: inspection.reassemblyVerified || '',
      generalCondition: inspection.generalCondition || '',
      notes: inspection.notes || '',
      completionDate: inspection.finishedDate || '',
      uploadedFiles: [],
      // Initialize new fields
      check_oil_leaks: inspection.check_oil_leaks || false,
      check_engine_air_filter_oil_coolant_level: inspection.check_engine_air_filter_oil_coolant_level || false,
      check_brake_fluid_levels: inspection.check_brake_fluid_levels || false,
      check_gluten_fluid_levels: inspection.check_gluten_fluid_levels || false,
      check_battery_timing_belt: inspection.check_battery_timing_belt || false,
      check_tire: inspection.check_tire || false,
      check_tire_pressure_rotation: inspection.check_tire_pressure_rotation || false,
      check_lights_wiper_horn: inspection.check_lights_wiper_horn || false,
      check_door_locks_central_locks: inspection.check_door_locks_central_locks || false,
      check_customer_work_order_reception_book: inspection.check_customer_work_order_reception_book || false
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!inspectionForm.mainIssueResolved || !inspectionForm.reassemblyVerified || !inspectionForm.generalCondition) {
      alert('Please fill in all required fields: issue resolved, reassembly, and general condition.');
      return;
    }
    
    const payload = {
      ticketNumber: selectedInspection.ticketNumber,
      mainIssueResolved: inspectionForm.mainIssueResolved,
      reassemblyVerified: inspectionForm.reassemblyVerified,
      generalCondition: inspectionForm.generalCondition,
      notes: inspectionForm.notes,
      inspectionDate: inspectionForm.completionDate,
      // Include new fields
      check_oil_leaks: inspectionForm.check_oil_leaks,
      check_engine_air_filter_oil_coolant_level: inspectionForm.check_engine_air_filter_oil_coolant_level,
      check_brake_fluid_levels: inspectionForm.check_brake_fluid_levels,
      check_gluten_fluid_levels: inspectionForm.check_gluten_fluid_levels,
      check_battery_timing_belt: inspectionForm.check_battery_timing_belt,
      check_tire: inspectionForm.check_tire,
      check_tire_pressure_rotation: inspectionForm.check_tire_pressure_rotation,
      check_lights_wiper_horn: inspectionForm.check_lights_wiper_horn,
      check_door_locks_central_locks: inspectionForm.check_door_locks_central_locks,
      check_customer_work_order_reception_book: inspectionForm.check_customer_work_order_reception_book
    };

    try {
      const response = await fetch('http://localhost:5001/api/inspection-endpoint/update-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save inspection');
      }
      // ✅ Move to Pass/Fail decision
      setShowPassFailModal(true);
    } catch (err) {
      console.error('Error saving inspection:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Helper function to render checkbox fields
  const renderCheckboxField = (field, label) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={inspectionForm[field]}
        onChange={(e) => setInspectionForm({ ...inspectionForm, [field]: e.target.checked })}
        className="w-4 h-4 text-blue-600 rounded"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': 
      case 'awaiting-bill': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': 
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'inspection-failed': 
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'awaiting-bill':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'inspection-failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading inspections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 h-24 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Inspections</h1>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-base font-medium text-blue-700">
              {filteredInspections.length} {filteredInspections.length === 1 ? 'Inspection' : 'Inspections'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
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
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="awaiting-bill">Awaiting Bill</option>
                    <option value="inspection-failed">Inspection Failed</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Inspections List */}
        <div className="space-y-3">
          {filteredInspections.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No inspections found matching your criteria.
            </div>
          ) : (
            filteredInspections.map((inspection) => (
              <div
                key={inspection.ticketNumber}
                onClick={() => handleInspectionClick(inspection)}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <Car className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 font-sans">#{inspection.ticketNumber}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{inspection.vehicleModel || 'Unknown model'}</span>
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {inspection.licensePlate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                      {inspection.priority?.charAt(0).toUpperCase() + inspection.priority?.slice(1) || 'Medium'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(inspection.status)}`}>
                      {getStatusIcon(inspection.status)}
                      <span>{inspection.status?.replace('-', ' ')?.replace('awaiting bill', 'Awaiting Bill') || 'Unknown'}</span>
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{inspection.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{inspection.mechanicName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {inspection.assignedDate
                        ? new Date(inspection.assignedDate).toLocaleDateString()
                        : 'No date'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Inspection Modal */}
      {showModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-black">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-custom-gradient text-white p-5 rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Inspection Details</h2>
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <span>Ticket: {selectedInspection.ticketNumber}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Vehicle and Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    Vehicle Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Plate:</span> {selectedInspection.licensePlate}</p>
                    <p><span className="text-gray-500">Model:</span> {selectedInspection.vehicleModel}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Client & Mechanic
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Client:</span> {selectedInspection.clientName}</p>
                    <p><span className="text-gray-500">Mechanic:</span> {selectedInspection.mechanicName}</p>
                  </div>
                </div>
              </div>
              
              {/* Issue Description */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Current Issue
                </h3>
                <p className="text-sm text-red-800">{selectedInspection.issueDescription}</p>
              </div>
              
              {/* Dates */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Assigned: {new Date(selectedInspection.assignedDate).toLocaleDateString()}</span>
                </div>
                {selectedInspection.finishedDate && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Completed: {new Date(selectedInspection.finishedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {/* Parts List */}
              {selectedInspection.parts && selectedInspection.parts.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-600" />
                    Disassembled Parts
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedInspection.parts.map((part, idx) => {
                      const partStatus = part.status?.trim();
                      let displayStatus = 'Pending';
                      let statusColor = 'bg-gray-100 text-gray-800';
                      if (partStatus === 'returned') {
                        displayStatus = 'Returned';
                        statusColor = 'bg-green-100 text-green-800';
                      } else if (partStatus === 'in-repair') {
                        displayStatus = 'In Repair';
                        statusColor = 'bg-yellow-100 text-yellow-800';
                      } else if (partStatus === 'damaged') {
                        displayStatus = 'Damaged';
                        statusColor = 'bg-red-100 text-red-800';
                      } else if (partStatus === 'replaced') {
                        displayStatus = 'Replaced';
                        statusColor = 'bg-blue-100 text-blue-800';
                      } else {
                        displayStatus = 'Not Started';
                        statusColor = 'bg-orange-100 text-orange-800';
                      }
                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{part.partName.trim()}</span>
                            {part.notes && (
                              <p className="text-xs text-gray-600 mt-1">Note: {part.notes}</p>
                            )}
                          </div>
                          <span
                            className={`mt-2 sm:mt-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Inspection Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4 border-t pt-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  Final Inspection Checklist
                </h3>
                
                {/* Main Issue Resolved */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Main Issue Resolved</h4>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mainIssueResolved"
                        checked={inspectionForm.mainIssueResolved === 'Resolved'}
                        onChange={() => setInspectionForm({ ...inspectionForm, mainIssueResolved: 'Resolved' })}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-green-700">Resolved</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mainIssueResolved"
                        checked={inspectionForm.mainIssueResolved === 'Not Resolved'}
                        onChange={() => setInspectionForm({ ...inspectionForm, mainIssueResolved: 'Not Resolved' })}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-red-700">Not Resolved</span>
                    </label>
                  </div>
                </div>
                
                {/* Reassembly Verified */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">All Parts Reassembled?</h4>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reassemblyVerified"
                        checked={inspectionForm.reassemblyVerified === 'Yes'}
                        onChange={() => setInspectionForm({ ...inspectionForm, reassemblyVerified: 'Yes' })}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-green-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reassemblyVerified"
                        checked={inspectionForm.reassemblyVerified === 'No'}
                        onChange={() => setInspectionForm({ ...inspectionForm, reassemblyVerified: 'No' })}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-red-700">No</span>
                    </label>
                  </div>
                </div>
                
                {/* General Condition */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">General Condition</h4>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="generalCondition"
                        checked={inspectionForm.generalCondition === 'Good'}
                        onChange={() => setInspectionForm({ ...inspectionForm, generalCondition: 'Good' })}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-green-700">Good</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="generalCondition"
                        checked={inspectionForm.generalCondition === 'Needs Attention'}
                        onChange={() => setInspectionForm({ ...inspectionForm, generalCondition: 'Needs Attention' })}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-red-700">Needs Attention</span>
                    </label>
                  </div>
                </div>
                
                {/* New Additional Checks Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Additional Inspection Checks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderCheckboxField('check_oil_leaks', 'Check Oil Leaks')}
                    {renderCheckboxField('check_engine_air_filter_oil_coolant_level', 'Check Engine/Air Filter/Oil/Coolant Level')}
                    {renderCheckboxField('check_brake_fluid_levels', 'Check Brake Fluid Levels')}
                    {renderCheckboxField('check_gluten_fluid_levels', 'Check Gluten Fluid Levels')}
                    {renderCheckboxField('check_battery_timing_belt', 'Check Battery & Timing Belt')}
                    {renderCheckboxField('check_tire', 'Check Tire Condition')}
                    {renderCheckboxField('check_tire_pressure_rotation', 'Check Tire Pressure & Rotation')}
                    {renderCheckboxField('check_lights_wiper_horn', 'Check Lights, Wiper & Horn')}
                    {renderCheckboxField('check_door_locks_central_locks', 'Check Door Locks & Central Locks')}
                    {renderCheckboxField('check_customer_work_order_reception_book', 'Check Customer Work Order & Reception Book')}
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block font-medium text-gray-900 mb-2">Notes</label>
                  <textarea
                    value={inspectionForm.notes}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                    rows={3}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    placeholder="Additional inspection notes..."
                  />
                </div>
                
                {/* Completion Date */}
                <div>
                  <label className="block font-medium text-gray-900 mb-2">Completion Date</label>
                  <input
                    type="date"
                    value={inspectionForm.completionDate}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, completionDate: e.target.value })}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Save & Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Pass/Fail Modal */}
      {showPassFailModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inspection Result</h2>
            <p className="text-gray-600 mb-6">
              Has the vehicle passed the final inspection?
            </p>
            <div className="flex gap-3">
              {/* PASS Button */}
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5001/api/inspection-endpoint/update-inspection-status', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ticketNumber: selectedInspection.ticketNumber,
                        inspectionStatus: 'pass'
                      })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.message || 'Failed to update inspection status');
                    }
                    // Update UI: inspection passed → awaiting-bill
                    setInspections(prev =>
                      prev.map(insp =>
                        insp.ticketNumber === selectedInspection.ticketNumber
                          ? { ...insp, status: 'awaiting-bill' }
                          : insp
                      )
                    );
                    alert('Inspection passed! Ticket status updated to "awaiting-bill".');
                    setShowPassFailModal(false);
                    setShowModal(false);
                    setSelectedInspection(null);
                  } catch (err) {
                    console.error('Error in Pass action:', err);
                    alert(`Error: ${err.message}`);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5" />
                Pass
              </button>
              
              {/* FAIL Button */}
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5001/api/inspection-endpoint/update-inspection-status', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ticketNumber: selectedInspection.ticketNumber,
                        inspectionStatus: 'fail'
                      })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.message || 'Failed to update inspection status');
                    }
                    // Update UI: inspection failed → inspection-failed
                    setInspections(prev =>
                      prev.map(insp =>
                        insp.ticketNumber === selectedInspection.ticketNumber
                          ? { ...insp, status: 'inspection-failed' }
                          : insp
                      )
                    );
                    alert('Inspection failed. Ticket status updated.');
                    setShowPassFailModal(false);
                    setShowModal(false);
                    setSelectedInspection(null);
                  } catch (err) {
                    console.error('Error in Fail action:', err);
                    alert(`Error: ${err.message}`);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-5 h-5" />
                Fail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInspections;