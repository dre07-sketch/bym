import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Archive, Eye, Download, 
  Phone, Mail, MapPin, Car, ImageIcon, Trash2, CheckCircle, Award, UserCheck, UserX, Clock, Shield, RefreshCw
} from 'lucide-react';
import Modal from '../../../../ui/Modal';
import { Badge } from '../../../../ui/badge';
import AddCustomerModal from '../pop up/AddCustomerModal';
import EditCustomerModal from '../pop up/EditCustomerModal';

// === Constants ===
const BASE_URLS = [
  'https://ipasystem.bymsystem.com',
  'https://ipamanager.bymsystem.com',
];

// Function to safely encode path
const encode = (path: string) => encodeURIComponent(path).replace(/%2F/g, '/');

// Return all possible URLs for the image
const getImageUrls = (path: string | null | undefined) => {
  if (!path) return [];
  // If path already includes a full URL, just return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return [path];
  }
  // Otherwise, construct URLs from all base URLs
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return BASE_URLS.map(base => `${base}/${cleanPath}`);
};

// === Interfaces ===
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  current_mileage: number;
  vehicleImages: string[]; // Changed from imageUrl to vehicleImages array
}

interface Customer {
  customerId: string;
  readableCustomerId: string;
  customerType: 'individual' | 'company';
  name: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  notes: string;
  companyName: string | null;
  registrationDate: string;
  totalServices: number;
  gstNumber?: string;
  vehicles: Vehicle[];
  status?: 'pending' | 'active' | 'blocked' | 'deactivated';
  customerImages: string[]; // Changed from customerImage to customerImages array
  loyaltyPoints?: number;
}

interface VehicleForm {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  current_mileage: string;
  vin: string;
  image: File | null;
  imagePreview: string | null;
  serviceInterval?: number;
}

// Define interface for API response
interface AddVehicleResponse {
  success?: boolean;
  message?: string;
  newVehicles?: Vehicle[];
  imageUrls?: string[];
}

type CustomerTypeFilter = 'all' | 'individual' | 'company';
type StatusFilter = 'all' | 'pending' | 'active' | 'blocked' | 'deactivated';

// FIXED CustomerListImage component - now properly handles multiple URLs like other components
const CustomerListImage = ({ 
  srcs, 
  alt, 
  className 
}: { 
  srcs?: string[]; 
  alt: string; 
  className?: string;
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Process the srcs array to get full URLs
  const urls = React.useMemo(() => {
    if (!srcs || srcs.length === 0) return [];
    // For each path in srcs, get all possible URLs
    const allUrls: string[] = [];
    srcs.forEach(path => {
      if (path) {
        const urlsForPath = getImageUrls(path);
        allUrls.push(...urlsForPath);
      }
    });
    return allUrls;
  }, [srcs]);
  
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (!urls || urls.length === 0) {
      setImgSrc(null);
      setHasError(true);
      setIsLoading(false);
      return;
    }
    // Try the first URL first
    setCurrentUrlIndex(0);
    setImgSrc(urls[0]);
    setHasError(false);
    setIsLoading(true);
    // Set a timeout to prevent infinite loading
    const id = setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 5000); // Reduced timeout to 5 seconds
    setTimeoutId(id);
    return () => {
      if (id) clearTimeout(id);
    };
  }, [urls]);
  
  const handleError = () => {
    // Clear the timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    // Try the next URL in the array
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
      setImgSrc(urls[currentUrlIndex + 1]);
      // Set a new timeout for the next URL
      const id = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
      }, 5000); // Reduced timeout to 5 seconds
      setTimeoutId(id);
    } else {
      // No more URLs to try
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  const handleLoad = () => {
    // Clear the timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsLoading(false);
  };
  
  if (hasError || !imgSrc) {
    return (
      <div className={`${className} bg-gray-200 rounded-full flex items-center justify-center border`}>
        <span className="text-xl">👤</span>
      </div>
    );
  }
  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-200 rounded-full flex items-center justify-center border absolute`}>
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

// Keep your existing SafeImage and SafeVehicleImage components as they are
const SafeImage = ({ 
  srcs, // Array of URLs
  alt, 
  className, 
  fallbackIcon = '👤',
  size = 'medium' 
}: { 
  srcs?: string[]; // Array of URLs
  alt: string; 
  className?: string;
  fallbackIcon?: string;
  size?: 'small' | 'medium' | 'large';
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Process the srcs array to get full URLs
  const urls = React.useMemo(() => {
    if (!srcs || srcs.length === 0) return [];
    // For each path in srcs, get all possible URLs
    const allUrls: string[] = [];
    srcs.forEach(path => {
      if (path) {
        const urlsForPath = getImageUrls(path);
        allUrls.push(...urlsForPath);
      }
    });
    return allUrls;
  }, [srcs]);
  
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (!urls || urls.length === 0) {
      setImgSrc(null);
      setHasError(false);
      setIsLoading(false);
      return;
    }
    // Try the first URL first
    setCurrentUrlIndex(0);
    setImgSrc(urls[0]);
    setHasError(false);
    setIsLoading(true);
    // Set a timeout to prevent infinite loading
    const id = setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 5000); // Reduced timeout to 5 seconds
    setTimeoutId(id);
    return () => {
      if (id) clearTimeout(id);
    };
  }, [urls]);
  
  const handleError = () => {
    // Clear the timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    // Try the next URL in the array
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
      setImgSrc(urls[currentUrlIndex + 1]);
      // Set a new timeout for the next URL
      const id = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
      }, 5000); // Reduced timeout to 5 seconds
      setTimeoutId(id);
    } else {
      // No more URLs to try
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  const handleLoad = () => {
    // Clear the timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsLoading(false);
  };
  
  // Determine placeholder size based on size prop
  const getPlaceholderSize = () => {
    switch (size) {
      case 'small': return 'w-10 h-10';
      case 'large': return 'w-32 h-32';
      default: return 'w-24 h-24';
    }
  };
  
  // Determine placeholder text size based on size prop
  const getPlaceholderTextSize = () => {
    switch (size) {
      case 'small': return 'text-xl';
      case 'large': return 'text-4xl';
      default: return 'text-2xl';
    }
  };
  
  if (hasError || !imgSrc) {
    return (
      <div className={`${className} ${getPlaceholderSize()} bg-gray-200 rounded-full flex items-center justify-center border`}>
        <span className={getPlaceholderTextSize()}>{fallbackIcon}</span>
      </div>
    );
  }
  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} ${getPlaceholderSize()} bg-gray-200 rounded-full flex items-center justify-center border absolute`}>
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

const SafeVehicleImage = ({ 
  srcs, // Array of URLs
  alt, 
  className 
}: { 
  srcs?: string[]; // Array of URLs
  alt: string; 
  className?: string;
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Process the srcs array to get full URLs
  const urls = React.useMemo(() => {
    if (!srcs || srcs.length === 0) return [];
    // For each path in srcs, get all possible URLs
    const allUrls: string[] = [];
    srcs.forEach(path => {
      if (path) {
        const urlsForPath = getImageUrls(path);
        allUrls.push(...urlsForPath);
      }
    });
    return allUrls;
  }, [srcs]);
  
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (!urls || urls.length === 0) {
      setImgSrc(null);
      setHasError(false);
      setIsLoading(false);
      return;
    }
    // Try the first URL first
    setCurrentUrlIndex(0);
    setImgSrc(urls[0]);
    setHasError(false);
    setIsLoading(true);
    // Set a timeout to prevent infinite loading
    const id = setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 5000); // Reduced timeout to 5 seconds
    setTimeoutId(id);
    return () => {
      if (id) clearTimeout(id);
    };
  }, [urls]);
  
  const handleError = () => {
    // Clear the timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    // Try the next URL in the array
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
      setImgSrc(urls[currentUrlIndex + 1]);
      // Set a new timeout for the next URL
      const id = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
      }, 5000); // Reduced timeout to 5 seconds
      setTimeoutId(id);
    } else {
      // No more URLs to try
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  const handleLoad = () => {
    // Clear the timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsLoading(false);
  };
  
  if (hasError || !imgSrc) {
    return (
      <div className={`${className} bg-gray-200 rounded-lg flex items-center justify-center border-dashed border-2 border-gray-400`}>
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
          <span className="text-gray-500 text-sm">No Image</span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-200 rounded-lg flex items-center justify-center border-dashed border-2 border-gray-400 absolute`}>
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // Added success state
  const [vehicles, setVehicles] = useState<VehicleForm[]>([
    {
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      color: '',
      current_mileage: '',
      vin: '',
      image: null,
      imagePreview: null,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Car models state
  const [carMakes, setCarMakes] = useState<string[]>([]);
  const [carModelsByMake, setCarModelsByMake] = useState<Record<string, { model: string; serviceInterval: number }[]>>({});
  const [loadingModels, setLoadingModels] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

// Add this handler function
const handleEditCustomer = (customer: Customer) => {
  setEditingCustomer(customer);
  setIsEditModalOpen(true);
};

// Add this function to handle saving the edited customer
const handleSaveCustomer = (updatedCustomer: Customer) => {
  setCustomers(prevCustomers =>
    prevCustomers.map(customer =>
      customer.customerId === updatedCustomer.customerId ? updatedCustomer : customer
    )
  );
  
  // If the customer being viewed is the one being edited, update that too
  if (selectedCustomer && selectedCustomer.customerId === updatedCustomer.customerId) {
    setSelectedCustomer(updatedCustomer);
  }
};

  
  // Helper function to check if vehicles were added
  const checkIfVehiclesAdded = async (selectedCustomer: Customer): Promise<boolean> => {
    try {
      const customerResponse = await fetch(`${BASE_URLS[0]}/api/customers/fetch`);
      if (customerResponse.ok) {
        const updatedCustomers = await customerResponse.json();
        const updatedCustomer = updatedCustomers.find((c: Customer) => c.customerId === selectedCustomer.customerId);
        
        if (updatedCustomer) {
          // Check if the number of vehicles has increased
          return updatedCustomer.vehicles.length > selectedCustomer.vehicles.length;
        }
      }
    } catch (fetchError) {
      console.error('Error checking if vehicles were added:', fetchError);
    }
    return false;
  };
  
  // Helper function to refresh customer data
  const refreshCustomerData = async (selectedCustomer: Customer, setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>, setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>) => {
    try {
      const customerResponse = await fetch(`${BASE_URLS[0]}/api/customers/fetch`);
      if (customerResponse.ok) {
        const updatedCustomers = await customerResponse.json();
        const updatedCustomer = updatedCustomers.find((c: Customer) => c.customerId === selectedCustomer.customerId);
        
        if (updatedCustomer) {
          // Update the state with the new customer data
          setCustomers((prev) =>
            prev.map((c) =>
              c.customerId === selectedCustomer.customerId ? updatedCustomer : c
            )
          );
          
          setSelectedCustomer(updatedCustomer);
        }
      }
    } catch (fetchError) {
      console.error('Error refreshing customer data:', fetchError);
    }
  };
  
  // Helper function to update vehicles state
  const updateVehiclesState = async (
    result: AddVehicleResponse,
    selectedCustomer: Customer,
    vehicles: VehicleForm[],
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>,
    setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>
  ) => {
    const newVehiclesFromServer: Vehicle[] = [];
    if (result.newVehicles && Array.isArray(result.newVehicles)) {
      result.newVehicles.forEach((v: any) => {
        // Handle vehicle images from server response
        let vehicleImages: string[] = [];
        if (Array.isArray(v.vehicleImages) && v.vehicleImages.length > 0) {
          vehicleImages = v.vehicleImages.filter((img: any) => img !== null && img !== undefined);
        } else if (typeof v.vehicleImages === 'string' && v.vehicleImages.trim() !== '') {
          vehicleImages = [v.vehicleImages];
        }
        
        newVehiclesFromServer.push({
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year || 0,
          licensePlate: v.licensePlate || '',
          vin: v.vin || '',
          color: v.color || '',
          current_mileage: v.current_mileage || 0,
          vehicleImages: vehicleImages,
        });
      });
    } else {
      // If no response data, create vehicles from form data
      const imageUrls = result.imageUrls || [];
      vehicles.forEach((formVehicle, index) => {
        const imagePath = imageUrls[index] || null;
        newVehiclesFromServer.push({
          id: `temp-${Date.now()}-${index}`,
          make: formVehicle.make,
          model: formVehicle.model,
          year: parseInt(formVehicle.year) || 0,
          licensePlate: formVehicle.licensePlate,
          vin: formVehicle.vin,
          color: formVehicle.color,
          current_mileage: parseInt(formVehicle.current_mileage) || 0,
          vehicleImages: imagePath ? [imagePath] : [],
        });
      });
    }
    
    setCustomers((prev) =>
      prev.map((c) =>
        c.customerId === selectedCustomer.customerId
          ? {
              ...c,
              vehicles: [...c.vehicles, ...newVehiclesFromServer],
            }
          : c
      )
    );
    
    setSelectedCustomer((prev) =>
      prev && prev.customerId === selectedCustomer.customerId
        ? {
            ...prev,
            vehicles: [...prev.vehicles, ...newVehiclesFromServer],
          }
        : prev
    );
  };
  
  // Fetch car models when modal opens
  useEffect(() => {
    const fetchCarModels = async () => {
      if (!isAddVehicleModalOpen) return;
      setLoadingModels(true);
      try {
        console.log(`Fetching car models from: ${BASE_URLS[0]}/api/customers/car-models`);
        const response = await fetch(`${BASE_URLS[0]}/api/customers/car-models`);
        if (response.ok) {
          const data: Record<string, { model: string; serviceInterval: number }[]> = await response.json();
          setCarModelsByMake(data);
          setCarMakes(Object.keys(data).sort());
          console.log(`Successfully loaded car models`);
        } else {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error('Error loading car models:', err);
        setError('Could not load car models. Please try again.');
      } finally {
        setLoadingModels(false);
      }
    };
    fetchCarModels();
  }, [isAddVehicleModalOpen]);
  
  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching customers from: ${BASE_URLS[0]}/api/customers/fetch`);
        const response = await fetch(`${BASE_URLS[0]}/api/customers/fetch`);
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Successfully fetched ${data.length} customers`);
        
        // Transform the data - FIXED: properly handle image arrays
        const transformedCustomers = data.map((customer: any) => {
          // Handle customer images - ensure it's always an array of strings
          let customerImages: string[] = [];
          if (Array.isArray(customer.customerImages) && customer.customerImages.length > 0) {
            customerImages = customer.customerImages.filter((img: any) => img !== null && img !== undefined);
          } else if (typeof customer.customerImages === 'string' && customer.customerImages.trim() !== '') {
            customerImages = [customer.customerImages];
          } else if (typeof customer.customerImage === 'string' && customer.customerImage.trim() !== '') {
            // Handle legacy single image field
            customerImages = [customer.customerImage];
          }
          
          console.log('Processed customer images for', customer.name, ':', customerImages);
          
          return {
            ...customer,
            readableCustomerId: customer.readableCustomerId || customer.customerId,
            status: customer.status || 'pending',
            customerImages: customerImages,
            loyaltyPoints: customer.loyaltyPoints || 0,
            vehicles: Array.isArray(customer.vehicles)
              ? customer.vehicles.map((v: any) => {
                  // Handle vehicle images - ensure it's always an array of strings
                  let vehicleImages: string[] = [];
                  if (Array.isArray(v.vehicleImages) && v.vehicleImages.length > 0) {
                    vehicleImages = v.vehicleImages.filter((img: any) => img !== null && img !== undefined);
                  } else if (typeof v.vehicleImages === 'string' && v.vehicleImages.trim() !== '') {
                    vehicleImages = [v.vehicleImages];
                  } else if (typeof v.vehicleImage === 'string' && v.vehicleImage.trim() !== '') {
                    // Handle legacy single image field
                    vehicleImages = [v.vehicleImage];
                  }
                  
                  console.log('Processed vehicle images for', v.make, v.model, ':', vehicleImages);
                  
                  return {
                    id: v.id,
                    make: v.make,
                    model: v.model,
                    year: v.year || 0,
                    licensePlate: v.licensePlate || '',
                    vin: v.vin || '',
                    color: v.color || '',
                    current_mileage: v.currentMileage || v.current_mileage || 0,
                    vehicleImages: vehicleImages,
                  };
                })
              : [],
          };
        });
        
        setCustomers(transformedCustomers);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);
  
  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType =
      customerTypeFilter === 'all' || customer.customerType === customerTypeFilter;
    const matchesStatus =
      statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Handlers
  const handleAddCustomer = () => setIsAddModalOpen(true);
  
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };
  
  const handleToggleCustomerStatus = async (customer: Customer) => {
    try {
      const newStatus = customer.status === 'active' ? 'deactivated' : 'active';
      const response = await fetch(`${BASE_URLS[0]}/api/customers/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.customerId,
          customerType: customer.customerType,
          status: newStatus,
        }),
      });
      
      if (response.ok) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.customerId === customer.customerId ? { ...c, status: newStatus } : c
          )
        );
        
        if (selectedCustomer && selectedCustomer.customerId === customer.customerId) {
          setSelectedCustomer({ ...selectedCustomer, status: newStatus });
        }
        
        console.log(`Successfully updated customer status`);
      } else {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating customer status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update customer status');
    }
  };
  
  const handleAddVehicleToCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAddVehicleModalOpen(true);
    setVehicles([
      {
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        color: '',
        current_mileage: '',
        vin: '',
        image: null,
        imagePreview: null,
      },
    ]);
    setError(null);
    setSuccess(null); // Clear success message when opening modal
  };
  
  const addVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        color: '',
        current_mileage: '',
        vin: '',
        image: null,
        imagePreview: null,
      },
    ]);
  };
  
  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };
  
  const handleVehicleChange = (index: number, field: keyof VehicleForm, value: string) => {
    setVehicles((prev) => {
      const newVehicles = [...prev];
      if (field === 'make') {
        newVehicles[index] = { 
          ...newVehicles[index], 
          make: value, 
          model: '', 
          serviceInterval: undefined 
        };
      } else if (field === 'model') {
        const selectedMake = newVehicles[index].make;
        const modelsForMake = carModelsByMake[selectedMake] || [];
        const selectedModelData = modelsForMake.find(m => m.model === value);
        newVehicles[index] = { 
          ...newVehicles[index], 
          model: value, 
          serviceInterval: selectedModelData?.serviceInterval 
        };
      } else {
        newVehicles[index] = { ...newVehicles[index], [field]: value };
      }
      return newVehicles;
    });
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
  
  const handleSubmitVehicles = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null); // Clear any previous success message
    
    try {
      // Enhanced validation
      const validationErrors: string[] = [];
      vehicles.forEach((vehicle, index) => {
        if (!vehicle.make) {
          validationErrors.push(`Vehicle ${index + 1}: Make is required`);
        }
        if (!vehicle.model) {
          validationErrors.push(`Vehicle ${index + 1}: Model is required`);
        }
      });
      
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }
      
      // Check if we have any images to upload
      const hasImages = vehicles.some(vehicle => vehicle.image);
      
      // Prepare vehicle data
      const vehiclesDataForJson = vehicles.map((vehicle) => ({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year ? parseInt(vehicle.year) : null,
        licensePlate: vehicle.licensePlate || null,
        color: vehicle.color || null,
        current_mileage: vehicle.current_mileage ? parseInt(vehicle.current_mileage) : null,
        vin: vehicle.vin || null,
        serviceInterval: vehicle.serviceInterval || null,
      }));
      
      // Try to submit with images first if we have any
      if (hasImages) {
        try {
          const formData = new FormData();
          formData.append('vehicles', JSON.stringify(vehiclesDataForJson));
          formData.append('customerId', selectedCustomer.customerId);
          
          vehicles.forEach((vehicle) => {
            if (vehicle.image) {
              formData.append('images', vehicle.image);
            }
          });
          
          console.log('Submitting vehicles data with images:');
          console.log('Customer ID:', selectedCustomer.customerId);
          console.log('Vehicles:', vehiclesDataForJson);
          console.log('Images count:', vehicles.filter(v => v.image).length);
          console.log(`Adding vehicles via: ${BASE_URLS[0]}/api/customers/add-vehicles`);
          
          // Add a timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(`${BASE_URLS[0]}/api/customers/add-vehicles`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          // Get response text first to see what we're getting
          const responseText = await response.text();
          console.log('Response status:', response.status);
          console.log('Response text:', responseText);
          
          // Always check if vehicles were added, regardless of response status
          const vehiclesAdded = await checkIfVehiclesAdded(selectedCustomer);
          
          if (vehiclesAdded) {
            // The vehicles were added successfully despite the error response
            console.log('Vehicles were added successfully despite the error response');
            
            // Update the state with the new customer data
            await refreshCustomerData(selectedCustomer, setCustomers, setSelectedCustomer);
            
            // Show success message and close modal
            setSuccess('Vehicles added successfully!');
            setTimeout(() => {
              setIsAddVehicleModalOpen(false);
              setVehicles([
                {
                  make: '',
                  model: '',
                  year: '',
                  licensePlate: '',
                  color: '',
                  current_mileage: '',
                  vin: '',
                  image: null,
                  imagePreview: null,
                },
              ]);
            }, 1500); // Close modal after showing success message
            return;
          }
          
          if (!response.ok) {
            let errorMessage = 'Failed to add vehicles';
            try {
              // Try to parse as JSON
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
              // If not JSON, use the text directly
              errorMessage = responseText || response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
          }
          
          // Process successful response
          let result: AddVehicleResponse = {};
          try {
            result = JSON.parse(responseText);
          } catch (e) {
            console.warn('Failed to parse JSON response:', e);
          }
          
          console.log(`Successfully added vehicles`, result);
          
          // Update the state with the new vehicles
          await updateVehiclesState(result, selectedCustomer, vehicles, setCustomers, setSelectedCustomer);
          
          // Show success message and close modal
          setSuccess('Vehicles added successfully!');
          setTimeout(() => {
            setIsAddVehicleModalOpen(false);
            setVehicles([
              {
                make: '',
                model: '',
                year: '',
                licensePlate: '',
                color: '',
                current_mileage: '',
                vin: '',
                image: null,
                imagePreview: null,
              },
            ]);
          }, 1500); // Close modal after showing success message
          return; // Success, exit the function
        } catch (imageError) {
          console.error('Error with image upload:', imageError);
          
          // Check if it's a network error
          if (imageError instanceof TypeError && imageError.message.includes('Failed to fetch')) {
            console.log('Network error detected, trying to submit without images');
            setError('Network error: Unable to upload images. Submitting vehicle information without images.');
            // Continue to submit without images
          } else if (imageError.name === 'AbortError') {
            console.log('Request timed out, trying to submit without images');
            setError('Request timed out: Unable to upload images. Submitting vehicle information without images.');
            // Continue to submit without images
          } else {
            // Check if the error is related to server configuration
            const isServerError = imageError instanceof Error && (
              imageError.message.includes('IMAGE_BASE_URL is not defined') ||
              imageError.message.includes('ReferenceError') ||
              imageError.message.includes('Internal Server Error') ||
              imageError.message.includes('500')
            );
            
            if (isServerError) {
              console.log('Server error detected, trying to submit without images');
              setError('Server error: Unable to upload images. Submitting vehicle information without images.');
              // Continue to submit without images
            } else {
              // If it's a different error, rethrow it
              throw imageError;
            }
          }
        }
      }
      
      // Submit without images (either because there are no images or because the image upload failed)
      console.log('Submitting vehicles data without images:');
      console.log('Customer ID:', selectedCustomer.customerId);
      console.log('Vehicles:', vehiclesDataForJson);
      console.log(`Adding vehicles via: ${BASE_URLS[0]}/api/customers/add-vehicles`);
      
      const response = await fetch(`${BASE_URLS[0]}/api/customers/add-vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicles: vehiclesDataForJson,
          customerId: selectedCustomer.customerId,
        }),
      });
      
      // Get response text first to see what we're getting
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);
      
      // Always check if vehicles were added, regardless of response status
      const vehiclesAdded = await checkIfVehiclesAdded(selectedCustomer);
      
      if (vehiclesAdded) {
        // The vehicles were added successfully despite the error response
        console.log('Vehicles were added successfully despite the error response');
        
        // Update the state with the new customer data
        await refreshCustomerData(selectedCustomer, setCustomers, setSelectedCustomer);
        
        // Show success message and close modal
        setSuccess('Vehicles added successfully!');
        setTimeout(() => {
          setIsAddVehicleModalOpen(false);
          setVehicles([
            {
              make: '',
              model: '',
              year: '',
              licensePlate: '',
              color: '',
              current_mileage: '',
              vin: '',
              image: null,
              imagePreview: null,
            },
          ]);
        }, 1500); // Close modal after showing success message
        return;
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to add vehicles';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          // If it's a database error, provide more specific guidance
          if (errorMessage.includes('database')) {
            errorMessage = 'Database error: The server could not save the vehicle information. This might be due to a temporary issue or a problem with the vehicle data. Please try again or contact support if the issue persists.';
          }
        } catch (e) {
          errorMessage = responseText || response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Process the response
      await updateVehiclesState(result, selectedCustomer, vehicles, setCustomers, setSelectedCustomer);
      
      // Show success message and close modal
      setSuccess('Vehicles added successfully!');
      setTimeout(() => {
        setIsAddVehicleModalOpen(false);
        setVehicles([
          {
            make: '',
            model: '',
            year: '',
            licensePlate: '',
            color: '',
            current_mileage: '',
            vin: '',
            image: null,
            imagePreview: null,
          },
        ]);
      }, 1500); // Close modal after showing success message
      
      // Show a warning if we tried to upload images but couldn't
      if (hasImages) {
        setSuccess('Vehicles added successfully, but images could not be uploaded due to a network error.');
      }
    } catch (error) {
      console.error('Error adding vehicles:', error);
      setError(error instanceof Error ? error.message : 'Failed to add vehicles');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>;
      case 'deactivated':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Deactivated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'blocked':
        return <Shield className="w-5 h-5 text-red-500" />;
      case 'deactivated':
        return <UserX className="w-5 h-5 text-gray-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Request timed out. Please check your connection and try again.');
      }
    }, 15000); // 15 seconds timeout
    
    return () => clearTimeout(timeout);
  }, [isLoading]);
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading customers...</div>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }
  
  if (error && !isAddVehicleModalOpen) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-2xl text-red-600 mb-4">⚠️ Error</div>
          <div className="text-xl font-medium text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen text-black">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customer information and service history</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={handleAddCustomer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>
      
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value as CustomerTypeFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>
      
      {/* Customer List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loyalty Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.customerId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                   
                    <div>
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">ID: {customer.readableCustomerId}</div>
                      {customer.companyName && <div className="text-sm text-gray-500">{customer.companyName}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <Car className="w-4 h-4 mr-2 text-gray-400" />
                    {customer.vehicles.length} vehicle(s)
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-1 text-amber-500" />
                    <span className="font-medium">{customer.loyaltyPoints || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(customer.registrationDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(customer.status || 'pending')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                      title="View Customer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                    onClick={() => handleEditCustomer(customer)}
                    className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                    title="Edit Customer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>


                    <button
                      onClick={() => handleToggleCustomerStatus(customer)}
                      className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
                        customer.status === 'active' 
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      title={customer.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'}
                    >
                      {customer.status === 'active' ? (
                        <>
                          <UserX className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* View Customer Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Customer Details - ${selectedCustomer?.name}`}
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Profile */}
            <div className="flex flex-col md:flex-row gap-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <div className="relative">
                <SafeImage
                  srcs={selectedCustomer.customerImages}
                  alt="Profile"
                  className="h-32 w-32 object-cover rounded-full border-4 border-white shadow-lg"
                  size="large"
                />
                <div className={`absolute -bottom-2 -right-2 rounded-full p-2 ring-4 ring-white ${
                  selectedCustomer.status === 'active' ? 'bg-green-500' : 
                  selectedCustomer.status === 'pending' ? 'bg-yellow-500' :
                  selectedCustomer.status === 'blocked' ? 'bg-red-500' : 'bg-gray-500'
                }`}>
                  {getStatusIcon(selectedCustomer.status || 'pending')}
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                <p className="text-gray-600 mt-1">
                  Member since {new Date(selectedCustomer.registrationDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedCustomer.totalServices} service{selectedCustomer.totalServices !== 1 ? 's' : ''} completed
                </p>
                <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant={selectedCustomer.customerType === 'company' ? 'default' : 'outline'}>
                    {selectedCustomer.customerType === 'company' ? '🏢 Company' : '👤 Individual'}
                  </Badge>
                  {getStatusBadge(selectedCustomer.status || 'pending')}
                </div>
              </div>
            </div>
            
            {/* Contact & Account Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                  {selectedCustomer.emergencyContact && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-red-400 mr-3" />
                      <span>Emergency: {selectedCustomer.emergencyContact}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Account Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Customer ID:</span>
                    <span className="ml-2 font-mono">{selectedCustomer.readableCustomerId}</span>
                  </div>
                  {/* Simplified Loyalty Points - Just a number */}
                  <div className="flex items-center">
                    <div className="bg-amber-100 rounded-lg p-3 flex items-center border border-amber-200">
                      <Award className="w-6 h-6 text-amber-600 mr-2" />
                      <div>
                        <span className="text-sm text-gray-500">Loyalty Points:</span>
                        <div className="flex items-baseline">
                          <span className="text-xl font-bold text-amber-700">{selectedCustomer.loyaltyPoints || 0}</span>
                          <span className="text-xs text-amber-500 ml-1">points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedCustomer.companyName && (
                    <div>
                      <span className="text-sm text-gray-500">Company:</span>
                      <span className="ml-2 font-medium">{selectedCustomer.companyName}</span>
                    </div>
                  )}
                  {selectedCustomer.gstNumber && (
                    <div>
                      <span className="text-sm text-gray-500">GST Number:</span>
                      <span className="ml-2">{selectedCustomer.gstNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {selectedCustomer.notes && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Notes</h4>
                <p className="bg-gray-50 p-3 rounded-lg italic">{selectedCustomer.notes}</p>
              </div>
            )}
            
            {/* Vehicles */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Vehicles</h4>
              <div className="flex justify-between mb-4">
                <span className="text-sm text-gray-600">{selectedCustomer.vehicles.length} vehicle(s)</span>
                <button
                  onClick={() => handleAddVehicleToCustomer(selectedCustomer)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </button>
              </div>
              
              {selectedCustomer.vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCustomer.vehicles.map((v) => (
                    <div key={v.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md">
                      <div className="flex justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{v.year} {v.make} {v.model}</h5>
                          <p className="text-sm text-gray-600">{v.color}</p>
                        </div>
                        <Badge variant="outline">{v.licensePlate || 'No Plate'}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">VIN:</span>
                          <span className="ml-2">{v.vin || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Current Mileage:</span>
                          <span className="ml-2">{(v.current_mileage || 0).toLocaleString()} km</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <SafeVehicleImage
                          srcs={v.vehicleImages}
                          alt={v.make}
                          className="h-40 w-full object-cover rounded-lg border"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">No vehicles registered</p>
              )}
            </div>
          </div>
        )}
      </Modal>
      
      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => {
          setIsAddVehicleModalOpen(false);
          setError(null);
          setSuccess(null);
        }}
        title={`Add Vehicle - ${selectedCustomer?.name}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg whitespace-pre-line">{error}</div>
          )}
          
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Car className="w-5 h-5 mr-2" />
                Vehicle Information
              </h4>
              <button
                type="button"
                onClick={addVehicle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Vehicle
              </button>
            </div>
            
            {vehicles.map((vehicle, index) => (
              <div key={index} className="bg-white rounded-lg p-4 mb-4 border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Vehicle {index + 1}</h5>
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                    {loadingModels ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                        Loading makes...
                      </div>
                    ) : (
                      <select
                        value={vehicle.make}
                        onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">Select Make</option>
                        {carMakes.map((make) => (
                          <option key={make} value={make}>
                            {make}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    {loadingModels ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                        Loading models...
                      </div>
                    ) : (
                      <select
                        value={vehicle.model}
                        onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting || !vehicle.make}
                      >
                        <option value="">Select Model</option>
                        {vehicle.make && carModelsByMake[vehicle.make]?.map((modelData) => (
                          <option key={modelData.model} value={modelData.model}>
                            {modelData.model}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      value={vehicle.year}
                      onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="2020"
                      min="1900"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                    <input
                      type="text"
                      value={vehicle.licensePlate}
                      onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="ABC-123"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={vehicle.color}
                      onChange={(e) => handleVehicleChange(index, 'color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Silver"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage</label>
                    <input
                      type="number"
                      value={vehicle.current_mileage}
                      onChange={(e) => handleVehicleChange(index, 'current_mileage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="50000"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                    <input
                      type="text"
                      value={vehicle.vin}
                      onChange={(e) => handleVehicleChange(index, 'vin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="1HGBH41JXMN109186"
                      maxLength={17}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
                    <div className="flex items-center space-x-4">
                      {vehicle.imagePreview ? (
                        <div className="relative">
                          <img src={vehicle.imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
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
                          <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center">
                            <Plus className="w-4 h-4 mr-1" />
                            {vehicle.imagePreview ? 'Change Image' : 'Upload Image'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(index, e)}
                            className="hidden"
                            disabled={isSubmitting}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsAddVehicleModalOpen(false);
                setError(null);
                setSuccess(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            {error && (
              <button
                onClick={handleSubmitVehicles}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center"
                disabled={isSubmitting}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            )}
            <button
              onClick={handleSubmitVehicles}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicles
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Add Customer Modal */}
      <AddCustomerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <EditCustomerModal
  isOpen={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  customer={editingCustomer}
  onSave={handleSaveCustomer}
/>
    </div>
  );
};

export default CustomerManagement;