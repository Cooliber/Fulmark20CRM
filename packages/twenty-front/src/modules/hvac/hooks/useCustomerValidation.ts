/**
 * useCustomerValidation Hook - Customer Data Validation
 * "Pasja rodzi profesjonalizm" - Professional customer data validation
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper error handling
 * - Polish business compliance validation
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  Customer, 
  CustomerStatus, 
  CustomerType, 
  PaymentMethod, 
  ContactMethod,
  RiskLevel 
} from '../services/CustomerAPIService';
import { 
  polishBusinessValidationService, 
  ValidationResult,
  VATCategory 
} from '../services/PolishBusinessValidationService';
import { useHVACErrorReporting } from '../index';

// Validation state interface
interface CustomerValidationState {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  validating: boolean;
}

// Validation options interface
interface ValidationOptions {
  validateNIP?: boolean;
  validateREGON?: boolean;
  validateKRS?: boolean;
  validateAddress?: boolean;
  validateFinancial?: boolean;
  realTimeValidation?: boolean;
}

// Hook return interface
interface UseCustomerValidationReturn extends CustomerValidationState {
  validateCustomer: (customer: Partial<Customer>) => Promise<boolean>;
  validateField: (fieldName: keyof Customer, value: any) => ValidationResult;
  clearValidation: () => void;
  getFieldErrors: (fieldName: keyof Customer) => string[];
  getFieldWarnings: (fieldName: keyof Customer) => string[];
  isFieldValid: (fieldName: keyof Customer) => boolean;
  calculateHealthScore: (customer: Partial<Customer>) => number;
  suggestImprovements: (customer: Partial<Customer>) => string[];
}

/**
 * Custom hook for comprehensive customer data validation
 * Includes Polish business compliance and HVAC-specific validation
 */
