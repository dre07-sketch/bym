// Insurance.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Car, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  X,
  Plus,
  Filter,
  Search,
  BarChart3,
  Users,
  Wrench,
  DollarSign,
  Building,
  ArrowRight,
  ArrowLeft,
  Save,
  Briefcase,
  Image as ImageIcon,
  Trash2,
  FileText
} from 'lucide-react';
import ConversionModal from '../pop up/ConversionModal';

interface ProformaItem {
  id: number;
  description: string;
  size?: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Proforma {
  id: number;
  proforma_number: string;
  proforma_date: string;
  customer_name: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_vat_number?: string;
  notes?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  status: 'Awaiting Send' | 'Sent' | 'Cancelled' | 'Accepted' | 'Rejected';
  items: ProformaItem[];
}

interface Analytics {
  totalProformas: number;
  convertedToTickets: number;
  conversionRate: number;
  pendingProformas: number;
  acceptedProformas: number;
  totalRevenue: number;
  averageValue: number;
  customerSatisfaction: number;
}

interface TicketForm {
  title: string;
  description: string;
  ticketType: 'insurance' | 'regular';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  urgencyLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface InsuranceForm {
  insuranceCompany: string;
  insurancePhone: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  accidentDate: string;
  description: string;
}

interface Vehicle {
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  image: File | null;
  imagePreview: string | null;
}

interface CarModel {
  model: string;
  serviceInterval: number;
}

function Insurance() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [filteredProformas, setFilteredProformas] = useState<Proforma[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalProformas: 0,
    convertedToTickets: 0,
    conversionRate: 0,
    pendingProformas: 0,
    acceptedProformas: 0,
    totalRevenue: 0,
    averageValue: 0,
    customerSatisfaction: 0
  });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [convertedProformas, setConvertedProformas] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form states
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    title: '',
    description: '',
    ticketType: 'insurance',
    priority: 'Medium',
    urgencyLevel: 'Medium'
  });
  
  const [insuranceForm, setInsuranceForm] = useState<InsuranceForm>({
    insuranceCompany: '',
    insurancePhone: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    accidentDate: '',
    description: ''
  });
  
  const [customerData, setCustomerData] = useState({
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
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      make: '',
      model: '',
      year: null,
      licensePlate: null,
      vin: null,
      color: null,
      mileage: null,
      image: null,
      imagePreview: null,
    },
  ]);
  const [customerImage, setCustomerImage] = useState<File | null>(null);
  const [customerImagePreview, setCustomerImagePreview] = useState<string | null>(null);
  const [carModelsByMake, setCarModelsByMake] = useState<Record<string, CarModel[]>>({});
  const [carMakes, setCarMakes] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // New states for API integration
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFetchingProforma, setIsFetchingProforma] = useState(false);
  
  // Function to refresh the converted proformas count
  const refreshConvertedCount = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/insurance/converted-proformas/count');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(prev => ({
          ...prev,
          acceptedProformas: data.convertedCount
        }));
      } else {
        console.error('Failed to refresh converted count:', data.message);
      }
    } catch (error) {
      console.error('Error refreshing converted count:', error);
    }
  };
  
  // Fetch accepted proformas from API
  useEffect(() => {
    const fetchAcceptedProformas = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Fetch the list of accepted proformas
        const listResponse = await fetch('https://ipasystem.bymsystem.com/api/insurance/proformas/accepted');
        const listData = await listResponse.json();
        
        // Fetch the count of converted proformas
        const countResponse = await fetch('https://ipasystem.bymsystem.com/api/insurance/converted-proformas/count');
        const countData = await countResponse.json();
        
        if (listData.success && countData.success) {
          // Transform API data to match Proforma interface
          const transformedProformas: Proforma[] = listData.data.map((item: any) => ({
            ...item,
            items: [] // API doesn't return items, so we initialize with empty array
          }));
          
          setProformas(transformedProformas);
          setFilteredProformas(transformedProformas);
          
          // Calculate analytics from API data
          const total = transformedProformas.length;
          const revenue = transformedProformas.reduce((sum, p) => sum + p.total, 0);
          const avgValue = total > 0 ? revenue / total : 0;
          
          setAnalytics({
            totalProformas: total,
            convertedToTickets: 0, // Will be updated when conversions happen
            conversionRate: 0,
            pendingProformas: 0, // Only accepted proformas are fetched
            acceptedProformas: countData.convertedCount, // Use the count from the API
            totalRevenue: revenue,
            averageValue: avgValue,
            customerSatisfaction: 92 // Default value
          });
        } else {
          setApiError(listData.message || countData.message || 'Failed to fetch proformas');
        }
      } catch (error) {
        console.error('Error fetching proformas:', error);
        setApiError('Network error or server unavailable');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAcceptedProformas();
    
    // Mock car models data
    setCarModelsByMake({
      'Toyota': [
        { model: 'Camry', serviceInterval: 10000 },
        { model: 'Corolla', serviceInterval: 10000 },
        { model: 'RAV4', serviceInterval: 10000 }
      ],
      'Honda': [
        { model: 'Civic', serviceInterval: 12000 },
        { model: 'Accord', serviceInterval: 12000 },
        { model: 'CR-V', serviceInterval: 12000 }
      ],
      'Ford': [
        { model: 'Focus', serviceInterval: 15000 },
        { model: 'Escape', serviceInterval: 15000 },
        { model: 'F-150', serviceInterval: 15000 }
      ]
    });
    setCarMakes(['Toyota', 'Honda', 'Ford']);
    setLoadingModels(false);
  }, []);
  
  // Filter and search functionality
  useEffect(() => {
    let filtered = proformas;
    if (searchTerm) {
      filtered = filtered.filter(proforma => 
        proforma.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proforma.proforma_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proforma.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proforma.items.some(item => item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredProformas(filtered);
  }, [proformas, searchTerm]);
  
  // Helper function to format items for description
  const formatItemsForDescription = (items: ProformaItem[]) => {
    if (!items || items.length === 0) return '';
    
    let result = 'SERVICE ITEMS FROM PROFORMA:\n\n';
    
    items.forEach((item, index) => {
      result += `${index + 1}. ${item.description}\n`;
      if (item.size) {
        result += `   Size: ${item.size}\n`;
      }
      result += `   Quantity: ${item.quantity}\n`;
      result += `   Unit Price: ${formatCurrency(item.unit_price)}\n`;
      result += `   Amount: ${formatCurrency(item.amount)}\n\n`;
    });
    
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    result += `TOTAL: ${formatCurrency(total)}`;
    
    return result;
  };
  
  const handleConvertToTicket = async (proforma: Proforma) => {
    setIsFetchingProforma(true);
    setApiError(null);
    
    try {
      // Fetch the full proforma details with items using proforma_number
      const response = await fetch(`https://ipasystem.bymsystem.com/api/insurance/proformas/${proforma.proforma_number}`);
      const data = await response.json();
      
      if (data.success) {
        const fullProforma = data.data;
        
        // Format the items for the description
        const formattedDescription = formatItemsForDescription(fullProforma.items);
        
        setSelectedProforma(fullProforma);
        setCurrentStep(1);
        
        // Reset forms with pre-populated description
        setTicketForm({
          title: `Service Ticket for ${fullProforma.customer_name}`,
          description: formattedDescription,
          ticketType: 'insurance',
          priority: 'Medium',
          urgencyLevel: 'Medium'
        });
        
        setInsuranceForm({
          insuranceCompany: '',
          insurancePhone: '',
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          accidentDate: '',
          description: ''
        });
        
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
        
        setVehicles([
          {
            make: '',
            model: '',
            year: null,
            licensePlate: null,
            vin: null,
            color: null,
            mileage: null,
            image: null,
            imagePreview: null,
          },
        ]);
        
        setCustomerImage(null);
        setCustomerImagePreview(null);
        setIsSubmitting(false);
        setError(null);
        setIsSuccess(false);
        
        setShowTicketModal(true);
      } else {
        setApiError(data.message || 'Failed to fetch proforma details');
      }
    } catch (error) {
      console.error('Error fetching proforma details:', error);
      setApiError('Network error or server unavailable');
    } finally {
      setIsFetchingProforma(false);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate simple form
      if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
        setError('Title and description are required');
        return;
      }
      setError(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate insurance form
      if (ticketForm.ticketType === 'insurance') {
        if (!insuranceForm.insuranceCompany.trim() || !insuranceForm.insurancePhone.trim() || 
            !insuranceForm.ownerName.trim() || !insuranceForm.ownerPhone.trim()) {
          setError('Please fill in all required insurance fields');
          return;
        }
      }
      setError(null);
      setCurrentStep(3);
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleTicketFormChange = (field: string, value: string) => {
    setTicketForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleInsuranceFormChange = (field: string, value: string) => {
    setInsuranceForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCustomerChange = (field: string, value: string) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleVehicleChange = (index: number, field: string, value: string) => {
    setVehicles((prev) =>
      prev.map((vehicle, i) =>
        i === index
          ? { 
              ...vehicle, 
              [field]: field === 'mileage' 
                ? (value.trim() === '' ? null : Number(value)) 
                : (value.trim() === '' ? null : value)
            }
          : vehicle
      )
    );
  };
  
  const handleCustomerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomerImage(file);
        setCustomerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeCustomerImage = () => {
    setCustomerImage(null);
    setCustomerImagePreview(null);
  };
  
  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicles((prev) =>
          prev.map((vehicle, i) =>
            i === index
              ? {
                  ...vehicle,
                  image: file,
                  imagePreview: reader.result as string,
                }
              : vehicle
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = (index: number) => {
    setVehicles((prev) =>
      prev.map((vehicle, i) =>
        i === index
          ? {
              ...vehicle,
              image: null,
              imagePreview: null,
            }
          : vehicle
      )
    );
  };
  
  const addVehicle = () => {
    setVehicles((prev) => [
      ...prev,
      {
        make: '',
        model: '',
        year: null,
        licensePlate: null,
        vin: null,
        color: null,
        mileage: null,
        image: null,
        imagePreview: null,
      },
    ]);
  };
  
  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles((prev) => prev.filter((_, i) => i !== index));
    }
  };
  
  const getModelsForMake = (make: string): CarModel[] => {
    return carModelsByMake[make] || [];
  };
  
  const resetForm = () => {
    setCurrentStep(1);
    setTicketForm({
      title: '',
      description: '',
      ticketType: 'insurance',
      priority: 'Medium',
      urgencyLevel: 'Medium'
    });
    setInsuranceForm({
      insuranceCompany: '',
      insurancePhone: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      accidentDate: '',
      description: ''
    });
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
    setVehicles([
      {
        make: '',
        model: '',
        year: null,
        licensePlate: null,
        vin: null,
        color: null,
        mileage: null,
        image: null,
        imagePreview: null,
      },
    ]);
    setCustomerImage(null);
    setCustomerImagePreview(null);
    setIsSubmitting(false);
    setError(null);
    setIsSuccess(false);
  };
  
  const handleClose = () => {
    resetForm();
    setShowTicketModal(false);
  };
  
  const handleGenerateTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate customer form
      if (!customerData.name.trim()) throw new Error('Name is required');
      if (!customerData.email.trim()) throw new Error('Email is required');
      if (!customerData.phone.trim()) throw new Error('Phone number is required');
      if (customerData.customerType === 'company' && !customerData.companyName.trim())
        throw new Error('Company name is required for business customers');
      if (vehicles.length === 0) throw new Error('At least one vehicle is required');
      if (vehicles.some((v) => !v.make.trim() || !v.model.trim()))
        throw new Error('Make and Model are required for all vehicles');
      
      // Simulate ticket creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to converted proformas
      if (selectedProforma) {
        setConvertedProformas(prev => new Set(Array.from(prev).concat(selectedProforma.id)));
        
        // Update analytics
        const newConverted = convertedProformas.size + 1;
        setAnalytics(prev => ({
          ...prev,
          convertedToTickets: newConverted,
          conversionRate: Math.round((newConverted / proformas.length) * 100)
        }));
        
        // Refresh the accepted proformas count from the API
        await refreshConvertedCount();
      }
      
      setIsSuccess(true);
      // Reset and close after 3 seconds
      setTimeout(() => {
        resetForm();
        setShowTicketModal(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ticket generation failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Awaiting Send': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'Rejected': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Insurance Service Management</h1>
                <p className="text-sm text-gray-600">Track and manage proformas & service tickets</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Dashboard */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Insurance Analytics Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proformas</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalProformas}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">+8% from last month</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Converted to Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.convertedToTickets}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Conversion rate: {analytics.conversionRate}%</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted Proformas</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.acceptedProformas}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Pending: {analytics.pendingProformas}</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Avg. value: {formatCurrency(analytics.averageValue)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search proformas, customers, or services..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Proformas List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Insurance Proformas ({filteredProformas.length})
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Loading proformas...</p>
            </div>
          ) : apiError ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-500 mb-4">{apiError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredProformas.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No proformas found</h3>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </div>
          ) : (
            filteredProformas.map((proforma) => (
              <div key={proforma.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full ${
                          proforma.status === 'Accepted' ? 'bg-green-500' :
                          proforma.status === 'Sent' ? 'bg-blue-500' :
                          proforma.status === 'Awaiting Send' ? 'bg-gray-500' :
                          proforma.status === 'Cancelled' ? 'bg-red-500' : 'bg-orange-500'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{proforma.customer_name}</h3>
                          <span className="text-sm text-gray-500">#{proforma.proforma_number}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(proforma.status)}`}>
                            {proforma.status}
                          </span>
                          {convertedProformas.has(proforma.id) && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full border bg-purple-100 text-purple-800 border-purple-200">
                              Converted to Ticket
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{proforma.company_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{proforma.company_phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Date: {new Date(proforma.proforma_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {proforma.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600"><span className="font-medium">Notes:</span> {proforma.notes}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <div className="space-x-4">
                            <span className="text-gray-500">Subtotal: {formatCurrency(proforma.subtotal)}</span>
                            <span className="text-gray-500">VAT ({proforma.vat_rate}%): {formatCurrency(proforma.vat_amount)}</span>
                          </div>
                          <span className="font-bold text-lg text-gray-900">Total: {formatCurrency(proforma.total)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          View
                        </button>
                        {!convertedProformas.has(proforma.id) && (
                          <button
                            onClick={() => handleConvertToTicket(proforma)}
                            disabled={isFetchingProforma}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                          >
                            {isFetchingProforma ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Generate Ticket
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Conversion Modal */}
      <ConversionModal
        showTicketModal={showTicketModal}
        selectedProforma={selectedProforma}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        ticketForm={ticketForm}
        setTicketForm={setTicketForm}
        insuranceForm={insuranceForm}
        setInsuranceForm={setInsuranceForm}
        customerData={customerData}
        setCustomerData={setCustomerData}
        vehicles={vehicles}
        setVehicles={setVehicles}
        customerImage={customerImage}
        setCustomerImage={setCustomerImage}
        customerImagePreview={customerImagePreview}
        setCustomerImagePreview={setCustomerImagePreview}
     //   carMakes={carMakes}
       // loadingModels={loadingModels}
        isSubmitting={isSubmitting}
        error={error}
        setError={setError}
        isSuccess={isSuccess}
        handleClose={handleClose}
        handleNextStep={handleNextStep}
        handlePreviousStep={handlePreviousStep}
        handleTicketFormChange={handleTicketFormChange}
        handleInsuranceFormChange={handleInsuranceFormChange}
        handleCustomerChange={handleCustomerChange}
        handleVehicleChange={handleVehicleChange}
        handleCustomerImageUpload={handleCustomerImageUpload}
        removeCustomerImage={removeCustomerImage}
        handleImageUpload={handleImageUpload}
        removeImage={removeImage}
        addVehicle={addVehicle}
        removeVehicle={removeVehicle}
     //   getModelsForMake={getModelsForMake}
     //   handleGenerateTicket={handleGenerateTicket}
        formatCurrency={formatCurrency}
     //   isLoadingProforma={isFetchingProforma}
      />
    </div>
  );
}

export default Insurance;