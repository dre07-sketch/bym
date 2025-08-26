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
  Plus,
  FileCheck
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
  
  // State variables for tabs and additional data
  const [activeTab, setActiveTab] = useState('overview');
  const [progressLogs, setProgressLogs] = useState([]);
  const [disassembledParts, setDisassembledParts] = useState([]);
  const [usedTools, setUsedTools] = useState([]);
  const [inspectionRecords, setInspectionRecords] = useState([]);
  const [loadingProgressLogs, setLoadingProgressLogs] = useState(false);
  const [loadingDisassembledParts, setLoadingDisassembledParts] = useState(false);
  const [loadingUsedTools, setLoadingUsedTools] = useState(false);
  const [loadingInspectionRecords, setLoadingInspectionRecords] = useState(false);

  // Add new state variables for the outsource modal
const [showOutsourceModal, setShowOutsourceModal] = useState(false);
  const [outsourcedParts, setOutsourcedParts] = useState([]);
  const [ticketNumber, setTicketNumber] = useState("");

  const [outsourceForm, setOutsourceForm] = useState({
    name: '',
    category: 'Engine Parts',
    quantity: 1,
  });

  // Handle form changes
  const handleOutsourceFormChange = (field, value) => {
    setOutsourceForm((prev) => ({ ...prev, [field]: value }));
  };

  // Add part to list
  const handleOutsourceSubmit = () => {
    const trimmedName = outsourceForm.name.trim();
    if (!trimmedName) {
      toast.error("❌ Please enter a valid part name");
      return;
    }

    const newPart = {
      id: Date.now(), // Unique ID
      name: trimmedName,
      category: outsourceForm.category,
      quantity: outsourceForm.quantity,
    };

    setOutsourcedParts((prev) => [...prev, newPart]);

    // Show success toast
    toast.success(`✅ Added: ${newPart.name} ×${newPart.quantity}`, {
      duration: 2000,
    });

    // Reset only the name field, keep category & reset quantity
    setOutsourceForm((prev) => ({
      ...prev,
      name: '',
      quantity: 1, // reset quantity to 1, or keep: prev.quantity
    }));

    // Refocus name input for fast entry
    setTimeout(() => {
      document.getElementById('part-name-input')?.focus();
    }, 100);
  };

  // Remove a part from the list
  const removeOutsourcedPart = (id) => {
    setOutsourcedParts((prev) => prev.filter((part) => part.id !== id));
    toast.success("🗑️ Part removed");
  };

  // Final submit (e.g., send to backend)
