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
    setExcelData(hallTickets);
    const generatedSeatingPlan = generateSeatingPlan(
      hallTickets, 
      getBranchFromHallTicket, 
      studentsPerRoom, 
      roomLayout
    );
    setSeatingPlan(generatedSeatingPlan);
    setRoomNames(Array(generatedSeatingPlan.length).fill().map((_, index) => `Room ${index + 1}`));
    setLoading(false);
  };

  // This improved function handles various Excel file formats more robustly
  const handleFileUpload = (file) => {
    setError('');
    setLoading(true);
    
    if (!file) {
      setLoading(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // More robust approach to read Excel files
        const data = new Uint8Array(e.target.result);
        
        // Use more comprehensive options for reading
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
        
        // Attempt to read all sheets to find hall tickets
        const hallTickets = [];
        let ticketsFound = false;
        
        // Try each sheet until we find valid hall tickets
        for (const sheetName of workbook.SheetNames) {
          try {
            const worksheet = workbook.Sheets[sheetName];
            
            // Try different parsing methods
            // Method 1: Parse as JSON with headers
            let jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // If no data, try without headers
            if (!jsonData || jsonData.length === 0) {
              jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            }
            
            // Extract hall ticket numbers from the data
            if (Array.isArray(jsonData)) {
              // Handle array of objects (with headers)
              if (typeof jsonData[0] === 'object' && jsonData[0] !== null) {
                Object.values(jsonData).forEach(row => {
                  if (row) {
                    Object.values(row).forEach(cell => {
                      if (cell && typeof cell === 'string') {
                        // Look for patterns like "259F1A0501" in the cell
                        const matches = cell.match(/\d{3}F1A\d{4}/g);
                        if (matches) {
                          hallTickets.push(...matches);
                          ticketsFound = true;
                        }
                      }
                    });
                  }
                });
              }
              // Handle array of arrays (without headers)
              else {
                jsonData.forEach(row => {
                  if (Array.isArray(row)) {
                    row.forEach(cell => {
                      if (cell && typeof cell === 'string') {
                        // Look for patterns like "259F1A0501" in the cell
                        const matches = cell.match(/\d{3}F1A\d{4}/g);
                        if (matches) {
                          hallTickets.push(...matches);
                          ticketsFound = true;
                        }
                      }
                    });
                  }
                });
              }
            }
            
            // If we found tickets, no need to check other sheets
            if (ticketsFound) break;
          } catch (sheetError) {
            console.warn(`Error processing sheet ${sheetName}:`, sheetError);
            // Continue to next sheet
          }
        }
        
        // Try raw cell method if no tickets found yet
        if (!ticketsFound) {
          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            
            // Direct cell access as fallback
            Object.keys(worksheet).forEach(cell => {
              // Skip special cells
              if (cell[0] === '!') return;
              
              const cellValue = worksheet[cell].v;
              if (cellValue && typeof cellValue === 'string') {
                const matches = cellValue.match(/\d{3}F1A\d{4}/g);
                if (matches) {
                  hallTickets.push(...matches);
                  ticketsFound = true;
                }
              }
            });
            
            if (ticketsFound) break;
          }
        }
        
        // Remove duplicates
        const uniqueHallTickets = [...new Set(hallTickets)];
        
        if (uniqueHallTickets.length === 0) {
          setError('No valid hall ticket numbers found in the file. Please ensure the file contains hall tickets in the format "259F1A0501".');
          setLoading(false);
          return;
        }
        
        handleFileProcessed(uniqueHallTickets);
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Error processing the file. Please make sure it is a valid Excel file. Specific error: ' + error.message);
        setLoading(false);
      }
    };
    
    reader.onerror = (e) => {
      console.error('FileReader error:', e);
      setError('Error reading the file. The file might be corrupted or too large.');
      setLoading(false);
    };
    
    // Try catch around readAsArrayBuffer for extra safety
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