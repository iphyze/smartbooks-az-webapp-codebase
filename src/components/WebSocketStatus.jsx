import React, { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';
import useAuthStore from '../stores/useAuthStore';

const WebSocketStatus = () => {
  const [status, setStatus] = useState('Disconnected');
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (!token) return;

    // Initial connection
    if (websocketService.getStatus() === 'Disconnected') {
      websocketService.connect(token);
    }

    const checkConnection = () => {
      const currentStatus = websocketService.getStatus();
      setStatus(currentStatus);
    };

    // Check status immediately and then every 2 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, [token]);

  const getStatusColor = () => {
    switch (status) {
      case 'Connected':
        return '#4CAF50';
      case 'Connecting':
        return '#FFA500';
      case 'Disconnecting':
      case 'Disconnected':
        return '#f44336';
      default:
        return '#808080';
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      padding: '5px 10px',
      backgroundColor: getStatusColor(),
      color: 'white',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: 'white',
        opacity: status === 'Connected' ? '1' : '0.5'
      }} />
      WebSocket: {status}
    </div>
  );
};

export default WebSocketStatus;