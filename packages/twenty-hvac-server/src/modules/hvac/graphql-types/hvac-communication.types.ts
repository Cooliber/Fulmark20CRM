import { ObjectType, Field, ID, InputType, Int, registerEnumType, Float } from '@nestjs/graphql';
import { IsString, IsOptional, IsDate, IsEnum, ValidateNested, IsArray, IsNotEmpty, IsUUID, Min, IsBoolean, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { GraphQLJSONObject } from 'graphql-type-json';

// Enums for Communication
export enum HvacCommunicationTypeEnum {
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  MEETING = 'meeting',
  NOTE = 'note',
  DOCUMENT = 'document',
}
registerEnumType(HvacCommunicationTypeEnum, { name: 'HvacCommunicationTypeEnum' });

export enum HvacCommunicationDirectionEnum {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}
registerEnumType(HvacCommunicationDirectionEnum, { name: 'HvacCommunicationDirectionEnum' });

export enum HvacCommunicationStatusEnum {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  REPLIED = 'replied',
  FAILED = 'failed',
}
registerEnumType(HvacCommunicationStatusEnum, { name: 'HvacCommunicationStatusEnum' });

export enum HvacCommunicationPriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}
registerEnumType(HvacCommunicationPriorityEnum, { name: 'HvacCommunicationPriorityEnum' });

export enum HvacParticipantRoleEnum {
  CUSTOMER = 'customer',
  TECHNICIAN = 'technician',
  MANAGER = 'manager',
  SUPPORT = 'support',
}
registerEnumType(HvacParticipantRoleEnum, { name: 'HvacParticipantRoleEnum' });

export enum HvacAISentimentEnum {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}
registerEnumType(HvacAISentimentEnum, { name: 'HvacAISentimentEnum' });

export enum HvacAIUrgencyEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
registerEnumType(HvacAIUrgencyEnum, { name: 'HvacAIUrgencyEnum' });


// Object Types
@ObjectType('HvacParticipant')
export class HvacParticipantType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => HvacParticipantRoleEnum)
  role: HvacParticipantRoleEnum;
}

@ObjectType('HvacAttachment')
export class HvacAttachmentType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  type: string;

  @Field(() => Int)
  size: number;

  @Field()
  url: string;

  @Field()
  uploadedAt: Date;
}

@ObjectType('HvacCommunicationMetadata')
export class HvacCommunicationMetadataType {
  @Field()
  source: string;

  @Field()
  channel: string;

  @Field({ nullable: true })
  deviceInfo?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  referenceId?: string;

  @Field({ nullable: true })
  threadId?: string;
}

@ObjectType('HvacAIInsights')
export class HvacAIInsightsType {
  @Field(() => HvacAISentimentEnum)
  sentiment: HvacAISentimentEnum;

  @Field(() => Float)
  sentimentScore: number;

  @Field(() => [String])
  topics: string[];

  @Field(() => HvacAIUrgencyEnum)
  urgency: HvacAIUrgencyEnum;

  @Field(() => [String])
  actionItems: string[];

  @Field()
  summary: string;

  @Field()
  language: string;

  @Field(() => Float)
  confidence: number;
}

@ObjectType('HvacCommunication')
export class HvacCommunicationType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  customerId: string;

  @Field(() => HvacCommunicationTypeEnum)
  type: HvacCommunicationTypeEnum;

  @Field(() => HvacCommunicationDirectionEnum)
  direction: HvacCommunicationDirectionEnum;

  @Field({ nullable: true })
  subject?: string;

  @Field()
  content: string;

  @Field()
  timestamp: Date;

  @Field(() => HvacCommunicationStatusEnum)
  status: HvacCommunicationStatusEnum;

  @Field(() => [HvacParticipantType])
  participants: HvacParticipantType[];

  @Field(() => [HvacAttachmentType])
  attachments: HvacAttachmentType[];

  @Field(() => HvacCommunicationMetadataType) // Or GraphQLJSONObject
  metadata: HvacCommunicationMetadataType;

  @Field(() => HvacAIInsightsType, { nullable: true }) // Or GraphQLJSONObject
  aiInsights?: HvacAIInsightsType;

  @Field(() => [String])
  tags: string[];

  @Field(() => HvacCommunicationPriorityEnum)
  priority: HvacCommunicationPriorityEnum;
}

@ObjectType('HvacCommunicationListResponse')
export class HvacCommunicationListResponse {
  @Field(() => [HvacCommunicationType])
  communications: HvacCommunicationType[];

  @Field(() => Int)
  total: number;
}

@ObjectType('HvacCommunicationStatsByType')
export class HvacCommunicationStatsByType {
    @Field(() => HvacCommunicationTypeEnum)
    type: HvacCommunicationTypeEnum;
    @Field(() => Int)
    count: number;
}
@ObjectType('HvacCommunicationStatsByDirection')
export class HvacCommunicationStatsByDirection {
    @Field(() => HvacCommunicationDirectionEnum)
    direction: HvacCommunicationDirectionEnum;
    @Field(() => Int)
    count: number;
}
@ObjectType('HvacCommunicationStatsByStatus')
export class HvacCommunicationStatsByStatus {
    @Field(() => HvacCommunicationStatusEnum)
    status: HvacCommunicationStatusEnum;
    @Field(() => Int)
    count: number;
}
@ObjectType('HvacCommunicationStatsBySentiment')
export class HvacCommunicationStatsBySentiment {
    @Field(() => HvacAISentimentEnum)
    sentiment: HvacAISentimentEnum;
    @Field(() => Int)
    count: number;
}


@ObjectType('HvacCommunicationStats')
export class HvacCommunicationStatsType {
  @Field(() => Int)
  total: number;

  // For byType, byDirection, byStatus, bySentiment, we might need a more structured approach
  // if we want to strongly type them in GraphQL. A list of key-value pairs is one way.
  // Or, define specific fields if the categories are fixed.
  // For simplicity, using a more generic approach or specific fields if known.
  // Example with specific fields (assuming fixed types):
  // @Field(() => Int) emailCount: number;
  // @Field(() => Int) phoneCount: number;
  // Let's use a list of key-value pairs for flexibility for now:

  @Field(() => [HvacCommunicationStatsByType])
  byType: HvacCommunicationStatsByType[];

  @Field(() => [HvacCommunicationStatsByDirection])
  byDirection: HvacCommunicationStatsByDirection[];

  @Field(() => [HvacCommunicationStatsByStatus])
  byStatus: HvacCommunicationStatsByStatus[];

  @Field(() => [HvacCommunicationStatsBySentiment])
  sentimentDistribution: HvacCommunicationStatsBySentiment[];

  @Field(() => Float) // Assuming in milliseconds or seconds
  avgResponseTime: number;

  @Field(() => [HvacCommunicationType]) // Displaying a few recent ones
  recentActivity: HvacCommunicationType[];
}


// Input Types
@InputType()
export class HvacCommunicationFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => HvacCommunicationTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationTypeEnum)
  type?: HvacCommunicationTypeEnum;

  @Field(() => HvacCommunicationDirectionEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationDirectionEnum)
  direction?: HvacCommunicationDirectionEnum;

  @Field(() => HvacCommunicationStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationStatusEnum)
  status?: HvacCommunicationStatusEnum;

  @Field(() => HvacCommunicationPriorityEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationPriorityEnum)
  priority?: HvacCommunicationPriorityEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  dateTo?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasAIInsights?: boolean;

  @Field(() => HvacAISentimentEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacAISentimentEnum)
  sentiment?: HvacAISentimentEnum;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

@InputType()
export class HvacParticipantInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString() // Add IsPhoneNumber if needed
  phone?: string;

  @Field(() => HvacParticipantRoleEnum)
  @IsEnum(HvacParticipantRoleEnum)
  @IsNotEmpty()
  role: HvacParticipantRoleEnum;
}

@InputType()
export class HvacAttachmentInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    name: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    type: string; // MIME type

    @Field(() => Int)
    @IsNumber()
    @Min(1)
    size: number; // in bytes

    @Field()
    @IsString() // Assuming URL or base64 content string
    @IsNotEmpty()
    url: string; // Or content: string for base64
}


@InputType()
export class HvacCommunicationMetadataInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  source: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  channel: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  threadId?: string;
}

@InputType()
export class CreateHvacCommunicationInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @Field(() => HvacCommunicationTypeEnum)
  @IsEnum(HvacCommunicationTypeEnum)
  @IsNotEmpty()
  type: HvacCommunicationTypeEnum;

  @Field(() => HvacCommunicationDirectionEnum)
  @IsEnum(HvacCommunicationDirectionEnum)
  @IsNotEmpty()
  direction: HvacCommunicationDirectionEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subject?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field(() => [HvacParticipantInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HvacParticipantInput)
  participants: HvacParticipantInput[];

  @Field(() => [HvacAttachmentInput], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HvacAttachmentInput)
  attachments?: HvacAttachmentInput[];

  @Field(() => HvacCommunicationMetadataInput)
  @ValidateNested()
  @Type(() => HvacCommunicationMetadataInput)
  metadata: HvacCommunicationMetadataInput;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => HvacCommunicationPriorityEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationPriorityEnum)
  priority?: HvacCommunicationPriorityEnum;
}

@InputType()
export class UpdateHvacCommunicationInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => HvacCommunicationTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationTypeEnum)
  type?: HvacCommunicationTypeEnum;

  @Field(() => HvacCommunicationDirectionEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationDirectionEnum)
  direction?: HvacCommunicationDirectionEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subject?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => [HvacParticipantInput], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HvacParticipantInput)
  participants?: HvacParticipantInput[];

  @Field(() => [HvacAttachmentInput], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HvacAttachmentInput)
  attachments?: HvacAttachmentInput[];

  @Field(() => HvacCommunicationMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => HvacCommunicationMetadataInput)
  metadata?: HvacCommunicationMetadataInput;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => HvacCommunicationPriorityEnum, { nullable: true })
  @IsOptional()
  @IsEnum(HvacCommunicationPriorityEnum)
  priority?: HvacCommunicationPriorityEnum;

  @Field(() => HvacCommunicationStatusEnum, { nullable: true }) // Allow status update here too
  @IsOptional()
  @IsEnum(HvacCommunicationStatusEnum)
  status?: HvacCommunicationStatusEnum;
}
