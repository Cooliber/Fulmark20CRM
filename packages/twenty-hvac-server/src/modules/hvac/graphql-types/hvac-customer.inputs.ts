import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MinLength, ValidateNested } from 'class-validator';

@InputType()
export class HvacCustomerAddressInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  street?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;
}

@InputType()
export class CreateHvacCustomerInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Customer name cannot be empty.' })
  @MinLength(2, { message: 'Customer name must be at least 2 characters long.' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format.' })
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  // Basic phone validation, consider a more specific library for international numbers if needed
  @IsPhoneNumber('PL', { message: 'Invalid phone number format.' })
  phone?: string;

  @Field(() => HvacCustomerAddressInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => HvacCustomerAddressInput)
  address?: HvacCustomerAddressInput;

  // Add other fields relevant for creation, e.g., properties if they can be created along with the customer
}

@InputType()
export class UpdateHvacCustomerInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Customer name must be at least 2 characters long.' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format.' })
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber('PL', { message: 'Invalid phone number format.' })
  phone?: string;

  @Field(() => HvacCustomerAddressInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => HvacCustomerAddressInput)
  address?: HvacCustomerAddressInput;
}
