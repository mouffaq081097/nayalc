'use client';

import React, { createContext, useContext, useState } from 'react';

const HeaderContext = createContext();

export const HeaderProvider = ({ children }) => {
  const [subHeader, setSubHeader] = useState(null);

  return (
    <HeaderContext.Provider value={{ subHeader, setSubHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
