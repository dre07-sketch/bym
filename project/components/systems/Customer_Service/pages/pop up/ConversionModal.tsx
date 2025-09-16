import React, { useState, useEffect } from 'react';
import { 
  FileText, X, ArrowRight, ArrowLeft, Save, Plus, Trash2, ImageIcon, User, Mail, Phone, MapPin, Briefcase, Car, Building, CheckCircle, Search, Receipt
} from 'lucide-react';
// Add these interfaces at the top of your file
interface ProformaItem {
  id: number;
  description: string;
  size?: string;
  quantity: number;
  unit_price: number;
  amount: number;
}
interface Proforma {
  proforma_number: string;
  customer_name: string;
  company_name: string;
  proforma_date: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  items: ProformaItem[];
}
interface ConversionModalProps {
  showTicketModal: boolean;
  selectedProforma: any; // Replace with proper type if available
  currentStep: number;
  setCurrentStep: (step: number) => void;
  ticketForm: {
    title: string;
    description: string;
    ticketType: string;
    priority: string;
    urgencyLevel: string;
  };
  setTicketForm: (form: any) => void; // Replace with proper type if available
  insuranceForm: {
    insuranceCompany: string;
    insurancePhone: string;
    accidentDate: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    description: string;
  };
  setInsuranceForm: (form: any) => void; // Replace with proper type if available
  customerData: {
    customerType: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    emergencyContact: string;
    notes: string;
    companyName: string;
    registrationDate: string;
    totalServices: number;
  };
  setCustomerData: (data: any) => void; // Replace with proper type if available
  vehicles: Array<{
    make: string;
    model: string;
    year: number | null;
    licensePlate: string | null;
    vin: string | null;
    color: string | null;
    mileage: number | null;
    image: File | null;
    imagePreview: string | null;
  }>;
  setVehicles: (vehicles: any) => void; // Replace with proper type if available
  customerImage: File | null;
  setCustomerImage: (image: File | null) => void;
  customerImagePreview: string | null;
  setCustomerImagePreview: (preview: string | null) => void;
  carModelsByMake: Record<string, Array<{ model: string; serviceInterval: number }>>;
  carMakes: string[];
  loadingModels: boolean;
  isSubmitting: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  isSuccess: boolean;
  handleClose: () => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  handleTicketFormChange: (field: string, value: string) => void;
  handleInsuranceFormChange: (field: string, value: string) => void;
  handleCustomerChange: (field: string, value: string) => void;
  handleVehicleChange: (index: number, field: string, value: string) => void;
  handleCustomerImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeCustomerImage: () => void;
  handleImageUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  addVehicle: () => void;
  removeVehicle: (index: number) => void;
  getModelsForMake: (make: string) => Array<{ model: string; serviceInterval: number }>;
  formatCurrency: (amount: number) => string;
}
const ConversionModal: React.FC<ConversionModalProps> = ({
  showTicketModal,
  selectedProforma,
  currentStep,
  setCurrentStep,
  ticketForm,
  setTicketForm,
  insuranceForm,
  setInsuranceForm,
  customerData,
  setCustomerData,
  vehicles,
  setVehicles,
  customerImage,
  setCustomerImage,
  customerImagePreview,
  setCustomerImagePreview,
  carModelsByMake,
  carMakes,
  loadingModels,
  isSubmitting,
  error,
  setError,
  isSuccess,
  handleClose,
  handleNextStep,
  handlePreviousStep,
  handleTicketFormChange,
  handleInsuranceFormChange,
  handleCustomerChange,
  handleVehicleChange,
  handleCustomerImageUpload,
  removeCustomerImage,
  handleImageUpload,
  removeImage,
  addVehicle,
  removeVehicle,
  getModelsForMake,
  formatCurrency
}) => {
  // Local state for submitting and success status
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [localIsSuccess, setLocalIsSuccess] = useState(false);
  const getStepLabel = () => {
    switch (currentStep) {
      case 1: return 'Simple Form';
      case 2: return 'Insurance Information';
      case 3: return 'Customer Information';
      default: return '';
    }
  };
  
  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // New state for fetching proforma details
  const [fullProforma, setFullProforma] = useState<Proforma | null>(null);
  const [isLoadingProformaDetails, setIsLoadingProformaDetails] = useState(false);
  
  // Mock customer data
  const mockCustomers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+251-91-123-4567',
      address: '123 Main St, Addis Ababa',
      customerType: 'individual',
      companyName: '',
      vehicles: [
        { id: 1, make: 'Toyota', model: 'Camry', year: '2020', licensePlate: 'AA-123-456', vin: '1234567890', color: 'Silver', mileage: '45000' },
        { id: 2, make: 'Honda', model: 'CR-V', year: '2019', licensePlate: 'AA-789-012', vin: '9876543210', color: 'Blue', mileage: '32000' }
      ]
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      phone: '+251-91-987-6543',
      address: '456 Business Ave, Addis Ababa',
      customerType: 'company',
      companyName: 'ABC Enterprises',
      vehicles: [
        { id: 3, make: 'Ford', model: 'Ranger', year: '2021', licensePlate: 'AA-345-678', vin: '1122334455', color: 'Black', mileage: '15000' }
      ]
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike@example.com',
      phone: '+251-91-555-0123',
      address: '789 Residential Rd, Addis Ababa',
      customerType: 'individual',
      companyName: '',
      vehicles: [
        { id: 4, make: 'Nissan', model: 'Patrol', year: '2018', licensePlate: 'AA-901-234', vin: '5566778899', color: 'White', mileage: '67000' },
        { id: 5, make: 'Toyota', model: 'Hilux', year: '2022', licensePlate: 'AA-567-890', vin: '2468135790', color: 'Gray', mileage: '8000' }
      ]
    }
  ];
  
  // Fetch proforma details when modal opens
  useEffect(() => {
    if (showTicketModal && selectedProforma) {
      const fetchProformaDetails = async () => {
        setIsLoadingProformaDetails(true);
        try {
          const response = await fetch(`http://localhost:5001/api/insurance/proformas/${selectedProforma.proforma_number}`);
          const data = await response.json();
          
          if (data.success) {
            setFullProforma(data.data);
            
            // Format the items for the description
            const formattedDescription = formatItemsForDescription(data.data.items);
            
            // Update the ticket form description
            setTicketForm((prev: any) => ({
              ...prev,
              description: formattedDescription
            }));
          } else {
            setError(data.message || 'Failed to fetch proforma details');
          }
        } catch (error) {
          console.error('Error fetching proforma details:', error);
          setError('Network error or server unavailable');
        } finally {
          setIsLoadingProformaDetails(false);
        }
      };
      
      fetchProformaDetails();
    } else {
      // Reset when modal closes
      setFullProforma(null);
    }
  }, [showTicketModal, selectedProforma, setTicketForm, setError]);
  
  // Helper function to format items for description
  const formatItemsForDescription = (items: ProformaItem[]) => {
    if (!items || items.length === 0) return '';
    
    let result = 'SERVICE ITEMS:\n\n';
    
    items.forEach((item, index) => {
      result += `${index + 1}. ${item.description}`;
      
      // Add size if available
      if (item.size) {
        result += ` (${item.size})`;
      }
      
      // Add quantity
      result += ` - Qty: ${item.quantity}\n`;
    });
    
    return result;
  };
  
  // Handle customer search
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      const results = mockCustomers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phone.includes(customerSearchTerm)
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [customerSearchTerm]);
  
  // Handle customer selection
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerData({
      ...customerData,
      customerType: customer.customerType,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      companyName: customer.companyName || '',
    });
    
    // Reset vehicle selection
    setSelectedVehicle(null);
    setShowVehicleSelection(true);
  };
  
  // Handle vehicle selection
  const handleSelectVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicles([{
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      color: vehicle.color,
      mileage: vehicle.mileage,
      image: null,
      imagePreview: null,
    }]);
  };
  
  // Reset customer selection
  const handleResetCustomer = () => {
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setShowVehicleSelection(false);
    setCustomerSearchTerm('');
    setSearchResults([]);
    
    // Reset customer form
    setCustomerData({
      customerType: 'individual',
      name: '',
      email: '',
      phone: '',
      address: '',
      emergencyContact: '',
      notes: '',
      companyName: '',
      registrationDate: new Date().toISOString().split('T')[0],
      totalServices: 0,
    });
    
    // Reset vehicles
    setVehicles([{
      make: '',
      model: '',
      year: null,
      licensePlate: null,
      vin: null,
      color: null,
      mileage: null,
      image: null,
      imagePreview: null,
    }]);
  };
  
  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  // Updated handleGenerateTicket function
  const handleGenerateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localIsSubmitting) return;
    setLocalIsSubmitting(true);
    setError(null);
    try {
      // Generate customer_id if not exists
      const customerId = selectedCustomer 
        ? selectedCustomer.id.toString() 
        : Date.now().toString();
      // Convert images to base64 if they exist
      let customerImageBase64 = null;
      if (customerImage) {
        customerImageBase64 = await fileToBase64(customerImage);
      }
      // Get the first vehicle
      const vehicle = vehicles[0];
      let vehicleImageBase64 = null;
      if (vehicle.image) {
        vehicleImageBase64 = await fileToBase64(vehicle.image);
      }
      // Prepare vehicle info
      const vehicleInfo = {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        color: vehicle.color,
        mileage: vehicle.mileage,
        image: vehicleImageBase64
      };
      // Prepare the request body
      const requestBody: any = {
        customer_type: customerData.customerType,
        customer_id: customerId,
        customer_name: customerData.customerType === 'company' 
          ? customerData.companyName 
          : customerData.name,
        vehicle_info: vehicleInfo,
        license_plate: vehicle.licensePlate,
        title: ticketForm.title,
        description: ticketForm.description,
        priority: ticketForm.priority,
        type: ticketForm.ticketType,
        urgency_level: ticketForm.urgencyLevel,
        proforma_id: selectedProforma.id // Add proforma ID for bill creation
      };
      // If insurance ticket, add insurance details
      if (ticketForm.ticketType === 'insurance') {
        requestBody.insurance_company = insuranceForm.insuranceCompany;
        requestBody.insurance_phone = insuranceForm.insurancePhone;
        requestBody.accident_date = insuranceForm.accidentDate;
        requestBody.owner_name = insuranceForm.ownerName;
        requestBody.owner_phone = insuranceForm.ownerPhone;
        requestBody.owner_email = insuranceForm.ownerEmail;
        requestBody.insurance_description = insuranceForm.description;
      }
      // Add customer specific fields
      if (customerData.customerType === 'company') {
        requestBody.company_name = customerData.companyName;
        requestBody.contact_person_name = customerData.name;
        requestBody.company_email = customerData.email;
        requestBody.company_phone = customerData.phone;
        requestBody.emergency_contact = customerData.emergencyContact;
        requestBody.company_address = customerData.address;
        requestBody.company_notes = customerData.notes;
        requestBody.company_image = customerImageBase64;
      } else {
        requestBody.individual_name = customerData.name;
        requestBody.individual_email = customerData.email;
        requestBody.individual_phone = customerData.phone;
        requestBody.individual_emergency_contact = customerData.emergencyContact;
        requestBody.individual_address = customerData.address;
        requestBody.individual_notes = customerData.notes;
        requestBody.individual_image = customerImageBase64;
      }
      // Send the request
      const response = await fetch('http://localhost:5001/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }
      // Success
      setLocalIsSuccess(true);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'An error occurred while creating the ticket');
    } finally {
      setLocalIsSubmitting(false);
    }
  };
  
  if (!showTicketModal || !selectedProforma) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Generate Service Ticket</h3>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of 3 - {getStepLabel()}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={localIsSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Simple Form</span>
              <span>Insurance</span>
              <span>Customer</span>
            </div>
            
            {/* Items loaded indicator */}
            {fullProforma && fullProforma.items && fullProforma.items.length > 0 && (
              <div className="mt-3 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {fullProforma.items.length} service items loaded
                </span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {localIsSuccess ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Service Ticket Generated Successfully!</h3>
              <p className="text-sm text-gray-500 mb-2">
                Proforma #{selectedProforma.proforma_number} has been converted to a service ticket.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                A bill has been automatically created from the proforma details.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : isLoadingProformaDetails ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Proforma Details</h3>
              <p className="text-gray-500">Please wait while we fetch the proforma information...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Simple Form */}
              {currentStep === 1 && (
                <div className="space-y-4 text-black">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={ticketForm.title}
                      onChange={(e) => handleTicketFormChange('title', e.target.value)}
                      placeholder="Enter ticket title"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <div className="relative">
                      <textarea
                        rows={12}
                        className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-gray-50 whitespace-pre"
                        value={ticketForm.description}
                        onChange={(e) => handleTicketFormChange('description', e.target.value)}
                        placeholder="Enter detailed description of the service requirements"
                      />
                      <div className="absolute top-2 right-2 ">
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Auto-populated from proforma
                        </div>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      The description has been automatically populated with the proforma items. You can edit it as needed.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Ticket Type</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        value={ticketForm.ticketType}
                        onChange={(e) => handleTicketFormChange('ticketType', e.target.value)}
                      >
                        <option value="insurance">Insurance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        value={ticketForm.priority}
                        onChange={(e) => handleTicketFormChange('priority', e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        value={ticketForm.urgencyLevel}
                        onChange={(e) => handleTicketFormChange('urgencyLevel', e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Proforma Details Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Proforma Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600"><strong>Customer:</strong> {selectedProforma.customer_name}</p>
                        <p className="text-sm text-gray-600"><strong>Company:</strong> {selectedProforma.company_name}</p>
                        <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(selectedProforma.proforma_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600"><strong>Subtotal:</strong> {formatCurrency(selectedProforma.subtotal)}</p>
                        <p className="text-sm text-gray-600"><strong>VAT ({selectedProforma.vat_rate}%):</strong> {formatCurrency(selectedProforma.vat_amount)}</p>
                        <p className="text-sm text-gray-600"><strong>Total:</strong> {formatCurrency(selectedProforma.total)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Service Items:</h5>
                      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                        {fullProforma && fullProforma.items && fullProforma.items.length > 0 ? (
                          fullProforma.items.map((item: ProformaItem, index: number) => (
                            <div key={item.id} className="p-3 flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900">{item.description}</div>
                                {item.size && <div className="text-sm text-gray-500">Size: {item.size}</div>}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">{item.quantity} × {formatCurrency(item.unit_price)}</div>
                                <div className="font-medium">{formatCurrency(item.amount)}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500">No items found</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bill Information Section */}
                    {fullProforma && (
                      <div className="mt-6">
                        <div className="flex items-center mb-3">
                          <Receipt className="w-5 h-5 mr-2 text-green-600" />
                          <h5 className="font-medium text-gray-900">Bill Information (to be created)</h5>
                        </div>
                        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600"><strong>Bill Number:</strong> Auto-generated</p>
                              <p className="text-sm text-gray-600"><strong>Customer:</strong> {selectedProforma.customer_name}</p>
                              <p className="text-sm text-gray-600"><strong>Vehicle:</strong> To be assigned</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600"><strong>Subtotal:</strong> {formatCurrency(fullProforma.subtotal)}</p>
                              <p className="text-sm text-gray-600"><strong>VAT ({fullProforma.vat_rate}%):</strong> {formatCurrency(fullProforma.vat_amount)}</p>
                              <p className="text-sm text-gray-600"><strong>Total:</strong> {formatCurrency(fullProforma.total)}</p>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-green-700 bg-green-100 p-2 rounded">
                            A bill will be automatically created from this proforma when the ticket is generated.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 2: Insurance Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      Insurance Company Information
                    </h4>
                    
                    {ticketForm.ticketType === 'insurance' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2">Insurance Company *</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={insuranceForm.insuranceCompany}
                            onChange={(e) => handleInsuranceFormChange('insuranceCompany', e.target.value)}
                            placeholder="Enter insurance company name"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2">Insurance Phone *</label>
                          <input
                            type="tel"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={insuranceForm.insurancePhone}
                            onChange={(e) => handleInsuranceFormChange('insurancePhone', e.target.value)}
                            placeholder="Enter insurance phone number"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2">Accident Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={insuranceForm.accidentDate}
                            onChange={(e) => handleInsuranceFormChange('accidentDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2">Vehicle Owner Name *</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={insuranceForm.ownerName}
                            onChange={(e) => handleInsuranceFormChange('ownerName', e.target.value)}
                            placeholder="Enter vehicle owner name"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2">Vehicle Owner Phone *</label>
                          <input
                            type="tel"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={insuranceForm.ownerPhone}
                            onChange={(e) => handleInsuranceFormChange('ownerPhone', e.target.value)}
                            placeholder="Enter vehicle owner phone"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2">Vehicle Owner Email</label>
                          <input
                            type="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={insuranceForm.ownerEmail}
                            onChange={(e) => handleInsuranceFormChange('ownerEmail', e.target.value)}
                            placeholder="Enter vehicle owner email"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={insuranceForm.description}
                            onChange={(e) => handleInsuranceFormChange('description', e.target.value)}
                            placeholder="Describe the incident and required services"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600">This is a regular ticket. Insurance information is not required.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 3: Customer Information */}
              {currentStep === 3 && (
                <form onSubmit={handleGenerateTicket} className="space-y-8 text-black">
                  {/* Customer Search */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Customer Information
                    </h4>
                    
                    {/* Customer Search Bar */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 mb-2">Search Existing Customer</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Search by name, email, or phone..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      {/* Search Results */}
                      {isSearching ? (
                        <div className="mt-2 text-center text-gray-500 py-2">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
                          {searchResults.map(customer => (
                            <div 
                              key={customer.id} 
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-gray-500">{customer.email} • {customer.phone}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : customerSearchTerm ? (
                        <div className="mt-2 text-center text-gray-500 py-2">No customers found</div>
                      ) : null}
                    </div>
                    
                    {/* Selected Customer Info */}
                    {selectedCustomer && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900 flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              {selectedCustomer.name}
                            </h5>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>{selectedCustomer.email}</p>
                              <p>{selectedCustomer.phone}</p>
                              <p>{selectedCustomer.address}</p>
                              {selectedCustomer.customerType === 'company' && (
                                <p className="font-medium">{selectedCustomer.companyName}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetCustomer}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Customer Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-2">
                          Customer Type *
                        </label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              className="form-radio h-4 w-4 text-blue-600"
                              checked={customerData.customerType === 'individual'}
                              onChange={() => handleCustomerChange('customerType', 'individual')}
                              disabled={localIsSubmitting || !!selectedCustomer}
                            />
                            <span className="ml-2 text-gray-700">Individual</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              className="form-radio h-4 w-4 text-blue-600"
                              checked={customerData.customerType === 'company'}
                              onChange={() => handleCustomerChange('customerType', 'company')}
                              disabled={localIsSubmitting || !!selectedCustomer}
                            />
                            <span className="ml-2 text-gray-700">Company</span>
                          </label>
                        </div>
                      </div>
                      
                      {customerData.customerType === 'company' && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            Company Name *
                          </label>
                          <input
                            type="text"
                            value={customerData.companyName}
                            onChange={(e) => handleCustomerChange('companyName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter company name"
                            required
                            disabled={localIsSubmitting || !!selectedCustomer}
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2">
                          {customerData.customerType === 'company' ? 'Contact Person Name *' : 'Full Name *'}
                        </label>
                        <input
                          type="text"
                          value={customerData.name}
                          onChange={(e) => handleCustomerChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter name"
                          required
                          disabled={localIsSubmitting || !!selectedCustomer}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={customerData.email}
                          onChange={(e) => handleCustomerChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email"
                          required
                          disabled={localIsSubmitting || !!selectedCustomer}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={customerData.phone}
                          onChange={(e) => handleCustomerChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter phone number"
                          required
                          disabled={localIsSubmitting || !!selectedCustomer}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2">
                          Emergency Contact
                        </label>
                        <input
                          type="tel"
                          value={customerData.emergencyContact}
                          onChange={(e) => handleCustomerChange('emergencyContact', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Emergency contact number"
                          disabled={localIsSubmitting || !!selectedCustomer}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Address
                        </label>
                        <input
                          type="text"
                          value={customerData.address}
                          onChange={(e) => handleCustomerChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter full address"
                          disabled={localIsSubmitting || !!selectedCustomer}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Information */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Car className="w-5 h-5 mr-2" />
                        Vehicle Information
                      </h4>
                      <button
                        type="button"
                        onClick={addVehicle}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                        disabled={localIsSubmitting || loadingModels}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Vehicle
                      </button>
                    </div>
                    
                    {/* Vehicle Selection for Existing Customer */}
                    {selectedCustomer && selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Select Existing Vehicle</h5>
                          <button
                            type="button"
                            onClick={() => setShowVehicleSelection(!showVehicleSelection)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {showVehicleSelection ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        
                        {showVehicleSelection && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedCustomer.vehicles.map((vehicle: any) => (
                              <div 
                                key={vehicle.id} 
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedVehicle?.id === vehicle.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                                onClick={() => handleSelectVehicle(vehicle)}
                              >
                                <div className="flex justify-between">
                                  <div>
                                    <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                                    <div className="text-sm text-gray-500">{vehicle.year} • {vehicle.licensePlate}</div>
                                  </div>
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Car className="w-4 h-4 text-blue-600" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {loadingModels ? (
                      <p className="text-center text-black">Loading car models...</p>
                    ) : (
                      vehicles.map((vehicle, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">Vehicle {index + 1}</h5>
                            {vehicles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVehicle(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                                disabled={localIsSubmitting}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
                            {/* Make Dropdown */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Make *</label>
                              <select
                                value={vehicle.make}
                                onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={localIsSubmitting || carMakes.length === 0}
                              >
                                <option value="">Select Make</option>
                                {carMakes.map((make: string) => (
                                  <option key={make} value={make}>
                                    {make}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Model Dropdown */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Model *</label>
                              <select
                                value={vehicle.model}
                                onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={localIsSubmitting || !getModelsForMake(vehicle.make).length}
                              >
                                <option value="">{vehicle.make ? 'Select Model' : 'Select Make First'}</option>
                                {getModelsForMake(vehicle.make).map((modelObj: { model: string; serviceInterval: number }) => (
                                  <option key={modelObj.model} value={modelObj.model}>
                                    {modelObj.model} ({modelObj.serviceInterval} km)
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Year</label>
                              <input
                                type="number"
                                value={vehicle.year || ''}
                                onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="2020"
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                disabled={localIsSubmitting}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">License Plate</label>
                              <input
                                type="text"
                                value={vehicle.licensePlate || ''}
                                onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ABC-123"
                                disabled={localIsSubmitting}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Color</label>
                              <input
                                type="text"
                                value={vehicle.color || ''}
                                onChange={(e) => handleVehicleChange(index, 'color', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Silver"
                                disabled={localIsSubmitting}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Current Mileage</label>
                              <input
                                type="number"
                                value={vehicle.mileage || ''}
                                onChange={(e) => handleVehicleChange(index, 'mileage', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="50000"
                                min="0"
                                disabled={localIsSubmitting}
                              />
                            </div>
                            
                            <div className="md:col-span-3">
                              <label className="text-sm font-medium text-gray-700 mb-1">
                                VIN (Vehicle Identification Number)
                              </label>
                              <input
                                type="text"
                                value={vehicle.vin || ''}
                                onChange={(e) => handleVehicleChange(index, 'vin', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1HGBH41JXMN109186"
                                maxLength={17}
                                disabled={localIsSubmitting}
                              />
                            </div>
                            
                            <div className="md:col-span-3">
                              <label className="text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
                              <div className="flex items-center space-x-4">
                                {vehicle.imagePreview ? (
                                  <div className="relative">
                                    <img
                                      src={vehicle.imagePreview}
                                      alt="Vehicle preview"
                                      className="h-24 w-24 object-cover rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                      disabled={localIsSubmitting}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <label className="cursor-pointer">
                                    <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center transition-colors">
                                      <Plus className="w-4 h-4 mr-1" />
                                      {vehicle.imagePreview ? 'Change Image' : 'Upload Image'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(index, e)}
                                      className="hidden"
                                      disabled={localIsSubmitting}
                                    />
                                  </label>
                                  <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 5MB)</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </form>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                      disabled={localIsSubmitting}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={localIsSubmitting}
                  >
                    Cancel
                  </button>
                  
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={handleGenerateTicket}
                      disabled={localIsSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {localIsSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Generate Ticket
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default ConversionModal;