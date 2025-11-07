import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Car,
  FileText,
  Send,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Search,
  Users,
  Building2,
} from 'lucide-react';

// --- Interfaces ---
interface Customer {
  id: number;
  customerId: string;
  customerType: 'individual' | 'company';
  name: string;
  personal_name?: string;
  phone: string;
  email?: string;
  emergency_contact?: string;
  address?: string;
  notes?: string;
  image?: string;
}

interface Vehicle {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color: string;
  current_mileage: number;
  vehicle_type: string;
  customerId: string;
  customerName: string;
  image?: string;
}

interface Appointment {
  id: string;
  customerId: string;
  customerType: 'individual' | 'company';
  vehicleId?: string;
  customerName: string;
  vehicleModel: string;
  licensePlate: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  durationMinutes: number;
  mechanicPreference?: string;
  serviceBay?: string;
  notes?: string;
  status: 'pending' | 'converted' | 'cancelled';
  createdAt: string;
}

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  customerType: 'individual' | 'company';
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: string;
  urgencyLevel: 'moderate' | 'high' | 'critical';
  appointmentId?: string;
  // Insurance fields
  insuranceCompany?: string;
  insurancePhone?: string;
  accidentDate?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  insuranceDescription?: string;
  // Proforma field
  proformaId?: string;
}

const NewTicketModal: React.FC<NewTicketModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'new-ticket' | 'appointments'>('new-ticket');
  // --- State variables ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState(''); // New state for customer search
  const [formData, setFormData] = useState<FormData>({
    customerType: 'individual',
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleName: '',
    licensePlate: '',
    title: '',
    description: '',
    priority: 'medium',
    type: 'regular',
    urgencyLevel: 'moderate',
    // Insurance fields
    insuranceCompany: '',
    insurancePhone: '',
    accidentDate: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    insuranceDescription: '',
    // Proforma field
    proformaId: '',
  });

  // --- Fetch appointments when the appointments tab is active ---
  useEffect(() => {
    if (isOpen && activeTab === 'appointments') {
      const fetchAppointments = async () => {
        try {
          setLoading(true);
          const response = await fetch('https://ipasystem.bymsystem.com/api/appointments/getappointment');
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          const appointmentsArray = Array.isArray(data) ? data : data?.data || [];
          // Filter out 'converted' appointments immediately
          const pendingAppointments = appointmentsArray.filter(
            (apt: Appointment) => apt.status !== 'converted'
          );
          setAppointments(pendingAppointments);
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setAppointments([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAppointments();
    }
  }, [isOpen, activeTab]);

  // --- Existing functions ---
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/tickets/customers?type=${formData.customerType}`);
      const data = await response.json();
      // Ensure data is always an array
      const customersArray = Array.isArray(data) ? data : data?.data || [];
      setCustomers(customersArray);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async (customerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/tickets/vehicles/${customerId}`);
      const data = await response.json();
      // Ensure data is always an array
      const vehiclesArray = Array.isArray(data) ? data : data?.data || [];
      setVehicles(vehiclesArray);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerTypeChange = (type: 'individual' | 'company') => {
    setFormData(prev => ({
      ...prev,
      customerType: type,
      customerId: '',
      customerName: '',
      vehicleId: '',
      vehicleName: '',
      licensePlate: '',
    }));
    setSelectedCustomer(null);
    setSelectedVehicle(null);
  };

  const handleOpenCustomerModal = () => {
    setShowCustomerModal(true);
    setCustomerSearchTerm(''); // Reset search term when opening modal
    fetchCustomers();
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    const displayName = customer.personal_name || customer.name;
    setFormData(prev => ({
      ...prev,
      customerId: customer.customerId,
      customerName: displayName,
      vehicleId: '',
      vehicleName: '',
      licensePlate: '',
    }));
    setSelectedVehicle(null);
    setShowCustomerModal(false);
  };

  const handleOpenVehicleModal = () => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }
    setShowVehicleModal(true);
    fetchVehicles(selectedCustomer.customerId);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      vehicleId: String(vehicle.vehicleId),
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color}, ${vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'N/A'} mi)`,
      licensePlate: vehicle.license_plate || '',
    }));
    setShowVehicleModal(false);
  };

  // Format date/time for display
  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} at ${timeStr}`;
  };

  // Get status color for badge
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

  // --- Filtered Appointments (exclude converted) ---
  const filteredAppointments = appointments.filter(appointment => {
    const searchTerm = searchFilter.toLowerCase();
    return (
      (appointment.status !== 'converted') &&
      (appointment.customerName.toLowerCase().includes(searchTerm) ||
        appointment.licensePlate.toLowerCase().includes(searchTerm) ||
        appointment.vehicleModel.toLowerCase().includes(searchTerm) ||
        appointment.serviceType.toLowerCase().includes(searchTerm))
    );
  });

  // --- Filtered Customers based on search term ---
  const filteredCustomers = customers.filter(customer => {
    const searchTerm = customerSearchTerm.toLowerCase();
    
    if (formData.customerType === 'company') {
      // For companies, search by company name and contact person name
      // Fixed: Added null checks before calling toLowerCase()
      return (
        (customer.name && customer.name.toLowerCase().includes(searchTerm)) ||
        (customer.personal_name && customer.personal_name.toLowerCase().includes(searchTerm))
      );
    } else {
      // For individuals, search by personal name
      return customer.personal_name?.toLowerCase().includes(searchTerm);
    }
  });

  // --- handleGenerateTicketFromAppointment function ---
  const handleGenerateTicketFromAppointment = async (appointment: Appointment) => {
    const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
    const timeParts = appointment.appointmentTime.split(':');
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12;
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    setFormData({
      customerType: appointment.customerType,
      customerId: appointment.customerId,
      customerName: appointment.customerName,
      vehicleId: appointment.vehicleId || '',
      vehicleName: `${appointment.vehicleModel}`,
      licensePlate: appointment.licensePlate,
      title: `Scheduled Service: ${appointment.serviceType}`,
      description: `Service appointment for ${appointment.vehicleModel} (${appointment.licensePlate})
Scheduled Date: ${formattedDate} at ${formattedTime}
Duration: ${appointment.durationMinutes} minutes
Service Type: ${appointment.serviceType}
 ${appointment.mechanicPreference ? `Mechanic Preference: ${appointment.mechanicPreference}
` : ''}
 ${appointment.serviceBay ? `Service Bay: ${appointment.serviceBay}
` : ''}
Customer: ${appointment.customerName}
 ${appointment.notes ? `
Notes: ${appointment.notes}` : ''}`,
      priority: 'medium',
      type: 'appointment',
      urgencyLevel: 'moderate',
      appointmentId: appointment.id,
      // Insurance fields
      insuranceCompany: '',
      insurancePhone: '',
      accidentDate: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      insuranceDescription: '',
      // Proforma field
      proformaId: '',
    });

    // Clear the selected vehicle state
    setSelectedVehicle(null);
    setActiveTab('new-ticket');
  };

  const validateForm = () => {
    const requiredFields = [
      'customerId',
      'customerName',
      'vehicleId',
      'vehicleName',
      'licensePlate',
      'title',
      'description',
    ];
    
    // Additional validation for insurance tickets
    if (formData.type === 'insurance') {
      requiredFields.push('insuranceCompany', 'ownerName');
    }
    
    for (const field of requiredFields) {
      const value = formData[field as keyof FormData];
      if (value === '' || value === null || value === undefined) {
        setSubmitError(`Please fill in all required fields. Missing: ${field}`);
        return false;
      }
    }
    setSubmitError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare customer data based on type
      let customerData: any = {
        customer_type: formData.customerType,
        customer_id: formData.customerId,
      };

      if (formData.customerType === 'company') {
        customerData = {
          ...customerData,
          company_name: selectedCustomer?.name || '',
          contact_person_name: selectedCustomer?.personal_name || '',
          company_email: selectedCustomer?.email || '',
          company_phone: selectedCustomer?.phone || '',
          emergency_contact: selectedCustomer?.emergency_contact || '',
          company_address: selectedCustomer?.address || '',
          company_notes: selectedCustomer?.notes || '',
          company_image: selectedCustomer?.image || '',
        };
      } else {
        customerData = {
          ...customerData,
          individual_name: selectedCustomer?.personal_name || '',
          individual_email: selectedCustomer?.email || '',
          individual_phone: selectedCustomer?.phone || '',
          individual_emergency_contact: selectedCustomer?.emergency_contact || '',
          individual_address: selectedCustomer?.address || '',
          individual_notes: selectedCustomer?.notes || '',
          individual_image: selectedCustomer?.image || '',
        };
      }

      // Prepare vehicle data as object
      const vehicleData = {
        make: selectedVehicle?.make || '',
        model: selectedVehicle?.model || '',
        year: selectedVehicle?.year || '',
        vin: selectedVehicle?.vin || '',
        color: selectedVehicle?.color || '',
        current_mileage: selectedVehicle?.current_mileage || 0,
        image: selectedVehicle?.image || '',
      };

      // Prepare the request body
      const requestBody: any = {
        ...customerData,
        vehicle_info: vehicleData,
        license_plate: formData.licensePlate,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        type: formData.type,
        urgency_level: formData.type === 'sos' ? formData.urgencyLevel : null,
        appointment_id: formData.type === 'appointment' ? formData.appointmentId : null,
        proforma_id: formData.proformaId || null,
      };

      // Add insurance fields if ticket type is insurance
      if (formData.type === 'insurance') {
        requestBody.insurance_company = formData.insuranceCompany;
        requestBody.insurance_phone = formData.insurancePhone;
        requestBody.accident_date = formData.accidentDate;
        requestBody.owner_name = formData.ownerName;
        requestBody.owner_phone = formData.ownerPhone;
        requestBody.owner_email = formData.ownerEmail;
        requestBody.insurance_description = formData.insuranceDescription;
      }

      const response = await fetch('https://ipasystem.bymsystem.com/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }

      const data = await response.json();
      console.log('Ticket created:', data);

      // After successful ticket creation, update appointment status to 'converted'
      if (formData.appointmentId) {
        try {
          await fetch(`https://ipasystem.bymsystem.com/api/appointments/${formData.appointmentId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'converted' }),
          });

          // Update local appointments list
          setAppointments(prev =>
            prev.filter(apt => apt.id !== formData.appointmentId)
          );
        } catch (err) {
          console.error('Failed to update appointment status:', err);
        }
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setSubmitError('Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerType: 'individual',
      customerId: '',
      customerName: '',
      vehicleId: '',
      vehicleName: '',
      licensePlate: '',
      title: '',
      description: '',
      priority: 'medium',
      type: 'regular',
      urgencyLevel: 'moderate',
      // Insurance fields
      insuranceCompany: '',
      insurancePhone: '',
      accidentDate: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      insuranceDescription: '',
      // Proforma field
      proformaId: '',
    });
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto text-black">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={handleClose}></div>

        {/* Modal box */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {activeTab === 'new-ticket' ? (
                  <FileText className="w-5 h-5 text-blue-600" />
                ) : (
                  <Calendar className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'new-ticket'
                    ? 'Create New Service Ticket'
                    : 'Scheduled Appointments'}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeTab === 'new-ticket'
                    ? 'Submit a new service request to the manager'
                    : 'View and generate tickets from scheduled appointments'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('new-ticket')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all text-sm font-medium flex items-center justify-center space-x-2 ${
                activeTab === 'new-ticket'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all text-sm font-medium flex items-center justify-center space-x-2 ${
                activeTab === 'appointments'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments ({filteredAppointments.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'new-ticket' ? (
            // --- New Ticket Form ---
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-600">
                    <FileText className="w-5 h-5" />
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              {/* Customer Type Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Type</h3>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="individual"
                      checked={formData.customerType === 'individual'}
                      onChange={() => handleCustomerTypeChange('individual')}
                    />
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 font-medium">Individual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="company"
                      checked={formData.customerType === 'company'}
                      onChange={() => handleCustomerTypeChange('company')}
                    />
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 font-medium">Company</span>
                  </label>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customerName}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 cursor-pointer"
                    placeholder="Click to select customer"
                    readOnly
                    onClick={handleOpenCustomerModal}
                    required
                  />
                  <Users className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Vehicle and License Plate Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Model *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="vehicle_model"
                      value={formData.vehicleName}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 cursor-pointer"
                      placeholder="Click to select vehicle"
                      readOnly
                      onClick={handleOpenVehicleModal}
                      required
                    />
                    <Car className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="License plate will auto-fill"
                    required
                  />
                </div>
              </div>

              {/* Ticket Type, Priority, Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="regular">Regular Service</option>
                    <option value="appointment">Scheduled Appointment</option>
                    <option value="insurance">Insurance Claim</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, priority: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proforma ID
                  </label>
                  <input
                    type="text"
                    name="proforma_id"
                    value={formData.proformaId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, proformaId: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter proforma ID if applicable"
                  />
                </div>
              </div>

              {/* Insurance Fields (conditionally rendered) */}
              {formData.type === 'insurance' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Insurance Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Company *
                      </label>
                      <input
                        type="text"
                        name="insurance_company"
                        value={formData.insuranceCompany}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, insuranceCompany: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Insurance company name"
                        required={formData.type === 'insurance'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Phone
                      </label>
                      <input
                        type="text"
                        name="insurance_phone"
                        value={formData.insurancePhone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, insurancePhone: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Insurance company phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accident Date
                      </label>
                      <input
                        type="date"
                        name="accident_date"
                        value={formData.accidentDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, accidentDate: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        name="owner_name"
                        value={formData.ownerName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerName: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Vehicle owner name"
                        required={formData.type === 'insurance'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Phone
                      </label>
                      <input
                        type="text"
                        name="owner_phone"
                        value={formData.ownerPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerPhone: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Owner phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Email
                      </label>
                      <input
                        type="email"
                        name="owner_email"
                        value={formData.ownerEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerEmail: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Owner email address"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Description
                    </label>
                    <textarea
                      name="insurance_description"
                      value={formData.insuranceDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, insuranceDescription: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the incident and insurance details"
                    />
                  </div>
                </div>
              )}

              {/* Issue Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Brief description of the issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={6}
                  placeholder="Provide detailed information about the issue, symptoms, and any relevant details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Hidden fields for form submission */}
              <input type="hidden" name="customerId" value={formData.customerId} />
              <input type="hidden" name="customerName" value={formData.customerName} />
              <input type="hidden" name="vehicleId" value={formData.vehicleId} />
              <input type="hidden" name="vehicleName" value={formData.vehicleName} />

              {/* Appointment Info Alert */}
              {formData.type === 'appointment' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Appointment-Based Ticket</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This ticket was generated from a scheduled appointment and contains pre-filled appointment details.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit to Manager
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // --- Appointments Tab Content ---
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Scheduled Appointments</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Click "Generate Ticket" to create a service ticket from any scheduled appointment. All appointment details will be automatically transferred to the new ticket form.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by customer name, license plate, or vehicle..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Results count */}
              <div className="text-sm text-gray-600 mb-4">
                Showing {filteredAppointments.length} of {appointments.length} appointments
                {searchFilter && (
                  <span className="ml-2">
                    for "<span className="font-medium">{searchFilter}</span>"
                  </span>
                )}
              </div>

              {/* Appointment List */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {appointment.customerName}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)} border`}>
                              {appointment.status === 'pending' ? 'Pending' : appointment.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Car className="w-4 h-4" />
                                <span>
                                  {appointment.vehicleModel} ({appointment.licensePlate})
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}
                                  {appointment.durationMinutes && ` (${appointment.durationMinutes} mins)`}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>{appointment.serviceType}</span>
                              </div>
                              {appointment.mechanicPreference && (
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4" />
                                  <span>Mechanic: {appointment.mechanicPreference}</span>
                                </div>
                              )}
                              {appointment.notes && (
                                <div className="flex items-start space-x-2">
                                  <Clock className="w-4 h-4 mt-0.5" />
                                  <span className="text-xs">{appointment.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerateTicketFromAppointment(appointment)}
                          disabled={isSubmitting}
                          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Generate Ticket
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No pending appointments</p>
                    <p className="text-sm">
                      {searchFilter
                        ? `No results match "${searchFilter}".`
                        : 'All appointments have been converted or none are pending.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Selection Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Select {formData.customerType === 'individual' ? 'Individual' : 'Company'} Customer
                </h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Customer Search Input */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={`Search by ${formData.customerType === 'company' ? 'company name or contact person' : 'customer name'}...`}
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {formData.customerType === 'individual' ? (
                              <User className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Building2 className="w-5 h-5 text-blue-600" />
                            )}
                            <div>
                              {formData.customerType === 'company' ? (
                                <>
                                  <div className="font-medium text-gray-800">{customer.name}</div>
                                  <div className="text-sm text-blue-600 font-medium">
                                    Contact: {customer.personal_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {customer.customerId} | Phone: {customer.phone}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-medium text-gray-800">{customer.personal_name}</div>
                                  <div className="text-sm text-gray-500">
                                    ID: {customer.customerId} | Phone: {customer.phone}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {customerSearchTerm ? (
                          <p>No customers found matching "{customerSearchTerm}"</p>
                        ) : (
                          <p>No {formData.customerType} customers found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Selection Modal */}
        {showVehicleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto m-4">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Select Vehicle for {selectedCustomer?.name}
                </h3>
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.vehicleId}
                        onClick={() => handleSelectVehicle(vehicle)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Car className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              License: {vehicle.license_plate} | Color: {vehicle.color} |
                              Type: {vehicle.vehicle_type} | Mileage: {vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              VIN: {vehicle.vin}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {vehicles.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No vehicles found for this customer
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewTicketModal;