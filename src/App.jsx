import React, { useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import SettingsPanel from './components/SettingsPanel';
import BranchLegend from './components/BranchLegend';
import SeatingPlanViewer from './components/SeatingPlanViewer';
import Footer from './components/Footer';
import { branchMap, branchColors } from './utils/constant';
import { generateSeatingPlan, getBranchFromHallTicket } from './utils/seatingAlgorithm';
import { downloadSeatingPlan } from './utils/exportFunctions';
import * as XLSX from 'xlsx';

const App = () => {
  const [excelData, setExcelData] = useState(null);
  const [seatingPlan, setSeatingPlan] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomNames, setRoomNames] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'compact'
  const [showSettings, setShowSettings] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [studentsPerRoom, setStudentsPerRoom] = useState(24);
  const [roomLayout, setRoomLayout] = useState({ rows: 4, cols: 6 });

  const handleFileProcessed = (hallTickets) => {
    console.log(`Processing ${hallTickets.length} hall tickets`);
    setExcelData(hallTickets);
    const generatedSeatingPlan = generateSeatingPlan(
      hallTickets, 
      getBranchFromHallTicket, 
      studentsPerRoom, 
      roomLayout
    );
    console.log(`Generated seating plan with ${generatedSeatingPlan.length} rooms`);
    setSeatingPlan(generatedSeatingPlan);
    setRoomNames(Array(generatedSeatingPlan.length).fill().map((_, index) => `Room ${index + 1}`));
    setLoading(false);
  };

  // Enhanced file upload function
  const handleFileUpload = (file) => {
    setError('');
    setLoading(true);
    
    if (!file) {
      setLoading(false);
      setError('No file selected. Please select an Excel file to upload.');
      return;
    }
    
    console.log(`Processing file: ${file.name}`);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log('File loaded, processing...');
        
        // Parse Excel file
        const data = new Uint8Array(e.target.result);
        
        // More comprehensive options for reading Excel
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          cellNF: true,
          cellStyles: true 
        });
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          setError('Unable to parse Excel file. The file appears to be empty or corrupted.');
          setLoading(false);
          return;
        }
        
        console.log('Excel file loaded. Sheets:', workbook.SheetNames);
        
        // Enhanced hall ticket pattern matching - supports more formats
        // This regex looks for common hall ticket patterns:
        // - Standard JNTU format: 3 digits + "F1A" + 4 digits (e.g., 259F1A0501)
        // - Also matches variations with different separators or formats
        const hallTicketPatterns = [
          /\d{3}F1A\d{4}/g,  // Standard format: 259F1A0501
          /\d{2}[A-Z]\d{2}[A-Z]\d{4}/g,  // Other possible formats like 21F15A0123
          /\b\d{2}[A-Z]{1,2}\d{2}[A-Z]\d{2,4}\b/g  // More general pattern
        ];
        
        // Track all found hall tickets
        const allHallTickets = [];
        
        // Function to extract hall tickets from a text value
        const extractHallTickets = (value) => {
          if (!value || typeof value !== 'string') return [];
          
          let foundTickets = [];
          
          // Try each pattern
          hallTicketPatterns.forEach(pattern => {
            const matches = value.match(pattern);
            if (matches) {
              foundTickets = [...foundTickets, ...matches];
            }
          });
          
          return foundTickets;
        };
        
        // Process all sheets in the workbook
        let ticketsFound = false;
        
        for (const sheetName of workbook.SheetNames) {
          console.log(`Processing sheet: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          
          // Try multiple approaches to extract data
          
          // Approach 1: Standard JSON with headers
          let sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          // If no data found, try array format
          if (!sheetData || sheetData.length === 0) {
            sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          }
          
          // Process data to find hall tickets
          if (Array.isArray(sheetData) && sheetData.length > 0) {
            console.log(`Found ${sheetData.length} rows in sheet ${sheetName}`);
            
            // Process each row in the sheet
            sheetData.forEach(row => {
              // Handle both object format and array format
              const values = Array.isArray(row) ? row : Object.values(row);
              
              values.forEach(cellValue => {
                if (cellValue) {
                  // Convert to string if it's not already
                  const strValue = cellValue.toString();
                  
                  // Extract hall tickets
                  const hallTickets = extractHallTickets(strValue);
                  
                  if (hallTickets.length > 0) {
                    allHallTickets.push(...hallTickets);
                    ticketsFound = true;
                  }
                }
              });
            });
          }
          
          // If still no tickets found, try direct cell-by-cell approach
          if (!ticketsFound) {
            if (!worksheet['!ref']) {
              console.log('No cell reference found in worksheet, skipping...');
              continue;
            }
            
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            console.log(`Scanning cells in range: ${worksheet['!ref']}`);
            
            for (let row = range.s.r; row <= range.e.r; row++) {
              for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = worksheet[cellAddress];
                
                if (cell && cell.v) {
                  const strValue = cell.v.toString();
                  const hallTickets = extractHallTickets(strValue);
                  
                  if (hallTickets.length > 0) {
                    allHallTickets.push(...hallTickets);
                    ticketsFound = true;
                  }
                }
              }
            }
          }
        }
        
        // Remove duplicates
        const uniqueHallTickets = [...new Set(allHallTickets)];
        console.log(`Found ${uniqueHallTickets.length} unique hall tickets`);
        
        if (uniqueHallTickets.length === 0) {
          setError('No valid hall ticket numbers found in the file. Please ensure the file contains hall tickets in formats like "259F1A0501".');
          setLoading(false);
          return;
        }
        
        // Process successfully extracted hall tickets
        handleFileProcessed(uniqueHallTickets);
      } catch (error) {
        console.error('Error processing file:', error);
        setError(`Error processing the file: ${error.message}. Please make sure it is a valid Excel file.`);
        setLoading(false);
      }
    };
    
    reader.onerror = (e) => {
      console.error('FileReader error:', e);
      setError('Error reading the file. The file might be corrupted or too large.');
      setLoading(false);
    };
    
    try {
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file as array buffer:', error);
      setError('Could not read the file. Please try a different file format or size.');
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    downloadSeatingPlan(seatingPlan, roomNames, branchColors, format);
    setShowExportOptions(false);
  };

  const handleRoomNameChange = (index, newName) => {
    const newRoomNames = [...roomNames];
    newRoomNames[index] = newName;
    setRoomNames(newRoomNames);
  };

  const applySettings = () => {
    if (excelData && excelData.length > 0) {
      const generatedSeatingPlan = generateSeatingPlan(
        excelData, 
        getBranchFromHallTicket, 
        studentsPerRoom, 
        roomLayout
      );
      setSeatingPlan(generatedSeatingPlan);
      // Keep existing room names where possible, add new ones if needed
      if (generatedSeatingPlan.length > roomNames.length) {
        setRoomNames([
          ...roomNames,
          ...Array(generatedSeatingPlan.length - roomNames.length)
            .fill()
            .map((_, i) => `Room ${roomNames.length + i + 1}`)
        ]);
      } else if (generatedSeatingPlan.length < roomNames.length) {
        setRoomNames(roomNames.slice(0, generatedSeatingPlan.length));
      }
    }
    setShowSettings(false);
  };

  // Function to count students by branch
  const getStudentCounts = () => {
    if (!seatingPlan || seatingPlan.length === 0) return {};
    
    const counts = {};
    seatingPlan.forEach(room => {
      room.forEach(row => {
        row.forEach(student => {
          if (student) {
            counts[student.branch] = (counts[student.branch] || 0) + 1;
          }
        });
      });
    });
    
    return counts;
  };

  const studentCounts = getStudentCounts();

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <div className="card shadow mb-4">
          <Header />
          
          <div className="card-body p-4">
            <UploadPanel 
              onFileUpload={handleFileUpload} 
              onToggleSettings={() => setShowSettings(!showSettings)}
              onToggleExportOptions={() => setShowExportOptions(!showExportOptions)}
              hasSeatingPlan={seatingPlan.length > 0}
            />
            
            {showExportOptions && (
              <div className="card mb-3 bg-light">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-download me-2"></i>
                    Export Options
                  </h5>
                  <div className="d-flex gap-2 mt-3">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleExport('excel')}
                    >
                      <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                      Export to Excel
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleExport('pdf')}
                    >
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Export to PDF
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setShowExportOptions(false)}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {showSettings && (
              <SettingsPanel 
                studentsPerRoom={studentsPerRoom}
                setStudentsPerRoom={setStudentsPerRoom}
                roomLayout={roomLayout}
                setRoomLayout={setRoomLayout}
                onApplySettings={applySettings}
              />
            )}
            
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Processing your file...</p>
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger my-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <div className="mt-2 small">
                  <strong>Hint:</strong> Make sure your Excel file contains hall ticket numbers in the format "259F1A0501".
                  If the error persists, try saving your file in a different Excel format (.xlsx or .xls) or try CSV format.
                </div>
              </div>
            )}
            
            {excelData && !loading && (
              <div className="alert alert-info mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                  <div>
                    <h5 className="alert-heading">File Processed Successfully</h5>
                    <p className="mb-0">Found {excelData.length} hall ticket numbers in file</p>
                    <p className="mb-0 text-muted">Total Rooms: {seatingPlan.length}</p>
                  </div>
                  
                  <div className="mt-3 mt-md-0 d-flex align-items-center gap-2">
                    <span className="text-muted">View:</span>
                    <div className="btn-group">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                        title="Grid View"
                      >
                        <i className="bi bi-grid-3x3-gap"></i>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                        title="List View"
                      >
                        <i className="bi bi-list-ul"></i>
                      </button>
                      <button
                        onClick={() => setViewMode('compact')}
                        className={`btn btn-sm ${viewMode === 'compact' ? 'btn-primary' : 'btn-outline-primary'}`}
                        title="Compact View"
                      >
                        <i className="bi bi-layout-text-window"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                {Object.keys(studentCounts).length > 0 && (
                  <div className="mt-3">
                    <h6 className="fw-bold">Branch Distribution:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {Object.entries(studentCounts).map(([branch, count]) => (
                        <span 
                          key={branch} 
                          className="badge rounded-pill p-2"
                          style={{ backgroundColor: branchColors[branch], color: '#333' }}
                        >
                          {branch}: {count} students
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {seatingPlan.length > 0 && (
              <div>
                <BranchLegend branchColors={branchColors} />
                
                <SeatingPlanViewer 
                  seatingPlan={seatingPlan}
                  viewMode={viewMode}
                  roomNames={roomNames}
                  onRoomNameChange={handleRoomNameChange}
                  branchColors={branchColors}
                />
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default App;