export const useCustomerValidation = (
  options: ValidationOptions = {}
): UseCustomerValidationReturn => {
  const {
    validateNIP = true,
    validateREGON = true,
    validateKRS = false,
    validateAddress = true,
    validateFinancial = true,
    realTimeValidation = true,
  } = options;

  // State management
  const [validationState, setValidationState] = useState<CustomerValidationState>({
    isValid: true,
    errors: {},
    warnings: {},
    validating: false,
  });

  // Error reporting
  const { reportError, addBreadcrumb } = useHVACErrorReporting();

  /**
   * Validate entire customer object
   */
  const validateCustomer = useCallback(async (customer: Partial<Customer>): Promise<boolean> => {
    try {
      setValidationState(prev => ({ ...prev, validating: true }));
      addBreadcrumb('Starting customer validation', 'validation');

      const errors: Record<string, string[]> = {};
      const warnings: Record<string, string[]> = {};

      // Basic field validation
      if (!customer.name || customer.name.trim().length === 0) {
        errors.name = ['Nazwa klienta jest wymagana'];
      }

      if (customer.name && customer.name.length > 255) {
        errors.name = [...(errors.name || []), 'Nazwa klienta nie może przekraczać 255 znaków'];
      }

      // Email validation
      if (customer.email && !isValidEmail(customer.email)) {
        errors.email = ['Nieprawidłowy format adresu email'];
      }

      // Phone validation
      if (customer.phone && !isValidPolishPhone(customer.phone)) {
        warnings.phone = ['Numer telefonu może być nieprawidłowy'];
      }

      // Polish business validation
      if (validateNIP && customer.nip) {
        const nipValidation = polishBusinessValidationService.validateNIP(customer.nip);
        if (!nipValidation.isValid) {
          errors.nip = nipValidation.errors;
        }
        if (nipValidation.warnings.length > 0) {
          warnings.nip = nipValidation.warnings;
        }
      }

      if (validateREGON && customer.regon) {
        const regonValidation = polishBusinessValidationService.validateREGON(customer.regon);
        if (!regonValidation.isValid) {
          errors.regon = regonValidation.errors;
        }
        if (regonValidation.warnings.length > 0) {
          warnings.regon = regonValidation.warnings;
        }
      }

      if (validateKRS && customer.krs) {
        const krsValidation = polishBusinessValidationService.validateKRS(customer.krs);
        if (!krsValidation.isValid) {
          errors.krs = krsValidation.errors;
        }
        if (krsValidation.warnings.length > 0) {
          warnings.krs = krsValidation.warnings;
        }
      }

      // Address validation
      if (validateAddress && customer.address) {
        const addressErrors = validateCustomerAddress(customer.address);
        if (addressErrors.length > 0) {
          errors.address = addressErrors;
        }
      }

      // Financial validation
      if (validateFinancial) {
        const financialErrors = validateFinancialData(customer);
        if (financialErrors.length > 0) {
          errors.financial = financialErrors;
        }
      }

      // Business logic validation
      const businessErrors = validateBusinessLogic(customer);
      if (businessErrors.length > 0) {
        errors.business = businessErrors;
      }

      const isValid = Object.keys(errors).length === 0;

      setValidationState({
        isValid,
        errors,
        warnings,
        validating: false,
      });

      addBreadcrumb(`Customer validation completed: ${isValid ? 'valid' : 'invalid'}`, 'validation');
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      reportError(
        error instanceof Error ? error : new Error(errorMessage),
        'CUSTOMER_VALIDATION',
        { customerId: customer.id }
      );

      setValidationState(prev => ({
        ...prev,
        validating: false,
        errors: { ...prev.errors, general: ['Błąd podczas walidacji danych'] },
      }));

      return false;
    }
  }, [validateNIP, validateREGON, validateKRS, validateAddress, validateFinancial, addBreadcrumb, reportError]);

  /**
   * Validate individual field
   */
  const validateField = useCallback((fieldName: keyof Customer, value: any): ValidationResult => {
    try {
      switch (fieldName) {
        case 'nip':
          return validateNIP ? polishBusinessValidationService.validateNIP(value) : { isValid: true, errors: [], warnings: [] };
        
        case 'regon':
          return validateREGON ? polishBusinessValidationService.validateREGON(value) : { isValid: true, errors: [], warnings: [] };
        
        case 'krs':
          return validateKRS ? polishBusinessValidationService.validateKRS(value) : { isValid: true, errors: [], warnings: [] };
        
        case 'email':
          return {
            isValid: !value || isValidEmail(value),
            errors: !value || isValidEmail(value) ? [] : ['Nieprawidłowy format adresu email'],
            warnings: [],
          };
        
        case 'phone':
          return {
            isValid: !value || isValidPolishPhone(value),
            errors: [],
            warnings: !value || isValidPolishPhone(value) ? [] : ['Numer telefonu może być nieprawidłowy'],
          };
        
        default:
          return { isValid: true, errors: [], warnings: [] };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Błąd podczas walidacji pola'],
        warnings: [],
      };
    }
  }, [validateNIP, validateREGON, validateKRS]);

  /**
   * Clear all validation state
   */
  const clearValidation = useCallback((): void => {
    setValidationState({
      isValid: true,
      errors: {},
      warnings: {},
      validating: false,
    });
  }, []);

  /**
   * Get errors for specific field
   */
  const getFieldErrors = useCallback((fieldName: keyof Customer): string[] => {
    return validationState.errors[fieldName as string] || [];
  }, [validationState.errors]);

  /**
   * Get warnings for specific field
   */
  const getFieldWarnings = useCallback((fieldName: keyof Customer): string[] => {
    return validationState.warnings[fieldName as string] || [];
  }, [validationState.warnings]);

  /**
   * Check if specific field is valid
   */
  const isFieldValid = useCallback((fieldName: keyof Customer): boolean => {
    return !validationState.errors[fieldName as string] || validationState.errors[fieldName as string].length === 0;
  }, [validationState.errors]);

  /**
   * Calculate customer health score based on data completeness and quality
   */
  const calculateHealthScore = useCallback((customer: Partial<Customer>): number => {
    let score = 0;
    let maxScore = 0;

    // Basic information (30 points)
    maxScore += 30;
    if (customer.name) score += 10;
    if (customer.email) score += 10;
    if (customer.phone) score += 10;

    // Business information (25 points)
    maxScore += 25;
    if (customer.nip) score += 10;
    if (customer.regon) score += 10;
    if (customer.address) score += 5;

    // Financial information (20 points)
    maxScore += 20;
    if (customer.totalValue && customer.totalValue > 0) score += 10;
    if (customer.paymentTerms && customer.paymentTerms > 0) score += 5;
    if (customer.creditLimit && customer.creditLimit > 0) score += 5;

    // Relationship information (15 points)
    maxScore += 15;
    if (customer.satisfactionScore && customer.satisfactionScore > 0) score += 10;
    if (customer.lastContactDate) score += 5;

    // HVAC specific (10 points)
    maxScore += 10;
    if (customer.hvacSystemCount && customer.hvacSystemCount > 0) score += 5;
    if (customer.maintenanceContract) score += 5;

    return Math.round((score / maxScore) * 100);
  }, []);

  /**
   * Suggest improvements for customer data
   */
  const suggestImprovements = useCallback((customer: Partial<Customer>): string[] => {
    const suggestions: string[] = [];

    if (!customer.email) {
      suggestions.push('Dodaj adres email dla lepszej komunikacji');
    }

    if (!customer.phone) {
      suggestions.push('Dodaj numer telefonu kontaktowego');
    }

    if (!customer.nip && customer.customerType === CustomerType.COMPANY) {
      suggestions.push('Dodaj NIP dla firm');
    }

    if (!customer.address) {
      suggestions.push('Uzupełnij adres klienta');
    }

    if (!customer.satisfactionScore || customer.satisfactionScore === 0) {
      suggestions.push('Przeprowadź ankietę satysfakcji klienta');
    }

    if (!customer.lastContactDate) {
      suggestions.push('Zaplanuj kontakt z klientem');
    }

    if (!customer.hvacSystemCount) {
      suggestions.push('Zinwentaryzuj systemy HVAC klienta');
    }

    if (!customer.maintenanceContract) {
      suggestions.push('Zaproponuj kontrakt serwisowy');
    }

    return suggestions;
  }, []);

  return {
    ...validationState,
    validateCustomer,
    validateField,
    clearValidation,
    getFieldErrors,
    getFieldWarnings,
    isFieldValid,
    calculateHealthScore,
    suggestImprovements,
  };
};

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPolishPhone(phone: string): boolean {
  // Polish phone number patterns
  const phoneRegex = /^(\+48\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{2}\s?\d{3}\s?\d{2}\s?\d{2})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validateCustomerAddress(address: any): string[] {
  const errors: string[] = [];

  if (!address.street) {
    errors.push('Ulica jest wymagana');
  }

  if (!address.city) {
    errors.push('Miasto jest wymagane');
  }

  if (!address.postalCode) {
    errors.push('Kod pocztowy jest wymagany');
  } else {
    const postalValidation = polishBusinessValidationService.validatePostalCode(address.postalCode);
    if (!postalValidation.isValid) {
      errors.push(...postalValidation.errors);
    }
  }

  return errors;
}

function validateFinancialData(customer: Partial<Customer>): string[] {
  const errors: string[] = [];

  if (customer.totalValue && customer.totalValue < 0) {
    errors.push('Wartość całkowita nie może być ujemna');
  }

  if (customer.lifetimeValue && customer.lifetimeValue < 0) {
    errors.push('Wartość życiowa nie może być ujemna');
  }

  if (customer.creditLimit && customer.creditLimit < 0) {
    errors.push('Limit kredytowy nie może być ujemny');
  }

  if (customer.paymentTerms && (customer.paymentTerms < 0 || customer.paymentTerms > 365)) {
    errors.push('Termin płatności musi być między 0 a 365 dni');
  }

  return errors;
}

function validateBusinessLogic(customer: Partial<Customer>): string[] {
  const errors: string[] = [];

  // Company must have NIP
  if (customer.customerType === CustomerType.COMPANY && !customer.nip) {
    errors.push('Firmy muszą mieć podany NIP');
  }

  // VIP customers should have higher values
  if (customer.status === CustomerStatus.VIP && customer.totalValue && customer.totalValue < 10000) {
    errors.push('Klienci VIP powinni mieć wartość powyżej 10,000 PLN');
  }

  // Suspended customers shouldn't have active contracts
  if (customer.status === CustomerStatus.SUSPENDED && customer.maintenanceContract) {
    errors.push('Zawieszeni klienci nie mogą mieć aktywnych kontraktów');
  }

  return errors;
}
