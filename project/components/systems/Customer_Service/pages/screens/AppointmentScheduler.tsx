'use client';
import { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Car,
  Clock,
  CheckCircle,
  Eye,
  Send,
  X,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/components/ui/NotificationSystem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// === Vehicle Interface ===
interface Vehicle {
  id: number | null;
  make: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  vin: string | null;
  color: string | null;
  current_mileage: number | null;
}

// === Appointment Interface using Vehicle ===
interface Appointment {
  id: number;
  customerId: number;
  customerType: 'individual' | 'company' | null;
  customerName: string;
  customerPhone?: string;
  vehicle: Vehicle; // Using the Vehicle interface
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  durationMinutes: number;
  serviceBay: string | null;
  notes: string | null;
  status: 'pending' | 'converted' | 'cancelled';
  createdAt: string;
}

// === Import the NewAppointmentModal ===
import NewAppointmentModal from '../pop up/NewAppointmentModal';

// === Main Component ===
export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertedCount, setConvertedCount] = useState(0); // New state for converted count

  // === Modal States ===
  const [showDetailsModal, setShowDetailsModal] = useState<Appointment | null>(null);
  const [showGenerateTicketModal, setShowGenerateTicketModal] = useState(false);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [ticketGenerationError, setTicketGenerationError] = useState<string | null>(null);
  
  // Initialize all fields to avoid undefined values
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
      year: null as number | null,
    },
    license_plate: ''
  });

  // --- State for the New Appointment Modal ---
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  const { addNotification } = useNotifications();

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/appointments/getappointment');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      // Transform the data to use the Vehicle interface
      const data = await response.json();
      const transformedData: Appointment[] = data.map((item: any) => ({
        id: item.id,
        customerId: item.customerId,
        customerType: item.customerType,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        vehicle: {
          id: item.vehicleId,
          make: item.vehicleMake,
          model: item.vehicleModel,
          year: item.vehicleYear,
          licensePlate: item.licensePlate,
          vin: item.vin,
          color: item.color,
          current_mileage: item.current_mileage,
        },
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        serviceType: item.serviceType,
        durationMinutes: item.durationMinutes,
        serviceBay: item.serviceBay,
        notes: item.notes,
        status: item.status,
        createdAt: item.createdAt,
      }));
      
      // Filter out converted appointments from the list
      const activeAppointments = transformedData.filter(apt => apt.status !== 'converted');
      
      // Update state without duplicates
      setAppointments(prev => {
        const appointmentMap = new Map<number, Appointment>();
        // Add existing appointments
        prev.forEach(apt => appointmentMap.set(apt.id, apt));
        // Add or update with new appointments
        activeAppointments.forEach(apt => appointmentMap.set(apt.id, apt));
        return Array.from(appointmentMap.values());
      });
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
      addNotification({
        type: 'error',
        title: 'Fetch Error',
        message: 'Could not load appointments',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch converted count
  const fetchConvertedCount = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/appointments/converted/count');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setConvertedCount(data.convertedCount);
    } catch (err: any) {
      console.error('Error fetching converted count:', err);
      // We don't show a notification for this as it's not critical
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchConvertedCount(); // Fetch converted count
    const interval = setInterval(() => {
      fetchAppointments();
      fetchConvertedCount(); // Also refresh converted count periodically
    }, 30000);
    return () => clearInterval(interval);
  }, [addNotification]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter appointments (excluding converted ones)
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesService = serviceFilter === 'all' || apt.serviceType === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  // Get unique services for filter
  const serviceTypes = Array.from(new Set(appointments.map((a) => a.serviceType)));

  // Format date/time
  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} at ${timeStr}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'converted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (status: string) => {
    return status === 'pending' ? 'bg-red-500' : 'bg-green-500';
  };

  // Open details modal
  const openDetails = (apt: Appointment) => {
    setShowDetailsModal(apt);
  };

  // Handle ticket form change
  const handleTicketFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      setTicketFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Open generate ticket modal with pre-filled data
  const handleOpenGenerateTicket = (apt: Appointment) => {
    // Create a new object with all required fields initialized
    const newTicketFormData = {
      title: `Service: ${apt.serviceType} - ${apt.customerName}`,
      description: `Converted from Appointment
Customer: ${apt.customerName} (${apt.customerType === 'individual' ? 'Individual' : 'Company'})
Vehicle: ${apt.vehicle.year} ${apt.vehicle.make} ${apt.vehicle.model} (${apt.vehicle.licensePlate || 'No Plate'})
Mileage: ${apt.vehicle.current_mileage ?? 'N/A'} miles
Color: ${apt.vehicle.color || 'N/A'}
Service Type: ${apt.serviceType}
Duration: ${apt.durationMinutes} minutes
Bay: ${apt.serviceBay || 'Not assigned'}
Appointment Time: ${formatDateTime(apt.appointmentDate, apt.appointmentTime)}
Notes: ${apt.notes || 'No additional notes.'}`,
      priority: apt.status === 'pending' ? 'urgent' : 'medium',
      urgencyLevel: apt.status === 'pending' ? 'high' : 'moderate',
      customer_type: apt.customerType || 'individual',
      customer_id: apt.customerId.toString(),
      vehicle_info: {
        make: apt.vehicle.make || '',
        model: apt.vehicle.model || '',
        year: apt.vehicle.year || null
      },
      license_plate: apt.vehicle.licensePlate || '',
      // Initialize all fields to avoid undefined
      individual_name: '',
      individual_phone: '',
      company_name: '',
      company_phone: '',
    };

    // Set customer fields based on type
    if (apt.customerType === 'individual') {
      newTicketFormData.individual_name = apt.customerName || '';
      newTicketFormData.individual_phone = apt.customerPhone || '';
    } else {
      newTicketFormData.company_name = apt.customerName || '';
      newTicketFormData.company_phone = apt.customerPhone || '';
    }

    setTicketFormData(newTicketFormData);
    setShowDetailsModal(apt);
    setShowGenerateTicketModal(true);
    setTicketGenerationError(null);
  };

  // Handle ticket submission
  const handleGenerateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDetailsModal) return;
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
        type: 'service',
        urgency_level: ticketFormData.urgencyLevel,
      };

      const response = await fetch('http://localhost:5001/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create ticket: ${response.status} ${errorText}`);
      }

      const createdTicket = await response.json();

      // Update backend appointment status to 'converted'
      const statusResponse = await fetch(`http://localhost:5001/api/appointments/${showDetailsModal.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'converted' }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update appointment status');
      }

      // Remove the appointment from the list
      setAppointments((prev) => prev.filter((apt) => apt.id !== showDetailsModal.id));
      
      // Update converted count
      setConvertedCount(prev => prev + 1);

      // Success
      setShowGenerateTicketModal(false);
      setShowDetailsModal(null);
      addNotification({
        type: 'success',
        title: 'Ticket Generated',
        message: `Ticket ${createdTicket.ticket_number || 'ID-NOT-RETURNED'} created from appointment.`,
      });
    } catch (err: any) {
      console.error('Error generating ticket:', err);
      setTicketGenerationError(err.message || 'Failed to create ticket.');
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  // Handle opening the New Appointment Modal
  const handleNewAppointment = () => {
    setShowNewAppointmentModal(true);
  };

  // Callback for when a new appointment is successfully created
  const handleAppointmentCreated = () => {
    fetchAppointments();
  };

  // Handle closing the New Appointment Modal
  const handleCloseNewAppointmentModal = () => {
    setShowNewAppointmentModal(false);
    fetchAppointments(); // Refresh list when modal closes
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Appointment Management
          </h1>
          <p className="text-gray-600 mt-1">Schedule and manage service appointments</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{currentTime.toLocaleTimeString()}</p>
            <p className="text-xs text-gray-500">Active: {appointments.length}</p>
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleNewAppointment}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Pending</p>
                <p className="text-3xl font-bold">{appointments.filter((a) => a.status === 'pending').length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-200 animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Converted</p>
                <p className="text-3xl font-bold">{convertedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100">Cancelled</p>
                <p className="text-3xl font-bold">{appointments.filter((a) => a.status === 'cancelled').length}</p>
              </div>
              <X className="w-8 h-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-gray-500">
              No active appointments match your filters.
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((apt, index) => (
            <Card key={apt.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-6 h-6 rounded-full ${getPriorityColor(apt.status)}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{apt.customerName}</h3>
                        <Badge className={`${getStatusColor(apt.status)} border`}>
                          {apt.status === 'pending' ? 'High Urgency' : apt.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{apt.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Phone className="w-4 h-4" />
                            <span>{apt.customerPhone || 'No phone'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(apt.appointmentDate, apt.appointmentTime)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 mb-1">Service: {apt.serviceType}</p>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Car className="w-4 h-4" />
                            <span className="font-medium">
                              {apt.vehicle.year} {apt.vehicle.make} {apt.vehicle.model} ({apt.vehicle.licensePlate})
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Duration: {apt.durationMinutes}m</span>
                            {apt.serviceBay && <span>Bay: {apt.serviceBay}</span>}
                            <span>Created: {new Date(apt.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-3">
                    <div className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openDetails(apt)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {apt.status !== 'converted' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleOpenGenerateTicket(apt)}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Generate Ticket
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

      {/* Appointment Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Appointment Details</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Name: </span>
                      <span className="font-medium">{showDetailsModal.customerName}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Type: </span>
                      <span className="font-medium capitalize">{showDetailsModal.customerType}</span>
                    </div>
                    {showDetailsModal.customerPhone && (
                      <div>
                        <span className="text-sm text-gray-500">Phone: </span>
                        <span className="font-medium">{showDetailsModal.customerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Service Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Service: </span>
                      <span className="font-medium">{showDetailsModal.serviceType}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Time: </span>
                      <span className="font-medium">
                        {formatDateTime(showDetailsModal.appointmentDate, showDetailsModal.appointmentTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status: </span>
                      <Badge className={`${getStatusColor(showDetailsModal.status)} border`}>
                        {showDetailsModal.status === 'pending' ? 'High Urgency' : showDetailsModal.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Vehicle Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Vehicle: </span>
                        <span className="font-medium">
                          {showDetailsModal.vehicle.year} {showDetailsModal.vehicle.make} {showDetailsModal.vehicle.model}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Plate: </span>
                        <span className="font-medium">{showDetailsModal.vehicle.licensePlate}</span>
                      </div>
                    
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2">
                    
                      {showDetailsModal.vehicle.vin && (
                        <div>
                          <span className="text-sm text-gray-500">VIN: </span>
                          <span className="font-mono text-sm">{showDetailsModal.vehicle.vin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Additional Info</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Duration: </span>
                    <span className="font-medium">{showDetailsModal.durationMinutes} minutes</span>
                  </div>
                  {showDetailsModal.serviceBay && (
                    <div>
                      <span className="text-sm text-gray-500">Bay: </span>
                      <span className="font-medium">{showDetailsModal.serviceBay}</span>
                    </div>
                  )}
                  {showDetailsModal.notes && (
                    <div>
                      <span className="text-sm text-gray-500">Notes: </span>
                      <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{showDetailsModal.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-4 pt-4 border-t">
                {showDetailsModal.status !== 'converted' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleOpenGenerateTicket(showDetailsModal)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Generate Ticket
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailsModal(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate Ticket Modal */}
      <Dialog open={showGenerateTicketModal} onOpenChange={setShowGenerateTicketModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto text-black">
          <DialogHeader>
            <DialogTitle>Generate Service Ticket</DialogTitle>
            <DialogDescription>
              Create a new service ticket from this appointment
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
                    />
                  </div>
                </div>
              )}
              
              {/* Customer Phone - Conditional based on type */}
              {ticketFormData.customer_type === 'individual' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="individual_phone" className="text-right">
                    Phone
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="individual_phone"
                      name="individual_phone"
                      value={ticketFormData.individual_phone}
                      onChange={handleTicketFormChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company_phone" className="text-right">
                    Phone
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="company_phone"
                      name="company_phone"
                      value={ticketFormData.company_phone}
                      onChange={handleTicketFormChange}
                      placeholder="Enter phone number"
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
                  />
                  <Input
                    name="vehicle_info.make"
                    value={ticketFormData.vehicle_info.make}
                    onChange={handleTicketFormChange}
                    placeholder="Make"
                  />
                  <Input
                    name="vehicle_info.model"
                    value={ticketFormData.vehicle_info.model}
                    onChange={handleTicketFormChange}
                    placeholder="Model"
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
                    placeholder="Enter a descriptive title"
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
                    placeholder="Provide detailed service information"
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <div className="col-span-3">
                  <Select
                    name="priority"
                    value={ticketFormData.priority}
                    onValueChange={(value) => setTicketFormData((prev) => ({ ...prev, priority: value }))}
                  >
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
                  <Select
                    name="urgencyLevel"
                    value={ticketFormData.urgencyLevel}
                    onValueChange={(value) => setTicketFormData((prev) => ({ ...prev, urgencyLevel: value }))}
                  >
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGenerateTicketModal(false)}
                disabled={isGeneratingTicket}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isGeneratingTicket}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
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

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={showNewAppointmentModal}
        onClose={handleCloseNewAppointmentModal}
        
      />
    </div>
  );
}