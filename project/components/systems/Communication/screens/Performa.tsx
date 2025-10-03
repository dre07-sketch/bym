'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Zap,
  MapPinIcon
} from 'lucide-react';
import PerformaInvoice from '../popup/PerformaInvoice';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ProformaItem {
  id: number;
  description: string;
  size?: string;
  quantity: number;
  unit_price: number;
}

// Updated interface to include both frontend and backend statuses
interface Proforma {
  id: number;
  proforma_number: string;
  proforma_date: string;
  customer_name?: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_vat_number?: string;
  notes?: string;
  status: 'Converted to Ticket' | 'Awaiting Send' | 'Sent' | 'Accepted' | 'Cancelled' | 'Expired' | 'Converted'; // Added 'Converted'
  subtotal: number;
  vat_rate?: number;
  vat_amount: number;
  total: number;
  created_at: string;
  updated_at?: string;
  items?: ProformaItem[];
}

interface PaginationData {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

interface StatusCounts {
  [key: string]: number;
}

const Performa: React.FC = () => {
  const router = useRouter();
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
  
  // Pagination state - ensure it's always defined
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  
  // Modal states
  const [selectedProformaId, setSelectedProformaId] = useState<number | null>(null);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  
  // Status dropdown state
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  
  // Status counts state
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [countsLoading, setCountsLoading] = useState<boolean>(true);
  
  // Allowed statuses - removed 'Expired' as it's not supported by backend
  const allowedStatuses = [
    
    'Awaiting Send',
    'Sent',
    'Accepted',
    'Cancelled'
  ];
  
  // Function to navigate to the PerformaInvoice page
  const handleNewProforma = () => {
    setShowInvoiceModal(true);
  };
  
  // Function to fetch status counts
  const fetchStatusCounts = async () => {
    setCountsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/communication-center/status-counts');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      setStatusCounts(result.counts);
    } catch (err) {
      console.error('Fetch status counts error:', err);
      // We don't set a main error for this, just log it
    } finally {
      setCountsLoading(false);
    }
  };
  
