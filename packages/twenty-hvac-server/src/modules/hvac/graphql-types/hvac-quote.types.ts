import { Field, ObjectType, InputType, ID, Float } from '@nestjs/graphql';
import { HvacCustomerType } from './hvac-customer.types'; // Assuming customer relation
import { HvacEquipmentType } from './hvac-equipment.types'; // Assuming equipment relation for line items

@ObjectType('HvacQuoteLineItem')
export class HvacQuoteLineItem {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  description: string;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;

  @Field({ nullable: true })
  productCode?: string;

  @Field(() => HvacEquipmentType, { nullable: true })
  relatedEquipment?: HvacEquipmentType; // Optional: if a line item can be linked to an equipment
}

@InputType('HvacQuoteLineItemInput')
export class HvacQuoteLineItemInput {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  description: string;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;

  @Field({ nullable: true })
  productCode?: string;

  @Field({ nullable: true })
  relatedEquipmentId?: string; // Use ID instead of full object for input
}

@ObjectType('HvacQuote')
export class HvacQuote {
  @Field(() => ID)
  id: string;

  @Field()
  quoteNumber: string;

  @Field(() => HvacCustomerType)
  customer: HvacCustomerType; // Assuming a quote is always linked to a customer

  @Field()
  customerId: string;

  @Field()
  validUntil: Date;

  @Field(() => Float)
  subTotal: number;

  @Field(() => Float)
  taxAmount: number;

  @Field(() => Float)
  totalAmount: number;

  @Field()
  status: string; // e.g., 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'

  @Field(() => [HvacQuoteLineItem])
  lineItems: HvacQuoteLineItem[];

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateHvacQuoteInput {
  @Field()
  customerId: string;

  @Field()
  validUntil: Date;

  @Field(() => [HvacQuoteLineItemInput])
  lineItems: HvacQuoteLineItemInput[];

  @Field({ nullable: true })
  notes?: string;

  @Field({ defaultValue: 'DRAFT' })
  status?: string;
}

@InputType()
export class UpdateHvacQuoteInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  validUntil?: Date;

  @Field(() => [HvacQuoteLineItemInput], { nullable: true })
  lineItems?: HvacQuoteLineItemInput[];

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  status?: string;
}

// Response type for listing quotes, including pagination
@ObjectType('HvacQuoteListResponse')
export class HvacQuoteListResponse {
  @Field(() => [HvacQuote])
  quotes: HvacQuote[];

  @Field(() => Number)
  total: number;

  @Field(() => Number, {nullable: true})
  page?: number;

  @Field(() => Number, {nullable: true})
  limit?: number;
}

// Filter input for quotes
@InputType('HvacQuoteFilterInput')
export class HvacQuoteFilterInput {
    @Field(() => ID, { nullable: true })
    customerId?: string;

    @Field({ nullable: true })
    status?: string; // Filter by quote status

    @Field({ nullable: true })
    dateFrom?: Date; // Filter by creation/update date range

    @Field({ nullable: true })
    dateTo?: Date;
}
