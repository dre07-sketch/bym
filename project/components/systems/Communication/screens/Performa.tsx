'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Updated import
import { Close } from '@radix-ui/react-toast';
// Icons from Lucide React
import {
  Receipt,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  X,
  Loader,
  MoreVertical,
  Calendar,
  User,
  Car,
  FileText,
  ChevronDown,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Star,
  Package,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Building,
  Hash,
  CreditCard,
  File,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Zap
} from 'lucide-react';
import PerformaInvoice from '../popup/PerformaInvoice';

interface ProformaItem {
  id: number;
  description: string;
  size?: string;
  quantity: number;
  unit_price: number;
}

interface Proforma {
  id: number;
  proforma_number: string;
  proforma_date: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  vehicle?: string;
  status: 'Draft' | 'Awaiting Send' | 'Sent' | 'Accepted' | 'Cancelled';
  subtotal: number;
  vat_amount: number;
  total: number;
  created_at: string;
  notes?: string;
  items?: ProformaItem[];
}

const Performa: React.FC = () => {
  const router = useRouter(); // Updated hook
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [filteredProformas, setFilteredProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [selectedProformaId, setSelectedProformaId] = useState<number | null>(null);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  // Function to navigate to the PerformaInvoice page
  const handleNewProforma = () => {
  setShowInvoiceModal(true); // ✅ Open modal
};
  // Fetch proformas from backend
  useEffect(() => {
    const fetchProformas = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/communication-center/proformas');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        // Sort by most recent first
        const sorted = result.data.sort(
          (a: Proforma, b: Proforma) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setProformas(sorted);
        setFilteredProformas(sorted);
      } catch (err) {
        console.error('Fetch proformas error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load proforma invoices.');
      } finally {
        setLoading(false);
      }
    };
    fetchProformas();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...proformas];
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(p => {
        const proformaDate = new Date(p.proforma_date);
        return proformaDate >= startDate && proformaDate <= endDate;
      });
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => {
        if (filterStatus === 'awaitingSend') return p.status === 'Awaiting Send';
        return p.status.toLowerCase() === filterStatus.toLowerCase();
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.proforma_number.toLowerCase().includes(term) ||
          (p.customer_name && p.customer_name.toLowerCase().includes(term)) ||
          (p.vehicle && p.vehicle.toLowerCase().includes(term)) ||
          (p.notes && p.notes.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.proforma_date).getTime();
        const dateB = new Date(b.proforma_date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.total - b.total : b.total - a.total;
      } else {
        // Sort by status priority
        const statusOrder = ['Draft', 'Awaiting Send', 'Sent', 'Accepted', 'Cancelled'];
        const statusA = statusOrder.indexOf(a.status);
        const statusB = statusOrder.indexOf(b.status);
        return sortOrder === 'asc' ? statusA - statusB : statusB - statusA;
      }
    });
    
    setFilteredProformas(filtered);
  }, [searchTerm, filterStatus, proformas, dateRange, sortBy, sortOrder]);

  // Fetch proforma details when modal is opened
  useEffect(() => {
    if (selectedProformaId) {
      fetchProformaDetails(selectedProformaId);
    }
  }, [selectedProformaId]);

  // Fetch proforma details for modal
  const fetchProformaDetails = async (id: number) => {
    setModalLoading(true);
    setModalError(null);
    setSelectedProforma(null);
    
    try {
      const response = await fetch(`http://localhost:5001/api/communication-center/proformas/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      setSelectedProforma(result.data);
    } catch (err) {
      console.error('Fetch proforma details error:', err);
      setModalError(err instanceof Error ? err.message : 'Failed to load proforma details.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle view proforma
  const handleViewProforma = (id: number) => {
    setSelectedProformaId(id);
  };

  // Close modal
  const closeModal = () => {
    setSelectedProformaId(null);
    setSelectedProforma(null);
    setModalError(null);
  };

  // Status badge colors
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Draft':
        return { 
          icon: Clock, 
          color: 'bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-700 border-sky-200',
          bgColor: 'from-sky-500 to-cyan-600',
          textColor: 'text-sky-600',
          ring: 'ring-sky-500/20'
        };
      case 'Awaiting Send':
        return { 
          icon: AlertTriangle, 
          color: 'bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-700 border-amber-200',
          bgColor: 'from-amber-500 to-yellow-600',
          textColor: 'text-amber-600',
          ring: 'ring-amber-500/20'
        };
      case 'Sent':
        return { 
          icon: Send, 
          color: 'bg-gradient-to-r from-indigo-100 to-violet-50 text-indigo-700 border-indigo-200',
          bgColor: 'from-indigo-500 to-violet-600',
          textColor: 'text-indigo-600',
          ring: 'ring-indigo-500/20'
        };
      case 'Accepted':
        return { 
          icon: CheckCircle, 
          color: 'bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-700 border-emerald-200',
          bgColor: 'from-emerald-500 to-teal-600',
          textColor: 'text-emerald-600',
          ring: 'ring-emerald-500/20'
        };
      case 'Cancelled':
        return { 
          icon: X, 
          color: 'bg-gradient-to-r from-rose-100 to-pink-50 text-rose-700 border-rose-200',
          bgColor: 'from-rose-500 to-pink-600',
          textColor: 'text-rose-600',
          ring: 'ring-rose-500/20'
        };
      default:
        return { 
          icon: MoreVertical, 
          color: 'bg-gradient-to-r from-gray-100 to-slate-50 text-gray-700 border-gray-200',
          bgColor: 'from-gray-500 to-slate-600',
          textColor: 'text-gray-600',
          ring: 'ring-gray-500/20'
        };
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateRange({ start: '', end: '' });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 md:p-8">
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Floating action buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col space-y-3">
        <button 
          onClick={handleNewProforma}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button className="w-14 h-14 rounded-full bg-white text-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center border border-indigo-100">
          <Filter className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-10">
            <div className="relative">
              <div className="absolute -top-3 -left-3 text-indigo-500">
                <Zap className="w-10 h-10" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 flex items-center">
                <Receipt className="w-12 h-12 mr-4 text-indigo-600" />
                Proforma Invoices
              </h1>
              <p className="text-slate-600 mt-3 text-lg">Manage and track all customer proforma invoices</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-3 px-6 py-4 bg-white border border-indigo-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <Activity className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-slate-700">Refresh</span>
              </button>
              <button 
                onClick={handleNewProforma}
                className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Proforma</span>
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-indigo-50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Proformas</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">{proformas.length}</p>
              <div className="mt-2 flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>12% from last month</span>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-amber-50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Awaiting Send</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {proformas.filter(p => p.status === 'Awaiting Send').length}
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-indigo-50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                  <Send className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Sent</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {proformas.filter(p => p.status === 'Sent').length}
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-emerald-50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Accepted</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {proformas.filter(p => p.status === 'Accepted').length}
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-rose-50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-100 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center mr-3">
                  <X className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Cancelled</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {proformas.filter(p => p.status === 'Cancelled').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-indigo-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by number, customer, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-5 py-4 w-full bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400 shadow-sm"
              />
            </div>
            
            {/* Filter Toggle */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-3 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-100 transition"
            >
              <Filter className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-700">Filters</span>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="awaitingSend">Awaiting Send</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Range Start */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">From Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
                    />
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>

                {/* Date Range End */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
                    />
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Reset Filters Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sorting Controls */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            {filteredProformas.length} Proforma{filteredProformas.length !== 1 ? 's' : ''} Found
            <Star className="w-6 h-6 text-amber-500 ml-3" />
          </h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <span className="text-slate-600 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium shadow-sm"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
              <button 
                onClick={toggleSortOrder}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
              </button>
            </div>
            <button className="flex items-center space-x-3 text-slate-600 hover:text-slate-900 font-medium px-4 py-3 rounded-xl hover:bg-slate-50 transition">
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Proforma List */}
        {loading ? (
          <div className="text-center py-24">
            <div className="relative inline-block">
              <Loader className="w-16 h-16 animate-spin text-indigo-500" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-20"></div>
            </div>
            <p className="text-slate-600 text-xl font-medium mt-6">Loading proforma invoices...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-3xl p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
                <X className="w-10 h-10 text-rose-500" />
              </div>
            </div>
            <p className="text-rose-700 font-bold text-xl mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl hover:from-rose-700 hover:to-pink-700 transition font-medium shadow-lg"
            >
              Retry
            </button>
          </div>
        ) : filteredProformas.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-lg p-16 text-center border border-slate-200">
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 flex items-center justify-center">
                <Receipt className="w-16 h-16 text-indigo-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-4">No Proforma Invoices Found</h3>
            <p className="text-slate-600 mb-10 max-w-2xl mx-auto text-lg">
              {searchTerm || filterStatus !== 'all' || dateRange.start || dateRange.end
                ? 'Try adjusting your search or filter criteria.'
                : 'No proforma invoices have been created yet.'}
            </p>
            <button 
              onClick={handleNewProforma}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition font-medium shadow-lg"
            >
              Create New Proforma
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredProformas.map((p) => {
              const StatusIcon = getStatusConfig(p.status).icon;
              const { color, bgColor, textColor, ring } = getStatusConfig(p.status);
              return (
                <div
                  key={p.id}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
                >
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-8">
                      <div className="flex items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-6 shadow-lg">
                          <Receipt className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-slate-800">{p.proforma_number}</h3>
                          <div className="flex items-center mt-3">
                            <Calendar className="w-5 h-5 text-slate-500 mr-2" />
                            <span className="text-slate-600 font-medium">{formatDate(p.proforma_date)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-8">
                        <span className={`flex items-center space-x-3 px-5 py-3 rounded-full text-sm font-bold border ${color} shadow-sm ring-2 ${ring}`}>
                          <StatusIcon className="w-5 h-5" />
                          <span>{p.status}</span>
                        </span>
                        
                        <div className="text-right">
                          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-700">
                            {formatCurrency(p.total)}
                          </p>
                          <p className="text-sm text-slate-500 mt-2">
                            VAT: {formatCurrency(p.vat_amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                      {p.customer_name && (
                        <div className="flex items-center text-slate-700">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mr-4">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 font-medium block">CUSTOMER</span>
                            <span className="font-semibold text-lg">{p.customer_name}</span>
                          </div>
                        </div>
                      )}
                      
                      {p.vehicle && (
                        <div className="flex items-center text-slate-700">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mr-4">
                            <Car className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 font-medium block">VEHICLE</span>
                            <span className="font-semibold text-lg">{p.vehicle}</span>
                          </div>
                        </div>
                      )}
                      
                      {p.notes && (
                        <div className="flex items-start text-slate-700">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center mr-4 mt-1">
                            <FileText className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 font-medium block">NOTES</span>
                            <p className="font-medium text-lg">{p.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-8 py-6 bg-slate-50 flex justify-end space-x-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleViewProforma(p.id)}
                      className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 group shadow-sm"
                    >
                      <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 group shadow-sm">
                      <Edit className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all duration-300 group shadow-sm">
                      <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proforma Detail Modal */}
      {selectedProformaId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold flex items-center">
                    <Receipt className="w-10 h-10 mr-4" />
                    Proforma Invoice Details
                  </h2>
                  <p className="text-indigo-100 mt-2">
                    {selectedProforma ? selectedProforma.proforma_number : `Proforma #${selectedProformaId}`}
                  </p>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-3 rounded-full hover:bg-indigo-500 transition"
                >
                  <Close className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {modalLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="relative inline-block">
                    <Loader className="w-16 h-16 animate-spin text-indigo-500" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-20"></div>
                  </div>
                  <span className="ml-4 text-slate-600 text-lg">Loading proforma details...</span>
                </div>
              ) : modalError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-700 font-medium text-lg mb-4">Error: {modalError}</p>
                  <button 
                    onClick={() => fetchProformaDetails(selectedProformaId!)}
                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : selectedProforma ? (
                <div className="space-y-10">
                  {/* Proforma Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <Hash className="w-6 h-6 mr-3 text-indigo-600" />
                        Proforma Information
                      </h3>
                      <div className="space-y-5">
                        <div className="flex items-center">
                          <span className="text-slate-500 w-40">Proforma #:</span>
                          <span className="font-medium text-lg">{selectedProforma.proforma_number}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-500 w-40">Date:</span>
                          <span className="font-medium text-lg">{formatDate(selectedProforma.proforma_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-500 w-40">Status:</span>
                          <span className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusConfig(selectedProforma.status).color}`}>
                            {React.createElement(getStatusConfig(selectedProforma.status).icon, { className: "w-4 h-4" })}
                            <span>{selectedProforma.status}</span>
                          </span>
                        </div>
                        {selectedProforma.notes && (
                          <div className="flex items-start">
                            <span className="text-slate-500 w-40">Notes:</span>
                            <span className="font-medium text-lg">{selectedProforma.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <CreditCard className="w-6 h-6 mr-3 text-indigo-600" />
                        Financial Summary
                      </h3>
                      <div className="space-y-5">
                        <div className="flex justify-between">
                          <span className="text-slate-600 text-lg">Subtotal:</span>
                          <span className="font-medium text-lg">{formatCurrency(selectedProforma.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 text-lg">VAT (15%):</span>
                          <span className="font-medium text-lg">{formatCurrency(selectedProforma.vat_amount)}</span>
                        </div>
                        <div className="flex justify-between pt-5 border-t border-slate-200">
                          <span className="text-xl font-bold text-slate-800">Total:</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-700">
                            {formatCurrency(selectedProforma.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

             

                  {/* Items Table */}
                  {selectedProforma.items && selectedProforma.items.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <Package className="w-6 h-6 mr-3 text-indigo-600" />
                        Items
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="text-left p-4 font-semibold text-slate-700">Description</th>
                              <th className="text-left p-4 font-semibold text-slate-700">Size</th>
                              <th className="text-right p-4 font-semibold text-slate-700">Quantity</th>
                              <th className="text-right p-4 font-semibold text-slate-700">Unit Price</th>
                              <th className="text-right p-4 font-semibold text-slate-700">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProforma.items.map((item, index) => (
                              <tr key={item.id || index} className="hover:bg-slate-50 border-b border-slate-100">
                                <td className="p-4">{item.description}</td>
                                <td className="p-4">{item.size || '-'}</td>
                                <td className="p-4 text-right">{item.quantity}</td>
                                <td className="p-4 text-right">{formatCurrency(item.unit_price)}</td>
                                <td className="p-4 text-right font-medium">
                                  {formatCurrency(item.quantity * item.unit_price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                    <File className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-lg">No proforma details available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end space-x-4">
              <button 
                onClick={closeModal}
                className="px-6 py-3 bg-white border border-slate-300 rounded-2xl text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

    
    </div>
  );
};

export default Performa;