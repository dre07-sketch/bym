// components/marketing/pages/ContactsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  User,
  Phone,
  Building,
  Mail,
  MapPin,
  Search,
  Loader2,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  address: string;
  company?: string;
  email?: string;
  activityCount?: number;
  lastContacted?: string;
}

const ContactsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('https://ipasystem.bymsystem.com/api/marketing-activities');
        const data = await res.json();

        const contactMap = new Map<string, Contact>();

        data.data.forEach((act: any) => {
          act.contacts.forEach((c: any) => {
            if (!contactMap.has(c.id)) {
              contactMap.set(c.id, {
                ...c,
                activityCount: 1,
                lastContacted: act.date,
              });
            } else {
              const existing = contactMap.get(c.id)!;
              existing.activityCount! += 1;
              if (act.date > existing.lastContacted!) {
                existing.lastContacted = act.date;
              }
            }
          });
        });

        // Sort by last contacted
        const sorted = Array.from(contactMap.values()).sort(
          (a, b) => new Date(b.lastContacted!).getTime() - new Date(a.lastContacted!).getTime()
        );

        setContacts(sorted);
      } catch (err) {
        console.error('Failed to load contacts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
          Contact Directory
        </h1>
        <p className="text-slate-600 text-lg">All people you've connected with — sorted by recent activity</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, company, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 shadow-sm hover:shadow-md transition-all duration-300"
        />
      </div>

      {/* Stats */}
      <div className="flex justify-center text-sm text-slate-500">
        <span>
          Showing <strong>{filtered.length}</strong> contact(s) •{' '}
          <strong>{contacts.length}</strong> total
        </span>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-slate-500 mb-2">No contacts found</h3>
          <p className="text-slate-400">Try adjusting your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 group hover:scale-[1.01]"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">
                      {c.name}
                    </h3>
                    {c.company && (
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5" />
                        {c.company}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end text-xs text-slate-500">
                  <span>Activities</span>
                  <span className="font-bold text-slate-700">{c.activityCount}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                  <span className="leading-tight">{c.address}</span>
                </div>
              </div>

              {/* Last Contacted */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Last: {new Date(c.lastContacted!).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 px-2 py-1 bg-slate-100 rounded-full">
                  <Tag className="w-3 h-3" />
                  <span>Contact</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactsPage;