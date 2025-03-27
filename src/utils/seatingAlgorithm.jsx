import { branchMap } from './constant';

/**
 * Extract branch from hall ticket number
 * @param {string} hallTicket 
 * @returns {string} Branch name
 */
export const getBranchFromHallTicket = (hallTicket) => {
  if (!hallTicket || hallTicket.length < 7) {
    return 'Unknown';
  }
  
  // Extract branch code (2 digits after the letter A)
  // For a hall ticket like 259F1A0501, we need to extract '05'
  const branchCode = hallTicket.match(/F1A(\d{2})/)?.[1];
  
  if (!branchCode) {
    return 'Unknown';
  }
  
  return branchMap[branchCode] || `Unknown-${branchCode}`;
};

/**
 * Sort hall tickets in sequential order based on their number
 * @param {Array} hallTickets Array of hall ticket strings
 * @returns {Array} Sorted hall tickets
 */
const sortHallTicketsSequentially = (hallTickets) => {
  return [...hallTickets].sort((a, b) => {
    // Extract the college code + branch code part (e.g., "259F1A05")
    const aPrefix = a.substring(0, 7);
    const bPrefix = b.substring(0, 7);
    
    // Compare prefixes first
    if (aPrefix !== bPrefix) {
      return aPrefix.localeCompare(bPrefix);
    }
    
    // If prefixes match, compare the student number part
    const aNumber = parseInt(a.substring(7), 10);
    const bNumber = parseInt(b.substring(7), 10);
    return aNumber - bNumber;
  });
};

/**
 * Generate seating plan based on hall tickets
 * @param {Array} hallTickets Array of hall ticket numbers
 * @param {Function} getBranchFn Function to get branch from hall ticket
 * @param {number} studentsPerRoom Max students per room
 * @param {Object} roomLayout Room layout with rows and cols
 * @returns {Array} Seating plan as a 3D array [rooms][rows][cols]
 */
export const generateSeatingPlan = (
  hallTickets, 
  getBranchFn, 
  studentsPerRoom = 24, 
  roomLayout = { rows: 4, cols: 6 }
) => {
  try {
    // Sort hall tickets sequentially first
    const sortedHallTickets = sortHallTicketsSequentially(hallTickets);
    
    // Parse student information
    const students = sortedHallTickets.map(ticket => ({
      hallTicket: ticket,
      branch: getBranchFn(ticket)
    }));
    
    const totalStudents = students.length;
    const totalRooms = Math.ceil(totalStudents / studentsPerRoom);
    
    // Create rooms
    const rooms = [];
    
    // Number of rows and columns in a room
    const { rows, cols } = roomLayout;
    
    // Initialize rooms with empty seats
    for (let roomNum = 0; roomNum < totalRooms; roomNum++) {
      const room = Array(rows).fill().map(() => Array(cols).fill(null));
      rooms.push(room);
    }
    
    // Function to check if a position is valid (no same branch adjacent)
    const isValidPosition = (room, row, col, branch) => {
      // Check horizontally (left and right)
      if (col > 0 && room[row][col-1] && room[row][col-1].branch === branch) {
        return false;
      }
      if (col < cols-1 && room[row][col+1] && room[row][col+1].branch === branch) {
        return false;
      }
      
      // Check vertically (front and back)
      if (row > 0 && room[row-1][col] && room[row-1][col].branch === branch) {
        return false;
      }
      if (row < rows-1 && room[row+1][col] && room[row+1][col].branch === branch) {
        return false;
      }
      
      return true;
    };
    
    // Improved algorithm that tries to place students sequentially
    let studentIndex = 0;
    
    // Generate sequential positions - we'll try to follow this order if possible
    const snakePatternPositions = [];
    for (let roomNum = 0; roomNum < totalRooms; roomNum++) {
      for (let row = 0; row < rows; row++) {
        // Alternate direction for each row (snake pattern)
        const colStart = row % 2 === 0 ? 0 : cols - 1;
        const colEnd = row % 2 === 0 ? cols : -1;
        const colStep = row % 2 === 0 ? 1 : -1;
        
        for (let col = colStart; col !== colEnd; col += colStep) {
          snakePatternPositions.push({ roomNum, row, col });
        }
      }
    }
    
    // First pass - try to place students in sequential order
    for (const { roomNum, row, col } of snakePatternPositions) {
      if (studentIndex >= totalStudents) break;
      
      const student = students[studentIndex];
      const room = rooms[roomNum];
      
      // If this is a valid position for this student, place them
      if (isValidPosition(room, row, col, student.branch)) {
        room[row][col] = student;
        studentIndex++;
      } else {
        // Try to find a different student who can sit here
        let swapFound = false;
        
        // Look ahead for a student that can be placed here
        for (let i = studentIndex + 1; i < Math.min(totalStudents, studentIndex + 20); i++) {
          if (isValidPosition(room, row, col, students[i].branch)) {
            // Swap students for better sequential ordering
            [students[studentIndex], students[i]] = [students[i], students[studentIndex]];
            room[row][col] = students[studentIndex];
            studentIndex++;
            swapFound = true;
            break;
          }
        }
        
        // If no swap found, leave this seat empty for now
        if (!swapFound) {
          // We'll handle unplaced students in the second pass
        }
      }
    }
    
    // Second pass - place any remaining students in empty seats
    if (studentIndex < totalStudents) {
      // Collect all empty seats
      const emptySeats = [];
      for (let roomNum = 0; roomNum < totalRooms; roomNum++) {
        const room = rooms[roomNum];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (!room[row][col]) {
              emptySeats.push({ roomNum, row, col });
            }
          }
        }
      }
      
      // Try to place remaining students in empty seats
      for (const { roomNum, row, col } of emptySeats) {
        if (studentIndex >= totalStudents) break;
        
        const student = students[studentIndex];
        const room = rooms[roomNum];
        
        // If this is a valid position for this student, place them
        if (isValidPosition(room, row, col, student.branch)) {
          room[row][col] = student;
          studentIndex++;
        } else {
          // Find any student who can sit here
          let placed = false;
          for (let i = studentIndex; i < totalStudents; i++) {
            if (isValidPosition(room, row, col, students[i].branch)) {
              // Place this student and move to the next empty seat
              [students[studentIndex], students[i]] = [students[i], students[studentIndex]];
              room[row][col] = students[studentIndex];
              studentIndex++;
              placed = true;
              break;
            }
          }
          
          // If no valid student found, just place the current student
          // This violates the branch adjacency rule, but we need to place everyone
          if (!placed && studentIndex < totalStudents) {
            room[row][col] = students[studentIndex];
            studentIndex++;
          }
        }
      }
    }
    
    // Final pass - if we still have unplaced students, create additional rooms
    while (studentIndex < totalStudents) {
      const newRoom = Array(rows).fill().map(() => Array(cols).fill(null));
      rooms.push(newRoom);
      
      for (let row = 0; row < rows && studentIndex < totalStudents; row++) {
        for (let col = 0; col < cols && studentIndex < totalStudents; col++) {
          if (isValidPosition(newRoom, row, col, students[studentIndex].branch)) {
            newRoom[row][col] = students[studentIndex];
            studentIndex++;
          } else {
            // Just place the student - at this point we prioritize seating everyone
            newRoom[row][col] = students[studentIndex];
            studentIndex++;
          }
        }
      }
    }
    
    return rooms;
  } catch (error) {
    console.error('Error generating seating plan:', error);
    throw error;
  }
};