import React, { useState } from 'react';
import RoomCard from './RoomCard';

const SeatingPlanViewer = ({ 
  seatingPlan, 
  viewMode, 
  roomNames, 
  onRoomNameChange,
  branchColors
}) => {
  const [editingRoomIndex, setEditingRoomIndex] = useState(null);
  const [editRoomName, setEditRoomName] = useState('');

  const startEditingRoom = (index) => {
    setEditingRoomIndex(index);
    setEditRoomName(roomNames[index]);
  };
  
  const saveRoomName = () => {
    if (editingRoomIndex !== null) {
      onRoomNameChange(editingRoomIndex, editRoomName);
      setEditingRoomIndex(null);
    }
  };

  // Get branches present in each room
  const getRoomBranches = (room) => {
    const branches = new Set();
    room.forEach(row => {
      row.forEach(student => {
        if (student) {
          branches.add(student.branch);
        }
      });
    });
    return Array.from(branches);
  };

  return (
    <div>
      {seatingPlan.map((room, roomIndex) => {
        const roomBranches = getRoomBranches(room);
        
        return (
          <RoomCard
            key={roomIndex}
            room={room}
            roomIndex={roomIndex}
            viewMode={viewMode}
            branchColors={branchColors}
            roomName={roomNames[roomIndex]}
            roomBranches={roomBranches}
            isEditing={editingRoomIndex === roomIndex}
            editRoomName={editRoomName}
            setEditRoomName={setEditRoomName}
            startEditingRoom={() => startEditingRoom(roomIndex)}
            saveRoomName={saveRoomName}
          />
        );
      })}
    </div>
  );
};

export default SeatingPlanViewer;