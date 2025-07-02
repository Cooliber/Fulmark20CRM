import { ObjectType, Field, ID, InputType, Int, registerEnumType, Float } from '@nestjs/graphql';
import { IsString, IsOptional, IsDate, IsEnum, ValidateNested, IsArray, IsNotEmpty, IsUUID, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { GraphQLJSONObject } from 'graphql-type-json'; // Potentially needed for technicalSpecs

// Enums
export enum HvacEquipmentStatusEnum {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR_NEEDED = 'REPAIR_NEEDED',
  INACTIVE = 'INACTIVE',
}
registerEnumType(HvacEquipmentStatusEnum, { name: 'HvacEquipmentStatusEnum' });

export enum HvacEquipmentTypeEnum {
  AIR_CONDITIONING = 'AIR_CONDITIONING',
  HEATING = 'HEATING',
  VENTILATION = 'VENTILATION',
  REFRIGERATION = 'REFRIGERATION',
  HEAT_PUMP = 'HEAT_PUMP',
}
registerEnumType(HvacEquipmentTypeEnum, { name: 'HvacEquipmentTypeEnum' });

export enum HvacMaintenanceTypeEnum {
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  INSTALLATION = 'installation',
}
registerEnumType(HvacMaintenanceTypeEnum, { name: 'HvacMaintenanceTypeEnum' });

export enum HvacMaintenancePriorityEnum {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}
registerEnumType(HvacMaintenancePriorityEnum, { name: 'HvacMaintenancePriorityEnum'});


// Object Types
@ObjectType('HvacMaintenanceRecord')
export class HvacMaintenanceRecordType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  equipmentId: string;

  @Field()
  date: Date;

  @Field(() => HvacMaintenanceTypeEnum)
  type: HvacMaintenanceTypeEnum;

  @Field()
  description: string;

  @Field()
  technician: string;

  @Field(() => Float)
  cost: number;

  @Field(() => [String], { nullable: 'itemsAndList' })
  partsUsed?: string[];

  @Field({ nullable: true })
  nextServiceDate?: Date;

  @Field(() => [String], { nullable: 'itemsAndList' })
  photos?: string[];

  @Field(() => [String], { nullable: 'itemsAndList' })
  documents?: string[];
}

@ObjectType('HvacEquipment')
export class HvacEquipmentType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  customerId: string;

  @Field()
  name: string;

  @Field(() => HvacEquipmentTypeEnum)
  type: HvacEquipmentTypeEnum;

  @Field()
  brand: string;

  @Field()
  model: string;

  @Field()
  serialNumber: string;

  @Field()
  installationDate: Date;

  @Field()
  lastService: Date;

  @Field()
  nextService: Date;

  @Field(() => HvacEquipmentStatusEnum)
  status: HvacEquipmentStatusEnum;

  @Field({ nullable: true })
  warrantyExpiry?: Date;

  @Field(() => GraphQLJSONObject, { nullable: true }) // Using JSON for flexible specs
  technicalSpecs?: Record<string, unknown>;

  @Field(() => [HvacMaintenanceRecordType], { nullable: 'itemsAndList' })
  maintenanceHistory?: HvacMaintenanceRecordType[];

  @Field()
  manufacturer: string;

  @Field()
  customerName: string; // Assuming this comes from HVAC API or is denormalized

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  notes?: string;
}

@ObjectType('HvacEquipmentListResponse')
export class HvacEquipmentListResponse {
  @Field(() => [HvacEquipmentType])
  equipment: HvacEquipmentType[];

  @Field(() => Int)
  total: number;
}


// Input Types
@InputType()
export class HvacEquipmentFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => HvacEquipmentTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacEquipmentTypeEnum)
  type?: HvacEquipmentTypeEnum;

  @Field(() => HvacEquipmentStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacEquipmentStatusEnum)
  status?: HvacEquipmentStatusEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  needsService?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  warrantyExpiring?: boolean;
}

@InputType()
export class CreateHvacEquipmentInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => HvacEquipmentTypeEnum)
  @IsEnum(HvacEquipmentTypeEnum)
  @IsNotEmpty()
  type: HvacEquipmentTypeEnum;

  @Field()
  @IsString()
  @IsNotEmpty()
  brand: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  model: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @Field()
  @Type(() => Date)
  @IsDate()
  installationDate: Date;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  warrantyExpiry?: Date;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  technicalSpecs?: Record<string, unknown>;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateHvacEquipmentInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => HvacEquipmentTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacEquipmentTypeEnum)
  type?: HvacEquipmentTypeEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  model?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  installationDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  warrantyExpiry?: Date;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  technicalSpecs?: Record<string, unknown>;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => HvacEquipmentStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacEquipmentStatusEnum)
  status?: HvacEquipmentStatusEnum;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastService?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextService?: Date;
}

@InputType()
export class ScheduleHvacMaintenanceInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  equipmentId: string;

  @Field()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  scheduledDate: Date;

  @Field(() => HvacMaintenanceTypeEnum)
  @IsEnum(HvacMaintenanceTypeEnum)
  @IsNotEmpty()
  type: HvacMaintenanceTypeEnum;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @Field(() => HvacMaintenancePriorityEnum)
  @IsEnum(HvacMaintenancePriorityEnum)
  @IsNotEmpty()
  priority: HvacMaintenancePriorityEnum;
}
