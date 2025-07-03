import { ObjectType, Field, ID, InputType, Int, Float, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional, IsDate, IsEnum, IsNotEmpty, IsUUID, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { HvacCustomerType } from './hvac-customer.types'; // Assuming HvacCustomerType is defined

// Enums for Contract
export enum HvacContractTypeEnum {
  MAINTENANCE = 'MAINTENANCE',
  SERVICE = 'SERVICE',
  INSTALLATION = 'INSTALLATION',
}
registerEnumType(HvacContractTypeEnum, { name: 'HvacContractTypeEnum' });

export enum HvacContractStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING', // Added common status
  DRAFT = 'DRAFT',     // Added common status
}
registerEnumType(HvacContractStatusEnum, { name: 'HvacContractStatusEnum' });

// Object Type
@ObjectType('HvacContract')
export class HvacContractType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  customerId: string;

  @Field(() => HvacCustomerType, { nullable: true, description: 'Resolved customer information.' })
  customer?: HvacCustomerType; // Field resolver can populate this

  @Field(() => HvacContractTypeEnum)
  type: HvacContractTypeEnum;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field(() => Float)
  value: number;

  @Field(() => HvacContractStatusEnum)
  status: HvacContractStatusEnum;

  @Field({ nullable: true })
  terms?: string;

  @Field({ nullable: true })
  contractNumber?: string; // Added common field

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType('HvacContractListResponse')
export class HvacContractListResponse {
  @Field(() => [HvacContractType])
  contracts: HvacContractType[];

  @Field(() => Int)
  total: number;
}

// Input Types
@InputType()
export class HvacContractFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => HvacContractTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacContractTypeEnum)
  type?: HvacContractTypeEnum;

  @Field(() => [HvacContractStatusEnum], { nullable: 'itemsAndList' }) // Allow filtering by multiple statuses
  @IsOptional()
  @IsEnum(HvacContractStatusEnum, { each: true })
  status?: HvacContractStatusEnum[];

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  validOnDate?: Date; // Find contracts active on a specific date

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  startDateFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  endDateTo?: Date;
}

@InputType()
export class CreateHvacContractInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @Field(() => HvacContractTypeEnum)
  @IsEnum(HvacContractTypeEnum)
  @IsNotEmpty()
  type: HvacContractTypeEnum;

  @Field()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @Field()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @Field(() => Float)
  @Min(0)
  @IsNotEmpty()
  value: number;

  @Field(() => HvacContractStatusEnum, { defaultValue: HvacContractStatusEnum.DRAFT })
  @IsEnum(HvacContractStatusEnum)
  @IsOptional() // Default to DRAFT
  status: HvacContractStatusEnum = HvacContractStatusEnum.DRAFT;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  terms?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contractNumber?: string;
}

@InputType()
export class UpdateHvacContractInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => HvacContractTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacContractTypeEnum)
  type?: HvacContractTypeEnum;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  value?: number;

  @Field(() => HvacContractStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacContractStatusEnum)
  status?: HvacContractStatusEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  terms?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contractNumber?: string;
}
