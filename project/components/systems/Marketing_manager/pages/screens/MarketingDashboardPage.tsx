// components/marketing/pages/DashboardPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Plus,
  Loader2,
  TrendingUp,
} from 'lucide-react';

import LogActivityModal from '../popup/LogActivityModal';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MarketingActivity {
  id: number;
  date: string;
  activities: string;
  location: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  contacts: { name: string }[];
  status: 'completed' | 'awaiting-follow-up' | 'in-progress' | 'converted' | 'lost';
}

interface DashboardPageProps {
  userRole: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ userRole }) => {
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Reusable fetch function
  const fetchActivities = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/marketing-activities');
      if (!res.ok) throw new Error('Network response was not ok');

      const data = await res.json();

      // Safely map and ensure status exists
      const safeActivities = (data.data || []).map((act: any) => ({
        ...act,
        status: act.status && ['completed', 'awaiting-follow-up', 'in-progress', 'converted', 'lost'].includes(act.status)
          ? act.status
          : 'completed',
      }));

      setActivities(safeActivities);

      // Debug: Check data
      console.log('Fetched & processed activities:', safeActivities);
    } catch (err) {
      console.error('Failed to load recent activities', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // ✅ Stats by Status
  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.status === 'completed').length;
  const awaitingFollowUp = activities.filter((a) => a.status === 'awaiting-follow-up').length;
  const inProgress = activities.filter((a) => a.status === 'in-progress').length;
  const converted = activities.filter((a) => a.status === 'converted').length;
  const lost = activities.filter((a) => a.status === 'lost').length;
  const totalContacts = activities.reduce((sum, a) => sum + a.contacts.length, 0);

  // Pie Chart Data – Status Distribution
  const statusData = [
    { name: 'Awaiting Follow-up', value: awaitingFollowUp },
    { name: 'In Progress', value: inProgress },
    { name: 'Completed', value: completedActivities },
    { name: 'Converted', value: converted },
    { name: 'Lost', value: lost },
  ];

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#16A34A', '#EF4444'];

  // Bar Chart Data – Activities by Date
  const activityByDate = activities
    .reduce((acc, act) => {
      const date = new Date(act.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find((d) => d.date === date);
      if (existing) existing.count += 1;
      else acc.push({ date, count: 1 });
      return acc;
    }, [] as { date: string; count: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
          Marketing Dashboard
        </h1>
        <p className="text-slate-600 mt-2">Track your outreach, contacts, and follow-ups</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Activities"
          value={totalActivities}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
          trend="All logged activities"
        />
        <StatCard
          title="Completed"
          value={completedActivities}
          icon={<CheckCircle className="w-6 h-6" />}
          color="emerald"
          trend="Fully closed tasks"
        />
        <StatCard
          title="Follow-ups"
          value={awaitingFollowUp}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
          trend={awaitingFollowUp > 0 ? `${awaitingFollowUp} pending` : "All caught up!"}
        />
        <StatCard
          title="Engagements"
          value={totalContacts}
          icon={<Users className="w-6 h-6" />}
          color="purple"
          trend="People contacted"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart: Activity Over Time */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Activity Over Time</h3>
          <p className="text-sm text-slate-500 mb-4">Number of activities logged per day</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByDate} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Distribution */}
        {/* Pie Chart: Status Distribution */}
<div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-3 md:space-y-0">
    <div>
      <h3 className="text-xl font-semibold text-slate-800">Activity Status Distribution</h3>
      <p className="text-sm text-slate-500">Breakdown of all marketing activities</p>
    </div>
    <div className="flex items-center space-x-4 text-xs">
      {statusData.map((entry, index) => (
        <div key={entry.name} className="flex items-center space-x-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLORS[index] }}
          />
          <span className="text-slate-700 font-medium">{entry.name}</span>
        </div>
      ))}
    </div>
  </div>

  <div className="h-80 flex items-center justify-center">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        {/* Center Label (Optional: Total) */}
        <text
          x="50%"
          y="45%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-600 text-lg font-semibold"
        >
          Total
        </text>
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 text-2xl font-bold"
        >
          {totalActivities}
        </text>

        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          innerRadius="60%"  
          outerRadius="90%"
          paddingAngle={1}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {statusData.map((entry, index) => (
           <Cell
  key={`cell-${index}`}
  fill={COLORS[index]}
  stroke="white"
  strokeWidth={2}
  className="transition-all duration-200 hover:filter hover:brightness-110 hover:drop-shadow-sm"
/>
          ))}
        </Pie>

        {/* Custom Labels with Lines */}
        <Tooltip
          content={({ payload }) => {
            if (payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white border border-slate-300 rounded-lg shadow-lg px-4 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{data.name}</p>
                  <p className="text-slate-600">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: payload[0].color }}></span>
                    {data.value} activities ({((data.value / totalActivities) * 100).toFixed(0)}%)
                  </p>
                </div>
              );
            }
            return null;
          }}
        />

        {/* Optional: Label List */}
        <text
          x="50%"
          y="95%"
          textAnchor="middle"
          className="fill-slate-500 text-xs"
        >
          Hover to see details
        </text>
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">Recent Activities</h3>
              <p className="text-sm text-slate-500">Your latest marketing engagements</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Log Activity</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="p-5 border border-slate-200/60 rounded-xl bg-slate-50 hover:bg-white transition-all duration-300 group"
                >
                  <p className="font-semibold text-slate-800 group-hover:text-blue-700">
                    {act.activities}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(act.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {act.contacts.length} contact(s)
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                        ${act.status === 'awaiting-follow-up'
                          ? 'bg-yellow-100 text-yellow-800'
                          : act.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : act.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : act.status === 'converted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {act.status ? act.status.replace('-', ' ') : 'Completed'}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <LogActivityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchActivities} // ✅ Refetch using reusable function
      />
    </div>
  );
};

// Enhanced StatCard
const StatCard = ({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
  trend: string;
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-400 to-amber-500',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        </div>
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-md group-hover:scale-105 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;