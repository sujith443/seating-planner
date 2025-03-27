import React from 'react';
import { getBranchColor } from '../utils/constant';

const ListView = ({ room, branchColors }) => {
  return (
    <div>
      <h6 className="fw-bold mb-3">
        <i className="bi bi-people-fill me-2"></i>
        Student List:
      </h6>
      <div className="row g-3">
        {room.map((row, rowIndex) => (
          row.map((student, colIndex) => {
            if (!student) return null;
            return (
              <div key={`${rowIndex}-${colIndex}`} className="col-md-6 col-lg-4">
                <div 
                  className="card h-100 border"
                  style={{ 
                    backgroundColor: getBranchColor(student.branch),
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="fw-bold mb-1">{student.hallTicket}</h6>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-dark me-2">{student.branch}</span>
                          <small className="text-muted">
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            Seat {rowIndex+1}-{colIndex+1}
                          </small>
                        </div>
                      </div>
                      <span className="badge bg-primary rounded-pill">
                        R{rowIndex+1}C{colIndex+1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )).flat().filter(Boolean)}
      </div>
    </div>
  );
};

export default ListView;