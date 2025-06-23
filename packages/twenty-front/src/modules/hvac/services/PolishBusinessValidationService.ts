/**
 * Polish Business Validation Service
 * "Pasja rodzi profesjonalizm" - Professional Polish business compliance
 * 
 * Handles validation of Polish business identifiers (NIP, REGON, KRS),
 * VAT calculations, and regulatory compliance for HVAC CRM system.
 */

import { trackHVACUserAction } from '../index';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedValue?: string;
  additionalInfo?: Record<string, any>;
}

export interface NIPValidationResult extends ValidationResult {
  nipType?: 'individual' | 'company';
  vatExempt?: boolean;
}

export interface REGONValidationResult extends ValidationResult {
  regonType?: '9-digit' | '14-digit';
  entityType?: 'individual' | 'company' | 'local_unit';
}

export interface VATCalculation {
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  vatCategory: VATCategory;
}

export enum VATCategory {
  STANDARD = 'standard', // 23%
  REDUCED_FIRST = 'reduced_first', // 8%
  REDUCED_SECOND = 'reduced_second', // 5%
  ZERO = 'zero', // 0%
  EXEMPT = 'exempt', // VAT exempt
}

export class PolishBusinessValidationService {
  private readonly VAT_RATES = {
    [VATCategory.STANDARD]: 0.23,
    [VATCategory.REDUCED_FIRST]: 0.08,
    [VATCategory.REDUCED_SECOND]: 0.05,
    [VATCategory.ZERO]: 0.00,
    [VATCategory.EXEMPT]: 0.00,
  };

