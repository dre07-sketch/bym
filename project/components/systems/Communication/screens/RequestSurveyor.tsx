import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Eye, Clock, CheckCircle, AlertTriangle, User, Calendar, MapPin, Phone, Mail, 
  FileText, Settings, Wrench, Package, Clipboard, Receipt, X, TrendingUp, Activity, Users, BarChart3, 
  PieChart, Star, Navigation, PenTool as Tool, Cog, ShoppingCart, ClipboardList, PrinterIcon, 
  Truck, ExternalLink, Hammer, Wrench as WrenchIcon, Shield, DollarSign, Inbox, Trash2, Recycle
} from 'lucide-react';

// Define TypeScript interfaces
interface SalvageItem {
  id: number;
  ticket_number: string;
  item_name: string;
  condition: string;
  status: string;
  notes: string;
  logged_at: string;
  estimated_value: number;
}

interface SalvageInspection {
  id: number;
  ticket_number: string;
  item: string;
  result: string;
  notes: string;
  inspected_at: string;
}

interface SalvageAssignment {
  id: number;
  ticket_number: string;
  technician_id: string;
  technician_name: string;
  role: string;
  assigned_at: string;
}

interface SalvagePart {
  id: number;
  ticket_number: string;
  part_name: string;
  quantity: number;
  cost: number;
  status: string;
  ordered_at: string;
}

interface SalvageVendor {
  id: number;
  ticket_number: string;
  company_name: string;
  contact_person: string;
  phone: string;
  service_details: string;
  cost: number;
  status: string;
  assigned_at: string;
}

interface SalvageMaterial {
  id: number;
  ticket_number: string;
  material_name: string;
  quantity: number;
  supplier: string;
  cost: number;
  status: string;
  ordered_at: string;
}

interface SalvageLog {
  id: number;
  ticket_number: string;
  action: string;
  status: string;
  notes: string;
  logged_at: string;
}

interface SalvageEquipment {
  id: number;
  ticket_number: string;
  equipment_name: string;
  duration: string;
  assigned_to: string;
  assigned_at: string;
}

interface SalvageTicket {
  id: number;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  customer_type: string;
  vehicle_id: string;
  vehicle_info: string;
  license_plate: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  technician_assign: string;
  inspector_assign: string;
  estimated_completion_date: string;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
  salvageItems: SalvageItem[];
  inspections: SalvageInspection[];
  salvageAssignments: SalvageAssignment[];
  salvageParts: SalvagePart[];
  salvageVendors: SalvageVendor[];
  salvageMaterials: SalvageMaterial[];
  salvageLogs: SalvageLog[];
  equipmentAssignments: SalvageEquipment[];
}

interface SalvageTicketDetailModalProps {
  ticket: SalvageTicket;
  onClose: () => void;
}

