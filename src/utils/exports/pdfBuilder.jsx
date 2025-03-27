import { getBranchColor } from '../constant';
import { 
  pdfColors, 
  addStyledTitle, 
  addSectionHeading, 
  drawStyledTable, 
  addFooter 
} from './pdfBuilderUtils';

/**
 * PdfBuilder class to generate beautiful PDFs with clean structure
 */
export class PdfBuilder {
  constructor(jsPDF, seatingPlan, roomNames, branchColors) {
    this.jsPDF = jsPDF;
    this.seatingPlan = seatingPlan;
    this.roomNames = roomNames;
    this.branchColors = branchColors;
    
    // Initialize PDF
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.currentPage = 1;
    
    // Get page dimensions
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 15;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }
  
  generatePdf() {
    try {
      // Generate cover page
      this.createCoverPage();
      
      // Generate summary page
      this.pdf.addPage();
      this.currentPage++;
      this.createSummaryPage();
      
      // Generate branch statistics page
      this.pdf.addPage();
      this.currentPage++;
      this.createBranchStatisticsPage();
      
      // Generate room pages
      this.seatingPlan.forEach((room, roomIndex) => {
        if (roomIndex >= this.roomNames.length) return;
        const roomName = this.roomNames[roomIndex];
        
        // Detailed seating plan page
        this.pdf.addPage();
        this.currentPage++;
        this.createDetailedSeatingPlanPage(room, roomName);
        
        // Hall-wise seating plan page
        this.pdf.addPage();
        this.currentPage++;
        this.createHallWiseSeatingPlanPage(room, roomName);
      });
      
      // Save PDF
      this.pdf.save('SVIT_Seating_Plan.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
  
  createCoverPage() {
    let yPos = this.margin;
    
    // Add university logo placeholder
    this.pdf.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    this.pdf.circle(this.pageWidth / 2, yPos + 25, 15, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text("JNTU", this.pageWidth / 2, yPos + 25 + 5, { align: 'center' });
    
    yPos += 50;
    
    // Add university header
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    this.pdf.text("JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY", this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    this.pdf.setFontSize(14);
    this.pdf.text("ANANTAPUR - 515002", this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    
    // Add horizontal separator
    this.pdf.setDrawColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    this.pdf.setLineWidth(1);
    this.pdf.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    
    yPos += 20;
    
    // Add exam center info
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    this.pdf.text("EXAM CENTRE:", this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
    this.pdf.text("SRI VENKATESWARA INSTITUTE OF TECHNOLOGY", this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    this.pdf.text("HAMPAPURAM, ANANTAPUR", this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 30;
    
    // Add document title
    this.pdf.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    this.pdf.rect(this.margin, yPos, this.contentWidth, 40, 'F');
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(22);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text("EXAMINATION SEATING PLAN", this.pageWidth / 2, yPos + 16, { align: 'center' });
    
    this.pdf.setFontSize(14);
    this.pdf.text("B.Tech - I - Sem - Regular & Supple Exams", this.pageWidth / 2, yPos + 30, { align: 'center' });
    
    yPos += 60;
    
    // Add generation info
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    this.pdf.text(`Generated on: ${new Date().toLocaleString()}`, this.pageWidth / 2, yPos, { align: 'center' });
    
    // Add footer
    addFooter(this.pdf, this.currentPage);
  }
  
  createSummaryPage() {
    let yPos = this.margin;
    
    // Add page title
    yPos = addStyledTitle(this.pdf, "SEATING PLAN SUMMARY", yPos, 16, pdfColors.primary, this.margin, this.contentWidth);
    
    // Count total students
    let totalStudentCount = 0;
    this.seatingPlan.forEach(room => {
      totalStudentCount += room.flat().filter(Boolean).length;
    });
    
    // Add summary info in a highlighted box
    this.pdf.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
    this.pdf.rect(this.margin, yPos, this.contentWidth, 40, 'F');
    this.pdf.setDrawColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    this.pdf.rect(this.margin, yPos, this.contentWidth, 40, 'S');
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    
    this.pdf.text(`Total Students: ${totalStudentCount}`, this.margin + 10, yPos + 15);
    this.pdf.text(`Total Rooms: ${this.roomNames.length}`, this.margin + 10, yPos + 30);
    
    yPos += 50;
    
    // Add room summary table
    yPos = addSectionHeading(this.pdf, "ROOM ALLOCATION DETAILS", yPos, this.margin, this.contentWidth);
    
    const summaryData = [];
    this.seatingPlan.forEach((room, roomIndex) => {
      if (roomIndex >= this.roomNames.length) return;
      
      const studentsInRoom = room.flat().filter(Boolean).length;
      const branchesInRoom = new Set(room.flat().filter(Boolean).map(student => student.branch));
      
      summaryData.push([
        this.roomNames[roomIndex],
        studentsInRoom.toString(),
        Array.from(branchesInRoom).join(', ')
      ]);
    });
    
    yPos = drawStyledTable(
      this.pdf,
      ['Room Name', 'Students', 'Branches'],
      summaryData,
      yPos,
      [40, 30, this.contentWidth - 70],
      10,
      this.margin
    );
    
    // Add footer
    addFooter(this.pdf, this.currentPage);
  }
  
  createBranchStatisticsPage() {
    let yPos = this.margin;
    
    // Add page title
    yPos = addStyledTitle(this.pdf, "BRANCH DISTRIBUTION STATISTICS", yPos, 16, pdfColors.primary, this.margin, this.contentWidth);
    
    // Count students by branch
    const branchCounts = {};
    let totalStudentCount = 0;
    
    this.seatingPlan.forEach(room => {
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
    
    // Add branch distribution visualization
    yPos += 10;
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    this.pdf.text("Branch Distribution:", this.margin, yPos);
    
    yPos += 10;
    let legendX = this.margin;
    
    Object.entries(branchCounts).forEach(([branch, count]) => {
      const percentage = ((count / totalStudentCount) * 100).toFixed(1);
      
      // Convert hex to RGB for the branch color
      const branchColorHex = getBranchColor(branch) || '#f5f5f5';
      let r = parseInt(branchColorHex.slice(1, 3), 16);
      let g = parseInt(branchColorHex.slice(3, 5), 16);
      let b = parseInt(branchColorHex.slice(5, 7), 16);
      
      // Draw colored rectangle
      this.pdf.setFillColor(r, g, b);
      this.pdf.rect(legendX, yPos, 10, 10, 'F');
      
      // Add branch name and percentage
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(`${branch}: ${percentage}%`, legendX + 12, yPos + 7);
      
      legendX += 50;
      if (legendX > this.pageWidth - 50) {
        legendX = this.margin;
        yPos += 15;
      }
    });
    
    yPos += 25;
    
    // Draw branch statistics table
    yPos = drawStyledTable(
      this.pdf,
      ['Branch', 'Count', 'Percentage'],
      branchData,
      yPos,
      [this.contentWidth * 0.5, this.contentWidth * 0.25, this.contentWidth * 0.25],
      10,
      this.margin
    );
    
    // Add footer
    addFooter(this.pdf, this.currentPage);
  }
  
  createDetailedSeatingPlanPage(room, roomName) {
    let yPos = this.margin;
    
    // Add page title
    yPos = addStyledTitle(this.pdf, `ROOM: ${roomName} - SEATING PLAN`, yPos, 16, pdfColors.primary, this.margin, this.contentWidth);
    
    // Add room info
    const studentsInRoom = room.flat().filter(Boolean).length;
    const branchesInRoom = new Set(room.flat().filter(Boolean).map(student => student.branch));
    
    this.pdf.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
    this.pdf.rect(this.margin, yPos, this.contentWidth, 25, 'F');
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    
    this.pdf.text(`Total Students: ${studentsInRoom}`, this.margin + 10, yPos + 10);
    this.pdf.text(`Room Configuration: ${room.length} Rows × ${room[0].length} Columns`, this.margin + 10, yPos + 20);
    
    yPos += 35;
    
    // Add detailed seating data
    yPos = addSectionHeading(this.pdf, "DETAILED SEATING ARRANGEMENT", yPos, this.margin, this.contentWidth);
    
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
    yPos = drawStyledTable(
      this.pdf,
      ['Hall Ticket', 'Seating', 'Branch'],
      seatingData,
      yPos,
      [this.contentWidth * 0.4, this.contentWidth * 0.4, this.contentWidth * 0.2],
      10,
      this.margin
    );
    
    // Add footer
    addFooter(this.pdf, this.currentPage);
  }
  
  createHallWiseSeatingPlanPage(room, roomName) {
    let yPos = this.margin;
    
    // Add page title
    yPos = addStyledTitle(this.pdf, `HALL WISE SEATING PLAN - ${roomName}`, yPos, 16, pdfColors.primary, this.margin, this.contentWidth);
    
    // Add instructor info with form fields
    this.pdf.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
    this.pdf.rect(this.margin, yPos, this.contentWidth, 25, 'F');
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    
    this.pdf.text("Name of the Invigilator:", this.margin + 10, yPos + 10);
    
    // Draw a line for writing invigilator name
    this.pdf.setDrawColor(pdfColors.darkGray[0], pdfColors.darkGray[1], pdfColors.darkGray[2]);
    this.pdf.line(this.margin + 60, yPos + 10, this.margin + 180, yPos + 10);
    
    // Add date field
    this.pdf.text("Date:", this.margin + 10, yPos + 20);
    this.pdf.line(this.margin + 30, yPos + 20, this.margin + 80, yPos + 20);
    
    // Add hall name on the right
    this.pdf.text("Hall:", this.pageWidth - this.margin - 70, yPos + 10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(pdfColors.accent[0], pdfColors.accent[1], pdfColors.accent[2]);
    this.pdf.text(roomName, this.pageWidth - this.margin - 50, yPos + 10);
    
    yPos += 35;
    
    // Create hall ticket grid layout
    const students = room.flat().filter(Boolean);
    yPos = this.drawHallTicketGrid(students, yPos);
    
    // Add attendance summary in a highlighted box
    yPos += 10;
    this.pdf.setFillColor(pdfColors.lightGray[0], pdfColors.lightGray[1], pdfColors.lightGray[2]);
    this.pdf.rect(this.margin, yPos, this.contentWidth, 45, 'F');
    this.pdf.setDrawColor(pdfColors.darkGray[0], pdfColors.darkGray[1], pdfColors.darkGray[2]);
    this.pdf.rect(this.margin, yPos, this.contentWidth, 45, 'S');
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    
    this.pdf.text("ATTENDANCE SUMMARY", this.margin + this.contentWidth/2, yPos + 10, { align: 'center' });
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`No of Students Allotted: ${students.length}`, this.margin + 10, yPos + 20);
    
    // Draw line for absent count
    this.pdf.text("No of Students Absent:", this.margin + 10, yPos + 30);
    this.pdf.line(this.margin + 70, yPos + 30, this.margin + 100, yPos + 30);
    
    // Draw line for present count
    this.pdf.text("No of Students Present:", this.margin + 10, yPos + 40);
    this.pdf.line(this.margin + 70, yPos + 40, this.margin + 100, yPos + 40);
    
    yPos += 55;
    
    // Add note about crossing out absent students
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(pdfColors.darkGray[0], pdfColors.darkGray[1], pdfColors.darkGray[2]);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text("Note: Cross the box containing the Hall Ticket number when the candidate is absent.", 
      this.margin, yPos);
    
    yPos += 20;
    
    // Add signature fields with lines
    this.pdf.setDrawColor(pdfColors.darkGray[0], pdfColors.darkGray[1], pdfColors.darkGray[2]);
    this.pdf.line(this.margin + 40, yPos + 10, this.margin + 120, yPos + 10);
    this.pdf.line(this.pageWidth - this.margin - 120, yPos + 10, this.pageWidth - this.margin - 40, yPos + 10);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
    this.pdf.text("Signature of the Invigilator", this.margin + 80, yPos + 20, { align: 'center' });
    this.pdf.text("PRINCIPAL", this.pageWidth - this.margin - 80, yPos + 20, { align: 'center' });
    
    // Add footer
    addFooter(this.pdf, this.currentPage);
  }
  
  /**
   * Draw the hall ticket grid layout
   * @param {Array} students Array of student objects
   * @param {Number} startY Starting Y position
   * @returns {Number} New Y position after the grid
   */
  drawHallTicketGrid(students, startY) {
    let gridY = startY;
    const cellWidth = 40;
    const cellHeight = 15;
    const cols = 4;
    const gridWidth = cellWidth * cols;
    const gridX = this.margin + (this.contentWidth - gridWidth) / 2; // Center the grid
    
    // Draw grid headers
    this.pdf.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    
    for (let i = 0; i < cols; i++) {
      this.pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight, 'F');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`H.T.NO ${i+1}`, gridX + 5 + i * cellWidth, gridY + 10);
    }
    
    gridY += cellHeight;
    this.pdf.setFont('helvetica', 'normal');
    
    // Draw grid cells for students
    let studentIndex = 0;
    
    while (studentIndex < students.length) {
      // Check if we need a new page
      if (gridY + cellHeight * 2 > this.pageHeight - this.margin) {
        this.pdf.addPage();
        this.currentPage++;
        gridY = this.margin;
        
        // Add title
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(pdfColors.secondary[0], pdfColors.secondary[1], pdfColors.secondary[2]);
        this.pdf.text("HALL TICKET ARRANGEMENT (Continued)", this.pageWidth / 2, gridY, { align: 'center' });
        gridY += 10;
        
        // Redraw column headers
        this.pdf.setFillColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
        
        for (let i = 0; i < cols; i++) {
          this.pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight, 'F');
          this.pdf.setTextColor(255, 255, 255);
          this.pdf.text(`H.T.NO ${i+1}`, gridX + 5 + i * cellWidth, gridY + 10);
        }
        
        gridY += cellHeight;
        this.pdf.setFont('helvetica', 'normal');
      }
      
      // Hall ticket row (colorize by branch)
      for (let i = 0; i < cols && studentIndex < students.length; i++) {
        const student = students[studentIndex];
        const branch = student.branch;
        
        // Use branch color from branchColors, or default to light gray
        const branchColorHex = getBranchColor(branch) || '#f5f5f5';
        // Convert hex to RGB (simplified, assumes format #RRGGBB)
        let r = parseInt(branchColorHex.slice(1, 3), 16);
        let g = parseInt(branchColorHex.slice(3, 5), 16);
        let b = parseInt(branchColorHex.slice(5, 7), 16);
        
        // Fill with branch color
        this.pdf.setFillColor(r, g, b);
        this.pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight, 'F');
        
        // Draw border
        this.pdf.setDrawColor(150, 150, 150);
        this.pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight, 'S');
        
        // Print hall ticket
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.text(student.hallTicket, gridX + i * cellWidth + 5, gridY + 7);
        
        // Print branch in smaller font
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(6);
        this.pdf.text(branch, gridX + i * cellWidth + 5, gridY + 12);
        
        studentIndex++;
      }
      
      gridY += cellHeight;
      
      // Booklet row
      this.pdf.setFillColor(255, 255, 255);
      for (let i = 0; i < cols && (studentIndex - cols + i) < students.length && (studentIndex - cols + i) >= 0; i++) {
        this.pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight, 'F');
        this.pdf.setDrawColor(150, 150, 150);
        this.pdf.rect(gridX + i * cellWidth, gridY, cellWidth, cellHeight, 'S');
        
        // Print "Booklet No:" text
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(6);
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text("Booklet No:", gridX + i * cellWidth + 5, gridY + 5);
        
        // Print underline for writing
        this.pdf.setDrawColor(100, 100, 100);
        this.pdf.line(
          gridX + i * cellWidth + 5, 
          gridY + 10, 
          gridX + i * cellWidth + cellWidth - 5, 
          gridY + 10
        );
      }
      
      gridY += cellHeight;
    }
    
    return gridY;
  }
}