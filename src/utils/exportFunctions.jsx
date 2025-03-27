import * as XLSX from 'xlsx';
import { excelExport } from './exports/excelExport';
import { generatePdf } from './exports/pdfExport';

/**
 * Generate and download seating plan in Excel or PDF format
 * @param {Array} seatingPlan 3D array of seating arrangements
 * @param {Array} roomNames Array of room names
 * @param {Object} branchColors Object mapping branches to colors
 * @param {String} format 'excel' or 'pdf'
 */
export const downloadSeatingPlan = (seatingPlan, roomNames, branchColors, format = 'excel') => {
  if (!seatingPlan || seatingPlan.length === 0) return;
  
  if (format === 'excel') {
    excelExport(seatingPlan, roomNames, branchColors);
  } else if (format === 'pdf') {
    // Load jsPDF dynamically to avoid import issues
    import('jspdf').then(jsPDFModule => {
      const jsPDF = jsPDFModule.default;
      generatePdf(jsPDF, seatingPlan, roomNames, branchColors);
    }).catch(error => {
      console.error('Error loading jsPDF:', error);
      alert('Error generating PDF. Please try using Excel format instead. Error: ' + error.message);
    });
  }
};