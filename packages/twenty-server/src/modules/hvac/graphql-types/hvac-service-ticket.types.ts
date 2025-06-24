import { ObjectType, Field, ID, InputType, Int, Float, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional, IsDate, IsEnum, IsNotEmpty, IsUUID, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { HvacCustomerType } from './hvac-customer.types'; // Assuming HvacCustomerType is defined
import { HvacEquipmentType } from './hvac-equipment.types'; // Assuming HvacEquipmentType is defined

// Enums for ServiceTicket
export enum HvacServiceTicketStatusEnum {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD', // Added based on common needs
  CLOSED = 'CLOSED',   // Added based on common needs
}
registerEnumType(HvacServiceTicketStatusEnum, { name: 'HvacServiceTicketStatusEnum' });

export enum HvacServiceTicketPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}
registerEnumType(HvacServiceTicketPriorityEnum, { name: 'HvacServiceTicketPriorityEnum' });

// Object Type
@ObjectType('HvacServiceTicket')
export class HvacServiceTicketType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  customerId: string;

  @Field(() => HvacCustomerType, { nullable: true, description: 'Resolved customer information.' })
  customer?: HvacCustomerType; // Field resolver can populate this

  @Field(() => ID, { nullable: true })
  equipmentId?: string;

  @Field(() => HvacEquipmentType, { nullable: true, description: 'Resolved equipment information.' })
  equipment?: HvacEquipmentType; // Field resolver can populate this

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => HvacServiceTicketStatusEnum)
  status: HvacServiceTicketStatusEnum;

  @Field(() => HvacServiceTicketPriorityEnum)
  priority: HvacServiceTicketPriorityEnum;

  @Field(() => ID, { nullable: true }) // Assuming technician is an entity with an ID
  assignedTechnicianId?: string;
  // @Field(() => HvacTechnicianType, { nullable: true }) // If HvacTechnicianType is defined
  // assignedTechnician?: HvacTechnicianType;

  @Field({ nullable: true })
  scheduledDate?: Date;

  @Field({ nullable: true })
  completedDate?: Date;

  @Field(() => Float)
  estimatedCost: number;

  @Field(() => Float, { nullable: true })
  actualCost?: number;

  @Field({ nullable: true }) // From HVAC_SERVICE_TYPES in frontend index.ts
  serviceType?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType('HvacServiceTicketListResponse')
export class HvacServiceTicketListResponse {
  @Field(() => [HvacServiceTicketType])
  tickets: HvacServiceTicketType[];

  @Field(() => Int)
  total: number;
}

// Input Types
@InputType()
export class HvacServiceTicketFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @Field(() => [HvacServiceTicketStatusEnum], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsEnum(HvacServiceTicketStatusEnum, { each: true })
  status?: HvacServiceTicketStatusEnum[];

  @Field(() => [HvacServiceTicketPriorityEnum], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsEnum(HvacServiceTicketPriorityEnum, { each: true })
  priority?: HvacServiceTicketPriorityEnum[];

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  scheduledDateFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  scheduledDateTo?: Date;
}

@InputType()
export class CreateHvacServiceTicketInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => HvacServiceTicketPriorityEnum)
  @IsEnum(HvacServiceTicketPriorityEnum)
  @IsNotEmpty()
  priority: HvacServiceTicketPriorityEnum;

  @Field({ nullable: true }) // Example: 'Installation', 'Maintenance'
  @IsOptional()
  @IsString()
  serviceType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledDate?: Date;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @Field(() => ID, { nullable: true }) // Assuming technician is an entity with an ID
  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;
}

@InputType()
export class UpdateHvacServiceTicketInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => HvacServiceTicketStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacServiceTicketStatusEnum)
  status?: HvacServiceTicketStatusEnum;

  @Field(() => HvacServiceTicketPriorityEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacServiceTicketPriorityEnum)
  priority?: HvacServiceTicketPriorityEnum;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedDate?: Date;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  actualCost?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serviceType?: string;
}
