import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import blobStream from 'blob-stream';

export class InvoicePDFService {
  constructor() {
    this.doc = null;
    this.stream = null;
  }

  async generatePDF(invoice) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create a new PDF document
        this.doc = new PDFDocument({ 
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        // Create a blob stream
        this.stream = this.doc.pipe(blobStream());

        // Try to load PNG logo first, then SVG fallback
        let logoBase64 = null;
        try {
          // First try PNG logo
          const pngResponse = await fetch('/PNG.png');
          if (pngResponse.ok) {
            const pngBlob = await pngResponse.blob();
            const reader = new FileReader();
            logoBase64 = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(pngBlob);
            });
            console.log('PNG logo loaded successfully');
          } else {
            throw new Error('PNG not found');
          }
        } catch (error) {
          console.log('PNG logo failed, trying SVG fallback:', error);
          try {
            // Fallback to SVG if PNG not found
            const svgResponse = await fetch('/peak-brew.svg');
            if (svgResponse.ok) {
              const logoSvg = await svgResponse.text();
              logoBase64 = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
              console.log('SVG logo loaded as fallback');
            }
          } catch (svgError) {
            console.log('Logo loading failed completely:', svgError);
          }
        }

        // Build the PDF
        await this.buildPDF(invoice, logoBase64);

        // Finalize the PDF
        this.doc.end();

        // Handle the stream end event
        this.stream.on('finish', () => {
          const blob = this.stream.toBlob('application/pdf');
          resolve(blob);
        });

