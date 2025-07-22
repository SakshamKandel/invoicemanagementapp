import React from 'react';

const InvoicePDF = ({ invoice, isPreview = false }) => {
  if (!invoice) {
    return <div className="p-8 text-center">No invoice data available</div>;
  }

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white ${isPreview ? 'p-4' : 'p-8'} max-w-4xl mx-auto`}>
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex justify-between items-start mb-8">
          {/* Left Side - Company Info */}
          <div className="flex items-start space-x-6 flex-1">
            {/* Logo */}
            <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center">
              <img 
                src="/peak-brew.svg" 
                alt="Peak Brew Trading Logo" 
                className="w-20 h-20 object-contain"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  imageRendering: 'crisp-edges'
                }}
                onError={(e) => {
                  // Fallback to PB logo if image fails
                  e.target.outerHTML = `
                    <div class="w-20 h-20 bg-red-600 rounded-lg flex items-center justify-center">
                      <div class="text-white font-bold text-center leading-tight">
                        <div class="text-lg">PB</div>
                        <div class="text-xs">TRADING</div>
                      </div>
                    </div>
                  `;
                }}
              />
            </div>
            
            {/* Company Details */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-900 leading-tight">PEAK BREW</h1>
                <h2 className="text-2xl font-medium text-red-600">TRADING</h2>
                <div className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
                  PREMIUM BEER DISTRIBUTION
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-700">
                <div><strong>Address:</strong> 7840 Tyler Blvd, Unit 6201, Mentor, OH 44060, USA</div>
                <div><strong>Phone:</strong> +1 412-894-6129</div>
                <div><strong>Email:</strong> peakbrewtrading@gmail.com</div>
                <div className="pt-1 border-t border-gray-200">
                  <strong>License Permit:</strong> #06756556-1
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Invoice Info */}
          <div className="text-right">
            <h2 className="text-5xl font-bold text-red-600 mb-2">INVOICE</h2>
            <p className="text-2xl font-bold text-red-500 mb-4">#{invoice.invoiceNumber || invoice.id}</p>
            <div className="text-sm text-gray-700">
              <div className="font-semibold">Issue Date:</div>
              <div className="text-lg font-medium">{formatDate(invoice.createdAt || invoice.date)}</div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-200"></div>
      </div>

      {/* Bill To Section */}
      <div className="mb-8 pl-2">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          BILL TO:
        </h3>
        <div className="space-y-3 pl-4">
          <div className="text-2xl font-bold text-gray-900">
            {invoice.customerName || 'Customer Name'}
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            {(() => {
              // Always try to get address from multiple possible fields
              const customerAddress = invoice.customerAddress || 
                                     invoice.customerData?.address || 
                                     (invoice.customerData?.address && invoice.customerData?.city && invoice.customerData?.state ? 
                                      `${invoice.customerData.address}, ${invoice.customerData.city}, ${invoice.customerData.state} ${invoice.customerData.zipCode || ''}`.trim() : '');
              return customerAddress && <div><strong>Address:</strong> {customerAddress}</div>;
            })()}
            {(invoice.customerPhone || invoice.customerData?.phone) && (
              <div><strong>Phone:</strong> {invoice.customerPhone || invoice.customerData?.phone}</div>
            )}
            {invoice.customerPermit && (
              <div className="pt-2 border-t border-gray-300">
                <strong>Customer Permit:</strong> #{invoice.customerPermit}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-900">
              <div className="col-span-6">DESCRIPTION</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-2 text-right">RATE</div>
              <div className="col-span-2 text-right">AMOUNT</div>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className="col-span-6">
                    <p className="font-medium text-gray-900">{item.description || item.name || 'Item'}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                      {item.quantity || 0}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-medium text-gray-900">${(item.price || 0).toFixed(2)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-semibold text-gray-900">${(item.total || (item.quantity || 0) * (item.price || 0)).toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                <p className="text-lg">No items found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-80 space-y-3 text-right">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-900">${(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-gray-700">Tax ({invoice.taxRate || 0}%):</span>
            <span className="font-semibold text-gray-900">${(invoice.tax || 0).toFixed(2)}</span>
          </div>
          <div className="border-t-2 border-gray-400 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-2xl text-gray-900">Total:</span>
              <span className="font-bold text-3xl text-red-600">${(invoice.total || invoice.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {invoice.notes && (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ADDITIONAL NOTES:</h3>
            <p className="text-blue-800">{invoice.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-6 text-center">
        <p className="text-gray-600 font-medium">Thank you for your business!</p>
        <div className="mt-2 text-xs text-gray-500">
          <span>peakbrewtrading@gmail.com | +1 412-894-6129 | Permit #06756556-1</span>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;