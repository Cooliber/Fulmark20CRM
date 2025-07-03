import { gql } from '@apollo/client';

// Fragments
export const HVAC_NIP_VALIDATION_FRAGMENT = gql`
  fragment HvacNIPValidationFragment on HvacNIPValidation {
    isValid
    nip
    formatted
    companyName
    address
    status
    vatPayer
    error
  }
`;

export const HVAC_REGON_VALIDATION_FRAGMENT = gql`
  fragment HvacREGONValidationFragment on HvacREGONValidation {
    isValid
    regon
    formatted
    companyName
    address
    pkd
    employeeCount
    error
  }
`;

export const HVAC_ENERGY_PROVIDER_CONTACT_FRAGMENT = gql`
  fragment HvacEnergyProviderContactFragment on HvacEnergyProviderContact {
    phone
    email
    website
  }
`;

export const HVAC_ENERGY_PROVIDER_FRAGMENT = gql`
  fragment HvacEnergyProviderFragment on HvacEnergyProvider {
    name
    code
    apiEndpoint
    regions
    services
    contactInfo {
      ...HvacEnergyProviderContactFragment
    }
  }
  ${HVAC_ENERGY_PROVIDER_CONTACT_FRAGMENT}
`;

export const HVAC_COMPLIANCE_CHECK_FRAGMENT = gql`
  fragment HvacComplianceCheckFragment on HvacComplianceCheck {
    nip {
      ...HvacNIPValidationFragment
    }
    regon {
      ...HvacREGONValidationFragment
    }
    energyProvider {
      ...HvacEnergyProviderFragment
    }
    hvacCertifications
    complianceScore
    recommendations
  }
  ${HVAC_NIP_VALIDATION_FRAGMENT}
  ${HVAC_REGON_VALIDATION_FRAGMENT}
  ${HVAC_ENERGY_PROVIDER_FRAGMENT}
`;

// Mutations
export const VALIDATE_HVAC_NIP = gql`
  mutation ValidateHvacNIP($nip: String!) {
    validateHvacNIP(nip: $nip) {
      ...HvacNIPValidationFragment
    }
  }
  ${HVAC_NIP_VALIDATION_FRAGMENT}
`;

export const VALIDATE_HVAC_REGON = gql`
  mutation ValidateHvacREGON($regon: String!) {
    validateHvacREGON(regon: $regon) {
      ...HvacREGONValidationFragment
    }
  }
  ${HVAC_REGON_VALIDATION_FRAGMENT}
`;

export const GET_HVAC_ENERGY_PROVIDER = gql`
  mutation GetHvacEnergyProvider($query: String!) {
    getHvacEnergyProvider(query: $query) {
      ...HvacEnergyProviderFragment
    }
  }
  ${HVAC_ENERGY_PROVIDER_FRAGMENT}
`;

export const PERFORM_HVAC_COMPLIANCE_CHECK = gql`
  mutation PerformHvacComplianceCheck($input: HvacComplianceCheckInput!) {
    performHvacComplianceCheck(input: $input) {
      ...HvacComplianceCheckFragment
    }
  }
  ${HVAC_COMPLIANCE_CHECK_FRAGMENT}
`;

// Queries
export const GET_ALL_HVAC_ENERGY_PROVIDERS = gql`
  query GetAllHvacEnergyProviders {
    getAllHvacEnergyProviders {
      ...HvacEnergyProviderFragment
    }
  }
  ${HVAC_ENERGY_PROVIDER_FRAGMENT}
`;

export const GET_HVAC_COMPLIANCE_HISTORY = gql`
  query GetHvacComplianceHistory($customerId: ID, $limit: Int, $offset: Int) {
    hvacComplianceHistory(customerId: $customerId, limit: $limit, offset: $offset) {
      checks {
        id
        customerId
        timestamp
        ...HvacComplianceCheckFragment
      }
      totalCount
      hasMore
    }
  }
  ${HVAC_COMPLIANCE_CHECK_FRAGMENT}
`;

// Additional queries for specific use cases
export const SEARCH_COMPANIES_BY_NIP = gql`
  query SearchCompaniesByNIP($nips: [String!]!) {
    searchCompaniesByNIP(nips: $nips) {
      ...HvacNIPValidationFragment
    }
  }
  ${HVAC_NIP_VALIDATION_FRAGMENT}
`;

export const SEARCH_COMPANIES_BY_REGON = gql`
  query SearchCompaniesByREGON($regons: [String!]!) {
    searchCompaniesByREGON(regons: $regons) {
      ...HvacREGONValidationFragment
    }
  }
  ${HVAC_REGON_VALIDATION_FRAGMENT}
`;

export const GET_ENERGY_PROVIDERS_BY_REGION = gql`
  query GetEnergyProvidersByRegion($region: String!) {
    getEnergyProvidersByRegion(region: $region) {
      ...HvacEnergyProviderFragment
    }
  }
  ${HVAC_ENERGY_PROVIDER_FRAGMENT}
`;

export const GET_HVAC_CERTIFICATIONS = gql`
  query GetHvacCertifications {
    hvacCertifications {
      code
      name
      description
      issuer
      validityPeriod
      required
    }
  }
`;

// Analytics queries
export const GET_COMPLIANCE_ANALYTICS = gql`
  query GetComplianceAnalytics($dateFrom: String, $dateTo: String) {
    complianceAnalytics(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalChecks
      averageScore
      scoreDistribution {
        excellent
        good
        partial
        poor
      }
      commonIssues {
        issue
        count
        percentage
      }
      regionDistribution {
        region
        count
        averageScore
      }
      energyProviderDistribution {
        provider
        count
        percentage
      }
      certificationDistribution {
        certification
        count
        percentage
      }
    }
  }
`;

// Configuration queries
export const GET_POLISH_COMPLIANCE_CONFIG = gql`
  query GetPolishComplianceConfig {
    polishComplianceConfig {
      enableNIPValidation
      enableREGONValidation
      enableEnergyProviderLookup
      enableCertificationTracking
      requiredCertifications
      minimumComplianceScore
      autoValidateOnInput
      cacheValidationResults
      validationCacheTTL
    }
  }
`;

// Subscription for real-time updates
export const COMPLIANCE_CHECK_UPDATES = gql`
  subscription ComplianceCheckUpdates($customerId: ID) {
    complianceCheckUpdated(customerId: $customerId) {
      id
      customerId
      timestamp
      ...HvacComplianceCheckFragment
    }
  }
  ${HVAC_COMPLIANCE_CHECK_FRAGMENT}
`;

// Batch operations
export const BATCH_VALIDATE_COMPANIES = gql`
  mutation BatchValidateCompanies($companies: [CompanyValidationInput!]!) {
    batchValidateCompanies(companies: $companies) {
      results {
        companyId
        nip {
          ...HvacNIPValidationFragment
        }
        regon {
          ...HvacREGONValidationFragment
        }
        compliance {
          ...HvacComplianceCheckFragment
        }
      }
      summary {
        total
        successful
        failed
        averageScore
      }
    }
  }
  ${HVAC_NIP_VALIDATION_FRAGMENT}
  ${HVAC_REGON_VALIDATION_FRAGMENT}
  ${HVAC_COMPLIANCE_CHECK_FRAGMENT}
`;

// Error handling queries
export const GET_VALIDATION_ERRORS = gql`
  query GetValidationErrors($limit: Int = 50, $offset: Int = 0) {
    validationErrors(limit: $limit, offset: $offset) {
      field
      code
      message
      details
      timestamp
      companyId
    }
  }
`;
