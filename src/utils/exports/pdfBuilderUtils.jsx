import { getBranchColor } from '../constant';

// Define colors for PDF
export const pdfColors = {
  primary: [41, 128, 185],     // Primary blue
  secondary: [44, 62, 80],     // Dark blue
  accent: [231, 76, 60],       // Red accent
  lightGray: [245, 245, 245],  // Background gray
  mediumGray: [220, 220, 220], // Border gray
  darkGray: [100, 100, 100]    // Text gray
};

/**
 * Create a styled title for PDF pages
 * @param {Object} pdf jsPDF instance
 * @param {String} text Title text
 * @param {Number} y Y position
 * @param {Number} fontSize Font size (default: 16)
 * @param {Array} color RGB color array (default: primary color)
 * @param {Number} margin Left margin
 * @param {Number} contentWidth Content width
 * @returns {Number} New Y position after the title
 */
export const addStyledTitle = (pdf, text, y, fontSize = 16, color = pdfColors.primary, margin, contentWidth) => {
  pdf.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  pdf.rect(margin, y - 5, contentWidth, fontSize + 10, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fontSize);
  pdf.setTextColor(color[0], color[1], color[2]);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.text(text, pageWidth / 2, y + fontSize/2, { align: 'center' });
  
  return y + fontSize + 10;
};

/**
 * Add a section heading to PDF
 * @param {Object} pdf jsPDF instance
 * @param {String} text Heading text
 * @param {Number} y Y position
 * @param {Number} margin Left margin
 * @param {Number} contentWidth Content width
 * @returns {Number} New Y position after the heading
 */
export const addSectionHeading = (pdf, text, y, margin, contentWidth) => {
  pdf.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  pdf.rect(margin, y - 3, contentWidth, 8, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text(text, margin + 5, y + 2);
  
  return y + 12;
};

/**
 * Draw a styled table in PDF
 * @param {Object} pdf jsPDF instance
 * @param {Array} headers Array of header strings
 * @param {Array} data 2D array of data rows
 * @param {Number} startY Y position to start the table
 * @param {Array} colWidths Array of column widths
 * @param {Number} rowHeight Height of each row (default: 10)
 * @param {Number} margin Left margin
 * @returns {Number} New Y position after the table
 */
export const drawStyledTable = (pdf, headers, data, startY, colWidths, rowHeight = 10, margin) => {
  let y = startY;
  
  // Calculate total width
  const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
  
  // Draw header row
  pdf.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  pdf.rect(margin, y, totalWidth, rowHeight, 'F');
  
  // Draw header text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  
  let x = margin;
  headers.forEach((header, i) => {
    pdf.text(header, x + 3, y + 7);
    x += colWidths[i];
  });
  
  y += rowHeight;
  
  // Draw data rows with alternating background
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y + rowHeight > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
      
      // Redraw header on new page
      pdf.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      pdf.rect(margin, y, totalWidth, rowHeight, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      
      x = margin;
      headers.forEach((header, i) => {
        pdf.text(header, x + 3, y + 7);
        x += colWidths[i];
      });
      
      y += rowHeight;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
    }
    
    // Row background (alternating)
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(245, 245, 245); // Light gray for even rows
    } else {
      pdf.setFillColor(255, 255, 255); // White for odd rows
    }
    pdf.rect(margin, y, totalWidth, rowHeight, 'F');
    
    // Row border
    pdf.setDrawColor(220, 220, 220);
    pdf.rect(margin, y, totalWidth, rowHeight, 'S');
    
    // Row text
    pdf.setTextColor(60, 60, 60);
    x = margin;
    
    row.forEach((cell, i) => {
      // Ensure text fits in the cell
      const cellText = cell.toString();
      const fontSize = pdf.getFontSize();
      const textWidth = pdf.getStringUnitWidth(cellText) * fontSize / pdf.internal.scaleFactor;
      const availableWidth = colWidths[i] - 6; // 3px padding on each side
      
      let displayedText = cellText;
      if (textWidth > availableWidth) {
        // Truncate text if too long
        while (pdf.getStringUnitWidth(displayedText + '...') * fontSize / pdf.internal.scaleFactor > availableWidth && displayedText.length > 0) {
          displayedText = displayedText.substring(0, displayedText.length - 1);
        }
        displayedText += '...';
      }
      
      pdf.text(displayedText, x + 3, y + 7);
      x += colWidths[i];
      
      // Draw vertical cell borders (except for last column)
      if (i < row.length - 1) {
        pdf.line(x, y, x, y + rowHeight);
      }
    });
    
    y += rowHeight;
  });
  
  return y + 5;
};

/**
 * Add a footer to the PDF page
 * @param {Object} pdf jsPDF instance
 * @param {Number} currentPage Current page number
 */
export const addFooter = (pdf, currentPage) => {
  const footerY = pdf.internal.pageSize.getHeight() - 20;
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setDrawColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`SVIT Exam Seating Plan | Page ${currentPage}`, pageWidth / 2, footerY + 10, { align: 'center' });
};