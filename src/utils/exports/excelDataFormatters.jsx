/**
 * Create detailed seating plan data in desk-column format (Image 1 style)
 */
export const createDetailedSeatingPlan = (room, roomName) => {
    // Create data for the room worksheet in Image 1 format
    const wsData = [];
    
    // Add headers
    wsData.push(['JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY, ANANTAPUR - 515002']);
    wsData.push(['EXAM CENTRE: SRI VENKATESWARA INSTITUTE OF TECHNOLOGY']);
    wsData.push(['HAMPAPURAM, ANANTAPUR']);
    wsData.push(['']);
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
  export const createHallWiseSeatingPlan = (room, roomName) => {
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
  export const createBranchStatistics = (seatingPlan) => {
    const branchData = [
      ['JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY, ANANTAPUR - 515002'],
      ['EXAM CENTRE: SRI VENKATESWARA INSTITUTE OF TECHNOLOGY'],
      ['HAMPAPURAM, ANANTAPUR'],
      [''],
      ['SVIT College - Branch Distribution Statistics'],
      ['Generated on', new Date().toLocaleString()],
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