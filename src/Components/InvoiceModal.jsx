import React, { useState } from 'react';
import { Button, TextField, Label, Input, FieldError, Modal, ModalOverlay, Dialog, Heading } from 'react-aria-components';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceModal = ({ isOpen, onClose, selectedProducts, totalAmount, onInvoiceGenerated }) => {
  const { currentUser } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PB-${timestamp}-${random}`;
  };

  const generatePDF = async (invoiceData) => {
    const invoiceElement = document.createElement('div');
    invoiceElement.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1e40af; font-size: 32px; margin: 0;">Peak Brew Trading LLC</h1>
          <p style="color: #6b7280; margin: 5px 0;">Premium Nepalese Beer Imports</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Bringing the finest brews from the Himalayas to your table</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h2 style="color: #374151; font-size: 20px; margin: 0 0 10px 0;">INVOICE</h2>
              <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="color: #374151; margin: 0 0 10px 0;">Bill To:</h3>
              <p style="margin: 2px 0;"><strong>${invoiceData.customerName}</strong></p>
              <p style="margin: 2px 0;">${invoiceData.customerEmail}</p>
              <p style="margin: 2px 0;">${invoiceData.customerPhone}</p>
              <p style="margin: 2px 0;">${invoiceData.customerAddress}</p>
            </div>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #e5e7eb;">
              <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Product</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Brand</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">Size</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">Qty</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Price/Case</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${selectedProducts.map(product => `
              <tr>
                <td style="padding: 12px; border: 1px solid #d1d5db;">${product.name}</td>
                <td style="padding: 12px; border: 1px solid #d1d5db;">${product.brand}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">${product.size}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">${product.quantity}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">$${product.pricePerCase}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">$${(product.pricePerCase * product.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-bottom: 30px;">
          <div style="background: #1e40af; color: white; padding: 15px; border-radius: 8px; display: inline-block;">
            <h3 style="margin: 0; font-size: 24px;">Total: $${totalAmount.toFixed(2)}</h3>
          </div>
        </div>
        
        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280;">
          <p style="margin: 5px 0; font-size: 14px;">Thank you for choosing Peak Brew Trading LLC</p>
          <p style="margin: 5px 0; font-size: 14px;">Experience the authentic taste of Nepal's finest beers</p>
          <p style="margin: 5px 0; font-size: 12px;">This invoice contains no tax calculations as per company policy</p>
        </div>
      </div>
    `;

    document.body.appendChild(invoiceElement);
    
    try {
      const canvas = await html2canvas(invoiceElement, {
        height: 1200,
        width: 800,
        scale: 2
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      document.body.removeChild(invoiceElement);
      
      return pdf;
    } catch (error) {
      document.body.removeChild(invoiceElement);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const invoiceData = {
        invoiceNumber: generateInvoiceNumber(),
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        products: selectedProducts,
        totalAmount,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'generated'
      };

      const pdf = await generatePDF(invoiceData);
      const pdfBlob = pdf.output('blob');
      
      const storageRef = ref(storage, `invoices/${invoiceData.invoiceNumber}.pdf`);
      const uploadResult = await uploadBytes(storageRef, pdfBlob);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      invoiceData.pdfUrl = downloadURL;
      
      await addDoc(collection(db, 'invoices'), invoiceData);
      
      pdf.download(`${invoiceData.invoiceNumber}.pdf`);
      
      onInvoiceGenerated();
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice. Please try again.');
    }

    setLoading(false);
  };

  return (
    <ModalOverlay 
      isOpen={isOpen} 
      onOpenChange={onClose}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <Modal className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Dialog className="p-6">
          <Heading className="text-2xl font-bold text-gray-900 mb-6">
            Generate Invoice
          </Heading>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Customer Name *</Label>
                <Input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
                <FieldError className="text-red-600 text-sm" />
              </TextField>

              <TextField className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Customer Email *</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer email"
                />
                <FieldError className="text-red-600 text-sm" />
              </TextField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </TextField>

              <TextField className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Address</Label>
                <Input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address"
                />
              </TextField>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Invoice Summary</h4>
              <div className="space-y-2">
                {selectedProducts.map(product => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span>{product.name} ({product.size}) × {product.quantity}</span>
                    <span>${(product.pricePerCase * product.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onPress={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isDisabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate PDF Invoice'}
              </Button>
            </div>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

export default InvoiceModal;