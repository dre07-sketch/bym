// components/marketing/pages/DailyActivityPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  Users,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import LogActivityModal from '../popup/LogActivityModal';

interface Contact {
  id: string;
  name: string;
  phone: string;
  address: string;
  company?: string;
  email?: string;
}

interface MarketingActivity {
  id: number;
  employeeName: string;
  date: string;
  activities: string;
  location: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  followUpNotes?: string;
  contacts: Contact[];
  status: 'completed' | 'awaiting-follow-up' | 'in-progress' | 'converted' | 'lost';
  createdAt: string;
  updatedAt: string;
}

interface UserInfo {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const DailyActivityPage = () => {
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authError, setAuthError] = useState(false);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      const response = await fetch('https://ipasystem.bymsystem.com/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUserInfo(data.user);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setAuthError(true);
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!userInfo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      // Use the employee's full name as a query parameter
      const res = await fetch(
        `https://ipasystem.bymsystem.com/api/marketing-activities/get-activities?employeeName=${encodeURIComponent(userInfo.full_name)}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!res.ok) {
        if (res.status === 401) {
          setAuthError(true);
        } else {
          throw new Error(`Failed to fetch activities: ${res.status}`);
        }
        return;
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch activities');
      }
      
      const safeData = (data.data || []).map((act: any) => ({
        ...act,
        status: act.status || 'completed',
        followUpRequired: Boolean(act.followUpRequired),
      }));
      
      setActivities(safeData);
    } catch (err: any) {
      console.error('Failed to load activities', err);
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchActivities();
    }
  }, [userInfo]);

  const handleSuccess = () => {
    fetchActivities();
    setShowModal(false);
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'awaiting-follow-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'awaiting-follow-up':
        return <Clock className="w-4 h-4" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'converted':
        return <CheckCircle className="w-4 h-4" />;
      case 'lost':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen py-16">
        <div className="text-center max-w-md bg-white rounded-3xl shadow-lg p-8 border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-red-700 mb-2">Authentication Required</h3>
          <p className="text-red-600 mb-6">
            You need to be logged in to view your activities. Please log in to continue.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-red-50 rounded-3xl border-2 border-red-200">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-red-700 mb-2">Error Loading Activities</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={fetchActivities}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
          Daily Activity Log
        </h1>
        <p className="text-slate-600 text-lg">Track and manage your marketing interactions</p>
        
        {/* Current user indicator */}
        {userInfo && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Viewing activities for: {userInfo.full_name}
            </span>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Log New Activity</span>
        </button>
      </div>

      {/* Empty State */}
      {activities.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-slate-500 mb-2">No activities logged yet</h3>
          <p className="text-slate-400 mb-6">
            You haven't logged any activities yet. Start tracking your marketing efforts.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
          >
            Log Your First Activity
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((act) => (
            <div
              key={act.id}
              className="bg-white border border-slate-200/60 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {act.activities}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-blue-700">
                        <User className="w-4 h-4" />
                        {act.employeeName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {act.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {act.contacts.length} contact(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(act.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(act.status)} whitespace-nowrap`}
                    >
                      {getStatusIcon(act.status)}
                      {act.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Follow-up Info */}
                {act.followUpRequired && act.followUpDate && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-800 text-sm">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Follow-up:</strong> {new Date(act.followUpDate).toLocaleDateString()}
                      {act.followUpNotes && ` - ${act.followUpNotes}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Contacts Section (Expandable) */}
              <div className="p-6 pt-4">
                <button
                  onClick={() => toggleExpand(act.id)}
                  className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition"
                >
                  {expanded[act.id] ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Hide Contacts</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Show {act.contacts.length} Contact(s)</span>
                    </>
                  )}
                </button>

                {expanded[act.id] && (
                  <div className="mt-4 space-y-3">
                    {act.contacts.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{c.name}</p>
                            {c.company && <p className="text-sm text-slate-600">{c.company}</p>}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {c.phone}
                            </span>
                            {c.email && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {c.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{c.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <LogActivityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default DailyActivityPage;