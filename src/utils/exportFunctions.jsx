import * as XLSX from 'xlsx';

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
    downloadExcelSeatingPlan(seatingPlan, roomNames, branchColors);
  } else if (format === 'pdf') {
    // Load jsPDF dynamically to avoid import issues
    import('jspdf').then(jsPDFModule => {
      const jsPDF = jsPDFModule.default;
      downloadSimplePdf(seatingPlan, roomNames, branchColors, jsPDF);
    }).catch(error => {
      console.error('Error loading jsPDF:', error);
      alert('Error generating PDF. Please try using Excel format instead.');
    });
  }
};

/**
 * Generate and download Excel file with seating plan
 * @param {Array} seatingPlan 3D array of seating arrangements
 * @param {Array} roomNames Array of room names
 * @param {Object} branchColors Object mapping branches to colors
 */
const downloadExcelSeatingPlan = (seatingPlan, roomNames, branchColors) => {
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
 * Generate a simple PDF without using autotable
 * @param {Array} seatingPlan 3D array of seating arrangements
 * @param {Array} roomNames Array of room names
 * @param {Object} branchColors Object mapping branches to colors
 * @param {Object} jsPDF The jsPDF constructor
 */
const downloadSimplePdf = (seatingPlan, roomNames, branchColors, jsPDF) => {
  try {
    // Create new PDF document
    const pdf = new jsPDF();
    let currentPage = 1;
    let yPos = 20;
    
    // Helper for adding text and managing page breaks
    const addTextWithBreak = (text, x, y, options = {}) => {
      if (y > 280) {
        pdf.addPage();
        currentPage++;
        y = 20;
      }
      pdf.text(text, x, y, options);
      return y + (options.lineHeightFactor || 1) * 7;
    };
    
    // Helper for drawing simple tables
    const drawSimpleTable = (headers, data, startX, startY, colWidths) => {
      let y = startY;
      const rowHeight = 7;
      
      // Draw headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      let x = startX;
      headers.forEach((header, i) => {
        pdf.text(header, x, y);
        x += colWidths[i];
      });
      
      y += rowHeight;
      pdf.line(startX, y - 2, startX + colWidths.reduce((a, b) => a + b, 0), y - 2);
      
      // Draw data rows
      pdf.setFont('helvetica', 'normal');
      data.forEach(row => {
        // Check if we need a new page
        if (y > 280) {
          pdf.addPage();
          currentPage++;
          y = 20;
          
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          x = startX;
          headers.forEach((header, i) => {
            pdf.text(header, x, y);
            x += colWidths[i];
          });
          y += rowHeight;
          pdf.line(startX, y - 2, startX + colWidths.reduce((a, b) => a + b, 0), y - 2);
          pdf.setFont('helvetica', 'normal');
        }
        
        x = startX;
        row.forEach((cell, i) => {
          pdf.text(cell.toString(), x, y);
          x += colWidths[i];
        });
        
        y += rowHeight;
      });
      
      return y + 5;
    };
    
    // Add title and college info
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    yPos = addTextWithBreak('JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY, ANANTAPUR', 10, yPos);
    
    pdf.setFontSize(12);
    yPos = addTextWithBreak('EXAM CENTRE: SRI VENKATESWARA INSTITUTE OF TECHNOLOGY', 10, yPos + 3);
    yPos = addTextWithBreak('HAMPAPURAM, ANANTAPUR', 10, yPos);
    
    pdf.setFontSize(16);
    yPos = addTextWithBreak('SVIT College - Examination Seating Plan', 10, yPos + 5);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos = addTextWithBreak(`Generated on: ${new Date().toLocaleString()}`, 10, yPos + 5);
    
    // Add summary table
    yPos = addTextWithBreak('Summary of Rooms:', 10, yPos + 10);
    
    const summaryData = [];
    seatingPlan.forEach((room, roomIndex) => {
      if (roomIndex >= roomNames.length) return;
      
      const studentsInRoom = room.flat().filter(Boolean).length;
      const branchesInRoom = new Set(room.flat().filter(Boolean).map(student => student.branch));
      
      summaryData.push([
        roomNames[roomIndex],
        studentsInRoom.toString(),
        Array.from(branchesInRoom).join(', ')
      ]);
    });
    
    yPos = drawSimpleTable(['Room', 'Students', 'Branches'], summaryData, 10, yPos + 5, [30, 30, 130]);
    
    // Branch statistics
    pdf.addPage();
    currentPage++;
    yPos = 20;
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    yPos = addTextWithBreak('Branch Statistics', 10, yPos);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Count students by branch
    const branchCounts = {};
    let totalStudentCount = 0;
    
    seatingPlan.forEach(room => {
      room.forEach(row => {
        row.forEach(student => {
          if (student) {
            branchCounts[student.branch] = (branchCounts[student.branch] || 0) + 1;
            totalStudentCount++;
          }
        });
      });
    });
    
    // Branch statistics table
    const branchData = [];
    Object.entries(branchCounts).forEach(([branch, count]) => {
      const percentage = ((count / totalStudentCount) * 100).toFixed(2) + '%';
      branchData.push([branch, count.toString(), percentage]);
    });
    
    // Add total row
    branchData.push(['Total', totalStudentCount.toString(), '100.00%']);
    
    yPos = drawSimpleTable(['Branch', 'Count', 'Percentage'], branchData, 10, yPos + 5, [50, 30, 30]);
    
    // Create pages for each room
    seatingPlan.forEach((room, roomIndex) => {
      if (roomIndex >= roomNames.length) return;
      
      const roomName = roomNames[roomIndex];
      pdf.addPage();
      currentPage++;
      yPos = 20;
      
      // Add room header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      yPos = addTextWithBreak(`Room: ${roomName} - Seating Plan`, 10, yPos);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Create detailed seating data
      const seatingData = [];
      room.forEach((rowArr, rowIndex) => {
        rowArr.forEach((student, colIndex) => {
          if (student) {
            seatingData.push([
              student.hallTicket,
              `DESK - ${rowIndex + 1} COLUMN - ${colIndex + 1}`,
              student.branch
            ]);
          }
        });
      });
      
      // Draw seating table
      yPos = drawSimpleTable(['Hall Ticket', 'Seating', 'Branch'], seatingData, 10, yPos + 5, [60, 90, 40]);
      
      // Add hall-wise view on next page
      pdf.addPage();
      currentPage++;
      yPos = 20;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      yPos = addTextWithBreak(`HALL WISE SEATING PLAN - ${roomName}`, 10, yPos);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPos = addTextWithBreak(`Name of the Invigilator: _______________   Hall Name: ${roomName}`, 10, yPos + 5);
      
      // Create hall ticket grid layout
      const students = room.flat().filter(Boolean);
      pdf.setFontSize(9);
      
      let gridX = 20;
      let gridY = yPos + 15;
      const cellWidth = 40;
      const cellHeight = 15;
      
      // Draw grid headers
      pdf.setFont('helvetica', 'bold');
      for (let i = 0; i < 4; i++) {
        pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight);
        pdf.text(`H.T.NO ${i+1}`, gridX + 5 + i * cellWidth, gridY + 5);
      }
      gridY += cellHeight;
      
      // Draw grid cells
      pdf.setFont('helvetica', 'normal');
      let studentIndex = 0;
      
      while (studentIndex < students.length) {
        // Check if we need a new page
        if (gridY > 260) {
          pdf.addPage();
          currentPage++;
          gridY = 20;
          
          // Redraw grid headers on new page
          pdf.setFont('helvetica', 'bold');
          for (let i = 0; i < 4; i++) {
            pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight);
            pdf.text(`H.T.NO ${i+1}`, gridX + 5 + i * cellWidth, gridY + 5);
          }
          gridY += cellHeight;
          pdf.setFont('helvetica', 'normal');
        }
        
        // Draw H.T.NO row
        for (let i = 0; i < 4 && studentIndex < students.length; i++) {
          pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight);
          if (studentIndex < students.length) {
            pdf.text(students[studentIndex].hallTicket, gridX + 5 + i * cellWidth, gridY + 10);
            studentIndex++;
          }
        }
        gridY += cellHeight;
        
        // Draw Booklet No row
        for (let i = 0; i < 4; i++) {
          pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight);
          pdf.text("_______", gridX + 15 + i * cellWidth, gridY + 10);
        }
        gridY += cellHeight;
      }
      
      // Add attendance info
      pdf.setFontSize(10);
      gridY += 10;
      yPos = addTextWithBreak(`No of Students Allotted :: ${students.length}`, 20, gridY);
      yPos = addTextWithBreak('No of Students are Absent :: ________', 20, yPos + 7);
      yPos = addTextWithBreak('No of Students are Present :: ________', 20, yPos + 7);
      
      // Add note
      pdf.setFontSize(8);
      yPos = addTextWithBreak('Note: Cross the box containing the Hall Ticket number when the candidate is absent.', 20, yPos + 10);
      
      // Add signature fields
      pdf.setFontSize(10);
      yPos = addTextWithBreak('Signature of the Invigilator', 30, yPos + 15);
      pdf.text('PRINCIPAL', 150, yPos - 7);
    });
    
    // Save PDF
    pdf.save('SVIT_Seating_Plan.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF: ' + error.message + '. Please try Excel format instead.');
  }
};

/**
 * Create detailed seating plan data in desk-column format (Image 1 style)
 */
const createDetailedSeatingPlan = (room, roomName) => {
  // Create data for the room worksheet in Image 1 format
  const wsData = [];
  
  // Add headers
  wsData.push(['SVIT College - Examination Seating Plan']);
  wsData.push(['Room: ' + roomName]);
  wsData.push([]);
  
  // Create column headers for both sides of the sheet
  wsData.push(['H.T. No', 'Hall Name', 'Seating Allotment', '', 'H.T. No', 'Hall Name', 'Seating Allotment']);
  
  // Calculate total number of students
  const students = room.flat().filter(Boolean);
  
  // Arrange students in desk-column format
  const leftSide = [];
  const rightSide = [];
  
  // Map row, col to desk-column format
  students.forEach((student, index) => {
    if (!student) return;
    
    // Find position in the room
    let position = null;
    for (let r = 0; r < room.length; r++) {
      for (let c = 0; c < room[r].length; c++) {
        if (room[r][c] === student) {
          position = { row: r, col: c };
          break;
        }
      }
      if (position) break;
    }
    
    if (position) {
      const deskCol = {
        hallTicket: student.hallTicket,
        hallName: roomName,
        seating: `DESK - ${position.row + 1} COLUMN - ${position.col + 1}`
      };
      
      if (index % 2 === 0) {
        leftSide.push(deskCol);
      } else {
        rightSide.push(deskCol);
      }
    }
  });
  
  // Fill in rows with both left and right side data
  const maxRows = Math.max(leftSide.length, rightSide.length);
  for (let i = 0; i < maxRows; i++) {
    const row = [];
    
    // Add left side if available
    if (i < leftSide.length) {
      row.push(
        leftSide[i].hallTicket,
        leftSide[i].hallName,
        leftSide[i].seating
      );
    } else {
      row.push('', '', '');
    }
    
    row.push(''); // Spacer column
    
    // Add right side if available
    if (i < rightSide.length) {
      row.push(
        rightSide[i].hallTicket,
        rightSide[i].hallName,
        rightSide[i].seating
      );
    } else {
      row.push('', '', '');
    }
    
    wsData.push(row);
  }
  
  return wsData;
};

