import { useState, useEffect } from 'react';

// Define TypeScript interfaces based on updated API response
interface Vehicle {
  vehicle_id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  current_mileage: number;
  last_service_mileage: number;
  service_interval_km: number;
  next_service_mileage: number;
  remaining_km: number;
  service_status: 'urgent' | 'soon' | 'good';
}

interface Customer {
  customer_type: 'individual' | 'company';
  customer_id: string;
  customer_name: string;
  email: string;
  phone: string;
  address?: string;
  loyalty_points: number;
  vehicles: Vehicle[];
}

// Get status color based on service_status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'urgent': return 'bg-red-500';
    case 'soon': return 'bg-yellow-500';
    case 'good': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

// Get status text color based on service_status
const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'urgent': return 'text-red-600';
    case 'soon': return 'text-yellow-600';
    case 'good': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

// Get status display text
const getStatusDisplay = (status: string): string => {
  switch (status) {
    case 'urgent': return 'Urgent';
    case 'soon': return 'Due Soon';
    case 'good': return 'On Track';
    default: return 'Unknown';
  }
};

const NextMileagePage = () => {
  const [activeTab, setActiveTab] = useState<'good' | 'soon' | 'urgent'>('good');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://ipasystem.bymsystem.com/api/next-mileage/next-service-mileage');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch data');
        }
        
        setCustomers(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching next service mileage:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter customers and vehicles based on the active tab and search term
  const filteredCustomers = customers
    .filter(customer => {
      // Filter by customer name if search term is provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          customer.customer_name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(searchTerm)
        );
      }
      return true;
    })
    .map(customer => {
      // Filter vehicles based on the active tab
      const filteredVehicles = customer.vehicles.filter(vehicle => {
        if (activeTab === 'good') {
          return vehicle.service_status === 'good';
        } else if (activeTab === 'soon') {
          return vehicle.service_status === 'soon';
        } else if (activeTab === 'urgent') {
          return vehicle.service_status === 'urgent';
        }
        return true;
      });
      
      // Only include customers that have vehicles matching the filter
      if (filteredVehicles.length > 0) {
        return {
          ...customer,
          vehicles: filteredVehicles
        };
      }
      
      return null;
    })
    .filter(Boolean) as Customer[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Next Service Mileage</h1>
          <p className="text-gray-600">Track upcoming maintenance schedules for all customer vehicles</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by customer name, email or phone..."
                  className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveTab('good')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'good'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Good
              </button>
              <button
                onClick={() => setActiveTab('soon')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'soon'
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Soon
              </button>
              <button
                onClick={() => setActiveTab('urgent')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'urgent'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Urgent
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-gray-600 text-lg">Loading customer data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Customers List */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">
                  {searchTerm 
                    ? 'No customers found matching your search criteria.' 
                    : 'No customers found with the selected criteria.'}
                </p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-md p-4 mb-4">
                  <p className="text-gray-600">
                    Showing <span className="font-semibold">{filteredCustomers.length}</span> customer{filteredCustomers.length !== 1 ? 's' : ''} 
                    {searchTerm && ` matching "${searchTerm}"`} 
                    with <span className="font-semibold">{activeTab === 'good' ? 'Good' : activeTab === 'soon' ? 'Due Soon' : 'Urgent'}</span> service status
                  </p>
                </div>
                
                {filteredCustomers.map(customer => (
                  <div key={customer.customer_id} className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
                    {/* Customer Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{customer.customer_name}</h2>
                          <p className="text-gray-600">
                            {customer.email} • {customer.phone}
                          </p>
                          {customer.address && (
                            <p className="text-gray-600 text-sm mt-1">{customer.address}</p>
                          )}
                        </div>
                        <div className="mt-2 md:mt-0 flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {customer.loyalty_points} loyalty points
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            customer.customer_type === 'individual' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {customer.customer_type === 'individual' ? 'Individual' : 'Company'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicles List */}
                    <div className="divide-y divide-gray-100">
                      {customer.vehicles.map(vehicle => {
                        const statusColor = getStatusColor(vehicle.service_status);
                        const statusTextColor = getStatusTextColor(vehicle.service_status);
                        const statusDisplay = getStatusDisplay(vehicle.service_status);
                        
                        return (
                          <div key={vehicle.vehicle_id} className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="mb-4 md:mb-0">
                                <h3 className="text-lg font-semibold text-gray-800">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </h3>
                                <div className="flex items-center mt-1 text-gray-600">
                                  <span className="mr-4">{vehicle.license_plate}</span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {vehicle.color}
                                  </span>
                                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {vehicle.service_interval_km}km interval
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Current Mileage</p>
                                  <p className="text-lg font-bold text-gray-800">{vehicle.current_mileage.toLocaleString()}</p>
                                </div>
                                
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Service At</p>
                                  <p className="text-lg font-bold text-gray-800">{vehicle.next_service_mileage.toLocaleString()}</p>
                                </div>
                                
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Remaining</p>
                                  <p className={`text-lg font-bold ${vehicle.remaining_km < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                    {vehicle.remaining_km < 0 ? `${Math.abs(vehicle.remaining_km).toLocaleString()} overdue` : vehicle.remaining_km.toLocaleString()}
                                  </p>
                                </div>
                                
                                <div className="flex items-center">
                                  <span className={`inline-block w-3 h-3 rounded-full ${statusColor} mr-2`}></span>
                                  <span className={`font-medium ${statusTextColor}`}>
                                    {statusDisplay}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Last Service: {vehicle.last_service_mileage.toLocaleString()}</span>
                                <span>Next Service: {vehicle.next_service_mileage.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${statusColor}`} 
                                  style={{ 
                                    width: `${Math.min(100, Math.max(0, ((vehicle.current_mileage - vehicle.last_service_mileage) / (vehicle.next_service_mileage - vehicle.last_service_mileage)) * 100))}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NextMileagePage;