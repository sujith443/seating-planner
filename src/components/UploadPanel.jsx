import React from 'react';

const UploadPanel = ({ 
  onFileUpload, 
  onToggleSettings, 
  onToggleExportOptions, 
  hasSeatingPlan 
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <div>
        <label className="btn btn-primary btn-lg d-flex align-items-center gap-2">
          <i className="bi bi-upload"></i>
          <span>Upload Hall Tickets Excel</span>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="d-none" 
            onChange={handleFileChange} 
          />
        </label>
      </div>
      
      <div className="d-flex align-items-center gap-2">
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