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
} from 'lucide-react';

const BASE_URL = 'https://ipasystem.bymsystem.com';
const IMAGE_BASE_URL = `${BASE_URL}/uploads`;

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
  image: string;
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
  imageUrl?: string;
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

  // Fetch all customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/customer-manege/fetch`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const data = await response.json();
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
            image: customer.customerImage || 'https://randomuser.me/api/portraits/men/32.jpg',
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
              current_mileage: v.current_current_mileage || v.current_mileage || 0,
              imageUrl: v.imageUrl
            })) : [],
          };
        });
        setCustomers(mappedCustomers);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customer data. Check if the server is running.');
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
      const response = await fetch(`${BASE_URL}/api/bill/car-bills/${ticketNumber}`);
      if (!response.ok) throw new Error('Failed to fetch bill details');
      const data = await response.json();
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
    } finally {
      setBillLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerClick = async (customer: Customer) => {
    try {
      // Fetch customer details
      const customerResponse = await fetch(`${BASE_URL}/api/customer-manege/${customer.id}`);
      if (!customerResponse.ok) throw new Error('Customer not found');
      const customerData = await customerResponse.json();
      
      // Fetch vehicles for this customer
      const vehiclesResponse = await fetch(`${BASE_URL}/api/customer-manege/${customer.id}/vehicles`);
      if (!vehiclesResponse.ok) throw new Error('Failed to fetch vehicles');
      const vehiclesData = await vehiclesResponse.json();
      
      // Fetch completed tickets for this customer (lightweight API)
      const ticketsResponse = await fetch(`${BASE_URL}/api/customer-manege/completed-tickets/${customer.id}`);
      if (!ticketsResponse.ok) throw new Error('Failed to fetch tickets');
      const ticketsData = await ticketsResponse.json();
      
      // Map tickets to history format
      const history = ticketsData.map((ticket: any) => ({
        ticketNumber: ticket.ticket_number,
        car: ticket.vehicle_info,
        licensePlate: ticket.license_plate,
        date: ticket.updated_at,
        job: ticket.title,
        rating: null,
      }));

      const isCompany = customerData.customer_type === 'company';
      const mappedCustomer: Customer = {
        id: customerData.customer_id,
        name: isCompany ? customerData.contact_person_name : customerData.name,
        specialty: isCompany ? `${customerData.company_name} (Company)` : 'Individual Customer',
        rating: '4.5',
        reviews: history.length,
        years: Math.max(
          1,
          Math.floor((Date.now() - new Date(customerData.registration_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
        ),
        status: 'Active',
        image: customerData.customerImage || 'https://randomuser.me/api/portraits/men/32.jpg',
        email: customerData.email || 'N/A',
        phone: customerData.phone || 'N/A',
        address: customerData.address || 'N/A',
        mechanic: 'Not Assigned',
        history: history,
        vehicles: vehiclesData.vehicles ? vehiclesData.vehicles.map((v: any) => ({
          id: v.id,
          year: v.year,
          make: v.make,
          model: v.model,
          licensePlate: v.licensePlate,
          vin: v.vin,
          color: v.color,
          current_mileage: v.current_current_mileage || v.current_mileage || 0,
          imageUrl: v.imageUrl
        })) : [],
      };
      setSelectedCustomer(mappedCustomer);
    } catch (err) {
      console.error('Error loading customer details:', err);
      alert('Failed to load detailed customer information.');
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
      
      const response = await fetch(`${BASE_URL}/api/customer-manege/completed-tickets/${customerId}/${ticketNumber}`);
      if (!response.ok) throw new Error('Failed to fetch ticket details');
      
      const ticketData = await response.json();
      setSelectedTicket(ticketData);
    } catch (err) {
      console.error('Error loading ticket details:', err);
      alert('Failed to load detailed ticket information.');
      setSelectedTicket({
        ticket_number: ticket.ticketNumber,
        customer_name: selectedCustomer?.name || '',
        vehicle_info: ticket.car,
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
                <img
                  src={customer.image}
                  alt={customer.name}
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
              <img
                src={selectedCustomer.image}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                alt={selectedCustomer.name}
              />
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
              {selectedVehicle.imageUrl && (
                <img
                  src={selectedVehicle.imageUrl}
                  alt="Vehicle"
                  className="w-full h-64 object-cover rounded-2xl shadow-md"
                />
              )}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-gray-800">Vehicle Details</h4>
                <div className="space-y-3 text-gray-700">
                  <p><strong>License Plate:</strong> {selectedVehicle.licensePlate}</p>
                  <p><strong>VIN:</strong> <span className="font-mono">{selectedVehicle.vin}</span></p>
                  <p><strong>Color:</strong> {selectedVehicle.color}</p>
                  <p><strong>current_mileage:</strong> {selectedVehicle.current_mileage?.toLocaleString()} miles</p>
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