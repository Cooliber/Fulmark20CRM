/**
 * HVAC Polish Business Compliance Types
 * "Pasja rodzi profesjonalizm" - Professional Polish market compliance
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Comprehensive Polish business compliance
 */

// Polish business identification numbers
export interface PolishBusinessNumbers {
  nip?: string; // Numer Identyfikacji Podatkowej (10 digits)
  regon?: string; // Rejestr Gospodarki Narodowej (9 or 14 digits)
  krs?: string; // Krajowy Rejestr Sądowy
  pesel?: string; // For individual entrepreneurs
}

// NIP validation result
export interface NIPValidationResult {
  isValid: boolean;
  nip: string;
  formatted: string; // with dashes: XXX-XXX-XX-XX
  companyName?: string;
  address?: PolishAddress;
  status: 'active' | 'inactive' | 'suspended' | 'unknown';
  vatPayer: boolean;
  error?: string;
  lastChecked: Date;
}

// REGON validation result
export interface REGONValidationResult {
  isValid: boolean;
  regon: string;
  formatted: string;
  companyName?: string;
  address?: PolishAddress;
  pkd?: string[]; // PKD codes (business activity codes)
  employeeCount?: number;
  legalForm?: string;
  error?: string;
  lastChecked: Date;
}

// Polish address structure
export interface PolishAddress {
  street: string;
  houseNumber: string;
  apartmentNumber?: string;
  postalCode: string; // XX-XXX format
  city: string;
  commune?: string;
  district?: string;
  voivodeship: string; // województwo
  country: 'Polska' | 'Poland';
}

// Polish VAT rates (as of 2024)
export type PolishVATRate = 0 | 5 | 8 | 23;

// VAT exemption reasons
export type VATExemptionReason = 
  | 'small_taxpayer' // mały podatnik
  | 'agricultural' // rolniczy
  | 'non_profit' // organizacja pożytku publicznego
  | 'export' // eksport
  | 'eu_delivery' // dostawa wewnątrzwspólnotowa
  | 'other';

// Polish energy providers
export type PolishEnergyProvider = 
  | 'PGE' 
  | 'Tauron' 
  | 'Enea' 
  | 'Energa' 
  | 'Innogy' 
  | 'Orlen' 
  | 'other';

// Energy provider information
export interface EnergyProviderInfo {
  name: PolishEnergyProvider;
  code: string;
  apiEndpoint?: string;
  regions: string[]; // voivodeships served
  services: EnergyService[];
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

// Energy services
export type EnergyService = 
  | 'electricity' 
  | 'gas' 
  | 'heating' 
  | 'renewable' 
  | 'energy_efficiency';

// HVAC certifications in Poland
export type PolishHVACCertification = 
  | 'F-Gas' // F-gazy
  | 'UDT' // Urząd Dozoru Technicznego
  | 'Vaillant'
  | 'Viessmann'
  | 'Bosch'
  | 'Daikin'
  | 'Mitsubishi'
  | 'LG'
  | 'Samsung'
  | 'Panasonic'
  | 'Carrier'
  | 'Trane'
  | 'other';

// Certification details
export interface CertificationInfo {
  type: PolishHVACCertification;
  number: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  isValid: boolean;
  scope?: string[];
  level?: 'basic' | 'advanced' | 'expert';
}

// Polish compliance check result
export interface PolishComplianceCheck {
  nip?: NIPValidationResult;
  regon?: REGONValidationResult;
  energyProvider?: EnergyProviderInfo;
  hvacCertifications: CertificationInfo[];
  complianceScore: number; // 0-100
  recommendations: string[];
  lastChecked: Date;
  isCompliant: boolean;
}

// Polish invoice requirements
export interface PolishInvoiceRequirements {
  requiresNIP: boolean;
  requiresREGON: boolean;
  vatRate: PolishVATRate;
  vatExemption?: VATExemptionReason;
  reverseCharge: boolean; // odwrotne obciążenie
  splitPayment: boolean; // mechanizm podzielonej płatności
  jpkRequired: boolean; // JPK_VAT reporting
}

// Polish business entity types
export type PolishBusinessEntityType = 
  | 'jednoosobowa_dzialalnosc' // sole proprietorship
  | 'spolka_cywilna' // civil partnership
  | 'spolka_jawna' // general partnership
  | 'spolka_komandytowa' // limited partnership
  | 'spolka_z_oo' // limited liability company
  | 'spolka_akcyjna' // joint stock company
  | 'spolka_komandytowo_akcyjna' // limited joint-stock partnership
  | 'spoldzielnia' // cooperative
  | 'fundacja' // foundation
  | 'stowarzyszenie' // association
  | 'other';

// Polish market specific customer data
export interface PolishCustomerData {
  businessNumbers: PolishBusinessNumbers;
  businessEntityType: PolishBusinessEntityType;
  address: PolishAddress;
  billingAddress?: PolishAddress;
  vatInfo: {
    rate: PolishVATRate;
    exemption?: VATExemptionReason;
    isVatPayer: boolean;
  };
  energyProvider?: PolishEnergyProvider;
  preferredLanguage: 'pl' | 'en';
  complianceStatus: PolishComplianceCheck;
  lastComplianceCheck?: Date;
}

// Polish regulatory requirements for HVAC
export interface PolishHVACRegulations {
  fGasRegulation: {
    required: boolean;
    certificationLevel: 'I' | 'II' | 'III' | 'IV';
    renewalRequired: boolean;
    nextRenewal?: Date;
  };
  udtRequirements: {
    required: boolean;
    equipmentTypes: string[];
    inspectionFrequency: number; // months
    nextInspection?: Date;
  };
  energyEfficiencyRequirements: {
    minEfficiencyClass: 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D';
    ecoDesignCompliant: boolean;
    energyLabelRequired: boolean;
  };
}

// Polish HVAC market data
export interface PolishHVACMarketData {
  averageTemperatures: {
    winter: number;
    summer: number;
    annual: number;
  };
  heatingSeasonDuration: number; // days
  commonHeatingSources: Array<{
    type: 'gas' | 'electric' | 'coal' | 'biomass' | 'heat_pump' | 'district_heating';
    percentage: number;
  }>;
  energyCosts: {
    electricity: number; // PLN per kWh
    gas: number; // PLN per m³
    coal: number; // PLN per ton
    biomass: number; // PLN per ton
  };
  subsidyPrograms: Array<{
    name: string;
    description: string;
    maxAmount: number; // PLN
    eligibilityCriteria: string[];
    applicationDeadline?: Date;
  }>;
}

// Re-export types from hvac-core to avoid conflicts
export type * from 'hvac-core/types/hvac-polish-compliance.types';
