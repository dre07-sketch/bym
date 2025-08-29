'use client';
import { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Filter, Eye, Edit, Trash2, Clock, 
  AlertTriangle, CheckCircle, User, Car, Phone, Mail, Calendar,
  MapPin, Wrench, DollarSign, FileText, Star, X, Package, PenTool, 
  ChevronDown, ChevronUp, ClipboardList, CheckSquare, ListChecks,
  SquareStack, ClipboardCheck, Scissors, PackagePlus, FileCheck, Users, UserCheck, 
  CreditCard,



} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/components/ui/NotificationSystem';
import NewTicketModal from '../pop up/NewTicketModal';
import PaymentFormModal from '../pop up/PaymentFormModal';

// Mock mechanics data
const mechanics = [
  { id: 1, name: 'Mike Johnson', specialty: 'Engine & Transmission' },
  { id: 2, name: 'Sarah Wilson', specialty: 'General Maintenance' },
  { id: 3, name: 'Tom Brown', specialty: 'Electrical & Diagnostics' },
  { id: 4, name: 'Lisa Davis', specialty: 'Brakes & Suspension' }
];

export default function ServiceTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showTicketDetails, setShowTicketDetails] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { addNotification } = useNotifications();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
const [selectedMechanic, setSelectedMechanic] = useState(null);
const [activeMechanicTab, setActiveMechanicTab] = useState(null);
const [orderedPartsActiveTab, setOrderedPartsActiveTab] = useState('ordered'); // 'ordered' or 'outsource'
// Safely convert payment values to numbers (moved inside the map)


