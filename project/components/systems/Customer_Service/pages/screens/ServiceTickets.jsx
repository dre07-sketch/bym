'use client';
import { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Filter, Eye, Edit, Trash2, Clock, 
  AlertTriangle, CheckCircle, User, Car, Phone, Mail, Calendar,
  MapPin, Wrench, DollarSign, FileText, Star, X, Package, PenTool, 
  ChevronDown, ChevronUp, ClipboardList, CheckSquare, ListChecks
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/components/ui/NotificationSystem';
import NewTicketModal from '../pop up/NewTicketModal'; // Import your NewTicketModal component

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
  const { addNotification } = useNotifications();
  

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
      setShowTicketDetails(normalizedTicket);
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

      {/* === MODAL: Ticket Details (Enhanced Design) === */}
      {/* === MODAL: Ticket Details (Enhanced with Inspections & Bill) === */}
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

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
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

        {/* Progress Logs */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <PenTool className="w-4 h-4 mr-2 text-blue-600" />
              Progress Logs
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleLogs(showTicketDetails.ticket_number)}
              className="text-gray-600 hover:text-gray-800"
            >
              {expandedLogs[showTicketDetails.ticket_number] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardHeader>
          {expandedLogs[showTicketDetails.ticket_number] && (
            <CardContent className="max-h-40 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-lg">
              {showTicketDetails.progress_logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs recorded.</p>
              ) : (
                showTicketDetails.progress_logs.map(log => (
                  <div key={log.id} className="p-2 bg-white rounded border hover:shadow-sm">
                    <p className="font-medium text-gray-800">{log.description}</p>
                    <p className="text-xs text-gray-500">{log.date} at {log.time}</p>
                  </div>
                ))
              )}
            </CardContent>
          )}
        </Card>

        {/* Disassembled Parts */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              Disassembled Parts
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-40 overflow-y-auto space-y-2 p-2 bg-yellow-50 rounded-lg">
            {showTicketDetails.disassembled_parts.length === 0 ? (
              <p className="text-gray-500 text-sm">No parts disassembled yet.</p>
            ) : (
              showTicketDetails.disassembled_parts.map(part => (
                <div key={part.id} className="p-2 bg-white rounded border">
                  <p className="font-medium">{part.part_name}</p>
                  <p className="text-xs text-gray-600">Condition: {part.condition} | Status: {part.status}</p>
                  {part.notes && <p className="text-xs italic mt-1">"{part.notes}"</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* === Inspections === */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ListChecks className="w-4 h-4 mr-2 text-blue-600" />
              Inspection Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg">
            {showTicketDetails.inspections && showTicketDetails.inspections.length > 0 ? (
              showTicketDetails.inspections.map((insp) => (
                <div key={insp.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
                  <div className="flex justify-between items-start mb-2">
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
                  <div className="text-sm space-y-1">
                    <p><strong>Date:</strong> {formatDateTime(insp.inspection_date)}</p>
                    <p><strong>Main Issue Resolved:</strong> 
                      <span className={`ml-1 ${insp.main_issue_resolved ? 'text-green-600' : 'text-red-600'}`}>
                        {insp.main_issue_resolved ? '✅ Yes' : '❌ No'}
                      </span>
                    </p>
                    <p><strong>Reassembly Verified:</strong> 
                      <span className={`ml-1 ${insp.reassembly_verified ? 'text-green-600' : 'text-red-600'}`}>
                        {insp.reassembly_verified ? '✅ Yes' : '❌ No'}
                      </span>
                    </p>
                    <p><strong>General Condition:</strong> {insp.general_condition}</p>
                    {insp.notes && (
                      <p><strong>Notes:</strong> <em className="text-gray-600">{insp.notes}</em></p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-70" />
                <p className="text-gray-500 text-sm">No inspection reports recorded for this ticket.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* === Bill & Payment Section === */}
        <Card className="shadow-md border-l-4 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              Bill & Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showTicketDetails.bill ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Subtotal</p>
                      <p className="font-semibold">ETB {parseFloat(showTicketDetails.bill.subtotal || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Labor Cost</p>
                      <p className="font-semibold">ETB {parseFloat(showTicketDetails.bill.labor_cost || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Parts Cost</p>
                      <p className="font-semibold">ETB {parseFloat(showTicketDetails.bill.parts_cost || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tax ({showTicketDetails.bill.tax_rate}%)</p>
                      <p className="font-semibold">ETB {parseFloat(showTicketDetails.bill.tax_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="border-t mt-3 pt-2 flex justify-between items-center font-bold text-lg text-green-700">
                    <span>Total:</span>
                    <span>ETB {parseFloat(showTicketDetails.bill.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-600">Status</p>
                    <Badge 
                      className={
                        showTicketDetails.bill.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : showTicketDetails.bill.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {showTicketDetails.bill.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">Issued On</p>
                    <p>{formatDateOnly(showTicketDetails.bill.issued_date)}</p>
                  </div>
                </div>

                {showTicketDetails.bill.payment_status !== 'paid' && (
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white mt-3">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-gradient-to-b from-blue-50 to-white rounded-xl border-2 border-dashed border-blue-200">
                <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-70" />
                <h3 className="font-bold text-gray-700 text-lg mb-1">No Bill Generated Yet</h3>
                <p className="text-gray-500 text-sm mb-4">This service is still in progress or awaiting finalization.</p>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-1">
                  Awaiting Completion
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
        <Button variant="outline" className="mr-2">Print</Button>
        <Button onClick={() => setShowTicketDetails(null)}>Close</Button>
      </div>
    </div>
  </div>
)}

      {/* === MODAL: New Ticket (Cool Design) === */}
      <NewTicketModal
                isOpen={isNewTicketOpen}
                onClose={() => setIsNewTicketOpen(false)}
              />
    </div>
  );
}