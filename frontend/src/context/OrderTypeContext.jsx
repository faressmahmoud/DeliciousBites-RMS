import { createContext, useContext, useState } from 'react';

const OrderTypeContext = createContext(null);

export function OrderTypeProvider({ children }) {
  const [orderType, setOrderType] = useState('takeaway');

  return (
    <OrderTypeContext.Provider value={{ orderType, setOrderType }}>
      {children}
    </OrderTypeContext.Provider>
  );
}

export function useOrderType() {
  const context = useContext(OrderTypeContext);
  if (!context) {
    throw new Error('useOrderType must be used within OrderTypeProvider');
  }
  return context;
}

