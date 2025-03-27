import React from 'react';
import { getBranchColor } from '../utils/constant';

const BranchLegend = ({ branchColors }) => {
  // Get all branches that we need to show in the legend
  const knownBranches = Object.keys(branchColors).filter(branch => branch !== 'Unknown');
  
  return (
    <div className="mb-4 card">
      <div className="card-body">
        <h5 className="fw-bold mb-3">
          <i className="bi bi-palette me-2"></i>
          Branch Color Legend:
        </h5>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {knownBranches.map((branch) => (
            <div 
              key={branch} 
              className="badge p-2 rounded-pill"
              style={{ 
                backgroundColor: branchColors[branch], 
                color: '#333',
                fontSize: '0.9rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {branch}
            </div>
          ))}
          
          {/* Add the Unknown branch to the legend */}
          <div 
            className="badge p-2 rounded-pill"
            style={{ 
              backgroundColor: branchColors['Unknown'], 
              color: '#333',
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Unknown
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchLegend;