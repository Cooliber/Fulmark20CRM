// NIP (Tax Identification Number) types
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

// REGON (Business Registry Number) types
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

// Polish Energy Provider types
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

// Compliance Check types
export type ComplianceCheckResult = {
  nip?: NIPValidationResult;
  regon?: REGONValidationResult;
  energyProvider?: PolishEnergyProvider;
  hvacCertifications?: string[];
  complianceScore: number;
  recommendations: string[];
};

export type ComplianceCheckInput = {
  nip?: string;
  regon?: string;
  region?: string;
  hvacLicenses?: string[];
};

// GraphQL response types
export type HvacNIPValidationType = {
  isValid: boolean;
  nip: string;
  formatted: string;
  companyName?: string;
  address?: string;
  status?: string;
  vatPayer?: boolean;
  error?: string;
};

export type HvacREGONValidationType = {
  isValid: boolean;
  regon: string;
  formatted: string;
  companyName?: string;
  address?: string;
  pkd?: string[];
  employeeCount?: string;
  error?: string;
};

export type HvacEnergyProviderContactType = {
  phone: string;
  email: string;
  website: string;
};

export type HvacEnergyProviderType = {
  name: string;
  code: string;
  apiEndpoint: string;
  regions: string[];
  services: string[];
  contactInfo: HvacEnergyProviderContactType;
};

export type HvacComplianceCheckType = {
  nip?: HvacNIPValidationType;
  regon?: HvacREGONValidationType;
  energyProvider?: HvacEnergyProviderType;
  hvacCertifications?: string[];
  complianceScore: number;
  recommendations: string[];
};

// Component props types
export type NIPValidationCardProps = {
  validation: NIPValidationResult;
  showDetails?: boolean;
  onEdit?: () => void;
  onRefresh?: () => void;
};

export type REGONValidationCardProps = {
  validation: REGONValidationResult;
  showDetails?: boolean;
  onEdit?: () => void;
  onRefresh?: () => void;
};

export type EnergyProviderCardProps = {
  provider: PolishEnergyProvider;
  compact?: boolean;
  onSelect?: (provider: PolishEnergyProvider) => void;
  onViewDetails?: (provider: PolishEnergyProvider) => void;
  onContact?: (provider: PolishEnergyProvider) => void;
};

export type ComplianceScoreCardProps = {
  complianceCheck: ComplianceCheckResult;
  onRecommendationClick?: (recommendation: string) => void;
  onImprove?: () => void;
  showDetails?: boolean;
};

export type PolishCompliancePanelProps = {
  customerId?: string;
  companyData?: {
    nip?: string;
    regon?: string;
    region?: string;
    hvacLicenses?: string[];
  };
  onComplianceUpdate?: (score: number) => void;
  onDataUpdate?: (data: Partial<ComplianceCheckInput>) => void;
  autoValidate?: boolean;
  showEnergyProviders?: boolean;
};

// Hook types
export type UsePolishComplianceOptions = {
  autoLoad?: boolean;
  onError?: (error: string) => void;
  onValidationComplete?: (result: ComplianceCheckResult) => void;
};

export type UsePolishComplianceReturn = {
  // Data
  nipValidation: NIPValidationResult | null;
  regonValidation: REGONValidationResult | null;
  energyProvider: PolishEnergyProvider | null;
  energyProviders: PolishEnergyProvider[];
  complianceCheck: ComplianceCheckResult | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  validateNIP: (nip: string) => Promise<NIPValidationResult>;
  validateREGON: (regon: string) => Promise<REGONValidationResult>;
  getEnergyProvider: (query: string) => Promise<PolishEnergyProvider | null>;
  getAllEnergyProviders: () => Promise<PolishEnergyProvider[]>;
  performComplianceCheck: (input: ComplianceCheckInput) => Promise<ComplianceCheckResult>;
  clearError: () => void;
  reset: () => void;
};

// Utility types
export type PolishRegion = 
  | 'mazowieckie'
  | 'śląskie'
  | 'wielkopolskie'
  | 'małopolskie'
  | 'lubelskie'
  | 'podlaskie'
  | 'warmińsko-mazurskie'
  | 'zachodniopomorskie'
  | 'lubuskie'
  | 'pomorskie'
  | 'kujawsko-pomorskie'
  | 'opolskie'
  | 'dolnośląskie'
  | 'łódzkie'
  | 'podkarpackie'
  | 'świętokrzyskie';

export type EnergyService = 
  | 'electricity'
  | 'gas'
  | 'renewable'
  | 'heat'
  | 'district_heating'
  | 'solar'
  | 'wind';

export type HVACCertification = 
  | 'F-GAZY'
  | 'UDT'
  | 'SEP'
  | 'COBRTI'
  | 'ISO_9001'
  | 'ISO_14001'
  | 'OHSAS_18001'
  | 'LG_AUTHORIZED'
  | 'DAIKIN_AUTHORIZED'
  | 'MITSUBISHI_AUTHORIZED';

export type ComplianceLevel = 
  | 'excellent'    // 90-100%
  | 'good'         // 70-89%
  | 'partial'      // 50-69%
  | 'poor';        // 0-49%

// Validation error types
export type ValidationError = {
  field: 'nip' | 'regon' | 'region' | 'general';
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

// Analytics types
export type ComplianceAnalytics = {
  totalChecks: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    partial: number;
    poor: number;
  };
  commonIssues: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
  regionDistribution: Array<{
    region: PolishRegion;
    count: number;
    averageScore: number;
  }>;
  energyProviderDistribution: Array<{
    provider: string;
    count: number;
    percentage: number;
  }>;
  certificationDistribution: Array<{
    certification: HVACCertification;
    count: number;
    percentage: number;
  }>;
};

// Configuration types
export type PolishComplianceConfig = {
  enableNIPValidation: boolean;
  enableREGONValidation: boolean;
  enableEnergyProviderLookup: boolean;
  enableCertificationTracking: boolean;
  requiredCertifications: HVACCertification[];
  minimumComplianceScore: number;
  autoValidateOnInput: boolean;
  cacheValidationResults: boolean;
  validationCacheTTL: number; // in seconds
};

// API response types
export type NIPAPIResponse = {
  valid: boolean;
  nip: string;
  company?: {
    name: string;
    address: string;
    status: string;
    vatPayer: boolean;
  };
  error?: string;
};

export type REGONAPIResponse = {
  valid: boolean;
  regon: string;
  company?: {
    name: string;
    address: string;
    pkd: string[];
    employeeCount: string;
  };
  error?: string;
};

// Form types
export type ComplianceFormData = {
  nip: string;
  regon: string;
  region: string;
  hvacLicenses: string[];
  companyName?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
};

export type ComplianceFormErrors = {
  nip?: string;
  regon?: string;
  region?: string;
  hvacLicenses?: string;
  general?: string;
};
