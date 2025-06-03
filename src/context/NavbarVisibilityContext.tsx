import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface NavbarVisibilityContextProps {
  isNavbarVisible: boolean;
  setNavbarVisible: (visible: boolean) => void;
}

const NavbarVisibilityContext = createContext<NavbarVisibilityContextProps | undefined>(undefined);

export function NavbarVisibilityProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isNavbarVisible, setNavbarVisible] = useState(!isHome);
  return (
    <NavbarVisibilityContext.Provider value={{ isNavbarVisible, setNavbarVisible }}>
      {children}
    </NavbarVisibilityContext.Provider>
  );
}

export function useNavbarVisibility() {
  const context = useContext(NavbarVisibilityContext);
  if (!context) throw new Error('useNavbarVisibility must be used within a NavbarVisibilityProvider');
  return context;
} 