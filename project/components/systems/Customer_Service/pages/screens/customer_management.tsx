import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Archive, Eye, Download, 
  Phone, Mail, MapPin, Car, ImageIcon, Trash2, CheckCircle 
} from 'lucide-react';
import Modal from '../../../../ui/Modal';
import { Badge } from '../../../../ui/badge';
import AddCustomerModal from '../pop up/AddCustomerModal';

// === Interfaces ===
const BASE_URL = 'http://localhost:5001';
const IMAGE_BASE_URL = `${BASE_URL}/uploads`; // Direct path to uploads

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  mileage: number;
  imageUrl: string | null;
}

interface Customer {
  customerId: string;
  readableCustomerId: string; // Now properly used
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
  isArchived?: boolean;
  customerImage?: string | null;
}

interface VehicleForm {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  mileage: string;
  vin: string;
  image: File | null;
  imagePreview: string | null;
}

type CustomerTypeFilter = 'all' | 'individual' | 'company';
type StatusFilter = 'all' | 'active' | 'archived';

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
  const [vehicles, setVehicles] = useState<VehicleForm[]>([
    {
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      color: '',
      mileage: '',
      vin: '',
      image: null,
      imagePreview: null,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Correctly build image URL
  const buildImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    // If it's already a full URL, return it
    if (path.startsWith('http')) return path;
    // If it starts with 'uploads/', just use IMAGE_BASE_URL
    if (path.startsWith('uploads/')) {
      return `${IMAGE_BASE_URL}/${path.substring(8)}`; // Remove 'uploads/' and rebuild
    }
    // Otherwise, assume it's relative
    return `${IMAGE_BASE_URL}/${path}`;
  };

  // Handle image upload for vehicle form (preview only)
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

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/customers/fetch`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();

        const transformedCustomers = data.map((customer: any) => ({
          ...customer,
          // ✅ Use actual readableCustomerId from DB
          readableCustomerId: customer.readableCustomerId || customer.customerId,
          isArchived: customer.isArchived || false,
          // ✅ Fix customer image URL
          customerImage: customer.customerImage ? buildImageUrl(customer.customerImage) : null,
          vehicles: Array.isArray(customer.vehicles)
            ? customer.vehicles.map((v: any) => ({
                id: v.id,
                make: v.make,
                model: v.model,
                year: v.year || 0,
                licensePlate: v.licensePlate || '',
                vin: v.vin || '',
                color: v.color || '',
                mileage: v.mileage || 0,
                imageUrl: v.imageUrl || (v.vehicle_image ? buildImageUrl(v.vehicle_image) : null),
              }))
            : [],
        }));

        setCustomers(transformedCustomers);
      } catch (err) {
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
      statusFilter === 'all' ||
      (statusFilter === 'active' && !customer.isArchived) ||
      (statusFilter === 'archived' && customer.isArchived);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Handlers
  const handleAddCustomer = () => setIsAddModalOpen(true);
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleArchiveCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/customers/${customerId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update customer status');
      setCustomers((prev) =>
        prev.map((c) =>
          c.customerId === customerId ? { ...c, isArchived: !c.isArchived } : c
        )
      );
    } catch (error) {
      console.error('Error archiving customer:', error);
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
        mileage: '',
        vin: '',
        image: null,
        imagePreview: null,
      },
    ]);
    setError(null);
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
        mileage: '',
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
    setVehicles((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmitVehicles = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    setError(null);

    try {
      for (const vehicle of vehicles) {
        if (!vehicle.make || !vehicle.model) {
          throw new Error('Make and Model are required for all vehicles');
        }
      }

      const formData = new FormData();
      const vehiclesDataForJson = vehicles.map((vehicle) => ({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || null,
        licensePlate: vehicle.licensePlate || null,
        color: vehicle.color || null,
        mileage: vehicle.mileage || null,
        vin: vehicle.vin || null,
      }));

      formData.append('vehicles', JSON.stringify(vehiclesDataForJson));
      formData.append('customerId', selectedCustomer.customerId);
      vehicles.forEach((vehicle) => {
        if (vehicle.image) {
          formData.append('images', vehicle.image);
        }
      });

      const response = await fetch(`${BASE_URL}/api/customers/add-vehicles`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to add vehicles';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // ✅ Extract new vehicles with correct image URLs
      const newVehiclesFromServer: Vehicle[] = [];
      if (result.newVehicles && Array.isArray(result.newVehicles)) {
        result.newVehicles.forEach((v: any) => {
          newVehiclesFromServer.push({
            id: v.id,
            make: v.make,
            model: v.model,
            year: v.year || 0,
            licensePlate: v.licensePlate || '',
            vin: v.vin || '',
            color: v.color || '',
            mileage: v.mileage || 0,
            imageUrl: v.imageUrl || null,
          });
        });
      } else {
        // Fallback: use form data + image URLs from response
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
            mileage: parseInt(formVehicle.mileage) || 0,
            imageUrl: imagePath ? buildImageUrl(imagePath) : formVehicle.imagePreview,
          });
        });
      }

      // Update both global and selected customer
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

      // Reset form
      setIsAddVehicleModalOpen(false);
      setVehicles([
        {
          make: '',
          model: '',
          year: '',
          licensePlate: '',
          color: '',
          mileage: '',
          vin: '',
          image: null,
          imagePreview: null,
        },
      ]);
    } catch (error) {
      console.error('Error adding vehicles:', error);
      setError(error instanceof Error ? error.message : 'Failed to add vehicles');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl font-medium text-gray-700">Loading customers...</div>
      </div>
    );
  }

  if (error && !isAddVehicleModalOpen) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl font-medium text-red-600">{error}</div>
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
            <option value="active">Active</option>
            <option value="archived">Archived</option>
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
                    <img
                      src={customer.customerImage || 'https://via.placeholder.com/40?text=Customer'}
                      alt={customer.name}
                      className="w-10 h-10 rounded-full object-cover mr-3 border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=👤';
                      }}
                    />
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
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(customer.registrationDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={customer.isArchived ? 'warning' : 'success'}>
                    {customer.isArchived ? 'Archived' : 'Active'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchiveCustomer(customer.customerId)}
                      className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded"
                    >
                      <Archive className="w-4 h-4" />
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
                <img
                  src={selectedCustomer.customerImage || 'https://via.placeholder.com/128?text=Customer'}
                  alt="Profile"
                  className="h-32 w-32 object-cover rounded-full border-4 border-white shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=👤';
                  }}
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 ring-4 ring-white">
                  <CheckCircle className="w-5 h-5 text-white" />
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
                  <Badge variant={selectedCustomer.isArchived ? 'warning' : 'success'}>
                    {selectedCustomer.isArchived ? 'Archived' : 'Active'}
                  </Badge>
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
                          <span className="text-gray-500">Mileage:</span>
                          <span className="ml-2">{v.mileage.toLocaleString()} km</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt={v.make}
                            className="h-40 w-full object-cover rounded-lg border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Vehicle+Image';
                            }}
                          />
                        ) : (
                          <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center border-dashed border-2 border-gray-400">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}
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
        }}
        title={`Add Vehicle - ${selectedCustomer?.name}`}
        size="xl"
      >
        <div className="space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}
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
                    <input
                      type="text"
                      value={vehicle.make}
                      onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Toyota"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      value={vehicle.model}
                      onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Camry"
                      required
                      disabled={isSubmitting}
                    />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                    <input
                      type="number"
                      value={vehicle.mileage}
                      onChange={(e) => handleVehicleChange(index, 'mileage', e.target.value)}
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
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
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
    </div>
  );
};

export default CustomerManagement;