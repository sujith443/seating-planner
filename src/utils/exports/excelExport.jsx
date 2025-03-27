import * as XLSX from 'xlsx';
import { createDetailedSeatingPlan, createHallWiseSeatingPlan, createBranchStatistics } from './excelDataFormatters';

/**
 * Generate and download Excel file with seating plan
 * @param {Array} seatingPlan 3D array of seating arrangements
 * @param {Array} roomNames Array of room names
 * @param {Object} branchColors Object mapping branches to colors
 */
export const excelExport = (seatingPlan, roomNames, branchColors) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Create a summary sheet with college info
  const summaryData = [
    ['JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY, ANANTAPUR - 515002'],
    ['EXAM CENTRE: SRI VENKATESWARA INSTITUTE OF TECHNOLOGY'],
    ['HAMPAPURAM, ANANTAPUR'],
    [''],
    ['SVIT College - Examination Seating Plan Summary'],
    ['Generated on', new Date().toLocaleString()],
    [''],
    ['Room', 'Total Students', 'Branches'],
  ];
  
  seatingPlan.forEach((room, roomIndex) => {
    if (roomIndex >= roomNames.length) return; // Skip if room name is not available
    
    // Count students and branches in the room
    const studentsInRoom = room.flat().filter(Boolean).length;
    const branchesInRoom = new Set(room.flat().filter(Boolean).map(student => student.branch));
    
    summaryData.push([
      roomNames[roomIndex],
      studentsInRoom,
      Array.from(branchesInRoom).join(', ')
    ]);
  });
  
  // Create individual room sheets - process ALL rooms
  seatingPlan.forEach((room, roomIndex) => {
    if (roomIndex >= roomNames.length) return; // Skip if room name is not available
    
    const roomName = roomNames[roomIndex];
    
    // Create detailed seating plan sheet (Desk-Column format) - Image 1 style
    const detailedPlanData = createDetailedSeatingPlan(room, roomName);
    const detailedWs = XLSX.utils.aoa_to_sheet(detailedPlanData);
    
    // Clean sheet name to avoid Excel errors
    const cleanSheetName = `Room${roomIndex+1}_Seating`;
    XLSX.utils.book_append_sheet(wb, detailedWs, cleanSheetName);
    
    // Create hall-wise seating plan - Image 2 style
    const hallWisePlanData = createHallWiseSeatingPlan(room, roomName);
    const hallWiseWs = XLSX.utils.aoa_to_sheet(hallWisePlanData);
    XLSX.utils.book_append_sheet(wb, hallWiseWs, `Room${roomIndex+1}_HallWise`);
  });
  
  // Create branch statistics sheet
  const branchData = createBranchStatistics(seatingPlan);
  const branchWs = XLSX.utils.aoa_to_sheet(branchData);
  XLSX.utils.book_append_sheet(wb, branchWs, 'Branch Statistics');
  
  // Add summary sheet
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Apply styles (limited styling support in SheetJS)
  applyExcelStyles(wb);
  
  // Generate Excel file
  XLSX.writeFile(wb, 'SVIT_Seating_Plan.xlsx');
};

/**
 * Apply basic styling to Excel worksheets
 */
const applyExcelStyles = (workbook) => {
  // Add basic styling to all worksheets
  workbook.SheetNames.forEach(sheetName => {
    const ws = workbook.Sheets[sheetName];
    
    // Limited styling support in SheetJS free version
    // For header cells
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      };
    }
  });
};