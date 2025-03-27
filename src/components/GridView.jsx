import React from 'react';

const GridView = ({ room, branchColors }) => {
    console.log(room);
    
  return (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead>
          <tr className="table-light">
            <th className="text-center">Row/Col</th>
            {Array.from({ length: room[0].length }, (_, i) => (
              <th key={i} className="text-center">Column {i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {room.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="text-center fw-bold bg-light">Row {rowIndex + 1}</td>
              {row.map((student, colIndex) => (
                <td 
                  key={colIndex} 
                  className="text-center position-relative"
                  style={{ 
                    backgroundColor: student ? branchColors[student.branch] : 'white',
                    transition: 'background-color 0.3s'
                  }}
                >
                  {student ? (
                    <div className="d-flex flex-column align-items-center">
                      <div className="fw-bold">{student.hallTicket}</div>
                      <div className="badge bg-dark bg-opacity-75 mt-1 small">{student.branch}</div>
                      <div className="position-absolute top-0 end-0 p-1">
                        <span className="badge bg-secondary bg-opacity-10 text-dark small">
                          {`${rowIndex+1},${colIndex+1}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted">Empty</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GridView;