'use client';

import { useState } from 'react';
import { 
  Ticket, Plus, Search, Filter, Eye, Edit, Trash2, Clock, 
  AlertTriangle, CheckCircle, User, Car, Phone, Mail, Calendar,
  MapPin, Wrench, DollarSign, FileText, Star, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/components/ui/NotificationSystem';

const mockTickets = [
  {
    id: 'TKT-001',
    customer: 'John Smith',
    phone: '+1-555-0123',
    email: 'john@email.com',
    vehicle: 'Toyota Camry 2020',
    plateNumber: 'ABC-123',
    vin: '1HGBH41JXMN109186',
    issue: 'Engine overheating and strange noises',
    description: 'Customer reports engine overheating after 20 minutes of driving. Also hearing grinding noise from engine bay.',
    status: 'new',
    priority: 'high',
    createdAt: '2024-01-15 09:00',
    updatedAt: '2024-01-15 09:00',
    assignedMechanic: null,
    estimatedCost: 450,
    actualCost: null,
    estimatedTime: '4 hours',
    category: 'Engine',
    location: 'Bay 1',
    images: [],
    notes: []
  },
  {
    id: 'TKT-002',
    customer: 'ABC Corp',
    phone: '+1-555-0456',
    email: 'fleet@abccorp.com',
    vehicle: 'Ford F-150 2019',
    plateNumber: 'XYZ-789',
    vin: '1FTFW1ET5KFA10312',
    issue: 'Brake system repair',
    description: 'Fleet vehicle needs complete brake system overhaul. Brake pads worn, rotors need resurfacing.',
    status: 'assigned',
    priority: 'medium',
    createdAt: '2024-01-14 14:30',
    updatedAt: '2024-01-15 08:00',
    assignedMechanic: 'Mike Johnson',
    estimatedCost: 320,
    actualCost: null,
    estimatedTime: '3 hours',
    category: 'Brakes',
    location: 'Bay 3',
    images: [],
    notes: ['Customer approved estimate', 'Parts ordered']
  },
  {
    id: 'TKT-003',
    customer: 'Jane Doe',
    phone: '+1-555-0789',
    email: 'jane@email.com',
    vehicle: 'Honda Civic 2021',
    plateNumber: 'DEF-456',
    vin: '19XFC2F59ME000001',
    issue: 'Oil change and inspection',
    description: 'Regular maintenance service - oil change, filter replacement, and 30-point inspection.',
    status: 'completed',
    priority: 'low',
    createdAt: '2024-01-13 10:15',
    updatedAt: '2024-01-14 16:30',
    assignedMechanic: 'Sarah Wilson',
    estimatedCost: 85,
    actualCost: 85,
    estimatedTime: '1 hour',
    category: 'Maintenance',
    location: 'Bay 2',
    images: [],
    notes: ['Service completed successfully', 'Next service due in 6 months']
  }
];

const mechanics = [
  { id: 1, name: 'Mike Johnson', specialty: 'Engine & Transmission' },
  { id: 2, name: 'Sarah Wilson', specialty: 'General Maintenance' },
  { id: 3, name: 'Tom Brown', specialty: 'Electrical & Diagnostics' },
  { id: 4, name: 'Lisa Davis', specialty: 'Brakes & Suspension' }
];

export default function ServiceTickets() {
  const [tickets, setTickets] = useState(mockTickets);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(null);
  const [newTicket, setNewTicket] = useState({
    customer: '',
    phone: '',
    email: '',
    vehicle: '',
    plateNumber: '',
    vin: '',
    issue: '',
    description: '',
    priority: 'medium',
    category: 'General'
  });

  const { addNotification } = useNotifications();

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCreateTicket = () => {
    const ticket = {
      ...newTicket,
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      status: 'new',
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      assignedMechanic: null,
      estimatedCost: 0,
      actualCost: null,
      estimatedTime: 'TBD',
      location: 'Unassigned',
      images: [],
      notes: []
    };

    setTickets([ticket, ...tickets]);
    setNewTicket({
      customer: '', phone: '', email: '', vehicle: '', plateNumber: '',
      vin: '', issue: '', description: '', priority: 'medium', category: 'General'
    });
    setShowNewTicketModal(false);
    
    addNotification({
      type: 'success',
      title: 'Ticket Created',
      message: `Service ticket ${ticket.id} has been created successfully`
    });
  };

  const handleAssignMechanic = (ticketId, mechanicName) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, assignedMechanic: mechanicName, status: 'assigned', updatedAt: new Date().toLocaleString() }
        : ticket
    ));
    
    addNotification({
      type: 'success',
      title: 'Mechanic Assigned',
      message: `${mechanicName} has been assigned to ticket ${ticketId}`
    });
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus, updatedAt: new Date().toLocaleString() }
        : ticket
    ));
    
    addNotification({
      type: 'info',
      title: 'Status Updated',
      message: `Ticket ${ticketId} status changed to ${newStatus}`
    });
  };

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
          onClick={() => setShowNewTicketModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-hover bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Tickets</p>
                <p className="text-3xl font-bold">{tickets.length}</p>
              </div>
              <Ticket className="w-8 h-8 text-blue-200 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Pending</p>
                <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'new').length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200 animate-spin-slow" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">In Progress</p>
                <p className="text-3xl font-bold">{tickets.filter(t => ['assigned', 'in-progress'].includes(t.status)).length}</p>
              </div>
              <Wrench className="w-8 h-8 text-purple-200 animate-bounce-slow" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Completed</p>
                <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'completed').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets by ID, customer, plate number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket, index) => (
          <Card key={ticket.id} className="card-hover glass-card animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${getPriorityColor(ticket.priority)} animate-pulse`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{ticket.id}</h3>
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        {ticket.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ticket.priority} priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{ticket.customer}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <Car className="w-4 h-4" />
                          <span>{ticket.vehicle} ({ticket.plateNumber})</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{ticket.phone}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-800 mb-1">{ticket.issue}</p>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Created: {ticket.createdAt}</span>
                          {ticket.assignedMechanic && (
                            <span className="text-blue-600">Mechanic: {ticket.assignedMechanic}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-3">
                  <div className="text-2xl font-bold text-green-600">
                    ${ticket.estimatedCost}
                  </div>
                  <div className="text-sm text-gray-500">
                    Est. {ticket.estimatedTime}
                  </div>
                  
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowTicketDetails(ticket)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>

                  {!ticket.assignedMechanic && ticket.status === 'new' && (
                    <div className="mt-2">
                      <Select onValueChange={(value) => handleAssignMechanic(ticket.id, value)}>
                        <SelectTrigger className="w-40 text-xs">
                          <SelectValue placeholder="Assign Mechanic" />
                        </SelectTrigger>
                        <SelectContent>
                          {mechanics.map(mechanic => (
                            <SelectItem key={mechanic.id} value={mechanic.name}>
                              {mechanic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <span>Create New Service Ticket</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewTicketModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Name</label>
                  <Input
                    value={newTicket.customer}
                    onChange={(e) => setNewTicket({...newTicket, customer: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <Input
                    value={newTicket.phone}
                    onChange={(e) => setNewTicket({...newTicket, phone: e.target.value})}
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
                  type="email"
                  value={newTicket.email}
                  onChange={(e) => setNewTicket({...newTicket, email: e.target.value})}
                  placeholder="customer@email.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle</label>
                  <Input
                    value={newTicket.vehicle}
                    onChange={(e) => setNewTicket({...newTicket, vehicle: e.target.value})}
                    placeholder="Make Model Year"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">License Plate</label>
                  <Input
                    value={newTicket.plateNumber}
                    onChange={(e) => setNewTicket({...newTicket, plateNumber: e.target.value})}
                    placeholder="ABC-123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">VIN Number</label>
                <Input
                  value={newTicket.vin}
                  onChange={(e) => setNewTicket({...newTicket, vin: e.target.value})}
                  placeholder="17-character VIN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Issue Summary</label>
                <Input
                  value={newTicket.issue}
                  onChange={(e) => setNewTicket({...newTicket, issue: e.target.value})}
                  placeholder="Brief description of the problem"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detailed Description</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({...newTicket, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={newTicket.category} onValueChange={(value) => setNewTicket({...newTicket, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Engine">Engine</SelectItem>
                      <SelectItem value="Brakes">Brakes</SelectItem>
                      <SelectItem value="Transmission">Transmission</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button onClick={handleCreateTicket} className="btn-primary flex-1">
                  Create Ticket
                </Button>
                <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <span>Ticket Details - {showTicketDetails.id}</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowTicketDetails(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{showTicketDetails.customer}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{showTicketDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{showTicketDetails.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Vehicle Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{showTicketDetails.vehicle}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Plate: </span>
                      <span className="font-medium">{showTicketDetails.plateNumber}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">VIN: </span>
                      <span className="font-mono text-sm">{showTicketDetails.vin}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Issue</label>
                    <p className="font-medium">{showTicketDetails.issue}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Category</label>
                    <p className="font-medium">{showTicketDetails.category}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Priority</label>
                    <Badge className={`${getPriorityColor(showTicketDetails.priority)} text-white`}>
                      {showTicketDetails.priority}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <Badge className={`${getStatusColor(showTicketDetails.status)} border`}>
                      {showTicketDetails.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{showTicketDetails.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Assignment & Timing</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Assigned Mechanic: </span>
                      <span className="font-medium">{showTicketDetails.assignedMechanic || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Estimated Time: </span>
                      <span className="font-medium">{showTicketDetails.estimatedTime}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Location: </span>
                      <span className="font-medium">{showTicketDetails.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Cost Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Estimated Cost: </span>
                      <span className="font-bold text-green-600">${showTicketDetails.estimatedCost}</span>
                    </div>
                    {showTicketDetails.actualCost && (
                      <div>
                        <span className="text-sm text-gray-500">Actual Cost: </span>
                        <span className="font-bold text-blue-600">${showTicketDetails.actualCost}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Created: </span>
                    <span>{showTicketDetails.createdAt}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Last Updated: </span>
                    <span>{showTicketDetails.updatedAt}</span>
                  </div>
                </div>
              </div>

              {showTicketDetails.notes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Notes</h3>
                  <div className="space-y-2">
                    {showTicketDetails.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4 border-t">
                <Button className="btn-primary">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Ticket
                </Button>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => setShowTicketDetails(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}