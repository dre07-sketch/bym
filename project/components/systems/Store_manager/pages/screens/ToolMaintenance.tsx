'use client';

import React, { useState } from 'react';
import {
  Cog,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Wrench,
  Settings,
  X,
  User,
  DollarSign
} from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  toolId: string;
  toolName: string;
  type: 'preventive' | 'corrective' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  scheduledDate: string;
  completedDate?: string;
  technician?: string;
  description: string;
  cost?: number;
  notes?: string;
  nextMaintenance?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const ToolMaintenance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const mockMaintenanceRecords: MaintenanceRecord[] = [
    {
      id: 'M001',
      toolId: 'T001',
      toolName: 'Hydraulic Jack 3-Ton',
      type: 'preventive',
      status: 'scheduled',
      scheduledDate: '2024-01-20',
      description: 'Routine hydraulic system inspection and fluid check',
      priority: 'medium',
      nextMaintenance: '2024-04-20'
    },
    {
      id: 'M002',
      toolId: 'T002',
      toolName: 'Torque Wrench Set',
      type: 'corrective',
      status: 'in-progress',
      scheduledDate: '2024-01-15',
      technician: 'Mike Johnson',
      description: 'Calibration adjustment and accuracy verification',
      cost: 85.00,
      priority: 'high',
      notes: 'Found slight deviation in torque readings'
    },
    {
      id: 'M003',
      toolId: 'T003',
      toolName: 'Engine Hoist 2-Ton',
      type: 'emergency',
      status: 'completed',
      scheduledDate: '2024-01-10',
      completedDate: '2024-01-12',
      technician: 'Sarah Wilson',
      description: 'Hydraulic leak repair and seal replacement',
      cost: 145.00,
      priority: 'critical',
      notes: 'Replaced main hydraulic seals, tested under load',
      nextMaintenance: '2024-07-10'
    },
    {
      id: 'M004',
      toolId: 'T004',
      toolName: 'Digital Multimeter',
      type: 'preventive',
      status: 'overdue',
      scheduledDate: '2024-01-12',
      description: 'Annual calibration and accuracy testing',
      priority: 'high',
      notes: 'Overdue by 3 days'
    }
  ];

  const filteredRecords = mockMaintenanceRecords.filter(record => {
    const matchesSearch = 
      record.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.technician?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'preventive': return 'bg-green-50 text-green-700 border-green-200';
      case 'corrective': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'emergency': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'in-progress': return <Cog className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const scheduledCount = mockMaintenanceRecords.filter(r => r.status === 'scheduled').length;
  const inProgressCount = mockMaintenanceRecords.filter(r => r.status === 'in-progress').length;
  const overdueCount = mockMaintenanceRecords.filter(r => r.status === 'overdue').length;
  const completedThisMonth = mockMaintenanceRecords.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Tool Maintenance
          </h1>
          <p className="text-gray-600 mt-1">Schedule and track tool maintenance activities</p>
        </div>
        <button 
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Scheduled</p>
              <p className="text-3xl font-bold">{scheduledCount}</p>
              <p className="text-sm text-blue-200">Upcoming tasks</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">In Progress</p>
              <p className="text-3xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-yellow-200">Active work</p>
            </div>
            <Cog className="w-8 h-8 text-yellow-200 animate-spin" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Overdue</p>
              <p className="text-3xl font-bold">{overdueCount}</p>
              <p className="text-sm text-red-200">Need attention</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200 animate-bounce" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Completed</p>
              <p className="text-3xl font-bold">{completedThisMonth}</p>
              <p className="text-sm text-green-200">This month</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tool, description, or technician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="emergency">Emergency</option>
          </select>

          <button className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Maintenance Records */}
      <div className="grid gap-6">
        {filteredRecords.map((record, index) => (
          <div key={record.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${getPriorityColor(record.priority)} animate-pulse`}></div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  record.status === 'scheduled' ? 'from-blue-400 to-blue-600' :
                  record.status === 'in-progress' ? 'from-yellow-400 to-yellow-600' :
                  record.status === 'completed' ? 'from-green-400 to-green-600' :
                  'from-red-400 to-red-600'
                } flex items-center justify-center shadow-lg`}>
                  {getStatusIcon(record.status)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{record.toolName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                      {record.status.replace('-', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(record.type)}`}>
                      {record.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(record.priority)}`}>
                      {record.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Maintenance ID:</span> {record.id}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Tool ID:</span> {record.toolId}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {record.description}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Scheduled:</span> {record.scheduledDate}
                      </p>
                      {record.completedDate && (
                        <p className="text-sm text-green-600 mb-1">
                          <span className="font-medium">Completed:</span> {record.completedDate}
                        </p>
                      )}
                      {record.technician && (
                        <p className="text-sm text-blue-600">
                          <span className="font-medium">Technician:</span> {record.technician}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      {record.cost && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Cost:</span> 
                          <span className="text-green-600 font-semibold ml-1">${record.cost}</span>
                        </p>
                      )}
                      {record.nextMaintenance && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Next Maintenance:</span> {record.nextMaintenance}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Notes:</span> {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-3">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedRecord(record)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                {record.status === 'scheduled' && (
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <Cog className="w-4 h-4" />
                    <span>Start Work</span>
                  </button>
                )}
                
                {record.status === 'in-progress' && (
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete</span>
                  </button>
                )}
                
                {record.status === 'overdue' && (
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Urgent</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Maintenance Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Schedule Maintenance</h2>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Tool</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option>Select a tool</option>
                    <option>Hydraulic Jack 3-Ton</option>
                    <option>Torque Wrench Set</option>
                    <option>Engine Hoist 2-Ton</option>
                    <option>Digital Multimeter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option>Select type</option>
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Technician</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option>Select technician</option>
                  <option>Mike Johnson</option>
                  <option>Sarah Wilson</option>
                  <option>Tom Brown</option>
                  <option>Lisa Davis</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" rows={3} placeholder="Describe the maintenance work to be performed"></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="0.00" />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  Schedule Maintenance
                </button>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Maintenance Details</h2>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Maintenance ID</label>
                  <p className="text-lg font-semibold text-gray-800">{selectedRecord.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tool</label>
                  <p className="text-gray-800">{selectedRecord.toolName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(selectedRecord.type)}`}>
                    {selectedRecord.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Priority</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium text-white ${getPriorityColor(selectedRecord.priority)}`}>
                    {selectedRecord.priority}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRecord.status)}`}>
                    {selectedRecord.status.replace('-', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Scheduled Date</label>
                  <p className="text-gray-800">{selectedRecord.scheduledDate}</p>
                </div>
                {selectedRecord.completedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Completed Date</label>
                    <p className="text-green-600 font-medium">{selectedRecord.completedDate}</p>
                  </div>
                )}
                {selectedRecord.technician && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Technician</label>
                    <p className="text-blue-600 font-medium">{selectedRecord.technician}</p>
                  </div>
                )}
                {selectedRecord.cost && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cost</label>
                    <p className="text-green-600 font-semibold text-lg">${selectedRecord.cost}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
              <p className="text-gray-800 p-3 bg-gray-50 rounded-lg">{selectedRecord.description}</p>
            </div>
            
            {selectedRecord.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">Notes</label>
                <p className="text-gray-800 p-3 bg-gray-50 rounded-lg">{selectedRecord.notes}</p>
              </div>
            )}
            
            {selectedRecord.nextMaintenance && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">Next Maintenance</label>
                <p className="text-blue-600 font-medium">{selectedRecord.nextMaintenance}</p>
              </div>
            )}
            
            <div className="flex space-x-4 pt-6 border-t mt-6">
              <button className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <Edit className="w-4 h-4 mr-2 inline" />
                Edit Record
              </button>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolMaintenance;