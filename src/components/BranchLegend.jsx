import React from 'react';

const BranchLegend = ({ branchColors }) => {
  return (
    <div className="mb-4 card">
      <div className="card-body">
        <h5 className="fw-bold mb-3">
          <i className="bi bi-palette me-2"></i>
          Branch Color Legend:
        </h5>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {Object.entries(branchColors).map(([branch, color]) => (
            <div 
              key={branch} 
              className="badge p-2 rounded-pill"
              style={{ 
                backgroundColor: color, 
                color: '#333',
                fontSize: '0.9rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {branch}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchLegend;