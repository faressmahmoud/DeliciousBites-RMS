import { createContext, useContext, useState } from 'react';

const ServiceModeContext = createContext(null);

export function ServiceModeProvider({ children }) {
  const [serviceMode, setServiceMode] = useState(null); // 'dine-in', 'delivery', 'pick-up'
  const [reservation, setReservation] = useState(null);

  return (
    <ServiceModeContext.Provider
      value={{
        serviceMode,
        setServiceMode,
        reservation,
        setReservation,
      }}
    >
      {children}
    </ServiceModeContext.Provider>
  );
}

export function useServiceMode() {
  const context = useContext(ServiceModeContext);
  if (!context) {
    throw new Error('useServiceMode must be used within ServiceModeProvider');
  }
  return context;
}

