'use client';
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  CreditCard,
  Receipt,
  Users,
  Search,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Plus,
  Activity,
  TrendingUp,
  Target,
  BarChart3,
  Loader,
} from 'lucide-react';
import PerformaInvoice from '../popup/PerformaInvoice';

interface Request {
  id: string;
  type: 'surveyor' | 'salvage' | 'payment' | 'performa';
  title: string;
  customer: string;
  vehicle: string;
  status: 'Awaiting Send' | 'Draft' | 'Sent' | 'Accepted' | 'Cancelled';
  date: string;
  amount?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
}

interface Stats {
  total: number;
  awaitingSend: number;
  draft: number;
  accepted: number;
  cancelled: number;
}

interface ApiResponseItem {
  id: number;
  proforma_number: string;
  proforma_date: string;
  customer_name: string;
  vehicle?: string;
  status: 'Awaiting Send' | 'Draft' | 'Sent' | 'Accepted' | 'Cancelled';
  subtotal: number;
  total: number;
  created_at: string;
}

interface CommunicationDashboardProps {
  onLogout: () => void;
  userRole?: string;
}

const CommunicationDashboard: React.FC<CommunicationDashboardProps> = ({ onLogout, userRole }) => {
  const [showPerformaModal, setShowPerformaModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    awaitingSend: 0,
    draft: 0,
    accepted: 0,
    cancelled: 0,
  });
  const [requests, setRequests] = useState<Request[]>([]);

  // Fetch stats from backend API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/communication-center/stats');
        if (!response.ok) throw new Error(`Failed to fetch stats: ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to load stats');
        setStats(result.data);
      } catch (err) {
        console.error('Fetch stats error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics.');
      }
    };
    fetchStats();
  }, []);

  // Fetch proforma list from backend API
  useEffect(() => {
    const fetchProformas = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/communication-center/proformas');
        if (!response.ok) throw new Error(`Failed to fetch proformas: ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to load proformas');
        const mappedRequests = result.data.map((item: ApiResponseItem): Request => {
          let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
          switch (item.status) {
            case 'Cancelled':
              priority = 'urgent';
              break;
            case 'Awaiting Send':
              priority = 'high';
              break;
            case 'Draft':
              priority = 'normal';
              break;
            default:
              priority = 'normal';
          }
          return {
            id: item.id.toString(),
            type: 'performa',
            title: 'Proforma Invoice',
            customer: item.customer_name || 'Unknown Customer',
            vehicle: item.vehicle || 'N/A',
            status: item.status,
            date: item.proforma_date,
            amount: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            }).format(item.total),
            priority,
          };
        });
        setRequests(mappedRequests);
      } catch (err) {
        console.error('Fetch proformas error:', err);
        setError('Failed to load proforma invoices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProformas();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await fetch('http://localhost:5001/api/communication-center/stats');
      const statsResult = await statsResponse.json();
      if (statsResult.success) setStats(statsResult.data);
      
      // Fetch proformas
      const proformasResponse = await fetch('http://localhost:5001/api/communication-center/proformas');
      const proformasResult = await proformasResponse.json();
      if (proformasResult.success) {
        const mappedRequests = proformasResult.data.map((item: ApiResponseItem): Request => {
          let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
          switch (item.status) {
            case 'Cancelled':
              priority = 'urgent';
              break;
            case 'Awaiting Send':
              priority = 'high';
              break;
            case 'Draft':
              priority = 'normal';
              break;
            default:
              priority = 'normal';
          }
          return {
            id: item.id.toString(),
            type: 'performa',
            title: 'Proforma Invoice',
            customer: item.customer_name || 'Unknown Customer',
            vehicle: item.vehicle || 'N/A',
            status: item.status,
            date: item.proforma_date,
            amount: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            }).format(item.total),
            priority,
          };
        });
        setRequests(mappedRequests);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const recentActivity = [
    {
      id: '1',
      type: 'surveyor',
      message: 'Surveyor request submitted',
      user: 'Agent Smith',
      time: '5 min ago',
      status: 'info' as const,
    },
    {
      id: '2',
      type: 'payment',
      message: 'Payment approved',
      user: 'Finance Team',
      time: '1 hour ago',
      status: 'success' as const,
    },
    {
      id: '3',
      type: 'salvage',
      message: 'Salvage quote rejected',
      user: 'Adjuster Kim',
      time: '3 hours ago',
      status: 'warning' as const,
    },
    {
      id: '4',
      type: 'performa',
      message: 'Proforma sent to customer',
      user: 'Admin Lee',
      time: '1 day ago',
      status: 'info' as const,
    },
  ];

  const urgentRequests = requests.filter((r) => r.status === 'Cancelled');

  const quickActions: QuickAction[] = [
    { label: 'Send Proforma', icon: Receipt, color: 'purple', action: () => setShowPerformaModal(true) },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Sent':
      case 'Awaiting Send':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'Draft':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Cancelled':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'surveyor':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'salvage':
        return <Trash2 className="w-5 h-5 text-orange-600" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'performa':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-50 border-green-200';
      case 'Sent':
      case 'Awaiting Send':
        return 'bg-yellow-50 border-yellow-200';
      case 'Draft':
        return 'bg-blue-50 border-blue-200';
      case 'Cancelled':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'awaitingSend' && request.status === 'Awaiting Send') ||
      (filterStatus === 'draft' && request.status === 'Draft') ||
      (filterStatus === 'sent' && request.status === 'Sent') ||
      (filterStatus === 'accepted' && request.status === 'Accepted') ||
      (filterStatus === 'cancelled' && request.status === 'Cancelled');
    const matchesType = filterType === 'all' || request.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Communication Dashboard
          </h2>
          <p className="text-gray-500 mt-1">Manage proforma invoices and customer communications</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowPerformaModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Send Proforma</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl p-6 animate-pulse"></div>
          ))
        ) : error ? (
          <div className="col-span-full bg-red-50 text-red-700 p-6 rounded-2xl">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Total Proformas */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Proformas</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-sm text-blue-200">All invoices created</p>
                </div>
                <FileText className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            {/* Awaiting Send */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Awaiting Send</p>
                  <p className="text-3xl font-bold">{stats.awaitingSend}</p>
                  <p className="text-sm text-yellow-200">Ready to share</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-200 animate-pulse" />
              </div>
            </div>
            {/* Draft */}
          
            {/* Accepted */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Accepted</p>
                  <p className="text-3xl font-bold">{stats.accepted}</p>
                  <p className="text-sm text-green-200">Approved by customer</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>
            {/* Cancelled */}
            <div className="bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Cancelled</p>
                  <p className="text-3xl font-bold">{stats.cancelled}</p>
                  <p className="text-sm text-orange-200">No longer valid</p>
                </div>
                <X className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 rounded-3xl p-8 shadow-xl border border-indigo-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600">
            Quick Actions
          </h3>
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group relative h-32 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border-2 border-transparent hover:border-indigo-200 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-500 group-hover:scale-110">
                <action.icon className="w-7 h-7 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600" />
              </div>
              <span className="relative z-10 text-sm font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors duration-300">
                {action.label}
              </span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Urgent Requests & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              Cancelled Invoices
            </h3>
            <span className="text-sm text-red-600 font-medium">{urgentRequests.length} items</span>
          </div>
          <div className="space-y-3">
            {urgentRequests.length === 0 ? (
              <p className="text-gray-500 text-sm">No cancelled invoices.</p>
            ) : (
              urgentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-lg border-l-4 bg-red-50 border-red-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{req.title}</p>
                      <p className="text-sm text-gray-600">{req.customer} • {req.vehicle}</p>
                      <p className="text-xs text-gray-500">Cancelled on: {new Date(req.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mb-2"></div>
                      <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full">
                        Cancelled
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-32">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <Activity className="w-5 h-5 text-gray-600 mr-2" />
              Recent Activity
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-center space-x-4 p-3 rounded-xl border ${getStatusColor(
                  activity.status
                )}`}
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                  <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      

      {/* Filter Controls */}
 

      {/* Requests List */}
    

      {/* Performa Invoice Modal */}
      <PerformaInvoice
        isOpen={showPerformaModal}
        onClose={() => setShowPerformaModal(false)}
        onSaveSuccess={() => {
          refreshData();
          setShowPerformaModal(false);
        }}
      />
    </div>
  );
};

export default CommunicationDashboard;