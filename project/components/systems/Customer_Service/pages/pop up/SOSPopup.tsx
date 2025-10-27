import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Phone, Car, MapPin, FileText, User, Users, Search, Building, Clock, CheckCircle } from 'lucide-react';

interface Customer {
  id: string;
  customerId: string;
  customerType: 'individual' | 'company';
  name: string;
  personal_name?: string;
  phone: string;
  email: string;
  companyName?: string;
}

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
  color?: string;
  mileage?: number;
  customerId: string;
}

interface SOSPopupProps {
  isOpen: boolean;
  onClose: () => void;
  // Removed onSubmit prop since we're handling submission internally
}

const CustomerSelectionPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  customerType: 'individual' | 'company';
}> = ({ isOpen, onClose, onSelectCustomer, customerType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`https://ipasystem.bymsystem.com/api/sos-request/customers?type=${customerType}`)
        .then(response => response.json())
        .then(data => {
          setCustomers(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching customers:', error);
          setLoading(false);
        });
    }
  }, [customerType, isOpen]);

  const filteredCustomers = customers.filter(customer => 
    (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     customer.personal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     customer.phone.includes(searchTerm) ||
     customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto text-black">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle text-black transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6 text-black">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {customerType === 'individual' ? (
                  <User className="w-5 h-5 text-blue-600" />
                ) : (
                  <Building className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Select {customerType === 'individual' ? 'Individual' : 'Company'} Customer
                </h3>
                <p className="text-sm text-gray-500">Choose a customer for the SOS request</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading customers...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      onSelectCustomer(customer);
                      onClose();
                    }}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                           customer.personal_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {customer.name || customer.personal_name}
                        </p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                        {customer.companyName && (
                          <p className="text-xs text-blue-600 font-medium">{customer.companyName}</p>
                        )}
                      </div>
                      <div className="text-gray-400">
                        <span className="text-xs font-medium">{customer.customerId}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!loading && filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No customers found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const VehicleSelectionPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  customerId: string;
}> = ({ isOpen, onClose, onSelectVehicle, customerId }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      setLoading(true);
      fetch(`https://ipasystem.bymsystem.com/api/sos-request/vehicles/${customerId}`)
        .then(response => response.json())
        .then(data => {
          setVehicles(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching vehicles:', error);
          setLoading(false);
        });
    }
  }, [customerId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto text-black">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Select Vehicle</h3>
                <p className="text-sm text-gray-500">Choose a vehicle for the SOS request</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto text-black">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading vehicles...</p>
              </div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.vehicleId}
                    onClick={() => {
                      onSelectVehicle(vehicle);
                      onClose();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <Car className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-500">License: {vehicle.license_plate}</p>
                        {vehicle.vin && (
                          <p className="text-xs text-gray-500">VIN: {vehicle.vin}</p>
                        )}
                        <p className="text-xs text-green-600 font-medium">{vehicle.vehicleId}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No vehicles found for this customer.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SOSPopup: React.FC<SOSPopupProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    customerType: 'individual' as 'individual' | 'company',
    customerName: '',
    vehicleModel: '',
    licensePlate: '',
    location: '',
    contactPhone: '',
    description: '',
    priorityLevel: 'High' as 'High' | 'Critical'
  });
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCustomerPopupOpen, setIsCustomerPopupOpen] = useState(false);
  const [isVehiclePopupOpen, setIsVehiclePopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerTypeChange = (type: 'individual' | 'company') => {
    setFormData(prev => ({ ...prev, customerType: type }));
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setFormData(prev => ({ 
      ...prev, 
      customerName: '', 
      vehicleModel: '', 
      licensePlate: '', 
      contactPhone: '' 
    }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerName: customer.name || customer.personal_name || '',
      contactPhone: customer.phone
    }));
    setSelectedVehicle(null);
    setFormData(prev => ({ ...prev, vehicleModel: '', licensePlate: '' }));
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      vehicleModel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      licensePlate: vehicle.license_plate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const sosData = {
        customer_id: selectedCustomer?.customerId || undefined,
        customer_name: formData.customerName,
        customer_type: formData.customerType,
        vehicle_model: formData.vehicleModel,
        license_plate: formData.licensePlate,
        location: formData.location,
        contact_phone: formData.contactPhone,
        description: formData.description,
        priority_level: formData.priorityLevel
      };

      const response = await fetch('https://ipasystem.bymsystem.com/api/sos-request/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sosData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit SOS request');
      }

      // Show success message
      setShowSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          customerType: 'individual',
          customerName: '',
          vehicleModel: '',
          licensePlate: '',
          location: '',
          contactPhone: '',
          description: '',
          priorityLevel: 'High'
        });
        setSelectedCustomer(null);
        setSelectedVehicle(null);
        setShowSuccess(false);
        onClose();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error submitting SOS request:', error);
      setError(error.message || 'An error occurred while submitting the request');
      setIsSubmitting(false);
    }
  };

  // If showing success message, render only that
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl transform transition-all duration-300 scale-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">SOS Request Sent!</h3>
          <p className="text-gray-600 mb-6">
            Your emergency request has been successfully submitted. Help is on the way!
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto rounded-full mb-6"></div>
          <p className="text-sm text-gray-500">
            You will be contacted shortly by our emergency response team.
          </p>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto text-black">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose} />
          <div className="inline-block w-full max-w-2xl p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">SOS Emergency Request</h3>
                    <p className="text-red-100">Submit an urgent assistance request</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Customer Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="customerType"
                      value="individual"
                      checked={formData.customerType === 'individual'}
                      onChange={() => handleCustomerTypeChange('individual')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Individual</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="customerType"
                      value="company"
                      checked={formData.customerType === 'company'}
                      onChange={() => handleCustomerTypeChange('company')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <Building className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Company</span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  {selectedCustomer ? (
                    <div className="relative">
                      <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-semibold text-sm">
                            {(selectedCustomer.name || selectedCustomer.personal_name)?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {selectedCustomer.name || selectedCustomer.personal_name}
                          </p>
                          <p className="text-sm text-gray-600">{selectedCustomer.customerId}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCustomerPopupOpen(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCustomerPopupOpen(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center group"
                    >
                      <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                      <p className="text-gray-600 group-hover:text-blue-600 font-medium">
                        Click to select customer
                      </p>
                      <p className="text-sm text-gray-500">Choose from customer list</p>
                    </button>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Model *
                  </label>
                  {selectedVehicle ? (
                    <div className="relative">
                      <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                          <Car className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{formData.vehicleModel}</p>
                          <p className="text-sm text-gray-600">{selectedVehicle.license_plate}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectedCustomer && setIsVehiclePopupOpen(true)}
                          disabled={!selectedCustomer}
                          className="text-green-600 hover:text-green-700 text-sm font-medium disabled:text-gray-400"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectedCustomer && setIsVehiclePopupOpen(true)}
                      disabled={!selectedCustomer}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Car className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600 group-hover:text-green-600 font-medium">
                        {selectedCustomer ? 'Click to select vehicle' : 'Select customer first'}
                      </p>
                      <p className="text-sm text-gray-500">Choose from customer's vehicles</p>
                    </button>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Emergency contact number"
                      required
                    />
                  </div>
                  {selectedCustomer && (
                    <p className="text-xs text-gray-500 mt-1">Auto-filled from customer profile. You can edit if needed.</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter license plate"
                    required
                  />
                  {selectedVehicle && (
                    <p className="text-xs text-gray-500 mt-1">Auto-filled from selected vehicle. You can edit if needed.</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Current Location *
                </label>
                <textarea
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Describe your current location (address, landmarks, GPS coordinates, etc.)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Problem Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Describe the emergency situation, what assistance you need, and any relevant details..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Priority Level *
                </label>
                <select
                  value={formData.priorityLevel}
                  onChange={(e) => handleInputChange('priorityLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="High">High - Urgent assistance needed</option>
                  <option value="Critical">Critical - Life-threatening emergency</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedCustomer}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting SOS...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Submit SOS Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <CustomerSelectionPopup
        isOpen={isCustomerPopupOpen}
        onClose={() => setIsCustomerPopupOpen(false)}
        onSelectCustomer={handleCustomerSelect}
        customerType={formData.customerType}
      />
      
      <VehicleSelectionPopup
        isOpen={isVehiclePopupOpen}
        onClose={() => setIsVehiclePopupOpen(false)}
        onSelectVehicle={handleVehicleSelect}
        customerId={selectedCustomer?.customerId || ''}
      />
    </>
  );
};

export default SOSPopup;