import React, { useState, useEffect } from 'react';
import {
  Star,
  Car,
  User,
  Calendar,
  Wrench,
  MapPin,
  Mail,
  Phone,
  ThumbsUp,
  Settings,
  AlertCircle,
  WifiOff,
} from 'lucide-react';

const BASE_URL = 'https://ipasystem.bymsystem.com';
const BASE_URLS = [
  'https://ipasystem.bymsystem.com',
  'https://ipamanager.bymsystem.com',
];

const encode = (path) => encodeURIComponent(path).replace(/%2F/g, '/');
const getImageUrls = (path) => {
  if (!path) return [];
  return BASE_URLS.map(base => `${base}/${encode(path)}`);
};

// Improved FallbackImage component with better error handling
const FallbackImage = ({ srcs, alt, fallback, className, fallbackIcon = 'user' }: { 
  srcs: string[]; 
  alt: string; 
  fallback: string; 
  className?: string;
  fallbackIcon?: 'user' | 'car';
}) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle case when srcs is empty or undefined
  const imageSources = srcs && srcs.length > 0 ? srcs : [fallback];

  const handleError = () => {
    if (currentSrcIndex < imageSources.length - 1) {
      setCurrentSrcIndex(currentSrcIndex + 1);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200`}>
        {fallbackIcon === 'car' ? (
          <Car className="w-8 h-8 text-gray-400" />
        ) : (
          <User className="w-8 h-8 text-gray-400" />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 ${className}`}>
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      <img
        src={imageSources[currentSrcIndex]}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

// Interfaces remain the same
interface ProformaItem {
  id: number;
  proforma_id: number;
  description: string;
  size: string;
  quantity: number;
  unit_price: number | string;
  amount: number | string;
  created_at: string;
  updated_at: string;
}

interface Bill {
  id: number;
  ticket_number: string;
  proforma_number: string;
  proforma_id?: number;
  proforma_date?: string;
  customer_name: string;
  vehicle_info: string;
  labor_cost: number | string;
  parts_cost: number | string;
  outsourced_parts_cost: number | string;
  outsourced_labor_cost: number | string;
  subtotal: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total: number | string;
  discount: number | string;
  final_total: number | string;
  status: string;
  payment_type?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  proforma_items?: ProformaItem[];
}

interface DisassembledPart {
  id: number;
  ticket_number: string;
  part_name: string;
  condition: string;
  status: string;
  notes: string | null;
  logged_at: string;
  reassembly_verified: string | null;
}

interface OutsourceMechanic {
  id: number;
  ticket_number: string;
  mechanic_name: string;
  company_name: string;
  task: string;
  cost: number | string;
  status: string;
  created_at: string;
}

interface OrderedPart {
  id: number;
  ticket_number: string;
  part_name: string;
  quantity: number;
  cost: number | string;
  supplier: string;
  ordered_at: string;
}

interface Inspection {
  id: number;
  ticket_number: string;
  main_issue_resolved: string;
  reassembly_verified: string;
  general_condition: string;
  notes: string;
  inspection_date: string;
  inspection_status: string;
  created_at: string;
  updated_at: string;
  check_oil_leaks: string | null;
  check_engine_air_filter_oil_coolant_level: string | null;
  check_brake_fluid_levels: string | null;
  check_gluten_fluid_levels: string | null;
  check_battery_timing_belt: string | null;
  check_tire: string | null;
  check_tire_pressure_rotation: string | null;
  check_lights_wiper_horn: string | null;
  check_door_locks_central_locks: string | null;
  check_customer_work_order_reception_book: string | null;
}

interface ProgressLog {
  id: number;
  ticket_number: string;
  action: string;
  notes: string;
  created_at: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: number;
  vehicle_info: string;
  license_plate: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  created_at: string;
  updated_at: string;
  disassembled_parts: DisassembledPart[];
  outsource_mechanics: OutsourceMechanic[];
  ordered_parts: OrderedPart[];
  outsource_stock: any[];
  inspections: Inspection[];
  progress_logs: ProgressLog[];
  bills: Bill[];
}

interface Customer {
  id: string;
  name: string;
  specialty: string;
  rating: string;
  reviews: number;
  years: number;
  status: string;
  customerImages: string[];
  email: string;
  phone: string;
  address: string;
  mechanic: string;
  history: any[];
  vehicles: Vehicle[];
}

interface Vehicle {
  id: number;
  year: number;
  make: string;
  model: string;
  licensePlate: string;
  vin: string;
  color: string;
  current_mileage: number;
  vehicleImages: string[];
}

const Customer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billDetails, setBillDetails] = useState<{ bill: Bill | null; items: ProformaItem[] | null }>({ bill: null, items: null });
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [corsError, setCorsError] = useState(false);

  // Helper function to handle fetch requests with CORS error detection
  const fetchWithCorsHandling = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      // Check if it's a CORS error
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setCorsError(true);
        setIsOfflineMode(true);
        throw new Error('CORS error or network issue');
      }
      throw err;
    }
  };

  // Fetch all customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await fetchWithCorsHandling(`${BASE_URL}/api/customer-manege/fetch`);
        const mappedCustomers = data.map((customer: any) => {
          return {
            id: customer.customerId,
            name: customer.name,
            specialty: customer.customerType === 'company'
              ? `${customer.companyName} (Company)`
              : 'Individual Customer',
            rating: '4.5',
            reviews: 0,
            years: Math.max(
              1,
              Math.floor((Date.now() - new Date(customer.registrationDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
            ),
            status: 'Active',
            customerImages: customer.customerImages || [],
            email: customer.email || 'N/A',
            phone: customer.phone || 'N/A',
            address: customer.address || 'N/A',
            mechanic: 'Not Assigned',
            vehicles: customer.vehicles ? customer.vehicles.map((v: any) => ({
              id: v.id,
              year: v.year,
              make: v.make,
              model: v.model,
              licensePlate: v.licensePlate,
              vin: v.vin,
              color: v.color,
              current_mileage: v.currentMileage || v.current_mileage || 0,
              vehicleImages: v.imageUrls || [],
            })) : [],
          };
        });
        setCustomers(mappedCustomers);
        setIsOfflineMode(false);
        setCorsError(false);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customer data. Check if the server is running.');
        setIsOfflineMode(true);
        
        // Load mock data for offline mode
        const mockCustomers = [
          {
            id: 'CUST123456789',
            name: 'John Doe',
            specialty: 'Individual Customer',
            rating: '4.5',
            reviews: 3,
            years: 2,
            status: 'Active',
            customerImages: [],
            email: 'john.doe@example.com',
            phone: '555-123-4567',
            address: '123 Main St, Anytown, USA',
            mechanic: 'Not Assigned',
            history: [
              {
                ticketNumber: 'TKT-001',
                car: '2020 Honda Civic',
                licensePlate: 'ABC-123',
                date: '2023-05-15',
                job: 'Oil Change',
                rating: '4.5'
              },
              {
                ticketNumber: 'TKT-002',
                car: '2020 Honda Civic',
                licensePlate: 'ABC-123',
                date: '2023-03-10',
                job: 'Brake Inspection',
                rating: '4.0'
              }
            ],
            vehicles: [
              {
                id: 1,
                year: 2020,
                make: 'Honda',
                model: 'Civic',
                licensePlate: 'ABC-123',
                vin: '1HGCM82633A004352',
                color: 'Blue',
                current_mileage: 35000,
                vehicleImages: []
              }
            ]
          },
          {
            id: 'CUST987654321',
            name: 'Jane Smith',
            specialty: 'Individual Customer',
            rating: '4.8',
            reviews: 5,
            years: 3,
            status: 'Active',
            customerImages: [],
            email: 'jane.smith@example.com',
            phone: '555-987-6543',
            address: '456 Oak Ave, Sometown, USA',
            mechanic: 'Not Assigned',
            history: [
              {
                ticketNumber: 'TKT-003',
                car: '2018 Toyota Camry',
                licensePlate: 'XYZ-789',
                date: '2023-06-20',
                job: 'Tire Rotation',
                rating: '5.0'
              }
            ],
            vehicles: [
              {
                id: 2,
                year: 2018,
                make: 'Toyota',
                model: 'Camry',
                licensePlate: 'XYZ-789',
                vin: '4T1B11HK8JU123456',
                color: 'Silver',
                current_mileage: 42000,
                vehicleImages: []
              }
            ]
          }
        ];
        setCustomers(mockCustomers);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Reset bill details when ticket changes
  useEffect(() => {
    setBillDetails({ bill: null, items: null });
    setBillError(null);
    setBillLoading(false);
  }, [selectedTicket]);

  // Fetch bill details when bill tab is active
  useEffect(() => {
    if (activeTab === 'bill' && selectedTicket && !billDetails.bill && !billLoading && !billError) {
      fetchBillDetails(selectedTicket.ticket_number);
    }
  }, [activeTab, selectedTicket, billDetails.bill, billLoading, billError]);

  const fetchBillDetails = async (ticketNumber: string) => {
    setBillLoading(true);
    setBillError(null);
    try {
      const data = await fetchWithCorsHandling(`${BASE_URL}/api/bill/car-bills/${ticketNumber}`);
      if (data.success) {
        setBillDetails({
          bill: data.bill,
          items: data.items
        });
      } else {
        setBillError(data.message || 'Failed to fetch bill details');
      }
    } catch (err) {
      console.error('Error fetching bill details:', err);
      setBillError('Failed to load bill details');
      
      // Mock bill data for offline mode
      setBillDetails({
        bill: {
          id: 1,
          ticket_number: ticketNumber,
          proforma_number: 'PROF-001',
          proforma_date: '2023-06-20',
          customer_name: selectedTicket?.customer_name || 'Customer',
          vehicle_info: selectedTicket?.vehicle_info || 'Vehicle',
          labor_cost: 150.00,
          parts_cost: 75.50,
          outsourced_parts_cost: 0,
          outsourced_labor_cost: 0,
          subtotal: 225.50,
          tax_rate: 8.5,
          tax_amount: 19.17,
          total: 244.67,
          discount: 10.00,
          final_total: 234.67,
          status: 'Paid',
          payment_type: 'Credit Card',
          notes: 'Customer paid with credit card',
          created_at: '2023-06-20',
          updated_at: '2023-06-20',
        },
        items: [
          {
            id: 1,
            proforma_id: 1,
            description: 'Oil Change Service',
            size: 'Standard',
            quantity: 1,
            unit_price: 50.00,
            amount: 50.00,
            created_at: '2023-06-20',
            updated_at: '2023-06-20'
          },
          {
            id: 2,
            proforma_id: 1,
            description: 'Oil Filter',
            size: 'Standard',
            quantity: 1,
            unit_price: 15.50,
            amount: 15.50,
            created_at: '2023-06-20',
            updated_at: '2023-06-20'
          },
          {
            id: 3,
            proforma_id: 1,
            description: 'Labor',
            size: '1 hour',
            quantity: 1,
            unit_price: 100.00,
            amount: 100.00,
            created_at: '2023-06-20',
            updated_at: '2023-06-20'
          }
        ]
      });
    } finally {
      setBillLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerClick = async (customer: Customer) => {
    // Show the customer modal immediately with basic data
    setSelectedCustomer(customer);

    try {
      // Create a basic customer object with the data we already have
      let mappedCustomer: Customer = {
        id: customer.id,
        name: customer.name,
        specialty: customer.specialty,
        rating: customer.rating,
        reviews: customer.reviews,
        years: customer.years,
        status: customer.status,
        customerImages: customer.customerImages,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        mechanic: customer.mechanic,
        history: customer.history || [],
        vehicles: customer.vehicles,
      };

      // Skip API calls if in offline mode
      if (isOfflineMode) {
        setSelectedCustomer(mappedCustomer);
        return;
      }

      // Try to fetch additional customer details with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds
        
        const customerData = await fetchWithCorsHandling(`${BASE_URL}/api/customer-manege/${customer.id}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Update customer data with additional details
        const isCompany = customerData.customer_type === 'company';
        mappedCustomer = {
          ...mappedCustomer,
          id: customerData.customer_id || customer.id,
          name: isCompany ? customerData.contact_person_name || customer.name : customerData.name || customer.name,
          specialty: isCompany ? `${customerData.company_name || 'Company'} (Company)` : 'Individual Customer',
          email: customerData.email || customer.email,
          phone: customerData.phone || customer.phone,
          address: customerData.address || customer.address,
          customerImages: customerData.customerImages || customer.customerImages,
        };
      } catch (err) {
        console.warn('Could not fetch additional customer details:', err);
      }

      // Try to fetch vehicles with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds
        
        const vehiclesData = await fetchWithCorsHandling(`${BASE_URL}/api/customer-manege/${customer.id}/vehicles`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (vehiclesData.vehicles) {
          mappedCustomer.vehicles = vehiclesData.vehicles.map((v: any) => ({
            id: v.id,
            year: v.year,
            make: v.make,
            model: v.model,
            licensePlate: v.licensePlate,
            vin: v.vin,
            color: v.color,
            current_mileage: v.currentMileage || v.current_mileage || 0,
            vehicleImages: v.imageUrls || [],
          }));
        }
      } catch (err) {
        console.warn('Could not fetch vehicles:', err);
      }

      // Try to fetch completed tickets with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds
        
        const ticketsData = await fetchWithCorsHandling(`${BASE_URL}/api/customer-manege/completed-tickets/${customer.id}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Map tickets to history format
        const history = ticketsData.map((ticket: any) => ({
          ticketNumber: ticket.ticket_number,
          car: ticket.vehicle_info,
          licensePlate: ticket.license_plate,
          date: ticket.updated_at,
          job: ticket.title,
          rating: null,
        }));
        
        mappedCustomer.history = history;
        mappedCustomer.reviews = history.length;
      } catch (err) {
        console.warn('Could not fetch tickets:', err);
      }

      // Update the selected customer with the enhanced data
      setSelectedCustomer(mappedCustomer);
    } catch (err) {
      console.error('Error loading customer details:', err);
      // Ensure the modal stays open even if all API calls fail
      if (!selectedCustomer) {
        setSelectedCustomer(customer);
      }
    }
  };

  const handleVehicleClick = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleTicketClick = async (ticket: any) => {
    try {
      if (!selectedCustomer) return;
      const ticketNumber = ticket.ticketNumber.replace('TKT-', '');
      const customerId = selectedCustomer.id;
      
      // Skip API calls if in offline mode
      if (isOfflineMode) {
        // Find the vehicle that matches the ticket
        const matchingVehicle = selectedCustomer.vehicles.find(v => 
          v.licensePlate === ticket.licensePlate
        ) || selectedCustomer.vehicles[0];
        
        // Create mock ticket data with all required properties
        const mockTicket: Ticket = {
          id: 1,
          ticket_number: ticket.ticketNumber,
          customer_id: customerId,
          customer_name: selectedCustomer.name,
          vehicle_id: matchingVehicle?.id || 1,
          vehicle_info: ticket.car,
          license_plate: ticket.licensePlate,
          title: ticket.job,
          description: 'This is a mock ticket description for offline mode.',
          status: 'completed',
          priority: 'Medium',
          type: 'Repair',
          created_at: ticket.date,
          updated_at: ticket.date,
          disassembled_parts: [],
          outsource_mechanics: [],
          ordered_parts: [
            {
              id: 1,
              ticket_number: ticket.ticketNumber,
              part_name: 'Oil Filter',
              quantity: 1,
              cost: 15.50,
              supplier: 'Auto Parts Store',
              ordered_at: ticket.date
            }
          ],
          outsource_stock: [],
          inspections: [
            {
              id: 1,
              ticket_number: ticket.ticketNumber,
              main_issue_resolved: 'Yes',
              reassembly_verified: 'Yes',
              general_condition: 'Good',
              notes: 'Vehicle is in good condition',
              inspection_date: ticket.date,
              inspection_status: 'Completed',
              created_at: ticket.date,
              updated_at: ticket.date,
              check_oil_leaks: 'No',
              check_engine_air_filter_oil_coolant_level: 'Good',
              check_brake_fluid_levels: 'Good',
              check_gluten_fluid_levels: 'Good',
              check_battery_timing_belt: 'Good',
              check_tire: 'Good',
              check_tire_pressure_rotation: 'Good',
              check_lights_wiper_horn: 'Good',
              check_door_locks_central_locks: 'Good',
              check_customer_work_order_reception_book: 'Good'
            }
          ],
          progress_logs: [
            {
              id: 1,
              ticket_number: ticket.ticketNumber,
              action: 'Ticket Created',
              notes: 'Initial ticket created',
              created_at: ticket.date
            },
            {
              id: 2,
              ticket_number: ticket.ticketNumber,
              action: 'Work Completed',
              notes: 'All work has been completed',
              created_at: ticket.date
            }
          ],
          bills: []
        };
        setSelectedTicket(mockTicket);
        return;
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds
        
        const ticketData = await fetchWithCorsHandling(`${BASE_URL}/api/customer-manege/completed-tickets/${customerId}/${ticketNumber}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        setSelectedTicket(ticketData);
        return;
      } catch (err) {
        console.warn('Could not fetch detailed ticket information:', err);
      }
      
      // Fallback to basic ticket information
      setSelectedTicket({
        id: 1,
        ticket_number: ticket.ticketNumber,
        customer_id: customerId,
        customer_name: selectedCustomer?.name || '',
        vehicle_id: 1,
        vehicle_info: ticket.car,
        license_plate: ticket.licensePlate,
        status: 'completed',
        title: ticket.job,
        description: 'Issue details not available',
        priority: 'Medium',
        type: 'Repair',
        created_at: ticket.date,
        updated_at: ticket.date,
        mechanicName: 'Not assigned',
        cost: '$0.00',
        feedback: 'No feedback available',
        rating: 0,
        disassembled_parts: [],
        outsource_mechanics: [],
        ordered_parts: [],
        outsource_stock: [],
        inspections: [],
        progress_logs: [],
        bills: []
      } as unknown as Ticket);
    } catch (err) {
      console.error('Error loading ticket details:', err);
      alert('Failed to load detailed ticket information.');
    }
  };

  const renderStars = (rating: string | number | null) => {
    if (!rating) return null;
    
    const numRating = parseFloat(rating.toString());
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            </div>
          </div>
        )}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700">{numRating.toFixed(1)}</span>
      </div>
    );
  };

  // Inspection checklist items
  const inspectionChecklist = [
    { key: 'check_oil_leaks', label: 'Oil Leaks' },
    { key: 'check_engine_air_filter_oil_coolant_level', label: 'Engine Air Filter, Oil, Coolant Level' },
    { key: 'check_brake_fluid_levels', label: 'Brake Fluid Levels' },
    { key: 'check_gluten_fluid_levels', label: 'Clutch Fluid Levels' },
    { key: 'check_battery_timing_belt', label: 'Battery & Timing Belt' },
    { key: 'check_tire', label: 'Tire Condition' },
    { key: 'check_tire_pressure_rotation', label: 'Tire Pressure & Rotation' },
    { key: 'check_lights_wiper_horn', label: 'Lights, Wiper, Horn' },
    { key: 'check_door_locks_central_locks', label: 'Door Locks & Central Locks' },
    { key: 'check_customer_work_order_reception_book', label: 'Customer Work Order Reception Book' },
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 tracking-tight">Customer Directory</h1>
      
    
      
      {/* Offline Mode Indicator */}
   
      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <input
          type="text"
          placeholder="🔍 Search customers..."
          className="w-full p-4 pl-12 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-300 text-gray-700 placeholder-gray-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
      
      {/* Loading / Error / List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg text-center">
          {error}
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => handleCustomerClick(customer)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100"
            >
              <div className="p-6 flex items-center">
                <FallbackImage
                  srcs={customer.customerImages}
                  alt={customer.name}
                  fallback="https://randomuser.me/api/portraits/men/32.jpg"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-sm"
                />
                <div className="ml-4 flex-1">
                  <h2 className="text-lg font-bold text-gray-800">{customer.name}</h2>
                  <p className="text-sm text-gray-500 truncate">{customer.specialty}</p>
                  <div className="flex items-center mt-2 space-x-3 text-xs text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {customer.vehicles.length} {customer.vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Car className="w-16 h-16 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500 text-lg">No customers found matching "{searchTerm}"</p>
        </div>
      )}
      
      {/* Customer Details Modal */}
      {selectedCustomer && !selectedVehicle && !selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="bg-custom-gradient text-white p-8 rounded-t-3xl flex items-center">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center overflow-hidden">
                {selectedCustomer.customerImages && selectedCustomer.customerImages.length > 0 ? (
                  <img
                    src={selectedCustomer.customerImages[0]}
                    alt={selectedCustomer.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://randomuser.me/api/portraits/men/32.jpg";
                    }}
                  />
                ) : (
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt={selectedCustomer.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                <p className="text-blue-100">{selectedCustomer.specialty}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="ml-auto bg-black bg-opacity-20 hover:bg-opacity-30 rounded-full w-10 h-10 flex items-center justify-center transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-lg mb-4 flex items-center text-gray-800">
                    <User className="w-5 h-5 mr-2 text-blue-600" /> Personal Info
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" /> <strong>Email:</strong> {selectedCustomer.email}
                    </p>
                    <p className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" /> <strong>Phone:</strong> {selectedCustomer.phone}
                    </p>
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" /> <strong>Address:</strong> {selectedCustomer.address}
                    </p>
                    <p className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-2 text-green-500" />
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {selectedCustomer.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Vehicles */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h4 className="font-bold mb-4 flex items-center text-gray-800">
                    <Car className="w-5 h-5 mr-2 text-blue-600" /> Vehicles
                  </h4>
                  <div className="space-y-3">
                    {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 ? (
                      selectedCustomer.vehicles.map((vehicle: Vehicle, i: number) => (
                        <div
                          key={vehicle.id}
                          className="p-3 bg-white rounded-xl hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                          onClick={() => handleVehicleClick(vehicle)}
                        >
                          <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                          <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No vehicles registered for this customer
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right: Recent Repairs */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center text-gray-800">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" /> Completed Tickets
                </h3>
                {selectedCustomer.history && selectedCustomer.history.length > 0 ? (
                  selectedCustomer.history.map((item: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleTicketClick(item)}
                      className="w-full text-left bg-white p-4 rounded-xl shadow hover:shadow-lg transition-all border border-gray-100"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">{item.car}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                            {item.ticketNumber}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-blue-600">{item.job}</span>
                        {item.rating && renderStars(item.rating)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No repair history available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[85vh]">
            <div className="bg-custom-gradient text-white p-6 rounded-t-3xl flex items-center">
              <h3 className="text-2xl font-bold flex items-center">
                <Car className="w-6 h-6 mr-2" />
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </h3>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="ml-auto bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="w-full h-64 rounded-2xl shadow-md overflow-hidden">
                <FallbackImage
                  srcs={selectedVehicle.vehicleImages}
                  alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                  fallback="https://picsum.photos/seed/vehicle/400/300.jpg"
                  className="w-full h-full object-cover"
                  fallbackIcon="car"
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-gray-800">Vehicle Details</h4>
                <div className="space-y-3 text-gray-700">
                  <p><strong>License Plate:</strong> {selectedVehicle.licensePlate}</p>
                  <p><strong>VIN:</strong> <span className="font-mono">{selectedVehicle.vin}</span></p>
                  <p><strong>Color:</strong> {selectedVehicle.color}</p>
                  <p><strong>Current Mileage:</strong> {selectedVehicle.current_mileage?.toLocaleString()} miles</p>
                </div>
              </div>
            </div>
            <div className="p-6 flex justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Repair Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header Section */}
            <div className="bg-custom-gradient text-white p-8 rounded-t-3xl flex items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold shadow">
                    {selectedTicket.ticket_number}
                  </span>
                  <h3 className="text-2xl font-bold">{selectedTicket.customer_name}</h3>
                </div>
                <p className="text-blue-100">{selectedTicket.vehicle_info}</p>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedTicket.status === 'completed' ? 'bg-green-500' : 
                    selectedTicket.status === 'in_progress' ? 'bg-yellow-500' : 
                    selectedTicket.status === 'awaiting_bill' ? 'bg-purple-500' : 
                    'bg-gray-500'
                  }`}>
                    {selectedTicket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="ml-auto bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-8" aria-label="Tabs">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'progress_logs', label: 'Progress Logs' },
                  { id: 'ordered_parts', label: 'Ordered Parts' },
                  { id: 'outsource_stock', label: 'Outsource Stock' },
                  { id: 'disassembled_parts', label: 'Disassembled Parts' },
                  { id: 'inspections', label: 'Inspections' },
                  { id: 'bill', label: 'Bill' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'ordered_parts' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Ordered Parts</h4>
                  {selectedTicket.ordered_parts && selectedTicket.ordered_parts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTicket.ordered_parts.map((part: OrderedPart) => (
                            <tr key={part.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.part_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(part.cost).toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.supplier}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(part.ordered_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No parts ordered yet.</p>
                      <p className="text-gray-400">Parts ordered for this service will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'overview' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Ticket Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p><strong>Title:</strong> {selectedTicket.title}</p>
                      <p><strong>Description:</strong> {selectedTicket.description}</p>
                      <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                      <p><strong>Type:</strong> {selectedTicket.type}</p>
                    </div>
                    <div>
                      <p><strong>Created At:</strong> {new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                      <p><strong>Updated At:</strong> {new Date(selectedTicket.updated_at).toLocaleDateString()}</p>
                      <p><strong>Mechanic:</strong> {(selectedTicket as any).mechanicName || 'Not assigned'}</p>
                      <p><strong>Cost:</strong> {(selectedTicket as any).cost || '$0.00'}</p>
                    </div>
                  </div>
                  {(selectedTicket as any).feedback && (
                    <div className="mt-6">
                      <h5 className="font-medium text-gray-900 mb-2">Customer Feedback</h5>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{(selectedTicket as any).feedback}</p>
                        <div className="mt-2">
                          {renderStars((selectedTicket as any).rating)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'progress_logs' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Progress Logs</h4>
                  {selectedTicket.progress_logs && selectedTicket.progress_logs.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTicket.progress_logs.map((log: ProgressLog) => (
                        <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-gray-600">{log.notes}</p>
                          <p className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No progress logs available.</p>
                      <p className="text-gray-400">Progress updates will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'disassembled_parts' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Disassembled Parts</h4>
                  {selectedTicket.disassembled_parts && selectedTicket.disassembled_parts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logged At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTicket.disassembled_parts.map((part: DisassembledPart) => (
                            <tr key={part.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.part_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.condition}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.status}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(part.logged_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No disassembled parts recorded.</p>
                      <p className="text-gray-400">Disassembled parts will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'outsource_stock' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Outsource Stock</h4>
                  {selectedTicket.outsource_stock && selectedTicket.outsource_stock.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTicket.outsource_stock.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.part_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supplier}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.requested_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No outsource stock items.</p>
                      <p className="text-gray-400">Outsource stock items will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inspections' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Inspection Checklist</h4>
                  {selectedTicket.inspections && selectedTicket.inspections.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTicket.inspections.map((inspection: Inspection) => (
                        <div key={inspection.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {inspectionChecklist.map((item) => (
                              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{item.label}</span>
                                {inspection[item.key as keyof Inspection] === 'Yes' ? (
                                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                                    <span className="mr-1">√</span> Yes
                                  </span>
                                ) : inspection[item.key as keyof Inspection] === 'No' ? (
                                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                                    <span className="mr-1">×</span> No
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">N/A</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium text-gray-700">General Condition</p>
                              <p className="text-gray-600">{inspection.general_condition}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Main Issue Resolved</p>
                              <p className="text-gray-600">{inspection.main_issue_resolved}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Reassembly Verified</p>
                              <p className="text-gray-600">{inspection.reassembly_verified}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Inspection Date</p>
                              <p className="text-gray-600">{new Date(inspection.inspection_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {inspection.notes && (
                            <div className="mt-4">
                              <p className="font-medium text-gray-700">Notes</p>
                              <p className="text-gray-600">{inspection.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No inspections recorded.</p>
                      <p className="text-gray-400">Inspection details will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bill' && billLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading bill details...</p>
                </div>
              )}

              {activeTab === 'bill' && billError && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg text-center">
                  {billError}
                </div>
              )}

              {activeTab === 'bill' && billDetails.bill && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Bill Details</h4>
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p><strong>Proforma Number:</strong> {billDetails.bill.proforma_number}</p>
                        <p><strong>Proforma Date:</strong> {billDetails.bill.proforma_date ? new Date(billDetails.bill.proforma_date).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Status:</strong> {billDetails.bill.status}</p>
                        <p><strong>Payment Type:</strong> {billDetails.bill.payment_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p><strong>Labor Cost:</strong> ${Number(billDetails.bill.labor_cost).toFixed(2)}</p>
                        <p><strong>Parts Cost:</strong> ${Number(billDetails.bill.parts_cost).toFixed(2)}</p>
                        <p><strong>Outsourced Parts Cost:</strong> ${Number(billDetails.bill.outsourced_parts_cost).toFixed(2)}</p>
                        <p><strong>Outsourced Labor Cost:</strong> ${Number(billDetails.bill.outsourced_labor_cost).toFixed(2)}</p>
                        <p><strong>Subtotal:</strong> ${Number(billDetails.bill.subtotal).toFixed(2)}</p>
                        <p><strong>Tax Rate:</strong> {Number(billDetails.bill.tax_rate).toFixed(2)}%</p>
                        <p><strong>Tax Amount:</strong> ${Number(billDetails.bill.tax_amount).toFixed(2)}</p>
                        <p><strong>Total:</strong> ${Number(billDetails.bill.total).toFixed(2)}</p>
                        <p><strong>Discount:</strong> ${Number(billDetails.bill.discount).toFixed(2)}</p>
                        <p><strong>Final Total:</strong> ${Number(billDetails.bill.final_total).toFixed(2)}</p>
                      </div>
                    </div>
                    {billDetails.bill.notes && (
                      <div className="mt-4">
                        <p><strong>Notes:</strong> {billDetails.bill.notes}</p>
                      </div>
                    )}
                  </div>

                  {billDetails.items && billDetails.items.length > 0 && (
                    <div className="mt-8">
                      <h5 className="font-medium text-gray-900 mb-4">Proforma Items</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {billDetails.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(item.unit_price).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(item.amount).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bill' && !billLoading && !billError && !billDetails.bill && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bill information available.</p>
                  <p className="text-gray-400">Bill details will appear here when available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;