// components/marketing/pages/FollowUpPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  Phone,
  MapPin,
  Building,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar as CalendarIcon,
  List,
  Tag,
  AlertTriangle,
  X,
} from 'lucide-react';

import { format, parseISO } from 'date-fns';

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
  followUpDate: string;
  followUpNotes: string;
  contacts: Contact[];
  status: 'awaiting-follow-up' | 'in-progress' | 'completed' | 'lost';
}

const FollowUpPage = () => {
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list'); // Toggle view
  const [marked, setMarked] = useState<Record<number, 'completed' | 'lost' | 'in-progress'>>({});

  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        const res = await fetch('https://ipasystem.bymsystem.com/api/marketing-activities');
        const data = await res.json();

        // Filter: follow-up required + follow-up date set + status is awaiting/in-progress
        const followUps = data.data
          .filter(
            (a: MarketingActivity) =>
              a.followUpRequired &&
              a.followUpDate &&
              (a.status === 'awaiting-follow-up' || a.status === 'in-progress')
          )
          .map((a: MarketingActivity) => ({
            ...a,
            status: a.status || 'awaiting-follow-up', // fallback
          }));

        setActivities(followUps);
      } catch (err) {
        console.error('Failed to load follow-ups', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowUps();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: 'completed' | 'lost' | 'in-progress') => {
    try {
      await fetch(`https://ipasystem.bymsystem.com/api/marketing-activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activities.find(a => a.id === id), status: newStatus }),
      });

      setMarked((prev) => ({ ...prev, [id]: newStatus }));
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const groupedByDate = activities.reduce((acc, act) => {
    const date = act.followUpDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(act);
    return acc;
  }, {} as Record<string, MarketingActivity[]>);

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Follow-up Tasks</h1>
          <p className="text-slate-600">Track and manage your pending follow-ups</p>
        </div>

        {/* View Toggle */}
        <div className="flex border border-slate-300 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
              view === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar
          </button>
        </div>
      </div>

      {/* Empty State */}
      {activities.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-slate-500 mb-2">No pending follow-ups</h3>
          <p className="text-slate-400">All caught up! 🎉</p>
        </div>
      ) : (
        <>
          {view === 'list' ? (
            /* List View */
            <div className="space-y-6">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-white border-l-4 border-blue-500 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                        {act.activities}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {act.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Due: {format(parseISO(act.followUpDate), 'MMM d, yyyy')}
                        </span>
                      </p>
                      {act.followUpNotes && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <p className="text-sm text-slate-700">{act.followUpNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="flex flex-wrap gap-2 ml-4">
                      <button
                        onClick={() => handleUpdateStatus(act.id, 'in-progress')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-medium transition"
                      >
                        <Tag className="w-3 h-3" />
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(act.id, 'completed')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-xs font-medium transition"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Complete
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(act.id, 'lost')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition"
                      >
                        <XCircle className="w-3 h-3" />
                        Lost
                      </button>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-2 text-sm text-slate-600 border-t pt-4 mt-4">
                    {act.contacts.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium">{c.name}</span>
                        {c.company && <span className="text-slate-500">({c.company})</span>}
                        <span>• {c.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Calendar View */
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">Upcoming Follow-ups</h2>
                <p className="text-slate-600">Click to manage</p>
              </div>
              <div className="p-6 space-y-6">
                {sortedDates.map((date) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                      {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    {groupedByDate[date].map((act) => (
                      <div
                        key={act.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{act.activities}</p>
                            <p className="text-sm text-slate-600 mt-1">{act.location}</p>
                            {act.followUpNotes && (
                              <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                                {act.followUpNotes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 ml-4">
                            <button
                              onClick={() => handleUpdateStatus(act.id, 'completed')}
                              className="p-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(act.id, 'lost')}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs"
                              title="Mark as Lost"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FollowUpPage;