const SalvageTicketDetailModal: React.FC<SalvageTicketDetailModalProps> = ({ ticket, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  if (!ticket) return null;
  
  // Calculate total costs for billing
  const calculateTotalCost = () => {
    const partsTotal = ticket.salvageParts?.reduce((sum: number, part: SalvagePart) => sum + (part.cost * part.quantity), 0) || 0;
    const vendorsTotal = ticket.salvageVendors?.reduce((sum: number, vendor: SalvageVendor) => sum + vendor.cost, 0) || 0;
    const materialsTotal = ticket.salvageMaterials?.reduce((sum: number, material: SalvageMaterial) => sum + (material.cost * material.quantity), 0) || 0;
    
    return {
      parts: partsTotal,
      vendors: vendorsTotal,
      materials: materialsTotal,
      total: partsTotal + vendorsTotal + materialsTotal
    };
  };
  
  const costs = calculateTotalCost();
  
  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'salvageLogs', label: 'Salvage Logs', icon: ClipboardList },
    { id: 'salvageItems', label: 'Salvage Items', icon: Trash2 },
    { id: 'inspections', label: 'Inspections', icon: Shield },
    { id: 'salvageAssignments', label: 'Technician Assignments', icon: Users },
    { id: 'salvageParts', label: 'Salvage Parts', icon: Package },
    { id: 'salvageVendors', label: 'Salvage Vendors', icon: Truck },
    { id: 'salvageMaterials', label: 'Salvage Materials', icon: Recycle },
    { id: 'equipmentAssignments', label: 'Equipment Assignments', icon: WrenchIcon },
    { id: 'bill', label: 'Bill', icon: Receipt }
  ];
  
  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{ticket.title || 'No Title'}</h3>
                  <p className="text-gray-600 mt-1">{ticket.description || 'No Description'}</p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.priority?.toUpperCase() || 'MEDIUM'}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {ticket.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Ticket Number</p>
                  <p className="font-medium">{ticket.ticket_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Completion</p>
                  <p className="font-medium">{ticket.estimated_completion_date ? new Date(ticket.estimated_completion_date).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual Completion</p>
                  <p className="font-medium">{ticket.completion_date ? new Date(ticket.completion_date).toLocaleDateString() : 'Not completed'}</p>
                </div>
              </div>
            </div>
            
            {/* Customer & Vehicle Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{ticket.customer_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{ticket.customer_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{ticket.customer_id || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Navigation className="w-5 h-5 mr-2 text-green-500" />
                  Vehicle Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Info</p>
                    <p className="font-medium">{ticket.vehicle_info || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">License Plate</p>
                    <p className="font-medium">{ticket.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle ID</p>
                    <p className="font-medium">{ticket.vehicle_id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Assigned Personnel */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                Assigned Personnel
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Inspector</p>
                  <p className="font-medium">{ticket.inspector_assign || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Technician</p>
                  <p className="font-medium">{ticket.technician_assign || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'salvageLogs':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-blue-500" />
              Salvage Timeline
            </h4>
            {ticket.salvageLogs && ticket.salvageLogs.length > 0 ? (
              <div className="space-y-3">
                {ticket.salvageLogs.map((log: SalvageLog, index: number) => (
                  <div key={index} className="flex items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h5 className="font-medium text-gray-800">{log.action || 'No action'}</h5>
                        <span className="text-sm text-gray-500">{log.logged_at ? new Date(log.logged_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.notes || 'No additional notes'}</p>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          log.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No salvage logs available</p>
              </div>
            )}
          </div>
        );
        
      case 'salvageItems':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-purple-500" />
              Salvage Items
            </h4>
            {ticket.salvageItems && ticket.salvageItems.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ticket.salvageItems.map((item: SalvageItem, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.condition || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'salvaged' ? 'bg-green-100 text-green-800' : 
                            item.status === 'recycled' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">${item.estimated_value ? item.estimated_value.toFixed(2) : '0.00'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No salvage items recorded</p>
              </div>
            )}
          </div>
        );
        
      case 'inspections':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-500" />
              Inspection Results
            </h4>
            {ticket.inspections && ticket.inspections.length > 0 ? (
              <div className="space-y-4">
                {ticket.inspections.map((inspection: SalvageInspection, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium text-gray-800">{inspection.item || 'No item'}</h5>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inspection.result === 'passed' ? 'bg-green-100 text-green-800' : 
                        inspection.result === 'failed' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inspection.result?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{inspection.notes || 'No additional notes'}</p>
                    <div className="mt-3 text-xs text-gray-500">
                      Inspected on: {inspection.inspected_at ? new Date(inspection.inspected_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No inspection results available</p>
              </div>
            )}
          </div>
        );
        
      case 'salvageAssignments':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" />
              Technician Assignments
            </h4>
            {ticket.salvageAssignments && ticket.salvageAssignments.length > 0 ? (
              <div className="space-y-4">
                {ticket.salvageAssignments.map((assignment: SalvageAssignment, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-800">{assignment.technician_name || 'No name'}</h5>
                        <p className="text-sm text-gray-600 mt-1">Role: {assignment.role || 'No role'}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        ID: {assignment.technician_id || 'N/A'}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Assigned on: {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No technician assignments recorded</p>
              </div>
            )}
          </div>
        );
        
      case 'salvageParts':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-800 text-lg flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-500" />
                Salvage Parts
              </h4>
              <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm flex items-center">
                <Plus className="w-4 h-4 mr-1" />
                Add Part
              </button>
            </div>
            
            {ticket.salvageParts && ticket.salvageParts.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ticket.salvageParts.map((part: SalvagePart, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.part_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{part.quantity || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${part.cost ? part.cost.toFixed(2) : '0.00'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            part.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                            part.status === 'ordered' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {part.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{part.ordered_at ? new Date(part.ordered_at).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No salvage parts ordered yet</p>
                <p className="text-gray-400 text-sm mt-1">Parts ordered for this salvage operation will appear here</p>
              </div>
            )}
          </div>
        );
        
      case 'salvageVendors':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <Truck className="w-5 h-5 mr-2 text-orange-500" />
              Salvage Vendors
            </h4>
            {ticket.salvageVendors && ticket.salvageVendors.length > 0 ? (
              <div className="space-y-4">
                {ticket.salvageVendors.map((vendor: SalvageVendor, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-800">{vendor.company_name || 'No company'}</h5>
                        <p className="text-sm text-gray-600 mt-1">Contact: {vendor.contact_person || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Phone: {vendor.phone || 'N/A'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        vendor.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        vendor.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vendor.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-700">{vendor.service_details || 'No service details'}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm font-medium text-gray-900">${vendor.cost ? vendor.cost.toFixed(2) : '0.00'}</span>
                        <span className="text-xs text-gray-500">Assigned: {vendor.assigned_at ? new Date(vendor.assigned_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No salvage vendors assigned</p>
              </div>
            )}
          </div>
        );
        
      case 'salvageMaterials':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <Recycle className="w-5 h-5 mr-2 text-green-500" />
              Salvage Materials
            </h4>
            {ticket.salvageMaterials && ticket.salvageMaterials.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ticket.salvageMaterials.map((material: SalvageMaterial, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{material.material_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{material.quantity || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{material.supplier || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${material.cost ? material.cost.toFixed(2) : '0.00'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            material.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                            material.status === 'ordered' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {material.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{material.ordered_at ? new Date(material.ordered_at).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <Recycle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No salvage materials recorded</p>
              </div>
            )}
          </div>
        );
        
      case 'equipmentAssignments':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <WrenchIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Equipment Assignments
            </h4>
            {ticket.equipmentAssignments && ticket.equipmentAssignments.length > 0 ? (
              <div className="space-y-4">
                {ticket.equipmentAssignments.map((equipment: SalvageEquipment, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-800">{equipment.equipment_name || 'No equipment name'}</h5>
                        <p className="text-sm text-gray-600 mt-1">Duration: {equipment.duration || 'N/A'}</p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        Assigned to: {equipment.assigned_to || 'N/A'}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Assigned on: {equipment.assigned_at ? new Date(equipment.assigned_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <WrenchIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No equipment assigned yet</p>
              </div>
            )}
          </div>
        );
        
      case 'bill':
        return (
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-800 text-lg flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-red-500" />
              Salvage Billing Summary
            </h4>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium text-gray-800">Cost Breakdown</h5>
                <span className="text-sm text-gray-600">Ticket: {ticket.ticket_number || 'N/A'}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-blue-500" />
                    <span>Salvage Parts</span>
                  </div>
                  <span className="font-medium">${costs.parts.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 mr-2 text-orange-500" />
                    <span>Salvage Vendors</span>
                  </div>
                  <span className="font-medium">${costs.vendors.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <Recycle className="w-4 h-4 mr-2 text-green-500" />
                    <span>Salvage Materials</span>
                  </div>
                  <span className="font-medium">${costs.materials.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-800">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">${costs.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center">
                <PrinterIcon className="w-4 h-4 mr-2" />
                Print Invoice
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Process Payment
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Salvage Ticket: {ticket.ticket_number || 'N/A'}</h2>
              <p className="text-green-100">{ticket.customer_name || 'N/A'}</p>
            </div>
          </div>
          
          {/* Status Badge in Header */}
          <div className="absolute top-6 right-16">
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium capitalize">
              {ticket.status?.replace('_', ' ') || 'pending'}
            </span>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {renderTabContent()}
        </div>
        
        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium flex items-center space-x-2">
            <PrinterIcon className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestSalvage: React.FC = () => {
  const [tickets, setTickets] = useState<SalvageTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SalvageTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    awaitingApproval: 0
  });
  
  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from the API endpoint
        const response = await fetch('http://localhost:5001/api/communication-center/awaiting-salvage');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Log the API response for debugging
        console.log('API Response:', data);
        setApiResponse(data);
        
        // Check if data is an array
        if (!Array.isArray(data)) {
          throw new Error('API response is not an array');
        }
        
        // Transform the data to match our interface if needed
        const transformedData: SalvageTicket[] = data.map((item: any) => {
          // Log each item for debugging
          console.log('Processing ticket item:', item);
          
          return {
            id: item.id || 0,
            ticket_number: item.ticket_number || '',
            customer_id: item.customer_id || '',
            customer_name: item.customer_name || '',
            customer_type: item.customer_type || '',
            vehicle_id: item.vehicle_id || '',
            vehicle_info: item.vehicle_info || '',
            license_plate: item.license_plate || '',
            title: item.title || '',
            description: item.description || '',
            priority: item.priority || 'medium',
            status: item.status || 'pending',
            technician_assign: item.technician_assign || '',
            inspector_assign: item.inspector_assign || '',
            estimated_completion_date: item.estimated_completion_date || '',
            completion_date: item.completion_date || null,
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
            salvageItems: Array.isArray(item.salvageItems) ? item.salvageItems : [],
            inspections: Array.isArray(item.inspections) ? item.inspections : [],
            salvageAssignments: Array.isArray(item.salvageAssignments) ? item.salvageAssignments : [],
            salvageParts: Array.isArray(item.salvageParts) ? item.salvageParts : [],
            salvageVendors: Array.isArray(item.salvageVendors) ? item.salvageVendors : [],
            salvageMaterials: Array.isArray(item.salvageMaterials) ? item.salvageMaterials : [],
            salvageLogs: Array.isArray(item.salvageLogs) ? item.salvageLogs : [],
            equipmentAssignments: Array.isArray(item.equipmentAssignments) ? item.equipmentAssignments : []
          };
        });
        
        setTickets(transformedData);
        
        // Calculate analytics
        const stats = transformedData.reduce((acc, ticket) => {
          acc.total++;
          switch (ticket.status) {
            case 'pending': acc.pending++; break;
            case 'in_progress': acc.inProgress++; break;
            case 'completed': acc.completed++; break;
            case 'awaiting_approval': acc.awaitingApproval++; break;
          }
          return acc;
        }, { total: 0, pending: 0, inProgress: 0, completed: 0, awaitingApproval: 0 });
        
        setAnalytics(stats);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setError(`Failed to fetch tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, []);
  
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'awaiting_approval': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Activity className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'awaiting_approval': return <FileText className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const openTicketDetails = (ticket: SalvageTicket) => {
    setSelectedTicket(ticket);
  };
  
  const closeModal = () => {
    setSelectedTicket(null);
  };
  
  // Add resetFilters function
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading salvage tickets...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">No ticket available</h2>              
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Request Salvage
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{analytics.total}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Tickets</h3>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{analytics.pending}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Pending</h3>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{analytics.inProgress}</span>
            </div>
            <h3 className="text-gray-600 font-medium">In Progress</h3>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{analytics.completed}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Completed</h3>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{analytics.awaitingApproval}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Awaiting Approval</h3>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name, ticket ID, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-200 outline-none transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-200 outline-none transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="awaiting_approval">Awaiting Approval</option>
            </select>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Salvage Ticket</span>
          </button>
        </div>
        
        {/* Tickets Grid */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden cursor-pointer"
                onClick={() => openTicketDetails(ticket)}
              >
                <div className="relative p-6">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  {/* Ticket Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Trash2 className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Ticket Details */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-green-600 transition-colors duration-200">
                      {ticket.customer_name || 'No Name'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">Ticket: {ticket.ticket_number || 'N/A'}</p>
                    <p className="text-gray-600 text-sm line-clamp-2">{ticket.description || 'No Description'}</p>
                  </div>
                  
                  {/* Priority */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                  </div>
                  
                  {/* Date and Technician */}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>{ticket.technician_assign || 'Not assigned'}</span>
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Enhanced No Tickets UI */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <Inbox className="w-16 h-16 text-green-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <X className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-3">No Salvage Tickets Found</h3>
            
            <div className="text-center max-w-lg mb-8">
              <p className="text-gray-600 mb-4">
                {tickets.length === 0 
                  ? "There are no salvage tickets in the system at the moment."
                  : "We couldn't find any salvage tickets matching your search or filter criteria."}
              </p>
              
              {tickets.length > 0 && (
                <div className="inline-flex items-center bg-green-50 text-green-700 rounded-full px-4 py-2 mb-4">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>
                    {searchTerm && `Searching for "${searchTerm}"`}
                    {filterStatus !== 'all' && ` • Status: ${filterStatus.replace('_', ' ')}`}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {tickets.length === 0 ? (
                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <Plus className="w-5 h-5" />
                  <span>Create New Salvage Ticket</span>
                </button>
              ) : (
                <button 
                  onClick={resetFilters}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-xl hover:from-gray-600 hover:to-gray-800 transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Filter className="w-5 h-5" />
                  <span>Reset Filters</span>
                </button>
              )}
              
              <button className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow hover:shadow-md">
                <FileText className="w-5 h-5" />
                <span>View Documentation</span>
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Create New Ticket</h4>
                <p className="text-sm text-gray-600">Start a new salvage request for a customer</p>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Filter className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Adjust Filters</h4>
                <p className="text-sm text-gray-600">Modify your search criteria to find tickets</p>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">View Analytics</h4>
                <p className="text-sm text-gray-600">Check salvage metrics and performance data</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <SalvageTicketDetailModal ticket={selectedTicket} onClose={closeModal} />
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default RequestSalvage;