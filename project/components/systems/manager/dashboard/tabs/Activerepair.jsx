import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  PackagePlus,
  Scissors,
  Percent,
  Car,
  Filter,
  DollarSign,
  ChevronDown,
  Clock,
  Calendar,
  User,
  X,
  SquareStack,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Timer,
  Package,
  UserCheck,
  ClipboardCheck,
  Wrench,
  CheckCircle,
  Bell,
  Send,
  Plus
} from 'lucide-react';

const Activerepair = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState(null);
  const [showConfirmInspectorModal, setShowConfirmInspectorModal] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [selectedTools, setSelectedTools] = useState([]);
  const [toolNotes, setToolNotes] = useState('');
  const [showCompletionTimeModal, setShowCompletionTimeModal] = useState(false);
  const [completionTime, setCompletionTime] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationRecipient, setNotificationRecipient] = useState('customer');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [stockroomParts, setStockroomParts] = useState([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [laborHours, setLaborHours] = useState(2.5);
  const [laborRate, setLaborRate] = useState(85);
  const [laborDescription, setLaborDescription] = useState('');
  const [parts, setParts] = useState([]);
  const [tools, setTools] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspectors, setInspectors] = useState([]);
  const [loadingInspectors, setLoadingInspectors] = useState(false);
  const [inspectorError, setInspectorError] = useState(null);

  // Refresh selected repair data when opened
  useEffect(() => {
    if (selectedRepair) {
      const fetchRepair = async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/active-progress/${selectedRepair.id}`);
          if (!response.ok) throw new Error('Failed to fetch repair');
          const data = await response.json();
          setSelectedRepair(prev => ({
            ...prev,
            assignedInspector: data.inspector_assign || null,
            status: data.status,
            estimatedCompletion: data.estimated_completion_date
              ? new Date(data.estimated_completion_date).toISOString().split('T')[0]
              : null,
            actualCompletion: data.completion_date
              ? new Date(data.completion_date).toISOString().split('T')[0]
              : null
          }));
        } catch (err) {
          console.error("Error refreshing repair:", err);
        }
      };
      fetchRepair();
    }
  }, [selectedRepair]);

  // Fetch inspectors
  useEffect(() => {
    const fetchInspectors = async () => {
      setLoadingInspectors(true);
      setInspectorError(null);
      try {
        const response = await fetch('http://localhost:5001/api/active-progress/inspectors');
        if (!response.ok) throw new Error('Failed to fetch inspectors');
        const data = await response.json();
        const normalizedInspectors = data.map(inspector => ({
          ...inspector,
          inspection_status: inspector.inspection_status?.toLowerCase().trim()
        }));
        setInspectors(normalizedInspectors);
      } catch (err) {
        console.error('Error loading inspectors:', err);
        setInspectorError('Unable to load inspector list. Please try again.');
      } finally {
        setLoadingInspectors(false);
      }
    };
    if (showInspectorModal && !selectedRepair?.assignedInspector) {
      fetchInspectors();
    }
  }, [showInspectorModal, selectedRepair?.assignedInspector]);

  // Fetch in-progress repairs
  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/active-progress/in-progress');
        if (!response.ok) throw new Error('Failed to fetch repairs');
        const data = await response.json();
        const formattedRepairs = data.map(ticket => {
          const customerName = ticket.customer_name || 'Unknown Customer';
          const email = ticket.email || 'N/A';
          const phone = ticket.phone || 'N/A';
          const vehicle = ticket.vehicle_info || 'Unknown Vehicle';
          const licensePlate = ticket.license_plate || 'N/A';
          const issueSeverity = ticket.urgency_level
            ? ticket.urgency_level === 'Critical' ? 'Critical'
            : ticket.urgency_level === 'High' ? 'Critical'
            : ticket.urgency_level === 'Medium' ? 'Moderate'
            : 'Minor'
            : 'Moderate';
          return {
            id: ticket.id,
            ticketNumber: ticket.ticket_number || `TKT-${ticket.id}`,
            customerName,
            licensePlate,
            vehicle,
            status: ticket.status || 'In Progress',
            carStatus: issueSeverity,
            startDate: ticket.created_at
              ? new Date(ticket.created_at).toISOString().split('T')[0]
              : null,
            estimatedCompletion: ticket.estimated_completion_date
              ? new Date(ticket.estimated_completion_date).toISOString().split('T')[0]
              : null,
            assignedMechanic: ticket.mechanic_assign || 'Unassigned',
            assignedInspector: ticket.inspector_assign || null,
            serviceType: ticket.title || ticket.type || 'General Repair',
            contact: phone,
            email,
            location: 'Main Bay',
            progress: ticket.progress !== null && !isNaN(ticket.progress)
              ? Math.min(100, Math.max(0, parseInt(ticket.progress)))
              : 0,
            notes: ticket.description || 'No additional notes provided for this repair.',
            parts: Array.isArray(ticket.parts) ? ticket.parts : [],
            tools: []
          };
        });
        setRepairs(formattedRepairs);
      } catch (err) {
        console.error('Error loading repairs:', err);
        setError('Unable to load repair data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, []);

  // Fetch stockroom parts
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/active-progress/parts');
        if (response.ok) {
          const data = await response.json();
          setStockroomParts(data);
        } else {
          throw new Error('Failed to fetch parts');
        }
      } catch (err) {
        console.warn('no parts available');
       
      }
    };
    fetchParts();
  }, []);

  // Status colors
  const getStatusColor = (status) => {
    const colors = {
      'In Progress': 'bg-blue-100 text-blue-800',
      'Diagnostic': 'bg-purple-100 text-purple-800',
      'Awaiting Parts': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Inspection': 'bg-orange-100 text-orange-800',
      'Ready for Inspection': 'bg-yellow-200 text-yellow-800',
      'Inspection Failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCarStatusColor = (status) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800',
      'Moderate': 'bg-orange-100 text-orange-800',
      'Minor': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter repairs
  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch =
      repair.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || repair.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Assign inspector
  const assignInspector = (inspector) => {
    setSelectedInspector(inspector);
    setShowConfirmInspectorModal(true);
  };

  const handleConfirmAssignInspector = async () => {
    if (!selectedInspector || !selectedRepair) return;
    try {
      const response = await fetch(
        `http://localhost:5001/api/active-progress/${selectedInspector.id}/status-inspector`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Busy',
            ticket_number: selectedRepair.ticketNumber
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        if (data.error && data.error.includes('already has an assigned inspector')) {
          alert(`Error: ${data.error}`);
          return;
        }
        throw new Error(data.error || 'Failed to assign inspector');
      }
      const updatedRepair = {
        ...selectedRepair,
        assignedInspector: selectedInspector.full_name,
        status: 'Inspection'
      };
      setSelectedRepair(updatedRepair);
      setRepairs(prev =>
        prev.map(repair =>
          repair.id === selectedRepair.id ? updatedRepair : repair
        )
      );
      setShowConfirmInspectorModal(false);
      setShowInspectorModal(false);
      alert(`Inspector ${selectedInspector.full_name} assigned. Ticket status updated to 'Inspection'.`);
    } catch (err) {
      console.error('Error assigning inspector:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Tools
  const toggleTool = (tool) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleSaveTools = () => {
    setSelectedRepair(prev => ({ ...prev, tools: selectedTools }));
    setShowToolsModal(false);
  };

  // Completion time
  const handleSaveCompletionTime = async () => {
    if (!selectedRepair || !completionTime) {
      alert('Please select a valid date and time.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/active-progress/${selectedRepair.id}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completion_date: completionTime })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update completion date');
      }
      const formattedDate = completionTime.split('T')[0];
      setSelectedRepair(prev => ({
        ...prev,
        estimatedCompletion: formattedDate
      }));
      setRepairs(prev =>
        prev.map(repair =>
          repair.id === selectedRepair.id
            ? { ...repair, estimatedCompletion: formattedDate }
            : repair
        )
      );
      setShowCompletionTimeModal(false);
      alert('Estimated completion date updated successfully!');
    } catch (err) {
      console.error('Error updating completion date:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Finish repair
  const handleFinishRepair = () => {
    setNotificationMessage(
      `Repair completed for ${selectedRepair.vehicle} (${selectedRepair.licensePlate}). Your vehicle is ready for pickup. Please contact us to schedule pickup at your convenience.`
    );
    setShowNotificationModal(true);
  };

  const handleSendNotification = () => {
    console.log('Sending notification to:', notificationRecipient);
    console.log('Message:', notificationMessage);
    setShowNotificationModal(false);
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);
    setRepairs(prev => prev.map(r =>
      r.id === selectedRepair.id
        ? { ...r, status: 'Completed', progress: 100 }
        : r
    ));
    setSelectedRepair(prev => ({ ...prev, status: 'Completed', progress: 100 }));
  };

  // Parts modal logic
  const filteredParts = stockroomParts.filter(part => {
    const searchLower = searchTerm.toLowerCase();
    return (
      part.name.toLowerCase().includes(searchLower) ||
      part.category.toLowerCase().includes(searchLower) ||
      part.sku?.toLowerCase().includes(searchLower) ||
      part.id.toString().includes(searchTerm)
    );
  });

  const handleSelectPart = (partId, isSelected) => {
    if (isSelected) {
      setSelectedParts([...selectedParts, partId]);
      setQuantities(prev => ({ ...prev, [partId]: 1 }));
    } else {
      setSelectedParts(selectedParts.filter(id => id !== partId));
      setQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[partId];
        return newQuantities;
      });
    }
  };

  const handleQuantityChange = (partId, quantity) => {
    const part = stockroomParts.find(p => p.id === partId);
    const validatedQuantity = Math.max(1, Math.min(quantity, part?.inStock || 1));
    setQuantities({
      ...quantities,
      [partId]: validatedQuantity
    });
  };

  const handleOrderParts = async () => {
    if (!selectedRepair || selectedParts.length === 0) {
      alert('Please select at least one part to order.');
      return;
    }

    // Prepare the items array for the API request
    const itemsToOrder = selectedParts.map(partId => {
      const part = stockroomParts.find(p => p.id === partId);
      return {
        item_id: part.item_id,
        name: part.name,
        category: part.category,
        sku: part.sku,
        price: part.price,
        quantity: quantities[partId] || 1
      };
    });

    try {
      const response = await fetch('http://localhost:5001/api/ordered-parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketNumber: selectedRepair.ticketNumber,
          items: itemsToOrder
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to order parts');
      }

      // Update the selected repair with the ordered parts
      const orderedParts = itemsToOrder.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9), // Generate a temporary ID
        status: 'pending'
      }));

      setSelectedRepair(prev => ({
        ...prev,
        parts: [...prev.parts, ...orderedParts]
      }));

      // Update the repairs list
      setRepairs(prev =>
        prev.map(repair =>
          repair.id === selectedRepair.id
            ? { ...repair, parts: [...repair.parts, ...orderedParts] }
            : repair
        )
      );

      alert(`Successfully ordered ${itemsToOrder.length} part(s)!`);
      setShowPartsModal(false);
      
      // Reset selection
      setSelectedParts([]);
      setQuantities({});
    } catch (err) {
      console.error('Error ordering parts:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Bill calculation
  const updatePart = (index, field, value) => {
    const updatedParts = [...parts];
    updatedParts[index][field] = ['price', 'quantity'].includes(field) ? parseFloat(value) || 0 : value;
    setParts(updatedParts);
  };

  const addNewPart = () => {
    setParts([...parts, { name: '', price: 0, quantity: 1 }]);
  };

  const updateTool = (index, field, value) => {
    const updatedTools = [...tools];
    updatedTools[index][field] = field === 'fee' ? parseFloat(value) || 0 : value;
    setTools(updatedTools);
  };

  const addNewTool = () => {
    setTools([...tools, { name: '', fee: 0 }]);
  };

  const billDetails = useMemo(() => {
    const partsTotal = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const laborTotal = laborHours * laborRate;
    const toolsTotal = tools.reduce((sum, tool) => sum + tool.fee, 0);
    const subtotal = partsTotal + laborTotal + toolsTotal;
    const discountAmount = subtotal * 0.1;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * 0.085;
    const total = subtotalAfterDiscount + taxAmount;
    return { parts, labor: laborTotal, tools, subtotal, discount: discountAmount, tax: taxAmount, total };
  }, [parts, laborHours, laborRate, tools]);

  const generateInvoice = () => {
    alert(`Invoice generated! Total: $${billDetails.total.toFixed(2)}`);
    setShowBillModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Success Toast */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <CheckCircle size={24} />
          <div>
            <p className="font-semibold">Notification Sent!</p>
            <p className="text-sm opacity-90">Customer has been notified successfully.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Active Repairs</h1>
        <p className="text-gray-500 mt-1">Track ongoing vehicle repairs and maintenance</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by ticket number, customer name or license plate..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {['All', 'In Progress', 'Diagnostic', 'Awaiting Parts', 'Completed', 'Inspection'].map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {/* Repair List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading active repairs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">
            <p>{error}</p>
          </div>
        ) : filteredRepairs.length > 0 ? (
          filteredRepairs.map(repair => (
            <div
              key={repair.id}
              onClick={() => setSelectedRepair(repair)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 cursor-pointer hover:ring-2 hover:ring-blue-500"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User size={20} className="text-gray-400" />
                        <h3 className="font-semibold text-gray-900">{repair.customerName}</h3>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium text-blue-600">{repair.ticketNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Car size={18} />
                          <span>{repair.vehicle}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Wrench size={18} />
                          <span>{repair.serviceType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(repair.status)}`}>
                        {repair.status}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ml-2 ${getCarStatusColor(repair.carStatus)}`}>
                        {repair.carStatus}
                      </span>
                      <div className="mt-2 text-sm font-medium text-gray-900">
                        License: {repair.licensePlate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Started: {repair.startDate ? new Date(repair.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Est. Completion: {repair.estimatedCompletion ? new Date(repair.estimatedCompletion).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>Mechanic: {repair.assignedMechanic}</span>
                </div>
                {repair.assignedInspector && (
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} />
                    <span>Inspector: {repair.assignedInspector}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No repairs found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Repair Details Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-fade-up max-h-[90vh] flex flex-col">
            <div className="relative bg-custom-gradient p-6 text-white flex-shrink-0">
              <button
                onClick={() => setSelectedRepair(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold">{selectedRepair.customerName}</h2>
              <div className="flex items-center gap-3 mt-2 text-blue-100">
                <span className="font-medium">{selectedRepair.ticketNumber}</span>
                <span className="text-blue-300">•</span>
                <Car size={18} />
                <span>{selectedRepair.vehicle}</span>
                <span className="text-blue-300">•</span>
                <span>{selectedRepair.licensePlate}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRepair.status)}`}>
                  {selectedRepair.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCarStatusColor(selectedRepair.carStatus)}`}>
                  {selectedRepair.carStatus}
                </span>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                    <AlertCircle size={20} className="text-blue-600" />
                    Service Details
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Ticket #:</strong> {selectedRepair.ticketNumber}</p>
                    <p><strong>Type:</strong> {selectedRepair.serviceType}</p>
                    <p><strong>Location:</strong> {selectedRepair.location}</p>
                    <p><strong>Mechanic:</strong> {selectedRepair.assignedMechanic}</p>
                    {selectedRepair.assignedInspector && (
                      <p><strong>Inspector:</strong> {selectedRepair.assignedInspector}</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                    <CheckCircle2 size={20} className="text-blue-600" />
                    Customer Info
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <Phone size={16} /> {selectedRepair.contact}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={16} /> {selectedRepair.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200 shadow-inner">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                  <ClipboardCheck size={20} className="text-amber-600" />
                  Repair Notes
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 min-h-20 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedRepair.notes}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-800">
                    <Wrench size={20} className="text-blue-600" />
                    Selected Tools
                  </h3>
                  {selectedRepair.tools?.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedRepair.tools.map((tool, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border">
                          <div className="flex items-center gap-2">
                            <Wrench size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">{tool.name || tool}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic">No tools selected</div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-5 border border-green-100">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-800">
                    <PackagePlus size={20} className="text-green-600" />
                    Ordered Parts
                  </h3>
                  {selectedRepair.parts?.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedRepair.parts.map((part, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">{part.name || part}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            Qty: {part.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic">No parts ordered</div>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-2">
                  <Clock size={20} className="text-blue-600" />
                  Estimated Completion Time
                </h3>
                <p className="text-sm text-gray-700 pl-1">
                  {selectedRepair.estimatedCompletion 
                    ? new Date(`${selectedRepair.estimatedCompletion}T10:00`).toLocaleString() 
                    : "Not set yet"}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 justify-end">
                <button onClick={() => setShowPartsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <PackagePlus size={20} /> Order Parts
                </button>
                {!selectedRepair?.assignedInspector ? (
                  <button
                    onClick={() => setShowInspectorModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all"
                  >
                    <UserCheck size={20} /> Assign Inspector
                  </button>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm">
                    <UserCheck size={20} /> Inspector Assigned
                  </span>
                )}
                <button onClick={() => setShowCompletionTimeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  <Clock size={20} /> Set Completion Time
                </button>
                <button onClick={() => setShowBillModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:opacity-90 shadow transition-all">
                  <DollarSign size={20} /> Calculate Bill
                </button>
                <button onClick={handleFinishRepair} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:opacity-90 shadow transition-all">
                  <CheckCircle size={20} /> Finish Repair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Modal */}
      {showInspectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-scale-up">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Assign Inspector</h3>
                <button
                  onClick={() => setShowInspectorModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-70"
                  disabled={loadingInspectors}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedRepair?.assignedInspector && (
                <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl text-amber-900 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-800">Inspector Already Assigned</h4>
                      <p className="mt-1 text-sm">
                        This ticket is already assigned to{' '}
                        <strong className="font-semibold">{selectedRepair.assignedInspector}</strong>.
                        Reassignment is not allowed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {inspectorError && (
                <div className="text-center py-8 text-red-600 font-medium bg-red-50 rounded-xl">
                  <div className="inline-block p-3 bg-red-100 rounded-full mb-2">
                    <AlertCircle size={24} />
                  </div>
                  <p>{inspectorError}</p>
                </div>
              )}
              {loadingInspectors && !inspectorError && (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading inspectors...</p>
                </div>
              )}
              {!inspectorError && !loadingInspectors && !selectedRepair?.assignedInspector && (
                <>
                  {inspectors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-xl">
                      No inspectors available at the moment.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {inspectors.map((inspector) => {
                        const isBusy = inspector.inspection_status === 'busy';
                        return (
                          <div
                            key={inspector.id}
                            onClick={() => !isBusy && assignInspector(inspector)}
                            className={`p-5 border-2 rounded-2xl cursor-pointer transition-all group
                              ${isBusy
                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                                : 'border-gray-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1 bg-gradient-to-b from-gray-50 to-white'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                                  ${isBusy ? 'bg-red-500' : 'bg-blue-500'} group-hover:scale-110 transition-transform
                                `}
                              >
                                {inspector.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className={isBusy ? 'text-gray-500' : 'text-gray-900 font-semibold'}>
                                  {inspector.full_name}
                                </h4>
                                <p className="text-sm text-blue-600">{inspector.role}</p>
                              </div>
                            </div>
                            <div className="space-y-2 text-xs text-gray-600">
                              <p><Mail size={14} className="inline mr-1" /> {inspector.email}</p>
                              <p><Phone size={14} className="inline mr-1" /> {inspector.phone_number}</p>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${isBusy ? 'bg-red-500' : 'bg-green-500'}`}></div>
                              <span className={`text-xs font-medium ${isBusy ? 'text-red-700' : 'text-green-700'}`}>
                                {isBusy ? 'Busy' : 'Available'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              <button
                onClick={() => setShowInspectorModal(false)}
                className="w-full py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium disabled:opacity-70"
                disabled={loadingInspectors}
              >
                {loadingInspectors ? 'Loading...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmInspectorModal && selectedInspector && (
        <div className="fixed inset-0 z-50 text-black flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Confirm Assignment</h3>
            <p>
              Assign <strong>{selectedInspector.full_name}</strong> to inspect ticket{' '}
              <strong>{selectedRepair.ticketNumber}</strong>?
            </p>
            <p className="mt-2 text-sm text-gray-600">
              This will set the inspector's status to "Busy" and change the ticket status to "Inspection".
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmInspectorModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignInspector}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Time Modal */}
      {showCompletionTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Set Estimated Completion Time</h3>
            <input
              type="datetime-local"
              value={completionTime}
              onChange={(e) => setCompletionTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mb-4"
              min={new Date().toISOString().slice(0, 16)}
            />
            {!completionTime && (
              <p className="text-red-500 text-sm mb-4">Please select a valid date and time.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompletionTimeModal(false)}
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCompletionTime}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parts Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Order Parts</h3>
              <button onClick={() => setShowPartsModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Select</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">SKU</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">In Stock</th>
                    <th className="text-left py-2">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map(part => (
                    <tr key={part.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={selectedParts.includes(part.id)}
                          onChange={e => handleSelectPart(part.id, e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-2 text-gray-800">{part.name}</td>
                      <td className="py-2 text-gray-600">{part.sku}</td>
                      <td className="py-2 text-gray-600">{part.category}</td>
                      <td className="py-2 text-gray-800">${part.price.toFixed(2)}</td>
                      <td className="py-2 text-gray-600">{part.inStock}</td>
                      <td className="py-2">
                        {selectedParts.includes(part.id) && (
                          <input
                            type="number"
                            min="1"
                            max={part.inStock}
                            value={quantities[part.id] || 1}
                            onChange={e => handleQuantityChange(part.id, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowPartsModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleOrderParts}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Order Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Send Notification</h3>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32"
              placeholder="Enter your message..."
            />
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Send To</label>
              <select
                value={notificationRecipient}
                onChange={(e) => setNotificationRecipient(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="customer">Customer</option>
                <option value="mechanic">Mechanic</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Generate Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Labor Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={laborHours}
                  onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                  className="w-32 p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Labor Rate ($/hr)</label>
                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                  className="w-32 p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Labor Description</label>
                <input
                  type="text"
                  value={laborDescription}
                  onChange={(e) => setLaborDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <h4 className="text-lg font-semibold mt-6 mb-2">Parts</h4>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Price</th>
                  <th className="text-left py-2">Qty</th>
                  <th className="text-left py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part, idx) => (
                  <tr key={idx}>
                    <td className="py-2">
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => updatePart(idx, 'name', e.target.value)}
                        className="p-1 border rounded w-full"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={part.price}
                        onChange={(e) => updatePart(idx, 'price', e.target.value)}
                        className="w-24 p-1 border rounded"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => updatePart(idx, 'quantity', e.target.value)}
                        className="w-20 p-1 border rounded"
                      />
                    </td>
                    <td className="py-2 font-medium">${(part.price * part.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addNewPart} className="flex items-center gap-1 text-blue-600 mb-4">
              <Plus size={16} /> Add Part
            </button>
            <h4 className="text-lg font-semibold mb-2">Tools</h4>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Fee</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool, idx) => (
                  <tr key={idx}>
                    <td className="py-2">
                      <input
                        type="text"
                        value={tool.name}
                        onChange={(e) => updateTool(idx, 'name', e.target.value)}
                        className="p-1 border rounded w-full"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={tool.fee}
                        onChange={(e) => updateTool(idx, 'fee', e.target.value)}
                        className="w-24 p-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addNewTool} className="flex items-center gap-1 text-blue-600 mb-4">
              <Plus size={16} /> Add Tool
            </button>
            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <div className="space-y-2 text-right">
                <div>Subtotal: <strong>${billDetails.subtotal.toFixed(2)}</strong></div>
                <div>Discount (10%): -${billDetails.discount.toFixed(2)}</div>
                <div>Subtotal after Discount: <strong>${(billDetails.subtotal - billDetails.discount).toFixed(2)}</strong></div>
                <div>Tax (8.5%): +${billDetails.tax.toFixed(2)}</div>
                <div className="text-xl font-bold">Total: ${billDetails.total.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowBillModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={generateInvoice}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg shadow-lg"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activerepair;