  // Function to refresh data after saving
  const refreshData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus === 'converted' ? 'Converted' : filterStatus }),
        ...(dateRange.start && { date: dateRange.start })
      });
      
      const response = await fetch(`http://localhost:5001/api/communication-center/proformas?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      // Map backend status to frontend status
      const mappedData = result.data.map((proforma: Proforma) => ({
        ...proforma,
        status: proforma.status === 'Converted' ? 'Converted to Ticket' : proforma.status
      }));
      
      setProformas(mappedData);
      setPagination(result.meta || pagination); // Fallback to current pagination if meta is undefined
      setFilteredProformas(mappedData);
      
      // Also refresh status counts
      fetchStatusCounts();
    } catch (err) {
      console.error('Fetch proformas error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proforma invoices.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch proformas and status counts from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch proformas
        const params = new URLSearchParams({
          page: '1',
          limit: '10'
        });
        
        const proformasResponse = await fetch(`http://localhost:5001/api/communication-center/proformas?${params}`);
        if (!proformasResponse.ok) throw new Error(`HTTP ${proformasResponse.status}`);
        const proformasResult = await proformasResponse.json();
        if (!proformasResult.success) throw new Error(proformasResult.message);
        
        // Map backend status to frontend status
        const mappedData = proformasResult.data.map((proforma: Proforma) => ({
          ...proforma,
          status: proforma.status === 'Converted' ? 'Converted to Ticket' : proforma.status
        }));
        
        setProformas(mappedData);
        setPagination(proformasResult.meta || pagination);
        setFilteredProformas(mappedData);
        
        // Fetch status counts
        fetchStatusCounts();
      } catch (err) {
        console.error('Fetch data error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters and search
  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true);
      try {
        // Ensure we have valid pagination values
        const currentPage = pagination?.page || 1;
        const currentLimit = pagination?.limit || 10;
        
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: currentLimit.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(filterStatus !== 'all' && { status: filterStatus === 'converted' ? 'Converted' : filterStatus }),
          ...(dateRange.start && { date: dateRange.start })
        });
        
        const response = await fetch(`http://localhost:5001/api/communication-center/proformas?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        // Map backend status to frontend status
        const mappedData = result.data.map((proforma: Proforma) => ({
          ...proforma,
          status: proforma.status === 'Converted' ? 'Converted to Ticket' : proforma.status
        }));
        
        setProformas(mappedData);
        setPagination(result.meta || { page: currentPage, pages: 1, total: 0, limit: currentLimit });
        setFilteredProformas(mappedData);
        
        // Also refresh status counts
        fetchStatusCounts();
      } catch (err) {
        console.error('Fetch proformas error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load proforma invoices.');
      } finally {
        setLoading(false);
      }
    };
    
    applyFilters();
  }, [searchTerm, filterStatus, dateRange]); // Removed pagination.limit from dependencies
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };
  
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
    // Don't set selectedProforma to null here to preserve existing data
    
    try {
      const response = await fetch(`http://localhost:5001/api/communication-center/proformas/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      // Map backend status to frontend status
      const frontendStatus = result.data.status === 'Converted' ? 'Converted to Ticket' : result.data.status;
      
      // Update selectedProforma while preserving customer info if it exists
      setSelectedProforma(prev => {
        if (prev && prev.id === id) {
          // Preserve customer_name and company_name from previous state if they exist
          return {
            ...result.data,
            status: frontendStatus,
            customer_name: prev.customer_name || result.data.customer_name,
            company_name: prev.company_name || result.data.company_name
          };
        }
        return { ...result.data, status: frontendStatus };
      });
    } catch (err) {
      console.error('Fetch proforma details error:', err);
      setModalError(err instanceof Error ? err.message : 'Failed to load proforma details.');
    } finally {
      setModalLoading(false);
    }
  };
  
  // Handle view proforma
  const handleViewProforma = (id: number) => {
    // First, set the selectedProforma to the one from the list
    const proforma = proformas.find(p => p.id === id);
    if (proforma) {
      setSelectedProforma(proforma);
    }
    setSelectedProformaId(id);
  };
  
  // Close modal
  const closeModal = () => {
    setSelectedProformaId(null);
    setSelectedProforma(null);
    setModalError(null);
  };
  
  // Update proforma status with improved error handling
  const updateProformaStatus = async (id: number, newStatus: string) => {
    try {
      // Map frontend status to backend status
      let backendStatus = newStatus;
      if (newStatus === 'Converted to Ticket') {
        backendStatus = 'Converted';
      }
      
      console.log('Updating proforma status:', { id, newStatus, backendStatus });
      
      const response = await fetch(`http://localhost:5001/api/communication-center/proformas/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: backendStatus }),
      });
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP ${response.status}: ${errorText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      // Update the proforma in the list
      setProformas(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
      setFilteredProformas(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
      
      // Update selected proforma if it's open in modal
      if (selectedProforma && selectedProforma.id === id) {
        setSelectedProforma({ ...selectedProforma, status: newStatus as any });
      }
      
      // Refresh status counts after status update
      fetchStatusCounts();
      
      // Show success feedback
      console.log(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating proforma status:', err);
      alert(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Download PDF for detail modal
  const handleDownloadPDF = async () => {
    if (!selectedProforma) return;
    
    try {
      // Wait a bit to ensure all content is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = document.getElementById('proforma-detail-content');
      if (!element) return;
      
      // Temporarily remove any animations or transitions that might interfere
      const originalTransition = (element as HTMLElement).style.transition;
      (element as HTMLElement).style.transition = 'none';
      
      const canvas = await html2canvas(element, {
        scale: 3, // Increased scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        // Ensure all text is rendered
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('*').forEach((el) => {
            const htmlElement = el as HTMLElement;
            const style = window.getComputedStyle(htmlElement);
            htmlElement.style.fontFamily = style.fontFamily;
            htmlElement.style.fontSize = style.fontSize;
            htmlElement.style.fontWeight = style.fontWeight;
            htmlElement.style.color = style.color;
            htmlElement.style.backgroundColor = style.backgroundColor;
          });
          return clonedDoc;
        }
      });
      
      // Restore original transition
      (element as HTMLElement).style.transition = originalTransition;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Check if content fits on one page
      if (pdfHeight <= pdf.internal.pageSize.getHeight()) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Multi-page PDF
        const pageHeight = pdf.internal.pageSize.getHeight();
        let remainingHeight = canvas.height;
        let position = 0;
        
        while (remainingHeight > 0) {
          const pageCanvas = document.createElement('canvas');
          const ctx = pageCanvas.getContext('2d');
          
          const sourceCanvas = document.createElement('canvas');
          const sourceCtx = sourceCanvas.getContext('2d');
          if (!sourceCtx) throw new Error('Failed to get 2D context for source canvas');
          
          sourceCanvas.width = canvas.width;
          sourceCanvas.height = canvas.height;
          sourceCtx.drawImage(canvas, 0, 0);
          
          const sliceHeight = Math.min(pageHeight * (canvas.width / pdfWidth), remainingHeight);
          
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          
          if (!ctx) throw new Error('Failed to get 2D context for page canvas');
          ctx.drawImage(sourceCanvas, 0, position, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          
          const sliceImgData = pageCanvas.toDataURL('image/png', 1.0);
          const slicePdfHeight = (sliceHeight * pdfWidth) / canvas.width;
          
          if (position > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(sliceImgData, 'PNG', 0, 0, pdfWidth, slicePdfHeight);
          
          remainingHeight -= sliceHeight;
          position += sliceHeight;
        }
      }
      
      pdf.save(`proforma-${selectedProforma.proforma_number}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };
  
  // Status badge colors - removed 'Expired' case
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Converted to Ticket':
        return { 
          icon: CheckCircle, 
          color: 'bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-700 border-emerald-200',
          bgColor: 'from-emerald-500 to-teal-600',
          textColor: 'text-emerald-600',
          ring: 'ring-emerald-500/20'
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
  
  // Status change buttons component
  const StatusChangeButtons: React.FC<{ 
    proforma: Proforma; 
    onUpdate: (status: string) => void;
  }> = ({ proforma, onUpdate }) => {
    // Filter out current status
    const availableStatuses = allowedStatuses.filter(status => status !== proforma.status);
    
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-sm font-medium text-slate-600 self-center">Change status to:</span>
        {availableStatuses.map(status => {
          const StatusIcon = getStatusConfig(status).icon;
          const { color } = getStatusConfig(status);
          
          return (
            <button
              key={status}
              onClick={() => onUpdate(status)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-md ${color} hover:scale-105`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{status}</span>
            </button>
          );
        })}
      </div>
    );
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
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openStatusDropdown !== null) {
        setOpenStatusDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openStatusDropdown]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 md:p-8">
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-6">
            <div className="relative">
              <div className="absolute -top-3 -left-3 text-indigo-500">
                <Zap className="w-10 h-10" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 flex items-center">
                <Receipt className="w-10 h-10 mr-4 text-indigo-600" />
                Proforma Invoices
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Manage and track all customer proforma invoices</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={refreshData}
                className="flex items-center space-x-3 px-6 py-3 bg-white border border-indigo-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <Activity className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-slate-700">Refresh</span>
              </button>
              <button 
                onClick={handleNewProforma}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Proforma</span>
              </button>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-emerald-50 relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-full -mr-8 -mt-8"></div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Converted to Ticket</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {countsLoading ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin text-emerald-500 mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  statusCounts['Converted'] || 0
                )}
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-amber-50 relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-full -mr-8 -mt-8"></div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mr-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Awaiting</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {countsLoading ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin text-amber-500 mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  statusCounts['Awaiting Send'] || 0
                )}
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-indigo-50 relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-full -mr-8 -mt-8"></div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mr-2">
                  <Send className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Sent</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {countsLoading ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin text-indigo-500 mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  statusCounts['Sent'] || 0
                )}
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-emerald-50 relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-full -mr-8 -mt-8"></div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Accepted</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {countsLoading ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin text-emerald-500 mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  statusCounts['Accepted'] || 0
                )}
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-rose-50 relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100 rounded-full -mr-8 -mt-8"></div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center mr-2">
                  <X className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Cancelled</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {countsLoading ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin text-rose-500 mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  statusCounts['Cancelled'] || 0
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Filters & Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 mb-6 border border-indigo-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by number, customer, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-5 py-3 w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400 shadow-sm"
              />
            </div>
            
            {/* Filter Toggle */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-3 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-100 transition"
            >
              <Filter className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-700">Filters</span>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter - removed 'expired' option */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="converted">Converted to Ticket</option>
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
                      className="w-full pl-14 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
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
                      className="w-full pl-14 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
                    />
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>
              </div>
              {/* Reset Filters Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Sorting Controls */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            {pagination.total} Proforma{pagination.total !== 1 ? 's' : ''} Found
            <Star className="w-5 h-5 text-amber-500 ml-3" />
          </h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <span className="text-slate-600 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-medium shadow-sm"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
              <button 
                onClick={toggleSortOrder}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
              </button>
            </div>
            <button className="flex items-center space-x-3 text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-xl hover:bg-slate-50 transition">
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
              onClick={refreshData}
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
          <>
            <div className="space-y-4">
              {filteredProformas.map((p) => {
                const StatusIcon = getStatusConfig(p.status).icon;
                const { color, bgColor, textColor, ring } = getStatusConfig(p.status);
                return (
                  <div
                    key={p.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        {/* Left section: proforma info */}
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-3 shadow-md">
                            <Receipt className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">{p.proforma_number}</h3>
                            <div className="flex items-center mt-1">
                              <Calendar className="w-4 h-4 text-slate-500 mr-1" />
                              <span className="text-slate-600 text-sm">{formatDate(p.proforma_date)}</span>
                            </div>
                            
                            {/* Customer name - always displayed if available */}
                            {p.customer_name && (
                              <div className="flex items-center mt-2">
                                <User className="w-4 h-4 text-slate-500 mr-1" />
                                <span className="text-slate-700 font-medium">{p.customer_name}</span>
                              </div>
                            )}
                            
                            {/* Company name - always displayed if available */}
                            {p.company_name && (
                              <div className="flex items-center mt-1">
                                <Building className="w-4 h-4 text-slate-500 mr-1" />
                                <span className="text-slate-700 font-medium">{p.company_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Right section: status and total */}
                        <div className="flex flex-col items-end space-y-3">
                          <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${color} shadow-sm ring-2 ${ring}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span>{p.status}</span>
                          </span>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-700">
                              {formatCurrency(p.total)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              VAT: {formatCurrency(p.vat_amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notes section at the bottom if exists */}
                      {p.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-start text-slate-700">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mr-2 mt-1">
                              <FileText className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 font-medium block">NOTES</span>
                              <p className="font-medium text-sm">{p.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="px-4 py-3 bg-slate-50 flex justify-end space-x-2 border-t border-slate-100">
                      <div className="relative">
                        <button 
                          onClick={() => setOpenStatusDropdown(openStatusDropdown === p.id ? null : p.id)}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 group shadow-sm"
                        >
                          <MoreVertical className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                        
                        {openStatusDropdown === p.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-10 overflow-hidden">
                            <div className="p-3 border-b border-slate-100">
                              <p className="text-sm font-medium text-slate-700">Change Status</p>
                            </div>
                            <div className="py-1">
                              {allowedStatuses
                                .filter(status => status !== p.status)
                                .map(status => {
                                  const StatusIcon = getStatusConfig(status).icon;
                                  const { color } = getStatusConfig(status);
                                  
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => {
                                        updateProformaStatus(p.id, status);
                                        setOpenStatusDropdown(null);
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 hover:bg-slate-50 transition-colors ${color.replace('border-', 'hover:border-').replace('text-', 'hover:text-')}`}
                                    >
                                      <StatusIcon className="w-4 h-4" />
                                      <span>{status}</span>
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleViewProforma(p.id)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 group shadow-sm"
                      >
                        <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 group shadow-sm">
                        <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all duration-300 group shadow-sm">
                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg ${
                        page === pagination.page
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Proforma Detail Modal */}
      {selectedProformaId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Receipt className="w-8 h-8 mr-3" />
                    Proforma Invoice Details
                  </h2>
                  <p className="text-indigo-100 mt-1">
                    {selectedProforma ? selectedProforma.proforma_number : `Proforma #${selectedProformaId}`}
                  </p>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-indigo-500 transition"
                >
                  <Close className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="relative inline-block">
                    <Loader className="w-16 h-16 animate-spin text-indigo-500" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-20"></div>
                  </div>
                  <span className="ml-4 text-slate-600 text-lg">Loading proforma details...</span>
                </div>
              ) : modalError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
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
                <div id="proforma-detail-content" className="space-y-6 text-black">
                  {/* Proforma Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Hash className="w-5 h-5 mr-2 text-indigo-600" />
                        Proforma Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <span className="text-slate-500 w-32 text-sm">Proforma #:</span>
                          <span className="font-medium text-black">{selectedProforma.proforma_number}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-500 w-32 text-sm">Date:</span>
                          <span className="font-medium text-black">{formatDate(selectedProforma.proforma_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-500 w-32 text-sm">Status:</span>
                          <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(selectedProforma.status).color}`}>
                            {React.createElement(getStatusConfig(selectedProforma.status).icon, { className: "w-4 h-4" })}
                            <span>{selectedProforma.status}</span>
                          </span>
                        </div>
                        {selectedProforma.notes && (
                          <div className="flex items-start">
                            <span className="text-slate-500 w-32 text-sm">Notes:</span>
                            <span className="font-medium text-black">{selectedProforma.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                        Financial Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="font-medium text-black">{formatCurrency(selectedProforma.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">VAT (15%):</span>
                          <span className="font-medium text-black">{formatCurrency(selectedProforma.vat_amount)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t-2 border-slate-300">
                          <span className="text-lg font-bold text-slate-800">Total:</span>
                          <span className="text-xl font-bold text-black">
                            {formatCurrency(selectedProforma.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Information */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-indigo-600" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      {selectedProforma.customer_name && (
                        <div className="flex items-center">
                          <span className="text-slate-500 w-32 text-sm">Name:</span>
                          <span className="font-medium text-black">{selectedProforma.customer_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Company Information */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-indigo-600" />
                      Company Information
                    </h3>
                    <div className="space-y-3">
                      {selectedProforma.company_name && (
                        <div className="flex items-center">
                          <span className="text-slate-500 w-32 text-sm">Name:</span>
                          <span className="font-medium text-black">{selectedProforma.company_name}</span>
                        </div>
                      )}
                      {selectedProforma.company_address && (
                        <div className="flex items-start">
                          <span className="text-slate-500 w-32 text-sm">Address:</span>
                          <span className="font-medium text-black">{selectedProforma.company_address}</span>
                        </div>
                      )}
                      {selectedProforma.company_phone && (
                        <div className="flex items-center">
                          <span className="text-slate-500 w-32 text-sm">Phone:</span>
                          <span className="font-medium text-black">{selectedProforma.company_phone}</span>
                        </div>
                      )}
                      {selectedProforma.company_vat_number && (
                        <div className="flex items-center">
                          <span className="text-slate-500 w-32 text-sm">VAT Number:</span>
                          <span className="font-medium text-black">{selectedProforma.company_vat_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
              
                  {/* Items Table */}
                  {selectedProforma.items && selectedProforma.items.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-indigo-600" />
                        Items
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="text-left p-3 font-semibold text-slate-700">Description</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Size</th>
                              <th className="text-right p-3 font-semibold text-slate-700">Quantity</th>
                              <th className="text-right p-3 font-semibold text-slate-700">Unit Price</th>
                              <th className="text-right p-3 font-semibold text-slate-700">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProforma.items.map((item, index) => (
                              <tr key={item.id || index} className="hover:bg-slate-50 border-b border-slate-100">
                                <td className="p-3 text-black">{item.description}</td>
                                <td className="p-3 text-black">{item.size || '-'}</td>
                                <td className="p-3 text-right text-black">{item.quantity}</td>
                                <td className="p-3 text-right text-black">{formatCurrency(item.unit_price)}</td>
                                <td className="p-3 text-right font-medium text-black">
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
            <div className="bg-slate-50 p-4 border-t border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  {selectedProforma && (
                    <StatusChangeButtons 
                      proforma={selectedProforma} 
                      onUpdate={(status) => updateProformaStatus(selectedProforma.id, status)} 
                    />
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={closeModal}
                    className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition flex items-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PerformaInvoice Modal */}
      <PerformaInvoice
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSaveSuccess={() => {
          refreshData();
          setShowInvoiceModal(false);
        }}
      />
  
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
        
        /* Print-specific styles */
        @media print {
          .print-content {
            color: black !important;
            background: white !important;
          }
          .print-content * {
            color: black !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default Performa;