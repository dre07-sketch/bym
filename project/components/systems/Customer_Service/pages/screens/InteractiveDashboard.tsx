// src/app/dashboard/InteractiveDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Star,
  Phone,
  Wrench,
  Car,
  Package,
  User,
  Calendar,
  BarChart2,
  ChevronRight,
  Plus,
  UserPlus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import NewTicketModal from '../pop up/NewTicketModal';
import EmployeeCheckInModal from '../pop up/EmployeeCheckInModal';
import AddCustomerModal from '../pop up/AddCustomerModal';
import ReportsModal from '../pop up/ReportsModal';
import NewAppointmentModal from '../pop up/NewAppointmentModal';
import SOSPopup from '../pop up/SOSPopup';

// Define types
interface StatusDataItem {
  name: string;
  value: number;
  color: string;
}

interface RawStatusData {
  status?: string;
  count?: number;
}

interface RawTicketTrend {
  day: string;
  tickets: number;
  sos: number;
}

interface RawAppointment {
  id: number;
  customer: string;
  time: string;
  service: string;
  vehicle: string;
}

const InteractiveDashboard = ({ userRole = 'manager' }) => {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isSOSPopupOpen, setIsSOSPopupOpen] = useState(false);

  // Dynamic data states
  const [activeTickets, setActiveTickets] = useState(0);
  const [sosPending, setSosPending] = useState(0);
  const [statusData, setStatusData] = useState<StatusDataItem[]>([]);
  const [ticketTrends, setTicketTrends] = useState<
    { name: string; tickets: number; sos: number }[]
  >([
    { name: 'Mon', tickets: 0, sos: 0 },
    { name: 'Tue', tickets: 0, sos: 0 },
    { name: 'Wed', tickets: 0, sos: 0 },
    { name: 'Thu', tickets: 0, sos: 0 },
    { name: 'Fri', tickets: 0, sos: 0 },
    { name: 'Sat', tickets: 0, sos: 0 },
    { name: 'Sun', tickets: 0, sos: 0 }
  ]);
  const [appointments, setAppointments] = useState<RawAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Allowed Statuses (updated with both payment statuses) ---
  const validStatuses = [
    'pending',
    'assigned',
    'in progress',
    'ready for inspection',
    'inspection',
    'successful inspection',
    'inspection failed',
    'awaiting bill',
    'payment requested', 
    'request payment', // Added this status
    'completed'
  ];

  // --- Enhanced: Status Color Mapping ---
  const getStatusColorForChart = (status: string | undefined): string => {
    if (!status) return '#9ca3af'; // Gray

    const normalized = status.toLowerCase().trim();

    const colorMap: Record<string, string> = {
     'pending': '#6b7280',               // Gray
  'assigned': '#8b5cf6',              // Purple
  'in progress': '#f59e0b',           // Amber
  'ready for inspection': '#06b6d4',  // Cyan
  'inspection': '#3b82f6',            // Blue
  'successful inspection': '#10b981', // Emerald
  'inspection failed': '#dda15e',     // Red
  'awaiting bill': '#f97316',         // Orange
  'awaiting survey': '#14b8a6',       // Teal
  'awaiting salvage form': '#eab308', // Yellow
  'payment requested': '#d946ef',     // Pink-Purple
  'request payment': '#ec4899',       // Pink
  'completed': '#22c55e',             // Green
  'other': '#9333ea'                   // Fallback
    };

    return colorMap[normalized] || colorMap.other;
  };

  // --- Normalize Status Names (handle variations) ---
  const normalizeStatus = (status: string): string => {
    const lower = status.toLowerCase().trim();

    // Handle common variations
    if (['in-progress', 'in_progress'].includes(lower)) return 'in progress';
    if (['inspection passed', 'passed'].includes(lower)) return 'successful inspection';
    if (['failed', 'inspection_failed'].includes(lower)) return 'inspection failed';
    if (['done', 'closed', 'finished'].includes(lower)) return 'completed';
    if (['awaiting-bill', 'awaiting_bill', 'waiting for bill'].includes(lower)) return 'awaiting bill';
    if (['payment requested', 'payment_requested', 'paymentrequested'].includes(lower)) return 'payment requested';
    if (['request payment', 'request_payment', 'requestpayment'].includes(lower)) return 'request payment'; // Added this
    if (lower === 'assigned') return 'assigned';

    return validStatuses.includes(lower) ? lower : 'other';
  };

  // --- Fetch all data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Active Tickets
        try {
          const activeRes = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/active-tickets');
          if (activeRes.ok) {
            const data = await activeRes.json();
            setActiveTickets(typeof data.activeTickets === 'number' ? data.activeTickets : 0);
          }
        } catch (err) {
          console.warn('Failed to fetch active tickets:', err);
        }

        // SOS Pending
        try {
          const sosRes = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/sos');
          if (sosRes.ok) {
            const data = await sosRes.json();
            setSosPending(typeof data.pending === 'number' ? data.pending : 0);
          }
        } catch (err) {
          console.warn('Failed to fetch SOS count:', err);
        }

        // Status Distribution
        try {
          const statusRes = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/status-distribution');
          if (statusRes.ok) {
            const data = await statusRes.json();

            if (Array.isArray(data.distribution)) {
              const processed = data.distribution
                .filter((item: unknown): item is RawStatusData => {
                  if (!item || typeof item !== 'object') return false;
                  const obj = item as RawStatusData;
                  return typeof obj.status === 'string';
                })
                .reduce((acc: Record<string, number>, item: RawStatusData) => {
                  if (item.status) {
                    const normalized = normalizeStatus(item.status);
                    acc[normalized] = (acc[normalized] || 0) + (typeof item.count === 'number' ? item.count : 0);
                  }
                  return acc;
                }, {} as Record<string, number>);

              const result = Object.entries(processed)
                .map(([status, count]): StatusDataItem => {
                  let displayName = status;
                  if (status !== 'other') {
                    displayName = status
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                  } else {
                    displayName = 'Other';
                  }
                  return {
                    name: displayName,
                    value: count as number,
                    color: getStatusColorForChart(status)
                  };
                });

              setStatusData(result);
            } else {
              setStatusData([]);
            }
          } else {
            setStatusData([]);
          }
        } catch (err) {
          console.warn('Failed to fetch status distribution:', err);
          setStatusData([]);
        }

        // Ticket Trends
        try {
          const trendsRes = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/weekly-ticket-counts');
          if (trendsRes.ok) {
            const rawData: RawTicketTrend[] = await trendsRes.json();

            const dayMap: Record<string, string> = {
              Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
              Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
            };

            const trendData = [
              { name: 'Mon', tickets: 0, sos: 0 },
              { name: 'Tue', tickets: 0, sos: 0 },
              { name: 'Wed', tickets: 0, sos: 0 },
              { name: 'Thu', tickets: 0, sos: 0 },
              { name: 'Fri', tickets: 0, sos: 0 },
              { name: 'Sat', tickets: 0, sos: 0 },
              { name: 'Sun', tickets: 0, sos: 0 }
            ];

            rawData.forEach(t => {
              const shortName = dayMap[t.day];
              const day = trendData.find(d => d.name === shortName);
              if (day) {
                day.tickets = t.tickets;
                day.sos = t.sos;
              }
            });

            setTicketTrends(trendData);
          }
        } catch (err) {
          console.warn('Failed to fetch ticket trends:', err);
        }

        // Upcoming Appointments
        try {
          const apptRes = await fetch('https://ipasystem.bymsystem.com/api/ticket-stats/upcoming-appointments');
          if (apptRes.ok) {
            const rawData: RawAppointment[] = await apptRes.json();
            const formatted = rawData.map(appt => ({
              id: appt.id,
              customer: typeof appt.customer === 'string' ? appt.customer : 'Unknown',
              time: new Date(appt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              service: typeof appt.service === 'string' ? appt.service : 'Service',
              vehicle: typeof appt.vehicle === 'string' ? appt.vehicle : 'Unknown Vehicle'
            }));
            setAppointments(formatted);
          } else {
            setAppointments([]);
          }
        } catch (err) {
          console.warn('Failed to fetch appointments:', err);
          setAppointments([]);
        }
      } catch (error) {
        console.error('Critical dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Stats ---
  const stats = [
    {
      title: 'Active Tickets',
      value: loading ? '...' : activeTickets.toString(),
      icon: Ticket,
      color: 'bg-blue-500'
    },
    {
      title: 'SOS Requests',
      value: loading ? '...' : sosPending.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      title: 'Completed Today',
      value: '18',
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ];

  // --- Handlers ---
  const handleEmergencyLine = () => {
    setIsSOSPopupOpen(true);
  };

  const handleViewSchedule = () => {
    console.log('Navigate to full schedule view');
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Service Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all customer service activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleEmergencyLine}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Phone className="w-4 h-4 mr-2" />
            Emergency Line
          </button>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Ticket className="w-6 h-6 mb-2" />
          <span className="font-medium">New Ticket</span>
        </button>
        <button
          onClick={() => setIsNewAppointmentOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Calendar className="w-6 h-6 mb-2" />
          <span className="font-medium">Schedule</span>
        </button>
        <button
          onClick={() => setIsCheckInOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <User className="w-6 h-6 mb-2" />
          <span className="font-medium">Check-in</span>
        </button>
        <button
          onClick={() => setIsReportsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <BarChart2 className="w-6 h-6 mb-2" />
          <span className="font-medium">Reports</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Ticket Trends - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Ticket Trends</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Regular Tickets</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">SOS Requests</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ticket Status Distribution</h3>
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : statusData.length === 0 ? (
              <p className="text-center text-gray-500">No data available.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} tickets`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-700 font-medium">{item.name}</span>
                      <span className="text-gray-500">({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-2">No upcoming appointments</p>
              ) : (
                appointments.map(appointment => (
                  <div key={appointment.id} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-gray-900">{appointment.time}</div>
                      <div className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                        {appointment.service}
                      </div>
                    </div>
                    <div className="mt-1 text-gray-900">{appointment.customer}</div>
                    <div className="text-sm text-gray-600">{appointment.vehicle}</div>
                  </div>
                ))
              )}
              <button
                onClick={handleViewSchedule}
                className="w-full mt-2 text-center text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center transition-colors"
              >
                View Full Schedule
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
      />
      <EmployeeCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />
      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
      />
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
      />
      <SOSPopup
        isOpen={isSOSPopupOpen}
        onClose={() => setIsSOSPopupOpen(false)}
      />
    </div>
  );
};

export default InteractiveDashboard;