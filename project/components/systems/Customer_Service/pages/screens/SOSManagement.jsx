'use client';
import { useState, useEffect } from 'react';
import {
  AlertTriangle, Phone, MapPin, Clock, Truck, Navigation,
  Plus, Search, Filter, Eye, Edit, CheckCircle, X, Star,
  User, Car, Calendar, MessageSquare, Zap, Target, Send,
  FileText, Tabs, Tab
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/components/ui/NotificationSystem';

// --- Import Dialog components ---
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Import the SOSPopup component ---
import SOSPopup from '../pop up/SOSPopup';

export default function SOSManagement() {
  const [sosRequests, setSOSRequests] = useState([]);
  const [convertedRequests, setConvertedRequests] = useState([]);
  const [convertedCount, setConvertedCount] = useState(0);
  const [convertedLoading, setConvertedLoading] = useState(true);
  const [convertedError, setConvertedError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [showNewSOSModal, setShowNewSOSModal] = useState(false);
  const [showSOSDetails, setShowSOSDetails] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'converted'

  // --- New State for Ticket Generation ---
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [ticketGenerationError, setTicketGenerationError] = useState(null);
  const [showGenerateTicketModal, setShowGenerateTicketModal] = useState(false);
  const [ticketFormData, setTicketFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    urgencyLevel: 'moderate',
    customer_type: 'individual',
    customer_id: '',
    individual_name: '',
    individual_phone: '',
    company_name: '',
    company_phone: '',
    vehicle_info: {
      make: '',
      model: '',
      year: null
    },
    license_plate: ''
  });
  // --- End New State ---

  const { addNotification } = useNotifications();

  // Parse vehicle information from string
  const parseVehicleInfo = (vehicleString) => {
    if (!vehicleString) return { make: '', model: '', year: null };
    
    const vehicleParts = vehicleString.split(' ');
    let year = null;
    let make = '';
    let model = '';
    
    // Check if first part is a year (4 digits)
    if (vehicleParts.length >= 3 && /^\d{4}$/.test(vehicleParts[0])) {
      year = vehicleParts[0];
      make = vehicleParts[1];
      model = vehicleParts.slice(2).join(' ');
    } else if (vehicleParts.length >= 2) {
      make = vehicleParts[0];
      model = vehicleParts.slice(1).join(' ');
    } else {
      model = vehicleString;
    }
    
    return { make, model, year };
  };

  const handleOpenGenerateTicket = (sosRequest) => {
    // Parse vehicle information
    const vehicleInfo = parseVehicleInfo(sosRequest.vehicle);
    
    // Prepare customer fields based on customer type
    const customerFields = sosRequest.customerType === 'individual' 
      ? {
          individual_name: sosRequest.customer || '',
          individual_phone: sosRequest.phone || ''
        }
      : {
          company_name: sosRequest.customer || '',
          company_phone: sosRequest.phone || ''
        };

    setTicketFormData({
      title: `SOS Converted: ${sosRequest.title || 'Emergency Request'}`,
      description: `Converted from SOS Request ID: ${sosRequest.id}
Customer: ${sosRequest.customer}
Vehicle: ${sosRequest.vehicle} (${sosRequest.plateNumber || 'No Plate'})
Location: ${sosRequest.location}
Contact: ${sosRequest.phone}
Original SOS Description:
 ${sosRequest.description || 'No description provided in SOS.'}`,
      priority: sosRequest.urgency === 'critical' ? 'urgent' : sosRequest.urgency === 'high' ? 'high' : 'medium',
      urgencyLevel: sosRequest.urgency || 'moderate',
      customer_type: sosRequest.customerType || 'individual',
      customer_id: sosRequest.customerId || '',
      vehicle_info: vehicleInfo,
      license_plate: sosRequest.plateNumber || '',
      ...customerFields
    });
    setShowGenerateTicketModal(true);
    setTicketGenerationError(null);
  };

  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested vehicle_info object
    if (name.startsWith('vehicle_info.')) {
      const field = name.split('.')[1];
      setTicketFormData(prev => ({
        ...prev,
        vehicle_info: {
          ...prev.vehicle_info,
          [field]: field === 'year' ? (value ? parseInt(value) : null) : value
        }
      }));
    } else {
      setTicketFormData(prev => ({ 
        ...prev, 
        [name]: value 
      }));
    }
  };

  const handleGenerateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!showSOSDetails) return;

    setIsGeneratingTicket(true);
    setTicketGenerationError(null);

    try {
      // Prepare the data to match backend expectations
      const ticketData = {
        customer_type: ticketFormData.customer_type,
        customer_id: ticketFormData.customer_id,
        // Customer fields based on type
        ...(ticketFormData.customer_type === 'individual' ? {
          individual_name: ticketFormData.individual_name,
          individual_phone: ticketFormData.individual_phone
        } : {
          company_name: ticketFormData.company_name,
          company_phone: ticketFormData.company_phone
        }),
        // Vehicle info
        vehicle_info: ticketFormData.vehicle_info,
        license_plate: ticketFormData.license_plate,
        // Ticket fields
        title: ticketFormData.title,
        description: ticketFormData.description,
        priority: ticketFormData.priority,
        type: 'sos',
        urgency_level: ticketFormData.urgencyLevel,
      };

      console.log("Sending Ticket Data:", ticketData);

      const response = await fetch('https://ipasystem.bymsystem.com/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Ticket API Error Response:", errorData);
        throw new Error(`Failed to create ticket: ${response.status} ${response.statusText}`);
      }

      const createdTicket = await response.json();
      console.log("Ticket created successfully:", createdTicket);

      // Mark SOS as converted in local state
      setSOSRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === showSOSDetails.id ? { ...req, status: 'converted' } : req
        )
      );

      // Optional: Update backend status
      try {
        await fetch(`https://ipasystem.bymsystem.com/api/sos-request/update/${showSOSDetails.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'converted' }),
        });
      } catch (updateErr) {
        console.error("Error updating SOS status in backend:", updateErr);
      }

      setShowGenerateTicketModal(false);
      addNotification({
        type: 'success',
        title: 'Ticket Generated',
        message: `Successfully created ticket ${createdTicket.ticket_number || 'ID-NOT-RETURNED'} from SOS request.`
      });
    } catch (err) {
      console.error('Error generating ticket:', err);
      setTicketGenerationError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  // Fetch SOS requests
  useEffect(() => {
    const fetchSOSRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ipasystem.bymsystem.com/api/sos-request/all-sos-request');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const transformedData = data.map(item => ({
          id: item.sos_ticket_number,
          customer: item.customer_name,
          phone: item.contact_phone,
          location: item.location,
          description: item.description,
          vehicle: item.vehicle_model,
          plateNumber: item.license_plate,
          urgency: item.priority_level?.toLowerCase() || 'medium',
          status: item.status?.toLowerCase().replace(' ', '-') || 'pending',
          createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
          dispatchedAt: item.dispatched_at ? new Date(item.dispatched_at).toLocaleString() : null,
          estimatedArrival: item.estimated_arrival ? new Date(item.estimated_arrival).toLocaleString() : null,
          completedAt: item.completed_at ? new Date(item.completed_at).toLocaleString() : null,
          towTruck: item.tow_truck_id || null,
          customerId: item.customer_id,
          customerType: item.customer_type || 'individual'
        }));

        // Filter out 'converted' requests **before setting state**
        const filteredData = transformedData.filter(req => req.status !== 'converted');
        setSOSRequests(filteredData);

        setError(null);
      } catch (err) {
        console.error('Error fetching SOS requests:', err);
        setError('Failed to fetch SOS requests');
        addNotification({
          type: 'error',
          title: 'Fetch Error',
          message: 'Could not load SOS requests'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSOSRequests();
    const interval = setInterval(fetchSOSRequests, 30000);
    return () => clearInterval(interval);
  }, [addNotification]);

  // Fetch converted SOS requests
  useEffect(() => {
    const fetchConvertedRequests = async () => {
      try {
        setConvertedLoading(true);
        const response = await fetch('https://ipasystem.bymsystem.com/api/sos-request/converted');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setConvertedRequests(data);
        setConvertedError(null);
      } catch (err) {
        console.error('Error fetching converted SOS requests:', err);
        setConvertedError('Failed to fetch converted SOS requests');
        addNotification({
          type: 'error',
          title: 'Fetch Error',
          message: 'Could not load converted SOS requests'
        });
      } finally {
        setConvertedLoading(false);
      }
    };

    if (activeTab === 'converted') {
      fetchConvertedRequests();
    }
  }, [activeTab, addNotification]);

  // Fetch converted SOS count
  useEffect(() => {
    const fetchConvertedCount = async () => {
      try {
        setConvertedLoading(true);
        const response = await fetch('https://ipasystem.bymsystem.com/api/sos-request/count-converted');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setConvertedCount(data.convertedCount);
        setConvertedError(null);
      } catch (err) {
        console.error('Error fetching converted count:', err);
        setConvertedError('Failed to fetch converted count');
      } finally {
        setConvertedLoading(false);
      }
    };

    fetchConvertedCount();
    const interval = setInterval(fetchConvertedCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter requests (excluding 'converted' from UI entirely)
  const filteredRequests = sosRequests.filter(request => {
    const matchesSearch =
      request.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || request.urgency === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Filter converted requests
  const filteredConvertedRequests = convertedRequests.filter(request => {
    return (
      request.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.sos_ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 animate-pulse';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dispatched': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en-route': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'on-scene': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'converted': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDispatch = (sosId, truckId) => {
    const truck = towTrucks.find(t => t.id === truckId);
    setSOSRequests(sosRequests.map(request =>
      request.id === sosId
        ? {
            ...request,
            status: 'dispatched',
            towTruck: truckId,
            dispatchedAt: new Date().toLocaleString(),
            estimatedArrival: new Date(Date.now() + 15 * 60000).toLocaleString()
          }
        : request
    ));
    setTowTrucks(towTrucks.map(truck =>
      truck.id === truckId
        ? { ...truck, available: false, currentLocation: `En route to ${sosId}` }
        : truck
    ));
    setShowDispatchModal(null);
    addNotification({
      type: 'success',
      title: 'SOS Dispatched',
      message: `${truck?.name || 'Truck'} has been dispatched to ${sosId}`
    });
  };

  const handleStatusUpdate = (sosId, newStatus) => {
    setSOSRequests(sosRequests.map(request =>
      request.id === sosId
        ? { ...request, status: newStatus }
        : request
    ));
    addNotification({
      type: 'info',
      title: 'Status Updated',
      message: `SOS ${sosId} status changed to ${newStatus}`
    });
  };

  const handleEmergencyCall = (phone) => {
    addNotification({
      type: 'info',
      title: 'Calling',
      message: `Initiating call to ${phone}`
    });
  };

  // Mock data for tow trucks (replace with actual data)
  const towTrucks = [
    { id: 1, name: 'Truck 1', driver: 'John Doe', coverage: 'Downtown', rating: 4.8, eta: '10 min', capacity: 'Heavy Duty', available: true },
    { id: 2, name: 'Truck 2', driver: 'Jane Smith', coverage: 'Suburbs', rating: 4.5, eta: '15 min', capacity: 'Medium', available: true },
    { id: 3, name: 'Truck 3', driver: 'Bob Johnson', coverage: 'Highway', rating: 4.9, eta: '8 min', capacity: 'Light', available: true },
  ];

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SOS requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto mt-10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            SOS Emergency Management
          </h1>
          <p className="text-gray-600 mt-1">Emergency response and dispatch system</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{currentTime.toLocaleTimeString()}</p>
            <p className="text-xs text-gray-500">Emergency Hotline: 911</p>
          </div>
          <Button
            onClick={() => setShowNewSOSModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            New SOS Request
          </Button>
        </div>
      </div>

      {/* Emergency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="card-hover bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Active SOS</p>
                <p className="text-3xl font-bold">
                  {sosRequests.filter(r => ['pending', 'dispatched', 'en-route', 'on-scene'].includes(r.status)).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200 animate-bounce" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Dispatched</p>
                <p className="text-3xl font-bold">{sosRequests.filter(r => r.status === 'dispatched').length}</p>
              </div>
              <Truck className="w-8 h-8 text-orange-200 animate-pulse" />
            </div>
          </CardContent>
        </Card>
       
        <Card className="card-hover bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Completed Today</p>
                <p className="text-3xl font-bold">{sosRequests.filter(r => r.status === 'completed').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Converted</p>
                <p className="text-3xl font-bold">
                  {convertedLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block"></div>
                  ) : convertedError ? (
                    <span className="text-yellow-300">!</span>
                  ) : (
                    convertedCount
                  )}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-200" />
            </div>
            {convertedError && (
              <p className="text-xs text-purple-200 mt-1">Error loading count</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('active')}
        >
          Active SOS
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'converted' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('converted')}
        >
          Converted SOS
        </button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={activeTab === 'active' ? "Search SOS requests..." : "Search converted SOS requests..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            {activeTab === 'active' && (
              <>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="en-route">En Route</SelectItem>
                    <SelectItem value="on-scene">On Scene</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SOS Requests - Active Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Active SOS Requests</h2>
            {convertedCount > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{convertedCount}</span> converted requests not shown
              </div>
            )}
          </div>
          
          {filteredRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No active SOS requests found.</p>
          ) : (
            filteredRequests.map((request, index) => (
              <Card key={request.id} className="card-hover glass-card animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full ${getUrgencyColor(request.urgency)}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{request.id}</h3>
                          <Badge className={`${getStatusColor(request.status)} border`}>
                            {request.status?.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${
                            request.urgency === 'critical' ? 'border-red-500 text-red-700' :
                            request.urgency === 'high' ? 'border-orange-500 text-orange-700' :
                            request.urgency === 'medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-green-500 text-green-700'
                          }`}>
                            {request.urgency} urgency
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{request.customer}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <Phone className="w-4 h-4" />
                              <span>{request.phone}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEmergencyCall(request.phone)}
                                className="p-1 h-6 w-6 text-green-600 hover:bg-green-100"
                              >
                                <Phone className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{request.location}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 mb-1">{request.description}</p>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <Car className="w-4 h-4" />
                              <span>{request.vehicle} ({request.plateNumber})</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Created: {request.createdAt}</span>
                              {request.towTruck && (
                                <span className="text-blue-600">Truck: {request.towTruck}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      {request.estimatedArrival && (
                        <div className="text-lg font-bold text-green-600">
                          ETA: {request.estimatedArrival}
                        </div>
                      )}
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowSOSDetails(request)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => setShowDispatchModal(request)}
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Dispatch
                          </Button>
                        )}
                        {request.status === 'dispatched' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleStatusUpdate(request.id, 'en-route')}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            En Route
                          </Button>
                        )}
                        {request.status === 'en-route' && (
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => handleStatusUpdate(request.id, 'on-scene')}
                          >
                            <Target className="w-3 h-3 mr-1" />
                            On Scene
                          </Button>
                        )}
                        {request.status === 'on-scene' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusUpdate(request.id, 'completed')}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Converted SOS Requests - Converted Tab */}
      {activeTab === 'converted' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Converted SOS Requests</h2>
          </div>
          
          {convertedLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading converted SOS requests...</p>
            </div>
          ) : convertedError ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">{convertedError}</p>
            </div>
          ) : filteredConvertedRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No converted SOS requests found.</p>
          ) : (
            filteredConvertedRequests.map((request, index) => (
              <Card key={request.id} className="card-hover glass-card animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full ${getUrgencyColor(request.priority_level?.toLowerCase())}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{request.sos_ticket_number}</h3>
                          <Badge className={`${getStatusColor(request.status)} border`}>
                            {request.status?.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${
                            request.priority_level === 'Critical' ? 'border-red-500 text-red-700' :
                            request.priority_level === 'High' ? 'border-orange-500 text-orange-700' :
                            request.priority_level === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-green-500 text-green-700'
                          }`}>
                            {request.priority_level} urgency
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{request.customer_name}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <Phone className="w-4 h-4" />
                              <span>{request.contact_phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{request.location}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 mb-1">{request.description}</p>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <Car className="w-4 h-4" />
                              <span>{request.vehicle_model} ({request.license_plate})</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                              <span>Converted: {new Date(request.updated_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowSOSDetails(request)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl animate-scale-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-red-600" />
                  <span>Dispatch Tow Truck - {showDispatchModal.id}</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDispatchModal(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <h3 className="font-semibold text-red-800 mb-2">Emergency Details</h3>
                <p className="text-red-700">{showDispatchModal.description}</p>
                <p className="text-sm text-red-600 mt-1">Location: {showDispatchModal.location}</p>
                <p className="text-sm text-red-600">Urgency: {showDispatchModal.urgency}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Available Tow Trucks</h3>
                <div className="space-y-3">
                  {towTrucks.filter(truck => truck.available).map(truck => (
                    <div key={truck.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{truck.name}</h4>
                          <p className="text-sm text-gray-600">{truck.driver} • {truck.coverage}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Rating: {truck.rating}/5</span>
                            <span>ETA: {truck.eta}</span>
                            <span>{truck.capacity}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDispatch(showDispatchModal.id, truck.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Dispatch
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDispatchModal(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SOS Details Modal - Made Uneditable */}
      {showSOSDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>SOS Details - {showSOSDetails.sos_ticket_number || showSOSDetails.id}</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSOSDetails(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Emergency Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Request ID: </span>
                      <span className="font-medium">{showSOSDetails.sos_ticket_number || showSOSDetails.id}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Urgency: </span>
                      <Badge className={`${getUrgencyColor(showSOSDetails.urgency || showSOSDetails.priority_level?.toLowerCase())} text-white`}>
                        {showSOSDetails.urgency || showSOSDetails.priority_level}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status: </span>
                      <Badge className={`${getStatusColor(showSOSDetails.status)} border`}>
                        {showSOSDetails.status?.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Description: </span>
                      <p className="mt-1 p-3 bg-gray-50 rounded-lg">{showSOSDetails.description}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Contact & Location</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{showSOSDetails.customer || showSOSDetails.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{showSOSDetails.phone || showSOSDetails.contact_phone}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmergencyCall(showSOSDetails.phone || showSOSDetails.contact_phone)}
                      >
                        Call
                      </Button>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p>{showSOSDetails.location}</p>
                        <p className="text-xs text-gray-500">
                          Coordinates: {showSOSDetails.coordinates?.lat}, {showSOSDetails.coordinates?.lng}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Vehicle Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{showSOSDetails.vehicle || showSOSDetails.vehicle_model}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Plate Number: </span>
                      <span className="font-medium">{showSOSDetails.plateNumber || showSOSDetails.license_plate}</span>
                    </div>
                  </div>
                </div>
                {showSOSDetails.status !== 'converted' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Response Information</h3>
                    <div className="space-y-2">
                      {showSOSDetails.towTruck && (
                        <div>
                          <span className="text-sm text-gray-500">Assigned Truck: </span>
                          <span className="font-medium">{showSOSDetails.towTruck}</span>
                        </div>
                      )}
                      {showSOSDetails.estimatedArrival && (
                        <div>
                          <span className="text-sm text-gray-500">Estimated Arrival: </span>
                          <span className="font-medium">{showSOSDetails.estimatedArrival}</span>
                        </div>
                      )}
                      {showSOSDetails.dispatchedAt && (
                        <div>
                          <span className="text-sm text-gray-500">Dispatched At: </span>
                          <span className="font-medium">{showSOSDetails.dispatchedAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Created: </span>
                    <span>{showSOSDetails.createdAt || new Date(showSOSDetails.created_at).toLocaleString()}</span>
                  </div>
                  {showSOSDetails.dispatchedAt && (
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-500">Dispatched: </span>
                      <span>{showSOSDetails.dispatchedAt}</span>
                    </div>
                  )}
                  {showSOSDetails.completedAt && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-500">Completed: </span>
                      <span>{showSOSDetails.completedAt}</span>
                    </div>
                  )}
                  {showSOSDetails.status === 'converted' && showSOSDetails.updated_at && (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-500">Converted: </span>
                      <span>{new Date(showSOSDetails.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              {showSOSDetails.notes?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Notes</h3>
                  <div className="space-y-2">
                    {showSOSDetails.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex space-x-4 pt-4 border-t">
                {(showSOSDetails.status === 'pending' || showSOSDetails.status === 'dispatched') && showSOSDetails.status !== 'converted' && (
                  <Button
                    className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleOpenGenerateTicket(showSOSDetails)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Generate Ticket
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowSOSDetails(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Generate Ticket Modal --- */}
      <Dialog open={showGenerateTicketModal} onOpenChange={setShowGenerateTicketModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto text-black">
          <DialogHeader>
            <DialogTitle>Generate Service Ticket from SOS</DialogTitle>
            <DialogDescription>
              Create a new service ticket based on the details of SOS Request {showSOSDetails?.sos_ticket_number || showSOSDetails?.id}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateTicketSubmit}>
            <div className="grid gap-4 py-4">
              {ticketGenerationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{ticketGenerationError}</AlertDescription>
                </Alert>
              )}
              
              {/* Customer Type */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_type" className="text-right">
                  Customer Type
                </Label>
                <div className="col-span-3">
                  <Select 
                    name="customer_type" 
                    value={ticketFormData.customer_type} 
                    onValueChange={(value) => setTicketFormData(prev => ({ ...prev, customer_type: value }))}
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Customer Name - Conditional based on type */}
              {ticketFormData.customer_type === 'individual' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="individual_name" className="text-right">
                    Customer Name *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="individual_name"
                      name="individual_name"
                      value={ticketFormData.individual_name}
                      onChange={handleTicketFormChange}
                      required
                      placeholder="Enter customer name"
                      readOnly
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company_name" className="text-right">
                    Company Name *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="company_name"
                      name="company_name"
                      value={ticketFormData.company_name}
                      onChange={handleTicketFormChange}
                      required
                      placeholder="Enter company name"
                      readOnly
                    />
                  </div>
                </div>
              )}
              
              {/* Customer Phone - Conditional based on type */}
              {ticketFormData.customer_type === 'individual' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="individual_phone" className="text-right">
                    Phone *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="individual_phone"
                      name="individual_phone"
                      value={ticketFormData.individual_phone}
                      onChange={handleTicketFormChange}
                      required
                      placeholder="Enter phone number"
                      readOnly
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company_phone" className="text-right">
                    Phone *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="company_phone"
                      name="company_phone"
                      value={ticketFormData.company_phone}
                      onChange={handleTicketFormChange}
                      required
                      placeholder="Enter phone number"
                      readOnly
                    />
                  </div>
                </div>
              )}
              
              {/* Vehicle Information */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Vehicle</Label>
                <div className="col-span-3 grid grid-cols-3 gap-2">
                  <Input
                    name="vehicle_info.year"
                    value={ticketFormData.vehicle_info.year || ''}
                    onChange={handleTicketFormChange}
                    placeholder="Year"
                    type="number"
                    readOnly
                  />
                  <Input
                    name="vehicle_info.make"
                    value={ticketFormData.vehicle_info.make}
                    onChange={handleTicketFormChange}
                    placeholder="Make"
                    readOnly
                  />
                  <Input
                    name="vehicle_info.model"
                    value={ticketFormData.vehicle_info.model}
                    onChange={handleTicketFormChange}
                    placeholder="Model"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="license_plate" className="text-right">
                  License Plate
                </Label>
                <div className="col-span-3">
                  <Input
                    id="license_plate"
                    name="license_plate"
                    value={ticketFormData.license_plate}
                    onChange={handleTicketFormChange}
                    placeholder="Enter license plate"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="title"
                    name="title"
                    value={ticketFormData.title}
                    onChange={handleTicketFormChange}
                    required
                    placeholder="Enter ticket title"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description *
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="description"
                    name="description"
                    value={ticketFormData.description}
                    onChange={handleTicketFormChange}
                    required
                    placeholder="Enter detailed description"
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <div className="col-span-3">
                  <Select name="priority" value={ticketFormData.priority} onValueChange={(value) => setTicketFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="urgencyLevel" className="text-right">
                  Urgency Level
                </Label>
                <div className="col-span-3">
                  <Select name="urgencyLevel" value={ticketFormData.urgencyLevel} onValueChange={(value) => setTicketFormData(prev => ({ ...prev, urgencyLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowGenerateTicketModal(false)} disabled={isGeneratingTicket}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGeneratingTicket} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isGeneratingTicket ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Ticket
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SOS Popup */}
      <SOSPopup isOpen={showNewSOSModal} onClose={() => setShowNewSOSModal(false)} />
    </div>
  );
}