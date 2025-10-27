// components/marketing/pages/ReportsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface MarketingActivity {
  id: number;
  date: string;
  activities: string;
  location: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  status: 'completed' | 'awaiting-follow-up' | 'in-progress' | 'lost';
  contacts: { id: string }[];
}

interface ReportData {
  totalActivities: number;
  totalContacts: number;
  completed: number;
  awaitingFollowUp: number;
  inProgress: number;
  lost: number;
  activityByWeek: { name: string; count: number }[];
  statusDistribution: { name: string; value: number }[];
  completionTrend: { month: string; activities: number; completed: number }[];
}

interface UserInfo {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const ReportsPage = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const userData = await response.json();
      setUserInfo(userData.user);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setAuthError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchData();
    }
  }, [userInfo]);

  const fetchData = async () => {
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
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch activities');
      }
      
      const activities: MarketingActivity[] = result.data || [];

      // Process data
      const totalActivities = activities.length;
      const totalContacts = activities.reduce((sum, a) => sum + a.contacts.length, 0);
      const completed = activities.filter((a) => a.status === 'completed').length;
      const awaitingFollowUp = activities.filter((a) => a.status === 'awaiting-follow-up').length;
      const inProgress = activities.filter((a) => a.status === 'in-progress').length;
      const lost = activities.filter((a) => a.status === 'lost').length;

      // Activity by Week
      const weekly = activities.reduce((acc, act) => {
        const weekStart = getWeekStart(new Date(act.date));
        const key = weekStart.toISOString().split('T')[0];
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const activityByWeek = Object.entries(weekly)
        .map(([date, count]) => ({
          name: `Week of ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          count,
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

      // Status Distribution
      const statusDistribution = [
        { name: 'Awaiting Follow-up', value: awaitingFollowUp },
        { name: 'In Progress', value: inProgress },
        { name: 'Completed', value: completed },
        { name: 'Lost', value: lost },
      ];

      // Completion Trend (Monthly)
      const monthly = activities.reduce((acc, act) => {
        const month = new Date(act.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!acc[month]) acc[month] = { activities: 0, completed: 0 };
        acc[month].activities += 1;
        if (act.status === 'completed') acc[month].completed += 1;
        return acc;
      }, {} as Record<string, { activities: number; completed: number }>);

      const completionTrend = Object.entries(monthly).map(([month, data]) => ({
        month,
        activities: data.activities,
        completed: data.completed,
      }));

      setData({
        totalActivities,
        totalContacts,
        completed,
        awaitingFollowUp,
        inProgress,
        lost,
        activityByWeek,
        statusDistribution,
        completionTrend,
      });
    } catch (err: any) {
      console.error('Failed to load report data', err);
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444']; // Awaiting, In Progress, Completed, Lost

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen py-16">
        <div className="text-center max-w-md bg-white rounded-3xl shadow-lg p-8 border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-red-700 mb-2">Authentication Required</h3>
          <p className="text-red-600 mb-6">
            You need to be logged in to view your reports. Please log in to continue.
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
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-red-50 rounded-3xl border-2 border-red-200">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-red-700 mb-2">Error Loading Reports</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-700">Failed to load reports</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
          Marketing Reports & Analytics
        </h1>
        <p className="text-slate-600 text-lg">Performance insights for your marketing activities</p>
        
        {/* Current user indicator */}
        {userInfo && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Viewing reports for: {userInfo.full_name}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Activities"
          value={data.totalActivities}
          icon={<Activity className="w-6 h-6" />}
          color="blue"
          trend="All logged"
        />
        <StatCard
          title="Total Engagements"
          value={data.totalContacts}
          icon={<Users className="w-6 h-6" />}
          color="purple"
          trend="People contacted"
        />
        <StatCard
          title="Follow-ups"
          value={data.awaitingFollowUp}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
          trend={data.awaitingFollowUp > 0 ? 'Action needed' : 'All caught up!'}
        />
        <StatCard
          title="Completed"
          value={data.completed}
          icon={<CheckCircle className="w-6 h-6" />}
          color="emerald"
          trend="Fully closed tasks"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Over Time */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Activity Over Time</h3>
          <p className="text-sm text-slate-500 mb-4">Weekly engagement trends</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={70} />
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

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Status Distribution</h3>
          <p className="text-sm text-slate-500 mb-4">Breakdown of all activities</p>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} activities`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Completion Trend */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Completion Trend</h3>
        <p className="text-sm text-slate-500 mb-4">Monthly activity vs. completed tasks</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.completionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderColor: '#E5E7EB',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="activities" stroke="#3B82F6" name="Total Activities" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Summary</h3>
        <p className="text-slate-600">
          You've logged <strong>{data.totalActivities}</strong> activities, engaged with{' '}
          <strong>{data.totalContacts}</strong> people, and marked{' '}
          <strong>{data.completed}</strong> as completed.
        </p>
      </div>
    </div>
  );
};

// StatCard Component
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
  color: 'blue' | 'purple' | 'amber' | 'emerald';
  trend: string;
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-400 to-amber-500',
    emerald: 'from-emerald-500 to-emerald-600',
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

export default ReportsPage;