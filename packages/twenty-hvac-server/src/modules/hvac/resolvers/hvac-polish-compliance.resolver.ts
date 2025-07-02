import { Injectable, Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
import { HvacPermissionsGuard, RequireHvacRead } from '../guards/hvac-permissions.guard';
import { 
  HvacPolishComplianceService, 
  NIPValidationResult, 
  REGONValidationResult, 
  PolishEnergyProvider,
  ComplianceCheckResult 
} from '../services/hvac-polish-compliance.service';
import { HVACErrorContext, HvacSentryService } from '../services/hvac-sentry.service';

// GraphQL Input Types
@InputType()
export class HvacComplianceCheckInput {
  @Field({ nullable: true })
  nip?: string;

  @Field({ nullable: true })
  regon?: string;

  @Field({ nullable: true })
  region?: string;

  @Field(() => [String], { nullable: true })
  hvacLicenses?: string[];
}

// GraphQL Object Types
@ObjectType('HvacNIPValidation')
export class HvacNIPValidationType {
  @Field()
  isValid: boolean;

  @Field()
  nip: string;

  @Field()
  formatted: string;

  @Field({ nullable: true })
  companyName?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  vatPayer?: boolean;

  @Field({ nullable: true })
  error?: string;
}

@ObjectType('HvacREGONValidation')
export class HvacREGONValidationType {
  @Field()
  isValid: boolean;

  @Field()
  regon: string;

  @Field()
  formatted: string;

  @Field({ nullable: true })
  companyName?: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => [String], { nullable: true })
  pkd?: string[];

  @Field({ nullable: true })
  employeeCount?: string;

  @Field({ nullable: true })
  error?: string;
}

@ObjectType('HvacEnergyProviderContact')
export class HvacEnergyProviderContactType {
  @Field()
  phone: string;

  @Field()
  email: string;

  @Field()
  website: string;
}

@ObjectType('HvacEnergyProvider')
export class HvacEnergyProviderType {
  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  apiEndpoint: string;

  @Field(() => [String])
  regions: string[];

  @Field(() => [String])
  services: string[];

  @Field(() => HvacEnergyProviderContactType)
  contactInfo: HvacEnergyProviderContactType;
}

@ObjectType('HvacComplianceCheck')
export class HvacComplianceCheckType {
  @Field(() => HvacNIPValidationType, { nullable: true })
  nip?: HvacNIPValidationType;

  @Field(() => HvacREGONValidationType, { nullable: true })
  regon?: HvacREGONValidationType;

  @Field(() => HvacEnergyProviderType, { nullable: true })
  energyProvider?: HvacEnergyProviderType;

  @Field(() => [String], { nullable: true })
  hvacCertifications?: string[];

  @Field()
  complianceScore: number;

  @Field(() => [String])
  recommendations: string[];
}

@Resolver()
@Injectable()
@UseGuards(HvacPermissionsGuard)
export class HvacPolishComplianceResolver {
  private readonly logger = new Logger(HvacPolishComplianceResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly polishComplianceService: HvacPolishComplianceService,
    private readonly sentryService: HvacSentryService,
  ) {}

