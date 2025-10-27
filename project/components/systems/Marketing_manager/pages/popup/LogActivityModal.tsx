// components/marketing/modals/LogActivityModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Building,
  Mail,
  Users,
  Clock,
  Trash2,
  Plus,
  X,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Activity,
} from 'lucide-react';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export interface Contact {
  id: string;
  name: string;
  phone: string;
  address: string;
  company?: string;
  email?: string;
}

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: number;
    date: string;
    activities: string;
    location: string;
    contacts: Contact[];
    followUpRequired: boolean;
    followUpDate?: string;
    followUpNotes?: string;
    status?: string;
  };
  isEditing?: boolean;
  onSuccess?: () => void;
  onSubmit?: (data: {
    date: string;
    activities: string;
    location: string;
    contacts: Contact[];
    followUpRequired: boolean;
    followUpDate?: string;
    followUpNotes?: string;
    status: string;
  }) => void;
}

interface UserInfo {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  initialData,
  isEditing = false,
  onSuccess,
}) => {
  const [formData, setFormData] = React.useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    activities: initialData?.activities || '',
    location: initialData?.location || '',
    contacts: initialData?.contacts.length
      ? initialData.contacts.map((c) => ({ ...c, id: c.id || generateId() }))
      : [
          {
            id: generateId(),
            name: '',
            phone: '',
            address: '',
            company: '',
            email: '',
          },
        ],
    followUpRequired: initialData?.followUpRequired || false,
    followUpDate: initialData?.followUpDate || '',
    followUpNotes: initialData?.followUpNotes || '',
    status: initialData?.status || 'completed',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user information when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setErrorMessage('Authentication token not found. Please log in again.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('https://ipasystem.bymsystem.com/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserInfo(data.user);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setErrorMessage('Failed to load user information. Please try again.');
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          id: generateId(),
          name: '',
          phone: '',
          address: '',
          company: '',
          email: '',
        },
      ],
    }));
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length > 1) {
      setFormData((prev) => ({
        ...prev,
        contacts: prev.contacts.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    if (!formData.date || !formData.activities || !formData.location) {
      setErrorMessage('Date, activities, and location are required.');
      return false;
    }

    const validContacts = formData.contacts.filter((c) => c.name.trim() !== '');
    if (validContacts.length === 0) {
      setErrorMessage('At least one contact with a name is required.');
      return false;
    }

    for (const c of validContacts) {
      if (!c.phone.trim()) {
        setErrorMessage(`Phone number is required for contact: ${c.name}`);
        return false;
      }
      if (!c.address.trim()) {
        setErrorMessage(`Address is required for contact: ${c.name}`);
        return false;
      }
    }

    if (formData.followUpRequired && !formData.followUpDate) {
      setErrorMessage('Follow-up date is required when follow-up is marked.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const filteredContacts = formData.contacts.filter((c) => c.name.trim() !== '');
    
    // Create payload with user information
    const payload = {
      ...formData,
      contacts: filteredContacts,
      // Add employee information from userInfo
      employeeName: userInfo?.full_name, // Use full_name from userInfo
    };

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage(null);

    const API_BASE = 'https://ipasystem.bymsystem.com';

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setErrorMessage('Authentication token not found. Please log in again.');
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      const url = isEditing && initialData?.id
        ? `${API_BASE}/api/marketing-activities/${initialData.id}`
        : `${API_BASE}/api/marketing-activities/activity-post`;

      const method = isEditing && initialData?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 800);
      } else {
        const error = await res.json();
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
        setSubmitStatus('error');
      }
    } catch (err) {
      console.error('Network error:', err);
      setErrorMessage(
        'Failed to connect to server. Make sure the backend is running at https://ipasystem.bymsystem.com'
      );
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-700">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/20 via-blue-900/10 to-purple-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-500">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-white/20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100 to-transparent rounded-full opacity-30 -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100 to-transparent rounded-full opacity-30 translate-y-24 -translate-x-24"></div>

        {/* Header */}
        <div className="relative p-8 border-b border-slate-200/50 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                {submitStatus === 'success' ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <Calendar className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                  {isEditing ? 'Edit Activity' : 'Log Daily Activity'}
                </h2>
                <p className="text-slate-600 mt-1">
                  {userInfo ? `Logging as ${userInfo.full_name}` : 'Track your daily interactions and activities'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="group p-3 rounded-2xl hover:bg-red-50 transition-all duration-300 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative p-8 space-y-10">
          {/* Success Feedback */}
          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center animate-fade-in">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">Success!</h3>
              <p className="text-green-600">Activity has been saved successfully.</p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start space-x-3 text-red-700">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {submitStatus !== 'success' && (
            <>
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">Basic Information</h3>
                </div>
                
                {/* Employee Name Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Employee Name</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userInfo?.full_name || ''}
                      readOnly
                      className="w-full px-5 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-slate-900 font-medium shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>Date</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-slate-900 font-medium shadow-sm hover:shadow-md group-hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>Location</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Where did you go today?"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-slate-900 placeholder-slate-400 shadow-sm hover:shadow-md group-hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Activities & Accomplishments</label>
                  <div className="relative">
                    <textarea
                      placeholder="Describe your marketing activities, meetings, calls, and achievements..."
                      value={formData.activities}
                      onChange={(e) => handleInputChange('activities', e.target.value)}
                      rows={5}
                      required
                      disabled={isSubmitting}
                      className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all duration-300 text-slate-900 placeholder-slate-400 shadow-sm hover:shadow-md group-hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Status Field */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">Activity Status</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Select Status</label>
                    <div className="relative">
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 font-medium shadow-sm hover:shadow-md appearance-none group-hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="completed">✅ Completed</option>
                        <option value="awaiting-follow-up">🟡 Awaiting Follow-up</option>
                        <option value="in-progress">🔵 In Progress</option>                   
                        <option value="lost">🔴 Lost</option>
                      </select>
                      {/* Custom Arrow */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">People You Connected With</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addContact}
                    disabled={isSubmitting}
                    className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-2xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 font-semibold text-sm border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    Add Contact
                  </button>
                </div>
                <div className="space-y-6">
                  {formData.contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-2 border-slate-200/50 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg">Contact {index + 1}</h4>
                        </div>
                        {formData.contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            disabled={isSubmitting}
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200 disabled:opacity-40"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="relative group/field">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                              <User className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={contact.name}
                              onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                              required
                              disabled={isSubmitting}
                              className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-100"
                            />
                          </div>
                          <div className="relative group/field">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                              <Phone className="w-4 h-4" />
                            </div>
                            <input
                              type="tel"
                              placeholder="Phone Number"
                              value={contact.phone}
                              onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                              required
                              disabled={isSubmitting}
                              className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-100"
                            />
                          </div>
                        </div>
                        <div className="relative group/field">
                          <div className="absolute left-4 top-4 text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            placeholder="Address"
                            value={contact.address}
                            onChange={(e) => handleContactChange(index, 'address', e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-100"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="relative group/field">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                              <Building className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              placeholder="Company (Optional)"
                              value={contact.company ?? ''}
                              onChange={(e) => handleContactChange(index, 'company', e.target.value)}
                              disabled={isSubmitting}
                              className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-100"
                            />
                          </div>
                          <div className="relative group/field">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                              <Mail className="w-4 h-4" />
                            </div>
                            <input
                              type="email"
                              placeholder="Email (Optional)"
                              value={contact.email ?? ''}
                              onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                              disabled={isSubmitting}
                              className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="followUp"
                      checked={formData.followUpRequired}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleInputChange('followUpRequired', checked);
                        
                        if (checked) {
                          // If follow-up is required, set status to awaiting-follow-up
                          handleInputChange('status', 'awaiting-follow-up');
                        } else {
                          // If unchecked, only change if it was previously "awaiting-follow-up"
                          if (formData.status === 'awaiting-follow-up') {
                            handleInputChange('status', 'completed');
                          }
                          // Otherwise, leave status as-is (e.g., 'converted', 'lost')
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 accent-blue-600 transition-all duration-200 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="followUp" className="flex items-center space-x-2 text-sm font-semibold text-slate-700 cursor-pointer">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Follow-up required</span>
                    </label>
                  </div>
                </div>
                {formData.followUpRequired && (
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-8 space-y-6 transition-all duration-500 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-slate-800">Follow-up Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Follow-up Date</label>
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Follow-up Notes</label>
                      <textarea
                        placeholder="What specific actions need to be taken? Include deadlines, commitments, and next steps..."
                        value={formData.followUpNotes}
                        onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                        rows={4}
                        disabled={isSubmitting}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-slate-900 placeholder-slate-400 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-8 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="group px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-2xl transition-all duration-300 font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isEditing ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                      {isEditing ? 'Update Activity' : 'Save Activity'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default LogActivityModal;