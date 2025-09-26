import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, FileText, Settings, MapPin, Users, Building2 } from 'lucide-react';

interface Customer {
  id: number;
  customerId: string;
  customerType: 'individual' | 'company';
  name: string;
  personal_name?: string;
  phone: string;
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
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose }) => {
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.personal_name?.toLowerCase().includes(searchLower) ||
      customer.customerId?.toLowerCase().includes(searchLower)
    );
  });

  const [formData, setFormData] = useState({
    customer_Name: '',
    customerId: '',
    vehicle_Model: '',
    license_Plate: '',
    date: '',
    time: '',
    serviceType: '',
    duration: 60,
    mechanicPreference: '',
    serviceBay: '',
    notes: '',
  });

  const serviceTypes = [
    'Oil Change',
    'Brake Service',
    'Tire Rotation',
    'Engine Diagnostic',
    'Transmission Service',
    'Battery Replacement',
    'Air Filter Replacement',
    'Coolant Service',
    'Tune-up',
    'Inspection',
    'Other'
  ];

  const serviceBays = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5'];

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/appointments/customers?type=${customerType}`);
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
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
      const response = await fetch(`https://ipasystem.bymsystem.com/api/app/vehicles/${customerId}`);
      const data = await response.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerTypeChange = (type: 'individual' | 'company') => {
    setCustomerType(type);
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setFormData(prev => ({
      ...prev,
      customer_Name: '',
      customerId: '',
      vehicle_Model: '',
      license_Plate: ''
    }));
  };

  const handleOpenCustomerModal = () => {
    setShowCustomerModal(true);
    fetchCustomers();
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    const displayName = customer.personal_name || customer.name;
    setFormData(prev => ({
      ...prev,
      customer_Name: displayName,
      customerId: customer.customerId,
      vehicle_Model: '',
      license_Plate: ''
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
      vehicle_Model: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      license_Plate: vehicle.license_plate
    }));
    setShowVehicleModal(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }
      setSubmitStatus('success');
      resetForm();
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setSubmitStatus('error');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_Name: '',
      customerId: '',
      vehicle_Model: '',
      license_Plate: '',
      date: '',
      time: '',
      serviceType: '',
      duration: 60,
      mechanicPreference: '',
      serviceBay: '',
      notes: '',
    });
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCustomerType('individual');
    setShowCustomServiceInput(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 text-black">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            New Appointment
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Form */}
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {/* Customer Type Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Type</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="customerType"
                  value="individual"
                  checked={customerType === 'individual'}
                  onChange={() => handleCustomerTypeChange('individual')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Individual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="customerType"
                  value="company"
                  checked={customerType === 'company'}
                  onChange={() => handleCustomerTypeChange('company')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Company</span>
              </label>
            </div>
          </div>
          {/* Customer Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <div className="relative">
              <input
                type="text"
                name="customer_Name"
                value={formData.customer_Name}
                onChange={(e) => handleInputChange('customer_Name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 cursor-pointer"
                placeholder="Click to select customer"
                readOnly
                onClick={handleOpenCustomerModal}
                required
              />
              <Users className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Model
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="vehicle_Model"
                  value={formData.vehicle_Model}
                  onChange={(e) => handleInputChange('vehicle_Model', e.target.value)}
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
                License Plate
              </label>
              <input
                type="text"
                name="license_Plate"
                value={formData.license_Plate}
                onChange={(e) => handleInputChange('license_Plate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="License plate will auto-fill"
                required
              />
            </div>
          </div>
          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          {/* Service Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              {!showCustomServiceInput ? (
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'Other') {
                      setShowCustomServiceInput(true);
                      setFormData(prev => ({ ...prev, serviceType: '' }));
                    } else {
                      setFormData(prev => ({ ...prev, serviceType: value }));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select service type</option>
                  {serviceTypes.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom service type"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomServiceInput(false);
                      setFormData(prev => ({ ...prev, serviceType: '' }));
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    List
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="15"
                step="15"
                required
              />
            </div>
          </div>
          {/* Mechanic and Bay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Bay
              </label>
              <select
                name="serviceBay"
                value={formData.serviceBay}
                onChange={(e) => handleInputChange('serviceBay', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select service bay</option>
                {serviceBays.map((bay) => (
                  <option key={bay} value={bay}>
                    {bay}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
              placeholder="Enter any additional notes..."
            />
          </div>
          {/* Submission Status */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-100 text-green-800 rounded-lg">
              Appointment created successfully!
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg">
              Error creating appointment. Please try again.
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={submitStatus === 'submitting'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400"
              disabled={submitStatus === 'submitting'}
            >
              {submitStatus === 'submitting' ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Select {customerType === 'individual' ? 'Individual' : 'Company'} Customer
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
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
                <div className="space-y-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search customers..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="space-y-3">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {customerType === 'individual' ? (
                            <User className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Building2 className="w-5 h-5 text-blue-600" />
                          )}
                          <div>
                            {customerType === 'company' ? (
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
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No {customerType} customers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Vehicle Selection Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 text-black">
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
                            Type: {vehicle.vehicle_type} | current_mileage: {vehicle.current_mileage.toLocaleString()}
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
  );
};

export default NewAppointmentModal;