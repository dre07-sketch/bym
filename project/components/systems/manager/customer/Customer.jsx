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

const BASE_URL = 'http://localhost:5001';
const IMAGE_BASE_URL = `${BASE_URL}/uploads`;

const Customer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/customer-manege/fetch`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const data = await response.json();
        const mappedCustomers = data.map((customer) => {
          const history = customer.vehicles.map((vehicle, idx) => {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() - idx * 35);
            return {
              ticketNumber: `TKT-${customer.customerId}-${String(idx + 1).padStart(2, '0')}`,
              car: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              licensePlate: vehicle.licensePlate || 'N/A',
              issue: ['Engine misfiring', 'Brake noise', 'Transmission slipping', 'AC not cooling', 'Battery failure'][idx % 5],
              partsChanged: ['Spark plugs, ignition coils', 'Brake pads, rotors', 'Transmission seals', 'AC compressor', 'Battery'][idx % 5],
              howFixed: 'Performed diagnostic and replaced necessary components. Vehicle tested successfully.',
              job: ['Engine Repair', 'Brake Replacement', 'Transmission Service', 'AC Repair', 'Battery Replacement'][idx % 5],
              rating: (4.5 + Math.random() * 0.6).toFixed(1),
              details: `Full service completed for ${vehicle.make} ${vehicle.model}. All systems operational.`,
              date: baseDate.toISOString().split('T')[0],
              cost: `$${(100 + idx * 150).toFixed(0)}`,
              feedback: `Great service as always. Fast, professional, and transparent. Love the care they give my ${vehicle.make}. Will definitely come back.`,
              mechanicName: ['Alex Thompson', 'Sarah Wilson', 'Mike Chen', 'Emily Rodriguez'][idx % 4],
              vehicleImage: vehicle.imageUrl || null,
            };
          });
          return {
            id: customer.customerId,
            name: customer.name,
            specialty: customer.customerType === 'company'
              ? `${customer.companyName} (Company)`
              : 'Individual Customer',
            rating: history.length > 0
              ? (history.reduce((sum, h) => sum + parseFloat(h.rating), 0) / history.length).toFixed(1)
              : '4.5',
            reviews: history.length,
            years: Math.max(
              1,
              Math.floor((Date.now() - new Date(customer.registrationDate)) / (1000 * 60 * 60 * 24 * 365))
            ),
            status: 'Active',
            image: customer.customerImage || 'https://randomuser.me/api/portraits/men/32.jpg',
            email: customer.email || 'N/A',
            phone: customer.phone || 'N/A',
            address: customer.address || 'N/A',
            mechanic: history[0]?.mechanicName || 'Not Assigned',
            history: history,
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

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerClick = async (customer) => {
    try {
      const response = await fetch(`${BASE_URL}/api/customer-manege/${customer.id}`);
      if (!response.ok) throw new Error('Customer not found');
      const data = await response.json();
      const isCompany = data.customer_type === 'company';
      const mappedCustomer = {
        id: data.customer_id,
        name: isCompany ? data.contact_person_name : data.name,
        companyName: isCompany ? data.company_name : null,
        customerType: data.customer_type,
        email: data.email || 'N/A',
        phone: data.phone || 'N/A',
        address: data.address || 'N/A',
        status: 'Active',
        image: data.customerImage || 'https://randomuser.me/api/portraits/men/32.jpg',
        years: Math.max(
          1,
          Math.floor((Date.now() - new Date(data.registration_date)) / (1000 * 60 * 60 * 24 * 365))
        ),
        specialty: isCompany ? `${data.company_name} (Company)` : 'Individual Customer',
        totalServices: data.total_services || 0,
        reviews: data.vehicles?.length || 0,
        rating: ((4.5 + Math.random() * 0.5).toFixed(1)),
        history: Array.isArray(data.vehicles)
          ? data.vehicles.map((v, idx) => ({
              id: v.id,
              make: v.make,
              model: v.model,
              year: v.year,
              licensePlate: v.license_plate || 'N/A',
              vin: v.vin,
              color: v.color,
              mileage: v.mileage,
              imageUrl: v.imageUrl || null,
              ticketNumber: `TKT-${data.customer_id}-0${idx + 1}`,
              job: ['Maintenance', 'Inspection', 'Oil Change', 'Brake Service'][idx % 4],
              issue: ['Routine checkup', 'Slight brake noise', 'Oil leak', 'Worn pads'][idx % 4],
              date: new Date(Date.now() - idx * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              cost: `$${(80 + idx * 100).toFixed(0)}`,
              rating: (4.5 + Math.random() * 0.5).toFixed(1),
              mechanicName: ['Alex Thompson', 'Sarah Wilson', 'Mike Chen', 'Emily Rodriguez'][idx % 4],
              feedback: `Vehicle serviced well. Professional and fast.`,
            }))
          : [],
      };
      setSelectedCustomer(mappedCustomer);
    } catch (err) {
      console.error('Error loading customer details:', err);
      alert('Failed to load detailed customer information.');
      setSelectedCustomer(customer);
    }
  };

  const handleVehicleClick = async (vehicle) => {
    try {
      const response = await fetch(`${BASE_URL}/api/customer-manege/${selectedCustomer.id}/vehicles`);
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const result = await response.json();
      const fullVehicle = result.vehicles.find(v => v.id === vehicle.id);
      setSelectedVehicle(fullVehicle || vehicle);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setSelectedVehicle(vehicle);
    }
  };

  const renderStars = (rating) => {
    const numRating = parseFloat(rating);
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
                    <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                      <User className="w-3 h-3 mr-1" /> {customer.years} yrs
                    </span>
                    <span className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                      <Star className="w-3 h-3 mr-1 text-yellow-500" /> {customer.rating}
                    </span>
                    <span className="flex items-center bg-blue-100 px-2 py-1 rounded-full">
                      <Wrench className="w-3 h-3 mr-1" /> {customer.reviews}
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
      {selectedCustomer && !selectedVehicle && !selectedRepair && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-3xl flex items-center">
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
                    {selectedCustomer.history.map((v, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white rounded-xl hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                        onClick={() => handleVehicleClick(v)}
                      >
                        {v.imageUrl && (
                          <img
                            src={v.imageUrl}
                            alt="Vehicle"
                            className="w-20 h-12 object-cover rounded-lg mb-2"
                          />
                        )}
                        <p className="font-medium">{v.year} {v.make} {v.model}</p>
                        <p className="text-sm text-gray-500">{v.licensePlate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right: Recent Repairs */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center text-gray-800">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" /> Recent Repairs
                </h3>
                {selectedCustomer.history.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedRepair(item)}
                    className="w-full text-left bg-white p-4 rounded-xl shadow hover:shadow-lg transition-all border border-gray-100"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{item.car}</p>
                        <p className="text-sm text-gray-500">{item.issue}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-gray-500">{item.date}</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                          {item.ticketNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-blue-600">{item.job}</span>
                      {renderStars(item.rating)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[85vh]">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl flex items-center">
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
                  <p><strong>Mileage:</strong> {selectedVehicle.mileage.toLocaleString()} miles</p>
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
      {selectedRepair && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-8 rounded-t-3xl flex items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-bold shadow">
                    {selectedRepair.ticketNumber}
                  </span>
                  <h3 className="text-2xl font-bold">{selectedRepair.car}</h3>
                </div>
                <p className="text-green-100">{selectedRepair.job} • {selectedRepair.date}</p>
              </div>
              <button
                onClick={() => setSelectedRepair(null)}
                className="ml-auto bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h4 className="font-bold mb-4 flex items-center text-gray-800">
                    <Car className="w-5 h-5 mr-2 text-blue-600" /> Vehicle
                  </h4>
                  <p><strong>Model:</strong> {selectedRepair.car}</p>
                  <p><strong>License:</strong> {selectedRepair.licensePlate}</p>
                  {selectedRepair.vehicleImage && (
                    <img
                      src={selectedRepair.vehicleImage}
                      alt="Repair"
                      className="w-full h-32 object-cover rounded-lg mt-3 border"
                    />
                  )}
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h4 className="font-bold mb-4 flex items-center text-gray-800">
                    <Settings className="w-5 h-5 mr-2 text-blue-600" /> Service
                  </h4>
                  <p><strong>Issue:</strong> {selectedRepair.issue}</p>
                  <p><strong>Parts Changed:</strong> {selectedRepair.partsChanged}</p>
                  <p><strong>Mechanic:</strong> {selectedRepair.mechanicName}</p>
                  <p><strong>Cost:</strong> <span className="font-semibold">{selectedRepair.cost}</span></p>
                  <div className="mt-3">{renderStars(selectedRepair.rating)}</div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h4 className="font-bold mb-3 text-blue-800">Service Description</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedRepair.howFixed}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h4 className="font-bold mb-3 text-gray-800">Customer Feedback</h4>
                  <blockquote className="italic text-gray-700 pl-4 border-l-4 border-blue-300">
                    "{selectedRepair.feedback}"
                  </blockquote>
                  <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                    {renderStars(selectedRepair.rating)}
                    <span>{selectedRepair.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;