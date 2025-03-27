import React from 'react';

const CompactView = ({ room, branchColors }) => {
  return (
    <div>
      <div className="row g-1">
        {room.map((row, rowIndex) => (
          row.map((student, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="col-2">
              <div 
                className="border text-center p-1" 
                style={{ 
                  backgroundColor: student ? branchColors[student.branch] : '#f8f9fa',
                  minHeight: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                title={student ? `${student.hallTicket} (${student.branch})` : 'Empty Seat'}
              >
                {student ? (
                  <>
                    <div className="small">{student.hallTicket.substring(7)}</div>
                    <div className="badge bg-dark text-white mt-1" style={{fontSize: '0.65rem'}}>
                      {student.branch}
                    </div>
                    <div 
                      className="position-absolute top-0 start-0 bg-dark bg-opacity-10 p-1" 
                      style={{ 
                        fontSize: '0.6rem',
                        lineHeight: 1
                      }}
                    >
                      {`R${rowIndex+1}C${colIndex+1}`}
                    </div>
                  </>
                ) : (
                  <span className="text-muted small">Empty</span>
                )}
              </div>
            </div>
          ))
        )).flat()}
      </div>
    </div>
  );
};

export default CompactView;