import React from 'react';
import GridView from './GridView';
import ListView from './ListView';
import CompactView from './CompactView';

const RoomCard = ({
  room,
  roomIndex,
  viewMode,
  branchColors,
  roomName,
  roomBranches,
  isEditing,
  editRoomName,
  setEditRoomName,
  startEditingRoom,
  saveRoomName
}) => {
  // Count total students in the room
  const totalStudents = room.flat().filter(Boolean).length;
  
  return (
    <div className="mb-4 card shadow">
      <div className="card-header bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {isEditing ? (
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control me-2"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveRoomName()}
                  autoFocus
                />
                <button 
                  onClick={saveRoomName} 
                  className="btn btn-success btn-sm"
                >
                  <i className="bi bi-check"></i> Save
                </button>
              </div>
            ) : (
              <h5 className="card-title m-0">{roomName}</h5>
            )}
          </div>
          
          <div className="d-flex align-items-center">
            <div className="me-3 d-flex align-items-center">
              <small className="text-white me-2">
                <strong>{totalStudents}</strong> students
              </small>
              <span className="badge bg-light text-dark me-2">
                <i className="bi bi-grid-3x3-gap me-1"></i>
                {room.length}×{room[0].length}
              </span>
            </div>
            
            {!isEditing && (
              <button 
                onClick={startEditingRoom} 
                className="btn btn-outline-light btn-sm"
              >
                <i className="bi bi-pencil"></i> Edit
              </button>
            )}
          </div>
        </div>
        
        {/* Branch information strip below the header */}
        <div className="d-flex flex-wrap mt-2 align-items-center">
          <small className="text-white me-2">Branches: </small>
          {roomBranches.map(branch => (
            <span 
              key={branch} 
              className="badge me-1"
              style={{ 
                backgroundColor: branchColors[branch], 
                color: '#333',
                fontSize: '0.75rem'
              }}
            >
              {branch}
            </span>
          ))}
        </div>
      </div>
      
      <div className="card-body p-3">
        {viewMode === 'grid' && (
          <GridView room={room} branchColors={branchColors} />
        )}
        
        {viewMode === 'list' && (
          <ListView room={room} branchColors={branchColors} />
        )}
        
        {viewMode === 'compact' && (
          <CompactView room={room} branchColors={branchColors} />
        )}
      </div>
    </div>
  );
};

export default RoomCard;