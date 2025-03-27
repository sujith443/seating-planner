import React, { useState, useRef } from 'react';

const UploadPanel = ({ 
  onFileUpload, 
  onToggleSettings, 
  onToggleExportOptions, 
  hasSeatingPlan 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      onFileUpload(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="mb-4">
      <div 
        className={`card mb-3 ${dragActive ? 'bg-primary bg-opacity-10 border-primary' : 'bg-light'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="card-body text-center py-5">
          <i className={`bi bi-cloud-upload ${dragActive ? 'text-primary' : 'text-secondary'} fs-1 mb-3`}></i>
          
          <h5 className="card-title">Upload Exam Schedule Excel File</h5>
          <p className="card-text text-muted">
            Drag and drop your Excel file here, or click the button below
          </p>
          
          <button
            onClick={handleButtonClick}
            className="btn btn-primary btn-lg mt-2"
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Browse Files
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            className="d-none" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange} 
          />
          
          {selectedFile && (
            <div className="mt-3">
              <span className="badge bg-success">
                <i className="bi bi-check-circle me-1"></i>
                {selectedFile.name}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="d-flex justify-content-between">
        <button
          onClick={onToggleSettings}
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
        >
          <i className="bi bi-gear"></i>
          <span>Settings</span>
        </button>
        
        {hasSeatingPlan && (
          <button 
            onClick={onToggleExportOptions}
            className="btn btn-success d-flex align-items-center gap-2"
          >
            <i className="bi bi-download"></i>
            <span>Export</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadPanel;