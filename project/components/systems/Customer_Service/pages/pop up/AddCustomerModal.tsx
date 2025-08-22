import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Car, Plus, Save, Briefcase, CheckCircle, Image as ImageIcon, Trash2 } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Vehicle {
  make: string;
  model: string;
  year: string | null;
  licensePlate: string | null;
  vin: string | null;
  color: string | null;
  mileage: string | null;
  image: File | null;
  imagePreview: string | null;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose }) => {
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

  // New: Customer image state
  const [customerImage, setCustomerImage] = useState<File | null>(null);
  const [customerImagePreview, setCustomerImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState('');

  const handleCustomerChange = (field: string, value: string) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    setVehicles((prev) =>
      prev.map((vehicle, i) =>
        i === index
          ? { ...vehicle, [field]: value.trim() === '' ? null : value }
          : vehicle
      )
    );
  };

  // Customer image upload
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

  // Vehicle image upload
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

  const resetForm = () => {
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
    setError('');
    setIsSuccess(false);
    setCreatedCustomerId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    try {
      // Validation
      if (!customerData.name.trim()) throw new Error('Name is required');
      if (!customerData.email.trim()) throw new Error('Email is required');
      if (!customerData.phone.trim()) throw new Error('Phone number is required');
      if (customerData.customerType === 'company' && !customerData.companyName.trim())
        throw new Error('Company name is required for business customers');
      if (vehicles.length === 0) throw new Error('At least one vehicle is required');
      if (vehicles.some((v) => !v.make.trim() || !v.model.trim()))
        throw new Error('Make and Model are required for all vehicles');

      // Prepare FormData
      const formData = new FormData();

      // Add customer data
      formData.append('customerType', customerData.customerType);
      formData.append('name', customerData.name);
      formData.append('email', customerData.email);
      formData.append('phone', customerData.phone);
      if (customerData.address) formData.append('address', customerData.address);
      if (customerData.emergencyContact)
        formData.append('emergencyContact', customerData.emergencyContact);
      if (customerData.notes) formData.append('notes', customerData.notes);
      if (customerData.companyName) formData.append('companyName', customerData.companyName);
      formData.append('registrationDate', customerData.registrationDate);
      formData.append('totalServices', customerData.totalServices.toString());

      // --- CRITICAL: Append images in correct order ---
      // 1. Customer image first
      if (customerImage) {
        formData.append('images', customerImage); // This will be req.files[0]
      }

      // 2. Then vehicle images (in order)
      vehicles.forEach((vehicle) => {
        if (vehicle.image) {
          formData.append('images', vehicle.image); // These will be req.files[1], [2], ...
        }
      });

      // Add vehicles data as JSON string
      const vehiclesData = vehicles.map((vehicle) => ({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        color: vehicle.color,
        mileage: vehicle.mileage,
      }));
      formData.append('vehicles', JSON.stringify(vehiclesData));

      // Submit
      const response = await fetch('http://localhost:5001/api/customers', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register customer');
      }

      setIsSuccess(true);
      setCreatedCustomerId(data.customer_id);

      // Reset and close after 3 seconds
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity bg-gray bg-opacity-55" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block w-full text-black max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Register New Customer</h3>
                <p className="text-sm text-gray-500">Add customer information and vehicle details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Registered Successfully!</h3>
              <p className="text-sm text-gray-500 mb-2">
                Customer ID: <span className="font-mono font-semibold">{createdCustomerId}</span>
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h4>

                {/* Customer Photo Upload */}
                <div className="md:col-span-2 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Photo</label>
                  <div className="flex items-center space-x-4">
                    {customerImagePreview ? (
                      <div className="relative">
                        <img
                          src={customerImagePreview}
                          alt="Customer preview"
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeCustomerImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          disabled={isSubmitting}
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
                          {customerImagePreview ? 'Change Photo' : 'Upload Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomerImageUpload}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Type *
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          checked={customerData.customerType === 'individual'}
                          onChange={() => handleCustomerChange('customerType', 'individual')}
                          disabled={isSubmitting}
                        />
                        <span className="ml-2 text-gray-700">Individual</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          checked={customerData.customerType === 'company'}
                          onChange={() => handleCustomerChange('customerType', 'company')}
                          disabled={isSubmitting}
                        />
                        <span className="ml-2 text-gray-700">Company</span>
                      </label>
                    </div>
                  </div>

                  {customerData.customerType === 'company' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
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
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {customerData.customerType === 'company' ? 'Contact Person Name *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={customerData.name}
                      onChange={(e) => handleCustomerChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
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
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
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
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={customerData.emergencyContact}
                      onChange={(e) => handleCustomerChange('emergencyContact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Emergency contact number"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={customerData.notes}
                      onChange={(e) => handleCustomerChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Address
                    </label>
                    <input
                      type="text"
                      value={customerData.address}
                      onChange={(e) => handleCustomerChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full address"
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Vehicle
                  </button>
                </div>

                {vehicles.map((vehicle, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Make *
                        </label>
                        <input
                          type="text"
                          value={vehicle.make}
                          onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Toyota"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model *
                        </label>
                        <input
                          type="text"
                          value={vehicle.model}
                          onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Camry"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={vehicle.year || ''}
                          onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="2020"
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          License Plate
                        </label>
                        <input
                          type="text"
                          value={vehicle.licensePlate || ''}
                          onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ABC-123"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          value={vehicle.color || ''}
                          onChange={(e) => handleVehicleChange(index, 'color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Silver"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Mileage
                        </label>
                        <input
                          type="number"
                          value={vehicle.mileage || ''}
                          onChange={(e) => handleVehicleChange(index, 'mileage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="50000"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          VIN (Vehicle Identification Number)
                        </label>
                        <input
                          type="text"
                          value={vehicle.vin || ''}
                          onChange={(e) => handleVehicleChange(index, 'vin', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="1HGBH41JXMN109186"
                          maxLength={17}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Image
                        </label>
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                              />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 5MB)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Register Customer
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal;