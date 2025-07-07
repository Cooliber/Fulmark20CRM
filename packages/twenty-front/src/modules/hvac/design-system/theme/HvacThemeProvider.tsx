/**
 * HVAC Theme Provider - Material Design 3 Integration with PrimeReact
 * Implements "Thermal Comfort Excellence" philosophy across all components
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { HvacDesignTokens } from './hvac-design-tokens';

// Theme context for accessing design tokens throughout the app
interface HvacThemeContextType {
  tokens: typeof HvacDesignTokens;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentTemperatureZone: 'cool' | 'comfortable' | 'warm';
  setTemperatureZone: (zone: 'cool' | 'comfortable' | 'warm') => void;
}

const HvacThemeContext = createContext<HvacThemeContextType | undefined>(undefined);

export const useHvacTheme = () => {
  const context = useContext(HvacThemeContext);
  if (!context) {
    throw new Error('useHvacTheme must be used within HvacThemeProvider');
  }
  return context;
};

interface HvacThemeProviderProps {
  children: React.ReactNode;
}

export const HvacThemeProvider: React.FC<HvacThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTemperatureZone, setCurrentTemperatureZone] = useState<'cool' | 'comfortable' | 'warm'>('comfortable');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('hvac-theme-mode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply CSS custom properties for dynamic theming
  useEffect(() => {
    const root = document.documentElement;
    const tokens = HvacDesignTokens;
    
    // Apply color tokens as CSS custom properties
    Object.entries(tokens.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-primary-${key}`, value);
    });
    
    Object.entries(tokens.colors.secondary).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-secondary-${key}`, value);
    });
    
    Object.entries(tokens.colors.success).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-success-${key}`, value);
    });
    
    Object.entries(tokens.colors.warning).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-warning-${key}`, value);
    });
    
    Object.entries(tokens.colors.error).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-error-${key}`, value);
    });
    
    Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-neutral-${key}`, value);
    });
    
    // Apply spacing tokens
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-spacing-${key}`, value);
    });
    
    // Apply typography tokens
    root.style.setProperty('--hvac-font-family-primary', tokens.typography.fontFamily.primary);
    root.style.setProperty('--hvac-font-family-mono', tokens.typography.fontFamily.mono);
    
    Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-font-size-${key}`, value);
    });
    
    // Apply border radius tokens
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-border-radius-${key}`, value);
    });
    
    // Apply HVAC-specific tokens
    Object.entries(tokens.hvac.temperature).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-temperature-${key}`, value);
    });
    
    Object.entries(tokens.hvac.status).forEach(([key, value]) => {
      root.style.setProperty(`--hvac-status-${key}`, value);
    });
    
    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('hvac-dark-mode');
    } else {
      root.classList.remove('hvac-dark-mode');
    }
    
    // Apply temperature zone class for contextual styling
    root.classList.remove('hvac-zone-cool', 'hvac-zone-comfortable', 'hvac-zone-warm');
    root.classList.add(`hvac-zone-${currentTemperatureZone}`);
    
  }, [isDarkMode, currentTemperatureZone]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('hvac-theme-mode', newMode ? 'dark' : 'light');
  };

  const setTemperatureZone = (zone: 'cool' | 'comfortable' | 'warm') => {
    setCurrentTemperatureZone(zone);
    localStorage.setItem('hvac-temperature-zone', zone);
  };

  // PrimeReact theme configuration
  const primeReactConfig = {
    theme: 'lara-light-blue', // Base theme, will be customized with CSS
    ripple: true,
    inputStyle: 'outlined',
    locale: 'pl', // Polish locale for Polish market
    appendTo: 'self',
  };

  const contextValue: HvacThemeContextType = {
    tokens: HvacDesignTokens,
    isDarkMode,
    toggleDarkMode,
    currentTemperatureZone,
    setTemperatureZone,
  };

  return (
    <HvacThemeContext.Provider value={contextValue}>
      <PrimeReactProvider value={primeReactConfig}>
        <div className="hvac-theme-root">
          {children}
        </div>
      </PrimeReactProvider>
    </HvacThemeContext.Provider>
  );
};

// Utility hook for accessing specific design tokens
export const useHvacDesignTokens = () => {
  const { tokens } = useHvacTheme();
  return tokens;
};

// Utility hook for temperature-based styling
export const useTemperatureTheming = () => {
  const { currentTemperatureZone, setTemperatureZone, tokens } = useHvacTheme();
  
  const getTemperatureColor = (temperature: number) => {
    if (temperature < 10) return tokens.hvac.temperature.freezing;
    if (temperature < 16) return tokens.hvac.temperature.cold;
    if (temperature < 20) return tokens.hvac.temperature.cool;
    if (temperature < 24) return tokens.hvac.temperature.comfortable;
    if (temperature < 28) return tokens.hvac.temperature.warm;
    if (temperature < 32) return tokens.hvac.temperature.hot;
    return tokens.hvac.temperature.overheating;
  };
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return tokens.hvac.efficiency.excellent;
    if (efficiency >= 75) return tokens.hvac.efficiency.good;
    if (efficiency >= 60) return tokens.hvac.efficiency.average;
    return tokens.hvac.efficiency.poor;
  };
  
  return {
    currentTemperatureZone,
    setTemperatureZone,
    getTemperatureColor,
    getEfficiencyColor,
  };
};