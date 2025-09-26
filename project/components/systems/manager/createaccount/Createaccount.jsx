import React, { useState } from 'react';
import { UserPlus, Mail, Lock, Eye, EyeOff, Briefcase, Phone, MapPin, Calendar, Award, DollarSign, Clock, ArrowLeft, Upload, XCircle, ChevronDown, CheckCircle } from 'lucide-react';
import axios from 'axios';

const CreateAccount = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    specialty: '',
    image: null,
    isMechanicPermanent: 'Permanent',
    phoneNumber: '',
    address: '',
    joinDate: '',
    expertise: '',
    experience: '',
    salary: '',
    workingHours: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

 const roles = [
  'Manager',          // → maps to "manager"
  'Part Coordinator', // → maps to "part-coordinator"
  'Stock Manager',    // → maps to "stock-manager"
  'tool-manager',    // → maps to "tool-manager"
  'Inspection',       // → maps to "inspector"
  'Finance/HR',       // → maps to "finance"
  'Reception',        // → maps to "customer-service"
  'Communication',    // → maps to "communication"
  'Marketing',        // → maps to "marketing"
];



  const specialties = [
    'Mechanic',
    'Electrician',
    'Auto paint technician',
    'Auto body technician',
  ];

  const inspectionSpecialties = [
    'Petrol Vehicle',
    'Electric Vehicle'
  ];

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();

    // Validate password match only if not Mechanic
    if (formData.role !== 'Mechanic') {
      if (formData.password !== formData.confirmPassword) {
        setPasswordMatch(false);
        return;
      }
      setPasswordMatch(true);
    }

    // For Inspection role, specialty is required
    if (formData.role === 'Inspection' && !formData.specialty) {
      setSubmitError('Please select a vehicle type for Inspection role.');
      return;
    }

    setSubmitError(null);
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formPayload = new FormData();

      formPayload.append('fullName', formData.fullName);
      formPayload.append('email', formData.email);
      formPayload.append('role', formData.role);

      if (formData.role !== 'Mechanic') {
        formPayload.append('password', formData.password);
      }

      // Specialty: only for Mechanic and Inspection
      if (formData.role === 'Mechanic' || formData.role === 'Inspection') {
        formPayload.append('specialty', formData.specialty);
      }

      if (formData.role === 'Mechanic') {
        formPayload.append('isMechanicPermanent', formData.isMechanicPermanent);
        formPayload.append('expertise', formData.expertise);
        formPayload.append('experience', formData.experience);
      }

      formPayload.append('phoneNumber', formData.phoneNumber);
      formPayload.append('address', formData.address);
      formPayload.append('joinDate', formData.joinDate);
      formPayload.append('salary', formData.salary);
      formPayload.append('workingHours', formData.workingHours);

      if (formData.image) {
        formPayload.append('image', formData.image);
      }

      const response = await axios.post('https://ipasystem.bymsystem.com/api/employees', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewEmployeeId(response.data.employeeId);
      setShowSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          specialty: '',
          image: null,
          isMechanicPermanent: 'Permanent',
          phoneNumber: '',
          address: '',
          joinDate: '',
          expertise: '',
          experience: '',
          salary: '',
          workingHours: ''
        });
        setStep(1);
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating employee:', error);
      setSubmitError(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isMechanic = formData.role === 'Mechanic';
  const isInspection = formData.role === 'Inspection';

  return (
    <div className="min-h-screen flex items-center justify-center p-1 relative">
      {/* Success Popup Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
              <p className="text-gray-600 mb-4">
                Employee #{newEmployeeId} created successfully.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full animate-progress" style={{ animationDuration: '3s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-custom-gradient px-6 py-6 h-28">
          <h2 className="text-xl font-bold text-white">
            {step === 1 ? "Add New Employee" : "Professional Details"}
          </h2>
          <div className="mt-4 flex items-center">
            <div className="flex-1 bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${step === 1 ? '50%' : '100%'}` }}
              ></div>
            </div>
            <div className="ml-4 text-sm text-blue-100">
              Step {step} of 2
            </div>
          </div>
        </div>

        <div className="p-6">
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {submitError}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4 text-black">
              <div className="flex justify-center">
                <label className="relative group cursor-pointer">
                  <div
                    className={`w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 
                    ${!formData.image && 'bg-gray-100'} flex items-center justify-center`}
                  >
                    {formData.image ? (
                      <img
                        src={URL.createObjectURL(formData.image)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => updateFormData('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="employee@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => updateFormData('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mechanic Specialty (Dropdown) */}
                {isMechanic && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
                      <select
                        required
                        value={formData.specialty}
                        onChange={(e) => updateFormData('specialty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select a specialty</option>
                        {specialties.map((specialty) => (
                          <option key={specialty} value={specialty}>
                            {specialty}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={formData.isMechanicPermanent === 'Permanent'}
                            onChange={() => updateFormData('isMechanicPermanent', 'Permanent')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Permanent</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={formData.isMechanicPermanent === 'Temporary'}
                            onChange={() => updateFormData('isMechanicPermanent', 'Temporary')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Temporary</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Inspection Specialty (Radio Buttons) */}
                {isInspection && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                    <div className="flex flex-col space-y-2">
                      {inspectionSpecialties.map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="specialty"
                            value={type}
                            checked={formData.specialty === type}
                            onChange={(e) => updateFormData('specialty', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Password & Confirm Password (for non-Mechanics: includes Inspection) */}
                {!isMechanic && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm pr-10"
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm pr-10 ${
                            !passwordMatch ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {!passwordMatch && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-sm"
                >
                  Next
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        required
                        value={formData.salary}
                        onChange={(e) => updateFormData('salary', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter salary"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="date"
                        required
                        value={formData.joinDate}
                        onChange={(e) => updateFormData('joinDate', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter address"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours *</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        required
                        value={formData.workingHours}
                        onChange={(e) => updateFormData('workingHours', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g., Monday-Friday, 9AM-5PM"
                      />
                    </div>
                  </div>

                  {isMechanic && (
                    <>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expertise *</label>
                        <div className="relative">
                          <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            required
                            value={formData.expertise}
                            onChange={(e) => updateFormData('expertise', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Your expertise"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="number"
                            min="0"
                            required
                            value={formData.experience}
                            onChange={(e) => updateFormData('experience', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Years of experience"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-70"
                >
                  {isSubmitting ? 'Creating...' : 'Add Employee'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default CreateAccount;