import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const NotificationContainer = () => {
  const { notifications, actions } = useApp();

  useEffect(() => {
    // Auto-remove notifications after their duration
    notifications.forEach(notification => {
      if (notification.duration && !notification.timeoutId) {
        const timeoutId = setTimeout(() => {
          actions.removeNotification(notification.id);
        }, notification.duration);
        
        // Store timeout ID to prevent multiple timeouts
        notification.timeoutId = timeoutId;
      }
    });
  }, [notifications, actions]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${notification.type}`}
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {notification.title && (
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {notification.title}
                </div>
              )}
              <div>{notification.message}</div>
            </div>
            
            <button
              onClick={() => actions.removeNotification(notification.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                marginLeft: '12px',
                opacity: 0.7,
                color: 'inherit'
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;