import React, { useState, useEffect } from 'react';

// Interface remains the same
interface ConvertedProforma {
  proforma_id: number;
  proforma_number: string;
  proforma_date: string;
  proforma_customer_name: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_vat_number: string;
  proforma_notes: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  proforma_status: string;
  proforma_created_at: string;
  proforma_updated_at: string;
  ticket_id: number | null;
  ticket_number: string | null;
  customer_type: string | null;
  customer_id: number | null;
  ticket_customer_name: string | null;
  vehicle_id: number | null;
  vehicle_info: string | null;
  license_plate: string | null;
  ticket_title: string | null;
  outsource_mechanic: string | null;
  inspector_assign: string | null;
  ticket_description: string | null;
  priority: string | null;
  type: string | null;
  urgency_level: string | null;
  ticket_status: string | null;
  appointment_id: number | null;
  ticket_created_at: string | null;
  ticket_updated_at: string | null;
  completion_date: string | null;
  estimated_completion_date: string | null;
}

const ConvertedProformasPage: React.FC = () => {
  const [proformas, setProformas] = useState<ConvertedProforma[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProforma, setSelectedProforma] = useState<ConvertedProforma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'proforma' | 'ticket'>('proforma');

  useEffect(() => {
    const fetchConvertedProformas = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/insurance/converted');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch converted proformas');
        }
        
        setProformas(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConvertedProformas();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const openDetailsModal = (proforma: ConvertedProforma) => {
    setSelectedProforma(proforma);
    setIsModalOpen(true);
    setActiveTab('proforma');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProforma(null);
  };

  // Filter proformas based on search term
  const filteredProformas = proformas.filter(proforma => 
    proforma.proforma_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proforma.proforma_customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proforma.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proforma.ticket_number && proforma.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Status badge component
  const StatusBadge = ({ status, type }: { status: string, type: 'proforma' | 'ticket' }) => {
    let bgColor = '';
    let textColor = '';
    
    if (type === 'proforma') {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
    } else {
      switch (status) {
        case 'completed':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          break;
        case 'in_progress':
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          break;
        case 'pending':
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-800';
          break;
        case 'cancelled':
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
      }
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Converted Insurance Proformas</h1>
            <p className="text-gray-600">Loading your data...</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="h-12 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>
            
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Converted Insurance Proformas</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View all insurance proformas that have been converted to service tickets
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Proformas</p>
                <p className="text-2xl font-bold text-gray-800">{proformas.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Converted</p>
                <p className="text-2xl font-bold text-gray-800">{proformas.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Tickets</p>
                <p className="text-2xl font-bold text-gray-800">
                  {proformas.filter(p => p.ticket_status !== 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by proforma, customer, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-300 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                Filter
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {filteredProformas.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No converted proformas found</h3>
              <p className="mt-1 text-gray-500 max-w-md mx-auto">
                {searchTerm ? 'No results match your search. Try a different search term.' : 'Get started by converting some insurance proformas to tickets.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proforma #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProformas.map((proforma) => (
                    <tr key={proforma.proforma_id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{proforma.proforma_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(proforma.proforma_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{proforma.proforma_customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{proforma.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(proforma.total)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={proforma.proforma_status} type="proforma" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {proforma.ticket_number ? (
                          <a href={`/tickets/${proforma.ticket_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-900">
                            {proforma.ticket_number}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openDetailsModal(proforma)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedProforma && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Proforma Details</h3>
                    <p className="text-sm text-blue-200 mt-1">{selectedProforma.proforma_number} • {formatDate(selectedProforma.proforma_date)}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-blue-200 hover:text-white focus:outline-none"
                    onClick={closeModal}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'proforma' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    onClick={() => setActiveTab('proforma')}
                  >
                    Proforma Information
                  </button>
                  
                </nav>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4">
                {activeTab === 'proforma' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Proforma Details</h4>
                        <dl className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Proforma Number</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedProforma.proforma_number}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Date</dt>
                            <dd className="text-sm font-medium text-gray-900">{formatDate(selectedProforma.proforma_date)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Status</dt>
                            <dd>
                              <StatusBadge status={selectedProforma.proforma_status} type="proforma" />
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Created</dt>
                            <dd className="text-sm font-medium text-gray-900">{formatDate(selectedProforma.proforma_created_at)}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Financial Information</h4>
                        <dl className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Subtotal</dt>
                            <dd className="text-sm font-medium text-gray-900">{formatCurrency(selectedProforma.subtotal)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">VAT Rate</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedProforma.vat_rate}%</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">VAT Amount</dt>
                            <dd className="text-sm font-medium text-gray-900">{formatCurrency(selectedProforma.vat_amount)}</dd>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                            <dt className="text-sm font-medium text-gray-900">Total</dt>
                            <dd className="text-sm font-bold text-gray-900">{formatCurrency(selectedProforma.total)}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Customer & Company</h4>
                      <dl className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm text-gray-600">Customer Name</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedProforma.proforma_customer_name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-600">Company Name</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedProforma.company_name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-600">Company Address</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedProforma.company_address}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-600">Company Phone</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedProforma.company_phone}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-600">VAT Number</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedProforma.company_vat_number}</dd>
                          </div>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{selectedProforma.proforma_notes || 'No notes provided'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedProforma.ticket_id ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Ticket Details</h4>
                            <dl className="bg-gray-50 rounded-lg p-4 space-y-3">
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Ticket Number</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                  <a href={`/tickets/${selectedProforma.ticket_id}`} className="text-blue-600 hover:text-blue-800">
                                    {selectedProforma.ticket_number}
                                  </a>
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Title</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.ticket_title || 'N/A'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Status</dt>
                                <dd>
                                  <StatusBadge status={selectedProforma.ticket_status || ''} type="ticket" />
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Priority</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.priority || 'N/A'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Type</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.type || 'N/A'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Urgency Level</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.urgency_level || 'N/A'}</dd>
                              </div>
                            </dl>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Dates</h4>
                            <dl className="bg-gray-50 rounded-lg p-4 space-y-3">
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Created</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatDate(selectedProforma.ticket_created_at || '')}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Estimated Completion</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                  {selectedProforma.estimated_completion_date ? formatDate(selectedProforma.estimated_completion_date) : 'N/A'}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Completion Date</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                  {selectedProforma.completion_date ? formatDate(selectedProforma.completion_date) : 'N/A'}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Customer & Vehicle</h4>
                          <dl className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <dt className="text-sm text-gray-600">Customer Name</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.ticket_customer_name || 'N/A'}</dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-600">Customer Type</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.customer_type || 'N/A'}</dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-600">Vehicle Info</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.vehicle_info || 'N/A'}</dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-600">License Plate</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.license_plate || 'N/A'}</dd>
                              </div>
                            </div>
                          </dl>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Assignments</h4>
                          <dl className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <dt className="text-sm text-gray-600">Inspector</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.inspector_assign || 'N/A'}</dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-600">Outsource Mechanic</dt>
                                <dd className="text-sm font-medium text-gray-900">{selectedProforma.outsource_mechanic || 'N/A'}</dd>
                              </div>
                            </div>
                          </dl>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-700">{selectedProforma.ticket_description || 'No description provided'}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No Ticket Information</h3>
                        <p className="mt-1 text-gray-500">This proforma doesn't have associated ticket information.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvertedProformasPage;