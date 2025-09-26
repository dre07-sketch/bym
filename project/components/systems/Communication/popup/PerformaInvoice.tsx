'use client';
import React, { useState, useRef } from 'react';
import { Printer, Download, FileText, Plus, X, Building2, User, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceItem {
  id: string;
  description: string;
  size: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface PerformaInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

const PerformaInvoice: React.FC<PerformaInvoiceProps> = ({ 
  isOpen, 
  onClose, 
  onSaveSuccess 
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState('');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const generateProformaNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PF-${timestamp}-${random}`;
  };
  
  const [formData, setFormData] = useState({
    invoiceInfo: {
      proformaNumber: generateProformaNumber(),
      date: new Date().toISOString().split('T')[0],
      validUntil: '',
      paymentTerms: '',
      deliveryTime: '',
    },
    companyInfo: {
      name: 'BYM TRADING PLC',
      address: 'Addis Ababa, ETHIOPIA',
      logo: "photo_1_2025-06-05_14-37-50.jpg",
      phone: '0911-47-54-43',
      vatNumber: '1000',
    },
    customerInfo: {
      name: '',
    },
    items: [] as InvoiceItem[],
    totals: {
      subtotal: 0,
      vatRate: 15,
      vatAmount: 0,
      total: 0,
    },
  });

  const handleInputChange = (
    section: 'companyInfo' | 'customerInfo' | 'invoiceInfo',
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setFormData((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = typeof updatedItem.quantity === 'number' ? updatedItem.quantity : 1;
            const price = typeof updatedItem.unitPrice === 'number' ? updatedItem.unitPrice : 0;
            updatedItem.amount = parseFloat((qty * price).toFixed(2));
          }
          return updatedItem;
        }
        return item;
      });
      const subtotal = parseFloat(updatedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
      const vatAmount = parseFloat((subtotal * (prev.totals.vatRate / 100)).toFixed(2));
      const total = subtotal + vatAmount;
      return {
        ...prev,
        items: updatedItems,
        totals: {
          ...prev.totals,
          subtotal,
          vatAmount,
          total,
        },
      };
    });
  };

  const removeItem = (id: string) => {
    setFormData((prev) => {
      const updatedItems = prev.items.filter((item) => item.id !== id);
      const subtotal = parseFloat(updatedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
      const vatAmount = parseFloat((subtotal * (prev.totals.vatRate / 100)).toFixed(2));
      const total = subtotal + vatAmount;
      return {
        ...prev,
        items: updatedItems,
        totals: {
          ...prev.totals,
          subtotal,
          vatAmount,
          total,
        },
      };
    });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const printContent = printRef.current.outerHTML;
    const styles = `<style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Georgia', 'Times New Roman', serif; margin: 0; padding: 20px; background: white; color: black; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 12px; border: 1px solid black; text-align: left; }
      th { background-color: white; font-weight: 600; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      .company-header { background: white; color: black; padding: 30px; border: 1px solid black; margin-bottom: 30px; }
      @media print { body { -webkit-print-color-adjust: exact; } * { -webkit-print-color-adjust: exact; } }
    </style>`;
    printWindow.document.write(`<html><head><title>Proforma Invoice</title>${styles}</head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handlePreviewPrint = () => {
    if (!previewRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const printContent = previewRef.current.outerHTML;
    const styles = `<style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Georgia', 'Times New Roman', serif; margin: 0; padding: 20px; background: white; color: black; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 12px; border: 1px solid black; text-align: left; }
      th { background-color: white; font-weight: 600; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      .company-header { background: white; color: black; padding: 30px; border: 1px solid black; margin-bottom: 30px; }
      @media print { body { -webkit-print-color-adjust: exact; } * { -webkit-print-color-adjust: exact; } }
    </style>`;
    printWindow.document.write(`<html><head><title>Preview</title>${styles}</head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const createCompactPrintElement = () => {
    const printElement = document.createElement('div');
    printElement.innerHTML = `
      <div class="p-4 bg-white" style="width: 210mm; height: 297mm; overflow: hidden; box-sizing: border-box; font-size: 12px;">
        <!-- Company Header - Compact -->
        <div class="text-center mb-2">
          <div class="flex justify-center mb-1">
            <div class="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center">
              <img src="photo_1_2025-06-05_14-37-50.jpg" alt="Company Logo" class="w-8 h-8 object-contain" />
            </div>
          </div>
          <h1 class="text-xl font-bold text-black mb-1">BYM TRADING PLC</h1>
          <p class="text-sm text-black mb-1">Addis Ababa, ETHIOPIA</p>
          <p class="text-sm text-black">Phone: 0911-47-54-43</p>
        </div>
        
        <!-- Proforma Invoice Title - Compact -->
        <div class="border-t-2 border-b-2 border-black py-1 mb-2">
          <h2 class="text-lg font-bold text-center text-black">PROFORMA INVOICE</h2>
        </div>
        
        <!-- Invoice Details - Compact -->
        <div class="grid grid-cols-3 gap-2 mb-2 text-sm">
          <div>
            <p class="text-black">Proforma #</p>
            <p class="font-semibold text-black">${formData.invoiceInfo.proformaNumber}</p>
          </div>
          <div>
            <p class="text-black">Date</p>
            <p class="text-black">${formData.invoiceInfo.date}</p>
          </div>
          <div>
            <p class="text-black">Valid Until</p>
            <p class="text-black">${formData.invoiceInfo.validUntil || 'N/A'}</p>
          </div>
        </div>
        
        <!-- Customer Info - Compact -->
        <div class="mb-2 text-sm">
          <p class="text-black mb-1">To:</p>
          <p class="font-semibold text-black">${formData.customerInfo.name}</p>
        </div>
        
        <!-- Items Table - Compact -->
        <div class="overflow-x-auto mb-2 text-xs">
          <table class="w-full border-collapse border border-black">
            <thead>
              <tr class="border-b border-black">
                <th class="border border-black px-2 py-1 text-left text-black">Description</th>
                <th class="border border-black px-2 py-1 text-left text-black">Size</th>
                <th class="border border-black px-2 py-1 text-center text-black">Qty</th>
                <th class="border border-black px-2 py-1 text-right text-black">Unit Price</th>
                <th class="border border-black px-2 py-1 text-right text-black">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${formData.items.map(item => `
                <tr>
                  <td class="border border-black px-2 py-1 text-black">${item.description}</td>
                  <td class="border border-black px-2 py-1 text-black">${item.size}</td>
                  <td class="border border-black px-2 py-1 text-center text-black">${item.quantity}</td>
                  <td class="border border-black px-2 py-1 text-right text-black">${item.unitPrice}</td>
                  <td class="border border-black px-2 py-1 text-right text-black">${item.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Totals - Compact -->
        <div class="flex justify-end mb-2 text-sm">
          <div class="w-48 border border-black rounded p-2">
            <div class="flex justify-between mb-1">
              <span class="text-black">Subtotal:</span>
              <span class="text-black">${formData.totals.subtotal}</span>
            </div>
            <div class="flex justify-between mb-1">
              <span class="text-black">VAT (${formData.totals.vatRate}%):</span>
              <span class="text-black">${formData.totals.vatAmount}</span>
            </div>
            <div class="flex justify-between font-bold border-t border-black pt-1">
              <span class="text-black">Total:</span>
              <span class="text-black">${formData.totals.total}</span>
            </div>
          </div>
        </div>
        
        <!-- Bottom Section - Compact -->
        <div class="border-t border-black pt-2 text-xs">
          <div class="text-center mb-2">
            <p class="font-bold text-black">የመኪናዎ ደህንነት ማእከል</p>
            <p class="font-bold text-black">THE CAR SAFETY CENTER</p>
          </div>
          
          <!-- Terms and Conditions - Compact -->
          <div class="mb-2">
            <div class="mb-1">
              <p class="text-black mb-1">1. The offer provided is valid for ___________ days of the date submitted</p>
              <p class="text-black mb-1">1. የተሰጠው ቅጥር በተሰጠበት ቀን ከዚያ በኋላ ________ ቀናት ውስጥ ይገባል</p>
            </div>
            <div class="mb-1">
              <p class="text-black mb-1">2. Payment mode is due ____________ in advance</p>
              <p class="text-black mb-1">2. የክፍያ ዘዴ በመጀመሪያ ____________ ይከፈላል</p>
            </div>
            <div class="mb-1">
              <p class="text-black mb-1">3. Delivery time ___________</p>
              <p class="text-black mb-1">3. የማስረከቢያ ጊዜ ___________</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p class="font-semibold mb-1 text-black">Payment Method:</p>
              <div class="flex items-center mb-1">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">Cash / በገንዘብ</span>
              </div>
              <div class="flex items-center mb-1">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">Bank Transfer / ባንክ ትራንስፈር</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">Check / ቼክ</span>
              </div>
            </div>
            <div>
              <p class="font-semibold mb-1 text-black">Delivery Status:</p>
              <div class="flex items-center mb-1">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">Partial Delivery / የከፊል ማስረከቢያ</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">Full Delivery / ሙሉ ማስረከቢያ</span>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p class="font-semibold mb-1 text-black">Customer Confirmation:</p>
              <div class="flex items-center mb-1">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">I have read and agree to the terms</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">I accept the delivery schedule</span>
              </div>
            </div>
            <div>
              <p class="font-semibold mb-1 text-black">Additional Notes:</p>
              <div class="flex items-center mb-1">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">Insurance Required / ዋስትና ያስፈልጋል</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 border border-black mr-1"></div>
                <span class="text-black">Special Instructions / ልዩ መመሪያዎች</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Signature Section - Compact -->
        <div class="flex justify-end mt-2 text-xs">
          <div class="text-right">
            <p class="text-black mb-1">Signature / ፊርማ:</p>
            <div class="w-32 h-8 border-b border-black"></div>
            <p class="text-black mt-1">Date / ቀን: _______________</p>
          </div>
        </div>
      </div>
    `;
    
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';
    printElement.style.top = '0';
    printElement.style.width = '210mm';
    printElement.style.height = '297mm';
    printElement.style.backgroundColor = '#ffffff';
    printElement.style.fontFamily = 'Georgia, Times New Roman, serif';
    printElement.style.color = 'black';
    printElement.style.fontSize = '12px';
    
    document.body.appendChild(printElement);
    
    return printElement;
  };

  const handleDownloadPDF = async () => {
    let element = printRef.current;
    let tempElement: HTMLDivElement | null = null;
    
    if (!element) {
      console.warn('Print reference is not available, creating temporary element');
      tempElement = createCompactPrintElement() as HTMLDivElement;
      element = tempElement;
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const originalTransition = element.style.transition;
      element.style.transition = 'none';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (el instanceof HTMLElement) {
              el.style.fontFamily = style.fontFamily;
              el.style.fontSize = style.fontSize;
              el.style.fontWeight = style.fontWeight;
              el.style.color = style.color;
              el.style.backgroundColor = style.backgroundColor;
            }
          });
          return clonedDoc;
        }
      });
      
      element.style.transition = originalTransition;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(`proforma-${formData.invoiceInfo.proformaNumber}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      if (tempElement && tempElement.parentNode) {
        tempElement.parentNode.removeChild(tempElement);
      }
    }
  };

  const saveToLocalStorage = (proformaNumber: string) => {
    const payload = {
      proforma_number: proformaNumber,
      proforma_date: formData.invoiceInfo.date,
      notes: formData.invoiceInfo.validUntil ? `Valid until: ${formData.invoiceInfo.validUntil}` : null,
      customer_name: formData.customerInfo.name,
      company_name: formData.companyInfo.name,
      company_address: formData.companyInfo.address,
      company_phone: formData.companyInfo.phone,
      company_vat_number: formData.companyInfo.vatNumber,
      items: formData.items.map(item => ({
        description: item.description || 'Item',
        size: item.size || null,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice || 0
      }))
    };
    
    const savedInvoices = JSON.parse(localStorage.getItem('proformaInvoices') || '[]');
    savedInvoices.push({
      ...payload,
      savedAt: new Date().toISOString(),
      id: Date.now().toString()
    });
    localStorage.setItem('proformaInvoices', JSON.stringify(savedInvoices));
    
    return payload;
  };

  const saveAndDownloadPDF = async (currentRetryCount = 0) => {
    if (!formData.customerInfo.name.trim()) {
      alert('Customer Name is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('Please add at least one item.');
      return;
    }
    
    const proformaNumber = currentRetryCount > 0 ? generateProformaNumber() : formData.invoiceInfo.proformaNumber;
    
    const payload = {
      proforma_number: proformaNumber,
      proforma_date: formData.invoiceInfo.date,
      notes: formData.invoiceInfo.validUntil ? `Valid until: ${formData.invoiceInfo.validUntil}` : null,
      customer_name: formData.customerInfo.name,
      company_name: formData.companyInfo.name,
      company_address: formData.companyInfo.address,
      company_phone: formData.companyInfo.phone,
      company_vat_number: formData.companyInfo.vatNumber,
      items: formData.items.map(item => ({
        description: item.description || 'Item',
        size: item.size || null,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice || 0
      }))
    };
    
    console.log('Sending payload:', payload);
    
    try {
      setIsGenerating(true);
      setErrorDetails(null);
      
      const response = await fetch('https://ipasystem.bymsystem.com/api/communication-center/proformas-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
          console.error('Error response:', errorData);
        } catch (e) {
          errorDetails = await response.text();
          console.error('Error text:', errorDetails);
        }
        
        if (response.status === 409 && currentRetryCount < 3) {
          console.log(`Conflict detected, retrying with new proforma number (attempt ${currentRetryCount + 1})`);
          setFormData(prev => ({
            ...prev,
            invoiceInfo: {
              ...prev.invoiceInfo,
              proformaNumber: proformaNumber
            }
          }));
          return saveAndDownloadPDF(currentRetryCount + 1);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorDetails}`);
      }
      
      const result = await response.json();
      console.log('Save successful:', result);
      
      setShowPreview(false);
      setSavedInvoiceNumber(payload.proforma_number);
      setToastMessage(`Proforma ${payload.proforma_number} saved successfully!`);
      setShowToast(true);
      
      if (onSaveSuccess) onSaveSuccess();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await handleDownloadPDF();
      
    } catch (error) {
      console.error('Save error:', error);
      
      // Fallback to local storage
      const localPayload = saveToLocalStorage(proformaNumber);
      
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrorDetails(errorMessage);
      setToastMessage(`Proforma saved locally (backend unavailable)`);
      setShowToast(true);
      
      // Continue with PDF generation even if backend fails
      setShowPreview(false);
      setSavedInvoiceNumber(localPayload.proforma_number);
      
      if (onSaveSuccess) onSaveSuccess();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await handleDownloadPDF();
      
    } finally {
      setIsGenerating(false);
      setRetryCount(currentRetryCount);
    }
  };

  const handleSave = () => {
    if (!formData.customerInfo.name.trim()) {
      alert('Customer Name is required.');
      return;
    }
    if (formData.items.length === 0) {
      alert('Please add at least one item.');
      return;
    }
    setShowPreview(true);
  };

  const cancelPreview = () => {
    setShowPreview(false);
  };

  const cancelAction = () => {
    onClose();
  };

  const retrySave = () => {
    saveAndDownloadPDF();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Create Proforma Invoice</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Print View (Hidden but rendered) */}
          <div 
            ref={printRef} 
            style={{ 
              position: 'absolute', 
              left: '-9999px', 
              top: '0',
              width: '210mm',
              backgroundColor: '#ffffff',
              fontFamily: 'Georgia, Times New Roman, serif',
              color: 'black'
            }}
          >
            <div className="p-8 bg-white max-w-4xl mx-auto">
              {/* Company Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center">
                    <img src="photo_1_2025-06-05_14-37-50.jpg" alt="Company Logo" className="w-12 h-12 object-contain" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-black mb-1">BYM TRADING PLC</h1>
                <p className="text-black mb-1">Addis Ababa, ETHIOPIA</p>
                <p className="text-black">Phone: 0911-47-54-43</p>
              </div>
              
              {/* Proforma Invoice Title */}
              <div className="border-t-2 border-b-2 border-black py-3 mb-6">
                <h2 className="text-2xl font-bold text-center text-black">PROFORMA INVOICE</h2>
              </div>
              
              {/* Invoice Details */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-black">Proforma #</p>
                  <p className="font-semibold text-black">{formData.invoiceInfo.proformaNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Date</p>
                  <p className="text-black">{formData.invoiceInfo.date}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Valid Until</p>
                  <p className="text-black">{formData.invoiceInfo.validUntil || 'N/A'}</p>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="mb-6">
                <p className="text-sm text-black mb-1">To:</p>
                <p className="font-semibold text-black">{formData.customerInfo.name}</p>
              </div>
              
              {/* Items Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="border border-black px-4 py-2 text-left text-black">Description</th>
                      <th className="border border-black px-4 py-2 text-left text-black">Size</th>
                      <th className="border border-black px-4 py-2 text-center text-black">Quantity</th>
                      <th className="border border-black px-4 py-2 text-right text-black">Unit Price</th>
                      <th className="border border-black px-4 py-2 text-right text-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-black px-4 py-2 text-black">{item.description}</td>
                        <td className="border border-black px-4 py-2 text-black">{item.size}</td>
                        <td className="border border-black px-4 py-2 text-center text-black">{item.quantity}</td>
                        <td className="border border-black px-4 py-2 text-right text-black">{item.unitPrice}</td>
                        <td className="border border-black px-4 py-2 text-right text-black">{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64 border border-black rounded-lg p-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-black">Subtotal:</span>
                    <span className="text-black">{formData.totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-black">VAT ({formData.totals.vatRate}%):</span>
                    <span className="text-black">{formData.totals.vatAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-black pt-1">
                    <span className="text-black">Total:</span>
                    <span className="text-black">{formData.totals.total}</span>
                  </div>
                </div>
              </div>
              
              {/* Bottom Section */}
              <div className="border-t border-black pt-4">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-black">የመኪናዎ ደህንነት ማእከል</p>
                  <p className="text-lg font-bold text-black">THE CAR SAFETY CENTER</p>
                </div>
                
                {/* Terms and Conditions */}
                <div className="mb-6">
                  <div className="mb-3">
                    <p className="text-sm text-black mb-1">1. The offer provided is valid for ___________ days of the date submitted</p>
                    <p className="text-sm text-black mb-1">1. የተሰጠው ቅጥር በተሰጠበት ቀን ከዚያ በኋላ ________ ቀናት ውስጥ ይገባል</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-black mb-1">2. Payment mode is due ____________ in advance</p>
                    <p className="text-sm text-black mb-1">2. የክፍያ ዘዴ በመጀመሪያ ____________ ይከፈላል</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-black mb-1">3. Delivery time ___________</p>
                    <p className="text-sm text-black mb-1">3. የማስረከቢያ ጊዜ ___________</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-semibold mb-2 text-black">Payment Method:</p>
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">Cash / በገንዘብ</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">Bank Transfer / ባንክ ትራንስፈር</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">Check / ቼክ</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2 text-black">Delivery Status:</p>
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">Partial Delivery / የከፊል ማስረከቢያ</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">Full Delivery / ሙሉ ማስረከቢያ</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-semibold mb-2 text-black">Customer Confirmation:</p>
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">I have read and agree to the terms</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">I accept the delivery schedule</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2 text-black">Additional Notes:</p>
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">Insurance Required / ዋስትና ያስፈልጋል</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 border border-black mr-2"></div>
                      <span className="text-sm text-black">Special Instructions / ልዩ መመሪያዎች</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Signature Section */}
              <div className="flex justify-end mt-6">
                <div className="text-right">
                  <p className="text-sm text-black mb-1">Signature / ፊርማ:</p>
                  <div className="w-48 h-12 border-b border-black"></div>
                  <p className="text-sm text-black mt-2">Date / ቀን: _______________</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Editing Mode */}
          {isEditing ? (
            <div className="p-12 space-y-12">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-black">Create Proforma Invoice</h2>
                <button
                  onClick={cancelAction}
                  className="p-2 text-black hover:text-gray-700 hover:bg-gray-100 rounded-full transition border border-black"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Company Info */}
              <div className="border-2 border-black rounded-3xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 border-2 border-black rounded-2xl">
                    <img src="photo_1_2025-06-05_14-37-50.jpg" alt="Company Logo" className="w-32 h-auto" />
                  </div>
                  <h2 className="text-2xl font-bold text-black">Company Information</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-black mb-3">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyInfo.name}
                      onChange={(e) => handleInputChange('companyInfo', 'name', e.target.value)}
                      className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black transition-all duration-300 text-lg font-medium"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-black mb-3">Address</label>
                    <textarea
                      value={formData.companyInfo.address}
                      onChange={(e) => handleInputChange('companyInfo', 'address', e.target.value)}
                      className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black transition-all duration-300 text-lg resize-none"
                      rows={3}
                      placeholder="Enter company address"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-black mb-3">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.companyInfo.phone}
                      onChange={(e) => handleInputChange('companyInfo', 'phone', e.target.value)}
                      className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-black mb-3">VAT Number</label>
                    <input
                      type="text"
                      value={formData.companyInfo.vatNumber}
                      onChange={(e) => handleInputChange('companyInfo', 'vatNumber', e.target.value)}
                      className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                      placeholder="Enter VAT number"
                    />
                  </div>
                </div>
              </div>
              
              {/* Invoice & Customer Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black mb-3">Proforma Number</label>
                  <input
                    type="text"
                    value={formData.invoiceInfo.proformaNumber}
                    disabled
                    className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black mb-3">Date</label>
                  <input
                    type="date"
                    value={formData.invoiceInfo.date}
                    onChange={(e) => handleInputChange('invoiceInfo', 'date', e.target.value)}
                    className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black mb-3">Valid Until</label>
                  <input
                    type="date"
                    value={formData.invoiceInfo.validUntil}
                    onChange={(e) => handleInputChange('invoiceInfo', 'validUntil', e.target.value)}
                    className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              
              {/* Additional Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black mb-3">
                    Payment Terms
                  </label>
                  <select
                    value={formData.invoiceInfo.paymentTerms}
                    onChange={(e) =>
                      handleInputChange("invoiceInfo", "paymentTerms", e.target.value)
                    }
                    className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black"
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                  </select>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="border-2 border-black rounded-3xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 border-2 border-black rounded-2xl">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold text-black">Customer Information</h2>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black mb-3">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerInfo.name}
                    onChange={(e) => handleInputChange('customerInfo', 'name', e.target.value)}
                    className="w-full px-6 py-4 border-2 border-black rounded-2xl bg-white text-black focus:ring-4 focus:ring-black focus:border-black transition-all duration-300 text-lg font-medium"
                    placeholder="Enter customer name"
                  />
                </div>
              </div>
              
              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-black">Items</h3>
                  <button
                    onClick={addItem}
                    className="border-2 border-black hover:bg-black hover:text-white text-black shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 px-6 py-3 rounded-xl flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Item</span>
                  </button>
                </div>
                {formData.items.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-black">
                    <div className="p-4 border-2 border-black rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-12 h-12 text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3">No items added yet</h3>
                    <p className="text-lg text-black mb-8">Start building your invoice by adding items or services</p>
                    <button
                      onClick={addItem}
                      className="border-2 border-black hover:bg-black hover:text-white text-black px-6 py-3 rounded-xl"
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Add Your First Item
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border-2 border-black shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b-2 border-black">
                          <tr>
                            <th className="px-6 py-5 text-left text-sm font-bold uppercase tracking-wider border-r border-black text-black">#</th>
                            <th className="px-6 py-5 text-left text-sm font-bold uppercase tracking-wider min-w-[200px] border-r border-black text-black">Description</th>
                            <th className="px-6 py-5 text-left text-sm font-bold uppercase tracking-wider border-r border-black text-black">Size</th>
                            <th className="px-6 py-5 text-left text-sm font-bold uppercase tracking-wider border-r border-black text-black">Qty</th>
                            <th className="px-6 py-5 text-left text-sm font-bold uppercase tracking-wider border-r border-black text-black">Unit Price</th>
                            <th className="px-6 py-5 text-left text-sm font-bold uppercase tracking-wider border-r border-black text-black">Amount</th>
                            <th className="px-6 py-5 text-black"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {formData.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-6 font-bold text-black border-r border-black">{formData.items.indexOf(item) + 1}</td>
                              <td className="px-6 py-6 border-r border-black">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-black rounded-xl text-black focus:ring-2 focus:ring-black focus:border-black transition-all duration-300"
                                  placeholder="Item description"
                                />
                              </td>
                              <td className="px-6 py-6 border-r border-black">
                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={(e) => updateItem(item.id, 'size', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-black rounded-xl text-black focus:ring-2 focus:ring-black focus:border-black transition-all duration-300"
                                  placeholder="Size"
                                />
                              </td>
                              <td className="px-6 py-6 border-r border-black">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                                  className="w-full px-4 py-3 border-2 border-black rounded-xl text-black focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-center"
                                />
                              </td>
                              <td className="px-6 py-6 border-r border-black">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full px-4 py-3 border-2 border-black rounded-xl text-black focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-right"
                                />
                              </td>
                              <td className="px-6 py-6 text-right font-bold text-black border-r border-black">${item.amount.toFixed(2)}</td>
                              <td className="px-6 py-6 text-center">
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="p-3 text-black hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 border border-black"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Totals */}
              <div className="border-2 border-black rounded-2xl p-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-black">Subtotal:</span>
                      <span className="font-bold text-black">{formData.totals.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-black">VAT ({formData.totals.vatRate}%):</span>
                      <span className="font-bold text-black">{formData.totals.vatAmount}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold border-t-2 border-black pt-3">
                      <span className="text-black">Total:</span>
                      <span className="text-black">{formData.totals.total}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="border-2 border-black hover:bg-black hover:text-white text-black px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Save & Finalize
                </button>
              </div>
            </div>
          ) : (
            <div>Preview or Finalized View</div>
          )}
          
          {/* Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-black">
                  <h2 className="text-2xl font-bold text-black">Invoice Preview</h2>
                  <button
                    onClick={cancelPreview}
                    className="p-2 text-black hover:text-gray-700 hover:bg-gray-100 rounded-full transition border border-black"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8" ref={previewRef}>
                  <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
                    {/* Company Header */}
                    <div className="text-center mb-8">
                      <div className="flex justify-center mb-4">
                        <div className="w-32 h-32 border-2 border-black rounded-full flex items-center justify-center overflow-hidden">
                          <img
                            src="photo_1_2025-06-05_14-37-50.jpg"
                            alt="Company Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <h1 className="text-3xl font-bold text-black mb-2">BYM TRADING PLC</h1>
                      <p className="text-black mb-1">Addis Ababa, ETHIOPIA</p>
                      <p className="text-black">Phone: 0911-47-54-43</p>
                    </div>
                    
                    {/* Proforma Invoice Title */}
                    <div className="border-t-2 border-b-2 border-black py-4 mb-8">
                      <h2 className="text-2xl font-bold text-center text-black">PROFORMA INVOICE</h2>
                    </div>
                    
                    {/* Invoice Details */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div>
                        <p className="text-sm text-black">Proforma #</p>
                        <p className="font-semibold text-black">{formData.invoiceInfo.proformaNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-black">Date</p>
                        <p className="text-black">{formData.invoiceInfo.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-black">Valid Until</p>
                        <p className="text-black">{formData.invoiceInfo.validUntil || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="mb-8">
                      <p className="text-sm text-black mb-1">To:</p>
                      <p className="font-semibold text-black">{formData.customerInfo.name}</p>
                    </div>
                    
                    {/* Items Table */}
                    <div className="overflow-x-auto mb-8">
                      <table className="w-full border-collapse border border-black">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="border border-black px-4 py-2 text-left text-black">Description</th>
                            <th className="border border-black px-4 py-2 text-left text-black">Size</th>
                            <th className="border border-black px-4 py-2 text-center text-black">Quantity</th>
                            <th className="border border-black px-4 py-2 text-right text-black">Unit Price</th>
                            <th className="border border-black px-4 py-2 text-right text-black">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item) => (
                            <tr key={item.id}>
                              <td className="border border-black px-4 py-2 text-black">{item.description}</td>
                              <td className="border border-black px-4 py-2 text-black">{item.size}</td>
                              <td className="border border-black px-4 py-2 text-center text-black">{item.quantity}</td>
                              <td className="border border-black px-4 py-2 text-right text-black">{item.unitPrice}</td>
                              <td className="border border-black px-4 py-2 text-right text-black">{item.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                      <div className="w-64 border border-black rounded-lg p-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-black">Subtotal:</span>
                          <span className="text-black">{formData.totals.subtotal}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-black">VAT ({formData.totals.vatRate}%):</span>
                          <span className="text-black">{formData.totals.vatAmount}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-black pt-1">
                          <span className="text-black">Total:</span>
                          <span className="text-black">{formData.totals.total}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Section */}
                    <div className="border-t border-black pt-6">
                      <div className="mb-6">
                        <div className="mb-3">
                          <p className="text-sm text-black mb-1">1. The offer provided is valid for ___________ days of the date submitted</p>
                          <p className="text-sm text-black mb-1">. ዋጋው የሚያገለግለው ለ________ ቀን ብቻ ነው</p>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-black mb-1">2. Payment mode is due ____________ in advance</p>
                          <p className="text-sm text-black mb-1">. የአከፋፈል ሁኔታ ____________ ቅድሚያ ነው</p>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-black mb-1">3. Delivery time ___________</p>
                          <p className="text-sm text-black mb-1">. የማስረከቢያ ጊዜ ___________</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-8">
                        <div className="text-right">
                          <p className="text-sm text-black mb-1">Signature / ፊርማ:</p>
                          <div className="w-48 h-12 border-b border-black"></div>
                          <p className="text-sm text-black mt-2">Date / ቀን: _______________</p>
                        </div>
                      </div>
                      <div className="text-center mb-6">
                        <p className="text-lg font-bold text-black">የመኪናዎ ደህንነት ማእከል</p>
                        <p className="text-lg font-bold text-black">THE CAR SAFETY CENTER</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 p-6 bg-white border-t border-black">
                  <button
                    onClick={handlePreviewPrint}
                    className="px-6 py-3 border border-black rounded-xl hover:bg-gray-100 transition text-black"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => saveAndDownloadPDF()}
                    disabled={isGenerating}
                    className="px-8 py-3 border-2 border-black hover:bg-black hover:text-white text-black rounded-xl font-bold disabled:opacity-70 flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isGenerating ? 'Saving & Downloading...' : 'Confirm, Save & Download'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Success Toast */}
          {showToast && (
            <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up pointer-events-auto">
              <div className="bg-white shadow-2xl rounded-2xl p-4 min-w-80 border border-black flex items-center space-x-3 transform transition-all duration-300">
                <div className="flex-shrink-0 bg-white border-2 border-black w-10 h-10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-black">{toastMessage}</p>
                  <p className="text-xs text-black">Click to dismiss</p>
                </div>
                <button onClick={() => setShowToast(false)} className="text-black hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Error Toast */}
          {errorDetails && (
            <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up pointer-events-auto">
              <div className="bg-red-50 shadow-2xl rounded-2xl p-4 min-w-80 border border-red-200 flex flex-col space-y-3 transform transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-red-100 border-2 border-red-300 w-10 h-10 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Backend Error</p>
                    <p className="text-xs text-red-700">Invoice saved locally instead</p>
                  </div>
                  <button onClick={() => setErrorDetails(null)} className="text-red-500 hover:text-red-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-xs text-red-700 bg-red-100 p-2 rounded-lg max-h-20 overflow-y-auto">
                  {errorDetails}
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={retrySave}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformaInvoice;