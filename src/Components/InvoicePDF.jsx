import React, { forwardRef } from 'react';
import { Building2, Phone, Mail, MapPin, Calendar } from 'lucide-react';

const InvoicePDF = forwardRef(({ invoice, isPreview = false }, ref) => {
  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const calculateDiscountAmount = () => {
    if (invoice.discountType === 'percentage') {
      return (invoice.subtotal * invoice.discount) / 100;
    }
    return invoice.discount || 0;
  };

  const discountAmount = calculateDiscountAmount();

  return (
    <div 
      ref={ref}
      className={`bg-white ${isPreview ? 'max-w-4xl mx-auto' : 'w-full'} ${isPreview ? 'border border-gray-200 rounded-lg' : ''}`}
      style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#1f2937'
      }}
    >
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: isPreview ? '8px 8px 0 0' : '0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem'
              }}>
                <Building2 style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  margin: '0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Peak Brew Trading LLC
                </h1>
                <p style={{ 
                  fontSize: '1rem', 
                  margin: '0.25rem 0 0 0',
                  opacity: '0.9'
                }}>
                  Premium Nepalese Beer Imports
                </p>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', opacity: '0.9', lineHeight: '1.4' }}>
              <p style={{ margin: '0' }}>Bringing the finest brews from the Himalayas to your table</p>
              <p style={{ margin: '0.25rem 0 0 0' }}>Authentic • Premium • Imported</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              margin: '0',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              INVOICE
            </h2>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginTop: '1rem'
            }}>
              <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>
                #{invoice.invoiceNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem' }}>
        {/* Invoice Details and Customer Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Invoice Details */}
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.1rem', 
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Calendar style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
              Invoice Details
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Issue Date:</span>
                <span style={{ fontWeight: '600' }}>{formatDate(invoice.issueDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Due Date:</span>
                <span style={{ fontWeight: '600' }}>{formatDate(invoice.dueDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Payment Terms:</span>
                <span style={{ fontWeight: '600' }}>
                  {invoice.terms === 'cod' ? 'Cash on Delivery' :
                   invoice.terms === 'due_on_receipt' ? 'Due on Receipt' :
                   `Net ${invoice.terms} Days`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Status:</span>
                <span style={{ 
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  color: invoice.status === 'paid' ? '#059669' : '#3b82f6'
                }}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.1rem', 
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Building2 style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
              Bill To
            </h3>
            <div style={{ lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
                {invoice.customerName || invoice.customerData?.businessName}
              </p>
              <p style={{ margin: '0 0 0.25rem 0', color: '#374151' }}>
                {invoice.customerData?.contactPerson}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', margin: '0.25rem 0', color: '#6b7280' }}>
                <Mail style={{ width: '14px', height: '14px', marginRight: '0.5rem' }} />
                {invoice.customerEmail || invoice.customerData?.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', margin: '0.25rem 0', color: '#6b7280' }}>
                <Phone style={{ width: '14px', height: '14px', marginRight: '0.5rem' }} />
                {invoice.customerPhone || invoice.customerData?.phone}
              </div>
              {(invoice.customerAddress || invoice.customerData?.address) && (
                <div style={{ display: 'flex', alignItems: 'start', margin: '0.5rem 0', color: '#6b7280' }}>
                  <MapPin style={{ width: '14px', height: '14px', marginRight: '0.5rem', marginTop: '0.2rem' }} />
                  <div>
                    <div>{invoice.customerAddress?.street || invoice.customerData?.address}</div>
                    <div>
                      {invoice.customerAddress?.city || invoice.customerData?.city}
                      {(invoice.customerAddress?.state || invoice.customerData?.state) && 
                        `, ${invoice.customerAddress?.state || invoice.customerData?.state}`}
                      {(invoice.customerAddress?.zipCode || invoice.customerData?.zipCode) && 
                        ` ${invoice.customerAddress?.zipCode || invoice.customerData?.zipCode}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Item Description
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Qty
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'right', 
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Unit Price
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'right', 
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || invoice.products || []).map((item, index) => (
                <tr key={item.id || index} style={{ 
                  borderBottom: index < (invoice.items || invoice.products || []).length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {item.description}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '500' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                    {formatCurrency(item.price || item.pricePerCase)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                    {formatCurrency(item.total || (item.quantity * (item.price || item.pricePerCase)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '350px' }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Subtotal:</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(invoice.subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>
                      Discount {invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}:
                    </span>
                    <span style={{ fontWeight: '600', color: '#059669' }}>
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                {invoice.tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>
                      Tax {invoice.taxRate > 0 ? `(${invoice.taxRate}%)` : ''}:
                    </span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(invoice.tax)}</span>
                  </div>
                )}

                {invoice.shipping > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Shipping:</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(invoice.shipping)}</span>
                  </div>
                )}

                <div style={{ 
                  borderTop: '2px solid #e5e7eb', 
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>Total:</span>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700',
                      color: '#3b82f6'
                    }}>
                      {formatCurrency(invoice.total || invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {invoice.notes && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.1rem', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Notes
            </h3>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              color: '#4b5563',
              lineHeight: '1.6'
            }}>
              {invoice.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: '3rem', 
          paddingTop: '2rem',
          borderTop: '2px solid #e5e7eb',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Thank you for choosing Peak Brew Trading LLC
            </p>
            <p style={{ margin: '0', fontSize: '0.9rem' }}>
              Experience the authentic taste of Nepal's finest premium beers
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
            <p style={{ margin: '0' }}>
              This invoice contains no tax calculations as per company policy
            </p>
            <p style={{ margin: '0.25rem 0 0 0' }}>
              All transactions are processed in USD • Payment terms as specified above
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoicePDF.displayName = 'InvoicePDF';

export default InvoicePDF;