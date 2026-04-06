import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(n => n.filter(x => x.id !== id));
  }, []);

  const addNotification = useCallback(({ type, title, message }) => {
    const id = Date.now() + Math.random();
    setNotifications(n => [...n.slice(-4), { id, type, title, message }]); // cap at 5
    setTimeout(() => removeNotification(id), 4500);
    return id;
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