  /**
   * Validate Polish NIP number
   */
  @Query(() => HvacNIPValidationType, { name: 'validateHvacNIP' })
  @RequireHvacRead()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async validateNIP(
    @Args('nip') nip: string,
  ): Promise<HvacNIPValidationType> {
    this.checkFeatureEnabled('polishCompliance');

    try {
      this.logger.log(`Validating NIP: ${nip}`);

      const result = await this.polishComplianceService.validateNIP(nip);
      return this.mapNIPResult(result);

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { nip, action: 'validate_nip' },
      );

      this.logger.error(`Error validating NIP ${nip}:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Validate Polish REGON number
   */
  @Query(() => HvacREGONValidationType, { name: 'validateHvacREGON' })
  @RequireHvacRead()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async validateREGON(
    @Args('regon') regon: string,
  ): Promise<HvacREGONValidationType> {
    this.checkFeatureEnabled('polishCompliance');

    try {
      this.logger.log(`Validating REGON: ${regon}`);

      const result = await this.polishComplianceService.validateREGON(regon);
      return this.mapREGONResult(result);

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { regon, action: 'validate_regon' },
      );

      this.logger.error(`Error validating REGON ${regon}:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Get Polish energy provider by region or name
   */
  @Query(() => HvacEnergyProviderType, { name: 'getHvacEnergyProvider', nullable: true })
  @RequireHvacRead()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getEnergyProvider(
    @Args('query') query: string,
  ): Promise<HvacEnergyProviderType | null> {
    this.checkFeatureEnabled('polishCompliance');

    try {
      this.logger.log(`Getting energy provider for: ${query}`);

      const provider = this.polishComplianceService.getEnergyProvider(query);
      return provider ? this.mapEnergyProvider(provider) : null;

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { query, action: 'get_energy_provider' },
      );

      this.logger.error(`Error getting energy provider for ${query}:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Get all Polish energy providers
   */
  @Query(() => [HvacEnergyProviderType], { name: 'getAllHvacEnergyProviders' })
  @RequireHvacRead()
  async getAllEnergyProviders(): Promise<HvacEnergyProviderType[]> {
    this.checkFeatureEnabled('polishCompliance');

    try {
      this.logger.log('Getting all energy providers');

      const providers = this.polishComplianceService.getAllEnergyProviders();
      return providers.map(provider => this.mapEnergyProvider(provider));

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { action: 'get_all_energy_providers' },
      );

      this.logger.error('Error getting all energy providers:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Perform comprehensive compliance check
   */
  @Query(() => HvacComplianceCheckType, { name: 'performHvacComplianceCheck' })
  @RequireHvacRead()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async performComplianceCheck(
    @Args('input') input: HvacComplianceCheckInput,
  ): Promise<HvacComplianceCheckType> {
    this.checkFeatureEnabled('polishCompliance');

    try {
      this.logger.log('Performing compliance check:', input);

      const result = await this.polishComplianceService.performComplianceCheck({
        nip: input.nip,
        regon: input.regon,
        region: input.region,
        hvacLicenses: input.hvacLicenses,
      });

      return this.mapComplianceResult(result);

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.POLISH_COMPLIANCE,
        { input, action: 'compliance_check' },
      );

      this.logger.error('Error performing compliance check:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Check if feature is enabled
   */
  private checkFeatureEnabled(feature: string): void {
    if (!this.hvacConfigService.isHvacFeatureEnabled(feature)) {
      throw new Error(`HVAC ${feature} feature is not enabled`);
    }
  }

  /**
   * Map NIP validation result to GraphQL type
   */
  private mapNIPResult(result: NIPValidationResult): HvacNIPValidationType {
    return {
      isValid: result.isValid,
      nip: result.nip,
      formatted: result.formatted,
      companyName: result.companyName,
      address: result.address,
      status: result.status,
      vatPayer: result.vatPayer,
      error: result.error,
    };
  }

  /**
   * Map REGON validation result to GraphQL type
   */
  private mapREGONResult(result: REGONValidationResult): HvacREGONValidationType {
    return {
      isValid: result.isValid,
      regon: result.regon,
      formatted: result.formatted,
      companyName: result.companyName,
      address: result.address,
      pkd: result.pkd,
      employeeCount: result.employeeCount,
      error: result.error,
    };
  }

  /**
   * Map energy provider to GraphQL type
   */
  private mapEnergyProvider(provider: PolishEnergyProvider): HvacEnergyProviderType {
    return {
      name: provider.name,
      code: provider.code,
      apiEndpoint: provider.apiEndpoint,
      regions: provider.regions,
      services: provider.services,
      contactInfo: {
        phone: provider.contactInfo.phone,
        email: provider.contactInfo.email,
        website: provider.contactInfo.website,
      },
    };
  }

  /**
   * Map compliance check result to GraphQL type
   */
  private mapComplianceResult(result: ComplianceCheckResult): HvacComplianceCheckType {
    return {
      nip: result.nip ? this.mapNIPResult(result.nip) : undefined,
      regon: result.regon ? this.mapREGONResult(result.regon) : undefined,
      energyProvider: result.energyProvider ? this.mapEnergyProvider(result.energyProvider) : undefined,
      hvacCertifications: result.hvacCertifications,
      complianceScore: result.complianceScore,
      recommendations: result.recommendations,
    };
  }
}
