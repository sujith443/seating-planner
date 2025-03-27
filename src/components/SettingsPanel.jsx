import React from 'react';

const SettingsPanel = ({ 
  studentsPerRoom, 
  setStudentsPerRoom, 
  roomLayout, 
  setRoomLayout, 
  onApplySettings 
}) => {
  const handleRoomLayoutChange = (e) => {
    const { name, value } = e.target;
    setRoomLayout({
      ...roomLayout,
      [name]: parseInt(value)
    });
  };

  return (
    <div className="mb-4 card bg-light">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-gear-fill me-2"></i>
          Seating Plan Settings
        </h5>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">
              Students Per Room
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="form-control"
              value={studentsPerRoom}
              onChange={(e) => setStudentsPerRoom(parseInt(e.target.value))}
            />
            <div className="form-text">Maximum number of students in each room</div>
          </div>
          <div className="col-md-4">
            <label className="form-label">
              Rows Per Room
            </label>
            <input
              type="number"
              name="rows"
              min="1"
              max="10"
              className="form-control"
              value={roomLayout.rows}
              onChange={handleRoomLayoutChange}
            />
            <div className="form-text">Number of rows in seating arrangement</div>
          </div>
          <div className="col-md-4">
            <label className="form-label">
              Columns Per Room
            </label>
            <input
              type="number"
              name="cols"
              min="1"
              max="10"
              className="form-control"
              value={roomLayout.cols}
              onChange={handleRoomLayoutChange}
            />
            <div className="form-text">Number of columns in seating arrangement</div>
          </div>
        </div>
        <div className="mt-3 text-end">
          <button
            onClick={onApplySettings}
            className="btn btn-primary"
          >
            <i className="bi bi-check-lg me-1"></i>
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;