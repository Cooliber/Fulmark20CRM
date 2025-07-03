/**
 * HVAC CRM Design System - Material Design 3 Tokens
 * Philosophy: "Thermal Comfort Excellence" - Every element reflects precision, reliability, and comfort
 */

export const HvacDesignTokens = {
  // Color System - Inspired by HVAC thermal zones
  colors: {
    // Primary - Cool Professional Blue (like efficient cooling)
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3', // Main brand color
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    
    // Secondary - Warm Comfort Orange (like efficient heating)
    secondary: {
      50: '#fff3e0',
      100: '#ffe0b2',
      200: '#ffcc80',
      300: '#ffb74d',
      400: '#ffa726',
      500: '#ff9800', // Warm accent
      600: '#fb8c00',
      700: '#f57c00',
      800: '#ef6c00',
      900: '#e65100',
    },
    
    // Success - Fresh Air Green
    success: {
      50: '#e8f5e8',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#4caf50',
      600: '#43a047',
      700: '#388e3c',
      800: '#2e7d32',
      900: '#1b5e20',
    },
    
    // Warning - Energy Alert Amber
    warning: {
      50: '#fffbf0',
      100: '#fff3c4',
      200: '#ffeb9c',
      300: '#ffe082',
      400: '#ffd54f',
      500: '#ffca28',
      600: '#ffc107',
      700: '#ffb300',
      800: '#ffa000',
      900: '#ff8f00',
    },
    
    // Error - System Alert Red
    error: {
      50: '#ffebee',
      100: '#ffcdd2',
      200: '#ef9a9a',
      300: '#e57373',
      400: '#ef5350',
      500: '#f44336',
      600: '#e53935',
      700: '#d32f2f',
      800: '#c62828',
      900: '#b71c1c',
    },
    
    // Neutral - Clean Air Grays
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    
    // Surface colors for depth and hierarchy
    surface: {
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceVariant: '#f1f3f4',
      outline: '#dadce0',
      outlineVariant: '#e8eaed',
    },
  },
  
  // Typography - Clean, professional, readable
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing - Consistent rhythm like HVAC airflow
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // Border Radius - Soft, approachable curves
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },
  
  // Shadows - Depth and elevation
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Animation - Smooth like optimal temperature control
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // HVAC-Specific Design Elements
  hvac: {
    // Temperature visualization colors
    temperature: {
      freezing: '#1565c0',  // Deep blue
      cold: '#2196f3',      // Blue
      cool: '#4fc3f7',      // Light blue
      comfortable: '#4caf50', // Green
      warm: '#ff9800',      // Orange
      hot: '#f44336',       // Red
      overheating: '#d32f2f', // Dark red
    },
    
    // Equipment status colors
    status: {
      operational: '#4caf50',
      maintenance: '#ff9800',
      warning: '#ffc107',
      critical: '#f44336',
      offline: '#9e9e9e',
    },
    
    // Efficiency indicators
    efficiency: {
      excellent: '#2e7d32',
      good: '#4caf50',
      average: '#ff9800',
      poor: '#f44336',
    },
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },
  
  // Z-index layers
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

// Type definitions for TypeScript support
export type HvacColorScale = typeof HvacDesignTokens.colors.primary;
export type HvacSpacing = keyof typeof HvacDesignTokens.spacing;
export type HvacFontSize = keyof typeof HvacDesignTokens.typography.fontSize;
export type HvacBorderRadius = keyof typeof HvacDesignTokens.borderRadius;