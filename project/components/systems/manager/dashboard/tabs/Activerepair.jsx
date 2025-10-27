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
  Timer,
  Package,
  UserCheck,
  ClipboardCheck,
  Wrench,
  CheckSquare,
  Bell,
  Send,
  Plus,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import OutsourceMechanicModal from './pop up/OutsourceMechanicModal';

const Activerepair = () => {
  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
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
  const [partsSubTab, setPartsSubTab] = useState('stock');
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
  const [showOutsourceMechanicModal, setShowOutsourceMechanicModal] = useState(false);
  // Add this with your other state variables
  const [partsText, setPartsText] = useState('');
  // Add new state variables for the outsource modal
  const [showOutsourceModal, setShowOutsourceModal] = useState(false);
  const [outsourcedParts, setOutsourcedParts] = useState([]);
  const [outsourceForm, setOutsourceForm] = useState({
    name: '',
    category: 'Engine Parts',
    quantity: 1,
  });
  // Checklist display names mapping
  const checklistDisplayNames = {
    check_oil_leaks: "Oil Leaks",
    check_engine_air_filter_oil_coolant_level: "Engine/Air Filter/Oil/Coolant",
    check_brake_fluid_levels: "Brake Fluid Levels",
    check_gluten_fluid_levels: "Gear/Clutch Fluid Levels",
    check_battery_timing_belt: "Battery & Timing Belt",
    check_tire: "Tire Condition",
    check_tire_pressure_rotation: "Tire Pressure & Rotation",
    check_lights_wiper_horn: "Lights, Wiper & Horn",
    check_door_locks_central_locks: "Door Locks & Central Locks",
    check_customer_work_order_reception_book: "Customer Work Order & Reception Book"
  };

  // Helper function to format service type
  const formatServiceType = (type) => {
    if (!type) return 'General Repair';
    return type
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper functions for status styling
  const getStatusStyle = (status) => {
    switch(status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusText = (status) => {
    switch(status) {
      case 'passed':
        return 'Yes';
      case 'failed':
        return 'No';
      default:
        return 'Not Checked';
    }
  };

  const handleMarkForInspection = async () => {
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/active-progress/${selectedRepair.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Inspection' })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      const updatedRepair = { ...selectedRepair, status: 'Inspection' };
      setSelectedRepair(updatedRepair);
      setRepairs(prev => 
        prev.map(repair => repair.id === selectedRepair.id ? updatedRepair : repair)
      );

      setShowInspectionModal(false);
      alert('Repair marked as Inspection!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Handle form changes
  const handleFinalOutsourceSubmit = async () => {
    if (outsourcedParts.length === 0) {
      alert("⚠️ No parts to submit");
      return;
    }
    const ticketNumber = selectedRepair?.ticketNumber?.trim();
    if (!ticketNumber) {
      alert("❌ Ticket number missing from repair");
      return;
    }
    try {
      const submitPromises = outsourcedParts.map((part) => {
        // Validate each part has required fields
        if (!part.name || !part.category || !part.quantity) {
          throw new Error(`Missing required fields in part: ${JSON.stringify(part)}`);
        }
        return fetch("https://ipasystem.bymsystem.com/api/active-progress/outsource", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticket_number: ticketNumber,
            name: part.name,
            category: part.category,
            quantity: part.quantity,
          }),
        }).then((res) => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.message || "Failed to submit part");
            });
          }
          return res.json();
        });
      });
      const results = await Promise.all(submitPromises);
      const succeeded = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      if (failed.length === 0) {
        alert(`✅ Successfully submitted ${succeeded.length} part(s)!`);
      } else {
        alert(`✅ ${succeeded.length} saved, ❌ ${failed.length} failed`);
      }
      // Reset and close
      setShowOutsourceModal(false);
      setOutsourcedParts([]);
      setOutsourceForm({ name: '', category: 'Engine Parts', quantity: 1 });
    } catch (err) {
      console.error("Error submitting outsourced parts:", err);
      alert(`❌ Error: ${err.message}`);
    }
  };
  const handleOutsourceMechanicSuccess = (data) => {
    alert(`✅ Mechanic outsourced successfully! ID: ${data.id}`);
    // Refresh repair data to get updated outsource mechanic info
    if (selectedRepair) {
      fetchRepairData(selectedRepair.id).then(updatedRepair => {
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
      }).catch(err => {
        console.error('Error refreshing repair data:', err);
      });
    }
  };
  // Remove a part from the list
  const removeOutsourcedPart = (id) => {
    setOutsourcedParts((prev) => prev.filter((part) => part.id !== id));
    alert("🗑️ Part removed");
  };
  // Add this function to the component (before the return statement)
  const handleOutsourceFormChange = (field, value) => {
    setOutsourceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleOutsourceSubmit = () => {
    if (!outsourceForm.name.trim()) {
      alert("Please enter a part name");
      return;
    }
    const newPart = {
      id: Date.now(), // Simple unique ID
      name: outsourceForm.name,
      category: outsourceForm.category,
      quantity: outsourceForm.quantity
    };
    setOutsourcedParts(prev => [...prev, newPart]);
    // Reset form but keep category and quantity defaults
    setOutsourceForm(prev => ({
      ...prev,
      name: '',
      quantity: 1
    }));
    // Focus back to the name input
    setTimeout(() => {
      const nameInput = document.getElementById('part-name-input');
      if (nameInput) nameInput.focus();
    }, 0);
  };
  // Reusable component for outsourced parts tab
  const OutsourcedPartsTabContent = ({ ticketNumber }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      if (!ticketNumber) return;
      setLoading(true);
      fetch(`https://ipasystem.bymsystem.com/api/active-progress/get-outsource-part`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            const filtered = result.data.filter(p => p.ticket_number === ticketNumber);
            setData(filtered);
          } else {
            setData([]);
          }
        })
        .catch(err => {
          console.error("Error fetching outsourced parts:", err);
          setData([]);
        })
        .finally(() => setLoading(false));
    }, [ticketNumber]);
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }
    if (data.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <Package size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500">No outsourced parts found for this repair.</p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-xl text-black">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Shop</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((part) => (
              <tr key={part.auto_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{part.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{part.category}</td>
                <td className="px-6 py-4 text-sm">{part.quantity}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    part.status === 'received' ? 'bg-green-100 text-green-800' :
                    part.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {part.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(part.requested_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{part.source_shop || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
  
  // Get the first mechanic from the mechanics array if available
  const assignedMechanic = ticket.mechanics && ticket.mechanics.length > 0 
    ? ticket.mechanics[0].mechanic_name 
    : 'Unassigned';
    
  // FIX: Deduplicate mechanics array
  const uniqueMechanics = ticket.mechanics ? 
    ticket.mechanics.filter((mechanic, index, self) => 
      index === self.findIndex(m => 
        m.mechanic_name === mechanic.mechanic_name && 
        m.assigned_at === mechanic.assigned_at
      )
    ) : [];

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
    assignedMechanic,
    assignedInspector: ticket.inspector_assign || null,
    serviceType: formatServiceType(ticket.type),
    contact: phone,
    email,
    location: 'Main Bay',
    progress: 0,
    notes: ticket.description || 'No additional notes provided for this repair.',
    parts: ticket.ordered_parts || [],
    tools: [],
    mechanics: uniqueMechanics, // Use deduplicated mechanics
    outsource_mechanic: ticket.outsource_mechanic || null,
  };
};
  // Fetch single repair data
  const fetchRepairData = async (repairId) => {
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/active-progress/${repairId}`);
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
  // Fetch in-progress repairs
  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/active-progress/in-progress');
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
        const response = await fetch('https://ipasystem.bymsystem.com/api/active-progress/parts');
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
      const response = await fetch(`https://ipasystem.bymsystem.com/api/active-progress/progress/${ticketNumber}`);
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
      const response = await fetch(`https://ipasystem.bymsystem.com/api/active-progress/diassmbled/${ticketNumber}`);
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
      const response = await fetch(`https://ipasystem.bymsystem.com/api/active-progress/used-tools/${ticketNumber}`);
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
      const response = await fetch(`https://ipasystem.bymsystem.com/api/active-progress/inspection/${ticketNumber}`);
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
      const response = await fetch(`https://ipasystem.bymsystem.com/api/active-progress/${selectedRepair.id}/completion`, {
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

  // State for parts form and list
  const [partsForm, setPartsForm] = useState({ name: '', quantity: 1 });
  const [partsToOrder, setPartsToOrder] = useState([]);

  // Handler for form changes
  const handlePartsFormChange = (field, value) => {
    setPartsForm(prev => ({ ...prev, [field]: value }));
  };

  // Handler to add a part to the order list
  const handleAddPartToOrder = () => {
    if (!partsForm.name.trim()) {
      alert("Please enter a part name");
      return;
    }
    const newPart = {
      id: Date.now(), // Simple unique ID
      name: partsForm.name,
      quantity: partsForm.quantity
    };
    setPartsToOrder(prev => [...prev, newPart]);
    // Reset form but keep quantity defaults
    setPartsForm(prev => ({
      ...prev,
      name: '',
      quantity: 1
    }));
    // Focus back to the name input
    setTimeout(() => {
      const nameInput = document.getElementById('part-name-input');
      if (nameInput) nameInput.focus();
    }, 0);
  };

  // Handler to remove a part from the order list
  const removePartFromOrder = (id) => {
    setPartsToOrder(prev => prev.filter(part => part.id !== id));
  };

  // Updated handler for ordering parts
  const handleOrderParts = async () => {
    if (partsToOrder.length === 0) {
      alert('Please add at least one part to order.');
      return;
    }

    try {
      // Format parts as a string for the parts_needed field
      const partsNeededText = partsToOrder
        .map(part => `${part.name} (Quantity: ${part.quantity})`)
        .join('\n');

      const response = await fetch('https://ipasystem.bymsystem.com/api/active-progress/parts-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketNumber: selectedRepair.ticketNumber,
          parts_needed: partsNeededText
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to order parts');
      }

      // Show success message
      alert(`Successfully ordered parts for ${selectedRepair.ticketNumber}!`);
      
      // Reset and close modal
      setShowPartsModal(false);
      setPartsToOrder([]);
      setPartsForm({ name: '', quantity: 1 });
      
      // Refresh repair data
      if (selectedRepair) {
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

  const formatInspectionChecklist = (inspection) => {
    return {
      ...inspection,
      checklist: {
        oilLeaks: inspection.check_oil_leaks === 'Yes' ? true : inspection.check_oil_leaks === 'No' ? false : null,
        engineAirFilterOilCoolant: inspection.check_engine_air_filter_oil_coolant_level === 'Yes' ? true : inspection.check_engine_air_filter_oil_coolant_level === 'No' ? false : null,
        brakeFluidLevels: inspection.check_brake_fluid_levels === 'Yes' ? true : inspection.check_brake_fluid_levels === 'No' ? false : null,
        glutenFluidLevels: inspection.check_gluten_fluid_levels === 'Yes' ? true : inspection.check_gluten_fluid_levels === 'No' ? false : null,
        batteryTimingBelt: inspection.check_battery_timing_belt === 'Yes' ? true : inspection.check_battery_timing_belt === 'No' ? false : null,
        tire: inspection.check_tire === 'Yes' ? true : inspection.check_tire === 'No' ? false : null,
        tirePressureRotation: inspection.check_tire_pressure_rotation === 'Yes' ? true : inspection.check_tire_pressure_rotation === 'No' ? false : null,
        lightsWiperHorn: inspection.check_lights_wiper_horn === 'Yes' ? true : inspection.check_lights_wiper_horn === 'No' ? false : null,
        doorLocksCentralLocks: inspection.check_door_locks_central_locks === 'Yes' ? true : inspection.check_door_locks_central_locks === 'No' ? false : null,
        customerWorkOrderReceptionBook: inspection.check_customer_work_order_reception_book === 'Yes' ? true : inspection.check_customer_work_order_reception_book === 'No' ? false : null
      }
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Success Toast */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <CheckSquare size={24} />
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
                        <p>
                          <strong>Mechanic:</strong> {selectedRepair.assignedMechanic}
                          {selectedRepair.mechanics && selectedRepair.mechanics.length > 1 && (
                            <span className="text-xs text-gray-500 ml-2">
                              (+{selectedRepair.mechanics.length - 1} more)
                            </span>
                          )}
                        </p>
                        {selectedRepair.outsource_mechanic && (
                          <p><strong>Outsource Mechanic:</strong> {selectedRepair.outsource_mechanic}</p>
                        )}
                        {selectedRepair.assignedInspector && (
                          <p><strong>Inspector:</strong> {selectedRepair.assignedInspector}</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                        <CheckSquare size={20} className="text-blue-600" />
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
                  {/* Assigned Mechanics Section */}
                  {selectedRepair.mechanics && selectedRepair.mechanics.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-xl p-5">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                        <UserCheck size={20} className="text-blue-600" />
                        Assigned Mechanics
                      </h3>
                      <div className="space-y-3">
                        {selectedRepair.mechanics.map((mechanic, index) => (
                          <div key={mechanic.id || index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                              {mechanic.mechanic_name ? mechanic.mechanic_name.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{mechanic.mechanic_name || 'Unknown Mechanic'}</p>
                              <p className="text-xs text-gray-500">
                                Assigned: {mechanic.assigned_at ? new Date(mechanic.assigned_at).toLocaleDateString() : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                              {log.status === 'Completed' ? <CheckSquare size={18} /> : 
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
                                    <CheckSquare size={12} /> Verified
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
                  {/* Internal Tabs */}
                  <div className="flex space-x-1 border-b">
                    <button
                      onClick={() => setPartsSubTab('stock')}
                      className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
                        partsSubTab === 'stock'
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Stock Parts
                    </button>
                    <button
                      onClick={() => setPartsSubTab('outsourced')}
                      className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
                        partsSubTab === 'outsourced'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Outsource History
                    </button>
                  </div>
                  {/* Stock Parts Tab */}
                  {partsSubTab === 'stock' && (
                    <>
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
                          <p className="text-gray-500">No stock parts ordered for this repair</p>
                          
                        </div>
                      )}
                    </>
                  )}
                  {/* Outsource History Tab */}
                  {partsSubTab === 'outsourced' && (
                    <>
                      <OutsourcedPartsTabContent ticketNumber={selectedRepair?.ticketNumber} />
                      <div className="mt-4 flex justify-end">
                     
                      </div>
                    </>
                  )}
                </div>
              )}
              {activeTab === 'inspection' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-black flex items-center gap-2">
                    <FileCheck size={24} className="text-indigo-600" />
                    Inspection Records
                  </h3>
                  {loadingInspectionRecords ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : inspectionRecords.length > 0 ? (
                    <div className="space-y-4">
                      {inspectionRecords.map((record, index) => {
                        // Format the inspection data using the provided function
                        const formattedInspection = formatInspectionChecklist(record);
                        
                        return (
                          <div key={record.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-black">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  record.inspection_status === 'pass' ? 'bg-green-100 text-green-800' :
                                  record.inspection_status === 'fail' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {record.inspection_status === 'pass' ? 'Successful' : 
                                   record.inspection_status === 'fail' ? 'Failed' : 'Pending'}
                                </span>
                                <div className="text-sm text-gray-500 mt-1">
                                  {new Date(record.inspection_date).toLocaleDateString()} at {new Date(record.inspection_date).toLocaleTimeString()}
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                {new Date(record.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Inspection Checklist Section - Two Column Layout */}
                            <div className="mb-6">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <FileCheck size={18} className="text-indigo-600" />
                                Inspection Checklist
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(formattedInspection.checklist).map(([key, value]) => {
                                  // Get the display name for this checklist item
                                  const displayName = checklistDisplayNames[
                                    `check_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`
                                  ] || key;
                                  
                                  return (
                                    <div 
                                      key={key} 
                                      className={`p-3 rounded-lg border transition-all duration-200 ${
                                        value === true 
                                          ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                                          : value === false 
                                            ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {/* Icon */}
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            value === true 
                                              ? 'bg-emerald-100 text-emerald-600' 
                                              : value === false 
                                                ? 'bg-red-100 text-red-600' 
                                                : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {value === true && <CheckSquare size={14} />}
                                            {value === false && <X size={14} />}
                                            {value === null && (
                                              <span className="text-xs">?</span>
                                            )}
                                          </div>
                                          <span className="text-sm font-medium">{displayName}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {value === true && (
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full flex items-center gap-1">
                                              <CheckSquare size={12} className="text-emerald-600" />
                                              Yes
                                            </span>
                                          )}
                                          {value === false && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full flex items-center gap-1">
                                              <X size={12} className="text-red-600" />
                                              No
                                            </span>
                                          )}
                                          {value === null && (
                                            <span className="text-sm text-gray-500">Not Checked</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-gray-700">Main Issue Resolved</p>
                                <p className="text-sm mt-1">
                                  {record.main_issue_resolved === 'Resolved' ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle2 size={14} /> Yes
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
                                  {record.reassembly_verified === 'Yes' ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle2 size={14} /> Yes
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
                              <p className="text-sm font-medium text-black mb-1">General Condition</p>
                              <div className="text-sm bg-white p-3 rounded-lg border border-gray-200">
                                {record.general_condition}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-black mb-1">Notes</p>
                              <div className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                                {record.notes || 'No additional notes provided.'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
               
                {selectedRepair?.status !== 'Inspection' ? (
                  <button
                    onClick={() => setShowInspectionModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all"
                  >
                    <FileCheck size={20} /> Mark for Inspection
                  </button>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm">
                    <FileCheck size={20} /> In Inspection
                  </span>
                )}
                <button onClick={() => setShowCompletionTimeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  <Clock size={20} /> Set Completion Time
                </button>
               <button 
                  onClick={() => setShowOutsourceMechanicModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserCheck size={20} /> Outsource Mechanic
                </button>
               
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-scale-up">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Ready for Inspection?</h3>
                <button
                  onClick={() => setShowInspectionModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FileCheck size={32} className="text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Mark for Inspection</h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  This will change the status of <span className="font-semibold">{selectedRepair?.ticketNumber}</span> to "Inspection" 
                  and notify the inspection team that the vehicle is ready for quality assessment.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertCircle size={18} className="text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-800">What happens next?</h5>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        <span>Inspection team will be notified immediately</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        <span>Vehicle will be moved to inspection bay</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        <span>Quality assessment will begin within 2 hours</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInspectionModal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkForInspection}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileCheck size={20} />
                  Mark for Inspection
                </button>
              </div>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Request Parts</h3>
              <button
                onClick={() => {
                  setShowPartsModal(false);
                  setPartsToOrder([]);
                  setPartsForm({ name: '', quantity: 1 });
                }}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Auto-Display Ticket Number */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <strong>Ticket Number:</strong> {selectedRepair?.ticketNumber || 'N/A'}
              </div>
              
              {/* Add New Part Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-3">Add Part to Request</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Name
                    </label>
                    <input
                      id="part-name-input"
                      type="text"
                      value={partsForm.name}
                      onChange={(e) =>
                        handlePartsFormChange('name', e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddPartToOrder();
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter part name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={partsForm.quantity}
                      onChange={(e) =>
                        handlePartsFormChange(
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddPartToOrder}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} /> Add to Request
                </button>
              </div>
              
              {/* Parts List */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="font-medium mb-3">
                  Parts to Request ({partsToOrder.length})
                </h4>
                {partsToOrder.length > 0 ? (
                  <div className="overflow-y-auto flex-1 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">Name</th>
                          <th className="text-left py-2 px-3 font-medium">Quantity</th>
                          <th className="text-center py-2 px-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partsToOrder.map((part) => (
                          <tr key={part.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{part.name}</td>
                            <td className="py-2 px-3">{part.quantity}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => removePartFromOrder(part.id)}
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
            <div className="mt-6 flex gap-3 justify-between items-center">
              <button
                onClick={() => setShowOutsourceModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} /> Outsource Part
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPartsModal(false);
                    setPartsToOrder([]);
                    setPartsForm({ name: '', quantity: 1 });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOrderParts}
                  disabled={partsToOrder.length === 0}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    partsToOrder.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow active:scale-95'
                  }`}
                >
                  <Send size={16} /> Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Outsource Parts Modal */}
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
                }}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Auto-Display Ticket Number */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <strong>Ticket Number:</strong> {selectedRepair?.ticketNumber || 'N/A'}
              </div>
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
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalOutsourceSubmit}
                disabled={outsourcedParts.length === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  outsourcedParts.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow active:scale-95'
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
      <OutsourceMechanicModal
        isOpen={showOutsourceMechanicModal}
        onClose={() => setShowOutsourceMechanicModal(false)}
        ticketNumber={selectedRepair?.ticketNumber}
        onSuccess={handleOutsourceMechanicSuccess}
      />
    </div>
  );
};
export default Activerepair;