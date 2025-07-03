/**
 * HVAC Customer Validation Hooks
 * "Pasja rodzi profesjonalizm" - Professional customer validation for Polish market
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Polish business compliance validation
 */

import { useCallback, useState } from 'react';
import type { 
  NIPValidationResult, 
  REGONValidationResult, 
  PolishAddress 
} from '../types/hvac-polish-compliance.types';

// Validation options
export interface CustomerValidationOptions {
  validateNIP?: boolean;
  validateREGON?: boolean;
  validateAddress?: boolean;
  validateEmail?: boolean;
  validatePhone?: boolean;
  realTimeValidation?: boolean;
  strictMode?: boolean;
}

// Field validation result
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
}

// Customer health score
export interface CustomerHealthScore {
  overall: number; // 0-100
  dataCompleteness: number;
  dataAccuracy: number;
  complianceScore: number;
  riskScore: number;
  suggestions: string[];
}

// Validation context
export interface ValidationContext {
  field: string;
  value: string;
  customerType: 'individual' | 'business';
  country: string;
}

/**
 * Main customer validation hook
 */
export const useCustomerValidation = (options: CustomerValidationOptions = {}) => {
  const {
    validateNIP = true,
    validateREGON = true,
    validateAddress = true,
    validateEmail = true,
    validatePhone = true,
    realTimeValidation = false,
    strictMode = false,
  } = options;

  const [validationCache, setValidationCache] = useState<Map<string, FieldValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate NIP (Polish tax number)
   */
  const validateNIPField = useCallback(async (nip: string): Promise<FieldValidationResult> => {
    if (!validateNIP) return { isValid: true };

    // Remove spaces and dashes
    const cleanNIP = nip.replace(/[\s-]/g, '');

    // Basic format validation
    if (!/^\d{10}$/.test(cleanNIP)) {
      return {
        isValid: false,
        error: 'NIP musi składać się z 10 cyfr',
        suggestion: 'Format: XXXXXXXXXX lub XXX-XXX-XX-XX',
      };
    }

    // Checksum validation
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const digits = cleanNIP.split('').map(Number);
    const checksum = digits.slice(0, 9).reduce((sum, digit, index) => sum + digit * weights[index], 0) % 11;

    if (checksum !== digits[9]) {
      return {
        isValid: false,
        error: 'Nieprawidłowa suma kontrolna NIP',
        suggestion: 'Sprawdź poprawność wprowadzonego numeru',
      };
    }

    // In real implementation, would call external API for verification
    return {
      isValid: true,
      suggestion: 'NIP jest poprawny',
    };
  }, [validateNIP]);

  /**
   * Validate REGON (Polish business registry number)
   */
  const validateREGONField = useCallback(async (regon: string): Promise<FieldValidationResult> => {
    if (!validateREGON) return { isValid: true };

    const cleanREGON = regon.replace(/[\s-]/g, '');

    // REGON can be 9 or 14 digits
    if (!/^\d{9}$|^\d{14}$/.test(cleanREGON)) {
      return {
        isValid: false,
        error: 'REGON musi składać się z 9 lub 14 cyfr',
        suggestion: 'Format: XXXXXXXXX lub XXXXXXXXXXXXXX',
      };
    }

    // Basic checksum validation for 9-digit REGON
    if (cleanREGON.length === 9) {
      const weights = [8, 9, 2, 3, 4, 5, 6, 7];
      const digits = cleanREGON.split('').map(Number);
      const checksum = digits.slice(0, 8).reduce((sum, digit, index) => sum + digit * weights[index], 0) % 11;
      const expectedChecksum = checksum === 10 ? 0 : checksum;

      if (expectedChecksum !== digits[8]) {
        return {
          isValid: false,
          error: 'Nieprawidłowa suma kontrolna REGON',
          suggestion: 'Sprawdź poprawność wprowadzonego numeru',
        };
      }
    }

    return {
      isValid: true,
      suggestion: 'REGON jest poprawny',
    };
  }, [validateREGON]);

  /**
   * Validate Polish address
   */
  const validateAddressField = useCallback(async (address: Partial<PolishAddress>): Promise<FieldValidationResult> => {
    if (!validateAddress) return { isValid: true };

    const errors: string[] = [];
    const warnings: string[] = [];

    // Postal code validation
    if (address.postalCode && !/^\d{2}-\d{3}$/.test(address.postalCode)) {
      errors.push('Kod pocztowy musi być w formacie XX-XXX');
    }

    // City validation
    if (address.city && address.city.length < 2) {
      errors.push('Nazwa miasta musi mieć co najmniej 2 znaki');
    }

    // Street validation
    if (address.street && address.street.length < 3) {
      warnings.push('Nazwa ulicy wydaje się niepełna');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(', '),
        warning: warnings.length > 0 ? warnings.join(', ') : undefined,
      };
    }

    return {
      isValid: true,
      warning: warnings.length > 0 ? warnings.join(', ') : undefined,
      suggestion: 'Adres jest poprawny',
    };
  }, [validateAddress]);

  /**
   * Validate email address
   */
  const validateEmailField = useCallback(async (email: string): Promise<FieldValidationResult> => {
    if (!validateEmail) return { isValid: true };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Nieprawidłowy format adresu email',
        suggestion: 'Format: nazwa@domena.pl',
      };
    }

    // Check for common Polish domains
    const polishDomains = ['.pl', '.com.pl', '.org.pl', '.net.pl'];
    const hasPolishDomain = polishDomains.some(domain => email.toLowerCase().includes(domain));

    return {
      isValid: true,
      suggestion: hasPolishDomain ? 'Email z polską domeną' : 'Email z zagraniczną domeną',
    };
  }, [validateEmail]);

  /**
   * Validate Polish phone number
   */
  const validatePhoneField = useCallback(async (phone: string): Promise<FieldValidationResult> => {
    if (!validatePhone) return { isValid: true };

    // Remove spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Polish phone number patterns
    const patterns = [
      /^\+48\d{9}$/, // +48XXXXXXXXX
      /^48\d{9}$/, // 48XXXXXXXXX
      /^\d{9}$/, // XXXXXXXXX
    ];

    const isValid = patterns.some(pattern => pattern.test(cleanPhone));

    if (!isValid) {
      return {
        isValid: false,
        error: 'Nieprawidłowy format numeru telefonu',
        suggestion: 'Format: +48 XXX XXX XXX lub XXX XXX XXX',
      };
    }

    return {
      isValid: true,
      suggestion: 'Numer telefonu jest poprawny',
    };
  }, [validatePhone]);

  /**
   * Generic field validation
   */
  const validateField = useCallback(async (
    fieldName: string,
    value: string,
    context?: Partial<ValidationContext>
  ): Promise<FieldValidationResult> => {
    const cacheKey = `${fieldName}:${value}`;
    
    // Check cache first
    if (validationCache.has(cacheKey)) {
      return validationCache.get(cacheKey)!;
    }

    setIsValidating(true);

    let result: FieldValidationResult;

    try {
      switch (fieldName.toLowerCase()) {
        case 'nip':
          result = await validateNIPField(value);
          break;
        case 'regon':
          result = await validateREGONField(value);
          break;
        case 'email':
          result = await validateEmailField(value);
          break;
        case 'phone':
          result = await validatePhoneField(value);
          break;
        default:
          result = { isValid: true };
      }

      // Cache the result
      setValidationCache(prev => new Map(prev).set(cacheKey, result));
    } catch (error) {
      result = {
        isValid: false,
        error: 'Błąd podczas walidacji',
      };
    } finally {
      setIsValidating(false);
    }

    return result;
  }, [validateNIPField, validateREGONField, validateEmailField, validatePhoneField, validationCache]);

  /**
   * Calculate customer health score
   */
  const calculateHealthScore = useCallback((customerData: Record<string, unknown>): CustomerHealthScore => {
    const fields = ['name', 'email', 'phone', 'nip', 'regon', 'address'];
    const completedFields = fields.filter(field => customerData[field]);
    const dataCompleteness = (completedFields.length / fields.length) * 100;

    // Mock calculation - in real implementation would be more sophisticated
    const dataAccuracy = 85; // Based on validation results
    const complianceScore = customerData.nip && customerData.regon ? 100 : 60;
    const riskScore = dataCompleteness > 80 ? 10 : 30;

    const overall = (dataCompleteness + dataAccuracy + complianceScore - riskScore) / 3;

    const suggestions: string[] = [];
    if (dataCompleteness < 80) suggestions.push('Uzupełnij brakujące dane klienta');
    if (!customerData.nip) suggestions.push('Dodaj numer NIP dla firm');
    if (!customerData.email) suggestions.push('Dodaj adres email');

    return {
      overall: Math.round(overall),
      dataCompleteness: Math.round(dataCompleteness),
      dataAccuracy: Math.round(dataAccuracy),
      complianceScore: Math.round(complianceScore),
      riskScore: Math.round(riskScore),
      suggestions,
    };
  }, []);

  /**
   * Suggest improvements for customer data
   */
  const suggestImprovements = useCallback((customerData: Record<string, unknown>): string[] => {
    const suggestions: string[] = [];

    if (!customerData.nip && customerData.regon) {
      suggestions.push('Dodaj numer NIP dla pełnej identyfikacji firmy');
    }

    if (!customerData.email) {
      suggestions.push('Dodaj adres email dla lepszej komunikacji');
    }

    if (!customerData.phone) {
      suggestions.push('Dodaj numer telefonu kontaktowego');
    }

    if (!customerData.address) {
      suggestions.push('Uzupełnij adres dla usług serwisowych');
    }

    return suggestions;
  }, []);

  return {
    validateField,
    validateNIPField,
    validateREGONField,
    validateAddressField,
    validateEmailField,
    validatePhoneField,
    calculateHealthScore,
    suggestImprovements,
    isValidating,
    clearCache: () => setValidationCache(new Map()),
  };
};