// Add this function to handle payment added
const handlePaymentAdded = (paymentData) => {
  addNotification({
    type: 'success',
    title: 'Payment Added',
    message: `Payment of ETB ${paymentData.payment_amount} added for ${selectedMechanic.mechanic_name}`
  });
  
  // Refresh ticket details to show the new payment
  if (showTicketDetails) {
    fetchTicketDetails(showTicketDetails.ticket_number);
  }
}
  
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/tickets/service_tickets');
        if (!response.ok) throw new Error('Failed to fetch tickets');
        const data = await response.json();
        const normalizedData = data.map(ticket => ({
          ...ticket,
          status: ticket.status === 'in progress' 
            ? 'in-progress' 
            : ticket.status.toLowerCase().replace(/\s+/g, '-')
        }));
        setTickets(normalizedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        addNotification({
          type: 'error',
          title: 'Failed to load tickets',
          message: 'Could not fetch service tickets from the server'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [addNotification]);

const fetchTicketDetails = async (ticketNumber) => {
  try {
    const response = await fetch(`http://localhost:5001/api/tickets/service_tickets/${ticketNumber}`);
    if (!response.ok) throw new Error('Failed to fetch ticket details');
    const data = await response.json();
    const normalizedTicket = {
      ...data,
      status: data.status === 'in progress' 
        ? 'in-progress' 
        : data.status.toLowerCase().replace(/\s+/g, '-')
    };
    
    // Set ticket details first without payment history
    setShowTicketDetails({
      ...normalizedTicket,
      paymentHistory: null
    });
    
    setActiveTab('overview');
    
    // Then try to fetch payment history separately
    try {
      const paymentResponse = await fetch(`http://localhost:5001/api/outsource-mechanic-payments/outsource-payments/${ticketNumber}`);
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        // Update the ticket details with payment history
        setShowTicketDetails(prev => ({
          ...prev,
          paymentHistory: paymentData
        }));
      } else {
        console.warn('Payment history endpoint returned non-OK status');
      }
    } catch (paymentErr) {
      console.warn('Error fetching payment history:', paymentErr);
      // Don't show error notification for payment history failure
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred');
    addNotification({
      type: 'error',
      title: 'Failed to load ticket',
      message: 'Could not fetch ticket details'
    });
  }
};
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'ready-for-inspection': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inspection: 'bg-orange-100 text-orange-800 border-orange-200',
      'successful-inspection': 'bg-green-100 text-green-800 border-green-200',
      'inspection-failed': 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-green-200 text-green-900 border-green-300',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    return priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
  };

  const formatDateTime = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  };

  const formatDateOnly = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };
  const openPaymentModal = (mechanic) => {
  setSelectedMechanic(mechanic);
  setIsPaymentModalOpen(true);
};

  const renderDescription = (desc) => {
    const lines = (desc || '').trim().split(/\n|;/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      return (
        <ul className="space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2"></span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-sm text-gray-700">{desc || 'No description provided.'}</p>;
  };

  const toggleLogs = (ticketNumber) => {
    setExpandedLogs(prev => ({ ...prev, [ticketNumber]: !prev[ticketNumber] }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: SquareStack },
    { id: 'progressLogs', label: 'Progress Logs', icon: ClipboardCheck },
    { id: 'disassembledParts', label: 'Disassembled Parts', icon: Scissors },
    { id: 'usedTools', label: 'Used Tools', icon: Wrench },
    { id: 'orderedParts', label: 'Ordered Parts', icon: PackagePlus },
    { id: 'inspection', label: 'Inspection', icon: FileCheck }
  ];

  // Get mechanic details by ID
  const getMechanicDetails = (mechanicId) => {
    return mechanics.find(m => m.id === parseInt(mechanicId)) || { name: 'Unknown', specialty: 'Not specified' };
  };

  // Get inspector from inspection data
  const getInspector = () => {
    if (showTicketDetails.inspections && showTicketDetails.inspections.length > 0) {
      // In a real app, this would come from the inspection data
      // For now, we'll use a placeholder
      return { name: 'Inspector Name', role: 'Quality Assurance' };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Service Tickets
          </h1>
          <p className="text-gray-600 mt-1">Manage and track all service requests</p>
        </div>
        <Button 
         onClick={() => setIsNewTicketOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: 'Total', value: tickets.length, icon: Ticket, color: 'from-blue-500 to-blue-600' },
          { label: 'Pending', value: tickets.filter(t => t.status === 'pending').length, icon: Clock, color: 'from-gray-500 to-gray-600' },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, icon: Wrench, color: 'from-purple-500 to-purple-600' },
          { label: 'Inspection', value: tickets.filter(t => t.status.includes('inspection')).length, icon: AlertTriangle, color: 'from-orange-500 to-orange-600' },
          { label: 'Completed', value: tickets.filter(t => t.status === 'completed').length, icon: CheckCircle, color: 'from-green-500 to-green-600' }
        ].map((stat, i) => (
          <Card key={i} className={`bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-white/80 drop-shadow-sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Filters */}
      <Card className="shadow-lg border-none rounded-xl overflow-hidden">
        <CardContent className="p-6 bg-white">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets by ID, customer, or plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-gray-300 focus:ring-blue-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="ready-for-inspection">Ready for Inspection</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="successful-inspection">Successful Inspection</SelectItem>
                <SelectItem value="inspection-failed">Inspection Failed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48 border-gray-300 focus:ring-blue-500">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.ticket_number} className="hover:shadow-xl transition-all duration-300 border hover:border-blue-200 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)} animate-pulse shadow-sm`}></div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h3>
                      <Badge className={`${getStatusColor(ticket.status)} px-3 py-1 text-sm font-medium`}>
                        {ticket.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-2">
                        {ticket.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-blue-700 mb-2">{ticket.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{ticket.customer_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Car className="w-4 h-4" />
                          <span>{ticket.vehicle_info} ({ticket.license_plate})</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-700">Est: {formatDateOnly(ticket.estimated_completion_date)}</span>
                        </div>
                        {ticket.completion_date && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-medium">Done: {formatDateOnly(ticket.completion_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ETB {ticket.estimated_cost?.toFixed(2) || '0.00'}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => fetchTicketDetails(ticket.ticket_number)}
                    className="mt-2 border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* === MODAL: Ticket Details with Tabs === */}
      {showTicketDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-custom-gradient text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Ticket: {showTicketDetails.ticket_number}</h2>
                    <p className="text-blue-100">{showTicketDetails.customer_name}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowTicketDetails(null)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <Badge className={`${getStatusColor(showTicketDetails.status)} mt-3 text-sm px-4 py-2 inline-block`}>
                {showTicketDetails.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>
            </div>
            
            {/* Tabs Navigation */}
            <div className="bg-gray-50 border-b">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 flex items-center space-x-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer */}
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <User className="w-4 h-4 mr-2 text-blue-600" />
                          Customer Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {showTicketDetails.customer_name}</p>
                        <p><strong>Phone:</strong> {showTicketDetails.phone}</p>
                        <p><strong>Email:</strong> {showTicketDetails.email}</p>
                      </CardContent>
                    </Card>
                    
                    {/* Vehicle */}
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Car className="w-4 h-4 mr-2 text-blue-600" />
                          Vehicle Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><strong>Model:</strong> {showTicketDetails.vehicle_info}</p>
                        <p><strong>Plate:</strong> {showTicketDetails.license_plate}</p>
                        {showTicketDetails.vehicle?.image && (
                          <img 
                            src={`http://localhost:5001/${showTicketDetails.vehicle.image}`} 
                            alt="Vehicle" 
                            className="w-32 h-24 object-cover rounded-lg border mt-2 shadow"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Assigned Mechanic */}
                  <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                        Assigned Mechanic
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {showTicketDetails.mechanic_assign ? (
                        <>
                          <p><strong>Name:</strong> {showTicketDetails.mechanic_assign}</p>
                          <p><strong>Specialty:</strong> General Maintenance</p>
                        </>
                      ) : (
                        <p className="text-gray-500">No mechanic assigned yet</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Inspector */}
                  <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <UserCheck className="w-4 h-4 mr-2 text-blue-600" />
                        Inspector
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {showTicketDetails.inspections && showTicketDetails.inspections.length > 0 ? (
                        <>
                          <p><strong>Name:</strong> Quality Inspector</p>
                          <p><strong>Status:</strong> {showTicketDetails.inspections[0].inspection_status}</p>
                          <p><strong>Inspection Date:</strong> {formatDateTime(showTicketDetails.inspections[0].inspection_date)}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">No inspection performed yet</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Outsourced Mechanics */}
                  {/* Outsourced Mechanics */}
{/* Outsourced Mechanics */}
{showTicketDetails.outsource_mechanics && showTicketDetails.outsource_mechanics.length > 0 && (
  <Card className="shadow-md hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <Users className="w-4 h-4 mr-2 text-blue-600" />
        Outsourced Mechanics
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {showTicketDetails.outsource_mechanics.map((mechanic, index) => {
        // Get payment data for this mechanic
        const mechanicPaymentData = showTicketDetails.paymentHistory?.mechanics?.find(
          m => m.mechanic_name === mechanic.mechanic_name
        );
        
        // Safely convert payment values to numbers
        const agreedPayment = parseFloat(mechanic.payment) || 0;
        const totalPaid = parseFloat(mechanicPaymentData?.total_paid) || 0;
        const remainingBalance = parseFloat(mechanicPaymentData?.remaining_balance) || 0;
        
        return (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">{mechanic.mechanic_name}</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Agreed Payment: <span className="font-medium">ETB {agreedPayment.toFixed(2)}</span></p>
                {mechanicPaymentData && (
                  <>
                    <p className="text-sm text-gray-600">Total Paid: <span className="font-medium">ETB {totalPaid.toFixed(2)}</span></p>
                    <p className={`text-sm font-medium ${remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      Remaining: ETB {remainingBalance.toFixed(2)}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b mb-3">
              <button
                className={`px-4 py-2 text-sm font-medium ${activeMechanicTab !== `payment-${index}` ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveMechanicTab(null)}
              >
                Details
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${activeMechanicTab === `payment-${index}` ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveMechanicTab(`payment-${index}`)}
              >
                Payment History
              </button>
            </div>
            
            {/* Tab Content */}
            {activeMechanicTab !== `payment-${index}` ? (
              // Details Tab
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{mechanic.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{mechanic.payment_method || 'N/A'}</p>
                  </div>
                </div>
                {mechanic.work_done && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Work Done</p>
                    <p className="text-sm">{mechanic.work_done}</p>
                  </div>
                )}
                {mechanic.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm">{mechanic.notes}</p>
                  </div>
                )}
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openPaymentModal(mechanic)}
                    className="border-green-300 hover:bg-green-50 hover:text-green-700"
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Add Payment
                  </Button>
                </div>
              </>
            ) : (
              // Payment History Tab
              <div>
                {mechanicPaymentData ? (
                  <>
                    {/* Payment Summary Card */}
                    <div className="bg-white rounded-lg border p-4 mb-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Agreed Payment</p>
                          <p className="font-bold text-lg">ETB {agreedPayment.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Paid</p>
                          <p className="font-bold text-lg text-green-600">ETB {totalPaid.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Remaining Balance</p>
                          <p className={`font-bold text-lg ${remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            ETB {remainingBalance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>0%</span>
                          <span>Payment Progress</span>
                          <span>{agreedPayment > 0 ? Math.round((totalPaid / agreedPayment) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${remainingBalance > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${agreedPayment > 0 ? Math.min(100, (totalPaid / agreedPayment) * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Payment Details */}
                    {mechanicPaymentData.payments && mechanicPaymentData.payments.length > 0 ? (
                      <div className="space-y-3">
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-bold text-gray-800 text-lg flex items-center">
      <span className="bg-blue-100 p-1.5 rounded-lg mr-2">
        <CreditCard className="w-5 h-5 text-blue-600" />
      </span>
      Payment Details
    </h4>
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      {mechanicPaymentData.payments.length} Payments
    </Badge>
  </div>
  
  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    {/* Table Header */}
    <div className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3 border-b border-gray-200">
      <div className="col-span-3 flex items-center">
        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
        Date
      </div>
      <div className="col-span-3 flex items-center">
        <CreditCard className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
        Method
      </div>
      <div className="col-span-3 text-right flex items-center justify-end">
        <DollarSign className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
        Amount
      </div>
      <div className="col-span-3 flex items-center">
        <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
        Notes
      </div>
    </div>
    
    {/* Payment Rows */}
    <div className="divide-y divide-gray-100">
      {mechanicPaymentData.payments.map((payment, idx) => {
        const paymentAmount = parseFloat(payment.payment_amount) || 0;
        
        // Get payment method icon and color
        const getPaymentMethodInfo = (method) => {
          const methods = {
            'cash': { icon: '💵', color: 'bg-green-100 text-green-800 border-green-200' },
            'bank_transfer': { icon: '🏦', color: 'bg-blue-100 text-blue-800 border-blue-200' },
            'mobile_payment': { icon: '📱', color: 'bg-purple-100 text-purple-800 border-purple-200' },
            'check': { icon: '📝', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            'other': { icon: '💳', color: 'bg-gray-100 text-gray-800 border-gray-200' }
          };
          return methods[method] || methods.other;
        };
        
        const paymentMethodInfo = getPaymentMethodInfo(payment.payment_method);
        
        // Format date with day of week
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
        };
        
        // Add animation delay based on index
        const animationDelay = `${idx * 50}ms`;
        
        return (
          <div 
            key={idx} 
            className="grid grid-cols-12 px-6 py-4 text-sm transition-all duration-300 hover:bg-blue-50/50 group relative overflow-hidden"
            style={{ animationDelay }}
          >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {/* Date Column */}
            <div className="col-span-3 flex items-center">
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 group-hover:border-blue-200 transition-colors duration-300">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">{formatDate(payment.payment_date)}</div>
                    <div className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Method Column */}
            <div className="col-span-3 flex items-center">
              <Badge 
                className={`${paymentMethodInfo.color} px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow duration-300`}
              >
                <span className="text-base">{paymentMethodInfo.icon}</span>
                <span className="font-medium capitalize">
                  {payment.payment_method.replace('_', ' ')}
                </span>
              </Badge>
            </div>
            
            {/* Amount Column */}
            <div className="col-span-3 flex items-center justify-end">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2 border border-green-200 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                <div className="text-xs text-gray-500">Amount</div>
                <div className="font-bold text-lg text-green-700">ETB {paymentAmount.toFixed(2)}</div>
              </div>
            </div>
            
            {/* Notes Column */}
            <div className="col-span-3 flex items-center">
              {payment.notes ? (
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 w-full group-hover:border-blue-200 transition-colors duration-300">
                  <div className="flex items-start">
                    <FileText className="w-4 h-4 mt-0.5 mr-2 text-gray-400" />
                    <div className="text-xs text-gray-600 italic">{payment.notes}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <span className="text-xs text-gray-400 italic">No notes</span>
                </div>
              )}
            </div>
            
            {/* Hover effect indicator */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 w-0 group-hover:w-full transition-all duration-300"></div>
          </div>
        );
      })}
    </div>
  </div>
  
  {/* Summary Footer */}
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mt-4">
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-600">
        Total Payments: <span className="font-bold text-blue-700">{mechanicPaymentData.payments.length}</span>
      </div>
      <div className="text-sm text-gray-600">
        Total Amount: <span className="font-bold text-green-700">ETB {totalPaid.toFixed(2)}</span>
      </div>
      <div className="text-sm text-gray-600">
        Last Payment: <span className="font-bold text-gray-800">
          {mechanicPaymentData.payments.length > 0 
            ? new Date(mechanicPaymentData.payments[mechanicPaymentData.payments.length - 1].payment_date).toLocaleDateString() 
            : 'N/A'}
        </span>
      </div>
    </div>
  </div>
</div>
                    ) : (
                      <div className="text-center py-8 bg-white rounded-lg border">
                        <div className="flex justify-center mb-3">
                          <div className="bg-gray-100 p-3 rounded-full">
                            <CreditCard className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>
                        <p className="text-gray-500">No payments recorded yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add a payment to track the payment history</p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                     
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg border">
                    <div className="flex justify-center mb-3">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-gray-500">No payment history available</p>
                    <p className="text-sm text-gray-400 mt-1">Add a payment to track the payment history</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openPaymentModal(mechanic)}
                      className="mt-4 border-green-300 hover:bg-green-50 hover:text-green-700"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Add Payment
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </CardContent>
  </Card>
)}
                  
                  {/* Service */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <ClipboardList className="w-4 h-4 mr-2 text-blue-600" />
                        Service Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <strong>Issue:</strong>
                        <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-bold text-blue-800">{showTicketDetails.title}</h4>
                        </div>
                      </div>
                      {showTicketDetails.description && (
                        <div>
                          <strong>Description:</strong>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                            {renderDescription(showTicketDetails.description)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Timeline */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        Completion Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong>Estimated:</strong> {formatDateTime(showTicketDetails.estimated_completion_date) || 'N/A'}</p>
                      {showTicketDetails.completion_date ? (
                        <p className="text-green-600"><strong>Actual:</strong> {formatDateTime(showTicketDetails.completion_date)}</p>
                      ) : (
                        <p className="text-gray-500"><em>Not completed yet</em></p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Progress Logs Tab */}
              {activeTab === 'progressLogs' && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <PenTool className="w-4 h-4 mr-2 text-blue-600" />
                      Progress Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[60vh] overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-lg">
                    {showTicketDetails.progress_logs && showTicketDetails.progress_logs.length > 0 ? (
                      showTicketDetails.progress_logs.map(log => (
                        <div key={log.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
                          <p className="font-medium text-gray-800">{log.description}</p>
                          <p className="text-xs text-gray-500">{log.log_date} at {log.log_time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-70" />
                        <p className="text-gray-500">No progress logs recorded yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Disassembled Parts Tab */}
              {activeTab === 'disassembledParts' && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Package className="w-4 h-4 mr-2 text-blue-600" />
                      Disassembled Parts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[60vh] overflow-y-auto space-y-3 p-2 bg-yellow-50 rounded-lg">
                    {showTicketDetails.disassembled_parts && showTicketDetails.disassembled_parts.length > 0 ? (
                      showTicketDetails.disassembled_parts.map(part => (
                        <div key={part.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-800">{part.part_name}</h4>
                              <div className="flex space-x-4 mt-1 text-sm">
                                <span className="text-gray-600">Condition: <span className="font-medium">{part.part_condition}</span></span>
                                <span className="text-gray-600">Status: <span className="font-medium">{part.status}</span></span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {part.status === 'replaced' ? 'Replaced' : part.status === 'repaired' ? 'Repaired' : 'Original'}
                            </Badge>
                          </div>
                          {part.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm italic text-gray-600">
                              "{part.notes}"
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-70" />
                        <p className="text-gray-500">No parts disassembled yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Used Tools Tab */}
              {activeTab === 'usedTools' && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                      Used Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[60vh] overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg">
                    {showTicketDetails.tool_assignments && showTicketDetails.tool_assignments.length > 0 ? (
                      showTicketDetails.tool_assignments.map(tool => (
                        <div key={tool.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-800">{tool.tool_name}</h4>
                              <div className="flex space-x-4 mt-1 text-sm">
                                <span className="text-gray-600">Quantity: <span className="font-medium">{tool.assigned_quantity}</span></span>
                                <span className="text-gray-600">Status: <span className="font-medium">{tool.status}</span></span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {tool.status}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Assigned by: {tool.assigned_by} on {formatDateTime(tool.assigned_at)}
                            {tool.returned_at && (
                              <span> | Returned: {formatDateTime(tool.returned_at)}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-70" />
                        <p className="text-gray-500">No tools recorded yet.</p>
                        <p className="text-sm text-gray-400 mt-2">Tools used during service will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Ordered Parts Tab */}
           
{activeTab === 'orderedParts' && (
  <Card className="shadow-md">
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <PackagePlus className="w-4 h-4 mr-2 text-blue-600" />
        Parts Management
      </CardTitle>
      
      {/* Sub-tab navigation */}
      <div className="flex border-b mt-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            orderedPartsActiveTab === 'ordered'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setOrderedPartsActiveTab('ordered')}
        >
          Ordered Parts
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            orderedPartsActiveTab === 'outsource'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setOrderedPartsActiveTab('outsource')}
        >
          Outsource Stock
        </button>
      </div>
    </CardHeader>
    
    <CardContent className="max-h-[60vh] overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg">
      {/* Ordered Parts Sub-tab */}
      {orderedPartsActiveTab === 'ordered' && (
        <>
          {showTicketDetails.ordered_parts && showTicketDetails.ordered_parts.length > 0 ? (
            showTicketDetails.ordered_parts.map(part => (
              <div key={part.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{part.name}</h4>
                    <div className="flex space-x-4 mt-1 text-sm">
                      <span className="text-gray-600">Category: <span className="font-medium">{part.category}</span></span>
                      <span className="text-gray-600">SKU: <span className="font-medium">{part.sku}</span></span>
                      <span className="text-gray-600">Quantity: <span className="font-medium">{part.quantity}</span></span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {part.status}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Ordered on: {formatDateTime(part.ordered_at)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <PackagePlus className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-70" />
              <p className="text-gray-500">No parts ordered yet.</p>
              <p className="text-sm text-gray-400 mt-2">Parts ordered for this service will appear here</p>
            </div>
          )}
        </>
      )}
      
      {/* Outsource Stock Sub-tab */}
      {orderedPartsActiveTab === 'outsource' && (
        <>
          {showTicketDetails.outsource_stock && showTicketDetails.outsource_stock.length > 0 ? (
            showTicketDetails.outsource_stock.map(stock => (
              <div key={stock.auto_id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{stock.name}</h4>
                    <div className="flex space-x-4 mt-1 text-sm">
                      <span className="text-gray-600">Category: <span className="font-medium">{stock.category}</span></span>
                      <span className="text-gray-600">SKU: <span className="font-medium">{stock.sku}</span></span>
                      <span className="text-gray-600">Quantity: <span className="font-medium">{stock.quantity}</span></span>
                      <span className="text-gray-600">Source: <span className="font-medium">{stock.source_shop}</span></span>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      stock.status === 'received' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : stock.status === 'requested'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {stock.status}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Requested: {formatDateTime(stock.requested_at)}
                  {stock.received_at && (
                    <span className="ml-3">Received: {formatDateTime(stock.received_at)}</span>
                  )}
                </div>
                {stock.notes && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-gray-700"><strong>Notes:</strong> {stock.notes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-70" />
              <p className="text-gray-500">No outsource stock items yet.</p>
              <p className="text-sm text-gray-400 mt-2">Outsourced parts for this service will appear here</p>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
)}
              
              {/* Inspection Tab */}
              {activeTab === 'inspection' && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <FileCheck className="w-4 h-4 mr-2 text-blue-600" />
                      Inspection Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[60vh] overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg">
                    {showTicketDetails.inspections && showTicketDetails.inspections.length > 0 ? (
                      showTicketDetails.inspections.map((insp) => (
                        <div key={insp.id} className="p-4 bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-800">Inspection #{insp.id}</h4>
                            <Badge 
                              className={
                                insp.inspection_status === 'successful' 
                                  ? 'bg-green-100 text-green-800' 
                                  : insp.inspection_status === 'failed' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {insp.inspection_status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Date</p>
                              <p className="font-medium">{formatDateTime(insp.inspection_date)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Main Issue Resolved</p>
                              <p className={`font-medium ${insp.main_issue_resolved ? 'text-green-600' : 'text-red-600'}`}>
                                {insp.main_issue_resolved ? '✅ Yes' : '❌ No'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Reassembly Verified</p>
                              <p className={`font-medium ${insp.reassembly_verified ? 'text-green-600' : 'text-red-600'}`}>
                                {insp.reassembly_verified ? '✅ Yes' : '❌ No'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">General Condition</p>
                              <p className="font-medium">{insp.general_condition}</p>
                            </div>
                          </div>
                          {insp.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-sm text-gray-700"><strong>Notes:</strong> {insp.notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-70" />
                        <p className="text-gray-500">No inspection reports recorded yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <Button variant="outline" className="mr-2">Print</Button>
              <Button onClick={() => setShowTicketDetails(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* === MODAL: New Ticket === */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
      />
      {/* === MODAL: Payment Modal === */}
{/* === MODAL: Payment Modal === */}
{/* === MODAL: Payment Modal === */}
<PaymentFormModal
  isOpen={isPaymentModalOpen}
  onClose={() => setIsPaymentModalOpen(false)}
  ticketNumber={showTicketDetails?.ticket_number}
  mechanicName={selectedMechanic?.mechanic_name}
  onPaymentAdded={handlePaymentAdded}
/>
    </div>
  );
}