import { getBranchColor } from '../constant';
import { PdfBuilder } from './pdfBuilder';

/**
 * Generate a PDF file with the seating plan
 * @param {Object} jsPDF The jsPDF constructor
 * @param {Array} seatingPlan 3D array of seating arrangements
 * @param {Array} roomNames Array of room names
 * @param {Object} branchColors Object mapping branches to colors
 */
export const generatePdf = (jsPDF, seatingPlan, roomNames, branchColors) => {
  try {
    // Create PDF with enhanced styling using the PdfBuilder class
    const pdfBuilder = new PdfBuilder(jsPDF, seatingPlan, roomNames, branchColors);
    pdfBuilder.generatePdf();
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF: ' + error.message + '. Please try Excel format instead.');
  }
};