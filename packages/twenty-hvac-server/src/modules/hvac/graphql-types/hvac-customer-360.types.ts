import { ObjectType, Field, ID, InputType, Int, Float } from '@nestjs/graphql';
import { HvacCustomerType } from './hvac-customer.types';
import { HvacEquipmentListResponse, HvacEquipmentFilterInput } from './hvac-equipment.types';
import { HvacCommunicationListResponse, HvacCommunicationFilterInput } from './hvac-communication.types';
import { HvacServiceTicketListResponse, HvacServiceTicketFilterInput } from './hvac-service-ticket.types';
import { HvacContractListResponse, HvacContractFilterInput } from './hvac-contract.types';

// Types for CustomerInsights
@ObjectType('HvacPaymentRecord')
export class HvacPaymentRecordType {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field()
  date: Date;

  @Field() // Consider an Enum: PAID, PENDING, OVERDUE, CANCELLED
  status: string;

  @Field()
  invoiceNumber: string;
}

@ObjectType('HvacFinancialMetrics')
export class HvacFinancialMetricsType {
  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  lifetimeValue: number;

  @Field(() => Float)
  averageOrderValue: number;

  @Field(() => Float)
  monthlyRecurringRevenue: number;

  @Field(() => [HvacPaymentRecordType])
  paymentHistory: HvacPaymentRecordType[];
}

@ObjectType('HvacRiskIndicators')
export class HvacRiskIndicatorsType {
  @Field(() => Float) // e.g. 0-1 probability
  churnRisk: number;

  @Field(() => Float) // e.g. 0-1 probability
  paymentRisk: number;

  @Field(() => Float) // e.g. trend score -1 to 1
  satisfactionTrend: number;

  @Field(() => Int) // days
  lastContactDays: number;
}

@ObjectType('HvacBehaviorMetrics')
export class HvacBehaviorMetricsType {
  @Field(() => Float) // e.g. services per year
  serviceFrequency: number;

  @Field() // Consider an Enum
  preferredContactMethod: string;

  @Field(() => Float) // e.g. hours or days
  responseTime: number;

  @Field(() => Float) // e.g. 0-1 percentage
  issueResolutionRate: number;
}

@ObjectType('HvacCustomerInsights')
export class HvacCustomerInsightsType {
  @Field(() => HvacFinancialMetricsType, { nullable: true })
  financialMetrics?: HvacFinancialMetricsType;

  @Field(() => HvacRiskIndicatorsType, { nullable: true })
  riskIndicators?: HvacRiskIndicatorsType;

  @Field(() => HvacBehaviorMetricsType, { nullable: true })
  behaviorMetrics?: HvacBehaviorMetricsType;
}


// Main Customer360 Type
@ObjectType('HvacCustomer360')
export class HvacCustomer360Type {
  @Field(() => HvacCustomerType)
  customer: HvacCustomerType; // Basic customer data

  @Field(() => HvacCustomerInsightsType, { nullable: true })
  insights?: HvacCustomerInsightsType;

  // Field resolvers will handle fetching these lists with pagination/filters
  @Field(() => HvacEquipmentListResponse, { description: 'Paginated list of customer equipment.' })
  equipment: HvacEquipmentListResponse;

  @Field(() => HvacCommunicationListResponse, { description: 'Paginated list of customer communications.' })
  communications: HvacCommunicationListResponse;

  @Field(() => HvacServiceTicketListResponse, { description: 'Paginated list of customer service tickets.' })
  serviceTickets: HvacServiceTicketListResponse;

  @Field(() => HvacContractListResponse, { description: 'Paginated list of customer contracts.' })
  contracts: HvacContractListResponse;
}
