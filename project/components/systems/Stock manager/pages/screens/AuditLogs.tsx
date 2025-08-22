import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Package, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Eye,
  Clock,
  RefreshCw,
  Shield,
  Activity
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [isLoading, setIsLoading] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(false);

  useEffect(() => {
    setAnimatedStats(true);
  }, []);

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2024-01-15T14:30:00Z',
      user: 'John Smith',
      action: 'CREATE',
      entity: 'Stock Item',
      entityId: 'BP-001',
      details: 'Created new stock item: Premium Brake Pads',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'low'
    },
    {
      id: '2',
      timestamp: '2024-01-15T13:45:00Z',
      user: 'Sarah Wilson',
      action: 'UPDATE',
      entity: 'Stock Level',
      entityId: 'EO-5W30',
      details: 'Updated stock level for Engine Oil 5W-30',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      severity: 'medium',
      changes: [
        { field: 'currentStock', oldValue: '25', newValue: '8' },
        { field: 'lastUpdated', oldValue: '2024-01-10', newValue: '2024-01-15' }
      ]
    },
    {
      id: '3',
      timestamp: '2024-01-15T12:20:00Z',
      user: 'Mike Johnson',
      action: 'DELETE',
      entity: 'Purchase Order',
      entityId: 'PO-2024-003',
      details: 'Deleted purchase order PO-2024-003',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'high'
    },
    {
      id: '4',
      timestamp: '2024-01-15T11:15:00Z',
      user: 'Tom Brown',
      action: 'STOCK_IN',
      entity: 'Stock Movement',
      entityId: 'SM-001',
      details: 'Stock in: 50 units of Premium Brake Pads from PO-2024-001',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      severity: 'low'
    },
    {
      id: '5',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'Sarah Wilson',
      action: 'STOCK_OUT',
      entity: 'Stock Movement',
      entityId: 'SM-002',
      details: 'Stock out: 12 units of Engine Oil 5W-30 for Job JOB-2024-045',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      severity: 'medium'
    },
    {
      id: '6',
      timestamp: '2024-01-15T09:45:00Z',
      user: 'Admin User',
      action: 'SECURITY',
      entity: 'User Account',
      entityId: 'USR-001',
      details: 'Failed login attempt detected from suspicious IP',
      ipAddress: '203.0.113.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'critical'
    }
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'STOCK_IN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'STOCK_OUT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SECURITY':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="w-4 h-4" />;
      case 'UPDATE':
        return <Edit className="w-4 h-4" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4" />;
      case 'STOCK_IN':
      case 'STOCK_OUT':
        return <Package className="w-4 h-4" />;
      case 'SECURITY':
        return <Shield className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesUser = userFilter === 'all' || log.user === userFilter;
    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueUsers = [...new Set(auditLogs.map(log => log.user))];
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Audit Logs
          </h2>
          <p className="text-gray-600 mt-2">Track all system activities and security events</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className={`flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 ${
              isLoading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {uniqueActions.map((action, index) => (
          <div
            key={action}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
              animatedStats ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{action.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {auditLogs.filter(log => log.action === action).length}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${getActionColor(action).split(' ')[0]} border`}>
                {getActionIcon(action)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex space-x-4">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">System Activity Log</h3>
            </div>
            <span className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {auditLogs.length} entries
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Timestamp</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Action</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Entity</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Details</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Severity</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">IP Address</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const { date, time } = formatTimestamp(log.timestamp);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{date}</p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {log.user.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{log.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm border ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        <span>{log.action.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.entity}</p>
                        <p className="text-xs text-gray-500 font-mono">{log.entityId}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </p>
                      {log.changes && (
                        <div className="mt-2 space-y-1">
                          {log.changes.map((change, index) => (
                            <div key={index} className="text-xs bg-gray-50 p-2 rounded border-l-2 border-blue-400">
                              <span className="font-medium text-gray-700">{change.field}:</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-red-600 line-through bg-red-50 px-1 rounded">
                                  {change.oldValue}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-green-600 bg-green-50 px-1 rounded">
                                  {change.newValue}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {log.ipAddress}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-100 rounded-lg transition-all duration-200" title="View Details">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredLogs.length}</span> of{' '}
            <span className="font-medium">{auditLogs.length}</span> entries
          </p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;