/**
 * Create hall-wise seating plan (Image 2 style)
 */
const createHallWiseSeatingPlan = (room, roomName) => {
  // Create data for the hall-wise worksheet in Image 2 format
  const wsData = [];
  
  // Add headers
  wsData.push(['JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY, ANANTAPUR - 515002']);
  wsData.push(['EXAM CENTRE: SRI VENKATESWARA INSTITUTE OF TECHNOLOGY']);
  wsData.push(['HAMPAPURAM, ANANTAPUR']);
  wsData.push(['HALL WISE SEATING PLAN']);
  wsData.push(['NAME OF THE EXAMINATION: I-I - B.Tech - I - Sem - Regular & Supple Exams - DEC/JAN 2024/2025']);
  wsData.push(['Name of the Subject: FUNDAMENTALS OF ELECTRICAL CIRCUITS, LINEAR ALGEBRA & CALCULUS, CHEMISTRY']);
  wsData.push(['Name of the Invigilator: _____________', 'Hall Name:', roomName]);
  wsData.push([]);
  
  // Calculate students in grid format (usually 4 students per row)
  const students = room.flat().filter(Boolean);
  const studentsPerRow = 4;
  
  // Generate grid view of students (H.T.NO and Booklet No format)
  for (let i = 0; i < Math.ceil(students.length / studentsPerRow) * 2; i += 2) {
    // Create two rows - one for H.T.NO and one for Booklet No
    const htRow = ['H.T.NO'];
    const bookletRow = ['Booklet No'];
    
    for (let j = 0; j < studentsPerRow; j++) {
      const studentIndex = (i / 2) * studentsPerRow + j;
      if (studentIndex < students.length) {
        htRow.push(students[studentIndex].hallTicket);
        bookletRow.push('_______'); // Empty space for booklet number
      } else {
        // Empty space
        htRow.push('');
        bookletRow.push('');
      }
    }
    
    wsData.push(htRow);
    wsData.push(bookletRow);
  }
  
  // Add attendance summary
  wsData.push([]);
  wsData.push(['No of Students Allotted ::', students.length]);
  wsData.push(['No of Students are Absent ::', '']);
  wsData.push(['No of Students are Present ::', '']);
  
  // Add note at the bottom
  wsData.push([]);
  wsData.push(['Note: Cross the box containing the Hall Ticket number when the candidate is absent.']);
  wsData.push([]);
  wsData.push(['Signature of the Invigilator', '', '', 'PRINCIPAL']);
  
  return wsData;
};

/**
 * Create branch statistics data
 */
const createBranchStatistics = (seatingPlan) => {
  const branchData = [
    ['SVIT College - Branch Distribution'],
    [''],
    ['Branch', 'Count', 'Percentage']
  ];
  
  // Count students by branch
  const branchCounts = {};
  let totalStudentCount = 0;
  
  seatingPlan.forEach(room => {
    room.forEach(row => {
      row.forEach(student => {
        if (student) {
          branchCounts[student.branch] = (branchCounts[student.branch] || 0) + 1;
          totalStudentCount++;
        }
      });
    });
  });
  
  // Add branch counts to data
  Object.entries(branchCounts).forEach(([branch, count]) => {
    const percentage = ((count / totalStudentCount) * 100).toFixed(2) + '%';
    branchData.push([branch, count, percentage]);
  });
  
  // Add total row
  branchData.push(['Total', totalStudentCount, '100.00%']);
  
  return branchData;
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