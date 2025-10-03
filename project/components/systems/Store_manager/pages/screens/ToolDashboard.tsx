'use client';
import React, { useState, useEffect } from 'react';
import CheckInToolModal from './../popup/CheckInToolModal'; // Adjust path
import ReportDamageModal from './../popup/ReportDamageModal'; // Adjust path
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Plus,
  Activity,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  X,
  Search,
  Loader,
} from 'lucide-react';

interface ToolStats {
  totalTools: number;
  toolsInUse: number;
  availableTools: number;
  damagedTools: number;
  overdueReturns: number;
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red';
  action: () => void;
}

interface RecentActivity {
  activityId: number;
  type: 'request' | 'return' | 'damage' | 'assignment' | 'check-in';
  message: string;
  user: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface Tool {
  id: number;
  tool_name: string;
  brand: string;
  quantity: number;
  image_url?: string;
  status: string;
  condition?: string;
}

interface ServiceTicket {
  id: number;
  ticket_number: string;
  customer_name: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  assigned_mechanic: string | null;
  status: string;
}

interface AssignedTool {
  assignmentId: number;
  tool_id: number;
  ticket_id: number;  // 👈 Add this line
  tool_name: string;
  brand: string;
  assignedQuantity: number;
  status: string;
  assigned_at: string;
}

export default function ToolDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingTools, setLoadingTools] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [assignedTools, setAssignedTools] = useState<{ tool: Tool; qty: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showReportDamage, setShowReportDamage] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [assignedToTicket, setAssignedToTicket] = useState<AssignedTool[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  

  const [toolStats, setToolStats] = useState<ToolStats>({
    totalTools: 0,
    toolsInUse: 0,
    availableTools: 0,
    damagedTools: 0,
    overdueReturns: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeAssignments, setActiveAssignments] = useState<AssignedTool[]>([]);
  

  // === Quick Actions ===
  const quickActions: QuickAction[] = [
    {
      label: 'New Request',
      icon: Plus,
      color: 'blue',
      action: () => openModal(),
    },
    {
      label: 'Check In Tool',
      icon: CheckCircle,
      color: 'green',
      action: () => setShowCheckInModal(true),
    },
    {
      label: 'Report Damage',
      icon: AlertTriangle,
      color: 'red',
      action: () => setShowReportDamage(true),
    },
  ];

 const getColorClasses = (color: 'blue' | 'green' | 'red') => {
    switch (color) {
      case 'blue':
        return {
          gradient: 'from-blue-50/30 via-blue-100/20 to-blue-50/30',
          hoverGradient: 'hover:from-blue-100/50 hover:via-blue-200/40 hover:to-blue-100/50',
          iconColor: 'text-gray-500 group-hover:text-blue-600',
          labelColor: 'text-gray-700 group-hover:text-blue-700',
          border: 'group-hover:border-blue-300/60',
          shadow: 'group-hover:shadow-[0_16px_48px_-8px_rgba(59,130,246,0.15)]',
          glow: 'group-hover:shadow-[0_0_32px_rgba(59,130,246,0.1)]'
        };
      case 'green':
        return {
          gradient: 'from-green-50/30 via-emerald-100/20 to-green-50/30',
          hoverGradient: 'hover:from-green-100/50 hover:via-emerald-200/40 hover:to-green-100/50',
          iconColor: 'text-gray-500 group-hover:text-emerald-600',
          labelColor: 'text-gray-700 group-hover:text-emerald-700',
          border: 'group-hover:border-emerald-300/60',
          shadow: 'group-hover:shadow-[0_16px_48px_-8px_rgba(16,185,129,0.15)]',
          glow: 'group-hover:shadow-[0_0_32px_rgba(16,185,129,0.1)]'
        };
      case 'red':
        return {
          gradient: 'from-red-50/30 via-rose-100/20 to-red-50/30',
          hoverGradient: 'hover:from-red-100/50 hover:via-rose-200/40 hover:to-red-100/50',
          iconColor: 'text-gray-500 group-hover:text-red-600',
          labelColor: 'text-gray-700 group-hover:text-red-700',
          border: 'group-hover:border-red-300/60',
          shadow: 'group-hover:shadow-[0_16px_48px_-8px_rgba(239,68,68,0.15)]',
          glow: 'group-hover:shadow-[0_0_32px_rgba(239,68,68,0.1)]'
        };
    }
  };


  // Mock recent activity
const fetchRecentActivity = async () => {
  setLoadingActivity(true);
  try {
    const res = await fetch('http://localhost:5001/api/tools/recent-activity');
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) {
      setRecentActivity(data.data);
    } else {
      console.warn('No activity data:', data.message);
      setRecentActivity([]);
    }
  } catch (err) {
    console.error('Failed to fetch recent activity:', err);
    setRecentActivity([]); // Don't crash
  } finally {
    setLoadingActivity(false);
  }
};

// Fetch on mount and refresh
useEffect(() => {
  fetchRecentActivity();
  const interval = setInterval(fetchRecentActivity, 60000); // Refresh every minute
  return () => clearInterval(interval);
}, []);

// Fetch tools assigned to a specific ticket
const fetchAssignedToTicket = async (ticketId: number) => {
  setLoadingAssignment(true);
  try {
    const res = await fetch(`http://localhost:5001/api/tools/assigned?ticketId=${ticketId}`);
    const data = await res.json();
    if (data.success) {
      setAssignedToTicket(data.data);
    } else {
      console.warn('No assignments found for ticket:', data.message);
      setAssignedToTicket([]);
    }
  } catch (err) {
    console.error('Failed to fetch assigned tools for ticket:', err);
    setAssignedToTicket([]);
  } finally {
    setLoadingAssignment(false);
  }
};

// Auto-refresh every 30s
useEffect(() => {
  if (selectedTicket?.id) {
    fetchAssignedToTicket(selectedTicket.id);
    const interval = setInterval(() => fetchAssignedToTicket(selectedTicket.id), 30000);
    return () => clearInterval(interval);
  }
}, [selectedTicket?.id]);






  const lowStockTools = [
    { name: 'Socket Set 1/4"', quantity: 2, minStock: 5, category: 'Hand Tools' },
    { name: 'Torque Wrench', quantity: 1, minStock: 3, category: 'Precision Tools' },
    { name: 'Multimeter', quantity: 0, minStock: 2, category: 'Electrical' },
    { name: 'Oil Filter Wrench', quantity: 1, minStock: 4, category: 'Specialty Tools' },
  ];

  // === STATS: Fetch Dashboard Stats ===
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/tools/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || 'API error');
      }
      const { totalTools, toolsInUse, availableTools, damagedTools } = result.data;
      setToolStats({
        totalTools,
        toolsInUse,
        availableTools,
        damagedTools,
        overdueReturns: 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAssignedTools = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/tools/assigned');
      const data = await res.json();
      setAssignedList(data.data || []);
    } catch (err) {
      console.error('Failed to fetch assigned tools');
    }
  };

  const [assignedList, setAssignedList] = useState<AssignedTool[]>([]);

  useEffect(() => {
    fetchAssignedTools();
    const interval = setInterval(fetchAssignedTools, 30000);
    return () => clearInterval(interval);
  }, []);

  const returnTool = async (assignmentId: number, toolId: number, quantity: number) => {
    const confirm = window.confirm('Return this tool?');
    if (!confirm) return;
    try {
      const res = await fetch('http://localhost:5001/api/tools/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, toolID: toolId, quantity }),
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Returned!');
        fetchStats();
        fetchAssignedTools();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err) {
      alert('⚠️ Network error');
    }
  };

  // === REFRESH ===
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    if (isModalOpen) {
      await fetchTickets();
      await fetchTools();
    }
    setRefreshing(false);
  };

  // === MODAL: Open/Close & Data Fetching ===
  const openModal = () => {
    setIsModalOpen(true);
    setSelectedTicket(null);
    setAssignedTools([]);
    setSearchTerm('');
    fetchTickets();
    fetchTools();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setAssignedTools([]);
    setSearchTerm('');
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('http://localhost:5001/api/tickets/service_tickets');
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data: ServiceTicket[] = await res.json();
      const inProgress = data.filter((t) =>
        ['in-progress', 'in progress', 'In Progress'].includes(t.status)
      );
      setTickets(inProgress);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      alert('Could not load in-progress tickets.');
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchTools = async () => {
    setLoadingTools(true);
    try {
      const res = await fetch('http://localhost:5001/api/tools');
      if (!res.ok) throw new Error('Failed to fetch tools');
      const data = await res.json();
      setTools(data.data || []);
    } catch (err) {
      console.error('Error fetching tools:', err);
      alert('Could not load tools.');
    } finally {
      setLoadingTools(false);
    }
  };

  // === TOOL ASSIGNMENT LOGIC ===
  const openToolSelector = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setAssignedTools([]);
  };

  const addToAssignment = (tool: Tool) => {
    if (tool.quantity <= 0) return;
    setAssignedTools((prev) => {
      const existing = prev.find((a) => a.tool.id === tool.id);
      if (existing) {
        if (existing.qty < tool.quantity) {
          return prev.map((a) =>
            a.tool.id === tool.id ? { ...a, qty: a.qty + 1 } : a
          );
        } else {
          alert(`Maximum available quantity reached for ${tool.tool_name}`);
          return prev;
        }
      } else {
        return [...prev, { tool, qty: 1 }];
      }
    });
  };

  const removeFromAssignment = (toolId: number) => {
    setAssignedTools((prev) => prev.filter((a) => a.tool.id !== toolId));
  };

  const updateQuantity = (toolId: number, qty: number) => {
    setAssignedTools((prev) =>
      prev.map((a) =>
        a.tool.id === toolId
          ? { ...a, qty: Math.max(1, Math.min(qty, a.tool.quantity)) }
          : a
      )
    );
  };

  const confirmAssignment = async () => {
    if (!selectedTicket || assignedTools.length === 0) return;
    setAssigning(true);
    try {
      for (const { tool, qty } of assignedTools) {
        const res = await fetch('http://localhost:5001/api/tools/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolID: tool.id,
            ticketID: selectedTicket.id,
            quantity: qty,
            assignedBy: selectedTicket.assigned_mechanic || 'Unknown',
          }),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || 'Failed to assign tool');
        }
      }
      alert('✅ Tools assigned successfully!');
      closeModal();
      fetchStats();
    } catch (err: any) {
      console.error('Assignment error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const filteredTools = tools.filter(
    (tool) =>
      (tool.tool_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === EFFECTS: Auto-refresh & Time ===
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchStats();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // === UI HELPERS ===
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <Plus className="w-5 h-5 text-blue-600" />;
      case 'return':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'damage':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'assignment':
        return <Users className="w-5 h-5 text-orange-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // === Active Assignments Fetch ===
 const fetchActiveAssignments = async () => {
  try {
    const res = await fetch('http://localhost:5001/api/tools/assigned');
    if (!res.ok) throw new Error('Network error');

    const { success, data } = await res.json();
    console.log('🔧 Active Assignments:', data);

    setActiveAssignments(success ? data : []);
  } catch (err) {
    console.error('❌ Failed to fetch active assignments:', err);
    setActiveAssignments([]);
  }
};

  useEffect(() => {
    fetchActiveAssignments();
    const interval = setInterval(fetchActiveAssignments, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
            Tool Management Dashboard
          </h2>
          <p className="text-gray-500 mt-1">Real-time tool tracking and management</p>
        </div>
        <div className="flex items-center space-x-4">
          
        </div>
      </div>

     

    {/* Stats Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
  {statsLoading ? (
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-gray-200 rounded-2xl p-6 animate-pulse h-32"></div>
    ))
  ) : (
    <>
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Total Tools</p>
            <p className="text-3xl font-bold">{toolStats.totalTools}</p>
            <p className="text-sm text-blue-200">In inventory</p>
          </div>
          <Wrench className="w-8 h-8 text-blue-200 animate-pulse" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100">Tools In Use</p>
            <p className="text-3xl font-bold">{toolStats.toolsInUse}</p>
            <p className="text-sm text-orange-200">Currently assigned</p>
          </div>
          <Clock className="w-8 h-8 text-orange-200 animate-spin" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">Available Tools</p>
            <p className="text-3xl font-bold">{toolStats.availableTools}</p>
            <p className="text-sm text-green-200">Units ready for use</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100">Damaged Tools</p>
            <p className="text-3xl font-bold">{toolStats.damagedTools}</p>
            <p className="text-sm text-red-200">Need repair</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-200 animate-bounce" />
        </div>
      </div>
    </>
  )}
</div>



    



      {/* Active Assignments */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mt-8 mx-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Tool Assignments</h3>
        {activeAssignments.length === 0 ? (
          <p className="text-gray-500">No tools currently in use.</p>
        ) : (
          <div className="space-y-3">
            {activeAssignments.map((item) => (
              <div key={item.assignmentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.tool_name} × {item.assignedQuantity}</p>
                  <p className="text-sm text-gray-600">Assigned on: {new Date(item.assigned_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => returnTool(item.assignmentId, item.tool_id, item.assignedQuantity)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Return Tool
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Assigned Tools Panel */}

<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
      <Wrench className="w-5 h-5 text-blue-600 mr-2" />
      Tools Currently Assigned
    </h3>
    <span className="text-sm text-gray-600">
      {assignedList.length} {assignedList.length === 1 ? 'tool' : 'tools'}
    </span>
  </div>

  {assignedList.length === 0 ? (
    <p className="text-gray-500 text-center py-6">No tools currently assigned.</p>
  ) : (
    <div className="space-y-3">
      {assignedList.map((item) => (
        <div
          key={item.assignmentId}
          className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">{item.tool_name}</h4>
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
              ×{item.assignedQuantity}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Brand: <strong>{item.brand}</strong></span>
            <span>Ticket ID: #{item.ticket_id}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Assigned: {new Date(item.assigned_at).toLocaleDateString()}</span>
            <span className={`px-2 py-1 rounded ${
              item.status === 'In Use'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {/* Recent Activity */}
<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
      <Activity className="w-5 h-5 text-blue-600 mr-2" />
      Recent Activity
    </h3>
    <button
      onClick={fetchRecentActivity}
      disabled={loadingActivity}
      className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
    >
      {loadingActivity ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <span>Refresh</span>
      )}
    </button>
  </div>

  {loadingActivity ? (
    <div className="text-center py-8">
      <Loader className="w-6 h-6 animate-spin mx-auto text-blue-500" />
      <p className="text-sm text-gray-500 mt-2">Loading activity...</p>
    </div>
  ) : recentActivity.length === 0 ? (
    <p className="text-gray-500 text-center py-6">No recent activity.</p>
  ) : (
    <div className="space-y-4">
      {recentActivity.map((activity) => (
        <div
          key={activity.activityId}
          className={`flex items-center space-x-4 p-3 rounded-xl border ${getStatusColor(activity.status)} transition-all hover:shadow-sm`}
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{activity.message}</p>
            <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      </div>

     

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Assign Tools to Ticket</h3>
              <button onClick={closeModal} className="p-2 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex h-96">
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4">
                <h4 className="font-semibold text-gray-700 mb-3">In-Progress Tickets</h4>
                {loadingTickets ? (
                  <div className="text-center py-8">
                    <Loader className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-gray-500 text-sm">No in-progress tickets.</p>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 rounded-lg p-3 mb-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => openToolSelector(ticket)}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-800">#{ticket.ticket_number}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
                      </div>
                      <p className="text-sm text-gray-600">{ticket.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {ticket.year} {ticket.make} {ticket.model}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="w-2/3 p-6">
                {!selectedTicket ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Wrench className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a ticket to assign tools</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-semibold text-blue-800">Ticket: #{selectedTicket.ticket_number}</h4>
                      <p className="text-sm text-blue-700">{selectedTicket.customer_name} • {selectedTicket.license_plate}</p>
                      <p className="text-xs text-blue-600">
                        {selectedTicket.year} {selectedTicket.make} {selectedTicket.model}
                      </p>
                    </div>
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    {loadingTools ? (
                      <div className="flex justify-center py-4">
                        <Loader className="w-6 h-6 animate-spin text-orange-500" />
                      </div>
                    ) : (
                      <ul className="overflow-y-auto max-h-48 border border-gray-200 rounded-lg divide-y">
                        {filteredTools.length === 0 ? (
                          <li className="p-3 text-gray-500 text-sm">No tools found.</li>
                        ) : (
                          filteredTools.map((tool) => (
                            <li key={tool.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={tool.image_url || '/placeholder-tool.png'}
                                  alt={tool.tool_name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium text-gray-800">{tool.tool_name}</p>
                                  <p className="text-xs text-gray-500">{tool.brand} • Condition: {tool.condition}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => addToAssignment(tool)}
                                disabled={tool.quantity <= 0}
                                className={`px-3 py-1 rounded text-white text-sm ${
                                  tool.quantity > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                              >
                                Add
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                    {assignedTools.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-semibold text-gray-800 mb-2">Assigned Tools</h5>
                        <ul className="space-y-2">
                          {assignedTools.map(({ tool, qty }) => (
                            <li key={tool.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{tool.tool_name} × {qty}</span>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="1"
                                  max={tool.quantity}
                                  value={qty}
                                  onChange={(e) => updateQuantity(tool.id, parseInt(e.target.value) || 1)}
                                  className="w-16 text-center border rounded text-sm"
                                />
                                <button
                                  onClick={() => removeFromAssignment(tool.id)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={confirmAssignment}
                            disabled={assigning}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-70"
                          >
                            {assigning ? 'Assigning...' : 'Confirm Assignment'}
                          </button>
                          <button
                            onClick={() => setSelectedTicket(null)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CheckInToolModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={() => {
          fetchStats();
          fetchTools();
        }}
      />
      <ReportDamageModal
        isOpen={showReportDamage}
        onClose={() => setShowReportDamage(false)}
        onSuccess={() => {
          fetchStats();
          fetchTools();
        }}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-12deg); opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translateX(200%) skewX(-12deg); opacity: 0; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}