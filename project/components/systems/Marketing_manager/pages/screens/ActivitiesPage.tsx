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
  date: string;
  activities: string;
  location: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  contacts: Contact[];
  status: 'completed' | 'awaiting-follow-up' | 'in-progress' | 'converted' | 'lost';
}

const DailyActivityPage = () => {
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const fetchActivities = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/marketing-activities');
      const data = await res.json();

      // Ensure status fallback
      const safeData = (data.data || []).map((act: any) => ({
        ...act,
        status: act.status || 'completed',
      }));

      setActivities(safeData);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

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

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
          Daily Activity Log
        </h1>
        <p className="text-slate-600 text-lg">Track and manage your marketing interactions</p>
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
          <p className="text-slate-400 mb-6">Start tracking your marketing efforts today.</p>
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
                  <span
                    className={`ml-4 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(act.status)} whitespace-nowrap`}
                  >
                    {act.status.replace('-', ' ')}
                  </span>
                </div>

                {/* Follow-up Info */}
                {act.followUpRequired && act.followUpDate && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-800 text-sm">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Follow-up:</strong> {new Date(act.followUpDate).toLocaleDateString()}
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