        this.stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async buildPDF(invoice, logoBase64) {
    const doc = this.doc;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;

    // Helper functions
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0);
    };

    const formatDate = (date) => {
      if (!date) return '-';
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    // Colors matching the preview design
    const redColor = '#DC2626';  // Red-600
    const darkGray = '#1F2937'; // Gray-800
    const mediumGray = '#6B7280'; // Gray-500
    const lightGray = '#F3F4F6'; // Gray-100

    let currentY = margin - 10; // Start higher

    // Header Section - Clean background without red line initially
    // Light background for header area only
    doc.rect(0, 0, pageWidth, 80)
       .fill('#FAFAFA');

    // Use the high-quality logo that was loaded - compact positioning
    if (logoBase64) {
      try {
        // Compact logo positioning
        doc.image(logoBase64, margin, currentY + 5, {
          width: 70,
          height: 70,
          fit: [70, 70],
          align: 'center',
          valign: 'center'
        });
        console.log('High-quality logo added to PDF successfully');
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        // Enhanced fallback design
        doc.roundedRect(margin, currentY + 5, 70, 70, 6)
           .fill('#ffffff')
           .stroke(redColor);
        doc.fill(redColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('PEAK', margin + 18, currentY + 25)
           .text('BREW', margin + 18, currentY + 40);
      }
    } else {
      // Enhanced placeholder design when no logo is available
      doc.roundedRect(margin, currentY + 5, 70, 70, 6)
         .fill('#ffffff')
         .stroke(redColor);
      doc.fill(redColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('PEAK', margin + 18, currentY + 25)
         .text('BREW', margin + 18, currentY + 40);
    }

    // Enhanced Company Details (right of logo) - compact positioning
    const companyX = margin + 85;
    
    // Compact company branding
    doc.fill(darkGray)
       .fontSize(18)  // Smaller for compact design
       .font('Helvetica-Bold')
       .text('PEAK BREW', companyX, currentY + 12, {
         width: 160,
         ellipsis: true
       });

    // Elegant "TRADING" subtitle - moved up
    doc.fill(redColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('TRADING', companyX, currentY + 32, {
         width: 160,
         ellipsis: true
       });

    // Compact business type badge - moved up and smaller
    const badgeY = currentY + 50;
    doc.roundedRect(companyX, badgeY, 155, 16, 8)
       .fill(redColor);

    doc.fill('#ffffff')
       .fontSize(7)
       .font('Helvetica-Bold')
       .text('PREMIUM BEER DISTRIBUTION', companyX + 12, badgeY + 5);

    // Modern Invoice title and details section (top right) - compact design
    const rightX = pageWidth - margin - 130;
    
    // Compact invoice title with background
    doc.roundedRect(rightX, currentY + 5, 130, 70, 6)
       .fill('#ffffff')
       .stroke('#E5E7EB');

    doc.fill(redColor)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('INVOICE', rightX + 12, currentY + 15);

    // Compact invoice number
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`#${invoice.invoiceNumber || invoice.id}`, rightX + 12, currentY + 32);

    // Compact date display
    doc.fill(mediumGray)
       .fontSize(8)
       .font('Helvetica')
       .text('Issue Date:', rightX + 12, currentY + 47);

    const issueDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt || invoice.date || Date.now());
    doc.fill(darkGray)
       .font('Helvetica-Bold')
       .text(formatDate(issueDate), rightX + 12, currentY + 57);

    // Compact payment method display
    if (invoice.paymentMethod) {
      doc.fill(mediumGray)
         .fontSize(8)
         .font('Helvetica')
         .text('Payment:', rightX + 70, currentY + 47);
      
      doc.fill(darkGray)
         .font('Helvetica-Bold')
         .text(invoice.paymentMethod.charAt(0).toUpperCase() + invoice.paymentMethod.slice(1), rightX + 70, currentY + 57);
    }

    currentY += 75; // Move down from header

    // Company contact details positioned directly below header
    doc.fill(mediumGray)
       .fontSize(8)
       .font('Helvetica');

    const companyInfo = [
      '7840 Tyler Blvd, Unit 6201, Mentor, OH 44060, USA',
      '+1 412-894-6129  |  peakbrewtrading@gmail.com  |  License: #06756556-1'
    ];

    // Position contact details with proper spacing from header
    companyInfo.forEach(info => {
      doc.text(info, margin, currentY);
      currentY += 12; // Better line spacing
    });

    currentY += 15; // Spacing before red line

    // Professional red accent line positioned BELOW company info
    doc.rect(0, currentY, pageWidth, 5)
       .fill(redColor);
    
    currentY += 20; // Spacing after red line

    // Light divider for additional separation
    doc.moveTo(margin, currentY)
       .lineTo(pageWidth - margin, currentY)
       .stroke('#E2E8F0');
    currentY += 25; // Better spacing after divider

    // BILL TO Section with enhanced design
    // Bill To background box
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 80, 5)
       .fill('#F8FAFC')
       .stroke('#E5E7EB');

    // Bill To header with accent
    doc.rect(margin, currentY, pageWidth - 2 * margin, 25)
       .fill(redColor);
    
    doc.fill('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('BILL TO', margin + 15, currentY + 8);

    currentY += 30;

    // Customer name with enhanced styling
    doc.fill(darkGray)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(invoice.customerName || invoice.customerData?.businessName || 'Customer Name', margin + 15, currentY);
    currentY += 20;

    // Customer details with better formatting (no emojis to avoid random symbols)
    doc.fill(mediumGray)
       .fontSize(9)
       .font('Helvetica');

    // Always try to get address from multiple possible fields
    const customerAddress = invoice.customerAddress || 
                           invoice.customerData?.address || 
                           (invoice.customerData?.address && invoice.customerData?.city && invoice.customerData?.state ? 
                            `${invoice.customerData.address}, ${invoice.customerData.city}, ${invoice.customerData.state} ${invoice.customerData.zipCode || ''}`.trim() : '');

    if (customerAddress) {
      doc.text(`Address: ${customerAddress}`, margin + 15, currentY);
      currentY += 12;
    }
    
    const customerPhone = invoice.customerPhone || invoice.customerData?.phone;
    if (customerPhone) {
      doc.text(`Phone: ${customerPhone}`, margin + 15, currentY);
      currentY += 12;
    }
    
    if (invoice.customerPermit) {
      doc.text(`Customer Permit: #${invoice.customerPermit}`, margin + 15, currentY);
      currentY += 12;
    }

    currentY += 20;

    // Items Table with enhanced design and left-aligned content
    // Table header background with gradient effect
    const tableWidth = pageWidth - 2 * margin + 10;
    const tableStartX = margin - 5;
    
    // Modern table header with professional styling
    doc.roundedRect(tableStartX, currentY, tableWidth, 40, 8)
       .fill('#F8FAFC')
       .stroke('#E2E8F0');

    // Enhanced table headers with better spacing and moved more to the left
    const descWidth = pageWidth - 2 * margin - 120; // Further reduced space to move columns more left
    const qtyX = margin + descWidth - 40; // Moved even more left
    const rateX = qtyX + 40; // Tighter spacing between columns
    const amountX = rateX + 50; // Tighter spacing between columns
    
    doc.fill(darkGray)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('PRODUCT DETAILS', margin + 15, currentY + 12) // Left-aligned
       .text('QTY', qtyX + 25, currentY + 12, { align: 'center', width: 30 }) // Aligned with badge center
       .text('RATE', rateX + 25, currentY + 12, { align: 'center', width: 40 }) // Aligned with rate center
       .fontSize(9) // Smaller font for AMOUNT
       .text('AMOUNT', amountX + 25, currentY + 12, { align: 'center', width: 50 }); // Aligned with amount center

    currentY += 40;

    // Table Items with enhanced product details layout
    if (invoice.items && invoice.items.length > 0) {
      // Limit items to fit on one page - calculate max items that fit
      const maxItems = Math.min(invoice.items.length, 10); // Slightly reduced for better spacing
      
      for (let i = 0; i < maxItems; i++) {
        const item = invoice.items[i];
        const rowHeight = 40; // Increased height for better product details display
        
        // Alternating row background with subtle colors
        if (i % 2 === 1) {
          doc.rect(tableStartX, currentY, tableWidth, rowHeight)
             .fill('#F8FAFC')
             .stroke('#E2E8F0');
        } else {
          doc.rect(tableStartX, currentY, tableWidth, rowHeight)
             .fill('#ffffff')
             .stroke('#E2E8F0');
        }

        // Product details section - left aligned with enhanced layout
        const productStartX = margin + 15;
        const productWidth = descWidth - 40;
        
        // Product name (main title) - prioritize actual product name
        doc.fill('#1F2937')
           .fontSize(9)
           .font('Helvetica-Bold');
        
        // Prioritize productName field, then name, then description for actual product names
        const productName = item.productName || item.name || item.description || 'Product';
        const productSize = item.size || item.volume || '';
        const displayName = productSize ? `${productName} (${productSize})` : productName;
        
        doc.text(displayName, productStartX, currentY + 6, {
          width: productWidth,
          ellipsis: true
        });

        // Product details (volume, SKU, etc.) - smaller text below name
        let detailsY = currentY + 18;
        doc.fill('#6B7280')
           .fontSize(7)
           .font('Helvetica');
        
        // Create a details line with available information (excluding brand)
        const details = [];
        if (item.volume) details.push(`Vol: ${item.volume}`);
        if (item.sku) details.push(`SKU: ${item.sku}`);
        
        if (details.length > 0) {
          doc.text(details.join(' • '), productStartX, detailsY, {
            width: productWidth
          });
        }

        // Quantity with modern badge style (aligned with header)
        const qtyBadgeX = qtyX + 10;
        const qtyBadgeY = currentY + 10;
        
        doc.rect(qtyBadgeX, qtyBadgeY, 30, 18)
           .fill('#EFF6FF')
           .stroke('#DBEAFE');
        
        doc.fill('#1E40AF')
           .fontSize(9)
           .font('Helvetica-Bold');
        
        const qtyText = (item.quantity || 0).toString();
        doc.text(qtyText, qtyBadgeX, qtyBadgeY + 6, {
          width: 30,
          align: 'center'
        });

        // Rate with currency symbol (aligned with header)
        doc.fill('#374151')
           .fontSize(9)
           .font('Helvetica')
           .text(`$${(item.price || 0).toFixed(2)}`, rateX + 10, currentY + 16, {
             width: 60,
             align: 'center'
           });

        // Amount with emphasis (aligned with header, smaller font)
        doc.fill(redColor)
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(`$${(item.total || (item.quantity || 0) * (item.price || 0)).toFixed(2)}`, amountX + 10, currentY + 16, {
             width: 70,
             align: 'center'
           });

        currentY += rowHeight;
      }
      
      // If there are more items, show a note
      if (invoice.items.length > maxItems) {
        doc.fill(mediumGray)
           .fontSize(7)
           .font('Helvetica-Oblique')
           .text(`... and ${invoice.items.length - maxItems} more items`, margin + 8, currentY + 5);
        currentY += 15;
      }
    } else {
      doc.fill(mediumGray)
         .fontSize(8)
         .font('Helvetica')
         .text('No items found', pageWidth / 2 - 30, currentY + 10);
      currentY += 25;
    }

    currentY += 20;

    // Totals Section (better proportions)
    const totalsX = pageWidth - margin - 150;
    const totalsWidth = 130;

    // Subtotal
    doc.fill(mediumGray)
       .fontSize(10)
       .font('Helvetica')
       .text('Subtotal:', totalsX, currentY);
    doc.fill(darkGray)
       .font('Helvetica-Bold')
       .text(formatCurrency(invoice.subtotal || 0), totalsX + totalsWidth - 60, currentY, {
         width: 60,
         align: 'right'
       });
    currentY += 15; // Increased spacing since no tax line

    // Total line
    doc.moveTo(totalsX, currentY - 3)
       .lineTo(totalsX + totalsWidth, currentY - 3)
       .stroke(mediumGray);

    // Final total (better sizing)
    doc.fill(redColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Total:', totalsX, currentY + 8);
    doc.fontSize(14)
       .text(formatCurrency(invoice.total || invoice.totalAmount || 0), totalsX + totalsWidth - 80, currentY + 8, {
         width: 80,
         align: 'right'
       });

    currentY += 25; // Reduced spacing

    // Notes Section (compact for single page)
    if (invoice.notes && invoice.notes.trim()) {
      // Only show notes if there's space (single page constraint)
      if (currentY < pageHeight - 100) { // More restrictive space check
        // Notes background (smaller)
        doc.rect(margin, currentY, pageWidth - 2 * margin, 25) // Reduced height
           .fill('#EFF6FF')
           .stroke('#BFDBFE');

        doc.fill('#1E40AF')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text('NOTES:', margin + 8, currentY + 6);

        doc.fill('#1E40AF')
           .fontSize(7)
           .font('Helvetica')
           .text(invoice.notes.substring(0, 100) + (invoice.notes.length > 100 ? '...' : ''), 
                 margin + 8, currentY + 16, { 
             width: pageWidth - 2 * margin - 16, 
             align: 'left' 
           });
        currentY += 30; // Reduced spacing
      }
    }

    // Premium footer design
    const maxFooterY = pageHeight - 120;
    const footerY = Math.min(currentY + 20, maxFooterY);
    
    // Elegant footer divider
    doc.moveTo(margin, footerY)
       .lineTo(pageWidth - margin, footerY)
       .stroke('#E2E8F0');

    // Professional thank you message with subtle background
    const thankYouY = footerY + 15;
    doc.roundedRect(margin + 20, thankYouY - 5, pageWidth - 2 * margin - 40, 25, 5)
       .fill('#F8FAFC')
       .stroke('#E2E8F0');

    doc.fill(redColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Thank you for your business!', margin, thankYouY + 3, { 
         width: pageWidth - 2 * margin, 
         align: 'center' 
       });

    // Enhanced company contact info
    const footerCompanyText = 'Peak Brew Trading • peakbrewtrading@gmail.com • +1 412-894-6129 • License: #06756556-1';
      
    doc.fill(mediumGray)
       .fontSize(7)
       .font('Helvetica')
       .text(footerCompanyText, 
             margin, footerY + 45, {
         width: pageWidth - 2 * margin, 
         align: 'center' 
       });
  }

  async downloadPDF(invoice, filename) {
    try {
      const blob = await this.generatePDF(invoice);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

export default InvoicePDFService;