const handleFinalOutsourceSubmit = async () => {
  if (outsourcedParts.length === 0) {
    toast.error("⚠️ No parts to submit");
    return;
  }

  if (!ticketNumber.trim()) {
    toast.error("⚠️ Please enter a ticket number");
    return;
  }

  const trimmedTicketNumber = ticketNumber.trim();

  // Show loading
  toast.loading("Submitting parts...", { id: "submit-parts" });

  try {
    // Submit all parts one by one (or use Promise.all)
    const submitPromises = outsourcedParts.map((part) =>
      fetch("http://localhost:5001/api/active-progress/outsource", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_number: trimmedTicketNumber,
          name: part.name,
          category: part.category,
          quantity: part.quantity,
        }),
      }).then((res) => res.json())
    );

    const results = await Promise.all(submitPromises);

    const failed = results.filter((r) => !r.success);
    const succeeded = results.filter((r) => r.success);

    // Update toast
    if (failed.length === 0) {
      toast.success(`✅ Successfully submitted ${succeeded.length} part(s)!`, { id: "submit-parts" });
    } else {
      toast.error(`✅ ${succeeded.length} saved, ❌ ${failed.length} failed`, { id: "submit-parts" });
    }

    console.log("Results:", results);

    // Reset and close
    setShowOutsourceModal(false);
    setOutsourcedParts([]);
    setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
    setTicketNumber("");
  } catch (err) {
    console.error("Error submitting parts:", err);
    toast.error("❌ Network error. Could not submit parts.", { id: "submit-parts" });
  }
};


  // Map ticket data to repair format
  const mapTicketToRepair = (ticket) => {
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
      progress: 0, // Default progress if not provided
      notes: ticket.description || 'No additional notes provided for this repair.',
      parts: ticket.ordered_parts || [], // Use ordered_parts from API
      tools: []
    };
  };

  // Fetch single repair data
  const fetchRepairData = async (repairId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/active-progress/${repairId}`);
      if (!response.ok) throw new Error('Failed to fetch repair');
      const data = await response.json();
      return mapTicketToRepair(data);
    } catch (err) {
      console.error("Error fetching repair data:", err);
      throw err;
    }
  };

  // Refresh selected repair data when opened
  useEffect(() => {
    if (selectedRepair) {
      const refreshRepair = async () => {
        try {
          const updatedRepair = await fetchRepairData(selectedRepair.id);
          setSelectedRepair(prev => ({
            ...prev,
            ...updatedRepair,
            tools: prev.tools // Preserve tools state
          }));
        } catch (err) {
          console.error("Error refreshing repair:", err);
        }
      };
      refreshRepair();
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
        const formattedRepairs = data.map(mapTicketToRepair);
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
          // Convert price to number for each part
          const normalizedData = data.map(part => ({
            ...part,
            price: parseFloat(part.price) || 0
          }));
          setStockroomParts(normalizedData);
        } else {
          throw new Error('Failed to fetch parts');
        }
      } catch (err) {
        console.warn('Using mock parts data');
      }
    };
    fetchParts();
  }, []);

  // New functions to fetch additional data
  const fetchProgressLogs = async (ticketNumber) => {
    setLoadingProgressLogs(true);
    try {
      const response = await fetch(`http://localhost:5001/api/active-progress/progress/${ticketNumber}`);
      if (!response.ok) throw new Error('Failed to fetch progress logs');
      const data = await response.json();
      setProgressLogs(data);
    } catch (err) {
      console.error('Error fetching progress logs:', err);
    } finally {
      setLoadingProgressLogs(false);
    }
  };

  const fetchDisassembledParts = async (ticketNumber) => {
    setLoadingDisassembledParts(true);
    try {
      const response = await fetch(`http://localhost:5001/api/active-progress/diassmbled/${ticketNumber}`);
      if (!response.ok) throw new Error('Failed to fetch disassembled parts');
      const data = await response.json();
      setDisassembledParts(data);
    } catch (err) {
      console.error('Error fetching disassembled parts:', err);
    } finally {
      setLoadingDisassembledParts(false);
    }
  };

  const fetchUsedTools = async (ticketNumber) => {
    setLoadingUsedTools(true);
    try {
      const response = await fetch(`http://localhost:5001/api/active-progress/used-tools/${ticketNumber}`);
      if (!response.ok) throw new Error('Failed to fetch used tools');
      const data = await response.json();
      setUsedTools(data);
    } catch (err) {
      console.error('Error fetching used tools:', err);
    } finally {
      setLoadingUsedTools(false);
    }
  };

  const fetchInspectionRecords = async (ticketNumber) => {
    setLoadingInspectionRecords(true);
    try {
      const response = await fetch(`http://localhost:5001/api/active-progress/inspection/${ticketNumber}`);
      if (!response.ok) throw new Error('Failed to fetch inspection records');
      const data = await response.json();
      setInspectionRecords(data);
    } catch (err) {
      console.error('Error fetching inspection records:', err);
    } finally {
      setLoadingInspectionRecords(false);
    }
  };

  // Reset data when selected repair changes
  useEffect(() => {
    if (selectedRepair) {
      setProgressLogs([]);
      setDisassembledParts([]);
      setUsedTools([]);
      setInspectionRecords([]);
      setActiveTab('overview');
    }
  }, [selectedRepair]);

  // Fetch data when tab is activated
  useEffect(() => {
    if (selectedRepair && activeTab === 'progressLogs' && progressLogs.length === 0) {
      fetchProgressLogs(selectedRepair.ticketNumber);
    }
  }, [selectedRepair, activeTab, progressLogs.length]);

  useEffect(() => {
    if (selectedRepair && activeTab === 'disassembledParts' && disassembledParts.length === 0) {
      fetchDisassembledParts(selectedRepair.ticketNumber);
    }
  }, [selectedRepair, activeTab, disassembledParts.length]);

  useEffect(() => {
    if (selectedRepair && activeTab === 'usedTools' && usedTools.length === 0) {
      fetchUsedTools(selectedRepair.ticketNumber);
    }
  }, [selectedRepair, activeTab, usedTools.length]);

  useEffect(() => {
    if (selectedRepair && activeTab === 'inspection' && inspectionRecords.length === 0) {
      fetchInspectionRecords(selectedRepair.ticketNumber);
    }
  }, [selectedRepair, activeTab, inspectionRecords.length]);

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
        price: parseFloat(part.price) || 0, // Ensure price is a number
        quantity: quantities[partId] || 1
      };
    });
    try {
      const response = await fetch('http://localhost:5001/api/active-progress/ordered-parts', {
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
      // Refresh repair data to get the updated parts list
      try {
        const updatedRepair = await fetchRepairData(selectedRepair.id);
        setSelectedRepair(prev => ({
          ...prev,
          ...updatedRepair,
          tools: prev.tools // Preserve tools state
        }));
        setRepairs(prev =>
          prev.map(repair =>
            repair.id === selectedRepair.id ? updatedRepair : repair
          )
        );
        
        alert(`Successfully ordered ${itemsToOrder.length} part(s)!`);
        setShowPartsModal(false);
        
        // Reset selection
        setSelectedParts([]);
        setQuantities({});
      } catch (refreshErr) {
        console.error('Error refreshing repair after ordering parts:', refreshErr);
        alert(`Parts were ordered successfully, but there was an error refreshing the data: ${refreshErr.message}`);
      }
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
              
              {/* Tab Navigation */}
             <div className="flex mt-6 overflow-x-auto">
  {[
    { id: 'overview', label: 'Overview', icon: SquareStack },
    { id: 'progressLogs', label: 'Progress Logs', icon: ClipboardCheck },
    { id: 'disassembledParts', label: 'Disassembled Parts', icon: Scissors },
    { id: 'usedTools', label: 'Used Tools', icon: Wrench },
    { id: 'orderedParts', label: 'Ordered Parts', icon: PackagePlus },
    { id: 'inspection', label: 'Inspection', icon: FileCheck }
  ].map(tab => (
    <button
      key={tab.id}
      className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
        activeTab === tab.id 
          ? 'text-white bg-blue-500/30 rounded-lg' 
          : 'text-blue-100 hover:text-white hover:bg-blue-500/20 rounded-lg'
      }`}
      onClick={() => setActiveTab(tab.id)}
    >
      <tab.icon size={16} />
      {tab.label}
    </button>
  ))}
</div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'overview' && (
                <>
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
                </>
              )}

              {activeTab === 'progressLogs' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardCheck size={24} className="text-blue-600" />
                    Progress Timeline
                  </h3>
                  
                  {loadingProgressLogs ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : progressLogs.length > 0 ? (
                    <div className="space-y-4">
                      {progressLogs.map((log, index) => (
                        <div key={log.id} className="flex">
                          <div className="flex flex-col items-center mr-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              log.status === 'Completed' ? 'bg-green-500' : 
                              log.status === 'In Progress' ? 'bg-blue-500' : 
                              'bg-gray-400'
                            } text-white`}>
                              {log.status === 'Completed' ? <CheckCircle size={18} /> : 
                               log.status === 'In Progress' ? <Timer size={18} /> : 
                               <Clock size={18} />}
                            </div>
                            {index < progressLogs.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          <div className="pb-6 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`font-medium ${
                                  log.status === 'Completed' ? 'text-green-700' : 
                                  log.status === 'In Progress' ? 'text-blue-700' : 
                                  'text-gray-700'
                                }`}>
                                  {log.status}
                                </span>
                                <div className="text-sm text-gray-500 mt-1">
                                  {log.date} at {log.time}
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                              {log.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                      <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No progress logs available for this repair</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'disassembledParts' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Scissors size={24} className="text-purple-600" />
                    Disassembled Parts
                  </h3>
                  
                  {loadingDisassembledParts ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : disassembledParts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reassembly Verified</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {disassembledParts.map(part => (
                            <tr key={part.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.part_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  part.condition === 'Good' ? 'bg-green-100 text-green-800' :
                                  part.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {part.condition}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  part.status === 'Repaired' ? 'bg-green-100 text-green-800' :
                                  part.status === 'Replaced' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {part.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">{part.notes}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {part.reassembly_verified ? (
                                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 flex items-center gap-1">
                                    <CheckCircle size={12} /> Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Not Verified</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                      <Scissors size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No disassembled parts recorded for this repair</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'usedTools' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Wrench size={24} className="text-amber-600" />
                    Used Tools
                  </h3>
                  
                  {loadingUsedTools ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
                    </div>
                  ) : usedTools.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {usedTools.map(tool => (
                        <div key={tool.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                <Wrench size={16} className="text-amber-500" />
                                {tool.tool_name}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">ID: {tool.tool_id}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tool.status === 'Returned' ? 'bg-green-100 text-green-800' :
                              tool.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {tool.status}
                            </span>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <PackagePlus size={14} className="text-gray-400" />
                              <span className="text-gray-600">Qty: {tool.assigned_quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <span className="text-gray-600">By: {tool.assigned_by}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                Assigned: {new Date(tool.assigned_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                {tool.returned_at 
                                  ? `Returned: ${new Date(tool.returned_at).toLocaleDateString()}` 
                                  : 'Not returned'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                      <Wrench size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No tools recorded for this repair</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orderedParts' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <PackagePlus size={24} className="text-green-600" />
                    Ordered Parts
                  </h3>
                  
                  {selectedRepair.parts?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedRepair.parts.map((part, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.sku}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.category}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${(parseFloat(part.price) || 0).toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{part.quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  part.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  part.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                  part.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {part.status || 'ordered'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                      <PackagePlus size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No parts ordered for this repair</p>
                      <button 
                        onClick={() => setShowPartsModal(true)}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <PackagePlus size={16} /> Order Parts
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inspection' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileCheck size={24} className="text-indigo-600" />
                    Inspection Records
                  </h3>
                  
                  {loadingInspectionRecords ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : inspectionRecords.length > 0 ? (
                    <div className="space-y-4">
                      {inspectionRecords.map((record, index) => (
                        <div key={record.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                record.inspection_status === 'Passed' ? 'bg-green-100 text-green-800' :
                                record.inspection_status === 'Failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.inspection_status}
                              </span>
                              <div className="text-sm text-gray-500 mt-1">
                                {new Date(record.inspection_date).toLocaleDateString()} at {new Date(record.inspection_date).toLocaleTimeString()}
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                              {new Date(record.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700">Main Issue Resolved</p>
                              <p className="text-sm mt-1">
                                {record.main_issue_resolved ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle size={14} /> Yes
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <X size={14} /> No
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700">Reassembly Verified</p>
                              <p className="text-sm mt-1">
                                {record.reassembly_verified ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle size={14} /> Yes
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <X size={14} /> No
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">General Condition</p>
                            <div className="text-sm bg-white p-3 rounded-lg border border-gray-200">
                              {record.general_condition}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                            <div className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                              {record.notes || 'No additional notes provided.'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                      <FileCheck size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No inspection records available for this repair</p>
                      
                    </div>
                  )}
                </div>
              )}

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
  <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-black/50 backdrop-blur-sm">
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
                <td className="py-2 text-gray-800">
                  ${(parseFloat(part.price) || 0).toFixed(2)}
                </td>
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
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setShowOutsourceModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
        >
          <Plus size={16} /> Outsource Part
        </button>
        <div className="flex gap-3">
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
  </div>
)}

// Add the Outsource modal
 {showOutsourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Outsource Parts</h3>
              <button
                onClick={() => {
                  setShowOutsourceModal(false);
                  setOutsourcedParts([]);
                  setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
                  setTicketNumber('');
                }}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Add New Part Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-3">Add New Part</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Name
                    </label>
                    <input
                      id="part-name-input"
                      type="text"
                      value={outsourceForm.name}
                      onChange={(e) =>
                        handleOutsourceFormChange('name', e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleOutsourceSubmit();
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="Enter part name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={outsourceForm.category}
                      onChange={(e) =>
                        handleOutsourceFormChange('category', e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="Engine Parts">Engine Parts</option>
                      <option value="Brake System">Brake System</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Transmission">Transmission</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Exhaust">Exhaust</option>
                      <option value="Cooling System">Cooling System</option>
                      <option value="Fuel System">Fuel System</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={outsourceForm.quantity}
                      onChange={(e) =>
                        handleOutsourceFormChange(
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleOutsourceSubmit}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors"
                >
                  <Plus size={16} /> Add to List
                </button>
              </div>

              {/* Ticket Number Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="Enter ticket number"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Parts List */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="font-medium mb-3">
                  Parts to Outsource ({outsourcedParts.length})
                </h4>
                {outsourcedParts.length > 0 ? (
                  <div className="overflow-y-auto flex-1 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">Name</th>
                          <th className="text-left py-2 px-3 font-medium">Category</th>
                          <th className="text-left py-2 px-3 font-medium">Quantity</th>
                          <th className="text-center py-2 px-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outsourcedParts.map((part) => (
                          <tr key={part.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{part.name}</td>
                            <td className="py-2 px-3">{part.category}</td>
                            <td className="py-2 px-3">{part.quantity}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => removeOutsourcedPart(part.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p>No parts added yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowOutsourceModal(false);
                  setOutsourcedParts([]);
                  setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
                  setTicketNumber('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalOutsourceSubmit}
                disabled={outsourcedParts.length === 0 || !ticketNumber.trim()}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  outsourcedParts.length === 0 || !ticketNumber.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <PackagePlus size={16} /> Submit All Parts
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
    
    </div>
  );
};

export default Activerepair;