  /**
   * Validate Polish NIP (Numer Identyfikacji Podatkowej)
   */
  validateNIP(nip: string): NIPValidationResult {
    try {
      trackHVACUserAction('nip_validation_attempt', 'VALIDATION', { nip: nip.substring(0, 3) + '***' });

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!nip) {
        errors.push('NIP jest wymagany');
        return { isValid: false, errors, warnings };
      }

      // Remove all non-digit characters
      const cleanNIP = nip.replace(/\D/g, '');

      // Check length
      if (cleanNIP.length !== 10) {
        errors.push('NIP musi składać się z 10 cyfr');
        return { isValid: false, errors, warnings };
      }

      // Validate checksum using official algorithm
      const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
      let sum = 0;

      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanNIP[i]) * weights[i];
      }

      const checksum = sum % 11;
      const lastDigit = parseInt(cleanNIP[9]);

      if (checksum === 10) {
        errors.push('NIP zawiera nieprawidłową sumę kontrolną');
        return { isValid: false, errors, warnings };
      }

      if (checksum !== lastDigit) {
        errors.push('NIP zawiera nieprawidłową sumę kontrolną');
        return { isValid: false, errors, warnings };
      }

      // Determine NIP type based on first digits
      const firstThree = cleanNIP.substring(0, 3);
      let nipType: 'individual' | 'company' = 'company';

      // Individual taxpayers typically start with specific prefixes
      const individualPrefixes = ['123', '124', '125', '126', '127', '128', '129'];
      if (individualPrefixes.includes(firstThree)) {
        nipType = 'individual';
      }

      const normalizedValue = this.formatNIP(cleanNIP);

      trackHVACUserAction('nip_validation_success', 'VALIDATION', { nipType });

      return {
        isValid: true,
        errors,
        warnings,
        normalizedValue,
        nipType,
        additionalInfo: { nipType, formatted: normalizedValue },
      };
    } catch (error) {
      trackHVACUserAction('nip_validation_error', 'VALIDATION', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        isValid: false,
        errors: ['Błąd podczas walidacji NIP'],
        warnings: [],
      };
    }
  }

  /**
   * Validate Polish REGON (Rejestr Gospodarki Narodowej)
   */
  validateREGON(regon: string): REGONValidationResult {
    try {
      trackHVACUserAction('regon_validation_attempt', 'VALIDATION', { 
        regon: regon.substring(0, 3) + '***' 
      });

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!regon) {
        errors.push('REGON jest wymagany');
        return { isValid: false, errors, warnings };
      }

      // Remove all non-digit characters
      const cleanREGON = regon.replace(/\D/g, '');

      // Check length (9 or 14 digits)
      if (cleanREGON.length !== 9 && cleanREGON.length !== 14) {
        errors.push('REGON musi składać się z 9 lub 14 cyfr');
        return { isValid: false, errors, warnings };
      }

      const regonType = cleanREGON.length === 9 ? '9-digit' : '14-digit';

      // Validate 9-digit REGON
      if (cleanREGON.length === 9) {
        const weights = [8, 9, 2, 3, 4, 5, 6, 7];
        let sum = 0;

        for (let i = 0; i < 8; i++) {
          sum += parseInt(cleanREGON[i]) * weights[i];
        }

        const checksum = sum % 11;
        const lastDigit = parseInt(cleanREGON[8]);

        if (checksum === 10 || checksum !== lastDigit) {
          errors.push('REGON zawiera nieprawidłową sumę kontrolną');
          return { isValid: false, errors, warnings };
        }
      }

      // Validate 14-digit REGON
      if (cleanREGON.length === 14) {
        // First validate the 9-digit part
        const nineDigitPart = cleanREGON.substring(0, 9);
        const nineDigitValidation = this.validateREGON(nineDigitPart);
        
        if (!nineDigitValidation.isValid) {
          return nineDigitValidation;
        }

        // Then validate the full 14-digit checksum
        const weights = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];
        let sum = 0;

        for (let i = 0; i < 13; i++) {
          sum += parseInt(cleanREGON[i]) * weights[i];
        }

        const checksum = sum % 11;
        const lastDigit = parseInt(cleanREGON[13]);

        if (checksum === 10 || checksum !== lastDigit) {
          errors.push('REGON zawiera nieprawidłową sumę kontrolną');
          return { isValid: false, errors, warnings };
        }
      }

      const normalizedValue = this.formatREGON(cleanREGON);
      const entityType = this.determineEntityType(cleanREGON);

      trackHVACUserAction('regon_validation_success', 'VALIDATION', { regonType, entityType });

      return {
        isValid: true,
        errors,
        warnings,
        normalizedValue,
        regonType,
        entityType,
        additionalInfo: { regonType, entityType, formatted: normalizedValue },
      };
    } catch (error) {
      trackHVACUserAction('regon_validation_error', 'VALIDATION', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        isValid: false,
        errors: ['Błąd podczas walidacji REGON'],
        warnings: [],
      };
    }
  }

  /**
   * Validate Polish KRS (Krajowy Rejestr Sądowy)
   */
  validateKRS(krs: string): ValidationResult {
    try {
      trackHVACUserAction('krs_validation_attempt', 'VALIDATION', { 
        krs: krs.substring(0, 3) + '***' 
      });

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!krs) {
        errors.push('KRS jest wymagany');
        return { isValid: false, errors, warnings };
      }

      // Remove all non-digit characters
      const cleanKRS = krs.replace(/\D/g, '');

      // Check length (10 digits)
      if (cleanKRS.length !== 10) {
        errors.push('KRS musi składać się z 10 cyfr');
        return { isValid: false, errors, warnings };
      }

      // KRS numbers should not start with 0
      if (cleanKRS[0] === '0') {
        errors.push('KRS nie może zaczynać się od 0');
        return { isValid: false, errors, warnings };
      }

      const normalizedValue = this.formatKRS(cleanKRS);

      trackHVACUserAction('krs_validation_success', 'VALIDATION', {});

      return {
        isValid: true,
        errors,
        warnings,
        normalizedValue,
        additionalInfo: { formatted: normalizedValue },
      };
    } catch (error) {
      trackHVACUserAction('krs_validation_error', 'VALIDATION', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        isValid: false,
        errors: ['Błąd podczas walidacji KRS'],
        warnings: [],
      };
    }
  }

  /**
   * Calculate VAT for given amount and category
   */
  calculateVAT(netAmount: number, category: VATCategory): VATCalculation {
    const vatRate = this.VAT_RATES[category];
    const vatAmount = netAmount * vatRate;
    const grossAmount = netAmount + vatAmount;

    return {
      netAmount,
      vatRate,
      vatAmount: Math.round(vatAmount * 100) / 100, // Round to 2 decimal places
      grossAmount: Math.round(grossAmount * 100) / 100,
      vatCategory: category,
    };
  }

  /**
   * Get VAT category for HVAC services
   */
  getHVACServiceVATCategory(serviceType: string): VATCategory {
    // Most HVAC services in Poland are subject to standard VAT rate
    const reducedRateServices = [
      'maintenance', // Some maintenance services may qualify for reduced rate
      'repair_residential', // Residential repairs may qualify for reduced rate
    ];

    if (reducedRateServices.includes(serviceType)) {
      return VATCategory.REDUCED_FIRST; // 8%
    }

    return VATCategory.STANDARD; // 23%
  }

  /**
   * Validate Polish postal code
   */
  validatePostalCode(postalCode: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!postalCode) {
      errors.push('Kod pocztowy jest wymagany');
      return { isValid: false, errors, warnings };
    }

    // Polish postal code format: XX-XXX
    const postalCodeRegex = /^\d{2}-\d{3}$/;
    
    if (!postalCodeRegex.test(postalCode)) {
      errors.push('Kod pocztowy musi być w formacie XX-XXX');
      return { isValid: false, errors, warnings };
    }

    return {
      isValid: true,
      errors,
      warnings,
      normalizedValue: postalCode,
    };
  }

  // Private helper methods
  private formatNIP(nip: string): string {
    // Format as XXX-XXX-XX-XX
    return `${nip.substring(0, 3)}-${nip.substring(3, 6)}-${nip.substring(6, 8)}-${nip.substring(8, 10)}`;
  }

  private formatREGON(regon: string): string {
    if (regon.length === 9) {
      // Format as XXX-XXX-XXX
      return `${regon.substring(0, 3)}-${regon.substring(3, 6)}-${regon.substring(6, 9)}`;
    } else {
      // Format as XX-XXX-XXX-XX-XXX
      return `${regon.substring(0, 2)}-${regon.substring(2, 5)}-${regon.substring(5, 8)}-${regon.substring(8, 10)}-${regon.substring(10, 14)}`;
    }
  }

  private formatKRS(krs: string): string {
    // Format as XXXXXXXXXX (no special formatting for KRS)
    return krs;
  }

  private determineEntityType(regon: string): 'individual' | 'company' | 'local_unit' {
    if (regon.length === 9) {
      return 'company';
    } else {
      return 'local_unit';
    }
  }
}

// Export singleton instance
export const polishBusinessValidationService = new PolishBusinessValidationService();
