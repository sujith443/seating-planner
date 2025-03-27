import React, { useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import SettingsPanel from './components/SettingsPanel';
import BranchLegend from './components/BranchLegend';
import SeatingPlanViewer from './components/SeatingPlanViewer';
import Footer from './components/Footer';
import { branchMap, branchColors, getBranchColor } from './utils/constant';
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
  const [uploadStats, setUploadStats] = useState(null);

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

  // Enhanced file upload function incorporating 10-digit extractor approach
  const handleFileUpload = (file) => {
    setError('');
    setLoading(true);
    setUploadStats(null);
    
    if (!file) {
      setLoading(false);
      setError('No file selected. Please select an Excel file to upload.');
      return;
    }
    
    console.log(`Processing file: ${file.name}`);
    
    const readFile = async () => {
      try {
        // Read the file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Parse Excel file with comprehensive options
        const workbook = XLSX.read(arrayBuffer, { 
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
        
        // Hall ticket pattern detection
        // The primary pattern for JNTU hall tickets is: 3 digits + "F1A" + 4 digits (e.g., 259F1A0501)
        // But we'll also look for variations and common formats
        const hallTicketPatterns = [
          { pattern: /\d{3}F1A\d{4}/g, name: 'Standard JNTU' },  // Standard format: 259F1A0501
          { pattern: /\d{2}[A-Z]\d{2}[A-Z]\d{4}/g, name: 'Alternative Format' },  // Other possible formats like 21F15A0123
          { pattern: /\b\d{2}[A-Z]{1,2}\d{2}[A-Z]\d{2,4}\b/g, name: 'General Pattern' },  // More general pattern
          { pattern: /^[A-Za-z0-9]{10}$/g, name: '10-digit Alphanumeric' }  // Any 10-digit alphanumeric code
        ];
        
        // Track all found hall tickets and their patterns
        const allHallTickets = [];
        const patternCounts = {
          'Standard JNTU': 0,
          'Alternative Format': 0,
          'General Pattern': 0,
          '10-digit Alphanumeric': 0
        };
        
        // Process all sheets in the workbook
        const allSheetNames = workbook.SheetNames;
        const sheetsWithTickets = new Set();
        
        for (const sheetName of allSheetNames) {
          console.log(`Processing sheet: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          let sheetFoundTickets = false;
          
          // Approach 1: Convert to JSON with headers (best for structured data)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          // Process each row (this handles both header-based and arbitrary Excel formats)
          for (const row of jsonData) {
            // Check all values in the row
            Object.values(row).forEach(value => {
              if (value) {
                const strValue = String(value).trim();
                
                // Try each pattern to find hall tickets
                for (const { pattern, name } of hallTicketPatterns) {
                  const matches = strValue.match(pattern);
                  if (matches) {
                    allHallTickets.push(...matches);
                    patternCounts[name] += matches.length;
                    sheetFoundTickets = true;
                  }
                }
              }
            });
          }
          
          // Approach 2: Also try direct cell scanning for complex layouts
          if (worksheet['!ref']) {
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            
            for (let row = range.s.r; row <= range.e.r; row++) {
              for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = worksheet[cellAddress];
                
                if (cell && cell.v) {
                  const strValue = String(cell.v).trim();
                  
                  // Try each pattern again
                  for (const { pattern, name } of hallTicketPatterns) {
                    const matches = strValue.match(pattern);
                    if (matches) {
                      allHallTickets.push(...matches);
                      patternCounts[name] += matches.length;
                      sheetFoundTickets = true;
                    }
                  }
                }
              }
            }
          }
          
          if (sheetFoundTickets) {
            sheetsWithTickets.add(sheetName);
          }
        }
        
        // Filter for valid hall tickets (focus on the standard JNTU format)
        // We prioritize hall tickets that match our known pattern for branch detection
        const standardFormat = allHallTickets.filter(ticket => /\d{3}F1A\d{4}/.test(ticket));
        
        // If we don't find any standard formats, use whatever we found
        const uniqueHallTickets = [...new Set(standardFormat.length > 0 ? standardFormat : allHallTickets)];
        console.log(`Found ${uniqueHallTickets.length} unique hall tickets`);
        
        // Set upload statistics for displaying to user
        setUploadStats({
          fileName: file.name,
          totalSheets: allSheetNames.length,
          sheetsWithData: sheetsWithTickets.size,
          sheetsWithTickets: Array.from(sheetsWithTickets),
          totalTickets: allHallTickets.length,
          uniqueTickets: uniqueHallTickets.length,
          patternCounts
        });
        
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
    
    // Start the file reading process
    readFile().catch(error => {
      console.error('Error reading file:', error);
      setError('Error reading the file. The file might be corrupted or too large.');
      setLoading(false);
    });
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
            
            {uploadStats && !loading && !error && (
              <div className="alert alert-light border my-3">
                <h5 className="alert-heading">
                  <i className="bi bi-info-circle-fill me-2 text-primary"></i>
                  File Processing Details
                </h5>
                <p className="mb-1"><strong>File:</strong> {uploadStats.fileName}</p>
                <p className="mb-1"><strong>Sheets Scanned:</strong> {uploadStats.totalSheets}</p>
                <p className="mb-1"><strong>Sheets With Tickets:</strong> {uploadStats.sheetsWithData} 
                  {uploadStats.sheetsWithTickets?.length > 0 && 
                    <span className="text-muted"> ({uploadStats.sheetsWithTickets.join(', ')})</span>
                  }
                </p>
                <p className="mb-1"><strong>Total Tickets Found:</strong> {uploadStats.totalTickets}</p>
                <p className="mb-1"><strong>Unique Tickets:</strong> {uploadStats.uniqueTickets}</p>
                
                <hr />
                <div className="small">
                  <p className="mb-1"><strong>Pattern Matches:</strong></p>
                  <ul className="list-unstyled ms-3">
                    {Object.entries(uploadStats.patternCounts).map(([pattern, count]) => (
                      count > 0 ? <li key={pattern}>{pattern}: {count}</li> : null
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {excelData && !loading && excelData.length > 0 && (
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
                          style={{ backgroundColor: getBranchColor(branch), color: '#333' }}
                        >
                          {branch}: {count} students
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Branch Detection Examples Section */}
                <div className="mt-3 pt-2 border-top">
                  <h6 className="fw-bold">Branch Detection Examples:</h6>
                  <div className="row g-2">
                    {excelData.slice(0, 5).map((ticket, index) => (
                      <div key={index} className="col-md-4 col-sm-6">
                        <div className="card bg-light border-0">
                          <div className="card-body p-2 d-flex align-items-center">
                            <div className="me-2" style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              backgroundColor: getBranchColor(getBranchFromHallTicket(ticket)) 
                            }}></div>
                            <div>
                              <code className="small">{ticket}</code>
                              <div className="small text-muted">{getBranchFromHallTicket(ticket)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {excelData.length > 5 && (
                    <div className="text-end mt-1">
                      <small className="text-muted">Showing 5 of {excelData.length} hall tickets</small>
                    </div>
                  )}
                </div>
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