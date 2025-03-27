// Branch mapping based on the digits in the hall ticket
export const branchMap = {
  '01': 'CIVIL',
  '02': 'EEE',
  '03': 'MECH',
  '04': 'ECE',
  '05': 'CSE',
  '12': 'IT'
};

// Colors for different branches with improved contrast and accessibility
export const branchColors = {
  'CIVIL': '#fad7d7', // Lighter red
  'EEE': '#d6e9ff',   // Lighter blue
  'MECH': '#d7f5dc',  // Lighter green
  'ECE': '#fff8d9',   // Lighter yellow
  'CSE': '#e7e0ff',   // Lighter purple
  'IT': '#ffe6cc',    // Lighter orange
  'Unknown': '#f0f0f0' // Light gray for unknown branches
};

// Function to get color for any branch, including unknown ones
export const getBranchColor = (branch) => {
  // If the branch is directly in our color map, return that color
  if (branchColors[branch]) {
    return branchColors[branch];
  }
  
  // If it's an "Unknown-XX" format, try to get the original branch code
  const unknownMatch = branch.match(/Unknown-(\d{2})/);
  if (unknownMatch && unknownMatch[1]) {
    const branchCode = unknownMatch[1];
    // If the branch code is in our branch map, return the color for that branch
    if (branchMap[branchCode]) {
      return branchColors[branchMap[branchCode]];
    }
  }
  
  // Fallback to the Unknown color
  return branchColors['Unknown'];
};