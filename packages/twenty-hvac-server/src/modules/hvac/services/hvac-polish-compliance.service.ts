import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HvacCacheManagerService } from './hvac-cache-manager.service';
import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';

export type NIPValidationResult = {
  isValid: boolean;
  nip: string;
  formatted: string;
  companyName?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
  vatPayer?: boolean;
  error?: string;
};

export type REGONValidationResult = {
  isValid: boolean;
  regon: string;
  formatted: string;
  companyName?: string;
  address?: string;
  pkd?: string[];
  employeeCount?: string;
  error?: string;
};

export type PolishEnergyProvider = {
  name: string;
  code: string;
  apiEndpoint: string;
  regions: string[];
  services: string[];
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
};

export type ComplianceCheckResult = {
  nip?: NIPValidationResult;
  regon?: REGONValidationResult;
  energyProvider?: PolishEnergyProvider;
  hvacCertifications?: string[];
  complianceScore: number;
  recommendations: string[];
};

@Injectable()
export class HvacPolishComplianceService {
  private readonly logger = new Logger(HvacPolishComplianceService.name);
  private readonly energyProviders: PolishEnergyProvider[];

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: HvacCacheManagerService,
    private readonly sentryService: HvacSentryService,
  ) {
    this.energyProviders = this.initializeEnergyProviders();
  }

  /**
   * Validate Polish NIP (Tax Identification Number)
   */
  async validateNIP(nip: string): Promise<NIPValidationResult> {
    try {
      const cleanNip = this.cleanNIP(nip);
      
      if (!this.isValidNIPFormat(cleanNip)) {
        return {
          isValid: false,
          nip: cleanNip,
          formatted: this.formatNIP(cleanNip),
          error: 'Invalid NIP format',
        };
      }

      // Check cache first
      const cacheKey = `nip_validation_${cleanNip}`;
      const cached = await this.cacheService.get<NIPValidationResult>(cacheKey);
      if (cached) {
        return cached;
      }

      // Validate with external API (if available)
      const result = await this.validateNIPWithAPI(cleanNip);
      
      // Cache result for 24 hours
      await this.cacheService.set(cacheKey, result, { ttl: 86400 });
      
      return result;

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { nip, action: 'validate_nip' },
      );

      return {
        isValid: false,
        nip,
        formatted: this.formatNIP(nip),
        error: error.message,
      };
    }
  }

  /**
   * Validate Polish REGON (Business Registry Number)
   */
  async validateREGON(regon: string): Promise<REGONValidationResult> {
    try {
      const cleanRegon = this.cleanREGON(regon);
      
      if (!this.isValidREGONFormat(cleanRegon)) {
        return {
          isValid: false,
          regon: cleanRegon,
          formatted: this.formatREGON(cleanRegon),
          error: 'Invalid REGON format',
        };
      }

      // Check cache first
      const cacheKey = `regon_validation_${cleanRegon}`;
      const cached = await this.cacheService.get<REGONValidationResult>(cacheKey);
      if (cached) {
        return cached;
      }

      // Validate with external API (if available)
      const result = await this.validateREGONWithAPI(cleanRegon);
      
      // Cache result for 24 hours
      await this.cacheService.set(cacheKey, result, { ttl: 86400 });
      
      return result;

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { regon, action: 'validate_regon' },
      );

      return {
        isValid: false,
        regon,
        formatted: this.formatREGON(regon),
        error: error.message,
      };
    }
  }

  /**
   * Get Polish energy provider by region or name
   */
  getEnergyProvider(query: string): PolishEnergyProvider | undefined {
    const lowerQuery = query.toLowerCase();
    
    return this.energyProviders.find(provider => 
      provider.name.toLowerCase().includes(lowerQuery) ||
      provider.code.toLowerCase() === lowerQuery ||
      provider.regions.some(region => region.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get all energy providers
   */
  getAllEnergyProviders(): PolishEnergyProvider[] {
    return this.energyProviders;
  }

  /**
   * Perform comprehensive compliance check
   */
  async performComplianceCheck(
    companyData: {
      nip?: string;
      regon?: string;
      region?: string;
      hvacLicenses?: string[];
    },
  ): Promise<ComplianceCheckResult> {
    try {
      const result: ComplianceCheckResult = {
        complianceScore: 0,
        recommendations: [],
      };

      // Validate NIP
      if (companyData.nip) {
        result.nip = await this.validateNIP(companyData.nip);
        if (result.nip.isValid) {
          result.complianceScore += 30;
        } else {
          result.recommendations.push('Sprawdź poprawność numeru NIP');
        }
      } else {
        result.recommendations.push('Dodaj numer NIP firmy');
      }

      // Validate REGON
      if (companyData.regon) {
        result.regon = await this.validateREGON(companyData.regon);
        if (result.regon.isValid) {
          result.complianceScore += 20;
        } else {
          result.recommendations.push('Sprawdź poprawność numeru REGON');
        }
      } else {
        result.recommendations.push('Dodaj numer REGON firmy');
      }

      // Check energy provider
      if (companyData.region) {
        result.energyProvider = this.getEnergyProvider(companyData.region);
        if (result.energyProvider) {
          result.complianceScore += 15;
        } else {
          result.recommendations.push('Określ dostawcę energii dla regionu');
        }
      }

      // Check HVAC certifications
      if (companyData.hvacLicenses && companyData.hvacLicenses.length > 0) {
        result.hvacCertifications = companyData.hvacLicenses;
        result.complianceScore += 25;
      } else {
        result.recommendations.push('Dodaj certyfikaty HVAC (F-gazy, UDT, itp.)');
      }

      // Additional compliance checks
      if (result.complianceScore >= 90) {
        result.recommendations.push('Doskonała zgodność z polskimi przepisami!');
      } else if (result.complianceScore >= 70) {
        result.recommendations.push('Dobra zgodność, rozważ uzupełnienie brakujących danych');
      } else {
        result.recommendations.push('Wymagane uzupełnienie danych dla pełnej zgodności');
      }

      return result;

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { companyData, action: 'compliance_check' },
      );

      throw error;
    }
  }

  /**
   * Initialize Polish energy providers
   */
  private initializeEnergyProviders(): PolishEnergyProvider[] {
    return [
      {
        name: 'PGE Polska Grupa Energetyczna',
        code: 'PGE',
        apiEndpoint: 'https://api.pge.pl/v1',
        regions: ['mazowieckie', 'lubelskie', 'podlaskie', 'warmińsko-mazurskie'],
        services: ['electricity', 'gas', 'renewable'],
        contactInfo: {
          phone: '+48 801 900 900',
          email: 'kontakt@pge.pl',
          website: 'https://www.pge.pl',
        },
      },
      {
        name: 'Tauron Polska Energia',
        code: 'TAURON',
        apiEndpoint: 'https://api.tauron.pl/v1',
        regions: ['śląskie', 'małopolskie', 'opolskie'],
        services: ['electricity', 'gas', 'heat'],
        contactInfo: {
          phone: '+48 801 400 400',
          email: 'kontakt@tauron.pl',
          website: 'https://www.tauron.pl',
        },
      },
      {
        name: 'Enea',
        code: 'ENEA',
        apiEndpoint: 'https://api.enea.pl/v1',
        regions: ['wielkopolskie', 'zachodniopomorskie', 'lubuskie'],
        services: ['electricity', 'renewable'],
        contactInfo: {
          phone: '+48 801 404 404',
          email: 'kontakt@enea.pl',
          website: 'https://www.enea.pl',
        },
      },
      {
        name: 'Energa',
        code: 'ENERGA',
        apiEndpoint: 'https://api.energa.pl/v1',
        regions: ['pomorskie', 'kujawsko-pomorskie', 'warmińsko-mazurskie'],
        services: ['electricity', 'gas'],
        contactInfo: {
          phone: '+48 801 404 200',
          email: 'kontakt@energa.pl',
          website: 'https://www.energa.pl',
        },
      },
    ];
  }

  /**
   * Clean NIP number (remove spaces, dashes, etc.)
   */
  private cleanNIP(nip: string): string {
    return nip.replace(/[^0-9]/g, '');
  }

  /**
   * Clean REGON number
   */
  private cleanREGON(regon: string): string {
    return regon.replace(/[^0-9]/g, '');
  }

  /**
   * Validate NIP format
   */
  private isValidNIPFormat(nip: string): boolean {
    if (nip.length !== 10) return false;
    
    // NIP checksum validation
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(nip[i]) * weights[i];
    }
    
    const checksum = sum % 11;
    return checksum === parseInt(nip[9]);
  }

  /**
   * Validate REGON format
   */
  private isValidREGONFormat(regon: string): boolean {
    if (regon.length !== 9 && regon.length !== 14) return false;
    
    // REGON checksum validation (simplified)
    const weights = regon.length === 9 
      ? [8, 9, 2, 3, 4, 5, 6, 7]
      : [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];
    
    let sum = 0;
    const digits = regon.slice(0, -1);
    
    for (let i = 0; i < digits.length; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    
    const checksum = sum % 11;
    const expectedChecksum = checksum === 10 ? 0 : checksum;
    
    return expectedChecksum === parseInt(regon[regon.length - 1]);
  }

  /**
   * Format NIP for display
   */
  private formatNIP(nip: string): string {
    const clean = this.cleanNIP(nip);
    if (clean.length === 10) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8)}`;
    }
    return clean;
  }

  /**
   * Format REGON for display
   */
  private formatREGON(regon: string): string {
    const clean = this.cleanREGON(regon);
    if (clean.length === 9) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    } else if (clean.length === 14) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8)}`;
    }
    return clean;
  }

  /**
   * Validate NIP with external API
   */
  private async validateNIPWithAPI(nip: string): Promise<NIPValidationResult> {
    try {
      // In production, this would call the actual Polish tax office API
      // For now, return basic validation
      const isValid = this.isValidNIPFormat(nip);
      
      return {
        isValid,
        nip,
        formatted: this.formatNIP(nip),
        companyName: isValid ? 'Przykładowa Firma Sp. z o.o.' : undefined,
        address: isValid ? 'ul. Przykładowa 1, 00-001 Warszawa' : undefined,
        status: isValid ? 'active' : undefined,
        vatPayer: isValid,
      };

    } catch (error) {
      this.logger.error('Error validating NIP with API:', error);
      throw error;
    }
  }

  /**
   * Validate REGON with external API
   */
  private async validateREGONWithAPI(regon: string): Promise<REGONValidationResult> {
    try {
      // In production, this would call the actual GUS (Central Statistical Office) API
      // For now, return basic validation
      const isValid = this.isValidREGONFormat(regon);
      
      return {
        isValid,
        regon,
        formatted: this.formatREGON(regon),
        companyName: isValid ? 'Przykładowa Firma Sp. z o.o.' : undefined,
        address: isValid ? 'ul. Przykładowa 1, 00-001 Warszawa' : undefined,
        pkd: isValid ? ['43.22.Z', '43.21.Z'] : undefined,
        employeeCount: isValid ? '10-49' : undefined,
      };

    } catch (error) {
      this.logger.error('Error validating REGON with API:', error);
      throw error;
    }
  }
}
