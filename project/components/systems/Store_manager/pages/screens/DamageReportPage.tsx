'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Search,
  Eye,
  User,
  Clock,
  Wrench,
  Loader,
  FileText,
  Package,
  AlertOctagon,
} from 'lucide-react';

// Types remain the same
interface Tool {
  id: number;
  toolId: string;
  name: string;
  brand: string;
  quantity: number;
  minStock: number;
  status: string;
  toolCondition: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
}

interface DamageReport extends Tool {
  reportedBy: string;
  damageNotes: string | null;
  reportedAt: string | null;
  damagedQuantity: number;
  activityUser: string | null;
  activityMessage: string | null;
  activityLoggedAt: string | null;
}

interface Mechanic {
  id: number;
  full_name: string;
  role: string;
  mechanic_status: string;
}

const DamageReportPage = () => {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [reporting, setReporting] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state
  const [form, setForm] = useState<{
    toolId: number | '';
    mechanicId: number | '';
    damageNotes: string;
    damagedQuantity: number;
  }>({
    toolId: '',
    mechanicId: '',
    damageNotes: '',
    damagedQuantity: 1,
  });

  // --- Fetch Data (unchanged) ---

  const fetchDamageReports = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/damage-reports');
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        const reports: DamageReport[] = data.data.map((r: any) => ({
          id: r.id,
          toolId: r.tool_id || '',
          name: r.tool_name || '',
          brand: r.brand || '',
          quantity: r.quantity || 0,
          minStock: r.min_stock || 0,
          status: r.status || '',
          toolCondition: r.tool_condition || '',
          imageUrl: r.image_url || null,
          createdAt: r.created_at || '',
          updatedAt: r.updated_at || '',
          notes: r.notes ?? null,
          reportedBy: r.reportedBy || 'Unknown',
          damageNotes: r.damageNotes ?? null,
          reportedAt: r.reportedAt || null,
          damagedQuantity: r.damagedQuantity || 1,
          activityUser: r.activityUser ?? null,
          activityMessage: r.activityMessage ?? null,
          activityLoggedAt: r.activityLoggedAt ?? null,
        }));
        setReports(reports);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Failed to fetch damage reports:', err);
      setReports([]);
    }
  };

  const fetchAvailableTools = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools/tools-get');
      const data = await res.json();
      
      if (data.success) {
        const available = data.data
          .filter((t: any) => t.status !== 'Damaged')
          .map((t: any) => ({
            id: t.id,
            toolId: t.tool_id || '',
            name: t.tool_name || '',
            brand: t.brand || '',
            quantity: t.quantity || 0,
            minStock: t.min_stock || 0,
            status: t.status || '',
            toolCondition: t.tool_condition || '',
            imageUrl: t.image_url || null,
            createdAt: t.created_at || '',
            updatedAt: t.updated_at || '',
            notes: t.notes ?? null,
          }));
        setTools(available);
      }
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    }
  };

  const fetchAllTools = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools/tools-get');
      const data = await res.json();
      
      if (data.success) {
        const all = data.data.map((t: any) => ({
          id: t.id,
          toolId: t.tool_id || '',
          name: t.tool_name || '',
          brand: t.brand || '',
          quantity: t.quantity || 0,
          minStock: t.min_stock || 0,
          status: t.status || '',
          toolCondition: t.tool_condition || '',
          imageUrl: t.image_url || null,
          createdAt: t.created_at || '',
          updatedAt: t.updated_at || '',
          notes: t.notes ?? null,
        }));
        setAllTools(all);
      }
    } catch (err) {
      console.error('Failed to fetch all tools:', err);
    }
  };

  const fetchMechanics = async () => {
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/mechanic/mechanics-fetch');
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response was not JSON');
      }

      const data = await res.json();

      let mechanicsData: Mechanic[] = [];
      
      if (Array.isArray(data)) {
        mechanicsData = data;
      } else if (data && data.success && Array.isArray(data.data)) {
        mechanicsData = data.data;
      } else if (data && Array.isArray(data.mechanics)) {
        mechanicsData = data.mechanics;
      } else {
        console.warn('Unexpected mechanics data format:', data);
        mechanicsData = [];
      }

      setMechanics(mechanicsData);
      
      if (mechanicsData.length > 0 && form.mechanicId === '') {
        setForm((prev) => ({ ...prev, mechanicId: mechanicsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch mechanics:', err);
      alert('Failed to load mechanics. Check console.');
      setMechanics([]);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDamageReports(), 
        fetchAvailableTools(),
        fetchMechanics()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = async () => {
    setModalLoading(true);
    try {
      await Promise.all([fetchAllTools(), fetchMechanics()]);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error refreshing data for modal:', error);
      alert('Failed to load tools and mechanics. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Helpers ---

  const getAvailableQuantity = (tool: Tool) => {
    const damagedCount = reports
      .filter((r) => r.id === tool.id)
      .reduce((sum, r) => sum + r.damagedQuantity, 0);
    return Math.max(0, tool.quantity - damagedCount);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'toolId' || name === 'mechanicId' || name === 'damagedQuantity'
        ? value === '' ? '' : Number(value)
        : value,
    }));
  };

  // --- Submit Damage Report (unchanged) ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.toolId === '') return alert('Please select a tool');
    if (form.mechanicId === '') return alert('Please select a mechanic');
    if (form.damagedQuantity < 1) return alert('Quantity must be at least 1');

    const tool = allTools.find((t) => t.id === form.toolId);
    if (!tool) return alert('Tool not found');
    
    const availableQuantity = getAvailableQuantity(tool);
    if (form.damagedQuantity > availableQuantity) {
      return alert(`Only ${availableQuantity} units available for this tool`);
    }

    const mechanic = mechanics.find((m) => m.id === form.mechanicId);
    if (!mechanic) return alert('Mechanic not found');

    setReporting(true);
    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools/damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolID: form.toolId,
          damagedQuantity: form.damagedQuantity,
          damageNotes: form.damageNotes,
          reportedBy: mechanic.full_name,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      if (result.success) {
        alert('✅ Tool damage reported successfully!');
        setForm({ 
          toolId: '', 
          mechanicId: '', 
          damageNotes: '', 
          damagedQuantity: 1 
        });
        setIsModalOpen(false);
        await refreshData();
      } else {
        alert(`❌ ${result.message || 'Failed to report damage'}`);
      }
    } catch (err) {
      console.error('Error reporting damage:', err);
      alert('⚠️ Network error. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  // --- Mark as Repaired (unchanged) ---

  const handleResolve = async (report: DamageReport) => {
    if (!window.confirm(`Mark "${report.name}" as repaired and set to Available?`)) return;

    try {
      const res = await fetch(`https://ipasystem.bymsystem.com/api/tools/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: report.name,
          brand: report.brand,
          category: 'General',
          quantity: report.quantity,
          minStock: report.minStock,
          condition: 'Poor',
          cost: 0,
          status: 'Available',
          notes: `${report.notes || ''}\n[Repaired] Restored on ${new Date().toISOString().split('T')[0]} by Admin`,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert('✅ Tool status updated to Available');
        await refreshData();
      } else {
        alert(`❌ Update failed: ${result.message}`);
      }
    } catch (err) {
      alert('⚠️ Failed to update tool');
      console.error(err);
    }
  };

  const filteredReports = reports.filter((r) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (r.name?.toLowerCase() || '').includes(searchLower) ||
      (r.brand?.toLowerCase() || '').includes(searchLower) ||
      (r.toolId?.toLowerCase() || '').includes(searchLower) ||
      (r.reportedBy?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen text-black">
      {/* Header remains the same */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-10 h-10 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🛠️ Tool Damage Management</h1>
            <p className="text-gray-600">Report, track, and restore damaged tools</p>
          </div>
        </div>
        <button
          onClick={openReportModal}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Report Damage</span>
        </button>
      </div>

      {/* Stats remain the same */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-600">{reports.length}</h3>
          <p className="text-gray-600">Damage Reports</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-600">
            {reports.reduce((sum, r) => sum + r.damagedQuantity, 0)}
          </h3>
          <p className="text-gray-600">Units Damaged</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-600">
            {tools.reduce((sum, t) => sum + getAvailableQuantity(t), 0)}
          </h3>
          <p className="text-gray-600">Available</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-blue-600">{mechanics.length}</h3>
          <p className="text-gray-600">Mechanics</p>
        </div>
      </div>

      {/* Search remains the same */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tool name, ID, brand, or reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
          />
        </div>
      </div>

      {/* List remains the same */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">
            <Loader className="w-8 h-8 animate-spin mx-auto text-red-500" />
            <p className="text-gray-500 mt-2">Loading damage reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded-2xl p-8 shadow">
            🛠️ No damaged tools reported yet.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{report.name}</h3>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      DAMAGED
                    </span>
                  </div>
                  <p className="text-sm text-gray-600"><strong>ID:</strong> {report.toolId}</p>
                  <p className="text-sm text-gray-600"><strong>Brand:</strong> {report.brand}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Available:</strong> {getAvailableQuantity(report)} / {report.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Reported:</strong> {new Date(report.reportedAt!).toLocaleString()}
                  </p>
                  
                  {report.damageNotes && (
                    <p className="text-sm italic text-gray-700 mt-1"><strong>Damage Notes:</strong>"{report.damageNotes}"</p>
                  )}
                </div>
                <div className="flex space-x-2 mt-2 lg:mt-0">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setIsDetailsOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleResolve(report)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Mark as Repaired"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Modal remains the same */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold flex items-center text-red-600">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Report Tool Damage
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {modalLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="w-8 h-8 animate-spin text-red-500" />
                <span className="ml-2 text-gray-600">Loading tools and mechanics...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tool</label>
                    {allTools.length > 0 ? (
                      <select
                        name="toolId"
                        value={form.toolId === '' ? '' : form.toolId}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-200 rounded-lg text-gray-800 bg-white"
                        required
                      >
                        <option value="" className="text-gray-800">Select a tool</option>
                        {allTools.map((tool) => {
                          const available = getAvailableQuantity(tool);
                          return (
                            <option 
                              key={tool.id} 
                              value={tool.id} 
                              className="text-gray-800"
                              disabled={available <= 0}
                            >
                              {tool.name} (ID: {tool.toolId}) 
                              {tool.status === 'Damaged' ? ' [Damaged]' : ''}
                              {available > 0 ? ` (${available} available)` : ' (None available)'}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                        No tools available. Please check your connection or try again later.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reported By (Mechanic)</label>
                    {mechanics.length > 0 ? (
                      <select
                        name="mechanicId"
                        value={form.mechanicId === '' ? '' : form.mechanicId}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-200 rounded-lg text-gray-800 bg-white"
                        required
                      >
                        <option value="" className="text-gray-800">Select a mechanic</option>
                        {mechanics.map((m) => (
                          <option key={m.id} value={m.id} className="text-gray-800">
                            {m.full_name} ({m.mechanic_status})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                        No mechanics available. Please check your connection or try again later.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Damaged</label>
                    <input
                      type="number"
                      name="damagedQuantity"
                      value={form.damagedQuantity}
                      onChange={handleChange}
                      min="1"
                      max={form.toolId ? getAvailableQuantity(allTools.find(t => t.id === form.toolId)!) : 1}
                      className="w-full p-3 border border-gray-200 rounded-lg text-gray-800 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Damage Notes</label>
                    <textarea
                      name="damageNotes"
                      value={form.damageNotes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 border border-gray-200 rounded-lg text-gray-800 bg-white"
                      placeholder="Describe the damage..."
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70"
                  >
                    {reporting ? 'Reporting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Details Modal - Updated to highlight damagedQuantity */}
      {isDetailsOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              Damage Details
            </h3>
            
            {/* Tool Information */}
            <div className="space-y-3 text-gray-800 mb-6">
              <p><strong>Tool:</strong> {selectedReport.name}</p>
              <p><strong>ID:</strong> {selectedReport.toolId}</p>
              <p><strong>Brand:</strong> {selectedReport.brand}</p>
              
              {/* Quantity Information with Visual Indicators */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Package className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium">Total Quantity</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedReport.quantity}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertOctagon className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium">Damaged Quantity</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{selectedReport.damagedQuantity}</p>
                </div>
              </div>
              
              <p><strong>Available:</strong> {getAvailableQuantity(selectedReport)}</p>
              <p><strong>Reported By:</strong> {selectedReport.reportedBy}</p>
              <p><strong>Date:</strong> {new Date(selectedReport.reportedAt!).toLocaleString()}</p>
              
              {selectedReport.damageNotes && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <strong>Damage Notes:</strong>
                  <p className="mt-1 italic">{selectedReport.damageNotes}</p>
                </div>
              )}

              {selectedReport.notes && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <strong>Tool Notes:</strong>
                  <p className="mt-1 text-sm">{selectedReport.notes}</p>
                </div>
              )}
            </div>
            
            {/* Activity Log Section */}
            {(selectedReport.activityUser || selectedReport.activityMessage) && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <strong className="text-blue-800">Activity Log</strong>
                </div>
                
                {selectedReport.activityUser && (
                  <p className="text-sm"><strong>Used by:</strong> {selectedReport.activityUser}</p>
                )}
                
                {selectedReport.activityMessage && (
                  <p className="text-sm mt-1"><strong>Message:</strong> {selectedReport.activityMessage}</p>
                )}
                
                {selectedReport.activityLoggedAt && (
                  <p className="text-sm mt-1 text-gray-600">
                    <strong>Logged at:</strong> {new Date(selectedReport.activityLoggedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleResolve(selectedReport)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark as Repaired (Available)
              </button>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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

export default DamageReportPage;